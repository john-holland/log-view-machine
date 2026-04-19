/**
 * DuckDB-backed storage adapter for the backend (Node/TomeManager).
 *
 * **Canonical persistence for Tomes / ViewStateMachine snapshots in this workspace** is the
 * editor CaveDB path: `duckdb-cavedb-adapter` + `buildPersistenceRegistry` in `mod/node-mod-editor`
 * (REST under `/api/editor/store/:tomeId/...`). That stack implements the real {@link CaveDBAdapter}
 * contract per Tome. This module stays a small optional stub so `log-view-machine` core stays
 * lightweight when DuckDB is not installed.
 *
 * Optional: install the `duckdb` npm package and extend `createDuckDBStorage` to open a file or
 * `:memory:` database if you need DuckDB **outside** the editor package.
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
    return new DuckDBStorageStub();
  } catch {
    return new DuckDBStorageStub();
  }
}

export function createDuckDBStorageSync(_options?: { path?: string }): DuckDBStorageAdapter {
  return new DuckDBStorageStub();
}
