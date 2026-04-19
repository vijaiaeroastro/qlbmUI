from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import threading
import time
import uuid
from base64 import urlsafe_b64encode
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
        self._load_existing_runs()

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
                "progress": self._progress_payload(
                    stage="queued",
                    message="Run queued in local helper.",
                    percent=8,
                ),
            },
        )
        self._log(f"queued run {run_id} ({script_path.name})")

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

    def list_runs(self) -> dict[str, Any]:
        with self._lock:
            run_ids = sorted(self._runs.keys(), reverse=True)
        runs = [self.get_run(run_id) for run_id in run_ids]
        runs.sort(key=lambda run: run.get("created_at", 0), reverse=True)
        return {"runs": runs}

    def delete_run(self, run_id: str) -> dict[str, Any]:
        record = self._get_record(run_id)

        status = self._safe_read_status(record)
        if status.get("status") == "running":
            process = record.process
            if process is not None and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=3)

        shutil.rmtree(record.root_dir, ignore_errors=True)
        with self._lock:
            self._runs.pop(run_id, None)
        return {"deleted": [run_id]}

    def delete_runs(self, run_ids: list[str]) -> dict[str, Any]:
        deleted: list[str] = []
        missing: list[str] = []
        for run_id in run_ids:
            try:
                self.delete_run(run_id)
                deleted.append(run_id)
            except KeyError:
                missing.append(run_id)
        return {"deleted": deleted, "missing": missing}

    def delete_all_runs(self) -> dict[str, Any]:
        with self._lock:
            run_ids = list(self._runs.keys())
        result = self.delete_runs(run_ids)
        return result

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

        self._write_status(
            record,
            {
                **self._read_status(record),
                "status": "queued",
                "progress": self._progress_payload(
                    stage="launching",
                    message=f"Launching Python process with {Path(python_executable).name}.",
                    percent=22,
                ),
            },
        )
        self._log(f"launching run {record.run_id} with {python_executable}")

        with record.stdout_path.open("w", encoding="utf-8") as stdout_fp, record.stderr_path.open(
            "w", encoding="utf-8"
        ) as stderr_fp:
            try:
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
                        "progress": self._progress_payload(
                            stage="running",
                            message="Simulation process is running.",
                            percent=58,
                        ),
                    },
                )
                self._log(f"run {record.run_id} started (pid {process.pid})")

                returncode = process.wait()
            except Exception as exc:
                self._write_status(
                    record,
                    {
                        **self._read_status(record),
                        "status": "failed",
                        "returncode": -1,
                        "error": str(exc),
                        "finished_at": time.time(),
                        "progress": self._progress_payload(
                            stage="failed",
                            message=f"Failed to launch run: {exc}",
                            percent=100,
                        ),
                    },
                )
                self._log(f"run {record.run_id} failed before start: {exc}")
                return

        final_status = "completed" if returncode == 0 else "failed"
        final_message = (
            "Run completed successfully."
            if returncode == 0
            else f"Run exited with return code {returncode}."
        )
        self._write_status(
            record,
            {
                **self._read_status(record),
                "status": final_status,
                "returncode": returncode,
                "finished_at": time.time(),
                "progress": self._progress_payload(
                    stage=final_status,
                    message=final_message,
                    percent=100,
                ),
            },
        )
        if final_status == "completed":
            self._log(f"run {record.run_id} completed successfully")
        else:
            self._log(f"run {record.run_id} failed with return code {returncode}")

    def _get_record(self, run_id: str) -> RunRecord:
        with self._lock:
            if run_id not in self._runs:
                raise KeyError(run_id)
            return self._runs[run_id]

    def _load_existing_runs(self) -> None:
        for root_dir in sorted(self.runs_root.iterdir()):
            if not root_dir.is_dir():
                continue

            status_path = root_dir / "status.json"
            if not status_path.exists():
                continue

            work_dir = root_dir / "workspace"
            script_candidates = sorted(work_dir.glob("*.py")) if work_dir.exists() else []
            script_path = script_candidates[0] if script_candidates else work_dir / "run.py"
            stdout_path = root_dir / "stdout.log"
            stderr_path = root_dir / "stderr.log"

            status = json.loads(status_path.read_text(encoding="utf-8"))
            run_id = status.get("run_id", root_dir.name)
            record = RunRecord(
                run_id=run_id,
                root_dir=root_dir,
                work_dir=work_dir,
                script_path=script_path,
                stdout_path=stdout_path,
                stderr_path=stderr_path,
                status_path=status_path,
                created_at=float(status.get("created_at", root_dir.stat().st_mtime)),
            )

            if status.get("status") == "running":
                status["status"] = "failed"
                status["returncode"] = status.get("returncode", -1)
                status["recovered"] = True
                status["recovery_reason"] = "helper restarted while run was in progress"
                status["finished_at"] = time.time()
                status["progress"] = self._progress_payload(
                    stage="failed",
                    message="Helper restarted while the run was still in progress.",
                    percent=100,
                )
                status_path.write_text(json.dumps(status, indent=2), encoding="utf-8")

            self._runs[run_id] = record

    def _read_status(self, record: RunRecord) -> dict[str, Any]:
        return self._ensure_progress(json.loads(record.status_path.read_text(encoding="utf-8")))

    def _safe_read_status(self, record: RunRecord) -> dict[str, Any]:
        if not record.status_path.exists():
            return self._ensure_progress({"run_id": record.run_id, "status": "unknown"})
        return self._read_status(record)

    def _write_status(self, record: RunRecord, payload: dict[str, Any]) -> None:
        record.status_path.write_text(
            json.dumps(self._ensure_progress(payload), indent=2), encoding="utf-8"
        )

    def _tail(self, path: Path, max_chars: int = 4000) -> str:
        if not path.exists():
            return ""
        data = path.read_text(encoding="utf-8", errors="replace")
        return data[-max_chars:]

    def _ensure_progress(self, payload: dict[str, Any]) -> dict[str, Any]:
        if isinstance(payload.get("progress"), dict):
            return payload

        return {
            **payload,
            "progress": self._progress_payload(
                stage=str(payload.get("status", "unknown")),
                message=self._default_progress_message(str(payload.get("status", "unknown"))),
                percent=self._default_progress_percent(str(payload.get("status", "unknown"))),
            ),
        }

    def _progress_payload(self, stage: str, message: str, percent: int) -> dict[str, Any]:
        return {
            "stage": stage,
            "message": message,
            "percent": max(0, min(100, int(percent))),
        }

    def _default_progress_message(self, status: str) -> str:
        messages = {
            "queued": "Run queued in local helper.",
            "running": "Simulation process is running.",
            "completed": "Run completed successfully.",
            "failed": "Run failed.",
        }
        return messages.get(status, "Run state unknown.")

    def _default_progress_percent(self, status: str) -> int:
        percents = {
            "queued": 8,
            "running": 58,
            "completed": 100,
            "failed": 100,
        }
        return percents.get(status, 0)

    def _log(self, message: str) -> None:
        print(f"[qlbm-local-helper] {message}", flush=True)


def connection_code(address: str) -> str:
    return urlsafe_b64encode(address.encode("utf-8")).decode("ascii")
