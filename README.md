# qlbmUI Local Helper

Minimal localhost orchestrator for a browser-based qlbm UI.

Important: the browser UI currently present in this repo is only a dummy test harness for
the local helper API. It is not the intended product UI.

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
- `POST /runs`
- `GET /runs/<run_id>`
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

## Local qlbm testing

The dummy browser harness at `demo_ui/index.html` can submit a small `qlbm` scenario to the helper.
That scenario assumes the selected Python interpreter already has `qlbm` and its transitive
runtime dependencies installed.

## Dummy UI

The browser page in this repo is only for testing helper connectivity, run submission,
polling, logs, and artifact listing. It is intentionally separate from the actual helper
package and should not be treated as the real frontend.

You can serve the dummy browser harness locally with:

```bash
python run_dummy_ui.py
```
