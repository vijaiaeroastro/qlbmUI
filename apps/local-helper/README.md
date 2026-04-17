# qlbmUI Local Helper

Minimal localhost orchestrator for a browser-based qlbm UI.

## What it does

- Exposes a small HTTP API on `127.0.0.1`
- Accepts generated `run.py` scripts
- Creates a per-run working directory
- Executes the script as a subprocess
- Tracks status, logs, and output artifacts

## Run

After installing the package:

```bash
qlbm-local-helper
```

For local development from the repository checkout:

```bash
python run_local_helper.py
```

Or directly through the module:

```bash
python -m qlbm_ui_local_helper.server
```

## API

- `GET /health`
- `GET /runs`
- `POST /runs`
- `POST /runs/delete`
- `GET /runs/<run_id>`
- `DELETE /runs/<run_id>`
- `DELETE /runs`
- `GET /runs/<run_id>/artifacts`
- `GET /runs/<run_id>/file?path=<relative-path>`

## `POST /runs` payload

```json
{
  "script": "print('hello')",
  "case": {},
  "filename": "run.py",
  "python_executable": "/path/to/python"
}
```

`case` is optional and is stored as `case.json` for traceability.

## Notes

- The helper is intentionally dependency-light and currently uses only the Python standard library.
- Output files are expected under the run directory, typically inside `output/`.
- The helper sets these environment variables for the executed script:
  - `QLBM_RUN_DIR`
  - `QLBM_OUTPUT_DIR`
- On startup, the helper prints a connection code.
  The intended frontend flow is to paste that code into the UI rather than typing the raw server address.

## Local qlbm testing

The helper examples directory contains a small `qlbm` smoke scenario.
That scenario assumes the selected Python interpreter already has `qlbm` and its transitive
runtime dependencies installed.
