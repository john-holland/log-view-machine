/**
 * duckdb-cavedb-adapter: DuckDB-backed persistence for Cave/Tome.
 * - Arbitrary JSON property put/get.
 * - find(selector) / findOne(selector) for document-style queries (arbitrary JS objects).
 * - Per-Tome: createDuckDBCaveDBAdapter(tomeId) or config for which Tome to adapt.
 * - Optional warehousing and backups (hook points; implementation can be external).
 */
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
export interface DuckDBCaveDBAdapter {
    readonly tomeId: string;
    /** Put a JSON-serializable value under key. */
    put(key: string, value: Record<string, unknown> | unknown): Promise<void>;
    /** Get value by key. */
    get(key: string): Promise<Record<string, unknown> | null>;
    /** Find documents matching selector (arbitrary object; simple key-value match). */
    find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
    /** Find one document matching selector. */
    findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    /** Close and release resources. */
    close(): Promise<void>;
}
/**
 * In-memory implementation (no DuckDB dependency). Use for tests or when DuckDB is not installed.
 */
export declare class DuckDBCaveDBAdapterMemory implements DuckDBCaveDBAdapter {
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
export declare function createDuckDBCaveDBAdapter(options: DuckDBCaveDBAdapterOptions | string): DuckDBCaveDBAdapter;
