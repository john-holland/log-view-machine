# pythonapp-caveservice-adapter

Cave service adapter that registers named Python app shells in the Cave **appShell** registry and provides easy shelling to a specific Python app by name, with optional dependency management via pip.

## Usage

Use with **createCaveServer** and ensure **appShellRegistryRef** is provided by the core (it is set by default):

```ts
import { createCaveServer } from 'log-view-machine';
import { createPythonAppCaveServiceAdapter } from 'pythonapp-caveservice-adapter';
import { expressCaveAdapter } from 'express-cave-adapter';
import path from 'path';

const pythonAdapter = createPythonAppCaveServiceAdapter({
  apps: {
    myTool: {
      scriptPath: path.join(__dirname, 'scripts/my_tool.py'),
      cwd: path.join(__dirname, 'scripts'),
      requirementsPath: 'requirements.txt',
      pipInstall: 'once',
    },
  },
});

await createCaveServer({
  cave,
  tomeConfigs,
  sections: { registry: true, appShell: true },
  plugins: [expressCaveAdapter({ ... }), pythonAdapter],
});

// Run the Python app by name
const child = await pythonAdapter.runAppShell('myTool', ['--arg', 'value']);
// Or get the descriptor only
const descriptor = pythonAdapter.getAppShell('myTool');
```

## Options

- **apps**: `Record<string, PythonAppDescriptor>` — map of app name to descriptor.
- **PythonAppDescriptor**: `scriptPath`, `cwd?`, `env?`, `pythonPath?`, `requirementsPath?`, `dependencies?`, `pipInstall?` (`true` | `'once'` | `'always'`), `venvPath?`.

See [Cave services and appShell registry](../../docs/CAVE_SERVICES_APPSHELL.md) for the full contract and **CaveServiceAdapter** convention.

## Python library (cave-python-app)

A companion **pip-installable** Python package in `python/` defines a minimal contract for Cave Python app shells (entrypoint helper, optional env). Install with `pip install -e python` from this package directory. See [python/README.md](python/README.md).

## Tests

- **Unit tests** (`npm test`): Mock `child_process.spawn`; cover `apply`, `getAppShell`, `runAppShell`, and descriptor registration.
- **Integration test**: Installs a Python dependency (`pip install -r requirements.txt`) then runs a script that uses it, in order. Skipped when `python` and `pip` (or `pip3`) are not on PATH. To run it, ensure Python and pip are available, then run `npm test`.
