# cave-python-app (Python package)

Minimal **pip-installable** contract for Cave Python app shells. Use this so Python apps run by the Node **pythonapp-caveservice-adapter** (log-view-machine) follow a consistent entrypoint.

## Install

From this directory (or after copying the package):

```bash
pip install -e .
```

Or from the monorepo root:

```bash
pip install -e packages/pythonapp-caveservice-adapter/python
```

## Usage

In your Python script (the one you register in `PYTHON_APPS_JSON` or `PYTHON_APPS_CONFIG`):

```python
from cave_python_app import run_app

def main(argv):
    # argv = sys.argv[1:] (args passed by the Node adapter)
    print("Running with args:", argv)
    return 0

if __name__ == "__main__":
    raise SystemExit(run_app(main))
```

Optional env (if set by your runner): `cave_python_app.get_env("CAVE_APP_NAME")`, `get_env("CAVE_TENANT")`, etc.

## Related

- **pythonapp-caveservice-adapter** (npm): Node adapter that registers and runs these Python apps via the Cave appShell registry.
- [CAVE_SERVICES_APPSHELL.md](../../../docs/CAVE_SERVICES_APPSHELL.md): Cave 2.x app shell and adapter docs.
