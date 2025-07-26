import * as xstate from 'xstate';
import React from 'react';

interface MessageBrokerConfig {
    type: 'window-intercom' | 'chrome-message' | 'http-api' | 'graphql';
    config: WindowIntercomConfig | ChromeMessageConfig | HttpApiConfig | GraphQLConfig;
}
interface WindowIntercomConfig {
    targetOrigin: string;
    messageType: string;
    timeout?: number;
}
interface ChromeMessageConfig {
    extensionId?: string;
    messageType: string;
    responseTimeout?: number;
}
interface HttpApiConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
    retryAttempts?: number;
}
interface GraphQLConfig {
    endpoint: string;
    headers?: Record<string, string>;
    timeout?: number;
    wsEndpoint?: string;
}
interface RobotCopyConfig {
    machineId: string;
    description?: string;
    messageBrokers: MessageBrokerConfig[];
    autoDiscovery?: boolean;
    clientSpecification?: ClientSpecification;
}
interface ClientSpecification {
    supportedLanguages: string[];
    autoGenerateClients: boolean;
    includeExamples: boolean;
    includeDocumentation: boolean;
}
interface RobotCopyMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: Date;
    source: string;
    target: string;
    broker: string;
}
interface RobotCopyResponse {
    success: boolean;
    data?: any;
    error?: string;
    timestamp: Date;
    messageId: string;
}
declare class RobotCopy {
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
interface MessageBroker {
    configure(config: any): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
declare class WindowIntercomBroker implements MessageBroker {
    private config;
    configure(config: WindowIntercomConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
declare class ChromeMessageBroker implements MessageBroker {
    private config;
    configure(config: ChromeMessageConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
declare class HttpApiBroker implements MessageBroker {
    private config;
    configure(config: HttpApiConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
declare class GraphQLBroker implements MessageBroker {
    private config;
    configure(config: GraphQLConfig): void;
    send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}
interface RobotCopyDiscovery {
    machines: Map<string, ViewStateMachine<any>>;
    messageBrokers: string[];
    configurations: Map<string, RobotCopyConfig>;
    capabilities: Map<string, MachineCapabilities>;
}
interface MachineCapabilities {
    supportedBrokers: string[];
    autoDiscovery: boolean;
    clientSpecification?: ClientSpecification;
    messageTypes: string[];
    graphQLStates: GraphQLState[];
}
interface GraphQLState {
    name: string;
    operation: 'query' | 'mutation' | 'subscription';
    query: string;
    variables?: Record<string, string>;
}
declare function createRobotCopy(): RobotCopy;

type StateContext<TModel = any> = {
    state: string;
    model: TModel;
    transitions: any[];
    log: (message: string, metadata?: any) => Promise<void>;
    view: (component: React.ReactNode) => React.ReactNode;
    clear: () => void;
    transition: (to: string) => void;
    send: (event: any) => void;
    on: (eventName: string, handler: () => void) => void;
    subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => ViewStateMachine<any>;
    getSubMachine: (machineId: string) => ViewStateMachine<any> | undefined;
    graphql: {
        query: (query: string, variables?: any) => Promise<any>;
        mutation: (mutation: string, variables?: any) => Promise<any>;
        subscription: (subscription: string, variables?: any) => Promise<any>;
    };
};
type StateHandler<TModel = any> = (context: StateContext<TModel>) => Promise<any>;
type ViewStateMachineConfig<TModel = any> = {
    machineId: string;
    xstateConfig: any;
    logStates?: Record<string, StateHandler<TModel>>;
    tomeConfig?: any;
    subMachines?: Record<string, ViewStateMachineConfig<any>>;
};
declare class ViewStateMachine<TModel = any> {
    private machine;
    private stateHandlers;
    private viewStack;
    private logEntries;
    private tomeConfig?;
    private isTomeSynchronized;
    private subMachines;
    private robotCopy?;
    private incomingMessageHandlers;
    constructor(config: ViewStateMachineConfig<TModel>);
    withRobotCopy(robotCopy: RobotCopy): ViewStateMachine<TModel>;
    private setupRobotCopyIncomingHandling;
    registerRobotCopyHandler(eventType: string, handler: (message: any) => void): ViewStateMachine<TModel>;
    handleRobotCopyMessage(message: any): void;
    withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel>;
    withStateAndMessageHandler(stateName: string, handler: StateHandler<TModel>, messageType: string, messageHandler: (message: any) => void): ViewStateMachine<TModel>;
    withSubMachine(machineId: string, config: ViewStateMachineConfig<any>): ViewStateMachine<TModel>;
    getSubMachine(machineId: string): ViewStateMachine<any> | undefined;
    private createStateContext;
    useViewStateMachine(initialModel: TModel): {
        state: any;
        context: any;
        send: (event: xstate.SingleOrArray<xstate.Event<xstate.EventObject>> | xstate.SCXML.Event<xstate.EventObject>, payload?: xstate.EventData) => xstate.State<unknown, xstate.EventObject, xstate.StateSchema<any>, xstate.Typestate<unknown>, unknown>;
        logEntries: any[];
        viewStack: React.ReactNode[];
        subMachines: Map<string, ViewStateMachine<any>>;
        log: (message: string, metadata?: any) => Promise<void>;
        view: (component: React.ReactNode) => React.ReactNode;
        clear: () => void;
        transition: (to: string) => void;
        subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => ViewStateMachine<any>;
        getSubMachine: (machineId: string) => ViewStateMachine<any> | undefined;
    };
    compose(otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel>;
    synchronizeWithTome(tomeConfig: any): ViewStateMachine<TModel>;
    render(model: TModel): React.ReactNode;
}
type ProxyRobotCopyStateViewStateMachineConfig<TModel = any> = ViewStateMachineConfig<TModel> & {
    robotCopy: RobotCopy;
    incomingMessageHandlers?: Record<string, (message: any) => void>;
};
declare class ProxyRobotCopyStateMachine<TModel = any> extends ViewStateMachine<TModel> {
    private proxyRobotCopy;
    private proxyMachine;
    private proxyIncomingMessageHandlers;
    constructor(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>);
    private setupIncomingMessageHandling;
    send(event: any): Promise<void>;
    registerIncomingHandler(eventType: string, handler: (message: any) => void): void;
    handleIncomingMessage(message: any): void;
    render(model: TModel): React.ReactNode;
    useViewStateMachine(initialModel: TModel): any;
    compose(otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel>;
    synchronizeWithTome(tomeConfig: any): ViewStateMachine<TModel>;
    withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel>;
}
declare function createProxyRobotCopyStateMachine<TModel = any>(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>): ProxyRobotCopyStateMachine<TModel>;
declare function createViewStateMachine<TModel = any>(config: ViewStateMachineConfig<TModel>): ViewStateMachine<TModel>;

interface ClientGeneratorConfig {
    machineId: string;
    description?: string;
    version?: string;
    author?: string;
    tags?: string[];
    examples?: ClientGeneratorExample[];
}
interface ClientGeneratorExample {
    name: string;
    description: string;
    code: string;
    language: 'typescript' | 'javascript' | 'react' | 'kotlin' | 'java';
}
interface ClientGeneratorDiscovery {
    machines: Map<string, ViewStateMachine<any>>;
    states: Map<string, string[]>;
    events: Map<string, string[]>;
    actions: Map<string, string[]>;
    services: Map<string, string[]>;
    examples: ClientGeneratorExample[];
    documentation: string;
}
declare class ClientGenerator {
    private machines;
    private configs;
    constructor();
    registerMachine(machineId: string, machine: ViewStateMachine<any>, config?: ClientGeneratorConfig): void;
    discover(): ClientGeneratorDiscovery;
    private analyzeMachine;
    private generateDocumentation;
    generateClientCode(language: 'typescript' | 'javascript' | 'react' | 'kotlin' | 'java', machineId?: string): string;
    private generateTypeScriptClient;
    private generateJavaScriptClient;
    private generateReactClient;
    private generateKotlinClient;
    private generateJavaClient;
    generateIntegrationExamples(): ClientGeneratorExample[];
}
declare function createClientGenerator(): ClientGenerator;

export { ChromeMessageBroker, ChromeMessageConfig, ClientGenerator, ClientGeneratorConfig, ClientGeneratorDiscovery, ClientGeneratorExample, GraphQLBroker, GraphQLConfig, GraphQLState, HttpApiBroker, HttpApiConfig, MachineCapabilities, MessageBroker, MessageBrokerConfig, RobotCopy, RobotCopyConfig, RobotCopyDiscovery, RobotCopyMessage, RobotCopyResponse, StateContext, StateHandler, ViewStateMachine, ViewStateMachineConfig, WindowIntercomBroker, WindowIntercomConfig, createClientGenerator, createProxyRobotCopyStateMachine, createRobotCopy, createViewStateMachine };
