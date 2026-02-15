/**
 * Tests for pythonapp-caveservice-adapter.
 */

import path from 'path';
import { createPythonAppCaveServiceAdapter } from '../src/index';

// Mock child_process.spawn so we don't run real Python
const mockSpawn = jest.fn();
mockSpawn.mockReturnValue({
  on: jest.fn((event: string, cb: (code?: number) => void) => {
    if (event === 'close') setTimeout(() => cb(0), 0);
    return { on: jest.fn() };
  }),
});

jest.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}));

function createMockRegistry() {
  const map = new Map<string, { name: string; scriptPath: string; [k: string]: unknown }>();
  return {
    register(name: string, descriptor: { name: string; scriptPath: string; [k: string]: unknown }) {
      map.set(name, { ...descriptor, name });
    },
    get(name: string) {
      return map.get(name);
    },
    _map: map,
  };
}

function createMockContext(withRegistry = true) {
  const registry = createMockRegistry();
  return {
    cave: {},
    tomeConfigs: [],
    variables: {},
    sections: {},
    ...(withRegistry && { appShellRegistryRef: { current: registry } }),
    _registry: registry,
  };
}

describe('pythonapp-caveservice-adapter', () => {
  beforeEach(() => {
    mockSpawn.mockClear();
  });

  describe('createPythonAppCaveServiceAdapter', () => {
    it('returns an adapter with apply, runAppShell, and getAppShell', () => {
      const adapter = createPythonAppCaveServiceAdapter({ apps: {} });
      expect(adapter).toBeDefined();
      expect(typeof adapter.apply).toBe('function');
      expect(typeof adapter.runAppShell).toBe('function');
      expect(typeof adapter.getAppShell).toBe('function');
    });
  });

  describe('apply', () => {
    it('does nothing when context has no appShellRegistryRef', async () => {
      const context = createMockContext(false) as any;
      delete context.appShellRegistryRef;
      delete context._registry;

      const adapter = createPythonAppCaveServiceAdapter({
        apps: { myApp: { scriptPath: '/foo/script.py' } },
      });
      await adapter.apply(context);

      expect(adapter.getAppShell('myApp')).toBeUndefined();
    });

    it('registers each app in the registry when appShellRegistryRef is present', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: {
          toolA: { scriptPath: '/apps/tool_a.py', cwd: '/apps' },
          toolB: {
            scriptPath: '/other/run.py',
            pythonPath: '/usr/bin/python3',
            dependencies: ['requests'],
            pipInstall: 'once',
          },
        },
      });

      await adapter.apply(context);

      const descA = adapter.getAppShell('toolA');
      expect(descA).toBeDefined();
      expect(descA!.name).toBe('toolA');
      expect(descA!.scriptPath).toBe('/apps/tool_a.py');
      expect(descA!.cwd).toBe('/apps');

      const descB = adapter.getAppShell('toolB');
      expect(descB).toBeDefined();
      expect(descB!.name).toBe('toolB');
      expect(descB!.scriptPath).toBe('/other/run.py');
      expect(descB!.pythonPath).toBe('/usr/bin/python3');
      expect(descB!.dependencies).toEqual(['requests']);
      expect(descB!.pipInstall).toBe('once');
    });

    it('registers descriptor with venvPath and env', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: {
          venvApp: {
            scriptPath: '/proj/main.py',
            venvPath: '/proj/.venv',
            env: { FOO: 'bar' },
          },
        },
      });
      await adapter.apply(context);

      const desc = adapter.getAppShell('venvApp');
      expect(desc).toBeDefined();
      expect(desc!.venvPath).toBe('/proj/.venv');
      expect(desc!.env).toEqual({ FOO: 'bar' });
    });

    it('runs pip install when pipInstall is "always" and dependencies are set', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: {
          withDeps: {
            scriptPath: '/app/main.py',
            dependencies: ['requests'],
            pipInstall: 'always',
          },
        },
      });
      await adapter.apply(context);

      // Our spawn mock is used for both pip and python; apply with pipInstall 'always' triggers pip
      expect(mockSpawn).toHaveBeenCalled();
      const firstCall = mockSpawn.mock.calls[0];
      const executable = firstCall[0];
      const args = firstCall[1] as string[];
      // Adapter uses python -m pip when no venv, or venv/bin/pip when venv
      expect(executable).toMatch(/pip|python/);
      expect(args).toContain('install');
      expect(args).toContain('requests');
    });
  });

  describe('getAppShell', () => {
    it('returns undefined before apply', () => {
      const adapter = createPythonAppCaveServiceAdapter({
        apps: { x: { scriptPath: '/x.py' } },
      });
      expect(adapter.getAppShell('x')).toBeUndefined();
    });

    it('returns undefined for unknown name after apply', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: { known: { scriptPath: '/k.py' } },
      });
      await adapter.apply(context);
      expect(adapter.getAppShell('known')).toBeDefined();
      expect(adapter.getAppShell('unknown')).toBeUndefined();
    });
  });

  describe('runAppShell', () => {
    it('throws when app name is not registered', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: { only: { scriptPath: '/only.py' } },
      });
      await adapter.apply(context);

      await expect(adapter.runAppShell('nonexistent')).rejects.toThrow('App shell not found: nonexistent');
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('spawns python with scriptPath and args', async () => {
      const context = createMockContext() as any;
      const scriptPath = path.join(path.sep, 'apps', 'cli.py');
      const adapter = createPythonAppCaveServiceAdapter({
        apps: { cli: { scriptPath, cwd: path.join(path.sep, 'apps') } },
      });
      await adapter.apply(context);

      const child = await adapter.runAppShell('cli', ['--help']);
      expect(child).toBeDefined();
      expect(mockSpawn).toHaveBeenCalledTimes(1);
      const [python, args, options] = mockSpawn.mock.calls[0];
      expect(args[0]).toBe(scriptPath);
      expect(args.slice(1)).toEqual(['--help']);
      expect(options.cwd).toBe(path.join(path.sep, 'apps'));
      expect(options.env).toBeDefined();
    });

    it('uses pythonPath from descriptor when set', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: {
          custom: {
            scriptPath: '/s/script.py',
            pythonPath: '/opt/python3.12/bin/python',
          },
        },
      });
      await adapter.apply(context);
      await adapter.runAppShell('custom');
      expect(mockSpawn).toHaveBeenCalledWith(
        '/opt/python3.12/bin/python',
        expect.arrayContaining(['/s/script.py']),
        expect.any(Object)
      );
    });

    it('passes env from descriptor into spawn options', async () => {
      const context = createMockContext() as any;
      const adapter = createPythonAppCaveServiceAdapter({
        apps: {
          envApp: {
            scriptPath: '/e/main.py',
            env: { MY_VAR: 'value', ANOTHER: 'x' },
          },
        },
      });
      await adapter.apply(context);
      await adapter.runAppShell('envApp');
      const options = mockSpawn.mock.calls[0][2];
      expect(options.env).toMatchObject({ MY_VAR: 'value', ANOTHER: 'x' });
    });
  });
});
