import { createCaveDbViewStorageDb } from '../core/cavedb/caveDbViewStorageFacade';
import type { CaveDBAdapter } from '../core/cavedb/CaveDBAdapter';

function memoryAdapter(tomeId: string): CaveDBAdapter {
  const store = new Map<string, Record<string, unknown>>();
  return {
    tomeId,
    async put(key, value) {
      const doc =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : { value };
      store.set(key, { ...doc, _id: key });
    },
    async get(key) {
      return store.get(key) ?? null;
    },
    async find(selector) {
      const all = [...store.values()];
      if (!selector || Object.keys(selector).length === 0) return all;
      return all.filter((d) => Object.entries(selector).every(([k, v]) => d[k] === v));
    },
    async findOne(selector) {
      const rows = await this.find(selector);
      return rows[0] ?? null;
    },
    async close() {
      store.clear();
    },
  };
}

describe('createCaveDbViewStorageDb', () => {
  it('exposes RxDB-style find/findOne exec for ViewStateMachine runFindFindOne', async () => {
    const adapter = memoryAdapter('t1');
    await adapter.put('k1', { kind: 'row', trace_id: 't-1' });
    const db = createCaveDbViewStorageDb(adapter, 'views');
    const rows = await db.views.find({ trace_id: 't-1' }).exec();
    expect(rows.length).toBe(1);
    const one = await db.views.findOne({ trace_id: 't-1' }).exec();
    expect(one?.trace_id).toBe('t-1');
  });
});
