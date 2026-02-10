/**
 * Proxygen Cave server adapter.
 * Uses a Node C++ addon (N-API) to run Proxygen in-process; JS handlers run in Node.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  createTome,
  type CaveServerAdapter,
  type CaveServerContext,
  type TomeConfig,
  type NormalizedRequest,
  type NormalizedResponse,
  type NormalizedRequestHandler,
  type NormalizedMiddleware,
} from 'log-view-machine';

/** Route binding from TomeConfig.routing.routes (path, method, transformers). */
interface TomeRouteBinding {
  path: string;
  method?: string;
  transformers?: { input?: (data: any, dir?: string) => any; output?: (data: any, dir?: string) => any };
}

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ProxygenAddon {
  getVersion(): string;
  startServer(port: number): number;
  stopServer(): void;
  addRoute(method: string, path: string): number;
  setDispatcher(fn: (handlerId: number, req: NormalizedRequest) => Promise<NormalizedResponse> | NormalizedResponse): void;
}

/** Load native addon from build output (build/Release or build/Debug). */
function loadAddon(): ProxygenAddon {
  const packageRoot = path.resolve(__dirname, '..');
  const candidates = [
    path.join(packageRoot, 'build', 'Release', 'proxygen_cave_native.node'),
    path.join(packageRoot, 'build', 'Debug', 'proxygen_cave_native.node'),
  ];
  for (const p of candidates) {
    try {
      const loaded = require(p);
      if (
        loaded &&
        typeof loaded.getVersion === 'function' &&
        typeof loaded.addRoute === 'function' &&
        typeof loaded.setDispatcher === 'function'
      ) {
        return loaded as ProxygenAddon;
      }
    } catch {
      continue;
    }
  }
  throw new Error(
    'proxygen-cave-adapter: native addon not built. Run "npm run rebuild" in the package directory.'
  );
}

let addon: ProxygenAddon | null = null;

function getAddon(): ProxygenAddon {
  if (!addon) addon = loadAddon();
  return addon;
}

/** Returns the native addon version (for diagnostics). */
export function getVersion(): string {
  return getAddon().getVersion();
}

export interface ProxygenCaveAdapterOptions {
  port?: number;
  host?: string;
  /** Path for health check (default /health). */
  healthPath?: string;
  /** Path for Address registry when sections.registry is true (default /registry). */
  registryPath?: string;
}

/**
 * Cave server adapter that uses Proxygen (C++) for HTTP and N-API to run JS handlers.
 * Same contract as expressCaveAdapter; createCaveServer({ plugins: [proxygenCaveAdapter({ port: 8080 })] }) works.
 */
