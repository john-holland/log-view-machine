/**
 * Build a persistence registry from tome configs and CaveDB adapter factories.
 * Each Tome with persistence.enabled and persistence.adapter gets the corresponding adapter;
 * others fall back to duckdb when getCaveDBAdapter(tomeId) is called (lazy).
 * Factories: { duckdb, dynamodb?, redis?, memcache? }. Values are (options) => adapter or async (options) => adapter.
 */

import { createDuckDBCaveDBAdapter } from 'duckdb-cavedb-adapter';

const defaultDuckdbFactory = (opts) => createDuckDBCaveDBAdapter(opts);

/**
 * @param {Array<{ id: string; persistence?: { enabled?: boolean; adapter?: string; config?: Record<string, any> } }>} tomeConfigs
 * @param {{ duckdb?: (opts: any) => any; dynamodb?: (opts: any) => Promise<any>; redis?: (opts: any) => Promise<any>; memcache?: (opts: any) => Promise<any> }} factories
 * @returns {Promise<Map<string, import('log-view-machine').CaveDBAdapter>>}
 */
export async function buildPersistenceRegistry(tomeConfigs, factories = {}) {
  const duckdb = factories.duckdb ?? defaultDuckdbFactory;
  const dynamodb = factories.dynamodb ?? null;
  const redis = factories.redis ?? null;
  const memcache = factories.memcache ?? null;

  const registry = new Map();
  for (const config of tomeConfigs) {
    const p = config.persistence;
    if (!p?.enabled) continue;
    const adapterName = p.adapter ?? 'duckdb';
    const opts = { tomeId: config.id, ...(p.config || {}) };
    let adapter;
    if (adapterName === 'dynamodb' && dynamodb) {
      adapter = await dynamodb(opts);
    } else if (adapterName === 'redis' && redis) {
      adapter = await redis(opts);
    } else if (adapterName === 'memcache' && memcache) {
      adapter = await memcache(opts);
    } else {
      adapter = duckdb(opts);
    }
    if (adapter) registry.set(config.id, adapter);
  }
  return registry;
}
