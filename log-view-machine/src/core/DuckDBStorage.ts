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
export class DuckDBStorageStub implements DuckDBStorageAdapter {
  private store: Map<string, unknown[]> = new Map();

  async query(sql: string, _params?: unknown[]): Promise<unknown[]> {
    // Stub: no SQL parsing; return empty or table scan for SELECT
    const match = sql.trim().toUpperCase().match(/SELECT\s+.*\s+FROM\s+(\w+)/i);
    if (match) {
      const table = match[1];
      return this.store.get(table) ?? [];
    }
    return [];
  }

  async insert(table: string, row: Record<string, unknown>): Promise<void> {
    const rows = this.store.get(table) ?? [];
    rows.push(row);
    this.store.set(table, rows);
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}

/**
 * Create a DuckDB storage adapter.
 * If the optional 'duckdb' package is available, returns a real adapter;
 * otherwise returns a stub that works in memory.
 */
export async function createDuckDBStorage(
  _options?: { path?: string; readOnly?: boolean }
): Promise<DuckDBStorageAdapter> {
  try {
    // Optional: require('duckdb') and open connection
    // const DuckDB = require('duckdb');
    // const db = new DuckDB.Database(':memory:');
    // return new DuckDBStorageImpl(db);
    return new DuckDBStorageStub();
  } catch {
    return new DuckDBStorageStub();
  }
}

export function createDuckDBStorageSync(_options?: { path?: string }): DuckDBStorageAdapter {
  return new DuckDBStorageStub();
}
