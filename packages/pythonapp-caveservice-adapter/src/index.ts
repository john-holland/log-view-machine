/**
 * pythonapp-caveservice-adapter: register and run named Python app shells via the Cave appShell registry.
 * Implements CaveServerAdapter; in apply() registers each configured app with context.appShellRegistryRef.
 * Exposes runAppShell(name, args?) and getAppShell(name) for easy shelling to a specific Python app.
 */

import { spawn } from 'child_process';
import path from 'path';
import type {
  CaveServerAdapter,
  CaveServerContext,
  AppShellDescriptor,
  AppShellRegistry,
} from 'log-view-machine';

/** Options for a single Python app registered by this adapter. */
export interface PythonAppDescriptor {
  scriptPath: string;
  cwd?: string;
  env?: Record<string, string>;
  /** Python executable (default 'python' or 'python3' on Unix). */
  pythonPath?: string;
  /** Path to requirements.txt (relative to cwd or absolute). */
  requirementsPath?: string;
  /** Pip install these packages when pipInstall is set. */
  dependencies?: string[];
  /** When true or 'once', run pip install before first run; 'always' runs on every apply. */
  pipInstall?: boolean | 'always' | 'once';
  /** Optional path to a virtualenv; pip and python are resolved from this venv. */
  venvPath?: string;
}

export interface PythonAppCaveServiceAdapterOptions {
  /** Map of app name → descriptor. Each is registered in the appShell registry and can be run by name. */
  apps: Record<string, PythonAppDescriptor>;
}

const defaultPython = process.platform === 'win32' ? 'python' : 'python3';

function resolvePythonExecutable(descriptor: AppShellDescriptor): string {
  if (descriptor.pythonPath) return descriptor.pythonPath;
  if (descriptor.venvPath) {
    const base = descriptor.venvPath;
    return process.platform === 'win32'
      ? path.join(base, 'Scripts', 'python.exe')
      : path.join(base, 'bin', 'python');
  }
  return defaultPython;
}

function resolvePipExecutable(descriptor: AppShellDescriptor): string {
  if (descriptor.venvPath) {
    const base = descriptor.venvPath;
    return process.platform === 'win32'
      ? path.join(base, 'Scripts', 'pip.exe')
      : path.join(base, 'bin', 'pip');
  }
  return process.platform === 'win32' ? 'pip' : 'pip3';
}

export interface AppShellRunner {
  runAppShell(name: string, args?: string[]): Promise<ReturnType<typeof spawn>>;
  getAppShell(name: string): AppShellDescriptor | undefined;
}

/**
 * Create a Cave server adapter that registers the given Python apps in the appShell registry
 * and provides runAppShell(name, args?) / getAppShell(name) for shelling to them.
 */
export function createPythonAppCaveServiceAdapter(
  options: PythonAppCaveServiceAdapterOptions
): CaveServerAdapter & AppShellRunner {
  const { apps } = options;
  const installedOnce = new Set<string>();
  let registry: AppShellRegistry | null = null;

  async function ensurePipInstall(descriptor: AppShellDescriptor, name: string): Promise<void> {
    const pipInstall = descriptor.pipInstall;
    if (!pipInstall) return;
    if (pipInstall === 'once' && installedOnce.has(name)) return;
    const hasDeps = descriptor.requirementsPath || (descriptor.dependencies && descriptor.dependencies.length > 0);
    if (!hasDeps) return;

    const pip = resolvePipExecutable(descriptor);
    const cwd = descriptor.cwd || path.dirname(descriptor.scriptPath);
    const env = { ...process.env, ...descriptor.env };

    if (descriptor.requirementsPath) {
      const reqPath = path.isAbsolute(descriptor.requirementsPath)
        ? descriptor.requirementsPath
        : path.join(cwd, descriptor.requirementsPath);
      await new Promise<void>((resolve, reject) => {
        const child = spawn(pip, ['install', '-r', reqPath], { cwd, env, stdio: 'inherit' });
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pip install exited ${code}`))));
        child.on('error', reject);
      });
    } else if (descriptor.dependencies?.length) {
      await new Promise<void>((resolve, reject) => {
        const child = spawn(pip, ['install', ...descriptor.dependencies!], { cwd, env, stdio: 'inherit' });
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pip install exited ${code}`))));
        child.on('error', reject);
      });
    }
    installedOnce.add(name);
  }

  const runner: AppShellRunner = {
    getAppShell(name: string): AppShellDescriptor | undefined {
      return registry?.get(name);
    },

    async runAppShell(name: string, args: string[] = []): Promise<ReturnType<typeof spawn>> {
      const descriptor = registry?.get(name);
      if (!descriptor) throw new Error(`App shell not found: ${name}`);
      await ensurePipInstall(descriptor, name);
      const python = resolvePythonExecutable(descriptor);
      const cwd = descriptor.cwd || path.dirname(descriptor.scriptPath);
      const env = { ...process.env, ...descriptor.env };
      const child = spawn(python, [descriptor.scriptPath, ...args], { cwd, env });
      return child;
    },
  };

  const adapter: CaveServerAdapter & AppShellRunner = {
    ...runner,

    async apply(context: CaveServerContext): Promise<void> {
      const ref = context.appShellRegistryRef;
      if (!ref) return;
      registry = ref.current;
      for (const [name, desc] of Object.entries(apps)) {
        const descriptor: AppShellDescriptor = {
          name,
          scriptPath: desc.scriptPath,
          cwd: desc.cwd,
          env: desc.env,
          pythonPath: desc.pythonPath,
          requirementsPath: desc.requirementsPath,
          dependencies: desc.dependencies,
          pipInstall: desc.pipInstall,
          venvPath: desc.venvPath,
        };
        registry.register(name, descriptor);
        if (desc.pipInstall === 'always') {
          await ensurePipInstall(descriptor, name);
        }
      }
    },
  };

  return adapter;
}
