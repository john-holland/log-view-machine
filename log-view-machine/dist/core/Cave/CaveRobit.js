/**
 * CaveRobit - Dual of RobotCopy for transport resolution.
 * Maps (fromCave, toTome) to TransportDescriptor for automated transport selection.
 * Composed at CaveConfig level; decorator pattern for adapters.
 */
const DEFAULT_TRANSPORT = { type: 'in-app' };
function matchesValue(value, pattern) {
    if (pattern === undefined)
        return true;
    if (typeof pattern === 'string') {
        if (pattern === '*')
            return true;
        try {
            return new RegExp(pattern).test(value);
        }
        catch {
            return value === pattern;
        }
    }
    return pattern.test(value);
}
function resolveRoute(routes, fromCave, toTome, path) {
    for (const route of routes) {
        const fromMatch = matchesValue(fromCave, route.fromCave);
        const toMatch = matchesValue(toTome, route.toTome);
        let pathMatch = true;
        if (route.pathPattern) {
            try {
                pathMatch = new RegExp(route.pathPattern).test(path ?? '');
            }
            catch {
                pathMatch = false;
            }
        }
        if (fromMatch && toMatch && pathMatch) {
            return route.transport;
        }
    }
    return undefined;
}
/**
 * Create a CaveRobit instance with route-based transport resolution.
 * Resolution order: explicit route match -> pattern match -> defaultTransport -> in-app.
 */
export function createCaveRobit(config = {}) {
    const configRoutes = [...(config.routes ?? [])];
    const runtimeRoutes = [];
    const defaultTransport = config.defaultTransport ?? DEFAULT_TRANSPORT;
    function findTransport(fromCave, toTome, path) {
        const result = resolveRoute(configRoutes, fromCave, toTome, path);
        if (result)
            return result;
        for (const route of runtimeRoutes) {
            const fromMatch = matchesValue(fromCave, route.fromCave);
            const toMatch = matchesValue(toTome, route.toTome);
            if (fromMatch && toMatch)
                return route.transport;
        }
        return undefined;
    }
    let caveRobit = {
        getTransportForTarget(fromCave, toTome, path) {
            const result = findTransport(fromCave, toTome, path ?? '');
            return result ?? defaultTransport;
        },
        registerRoute(fromCave, toTome, descriptor) {
            runtimeRoutes.push({ fromCave, toTome, transport: descriptor });
        },
    };
    // Apply adapters (decorator chain)
    for (const adapter of config.adapters ?? []) {
        caveRobit = adapter(caveRobit, config);
    }
    return caveRobit;
}
/**
 * Decorator adapter: wraps CaveRobit and returns fallbackTransport on error or when inner returns in-app but fallback is preferred.
 * Use when you want a guaranteed fallback (e.g. HTTP) when primary resolution fails.
 */
export function createCaveRobitWithFallback(caveRobit, options) {
    const { fallbackTransport } = options;
    return {
        getTransportForTarget(fromCave, toTome, path) {
            try {
                const result = caveRobit.getTransportForTarget(fromCave, toTome, path);
                if (result && typeof result.then === 'function') {
                    return result.catch(() => fallbackTransport);
                }
                return result ?? fallbackTransport;
            }
            catch {
                return fallbackTransport;
            }
        },
        registerRoute: caveRobit.registerRoute &&
            ((fromCave, toTome, descriptor) => {
                caveRobit.registerRoute(fromCave, toTome, descriptor);
            }),
    };
}
