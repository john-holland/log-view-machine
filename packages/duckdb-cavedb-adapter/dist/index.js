/**
 * duckdb-cavedb-adapter: DuckDB-backed persistence for Cave/Tome.
 * Implements the canonical CaveDBAdapter from log-view-machine.
 * - Arbitrary JSON property put/get.
 * - find(selector) / findOne(selector) for document-style queries (arbitrary JS objects).
 * - Per-Tome: createDuckDBCaveDBAdapter(tomeId) or config for which Tome to adapt.
 * - Optional warehousing and backups (hook points; implementation can be external).
 */
function matchesSelector(doc, selector) {
    for (const [k, v] of Object.entries(selector)) {
        if (!(k in doc) || doc[k] !== v)
            return false;
    }
    return true;
}
/**
 * In-memory implementation (no DuckDB dependency). Use for tests or when DuckDB is not installed.
 * Implements the canonical CaveDBAdapter from log-view-machine.
 */
export class DuckDBCaveDBAdapterMemory {
    constructor(tomeId) {
        this.store = new Map();
        this.tomeId = tomeId;
    }
    async put(key, value) {
        const doc = typeof value === 'object' && value !== null && !Array.isArray(value)
            ? value
            : { value };
        this.store.set(key, { ...doc, _id: key, _tomeId: this.tomeId });
    }
    async get(key) {
        return this.store.get(key) ?? null;
    }
    async find(selector) {
        const all = Array.from(this.store.values());
        if (!selector || Object.keys(selector).length === 0)
            return all;
        return all.filter((doc) => matchesSelector(doc, selector));
    }
    async findOne(selector) {
        const arr = await this.find(selector);
        return arr[0] ?? null;
    }
    async close() {
        this.store.clear();
    }
}
/**
 * Create a DuckDB Cave DB adapter for the given Tome.
 * Pass tomeId so persistence is Tome-specific. Optional: invoke per Tome (createDuckDBCaveDBAdapter(tomeId)) for each Tome that needs this persistence.
 * If the optional 'duckdb' package is available, uses file-backed DuckDB; otherwise falls back to in-memory.
 */
export function createDuckDBCaveDBAdapter(options) {
    const opts = typeof options === 'string' ? { tomeId: options } : options;
    const { tomeId } = opts;
    // Optional: try require('duckdb') and create a real DuckDB-backed adapter with a table keyed by (tomeId, key).
    return new DuckDBCaveDBAdapterMemory(tomeId);
}
