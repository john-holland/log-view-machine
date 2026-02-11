/**
 * memcache-cavedb-adapter: Memcached-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Key format: cave:${tomeId}:${key}.
 * find/findOne: we store a key list at cave:${tomeId}:__keys and fetch values by key. Memcached has no native list-by-prefix.
 * When memjs is not available, falls back to in-memory.
 */
import type { CaveDBAdapter } from 'log-view-machine';
export type { CaveDBAdapter } from 'log-view-machine';
export interface MemcacheCaveDBAdapterOptions {
    tomeId: string;
    servers?: string;
    client?: unknown;
}
/**
 * Create a Memcache Cave DB adapter for the given Tome.
 * Uses memjs when available; otherwise in-memory.
 */
export declare function createMemcacheCaveDBAdapter(options: MemcacheCaveDBAdapterOptions | string): Promise<CaveDBAdapter>;
