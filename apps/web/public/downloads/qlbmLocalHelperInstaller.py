#!/usr/bin/env python3
"""Cross-platform installer for the qlbm local helper.

Downloads the qlbmUI repository archive, installs apps/local-helper into a
virtual environment, and writes a small launcher in the chosen install folder.
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import textwrap
import urllib.request
import zipfile
from pathlib import Path


REPO_ARCHIVE_URL = "https://github.com/vijaiaeroastro/qlbmUI/archive/refs/heads/main.zip"
INSTALL_DIR_NAME = "qlbm-ui-local-helper"


def default_install_dir() -> Path:
    if sys.platform.startswith("win"):
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
        return base / INSTALL_DIR_NAME
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / INSTALL_DIR_NAME
    return Path.home() / ".local" / "share" / INSTALL_DIR_NAME


def choose_install_dir(args: argparse.Namespace) -> Path:
    if args.install_dir:
        return Path(args.install_dir).expanduser().resolve()

    target = default_install_dir()
    if args.yes or not sys.stdin.isatty():
        return target

    print(f"Default install directory: {target}")
    response = input("Install there? [Y/n/custom path]: ").strip()
    if not response or response.lower() in {"y", "yes"}:
        return target
    if response.lower() in {"n", "no"}:
        custom = input("Enter install directory: ").strip()
        if not custom:
            return target
        return Path(custom).expanduser().resolve()
    return Path(response).expanduser().resolve()


def run(cmd: list[str], *, cwd: Path | None = None) -> None:
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=str(cwd) if cwd else None, check=True)


def download_repo_archive(temp_dir: Path) -> Path:
    archive_path = temp_dir / "qlbmUI-main.zip"
    print(f"Downloading repository archive from {REPO_ARCHIVE_URL}")
    urllib.request.urlretrieve(REPO_ARCHIVE_URL, archive_path)
    return archive_path


def extract_helper_dir(archive_path: Path, temp_dir: Path) -> Path:
    extract_root = temp_dir / "repo"
    with zipfile.ZipFile(archive_path) as zip_file:
        zip_file.extractall(extract_root)

    candidates = list(extract_root.glob("*/apps/local-helper"))
    if not candidates:
        raise RuntimeError("Could not locate apps/local-helper inside the downloaded archive.")
    return candidates[0]


def create_virtualenv(install_dir: Path) -> Path:
    venv_dir = install_dir / ".venv"
    if not venv_dir.exists():
        run([sys.executable, "-m", "venv", str(venv_dir)])
    return venv_dir


def venv_python(venv_dir: Path) -> Path:
    if sys.platform.startswith("win"):
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


def write_launcher(install_dir: Path, python_path: Path) -> Path:
    if sys.platform.startswith("win"):
        launcher = install_dir / "start-qlbm-local-helper.bat"
        launcher.write_text(
            textwrap.dedent(
                f"""\
                @echo off
                "{python_path}" -m qlbm_ui_local_helper.server %*
                """
            ),
            encoding="utf-8",
        )
        return launcher

    launcher = install_dir / "start-qlbm-local-helper.sh"
    launcher.write_text(
        textwrap.dedent(
            f"""\
            #!/usr/bin/env bash
            "{python_path}" -m qlbm_ui_local_helper.server "$@"
            """
        ),
        encoding="utf-8",
    )
    launcher.chmod(0o755)
    return launcher


def main() -> int:
    parser = argparse.ArgumentParser(description="Install the qlbm local helper.")
    parser.add_argument("--install-dir", help="Target directory for the helper installation.")
    parser.add_argument("--yes", action="store_true", help="Accept defaults without prompting.")
    args = parser.parse_args()

    if sys.version_info < (3, 11):
        print("Python 3.11 or newer is required.", file=sys.stderr)
        return 1

    install_dir = choose_install_dir(args)
    install_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="qlbm-ui-helper-") as temp_name:
        temp_dir = Path(temp_name)
        archive_path = download_repo_archive(temp_dir)
        helper_dir = extract_helper_dir(archive_path, temp_dir)

        venv_dir = create_virtualenv(install_dir)
        python_path = venv_python(venv_dir)

        run([str(python_path), "-m", "pip", "install", "--upgrade", "pip"])
        run([str(python_path), "-m", "pip", "install", str(helper_dir)])

        launcher = write_launcher(install_dir, python_path)

    print()
    print("qlbm local helper installed successfully.")
    print(f"Install directory: {install_dir}")
    print(f"Launcher: {launcher}")
    print()
    print("Start the helper with:")
    print(f"  {launcher}")
    print()
    print("The helper listens on http://127.0.0.1:8712 by default.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
