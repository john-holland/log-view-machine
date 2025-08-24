import { ViewStateMachine } from './ViewStateMachine';
import { RobotCopy } from './RobotCopy';
export interface TomeConnection {
    id: string;
    sourceTome: ViewStateMachine<any>;
    targetTome: ViewStateMachine<any>;
    eventMapping: Map<string, string>;
    stateMapping: Map<string, string>;
    bidirectional: boolean;
    filters?: {
        events?: string[];
        states?: string[];
    };
    transformers?: {
        eventTransformer?: (event: any, direction: 'forward' | 'backward') => any;
        stateTransformer?: (state: any, direction: 'forward' | 'backward') => any;
    };
    traceId?: string;
    spanId?: string;
    createdAt: string;
    lastActivity: string;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}
export interface TomeConnectionConfig {
    eventMapping?: Record<string, string>;
    stateMapping?: Record<string, string>;
    bidirectional?: boolean;
    filters?: {
        events?: string[];
        states?: string[];
    };
    transformers?: {
        eventTransformer?: (event: any, direction: 'forward' | 'backward') => any;
        stateTransformer?: (state: any, direction: 'forward' | 'backward') => any;
    };
    enableTracing?: boolean;
    enableHealthMonitoring?: boolean;
    customTraceId?: string;
}
export declare class TomeConnector {
    private connections;
    private robotCopy?;
    private connectionMetrics;
    private healthCheckInterval?;
    private isInitialized;
    constructor(robotCopy?: RobotCopy);
    private initializeRobotCopyIntegration;
    private startHealthMonitoring;
    private performHealthCheck;
    private updateConnectionHealth;
    connect(sourceTome: ViewStateMachine<any>, targetTome: ViewStateMachine<any>, config?: TomeConnectionConfig): Promise<string>;
    private setupConnection;
    private setupEventForwarding;
    private setupStateForwarding;
    private transformStateForBackend;
    private transformStateForKotlin;
    private transformStateForNode;
    private getStateValue;
    private reverseMap;
    disconnect(connectionId: string): Promise<boolean>;
    getConnections(): TomeConnection[];
    getConnectionsForTome(tome: ViewStateMachine<any>): TomeConnection[];
    createNetwork(tomes: ViewStateMachine<any>[], config?: TomeConnectionConfig): Promise<string[]>;
    createHubNetwork(hubTome: ViewStateMachine<any>, spokeTomes: ViewStateMachine<any>[], config?: TomeConnectionConfig): Promise<string[]>;
    broadcastEvent(event: any, sourceTome: ViewStateMachine<any>): Promise<void>;
    getNetworkTopology(): any;
    validateNetwork(): Promise<{
        warnings: string[];
        errors: string[];
    }>;
    private performAdvancedValidation;
    getRobotCopy(): RobotCopy | undefined;
    getConnectionMetrics(): Map<string, any>;
    destroy(): void;
}
export declare function createTomeConnector(robotCopy?: RobotCopy): TomeConnector;
