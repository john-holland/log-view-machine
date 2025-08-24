/**
 * TomeConfig - Configuration for Tome routing and state management
 *
 * This interface defines how tomes can be configured with routing support,
 * allowing each tome to insert gracefully into a routing hierarchy.
 */
export interface TomeMachineConfig {
    id: string;
    name: string;
    description?: string;
    xstateConfig: any;
    context?: Record<string, any>;
    dependencies?: string[];
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
export interface TomeConfig {
    id: string;
    name: string;
    description?: string;
    version?: string;
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
        config?: Record<string, any>;
    };
    monitoring?: {
        enabled: boolean;
        metrics?: string[];
        tracing?: boolean;
        healthChecks?: string[];
    };
}
export interface TomeInstance {
    id: string;
    config: TomeConfig;
    machines: Map<string, any>;
    router?: any;
    context: Record<string, any>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getMachine(id: string): any;
    sendMessage(machineId: string, event: string, data?: any): Promise<any>;
    getState(machineId: string): any;
    updateContext(updates: Record<string, any>): void;
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
