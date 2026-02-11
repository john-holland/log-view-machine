/**
 * redis-cavedb-adapter: Redis-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Key format: cave:${tomeId}:${key}; find via SCAN + filter.
 * When ioredis is not available, falls back to in-memory.
 */
import type { CaveDBAdapter } from 'log-view-machine';
export type { CaveDBAdapter } from 'log-view-machine';
export interface RedisCaveDBAdapterOptions {
    tomeId: string;
    url?: string;
    client?: unknown;
}
/**
 * Create a Redis Cave DB adapter for the given Tome.
 * Uses ioredis when available; otherwise in-memory.
 */
export declare function createRedisCaveDBAdapter(options: RedisCaveDBAdapterOptions | string): Promise<CaveDBAdapter>;
