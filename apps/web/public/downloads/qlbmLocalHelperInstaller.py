#!/usr/bin/env python3
"""Cross-platform installer for the qlbm local helper.

Downloads the qlbmUI repository archive, installs apps/local-helper into a
virtual environment, and writes a small launcher in the chosen install folder.
"""

from __future__ import annotations

import argparse
import os
import re
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
PATH_BLOCK_BEGIN = "# >>> qlbm-local-helper >>>"
PATH_BLOCK_END = "# <<< qlbm-local-helper <<<"


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


def launcher_path(install_dir: Path) -> Path:
    if sys.platform.startswith("win"):
        return install_dir / "start-qlbm-local-helper.bat"
    return install_dir / "start-qlbm-local-helper.sh"


def launcher_name() -> str:
    if sys.platform.startswith("win"):
        return "start-qlbm-local-helper.bat"
    return "start-qlbm-local-helper.sh"


def command_name() -> str:
    if sys.platform.startswith("win"):
        return "qlbm-local-helper.cmd"
    return "qlbm-local-helper"


def command_path(install_dir: Path) -> Path:
    return install_dir / command_name()


def installation_exists(install_dir: Path) -> bool:
    return (install_dir / ".venv").exists() or launcher_path(install_dir).exists()


def choose_existing_install_action(args: argparse.Namespace, install_dir: Path) -> str:
    if args.action:
        return args.action

    if not installation_exists(install_dir):
        return "install"

    if args.yes or not sys.stdin.isatty():
        return "upgrade"

    print()
    print(f"An existing qlbm local helper installation was found in:")
    print(f"  {install_dir}")
    print()
    print("Choose what to do:")
    print("  1) Upgrade existing installation")
    print("  2) Reinstall from scratch")
    print("  3) Remove installation")
    print("  4) Cancel")

    while True:
        response = input("Selection [1/2/3/4]: ").strip() or "1"
        if response == "1":
            return "upgrade"
        if response == "2":
            return "reinstall"
        if response == "3":
            return "remove"
        if response == "4":
            return "cancel"
        print("Please enter 1, 2, 3, or 4.")


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
    launcher = launcher_path(install_dir)
    if sys.platform.startswith("win"):
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


def write_command_launcher(install_dir: Path, python_path: Path) -> Path:
    command = command_path(install_dir)
    if sys.platform.startswith("win"):
        command.write_text(
            textwrap.dedent(
                f"""\
                @echo off
                "{python_path}" -m qlbm_ui_local_helper.server %*
                """
            ),
            encoding="utf-8",
        )
        return command

    command.write_text(
        textwrap.dedent(
            f"""\
            #!/usr/bin/env bash
            "{python_path}" -m qlbm_ui_local_helper.server "$@"
            """
        ),
        encoding="utf-8",
    )
    command.chmod(0o755)
    return command


def remove_companion_launcher(script_dir: Path) -> None:
    companion = script_dir / launcher_name()
    if companion.exists():
        companion.unlink()


def shell_rc_files() -> list[Path]:
    files = [Path.home() / ".bashrc", Path.home() / ".zshrc"]
    if sys.platform == "darwin":
        files.append(Path.home() / ".zprofile")
    return files


def path_block(install_dir: Path) -> str:
    escaped_path = str(install_dir).replace('"', '\\"')
    return "\n".join(
        [
            PATH_BLOCK_BEGIN,
            f'export PATH="{escaped_path}:$PATH"',
            PATH_BLOCK_END,
        ]
    )


def replace_managed_block(text: str, block: str | None) -> str:
    pattern = re.compile(
        rf"\n?{re.escape(PATH_BLOCK_BEGIN)}\n.*?\n{re.escape(PATH_BLOCK_END)}\n?",
        re.DOTALL,
    )
    cleaned = re.sub(pattern, "\n", text).rstrip()
    if block is None:
        return f"{cleaned}\n" if cleaned else ""
    if cleaned:
        return f"{cleaned}\n\n{block}\n"
    return f"{block}\n"


def configure_unix_path(install_dir: Path) -> None:
    block = path_block(install_dir)
    for rc_file in shell_rc_files():
        existing = rc_file.read_text(encoding="utf-8") if rc_file.exists() else ""
        rc_file.write_text(replace_managed_block(existing, block), encoding="utf-8")


def remove_unix_path() -> None:
    for rc_file in shell_rc_files():
        if not rc_file.exists():
            continue
        existing = rc_file.read_text(encoding="utf-8")
        updated = replace_managed_block(existing, None)
        if updated:
            rc_file.write_text(updated, encoding="utf-8")
        else:
            rc_file.unlink()


def broadcast_windows_environment_change() -> None:
    try:
        import ctypes

        HWND_BROADCAST = 0xFFFF
        WM_SETTINGCHANGE = 0x001A
        SMTO_ABORTIFHUNG = 0x0002
        ctypes.windll.user32.SendMessageTimeoutW(
            HWND_BROADCAST,
            WM_SETTINGCHANGE,
            0,
            "Environment",
            SMTO_ABORTIFHUNG,
            5000,
            None,
        )
    except Exception:
        pass


