/**
 * duckdb-cavedb-adapter: DuckDB-backed persistence for Cave/Tome.
 * Implements the canonical CaveDBAdapter from log-view-machine.
 * - Arbitrary JSON property put/get.
 * - find(selector) / findOne(selector) for document-style queries (arbitrary JS objects).
 * - Per-Tome: createDuckDBCaveDBAdapter(tomeId) or config for which Tome to adapt.
 * - Optional warehousing and backups (hook points; implementation can be external).
 */
import type { CaveDBAdapter } from 'log-view-machine';
export type { CaveDBAdapter } from 'log-view-machine';
export interface DuckDBCaveDBAdapterOptions {
    /** Tome id this adapter is for (isolates data per Tome). */
    tomeId: string;
    /** DuckDB path; default :memory: or a file path for persistence. */
    path?: string;
    /** Optional: enable automatic warehousing (copy/archive); adapter exposes hook. */
    warehousing?: {
        enabled?: boolean;
        intervalMs?: number;
    };
    /** Optional: backup path or callback for backups. */
    backup?: {
        path?: string;
        onBackup?: (path: string) => Promise<void>;
    };
}
/** DuckDB CaveDB adapter; extends canonical CaveDBAdapter from log-view-machine. */
export interface DuckDBCaveDBAdapter extends CaveDBAdapter {
}
/**
 * In-memory implementation (no DuckDB dependency). Use for tests or when DuckDB is not installed.
 * Implements the canonical CaveDBAdapter from log-view-machine.
 */
export declare class DuckDBCaveDBAdapterMemory implements CaveDBAdapter {
    readonly tomeId: string;
    private store;
    constructor(tomeId: string);
    put(key: string, value: Record<string, unknown> | unknown): Promise<void>;
    get(key: string): Promise<Record<string, unknown> | null>;
    find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
    findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    close(): Promise<void>;
}
/**
 * Create a DuckDB Cave DB adapter for the given Tome.
 * Pass tomeId so persistence is Tome-specific. Optional: invoke per Tome (createDuckDBCaveDBAdapter(tomeId)) for each Tome that needs this persistence.
 * If the optional 'duckdb' package is available, uses file-backed DuckDB; otherwise falls back to in-memory.
 */
export declare function createDuckDBCaveDBAdapter(options: DuckDBCaveDBAdapterOptions | string): CaveDBAdapter;
