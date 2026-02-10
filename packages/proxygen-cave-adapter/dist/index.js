/**
 * Proxygen Cave server adapter.
 * Uses a Node C++ addon (N-API) to run Proxygen in-process; JS handlers run in Node.
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createTome, } from 'log-view-machine';
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Load native addon from build output (build/Release or build/Debug). */
function loadAddon() {
    const packageRoot = path.resolve(__dirname, '..');
    const candidates = [
        path.join(packageRoot, 'build', 'Release', 'proxygen_cave_native.node'),
        path.join(packageRoot, 'build', 'Debug', 'proxygen_cave_native.node'),
    ];
    for (const p of candidates) {
        try {
            const loaded = require(p);
            if (loaded &&
                typeof loaded.getVersion === 'function' &&
                typeof loaded.addRoute === 'function' &&
                typeof loaded.setDispatcher === 'function') {
                return loaded;
            }
        }
        catch {
            continue;
        }
    }
    throw new Error('proxygen-cave-adapter: native addon not built. Run "npm run rebuild" in the package directory.');
}
let addon = null;
function getAddon() {
    if (!addon)
        addon = loadAddon();
    return addon;
}
/** Returns the native addon version (for diagnostics). */
export function getVersion() {
    return getAddon().getVersion();
}
/**
 * Cave server adapter that uses Proxygen (C++) for HTTP and N-API to run JS handlers.
 * Same contract as expressCaveAdapter; createCaveServer({ plugins: [proxygenCaveAdapter({ port: 8080 })] }) works.
 */
export function proxygenCaveAdapter(options = {}) {
    const port = options.port ?? 8080;
    const healthPath = options.healthPath ?? '/health';
    const registryPath = options.registryPath ?? '/registry';
    const handlers = new Map();
    const middlewares = [];
    let dispatcherSet = false;
    /** Current mount base path; prepended to paths in registerRoute. */
    let mountBasePath = '';
    /** Optional health check interval (ms); started in apply() after server start. */
    let healthIntervalMs = 0;
    function runMiddlewareChain(req, index, handlerId) {
        if (index < middlewares.length) {
            return middlewares[index](req, () => runMiddlewareChain(req, index + 1, handlerId));
        }
        const handler = handlers.get(handlerId);
        if (!handler)
            return Promise.resolve({ status: 404, body: { error: 'Not found' } });
        return Promise.resolve(handler(req));
    }
    function ensureDispatcher() {
        if (dispatcherSet)
            return;
        getAddon().setDispatcher((handlerId, req) => runMiddlewareChain(req, 0, handlerId));
        dispatcherSet = true;
    }
    function fullPath(pathSegment) {
        const base = mountBasePath.endsWith('/') ? mountBasePath.slice(0, -1) : mountBasePath;
        const p = pathSegment.startsWith('/') ? pathSegment : '/' + pathSegment;
        return base + p;
    }
    const adapter = {
        registerRoute(method, path, handler) {
            ensureDispatcher();
            const native = getAddon();
            const id = native.addRoute(method.toLowerCase(), fullPath(path));
            handlers.set(id, handler);
        },
        mount(basePath, _routeHandlerBag) {
            mountBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
        },
        use(middleware) {
            middlewares.push(middleware);
        },
        async apply(context) {
            const { cave, tomeConfigs, sections } = context;
            const caveConfig = cave.getConfig();
            const security = caveConfig.security;
            if (security?.transport?.tls) {
                this.use((req, next) => {
                    const proto = req.headers['x-forwarded-proto'] ?? req.headers['x-forwarded-protocol'];
                    if (proto === 'https')
                        return next();
                    const host = req.headers['host'] ?? '';
                    return Promise.resolve({
                        status: 301,
                        headers: { Location: `https://${host}${req.url}` },
                    });
                });
            }
            if (security?.authentication?.required && security.authentication.type === 'api-key') {
                this.use((req, next) => {
                    const key = req.headers['x-api-key'] ?? req.headers['authorization'];
                    if (key)
                        return next();
                    return Promise.resolve({ status: 401, body: { error: 'Authentication required (API key)' } });
                });
            }
            if (security?.authentication?.required && security.authentication.type === 'jwt') {
                this.use((req, next) => {
                    const auth = req.headers['authorization'];
                    if (auth?.startsWith?.('Bearer '))
                        return next();
                    return Promise.resolve({ status: 401, body: { error: 'Authentication required (JWT)' } });
                });
            }
            const tomes = [];
            for (const config of tomeConfigs) {
                const tome = createTome(config);
                tomes.push(tome);
                if (config.routing?.routes) {
                    const mountPath = config.routing.basePath ?? `/api/${config.id}`;
                    this.mount(mountPath, {});
                    for (const [machineKey, routeConfig] of Object.entries(config.routing.routes)) {
                        const machine = tome.getMachine(machineKey);
                        if (!machine)
                            continue;
                        const method = (routeConfig.method ?? 'POST').toLowerCase();
                        const path = routeConfig.path.startsWith('/') ? routeConfig.path : '/' + routeConfig.path;
                        this.registerRoute(method, path, async (normReq) => {
                            let body = typeof normReq.body === 'string' ? JSON.parse(normReq.body || '{}') : normReq.body ?? {};
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
                            }
                            catch (err) {
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
                this.registerRoute('get', registryPath.startsWith('/') ? registryPath : '/' + registryPath, (_req) => {
                    const config = cave.getConfig();
                    const spelunk = config.spelunk;
                    const addresses = [];
                    if (spelunk?.childCaves) {
                        for (const [name, child] of Object.entries(spelunk.childCaves)) {
                            const c = child;
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
            this.registerRoute('get', healthPath.startsWith('/') ? healthPath : '/' + healthPath, () => Promise.resolve({ status: 200, body: { ok: true } }));
            getAddon().startServer(port);
            if (healthIntervalMs > 0) {
                const path = healthPath.startsWith('/') ? healthPath : '/' + healthPath;
                setInterval(() => {
                    fetch(`http://127.0.0.1:${port}${path}`).catch(() => { });
                }, healthIntervalMs);
            }
        },
        healthCheck(path, intervalMs) {
            const p = (path ?? healthPath).startsWith('/') ? path ?? healthPath : '/' + (path ?? healthPath);
            this.registerRoute('get', p, () => Promise.resolve({ status: 200, body: { ok: true } }));
            if (intervalMs !== undefined && intervalMs > 0)
                healthIntervalMs = intervalMs;
        },
    };
    return adapter;
}
