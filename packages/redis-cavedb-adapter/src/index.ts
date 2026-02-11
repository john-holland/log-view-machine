/**
 * redis-cavedb-adapter: Redis-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Key format: cave:${tomeId}:${key}; find via SCAN + filter.
 * When ioredis is not available, falls back to in-memory.
 */

import type { CaveDBAdapter } from 'log-view-machine';

export type { CaveDBAdapter } from 'log-view-machine';

export interface RedisCaveDBAdapterOptions {
  tomeId: string;
  url?: string;
  client?: unknown;
}

const PREFIX = 'cave';

function matchesSelector(doc: Record<string, unknown>, selector: Record<string, unknown>): boolean {
  for (const [k, v] of Object.entries(selector)) {
    if (!(k in doc) || doc[k] !== v) return false;
  }
  return true;
}

/** In-memory implementation when Redis client is not available. */
class RedisCaveDBAdapterMemory implements CaveDBAdapter {
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

function redisKey(tomeId: string, key: string): string {
  return `${PREFIX}:${tomeId}:${key}`;
}

/**
 * Create a Redis Cave DB adapter for the given Tome.
 * Uses ioredis when available; otherwise in-memory.
 */
export async function createRedisCaveDBAdapter(
  options: RedisCaveDBAdapterOptions | string
): Promise<CaveDBAdapter> {
  const opts = typeof options === 'string' ? { tomeId: options } : options;
  const { tomeId } = opts;

  const RedisMod = await import('ioredis').catch(() => null);
  if (!RedisMod?.default) {
    return new RedisCaveDBAdapterMemory(tomeId);
  }

  type RedisClient = { get(key: string): Promise<string | null>; set(key: string, value: string): Promise<unknown>; scan(cursor: string, ...args: string[]): Promise<[string, string[]]>; quit(): Promise<void> };
  const RedisCtor = RedisMod.default as unknown as new (url?: string) => RedisClient;
  const redis: RedisClient = (opts.client as RedisClient) ?? new RedisCtor(opts.url ?? 'redis://localhost:6379');

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
      await redis.set(redisKey(tomeId, key), JSON.stringify(stored));
    },
    async get(key: string): Promise<Record<string, unknown> | null> {
      const raw = await redis.get(redisKey(tomeId, key));
      if (raw == null) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    },
    async find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
      const pattern = `${PREFIX}:${tomeId}:*`;
      const keys: string[] = [];
      let cursor = '0';
      do {
        const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100') as [string, string[]];
        const [next, list] = result;
        cursor = next;
        keys.push(...list);
      } while (cursor !== '0');
      const items: Array<Record<string, unknown>> = [];
      for (const k of keys) {
        const raw = await redis.get(k);
        if (raw) items.push(JSON.parse(raw) as Record<string, unknown>);
      }
      if (!selector || Object.keys(selector).length === 0) return items;
      return items.filter((doc) => matchesSelector(doc, selector));
    },
    async findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
      const arr = await this.find(selector);
      return arr[0] ?? null;
    },
    async close(): Promise<void> {
      await redis.quit();
    },
  };
}
