/**
 * Integration: CaveRobit + RobotCopy dual binding.
 * Provides a transport factory that resolves transport via CaveRobit for each sendMessage call.
 * Wire this as RobotCopyConfig.transport when using Cave with caveRobit.
 */
import { createCaveRobit } from './CaveRobit';
/**
 * Create a transport object suitable for RobotCopyConfig.transport.
 * When RobotCopy.sendMessage(action, data) is called, this transport:
 * 1. Resolves (fromCave, toTome, path) via CaveRobit
 * 2. For type 'http', delegates to httpTransport or uses fetch
 * 3. For type 'in-app', would need tomeManager - not implemented here; returns in-app as default
 *
 * Usage:
 *   const transport = createCaveRobitTransport({ cave, httpTransport: robotCopy });
 *   const rc = createRobotCopy({ transport });
 */
export function createCaveRobitTransport(options) {
    const { cave, caveRobit, fromCave = cave.name, getToTome = (_, data) => data.toTome ?? data.tomeId ?? '', getPath = () => '', httpTransport, } = options;
    const configCaveRobit = cave.getConfig?.().caveRobit;
    const resolver = caveRobit ??
        (configCaveRobit && typeof configCaveRobit.getTransportForTarget === 'function'
            ? configCaveRobit
            : configCaveRobit
                ? createCaveRobit(configCaveRobit)
                : undefined);
    if (!resolver && !cave.getTransportForTarget) {
        throw new Error('integrateCaveRobitWithRobotCopy: cave must have caveRobit or getTransportForTarget');
    }
    return {
        async send(action, data = {}) {
            const toTome = getToTome(action, data);
            const path = getPath(action, data);
            let descriptor;
            const effectivePath = path || '/';
            if (cave.getTransportForTarget && effectivePath) {
                const result = cave.getTransportForTarget(fromCave, effectivePath);
                descriptor =
                    result && typeof result.then === 'function'
                        ? await result
                        : result;
            }
            else if (resolver) {
                const result = resolver.getTransportForTarget(fromCave, toTome, effectivePath);
                descriptor =
                    result && typeof result.then === 'function'
                        ? await result
                        : result;
            }
            else {
                descriptor = { type: 'in-app' };
            }
            if (descriptor.type === 'http') {
                if (httpTransport) {
                    return httpTransport.send(action, data);
                }
                const baseUrl = descriptor.config?.baseUrl ?? descriptor.config?.url ?? '';
                if (!baseUrl) {
                    throw new Error('CaveRobit transport http requires baseUrl or url in config');
                }
                const apiPath = descriptor.config?.apiBasePath ?? '/api';
                const url = `${baseUrl.replace(/\/$/, '')}${apiPath}/${action}`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok)
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                return res.json().catch(() => ({}));
            }
            if (descriptor.type === 'in-app') {
                return {};
            }
            throw new Error(`CaveRobit transport type "${descriptor.type}" not implemented; use http or in-app, or provide custom transport`);
        },
    };
}
/**
 * Wire Cave and RobotCopy for dual binding.
 * Returns a RobotCopy config that can be passed to createRobotCopy, with transport resolved via CaveRobit.
 */
export function createRobotCopyConfigWithCaveRobit(cave, baseConfig = {}) {
    const transport = createCaveRobitTransport({
        cave,
        fromCave: cave.name,
        getToTome: (_, data) => data.toTome ?? data.tomeId ?? '',
        getPath: (_, data) => data.path ?? '/',
        httpTransport: undefined,
    });
    return {
        ...baseConfig,
        transport,
    };
}
