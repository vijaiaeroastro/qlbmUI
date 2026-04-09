from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any


@dataclass
class RunRecord:
    run_id: str
    root_dir: Path
    work_dir: Path
    script_path: Path
    stdout_path: Path
    stderr_path: Path
    status_path: Path
    created_at: float
    process: subprocess.Popen[str] | None = None


class RunManager:
    def __init__(self, runs_root: Path):
        self.runs_root = runs_root
        self.runs_root.mkdir(parents=True, exist_ok=True)
        self._runs: dict[str, RunRecord] = {}
        self._lock = threading.Lock()

    def create_run(
        self,
        script: str,
        case_data: dict[str, Any] | None = None,
        filename: str = "run.py",
        python_executable: str | None = None,
    ) -> dict[str, Any]:
        run_id = uuid.uuid4().hex[:12]
        root_dir = self.runs_root / run_id
        work_dir = root_dir / "workspace"
        output_dir = root_dir / "output"
        root_dir.mkdir(parents=True, exist_ok=True)
        work_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        script_path = work_dir / filename
        stdout_path = root_dir / "stdout.log"
        stderr_path = root_dir / "stderr.log"
        status_path = root_dir / "status.json"

        script_path.write_text(script, encoding="utf-8")

        if case_data is not None:
            (root_dir / "case.json").write_text(
                json.dumps(case_data, indent=2),
                encoding="utf-8",
            )

        record = RunRecord(
            run_id=run_id,
            root_dir=root_dir,
            work_dir=work_dir,
            script_path=script_path,
            stdout_path=stdout_path,
            stderr_path=stderr_path,
            status_path=status_path,
            created_at=time.time(),
        )

        with self._lock:
            self._runs[run_id] = record

        self._write_status(
            record,
            {
                "run_id": run_id,
                "status": "queued",
                "created_at": record.created_at,
                "pid": None,
                "returncode": None,
                "root_dir": str(root_dir),
                "work_dir": str(work_dir),
                "output_dir": str(output_dir),
                "script_path": str(script_path),
            },
        )

        worker = threading.Thread(
            target=self._execute_run,
            args=(record, python_executable or sys.executable),
            daemon=True,
        )
        worker.start()

        return self.get_run(run_id)

    def get_run(self, run_id: str) -> dict[str, Any]:
        record = self._get_record(run_id)
        data = self._read_status(record)
        data["stdout_tail"] = self._tail(record.stdout_path)
        data["stderr_tail"] = self._tail(record.stderr_path)
        return data

    def list_artifacts(self, run_id: str) -> dict[str, Any]:
        record = self._get_record(run_id)
        files: list[dict[str, Any]] = []
        for path in sorted(record.root_dir.rglob("*")):
            if not path.is_file():
                continue
            rel = path.relative_to(record.root_dir)
            files.append(
                {
                    "path": rel.as_posix(),
                    "size": path.stat().st_size,
                }
            )
        return {"run_id": run_id, "artifacts": files}

    def resolve_artifact(self, run_id: str, relative_path: str) -> Path:
        record = self._get_record(run_id)
        normalized = Path(relative_path)
        if normalized.is_absolute():
            raise ValueError("Path must be relative.")

        target = (record.root_dir / normalized).resolve()
        if os.path.commonpath([str(record.root_dir.resolve()), str(target)]) != str(
            record.root_dir.resolve()
        ):
            raise ValueError("Path escapes run directory.")

        if not target.exists() or not target.is_file():
            raise FileNotFoundError(relative_path)

        return target

    def _execute_run(self, record: RunRecord, python_executable: str) -> None:
        env = os.environ.copy()
        env["QLBM_RUN_DIR"] = str(record.root_dir)
        env["QLBM_OUTPUT_DIR"] = str(record.root_dir / "output")

        with record.stdout_path.open("w", encoding="utf-8") as stdout_fp, record.stderr_path.open(
            "w", encoding="utf-8"
        ) as stderr_fp:
            process = subprocess.Popen(
                [python_executable, str(record.script_path)],
                cwd=record.work_dir,
                stdout=stdout_fp,
                stderr=stderr_fp,
                text=True,
                env=env,
            )
            record.process = process

            self._write_status(
                record,
                {
                    **self._read_status(record),
                    "status": "running",
                    "pid": process.pid,
                    "started_at": time.time(),
                },
            )

            returncode = process.wait()

        final_status = "completed" if returncode == 0 else "failed"
        self._write_status(
            record,
            {
                **self._read_status(record),
                "status": final_status,
                "returncode": returncode,
                "finished_at": time.time(),
            },
        )

    def _get_record(self, run_id: str) -> RunRecord:
        with self._lock:
            if run_id not in self._runs:
                raise KeyError(run_id)
            return self._runs[run_id]

    def _read_status(self, record: RunRecord) -> dict[str, Any]:
        return json.loads(record.status_path.read_text(encoding="utf-8"))

    def _write_status(self, record: RunRecord, payload: dict[str, Any]) -> None:
        record.status_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _tail(self, path: Path, max_chars: int = 4000) -> str:
        if not path.exists():
            return ""
        data = path.read_text(encoding="utf-8", errors="replace")
        return data[-max_chars:]
