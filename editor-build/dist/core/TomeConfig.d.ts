import React from 'react';
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
    render?: () => React.ReactNode;
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
 * ISubMachine Interface
 *
 * Common interface for all sub-machines in the Tome architecture.
 * Provides standardized access to machine vitals, routing, and messaging capabilities.
 */
export interface ISubMachine {
    readonly machineId: string;
    readonly machineType: 'proxy' | 'view' | 'background' | 'content';
    getState(): any;
    getContext(): any;
    isInState(stateName: string): boolean;
    send(event: string | object): void;
    canHandle(event: string): boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    routeMessage(message: any): Promise<any>;
    sendToParent(message: any): Promise<any>;
    sendToChild(machineId: string, message: any): Promise<any>;
    broadcast(message: any): Promise<any>;
    render?(): React.ReactNode;
    getConfig(): any;
    updateConfig(config: Partial<any>): void;
    getHealth(): {
        status: 'healthy' | 'degraded' | 'unhealthy';
        lastHeartbeat: number;
        errorCount: number;
        uptime: number;
    };
    on(event: string, handler: (data: any) => void): void;
    off(event: string, handler: (data: any) => void): void;
    emit(event: string, data: any): void;
    subscribe(callback: (data: any) => void): {
        unsubscribe: () => void;
    };
}
/**
 * Create a TomeConfig with routing support and lazy TomeManager
 */
export declare function createTomeConfig(config: Partial<TomeConfig>): TomeConfig & {
    tomeManager: any;
    start(): {
        success: boolean;
    };
    stop(): {
        success: boolean;
    };
    registerTome(tome: any): {
        success: boolean;
    };
    startTome(tomeId: string): {
        success: boolean;
    };
    stopTome(tomeId: string): {
        success: boolean;
    };
    getTome(tomeId: string): any;
    on(event: string, handler: (data: any) => void): any;
    off(event: string, handler: (data: any) => void): any;
    emit(event: string, data: any): any;
    forceRender(): any;
    getSubMachine(machineId: string): any;
    subscribe(callback: (data: any) => void): {
        unsubscribe: () => void;
    };
    getState(): any;
    getContext(): any;
    getHealth(): any;
    route(path: string, method: string, data: any): any;
};
/**
 * Example TomeConfig for Fish Burger system
 */
export declare const FishBurgerTomeConfig: TomeConfig;
/**
 * Example TomeConfig for Editor system
 */
export declare const EditorTomeConfig: TomeConfig;
