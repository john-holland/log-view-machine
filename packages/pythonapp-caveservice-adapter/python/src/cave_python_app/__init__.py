"""
Minimal contract for Cave Python app shells.

When the Node pythonapp-caveservice-adapter runs your script (e.g. `python my_script.py`),
your script can use this package to:
- Run a main function with sys.argv (and optional env expectations).
- Rely on a consistent entrypoint so Cave can discover and run Python apps by name.

Example:

    from cave_python_app import run_app

    def main(argv):
        # argv is sys.argv[1:] or custom args from the adapter
        print("Hello from Cave app", argv)
        return 0

    if __name__ == "__main__":
        raise SystemExit(run_app(main))
"""

from .runner import run_app, get_env

__all__ = ["run_app", "get_env"]
__version__ = "0.1.0"
