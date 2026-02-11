/**
 * CaveDB adapter contract (canonical).
 * Storage adapters (duckdb, dynamodb, redis, memcache) implement this for
 * Tome-scoped persistence (put/get/find/findOne). Single source of truth in core.
 */

/** Options bag passed to CaveDB adapter factories; tomeId required, rest adapter-specific. */
export interface CaveDBAdapterOptions {
    tomeId: string;
    [key: string]: unknown;
}

/**
 * CaveDB adapter interface.
 * Per-Tome: each adapter instance is bound to a tomeId and isolates data for that Tome.
 */
export interface CaveDBAdapter {
    readonly tomeId: string;
    /** Put a JSON-serializable value under key. */
    put(key: string, value: Record<string, unknown> | unknown): Promise<void>;
    /** Get value by key. */
    get(key: string): Promise<Record<string, unknown> | null>;
    /** Find documents matching selector (simple key-value match). */
    find(selector?: Record<string, unknown>): Promise<Array<Record<string, unknown>>>;
    /** Find one document matching selector. */
    findOne(selector?: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    /** Close and release resources. */
    close(): Promise<void>;
}

/**
 * Factory type for building CaveDB adapters (used by buildPersistenceRegistry).
 * Accepts options with at least tomeId; returns an adapter implementing CaveDBAdapter.
 */
export type CaveDBAdapterFactory = (options: CaveDBAdapterOptions) => CaveDBAdapter;
