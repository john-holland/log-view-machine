/**
 * aws-lambda-cave-adapter: Cave server adapter for AWS Lambda.
 * Builds a route table from tomeConfigs and exposes a single Lambda handler that
 * maps API Gateway event -> NormalizedRequest -> route lookup -> TomeManager.sendTomeMessage -> NormalizedResponse -> API Gateway response.
 */
import express from 'express';
import { TomeManager, } from 'log-view-machine';
/**
 * Build route table from tome configs: (method, path) -> { tomeId, machineKey }.
 * Path is normalized (no trailing slash, path params as-is from config).
 */
function buildRouteTable(tomeConfigs) {
    const table = new Map();
    for (const config of tomeConfigs) {
        const basePath = config.routing?.basePath ?? `/api/${config.id}`;
        const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
        const routes = config.routing?.routes ?? {};
        for (const [machineKey, binding] of Object.entries(routes)) {
            const b = binding;
            const path = b.path.startsWith('/') ? b.path : `/${b.path}`;
            const fullPath = base + path;
            const method = (b.method ?? 'POST').toUpperCase();
            const key = `${method} ${fullPath}`;
            table.set(key, { tomeId: config.id, machineKey });
        }
    }
    return table;
}
/**
 * Map API Gateway HTTP event to NormalizedRequest.
 */
function eventToNormalizedRequest(event) {
    const method = event.httpMethod ?? event.requestContext?.http?.method ?? 'GET';
    const path = event.path ?? event.requestContext?.http?.path ?? '/';
    const pathOnly = path.split('?')[0] ?? path;
    const query = {};
    const qs = event.queryStringParameters;
    if (qs) {
        for (const [k, v] of Object.entries(qs)) {
            query[k] = v ?? '';
        }
    }
    const headers = {};
    const h = event.headers;
    if (h) {
        for (const [k, v] of Object.entries(h)) {
            if (v !== undefined && v !== null)
                headers[k] = String(v);
        }
    }
    let body = undefined;
    if (event.body) {
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        }
        catch {
            body = event.body;
        }
    }
    return {
        url: path,
        path: pathOnly,
        method: String(method).toUpperCase(),
        query,
        headers,
        body,
    };
}
/**
 * Map NormalizedResponse to API Gateway response.
 */
function normalizedResponseToLambda(nr) {
    const headers = {
        'Content-Type': 'application/json',
        ...nr.headers,
    };
    let body;
    if (nr.body !== undefined) {
        body = typeof nr.body === 'string' ? nr.body : JSON.stringify(nr.body);
    }
    return {
        statusCode: nr.status,
        headers,
        body,
    };
}
let cachedTomeManager = null;
let cachedRouteTable = null;
let cachedHandler = async () => ({ statusCode: 503, body: JSON.stringify({ error: 'Adapter not applied' }) });
/**
 * Create the Lambda Cave adapter. Implements CaveServerAdapter.
 * apply(context) builds a route table and a Lambda handler; use getLambdaHandler() to get the handler for Lambda entry.
 */
export function createLambdaCaveAdapter(_options) {
    let lambdaHandler = async () => ({ statusCode: 503, body: JSON.stringify({ error: 'Not applied' }) });
    const adapter = {
        async apply(context) {
            const { cave, tomeConfigs } = context;
            const app = express();
            const tomeManager = new TomeManager(app);
            for (const config of tomeConfigs) {
                await tomeManager.registerTome(config);
            }
            const tomes = Array.from(tomeManager.tomes.values());
            for (const tome of tomes) {
                await tome.start();
            }
            const routeTable = buildRouteTable(tomeConfigs);
            cachedTomeManager = tomeManager;
            cachedRouteTable = routeTable;
            lambdaHandler = async (event) => {
                const req = eventToNormalizedRequest(event);
                const key = `${req.method} ${req.path}`;
                const entry = routeTable.get(key);
                if (!entry) {
                    return normalizedResponseToLambda({ status: 404, body: { error: 'Not Found', path: req.path } });
                }
                const tome = tomeManager.getTome(entry.tomeId);
                if (!tome) {
                    return normalizedResponseToLambda({ status: 500, body: { error: 'Tome not found', tomeId: entry.tomeId } });
                }
                const body = req.body;
                const eventName = body?.event;
                if (!eventName) {
                    return normalizedResponseToLambda({ status: 400, body: { error: 'Event is required', tome: entry.tomeId, machine: entry.machineKey } });
                }
                try {
                    const result = await tome.sendMessage(entry.machineKey, eventName, body?.data);
                    return normalizedResponseToLambda({
                        status: 200,
                        body: {
                            success: true,
                            tome: entry.tomeId,
                            machine: entry.machineKey,
                            event: eventName,
                            result,
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    return normalizedResponseToLambda({
                        status: 500,
                        body: {
                            success: false,
                            error: message,
                            tome: entry.tomeId,
                            machine: entry.machineKey,
                            timestamp: new Date().toISOString(),
                        },
                    });
                }
            };
            cachedHandler = lambdaHandler;
        },
        getLambdaHandler() {
            return cachedHandler;
        },
    };
    return adapter;
}
