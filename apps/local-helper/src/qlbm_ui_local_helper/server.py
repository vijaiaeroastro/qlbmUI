from __future__ import annotations

import argparse
import json
import mimetypes
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import __version__
from .run_manager import RunManager, connection_code


def _json_bytes(payload: dict) -> bytes:
    return json.dumps(payload, indent=2).encode("utf-8")


class LocalHelperHandler(BaseHTTPRequestHandler):
    manager: RunManager

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/health":
            self._send_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "service": "qlbm-local-helper",
                    "version": __version__,
                    "runs_dir": str(self.manager.runs_root),
                },
            )
            return

        if path == "/runs":
            self._send_json(HTTPStatus.OK, self.manager.list_runs())
            return

        if path.startswith("/runs/") and path.endswith("/artifacts"):
            run_id = path.strip("/").split("/")[1]
            try:
                payload = self.manager.list_artifacts(run_id)
            except KeyError:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Run not found"})
                return
            self._send_json(HTTPStatus.OK, payload)
            return

        if path.startswith("/runs/") and path.endswith("/file"):
            run_id = path.strip("/").split("/")[1]
            query = parse_qs(parsed.query)
            relative_path = query.get("path", [None])[0]
            if not relative_path:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Missing path query parameter"})
                return
            try:
                target = self.manager.resolve_artifact(run_id, relative_path)
            except KeyError:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Run not found"})
                return
            except FileNotFoundError:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Artifact not found"})
                return
            except ValueError as exc:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(exc)})
                return

            content_type, _ = mimetypes.guess_type(target.name)
            data = target.read_bytes()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", content_type or "application/octet-stream")
            self.send_header("Content-Length", str(len(data)))
            self._set_cors_headers()
            self.end_headers()
            self.wfile.write(data)
            return

        if path.startswith("/runs/"):
            run_id = path.strip("/").split("/")[1]
            try:
                payload = self.manager.get_run(run_id)
            except KeyError:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Run not found"})
                return
            self._send_json(HTTPStatus.OK, payload)
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint"})

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path == "/runs/delete":
            content_length = int(self.headers.get("Content-Length", "0"))
            raw_body = self.rfile.read(content_length) if content_length else b"{}"

            try:
                payload = json.loads(raw_body.decode("utf-8"))
            except json.JSONDecodeError:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
                return

            run_ids = payload.get("run_ids")
            if not isinstance(run_ids, list) or not all(isinstance(item, str) for item in run_ids):
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Expected 'run_ids' as a list of strings"})
                return

            result = self.manager.delete_runs(run_ids)
            self._send_json(HTTPStatus.OK, result)
            return

        if parsed.path != "/runs":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint"})
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length) if content_length else b"{}"

        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})
            return

        script = payload.get("script")
        if not isinstance(script, str) or not script.strip():
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Missing non-empty 'script'"})
            return

        case_data = payload.get("case")
        filename = payload.get("filename", "run.py")
        python_executable = payload.get("python_executable")

        run = self.manager.create_run(
            script=script,
            case_data=case_data if isinstance(case_data, dict) else None,
            filename=filename,
            python_executable=python_executable if isinstance(python_executable, str) else None,
        )
        self._send_json(HTTPStatus.CREATED, run)

    def do_DELETE(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/runs":
            self._send_json(HTTPStatus.OK, self.manager.delete_all_runs())
            return

        if path.startswith("/runs/"):
            run_id = path.strip("/").split("/")[1]
            try:
                payload = self.manager.delete_run(run_id)
            except KeyError:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Run not found"})
                return
            self._send_json(HTTPStatus.OK, payload)
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Unknown endpoint"})

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self._set_cors_headers()
        self.end_headers()

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        return

    def _send_json(self, status: HTTPStatus, payload: dict) -> None:
        data = _json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(data)

    def _set_cors_headers(self) -> None:
        origin = self.headers.get("Origin")
        self.send_header("Access-Control-Allow-Origin", origin or "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        request_headers = self.headers.get("Access-Control-Request-Headers")
        self.send_header("Access-Control-Allow-Headers", request_headers or "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Vary", "Origin, Access-Control-Request-Headers, Access-Control-Request-Private-Network")


def main() -> None:
    parser = argparse.ArgumentParser(description="Local helper for qlbm UI")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8712)
    parser.add_argument("--runs-dir", default=".qlbm-local-runs")
    args = parser.parse_args()

    runs_root = Path(args.runs_dir).resolve()
    manager = RunManager(runs_root)
    LocalHelperHandler.manager = manager

    server = ThreadingHTTPServer((args.host, args.port), LocalHelperHandler)
    address = f"http://{args.host}:{args.port}"
    code = connection_code(address)
    print(f"qlbm local helper listening on {address}")
    print(f"runs directory: {runs_root}")
    print()
    print("connection code:")
    print(code)
    server.serve_forever()


if __name__ == "__main__":
    main()
