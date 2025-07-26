import { ViewStateMachine } from './ViewStateMachine';
export interface MessageBrokerConfig {
    type: 'window-intercom' | 'chrome-message' | 'http-api' | 'graphql';
    config: WindowIntercomConfig | ChromeMessageConfig | HttpApiConfig | GraphQLConfig;
}
export interface WindowIntercomConfig {
    targetOrigin: string;
    messageType: string;
    timeout?: number;
}
export interface ChromeMessageConfig {
    extensionId?: string;
    messageType: string;
    responseTimeout?: number;
}
export interface HttpApiConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
    retryAttempts?: number;
}
export interface GraphQLConfig {
    endpoint: string;
    headers?: Record<string, string>;
    timeout?: number;
    wsEndpoint?: string;
}
export interface RobotCopyConfig {
    machineId: string;
    description?: string;
    messageBrokers: MessageBrokerConfig[];
    autoDiscovery?: boolean;
    clientSpecification?: ClientSpecification;
}
export interface ClientSpecification {
    supportedLanguages: string[];
    autoGenerateClients: boolean;
    includeExamples: boolean;
    includeDocumentation: boolean;
}
export interface RobotCopyMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: Date;
    source: string;
    target: string;
    broker: string;
}
export interface RobotCopyResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
    messageId: string;
}
export declare class RobotCopy {
    private machines;
    private configs;
    private messageBrokers;
    private messageQueue;
    private responseHandlers;
    constructor();
    private initializeDefaultBrokers;
    registerMachine(machineId: string, machine: ViewStateMachine<any>, config: RobotCopyConfig): void;
    registerMessageBroker(type: string, broker: MessageBroker): void;
    sendMessage(message: Omit<RobotCopyMessage, 'id' | 'timestamp'>): Promise<RobotCopyResponse>;
    postToWindow(message: any, targetOrigin?: string): Promise<RobotCopyResponse>;
    postToChrome(message: any, extensionId?: string): Promise<RobotCopyResponse>;
    postToHttp(message: any, endpoint: string): Promise<RobotCopyResponse>;
    postToGraphQL(query: string, variables?: any): Promise<RobotCopyResponse>;
    discover(): RobotCopyDiscovery;
    private analyzeMachineCapabilities;
    private extractGraphQLStates;
    private generateMessageId;
    private handleResponse;
    onResponse(messageId: string, handler: (response: RobotCopyResponse) => void): void;
    getMessageQueue(): RobotCopyMessage[];
    clearMessageQueue(): void;
}
export interface MessageBroker {
    configure(config: any): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
export declare class WindowIntercomBroker implements MessageBroker {
    private config;
    configure(config: WindowIntercomConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
export declare class ChromeMessageBroker implements MessageBroker {
    private config;
    configure(config: ChromeMessageConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
export declare class HttpApiBroker implements MessageBroker {
    private config;
    configure(config: HttpApiConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
export declare class GraphQLBroker implements MessageBroker {
    private config;
    configure(config: GraphQLConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
export interface RobotCopyDiscovery {
    machines: Map<string, ViewStateMachine<any>>;
    messageBrokers: string[];
    configurations: Map<string, RobotCopyConfig>;
    capabilities: Map<string, MachineCapabilities>;
}
export interface MachineCapabilities {
    supportedBrokers: string[];
    autoDiscovery: boolean;
    clientSpecification?: ClientSpecification;
    messageTypes: string[];
    graphQLStates: GraphQLState[];
}
export interface GraphQLState {
    name: string;
    operation: 'query' | 'mutation' | 'subscription';
    query: string;
    variables?: Record<string, string>;
}
export declare function createRobotCopy(): RobotCopy;
