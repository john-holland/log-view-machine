/**
 * Integration tests: real pip install and Python script execution (no mocks).
 * Requires Python and pip on PATH. Run in order: install dependencies, then run the script.
 * Skipped when Python/pip are not available.
 */

import path from 'path';
import { spawnSync } from 'child_process';
import { createPythonAppCaveServiceAdapter } from '../src/index';

const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'with_dep');
const SCRIPT_PATH = path.join(FIXTURES_DIR, 'script.py');
const REQUIREMENTS_PATH = 'requirements.txt';

function createRegistry() {
  const map = new Map<string, { name: string; scriptPath: string; [k: string]: unknown }>();
  return {
    register(name: string, descriptor: { name: string; scriptPath: string; [k: string]: unknown }) {
      map.set(name, { ...descriptor, name });
    },
    get(name: string) {
      return map.get(name);
    },
  };
}

function hasPythonAndPip(): boolean {
  const py = process.platform === 'win32' ? 'python' : 'python3';
  const r2 = spawnSync(py, ['--version'], { stdio: 'ignore' });
  if (r2.error || r2.status !== 0) return false;
  // Prefer python -m pip (works on Windows when pip isn't on PATH)
  const r = spawnSync(py, ['-m', 'pip', '--version'], { stdio: 'ignore' });
  return !r.error && r.status === 0;
}

const skipIntegration = !hasPythonAndPip();

describe('integration: install then run', () => {
  (skipIntegration ? it.skip : it)(
    'installs Python dependencies then runs the script (in order)',
    async () => {
    const registry = createRegistry();
    const context = {
      cave: {},
      tomeConfigs: [],
      variables: {},
      sections: {},
      appShellRegistryRef: { current: registry },
    } as any;

    const adapter = createPythonAppCaveServiceAdapter({
      apps: {
        installAndRun: {
          scriptPath: SCRIPT_PATH,
          cwd: FIXTURES_DIR,
          requirementsPath: REQUIREMENTS_PATH,
          pipInstall: 'once',
        },
      },
    });

    // 1. Apply: register the app in the registry (pipInstall 'always' would run here; 'once' runs on first runAppShell)
    await adapter.apply(context);
    expect(adapter.getAppShell('installAndRun')).toBeDefined();

    // 2. Run: runAppShell runs pip install (once) then spawns the script
    const child = await adapter.runAppShell('installAndRun');

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.on('close', (code, signal) => resolve(code ?? null));
      child.on('error', reject);
    });

    expect(exitCode).toBe(0);
    },
    60000
  );
});
