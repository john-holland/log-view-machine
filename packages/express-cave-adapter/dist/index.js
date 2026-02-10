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
            const { cave, tomeConfigs, sections } = context;
            tomeManager = new TomeManager(app);
            for (const config of tomeConfigs) {
                await tomeManager.registerTome(config);
            }
            const tomes = Array.from(tomeManager.tomes.values());
            for (const tome of tomes) {
                await tome.start();
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
