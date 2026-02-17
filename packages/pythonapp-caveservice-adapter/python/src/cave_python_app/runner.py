"""
Run a Cave Python app main function with sys.argv.

The Node adapter spawns: python scriptPath [args...]
So script receives sys.argv[1:] as CLI args. run_app(main) calls main(sys.argv[1:]) and returns the exit code.
"""

import os
import sys
from typing import Callable


def run_app(main: Callable[[list[str]], int]) -> int:
    """
    Call main(argv) where argv is sys.argv[1:]. Return the result as process exit code.
    Use from __main__: raise SystemExit(run_app(main)).
    """
    argv = sys.argv[1:] if len(sys.argv) > 1 else []
    try:
        return main(argv)
    except KeyboardInterrupt:
        return 130
    except Exception as e:
        print(e, file=sys.stderr)
        return 1


def get_env(name: str, default: str = "") -> str:
    """Read env var; useful for CAVE_APP_NAME or tenant when set by the runner."""
    return os.environ.get(name, default).strip()
