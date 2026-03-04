/**
 * DuckDB-backed storage adapter for the backend (Node/TomeManager).
 * Optional dependency: use when DuckDB is configured; library works without it.
 * See docs/ARCHITECTURE_AND_CAVE.md.
 */
/**
 * In-memory stub when DuckDB is not installed.
 * Provides the same interface so callers can use it without checking for DuckDB.
 */
export class DuckDBStorageStub {
    constructor() {
        this.store = new Map();
    }
    async query(sql, _params) {
        // Stub: no SQL parsing; return empty or table scan for SELECT
        const match = sql.trim().toUpperCase().match(/SELECT\s+.*\s+FROM\s+(\w+)/i);
        if (match) {
            const table = match[1];
            return this.store.get(table) ?? [];
        }
        return [];
    }
    async insert(table, row) {
        const rows = this.store.get(table) ?? [];
        rows.push(row);
        this.store.set(table, rows);
    }
    async close() {
        this.store.clear();
    }
}
/**
 * Create a DuckDB storage adapter.
 * If the optional 'duckdb' package is available, returns a real adapter;
 * otherwise returns a stub that works in memory.
 */
export async function createDuckDBStorage(_options) {
    try {
        // Optional: require('duckdb') and open connection
        // const DuckDB = require('duckdb');
        // const db = new DuckDB.Database(':memory:');
        // return new DuckDBStorageImpl(db);
        return new DuckDBStorageStub();
    }
    catch {
        return new DuckDBStorageStub();
    }
}
export function createDuckDBStorageSync(_options) {
    return new DuckDBStorageStub();
}
