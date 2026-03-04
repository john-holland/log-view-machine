/**
 * Integration: CaveRobit + RobotCopy dual binding.
 * Provides a transport factory that resolves transport via CaveRobit for each sendMessage call.
 * Wire this as RobotCopyConfig.transport when using Cave with caveRobit.
 */
import type { CaveInstance } from './Cave';
import { type CaveRobit } from './CaveRobit';
/** Options for creating CaveRobit-aware transport */
export interface CaveRobitTransportOptions {
    /** Cave instance (must have getTransportForTarget and getRenderTarget) */
    cave: CaveInstance;
    /** Optional: CaveRobit instance; when absent, cave must have caveRobit in config */
    caveRobit?: CaveRobit;
    /** Optional: fromCave override (default: cave.name) */
    fromCave?: string;
    /** Optional: extract toTome from action/data (default: data.toTome or data.tomeId) */
    getToTome?: (action: string, data: Record<string, unknown>) => string;
    /** Optional: extract path from action/data for getTransportForTarget */
    getPath?: (action: string, data: Record<string, unknown>) => string;
    /** Fallback: underlying transport when descriptor type is http (e.g. fetch). Pass a { send } object. */
    httpTransport?: {
        send: (action: string, data: Record<string, unknown>) => Promise<unknown>;
    };
}
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
export declare function createCaveRobitTransport(options: CaveRobitTransportOptions): {
    send: (action: string, data: Record<string, unknown>) => Promise<unknown>;
};
/**
 * Wire Cave and RobotCopy for dual binding.
 * Returns a RobotCopy config that can be passed to createRobotCopy, with transport resolved via CaveRobit.
 */
export declare function createRobotCopyConfigWithCaveRobit(cave: CaveInstance, baseConfig?: Record<string, unknown> & {
    nodeBackendUrl?: string;
    apiBasePath?: string;
}): Record<string, unknown>;
//# sourceMappingURL=integrateCaveRobitWithRobotCopy.d.ts.map