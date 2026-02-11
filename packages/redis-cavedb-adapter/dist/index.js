/**
 * redis-cavedb-adapter: Redis-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Key format: cave:${tomeId}:${key}; find via SCAN + filter.
 * When ioredis is not available, falls back to in-memory.
 */
const PREFIX = 'cave';
function matchesSelector(doc, selector) {
    for (const [k, v] of Object.entries(selector)) {
        if (!(k in doc) || doc[k] !== v)
            return false;
    }
    return true;
}
/** In-memory implementation when Redis client is not available. */
class RedisCaveDBAdapterMemory {
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
function redisKey(tomeId, key) {
    return `${PREFIX}:${tomeId}:${key}`;
}
/**
 * Create a Redis Cave DB adapter for the given Tome.
 * Uses ioredis when available; otherwise in-memory.
 */
export async function createRedisCaveDBAdapter(options) {
    const opts = typeof options === 'string' ? { tomeId: options } : options;
    const { tomeId } = opts;
    const RedisMod = await import('ioredis').catch(() => null);
    if (!RedisMod?.default) {
        return new RedisCaveDBAdapterMemory(tomeId);
    }
    const RedisCtor = RedisMod.default;
    const redis = opts.client ?? new RedisCtor(opts.url ?? 'redis://localhost:6379');
    return {
        get tomeId() {
            return tomeId;
        },
        async put(key, value) {
            const doc = typeof value === 'object' && value !== null && !Array.isArray(value)
                ? value
                : { value };
            const stored = { ...doc, _id: key, _tomeId: tomeId };
            await redis.set(redisKey(tomeId, key), JSON.stringify(stored));
        },
        async get(key) {
            const raw = await redis.get(redisKey(tomeId, key));
            if (raw == null)
                return null;
            return JSON.parse(raw);
        },
        async find(selector) {
            const pattern = `${PREFIX}:${tomeId}:*`;
            const keys = [];
            let cursor = '0';
            do {
                const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
                const [next, list] = result;
                cursor = next;
                keys.push(...list);
            } while (cursor !== '0');
            const items = [];
            for (const k of keys) {
                const raw = await redis.get(k);
                if (raw)
                    items.push(JSON.parse(raw));
            }
            if (!selector || Object.keys(selector).length === 0)
                return items;
            return items.filter((doc) => matchesSelector(doc, selector));
        },
        async findOne(selector) {
            const arr = await this.find(selector);
            return arr[0] ?? null;
        },
        async close() {
            await redis.quit();
        },
    };
}
