/**
 * CaveRobit - Dual of RobotCopy for transport resolution.
 * Maps (fromCave, toTome) to TransportDescriptor for automated transport selection.
 * Composed at CaveConfig level; decorator pattern for adapters.
 */
import type { TransportDescriptor, CaveRobitRouteConfig } from './transport/types';
export type { TransportDescriptor, TransportType, CaveRobitRouteConfig } from './transport/types';
/** Adapter that wraps CaveRobit (decorator pattern). */
export type CaveRobitAdapter = (caveRobit: CaveRobit, config?: Record<string, unknown>) => CaveRobit;
export interface CaveRobitConfig {
    /** Default transport when no route matches */
    defaultTransport?: TransportDescriptor;
    /** Route rules; first match wins (explicit before pattern before default) */
    routes?: CaveRobitRouteConfig[];
    /** Adapters to apply (decorator chain) */
    adapters?: CaveRobitAdapter[];
}
export interface CaveRobit {
    /** Resolve transport for (fromCave, toTome). toTome may come from getRenderTarget(path).tomeId */
    getTransportForTarget(fromCave: string, toTome: string, path?: string): TransportDescriptor | Promise<TransportDescriptor>;
    /** Optional: register a transport strategy for a (fromCave, toTome) pair or pattern */
    registerRoute?(fromCave: string | RegExp, toTome: string | RegExp, descriptor: TransportDescriptor): void;
}
/**
 * Create a CaveRobit instance with route-based transport resolution.
 * Resolution order: explicit route match -> pattern match -> defaultTransport -> in-app.
 */
export declare function createCaveRobit(config?: CaveRobitConfig): CaveRobit;
/** Options for createCaveRobitWithFallback adapter */
export interface CaveRobitFallbackOptions {
    /** Transport to use when inner CaveRobit returns or throws */
    fallbackTransport: TransportDescriptor;
}
/**
 * Decorator adapter: wraps CaveRobit and returns fallbackTransport on error or when inner returns in-app but fallback is preferred.
 * Use when you want a guaranteed fallback (e.g. HTTP) when primary resolution fails.
 */
export declare function createCaveRobitWithFallback(caveRobit: CaveRobit, options: CaveRobitFallbackOptions): CaveRobit;
//# sourceMappingURL=CaveRobit.d.ts.map