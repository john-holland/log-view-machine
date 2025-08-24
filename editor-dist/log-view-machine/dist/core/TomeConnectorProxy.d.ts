import { TomeConnector } from './TomeConnector';
import { RobotCopy } from './RobotCopy';
export interface TomeConnectorProxyConfig {
    robotCopy?: RobotCopy;
    apiPort?: number;
    enableHealthChecks?: boolean;
    enableMetrics?: boolean;
    cors?: {
        origin: string | string[];
        credentials?: boolean;
    };
    rateLimiting?: {
        windowMs: number;
        maxRequests: number;
    };
}
export interface APIRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    body?: any;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    traceId?: string;
    spanId?: string;
}
export interface APIResponse {
    success: boolean;
    data?: any;
    error?: string;
    traceId: string;
    spanId: string;
    timestamp: string;
    duration: number;
}
export declare class TomeConnectorProxy {
    private tomeConnector;
    private robotCopy;
    private config;
    private apiRoutes;
    private healthCheckInterval?;
    private metrics;
    constructor(config?: TomeConnectorProxyConfig);
    private initialize;
    private setupAPIRoutes;
    private handleCreateConnection;
    private handleGetConnections;
    private handleGetConnection;
    private handleDeleteConnection;
    private handleGetTopology;
    private handleCreateRingNetwork;
    private handleCreateHubNetwork;
    private handleHealthCheck;
    private handleGetMetrics;
    private handleBroadcastEvent;
    private handleValidateNetwork;
    handleAPIRequest(request: APIRequest): Promise<APIResponse>;
    private startHealthMonitoring;
    getTomeConnector(): TomeConnector;
    getRobotCopy(): RobotCopy;
    getMetrics(): Map<string, any>;
    destroy(): void;
}
export declare function createTomeConnectorProxy(config?: TomeConnectorProxyConfig): TomeConnectorProxy;
