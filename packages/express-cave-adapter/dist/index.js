/**
 * Express Cave server adapter.
 * Implements CaveServerAdapter by delegating to TomeManager and Express.
 */
import express from 'express';
import { TomeManager } from 'log-view-machine';
function toNormalizedRequest(req) {
    const url = req.originalUrl || req.url;
    const path = req.path || url.split('?')[0];
    const query = {};
    if (req.query) {
        for (const [k, v] of Object.entries(req.query)) {
            query[k] = Array.isArray(v) ? v : v;
        }
    }
    const headers = {};
    if (req.headers) {
        for (const [k, v] of Object.entries(req.headers)) {
            if (v !== undefined)
                headers[k] = Array.isArray(v) ? v.join(', ') : String(v);
        }
    }
    return {
        url,
        path,
        method: req.method || 'GET',
        query,
        headers,
        body: req.body,
    };
}
function sendNormalizedResponse(res, nr) {
    res.status(nr.status);
    if (nr.headers) {
        for (const [k, v] of Object.entries(nr.headers)) {
            res.setHeader(k, String(v));
        }
    }
    if (nr.body !== undefined) {
        res.json(nr.body);
    }
    else {
        res.end();
    }
}
export function expressCaveAdapter(options = {}) {
    const app = options.app ?? express();
    if (!options.app) {
        app.use(express.json());
    }
    const registryPath = options.registryPath ?? '/registry';
    let tomeManager = null;
    const adapter = {
        getApp() {
            return app;
        },
        getTomeManager() {
            return tomeManager;
        },
        registerRoute(method, path, handler) {
            const m = method.toLowerCase();
            app[m](path, async (req, res) => {
                try {
                    const normReq = toNormalizedRequest(req);
                    const normRes = await Promise.resolve(handler(normReq));
                    sendNormalizedResponse(res, normRes);
                }
                catch (err) {
                    res.status(500).json({ error: err?.message ?? String(err) });
                }
            });
        },
        mount(basePath, routeHandlerBag) {
            app.use(basePath, routeHandlerBag);
        },
        use(middleware) {
            app.use(async (req, res, next) => {
                try {
                    const normReq = toNormalizedRequest(req);
                    await middleware(normReq, async () => {
                        req.__next = true;
                        return { status: 200, body: {} };
                    });
                    next();
                }
                catch (err) {
                    next();
                }
            });
        },
        async apply(context) {
            const { cave, tomeConfigs, sections, resourceMonitor } = context;
            const caveConfig = cave.getConfig();
            const security = caveConfig.security;
            const opts = options;
            if (opts.cors !== undefined) {
                const c = typeof opts.cors === 'object' ? opts.cors : {};
                const origin = c.origin ?? (typeof opts.cors === 'boolean' && opts.cors ? '*' : undefined);
                const methods = c.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
                const allowedHeaders = c.allowedHeaders ?? ['Content-Type', 'Authorization', 'X-Cave-Message-Token'];
                app.use((_req, res, next) => {
                    if (origin)
                        res.setHeader('Access-Control-Allow-Origin', Array.isArray(origin) ? origin[0] : String(origin));
                    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
                    res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
                    if (c.credentials)
                        res.setHeader('Access-Control-Allow-Credentials', 'true');
                    if (c.maxAge != null)
                        res.setHeader('Access-Control-Max-Age', String(c.maxAge));
                    next();
                });
            }
            if (security?.messageToken) {
                const secretEnv = security.messageToken.secretEnv ?? 'CAVE_MESSAGE_TOKEN_SECRET';
                const headerName = security.messageToken.header ?? 'X-Cave-Message-Token';
                const secret = typeof process !== 'undefined' && process.env?.[secretEnv];
                if (secret) {
                    const lvm = await import('log-view-machine');
                    const parseToken = lvm.parseToken;
                    const validateToken = lvm.validateToken;
                    if (typeof parseToken === 'function' && typeof validateToken === 'function') {
                        app.use((req, res, next) => {
                            const method = (req.method ?? 'GET').toUpperCase();
                            if (['GET', 'HEAD', 'OPTIONS'].includes(method))
                                return next();
                            const rawHeader = req.get(headerName);
                            const headerStr = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
                            const bodyToken = req.body?._messageToken;
                            const token = headerStr
                                ? parseToken(headerStr)
                                : bodyToken != null
                                    ? (typeof bodyToken === 'string' ? parseToken(bodyToken) : bodyToken)
                                    : null;
                            if (!token || !token.salt || !token.hash) {
                                return res.status(403).json({ error: 'Message token required' });
                            }
                            const channelId = req.path ?? '';
                            const payloadSummary = (req.body?.action ?? req.body?.messageId ?? '').toString();
                            const valid = validateToken({ token, channelId, payloadSummary, secret, checkExpiry: true });
                            if (!valid)
                                return res.status(403).json({ error: 'Invalid message token' });
                            next();
                        });
                    }
                }
            }
            let adapterCircuit = null;
            let adapterThrottle = null;
            if (opts.throttle && resourceMonitor) {
                const lvm = await import('log-view-machine');
                const createThrottlePolicy = lvm.createThrottlePolicy;
                if (typeof createThrottlePolicy === 'function') {
                    adapterThrottle = createThrottlePolicy({ config: opts.throttle, monitor: resourceMonitor });
                    app.use((_req, res, next) => {
                        if (adapterThrottle.isOverLimit()) {
                            res.setHeader('Retry-After', '60');
                            res.status(429).json({ error: 'Too many requests', retryAfter: 60 });
                            return;
                        }
                        next();
                    });
                }
            }
            if (opts.circuitBreaker && resourceMonitor) {
                const lvm = await import('log-view-machine');
                const createCircuitBreaker = lvm.createCircuitBreaker;
                if (typeof createCircuitBreaker === 'function') {
                    adapterCircuit = createCircuitBreaker({
                        name: opts.circuitBreaker.name ?? 'express',
                        threshold: opts.circuitBreaker.threshold,
                        resetMs: opts.circuitBreaker.resetMs,
                        monitor: resourceMonitor,
                    });
                    app.use((_req, res, next) => {
                        if (!adapterCircuit.allowRequest()) {
                            res.status(503).json({ error: 'Service unavailable', circuitOpen: true });
                            return;
                        }
                        next();
                    });
                }
            }
            if (resourceMonitor) {
                app.use((req, res, next) => {
                    const start = Date.now();
                    const contentLength = req.headers['content-length'];
                    const bytesIn = contentLength ? parseInt(String(contentLength), 10) : undefined;
                    res.on('finish', () => {
                        const bytesOut = res.getHeader('Content-Length') ? parseInt(String(res.getHeader('Content-Length')), 10) : 0;
                        resourceMonitor.trackRequest({
                            path: req.path,
                            method: req.method,
                            bytesIn,
                            bytesOut: Number.isFinite(bytesOut) ? bytesOut : undefined,
                            latencyMs: Date.now() - start,
                            status: res.statusCode,
                        });
                        if (adapterThrottle)
                            adapterThrottle.record(bytesIn ?? 0, Number.isFinite(bytesOut) ? bytesOut : 0);
                        if (adapterCircuit) {
                            if (res.statusCode >= 400)
                                adapterCircuit.recordFailure();
                            else
                                adapterCircuit.recordSuccess();
                        }
                    });
                    next();
                });
            }
            if (security?.transport?.tls) {
                app.use((req, res, next) => {
                    if (req.secure)
                        return next();
                    const host = req.get('host') ?? '';
                    res.redirect(301, `https://${host}${req.originalUrl ?? req.url}`);
                });
            }
            if (security?.authentication?.required && security.authentication.type === 'api-key') {
                app.use((req, res, next) => {
                    const key = req.get('x-api-key') || req.get('authorization');
                    if (key)
                        return next();
                    const redirectPath = opts.redirectLoginPath?.replace(/\?.*$/, '');
                    const path = req.path || (req.originalUrl || req.url || '').split('?')[0];
                    if (redirectPath && (req.method || 'GET').toUpperCase() === 'GET' && !path.startsWith('/api')) {
                        res.redirect(302, `${redirectPath}?auth_error=unauthorized&message=${encodeURIComponent('Authentication required (API key)')}`);
                        return;
                    }
                    res.status(401).json({ error: 'Authentication required (API key)' });
                });
            }
            if (security?.authentication?.required && security.authentication.type === 'jwt') {
                app.use((req, res, next) => {
                    const auth = req.get('authorization');
                    if (auth?.startsWith('Bearer '))
                        return next();
                    const redirectPath = opts.redirectLoginPath?.replace(/\?.*$/, '');
                    const path = req.path || (req.originalUrl || req.url || '').split('?')[0];
                    if (redirectPath && (req.method || 'GET').toUpperCase() === 'GET' && !path.startsWith('/api')) {
                        res.redirect(302, `${redirectPath}?auth_error=unauthorized&message=${encodeURIComponent('Authentication required (JWT)')}`);
                        return;
                    }
                    res.status(401).json({ error: 'Authentication required (JWT)' });
                });
            }
            if (opts.permissionMiddleware) {
                const pm = opts.permissionMiddleware;
                const levelOrder = pm.levelOrder ?? ['anonymous', 'user', 'admin'];
                app.use(async (req, res, next) => {
                    try {
                        const user = await Promise.resolve(pm.getCurrentUser(req));
                        const tenant = pm.getTenantName ? await Promise.resolve(pm.getTenantName(cave, req)) : undefined;
                        const userWithTenant = tenant !== undefined ? { ...user, tenantId: tenant } : user;
                        const path = req.path || (req.originalUrl || req.url || '').split('?')[0];
                        const routed = cave.getRoutedConfig(path);
                        const spelunkPermission = routed?.permission;
                        let tomePermission;
                        for (const tc of tomeConfigs) {
                            const base = tc.routing?.basePath;
                            if (base && path.startsWith(base)) {
                                tomePermission = tc.permission;
                                break;
                            }
                        }
                        const spec = spelunkPermission ?? tomePermission ?? '>anonymous';
                        if (!pm.evaluatePermission(userWithTenant, spec, levelOrder)) {
                            const message = `Forbidden: required permission ${spec}`;
                            const redirectPath = pm.redirectLoginPath?.replace(/\?.*$/, '');
                            const isGet = (req.method || 'GET').toUpperCase() === 'GET';
                            const isApiPath = path.startsWith('/api');
                            if (redirectPath && isGet && !isApiPath) {
                                const sep = redirectPath.includes('?') ? '&' : '?';
                                res.redirect(302, `${redirectPath}${sep}auth_error=forbidden&message=${encodeURIComponent(message)}`);
                                return;
                            }
                            res.status(403).json({ error: 'Forbidden', permission: spec });
                            return;
                        }
                        next();
                    }
                    catch (e) {
                        next(e);
                    }
                });
            }
            tomeManager = new TomeManager(app);
            for (const config of tomeConfigs) {
                await tomeManager.registerTome(config);
            }
            const tomes = Array.from(tomeManager.tomes.values());
            for (const tome of tomes) {
                await tome.start();
            }
            if (context.tomeManagerRef) {
                context.tomeManagerRef.current = tomeManager;
            }
            if (sections.registry === true) {
                app.get(registryPath, (_req, res) => {
                    const config = cave.getConfig();
                    const spelunk = config.spelunk;
                    const addresses = [];
                    if (spelunk.childCaves) {
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
                    res.json({ cave: config.name, addresses });
                });
            }
        },
    };
    return adapter;
}
/**
 * Create an HTTP or HTTP/2 server for the Express app. Use when http2 option is true.
 * In production, HTTP/2 is often terminated at a reverse proxy (ALB, OpenShift); this applies when Node is the TLS endpoint.
 */
export function createServer(app, options) {
    const useHttp2 = options.http2 === true || (typeof options.http2 === 'object' && options.http2 !== null);
    if (useHttp2 && options.tls?.cert && options.tls?.key) {
        const http2 = require('http2');
        return http2.createSecureServer({ cert: options.tls.cert, key: options.tls.key, allowHTTP1: options.http2?.allowHTTP1 !== false }, app);
    }
    if (useHttp2) {
        const http2 = require('http2');
        return http2.createServer({ allowHTTP1: options.http2?.allowHTTP1 !== false }, app);
    }
    const http = require('http');
    return http.createServer(app);
}
