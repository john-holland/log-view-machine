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
}
export declare class TomeConnector {
    private connections;
    private robotCopy?;
    constructor(robotCopy?: RobotCopy);
    connect(sourceTome: ViewStateMachine<any>, targetTome: ViewStateMachine<any>, config?: TomeConnectionConfig): string;
    private setupConnection;
    private setupEventForwarding;
    private setupStateForwarding;
    private getStateValue;
    private reverseMap;
    disconnect(connectionId: string): boolean;
    getConnections(): TomeConnection[];
    getConnectionsForTome(tome: ViewStateMachine<any>): TomeConnection[];
    createNetwork(tomes: ViewStateMachine<any>[], config?: TomeConnectionConfig): string[];
    createHubNetwork(hubTome: ViewStateMachine<any>, spokeTomes: ViewStateMachine<any>[], config?: TomeConnectionConfig): string[];
    broadcastEvent(event: any, sourceTome: ViewStateMachine<any>): void;
    getNetworkTopology(): any;
    validateNetwork(): {
        warnings: string[];
        errors: string[];
    };
}
export declare function createTomeConnector(robotCopy?: RobotCopy): TomeConnector;
