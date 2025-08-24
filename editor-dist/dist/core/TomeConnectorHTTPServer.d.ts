import { TomeConnectorProxy, APIResponse } from './TomeConnectorProxy';
import { RobotCopy } from './RobotCopy';
export interface HTTPServerConfig {
    port?: number;
    host?: string;
    enableCORS?: boolean;
    enableRateLimiting?: boolean;
    enableLogging?: boolean;
    robotCopy?: RobotCopy;
}
export declare class TomeConnectorHTTPServer {
    private proxy;
    private config;
    private server;
    private isRunning;
    constructor(config?: HTTPServerConfig);
    start(): Promise<void>;
    private createHTTPServer;
    private setupHTTPRoutes;
    handleHTTPRequest(method: string, path: string, body?: any, query?: any, headers?: any): Promise<APIResponse>;
    createConnection(sourceTome: any, targetTome: any, config?: any): Promise<string>;
    getConnections(): Promise<any[]>;
    getTopology(): Promise<any>;
    createRingNetwork(tomes: any[], config?: any): Promise<string[]>;
    createHubNetwork(hubTome: any, spokeTomes: any[], config?: any): Promise<string[]>;
    broadcastEvent(event: any, sourceTome: any): Promise<void>;
    validateNetwork(): Promise<any>;
    getHealth(): Promise<any>;
    getMetrics(): Promise<any>;
    getProxy(): TomeConnectorProxy;
    getTomeConnector(): any;
    getRobotCopy(): RobotCopy;
    isServerRunning(): boolean;
    stop(): Promise<void>;
}
export declare function createTomeConnectorHTTPServer(config?: HTTPServerConfig): TomeConnectorHTTPServer;
