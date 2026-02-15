/**
 * pythonapp-caveservice-adapter: register and run named Python app shells via the Cave appShell registry.
 * Implements CaveServerAdapter; in apply() registers each configured app with context.appShellRegistryRef.
 * Exposes runAppShell(name, args?) and getAppShell(name) for easy shelling to a specific Python app.
 */
import { spawn } from 'child_process';
import type { CaveServerAdapter, AppShellDescriptor } from 'log-view-machine';
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
export interface AppShellRunner {
    runAppShell(name: string, args?: string[]): Promise<ReturnType<typeof spawn>>;
    getAppShell(name: string): AppShellDescriptor | undefined;
}
/**
 * Create a Cave server adapter that registers the given Python apps in the appShell registry
 * and provides runAppShell(name, args?) / getAppShell(name) for shelling to them.
 */
export declare function createPythonAppCaveServiceAdapter(options: PythonAppCaveServiceAdapterOptions): CaveServerAdapter & AppShellRunner;
