/**
 * pythonapp-caveservice-adapter: register and run named Python app shells via the Cave appShell registry.
 * Implements CaveServerAdapter; in apply() registers each configured app with context.appShellRegistryRef.
 * Exposes runAppShell(name, args?) and getAppShell(name) for easy shelling to a specific Python app.
 */
import { spawn } from 'child_process';
import path from 'path';
const defaultPython = process.platform === 'win32' ? 'python' : 'python3';
function resolvePythonExecutable(descriptor) {
    if (descriptor.pythonPath)
        return descriptor.pythonPath;
    if (descriptor.venvPath) {
        const base = descriptor.venvPath;
        return process.platform === 'win32'
            ? path.join(base, 'Scripts', 'python.exe')
            : path.join(base, 'bin', 'python');
    }
    return defaultPython;
}
/** Returns [command, args] for spawning pip (use command + args for spawn). When no venv, use python -m pip so it works on Windows when pip isn't on PATH. */
function getPipSpawnArgs(descriptor) {
    if (descriptor.venvPath) {
        const base = descriptor.venvPath;
        const pip = process.platform === 'win32'
            ? path.join(base, 'Scripts', 'pip.exe')
            : path.join(base, 'bin', 'pip');
        return [pip, []];
    }
    const python = descriptor.pythonPath ?? defaultPython;
    return [python, ['-m', 'pip']];
}
/**
 * Create a Cave server adapter that registers the given Python apps in the appShell registry
 * and provides runAppShell(name, args?) / getAppShell(name) for shelling to them.
 */
export function createPythonAppCaveServiceAdapter(options) {
    const { apps } = options;
    const installedOnce = new Set();
    let registry = null;
    async function ensurePipInstall(descriptor, name) {
        const pipInstall = descriptor.pipInstall;
        if (!pipInstall)
            return;
        if (pipInstall === 'once' && installedOnce.has(name))
            return;
        const hasDeps = descriptor.requirementsPath || (descriptor.dependencies && descriptor.dependencies.length > 0);
        if (!hasDeps)
            return;
        const [pipCommand, pipPrefixArgs] = getPipSpawnArgs(descriptor);
        const cwd = descriptor.cwd || path.dirname(descriptor.scriptPath);
        const env = { ...process.env, ...descriptor.env };
        if (descriptor.requirementsPath) {
            const reqPath = path.isAbsolute(descriptor.requirementsPath)
                ? descriptor.requirementsPath
                : path.join(cwd, descriptor.requirementsPath);
            await new Promise((resolve, reject) => {
                const child = spawn(pipCommand, [...pipPrefixArgs, 'install', '-r', reqPath], { cwd, env, stdio: 'inherit' });
                child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pip install exited ${code}`))));
                child.on('error', reject);
            });
        }
        else if (descriptor.dependencies?.length) {
            await new Promise((resolve, reject) => {
                const child = spawn(pipCommand, [...pipPrefixArgs, 'install', ...descriptor.dependencies], { cwd, env, stdio: 'inherit' });
                child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pip install exited ${code}`))));
                child.on('error', reject);
            });
        }
        installedOnce.add(name);
    }
    const runner = {
        getAppShell(name) {
            return registry?.get(name);
        },
        async runAppShell(name, args = []) {
            const descriptor = registry?.get(name);
            if (!descriptor)
                throw new Error(`App shell not found: ${name}`);
            await ensurePipInstall(descriptor, name);
            const python = resolvePythonExecutable(descriptor);
            const cwd = descriptor.cwd || path.dirname(descriptor.scriptPath);
            const env = { ...process.env, ...descriptor.env };
            const child = spawn(python, [descriptor.scriptPath, ...args], { cwd, env });
            return child;
        },
    };
    const adapter = {
        ...runner,
        async apply(context) {
            const ref = context.appShellRegistryRef;
            if (!ref)
                return;
            registry = ref.current;
            for (const [name, desc] of Object.entries(apps)) {
                const descriptor = {
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
