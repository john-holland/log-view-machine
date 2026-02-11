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

const PREFIX = 'cave';
const KEYS_LIST_KEY = '__keys';

function matchesSelector(doc: Record<string, unknown>, selector: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(selector)) {
    if (!(k in doc) || doc[k] !== v) return false;
  }
  return true;
}

/** In-memory implementation when memjs is not available. */
class MemcacheCaveDBAdapterMemory implements CaveDBAdapter {
  readonly tomeId: string;
  private store = new Map<string, Record<string, unknown>>();

  constructor(tomeId: string) {
    this.tomeId = tomeId;
  }

  async put(key: string, value: Record<string, unknown> | unknown): Promise<void> {
    const doc =
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : { value };
    this.store.set(key, { ...doc, _id: key, _tomeId: this.tomeId });
  }

  async get(key: string): Promise<Record<string, unknown> | null> {
    return this.store.get(key) ?? null;
  }

  async find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
    const all = Array.from(this.store.values());
    if (!selector || Object.keys(selector).length === 0) return all;
    return all.filter((doc) => matchesSelector(doc, selector));
  }

  async findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const arr = await this.find(selector);
    return arr[0] ?? null;
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}

function memKey(tomeId: string, key: string): string {
  return `${PREFIX}:${tomeId}:${key}`;
}

/**
 * Create a Memcache Cave DB adapter for the given Tome.
 * Uses memjs when available; otherwise in-memory.
 */
export async function createMemcacheCaveDBAdapter(
  options: MemcacheCaveDBAdapterOptions | string
): Promise<CaveDBAdapter> {
  const opts = typeof options === 'string' ? { tomeId: options } : options;
  const { tomeId } = opts;

  const memjs = await import('memjs').catch(() => null);
  if (!memjs?.Client?.create) {
    return new MemcacheCaveDBAdapterMemory(tomeId);
  }

  type MemClient = { get(key: string): Promise<{ value: Buffer | null }>; set(key: string, value: string, opts?: unknown): Promise<boolean>; close(): void };
  const client: MemClient = (opts.client as MemClient) ?? memjs.Client.create(opts.servers ?? 'localhost:11211');

  async function readKeys(): Promise<string[]> {
    const res = await client.get(memKey(tomeId, KEYS_LIST_KEY));
    if (!res?.value) return [];
    try {
      const arr = JSON.parse(res.value.toString()) as string[];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  async function writeKeys(keys: string[]): Promise<void> {
    await client.set(memKey(tomeId, KEYS_LIST_KEY), JSON.stringify(keys), {});
  }

  return {
    get tomeId() {
      return tomeId;
    },
    async put(key: string, value: Record<string, unknown> | unknown): Promise<void> {
      const doc =
        typeof value === 'object' && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : { value };
      const stored = { ...doc, _id: key, _tomeId: tomeId };
      const k = memKey(tomeId, key);
      await client.set(k, JSON.stringify(stored), {});
      const keys = await readKeys();
      if (!keys.includes(key)) {
        keys.push(key);
        await writeKeys(keys);
      }
    },
    async get(key: string): Promise<Record<string, unknown> | null> {
      const res = await client.get(memKey(tomeId, key));
      if (!res?.value) return null;
      return JSON.parse(res.value.toString()) as Record<string, unknown>;
    },
    async find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
      const keys = await readKeys();
      const items: Array<Record<string, unknown>> = [];
      for (const key of keys) {
        if (key === KEYS_LIST_KEY) continue;
        const res = await client.get(memKey(tomeId, key));
        if (res?.value) items.push(JSON.parse(res.value.toString()) as Record<string, unknown>);
      }
      if (!selector || Object.keys(selector).length === 0) return items;
      return items.filter((doc) => matchesSelector(doc, selector));
    },
    async findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
      const arr = await this.find(selector);
      return arr[0] ?? null;
    },
    async close(): Promise<void> {
      client.close();
    },
  };
}
