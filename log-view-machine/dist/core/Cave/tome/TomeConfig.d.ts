/**
 * TomeConfig - Configuration for Tome routing and state management
 *
 * This interface defines how tomes can be configured with routing support,
 * allowing each tome to insert gracefully into a routing hierarchy.
 */
/** Hint for where this machine/tome runs: local (this process), remote (another Cave/service), or same-cave. */
export type LocationHint = 'local' | 'remote' | 'same-cave' | string;
/** Descriptor for reaching a remote Cave/machine (e.g. URL or client config). */
export type RemoteClientDescriptor = string | {
    url?: string;
    [k: string]: unknown;
};
export interface TomeMachineConfig {
    id: string;
    name: string;
    description?: string;
    xstateConfig: any;
    context?: Record<string, any>;
    /** Optional state handlers for view rendering (browser Tomes). Passed to createViewStateMachine. */
    logStates?: Record<string, (context: any) => Promise<any>>;
    dependencies?: string[];
    /**
     * Optional location hint: 'local' | 'remote' | 'same-cave' | URL/identifier.
     * RobotCopy uses this as the default; server adapter can override at runtime.
     */
    location?: LocationHint;
    /** When location is remote: URL or client descriptor for RobotCopy to use when sending. */
    remoteClient?: RemoteClientDescriptor;
}
export interface TomeBinding {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    middleware?: string[];
    guards?: string[];
    transformers?: {
        input?: (data: any) => any;
        output?: (data: any) => any;
    };
}
export interface TomeRouteConfig {
    basePath?: string;
    middleware?: string[];
    cors?: boolean;
    rateLimit?: {
        windowMs: number;
        max: number;
    };
    authentication?: {
        required: boolean;
        type?: 'jwt' | 'api-key' | 'session';
    };
}
import type { Spelunk } from '../Cave';
export interface ModMetadata {
    /** Map of route paths to mod cave/tome IDs that replace them. Supports "*" wildcard. */
    pathReplacements?: Record<string, {
        modCaveId?: string;
        modTomeId?: string;
        /** Optional: full Spelunk structure for complex replacements */
        spelunk?: Spelunk;
    }>;
    /** Links to mod assets (templates, styles, scripts) */
    assetLinks?: {
        templates?: string;
        styles?: string;
        scripts?: string;
        serverUrl?: string;
    };
    /** Spelunk-like map of child caves and tomes to be replaced */
    spelunkMap?: Record<string, {
        /** Route path pattern (supports "*" wildcard) */
        route?: string;
        /** Mod cave ID to replace this child cave */
        modCaveId?: string;
        /** Mod tome ID to replace this child tome */
        modTomeId?: string;
        /** Optional: full Spelunk for nested replacement */
        spelunk?: Spelunk;
    }>;
}
export interface TomeConfig {
    id: string;
    name: string;
    description?: string;
    version?: string;
    /** Optional: stable key for React key / render slot; default uses id. */
    renderKey?: string;
    machines: Record<string, TomeMachineConfig>;
    routing?: {
        basePath?: string;
        routes?: Record<string, TomeBinding>;
        middleware?: string[];
        cors?: boolean;
        rateLimit?: {
            windowMs: number;
            max: number;
        };
        authentication?: {
            required: boolean;
            type?: 'jwt' | 'api-key' | 'session';
        };
    };
    context?: Record<string, any>;
    dependencies?: string[];
    plugins?: string[];
    graphql?: {
        enabled: boolean;
        schema?: string;
        resolvers?: Record<string, any>;
        subscriptions?: boolean;
    };
    logging?: {
        level?: 'debug' | 'info' | 'warn' | 'error';
        format?: 'json' | 'text';
        transports?: string[];
    };
    persistence?: {
        enabled: boolean;
        type?: 'memory' | 'database' | 'file';
        /** Which CaveDB adapter to use for this Tome's store (put/get/find). When set, config is passed to that adapter's factory. */
        adapter?: 'duckdb' | 'dynamodb' | 'redis' | 'memcache';
        /** Adapter-specific options (e.g. tableName, url, region). Passed to the adapter factory when adapter is set. */
        config?: Record<string, any>;
    };
    monitoring?: {
        enabled: boolean;
        metrics?: string[];
        tracing?: boolean;
        healthChecks?: string[];
    };
    /** Optional: indicates this Tome can be replaced by a mod */
    isModableTome?: boolean;
    /** Optional: mod metadata for dynamic replacement */
    modMetadata?: ModMetadata;
    /** Optional: permission spec for this tome (e.g. ">anonymous", ">=user"). Default ">anonymous". */
    permission?: string;
}
export interface TomeInstance {
    id: string;
    config: TomeConfig;
    machines: Map<string, any>;
    router?: any;
    context: Record<string, any>;
    /** True when this Tome has been synchronized with a Cave (e.g. via synchronizeWithCave). */
    readonly isCaveSynchronized: boolean;
    /** Returns a stable key for this Tome in the render tree (e.g. React key). */
    getRenderKey(): string;
    /** Subscribes to render-key updates; returns unsubscribe. */
    observeViewKey(callback: (key: string) => void): () => void;
    start(): Promise<void>;
    stop(): Promise<void>;
    getMachine(id: string): any;
    sendMessage(machineId: string, event: string, data?: any): Promise<any>;
    getState(machineId: string): any;
    updateContext(updates: Record<string, any>): void;
    /** Mark this Tome as synchronized with a Cave. */
    synchronizeWithCave(cave?: unknown): void;
}
export interface TomeManager {
    tomes: Map<string, TomeInstance>;
    registerTome(config: TomeConfig): Promise<TomeInstance>;
    unregisterTome(id: string): Promise<void>;
    getTome(id: string): TomeInstance | undefined;
    startTome(id: string): Promise<void>;
    stopTome(id: string): Promise<void>;
    listTomes(): string[];
}
/**
 * Create a TomeConfig with routing support
 */
export declare function createTomeConfig(config: Partial<TomeConfig>): TomeConfig;
/**
 * Example TomeConfig for Fish Burger system
 */
export declare const FishBurgerTomeConfig: TomeConfig;
/**
 * Example TomeConfig for Editor system
 */
export declare const EditorTomeConfig: TomeConfig;
/**
 * Library TomeConfig - Component library state for the generic editor.
 */
export declare const LibraryTomeConfig: TomeConfig;
/**
 * Cart TomeConfig - Cart state (e.g. cooked burgers, checkout) for the generic editor.
 */
export declare const CartTomeConfig: TomeConfig;
/**
 * Donation TomeConfig - Mod author / sticky-coins (Solana) state for the generic editor.
 */
export declare const DonationTomeConfig: TomeConfig;
