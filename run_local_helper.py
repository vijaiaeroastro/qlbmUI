from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent / "src"))

from qlbm_ui_local_helper.server import main


if __name__ == "__main__":
    main()