def get_windows_user_path_entries() -> list[str]:
    import winreg

    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            value, _ = winreg.QueryValueEx(key, "Path")
    except FileNotFoundError:
        return []
    except OSError:
        return []

    return [entry for entry in str(value).split(";") if entry]


def set_windows_user_path_entries(entries: list[str]) -> None:
    import winreg

    with winreg.CreateKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
        winreg.SetValueEx(key, "Path", 0, winreg.REG_EXPAND_SZ, ";".join(entries))
    broadcast_windows_environment_change()


def configure_windows_path(install_dir: Path) -> None:
    install_value = str(install_dir)
    entries = get_windows_user_path_entries()
    if install_value.lower() not in {entry.lower() for entry in entries}:
        entries.append(install_value)
        set_windows_user_path_entries(entries)


def remove_windows_path(install_dir: Path) -> None:
    install_value = str(install_dir).lower()
    entries = [entry for entry in get_windows_user_path_entries() if entry.lower() != install_value]
    set_windows_user_path_entries(entries)


def configure_command_path(install_dir: Path) -> None:
    if sys.platform.startswith("win"):
        configure_windows_path(install_dir)
    else:
        configure_unix_path(install_dir)


def remove_command_path(install_dir: Path) -> None:
    if sys.platform.startswith("win"):
        remove_windows_path(install_dir)
    else:
        remove_unix_path()


def remove_installation(install_dir: Path) -> None:
    if not install_dir.exists():
        print(f"No helper installation found in {install_dir}")
        return

    shutil.rmtree(install_dir)
    print()
    print("qlbm local helper removed successfully.")
    print(f"Removed: {install_dir}")


def install_helper(install_dir: Path, *, force_reinstall: bool) -> tuple[Path, Path]:
    install_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="qlbm-ui-helper-") as temp_name:
        temp_dir = Path(temp_name)
        archive_path = download_repo_archive(temp_dir)
        helper_dir = extract_helper_dir(archive_path, temp_dir)

        venv_dir = create_virtualenv(install_dir)
        python_path = venv_python(venv_dir)

        run([str(python_path), "-m", "pip", "install", "--upgrade", "pip"])
        pip_install_cmd = [str(python_path), "-m", "pip", "install", "--upgrade"]
        if force_reinstall:
            pip_install_cmd.append("--force-reinstall")
        pip_install_cmd.append(str(helper_dir))
        run(pip_install_cmd)

        launcher = write_launcher(install_dir, python_path)
        command = write_command_launcher(install_dir, python_path)
        return launcher, command


def main() -> int:
    parser = argparse.ArgumentParser(description="Install the qlbm local helper.")
    parser.add_argument("--install-dir", help="Target directory for the helper installation.")
    parser.add_argument(
        "--action",
        choices=["install", "upgrade", "reinstall", "remove"],
        help="Lifecycle action to perform. If omitted, the installer chooses based on whether an installation already exists.",
    )
    parser.add_argument("--yes", action="store_true", help="Accept defaults without prompting.")
    args = parser.parse_args()

    if sys.version_info < (3, 11):
        print("Python 3.11 or newer is required.", file=sys.stderr)
        return 1

    install_dir = choose_install_dir(args)
    script_dir = Path(__file__).resolve().parent
    action = choose_existing_install_action(args, install_dir)

    if action == "cancel":
        print("Cancelled.")
        return 0

    if action == "remove":
        remove_command_path(install_dir)
        remove_installation(install_dir)
        remove_companion_launcher(script_dir)
        return 0

    if action == "install" and installation_exists(install_dir):
        print()
        print(f"An installation already exists in {install_dir}.")
        print("Use --action upgrade, --action reinstall, or rerun interactively.")
        return 1

    if action == "reinstall" and install_dir.exists():
        shutil.rmtree(install_dir)

    launcher, command = install_helper(install_dir, force_reinstall=action in {"upgrade", "reinstall"})
    configure_command_path(install_dir)
    remove_companion_launcher(script_dir)

    print()
    if action == "upgrade":
        print("qlbm local helper upgraded successfully.")
    elif action == "reinstall":
        print("qlbm local helper reinstalled successfully.")
    else:
        print("qlbm local helper installed successfully.")
    print(f"Install directory: {install_dir}")
    print(f"Launcher: {launcher}")
    print(f"Command: {command}")
    print()
    print("Start the helper with:")
    print("  qlbm-local-helper")
    print()
    print("The helper listens on http://127.0.0.1:8712 by default.")
    if sys.platform.startswith("win"):
        print("You may need to open a new terminal for the PATH update to appear.")
    else:
        print("You may need to open a new terminal or run: source ~/.bashrc or source ~/.zshrc")
    print("Rerun this installer later to upgrade, reinstall, or remove the helper.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