export function proxygenCaveAdapter(options: ProxygenCaveAdapterOptions = {}): CaveServerAdapter {
  const port = options.port ?? 8080;
  const healthPath = options.healthPath ?? '/health';
  const registryPath = options.registryPath ?? '/registry';

  const handlers = new Map<number, NormalizedRequestHandler>();
  const middlewares: NormalizedMiddleware[] = [];
  let dispatcherSet = false;
  /** Current mount base path; prepended to paths in registerRoute. */
  let mountBasePath = '';
  /** Optional health check interval (ms); started in apply() after server start. */
  let healthIntervalMs = 0;

  function runMiddlewareChain(
    req: NormalizedRequest,
    index: number,
    handlerId: number
  ): Promise<NormalizedResponse> {
    if (index < middlewares.length) {
      return middlewares[index](req, () => runMiddlewareChain(req, index + 1, handlerId));
    }
    const handler = handlers.get(handlerId);
    if (!handler) return Promise.resolve({ status: 404, body: { error: 'Not found' } });
    return Promise.resolve(handler(req));
  }

  function ensureDispatcher(): void {
    if (dispatcherSet) return;
    getAddon().setDispatcher((handlerId: number, req: NormalizedRequest) =>
      runMiddlewareChain(req, 0, handlerId)
    );
    dispatcherSet = true;
  }

  function fullPath(pathSegment: string): string {
    const base = mountBasePath.endsWith('/') ? mountBasePath.slice(0, -1) : mountBasePath;
    const p = pathSegment.startsWith('/') ? pathSegment : '/' + pathSegment;
    return base + p;
  }

  const adapter: CaveServerAdapter = {
    registerRoute(method: string, path: string, handler: NormalizedRequestHandler): void {
      ensureDispatcher();
      const native = getAddon();
      const id = native.addRoute(method.toLowerCase(), fullPath(path));
      handlers.set(id, handler);
    },

    mount(basePath: string, _routeHandlerBag: unknown): void {
      mountBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
    },

    use(middleware: NormalizedMiddleware): void {
      middlewares.push(middleware);
    },

    async apply(context: CaveServerContext): Promise<void> {
      const { cave, tomeConfigs, sections } = context;
      const caveConfig = cave.getConfig();
      const security = caveConfig.security;

      if (security?.transport?.tls) {
        this.use!((req: NormalizedRequest, next: () => Promise<NormalizedResponse>) => {
          const proto = req.headers['x-forwarded-proto'] ?? req.headers['x-forwarded-protocol'];
          if (proto === 'https') return next();
          const host = req.headers['host'] ?? '';
          return Promise.resolve({
            status: 301,
            headers: { Location: `https://${host}${req.url}` },
          });
        });
      }

      if (security?.authentication?.required && security.authentication.type === 'api-key') {
        this.use!((req: NormalizedRequest, next: () => Promise<NormalizedResponse>) => {
          const key = req.headers['x-api-key'] ?? req.headers['authorization'];
          if (key) return next();
          return Promise.resolve({ status: 401, body: { error: 'Authentication required (API key)' } });
        });
      }

      if (security?.authentication?.required && security.authentication.type === 'jwt') {
        this.use!((req: NormalizedRequest, next: () => Promise<NormalizedResponse>) => {
          const auth = req.headers['authorization'];
          if (auth?.startsWith?.('Bearer ')) return next();
          return Promise.resolve({ status: 401, body: { error: 'Authentication required (JWT)' } });
        });
      }

      const tomes: Array<{ start(): Promise<void> }> = [];
      for (const config of tomeConfigs) {
        const tome = createTome(config as TomeConfig);
        tomes.push(tome);
        if (config.routing?.routes) {
          const mountPath = config.routing.basePath ?? `/api/${config.id}`;
          this.mount!(mountPath, {});
          for (const [machineKey, routeConfig] of Object.entries(config.routing.routes) as [string, TomeRouteBinding][]) {
            const machine = tome.getMachine(machineKey);
            if (!machine) continue;
            const method = (routeConfig.method ?? 'POST').toLowerCase();
            const path = routeConfig.path.startsWith('/') ? routeConfig.path : '/' + routeConfig.path;
            this.registerRoute!(method, path, async (normReq: NormalizedRequest) => {
              let body: { event?: string; data?: unknown } =
                typeof normReq.body === 'string' ? JSON.parse(normReq.body || '{}') : (normReq.body as any) ?? {};
              const { event, data } = body;
              if (!event) {
                return { status: 400, body: { error: 'Event is required', tome: config.id, machine: machineKey } };
              }
              let transformedData = data;
              if (routeConfig.transformers?.input) {
                transformedData = routeConfig.transformers.input(data, 'forward');
              }
              try {
                const result = await tome.sendMessage(machineKey, event, transformedData);
                let response = result;
                if (routeConfig.transformers?.output) {
                  response = routeConfig.transformers.output(result, 'forward');
                }
                return {
                  status: 200,
                  body: {
                    success: true,
                    tome: config.id,
                    machine: machineKey,
                    event,
                    result: response,
                    timestamp: new Date().toISOString(),
                  },
                };
              } catch (err: any) {
                return {
                  status: 500,
                  body: {
                    success: false,
                    error: err?.message ?? String(err),
                    tome: config.id,
                    machine: machineKey,
                    timestamp: new Date().toISOString(),
                  },
                };
              }
            });
          }
        }
      }

      for (const tome of tomes) {
        await tome.start();
      }

      if (sections.registry === true) {
        this.registerRoute!('get', registryPath.startsWith('/') ? registryPath : '/' + registryPath, (_req: NormalizedRequest) => {
          const config = cave.getConfig();
          const spelunk = config.spelunk;
          const addresses: Array<{ name: string; route?: string; container?: string; tomeId?: string; subdomains?: unknown }> = [];
          if (spelunk?.childCaves) {
            for (const [name, child] of Object.entries(spelunk.childCaves)) {
              const c = child as { route?: string; container?: string; tomeId?: string; subdomains?: unknown };
              addresses.push({
                name,
                route: c.route,
                container: c.container,
                tomeId: c.tomeId,
                subdomains: c.subdomains,
              });
            }
          }
          return Promise.resolve({ status: 200, body: { cave: config.name, addresses } });
        });
      }

      this.registerRoute!('get', healthPath.startsWith('/') ? healthPath : '/' + healthPath, () =>
        Promise.resolve({ status: 200, body: { ok: true } })
      );

      getAddon().startServer(port);

      if (healthIntervalMs > 0) {
        const path = healthPath.startsWith('/') ? healthPath : '/' + healthPath;
        setInterval(() => {
          fetch(`http://127.0.0.1:${port}${path}`).catch(() => {});
        }, healthIntervalMs);
      }
    },

    healthCheck(path?: string, intervalMs?: number): void {
      const p = (path ?? healthPath).startsWith('/') ? path ?? healthPath : '/' + (path ?? healthPath);
      this.registerRoute!('get', p, () => Promise.resolve({ status: 200, body: { ok: true } }));
      if (intervalMs !== undefined && intervalMs > 0) healthIntervalMs = intervalMs;
    },
  };

  return adapter;
}
