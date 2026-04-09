from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the dummy qlbmUI browser harness")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4173)
    args = parser.parse_args()

    web_root = Path(__file__).resolve().parent / "demo_ui"
    handler = partial(SimpleHTTPRequestHandler, directory=str(web_root))
    server = ThreadingHTTPServer((args.host, args.port), handler)

    print(f"dummy UI listening on http://{args.host}:{args.port}")
    print(f"serving directory: {web_root}")
    server.serve_forever()


if __name__ == "__main__":
    main()
