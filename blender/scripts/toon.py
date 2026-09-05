#!/usr/bin/env python3
"""Entry point. See `toonkit/cli.py` for usage."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from toonkit.cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
