/**
 * DuckDB-backed storage adapter for the backend (Node/TomeManager).
 * Optional dependency: use when DuckDB is configured; library works without it.
 * See docs/ARCHITECTURE_AND_CAVE.md.
 */
export interface DuckDBStorageAdapter {
    query(sql: string, params?: unknown[]): Promise<unknown[]>;
    insert(table: string, row: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
}
/**
 * In-memory stub when DuckDB is not installed.
 * Provides the same interface so callers can use it without checking for DuckDB.
 */
export declare class DuckDBStorageStub implements DuckDBStorageAdapter {
    private store;
    query(sql: string, _params?: unknown[]): Promise<unknown[]>;
    insert(table: string, row: Record<string, unknown>): Promise<void>;
    close(): Promise<void>;
}
/**
 * Create a DuckDB storage adapter.
 * If the optional 'duckdb' package is available, returns a real adapter;
 * otherwise returns a stub that works in memory.
 */
export declare function createDuckDBStorage(_options?: {
    path?: string;
    readOnly?: boolean;
}): Promise<DuckDBStorageAdapter>;
export declare function createDuckDBStorageSync(_options?: {
    path?: string;
}): DuckDBStorageAdapter;
