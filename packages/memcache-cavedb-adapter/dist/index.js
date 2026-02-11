/**
 * memcache-cavedb-adapter: Memcached-backed persistence for Cave/Tome.
 * Implements CaveDBAdapter from log-view-machine. Key format: cave:${tomeId}:${key}.
 * find/findOne: we store a key list at cave:${tomeId}:__keys and fetch values by key. Memcached has no native list-by-prefix.
 * When memjs is not available, falls back to in-memory.
 */
const PREFIX = 'cave';
const KEYS_LIST_KEY = '__keys';
function matchesSelector(doc, selector) {
    for (const [k, v] of Object.entries(selector)) {
        if (!(k in doc) || doc[k] !== v)
            return false;
    }
    return true;
}
/** In-memory implementation when memjs is not available. */
class MemcacheCaveDBAdapterMemory {
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
function memKey(tomeId, key) {
    return `${PREFIX}:${tomeId}:${key}`;
}
/**
 * Create a Memcache Cave DB adapter for the given Tome.
 * Uses memjs when available; otherwise in-memory.
 */
export async function createMemcacheCaveDBAdapter(options) {
    const opts = typeof options === 'string' ? { tomeId: options } : options;
    const { tomeId } = opts;
    const memjs = await import('memjs').catch(() => null);
    if (!memjs?.Client?.create) {
        return new MemcacheCaveDBAdapterMemory(tomeId);
    }
    const client = opts.client ?? memjs.Client.create(opts.servers ?? 'localhost:11211');
    async function readKeys() {
        const res = await client.get(memKey(tomeId, KEYS_LIST_KEY));
        if (!res?.value)
            return [];
        try {
            const arr = JSON.parse(res.value.toString());
            return Array.isArray(arr) ? arr : [];
        }
        catch {
            return [];
        }
    }
    async function writeKeys(keys) {
        await client.set(memKey(tomeId, KEYS_LIST_KEY), JSON.stringify(keys), {});
    }
    return {
        get tomeId() {
            return tomeId;
        },
        async put(key, value) {
            const doc = typeof value === 'object' && value !== null && !Array.isArray(value)
                ? value
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
        async get(key) {
            const res = await client.get(memKey(tomeId, key));
            if (!res?.value)
                return null;
            return JSON.parse(res.value.toString());
        },
        async find(selector) {
            const keys = await readKeys();
            const items = [];
            for (const key of keys) {
                if (key === KEYS_LIST_KEY)
                    continue;
                const res = await client.get(memKey(tomeId, key));
                if (res?.value)
                    items.push(JSON.parse(res.value.toString()));
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
            client.close();
        },
    };
}
