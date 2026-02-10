import React from 'react';
import { RobotCopy } from './RobotCopy';
export interface LogEntry {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    metadata?: any;
}
/** Optional view storage config: RxDB schema and find/findOne specs to populate model. */
export type ViewStorageConfig = {
    schema?: any;
    find?: Record<string, unknown>[] | Record<string, unknown>;
    findOne?: Record<string, unknown>;
    /** Collection name for find/findOne (default when not set is left to db facade). */
    collection?: string;
    /** Collection name for log entries (default 'logEntries'). */
    logCollection?: string;
    /** Schema applied to log entry metadata when inserting (enforces type/property inclusion). */
    logMetadataSchema?: any;
};
export type StateContext<TModel = any> = {
    state: string;
    model: TModel;
    transitions: any[];
    /** Single document from findOne; undefined when no findOne or no db. */
    result?: unknown;
    /** Array from find; [] when no find or no db. */
    results: unknown[];
    /** RxDB database instance or facade when view storage is configured; undefined otherwise. */
    db?: any;
    /** config is spread onto the log entry (override any property); schema applies to metadata. */
    log: (message: string, metadata?: any, config?: Partial<LogEntry>) => Promise<void>;
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
export type StateHandler<TModel = any> = (context: StateContext<TModel>) => Promise<any>;
export type ViewStateMachineConfig<TModel = any> = {
    machineId: string;
    xstateConfig: any;
    /** Optional: stable key for React key / render slot; default uses machineId. */
    renderKey?: string;
    logStates?: Record<string, StateHandler<TModel>>;
    tomeConfig?: any;
    subMachines?: Record<string, ViewStateMachineConfig<any>>;
    /** Optional RxDB database (or facade) for view storage; passed to StateContext and machine context. */
    db?: any;
    /** Optional view storage config: schema, find, findOne to populate model from db. */
    viewStorage?: ViewStorageConfig;
};
export declare class ViewStateMachine<TModel = any> {
    private machine;
    /** Machine definition for useMachine (XState v5 expects machine, not service). */
    private machineDefinition;
    private stateHandlers;
    private serverStateHandlers;
    private viewStack;
    private logEntries;
    private tomeConfig?;
    private isTomeSynchronized;
    private subMachines;
    private robotCopy?;
    private incomingMessageHandlers;
    private db?;
    private viewStorage?;
    /** Per-state view storage config (merged with viewStorage when running that state's handler). */
    private stateViewStorage;
    private machineId;
    private configRenderKey?;
    private renderKeyClearCount;
    private viewKeyListeners;
    constructor(config: ViewStateMachineConfig<TModel>);
    withRobotCopy(robotCopy: RobotCopy): ViewStateMachine<TModel>;
    private setupRobotCopyIncomingHandling;
    registerRobotCopyHandler(eventType: string, handler: (message: any) => void): ViewStateMachine<TModel>;
    handleRobotCopyMessage(message: any): void;
    withState(stateName: string, handler: StateHandler<TModel>, config?: Partial<ViewStorageConfig>): ViewStateMachine<TModel>;
    /** Set view storage config (RxDB schema, find, findOne). Chain after withState or use alone. */
    withViewStorage(config: ViewStorageConfig): ViewStateMachine<TModel>;
    /** Register RxDB schema for view storage; enforces shape on insert. Chain after withState. */
    schema(schema: any): ViewStateMachine<TModel>;
    /** Query RxDB with specs; results update view model when state is entered. Chain after withState. */
    find(specs: Record<string, unknown>[] | Record<string, unknown>): ViewStateMachine<TModel>;
    /** Query RxDB for one document; result updates view model. Chain after withState. */
    findOne(spec: Record<string, unknown>): ViewStateMachine<TModel>;
    withStateAndMessageHandler(stateName: string, handler: StateHandler<TModel>, messageType: string, messageHandler: (message: any) => void): ViewStateMachine<TModel>;
    withServerState(stateName: string, handler: (context: ServerStateContext<TModel>) => void): ViewStateMachine<TModel>;
    withSubMachine(machineId: string, config: ViewStateMachineConfig<any>): ViewStateMachine<TModel>;
    getSubMachine(machineId: string): ViewStateMachine<any> | undefined;
    /**
     * Run find and findOne against db when effectiveStorage has specs.
     * Expects db to expose collections with .find(selector).exec() and .findOne(selector).exec() (RxDB-style).
     */
    private runFindFindOne;
    /** Enforce schema on metadata: ensure required fields from schema exist; coerce types if possible. No-op if no schema. */
    private applyLogMetadataSchema;
    private createStateContext;
    useViewStateMachine(initialModel: TModel): {
        state: import("xstate").StateValue;
        context: any;
        send: (event: any, payload?: import("xstate").EventData) => import("xstate").State<any, any, any, any, any>;
        logEntries: any[];
        viewStack: React.ReactNode[];
        subMachines: Map<string, ViewStateMachine<any>>;
        result: unknown;
        results: unknown[];
        log: (message: string, metadata?: any, config?: Partial<LogEntry>) => Promise<void>;
        view: (component: React.ReactNode) => React.ReactNode;
        clear: () => void;
        transition: (to: string) => void;
        subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => ViewStateMachine<any>;
        getSubMachine: (machineId: string) => ViewStateMachine<any> | undefined;
    };
    on(eventType: string, handler: (event: any) => void): void;
    send(event: any): void;
    start(): void;
    getState(): any;
    /** Returns a stable key for this machine in the render tree (e.g. React key). Updates when clear() is called. */
    getRenderKey(): string;
    /** Subscribes to render-key updates; returns unsubscribe. Callback is invoked when the key changes (e.g. after clear()). */
    observeViewKey(callback: (key: string) => void): () => void;
    private notifyViewKeyListeners;
    /** Stops the machine service. */
    stop(): void;
    executeServerState(stateName: string, model: TModel): Promise<string>;
    private createServerStateContext;
    compose(otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel>;
    synchronizeWithTome(tomeConfig: any): ViewStateMachine<TModel>;
    render(model: TModel): React.ReactNode;
}
export type ServerStateContext<TModel = any> = {
    state: string;
    model: TModel;
    transitions: any[];
    log: (message: string, metadata?: any) => Promise<void>;
    renderHtml: (html: string) => string;
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
    renderedHtml: string;
};
export type ProxyRobotCopyStateViewStateMachineConfig<TModel = any> = ViewStateMachineConfig<TModel> & {
    robotCopy: RobotCopy;
    incomingMessageHandlers?: Record<string, (message: any) => void>;
};
export declare class ProxyRobotCopyStateMachine<TModel = any> extends ViewStateMachine<TModel> {
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
    withState(stateName: string, handler: StateHandler<TModel>, _config?: Partial<ViewStorageConfig>): ViewStateMachine<TModel>;
}
export declare function createProxyRobotCopyStateMachine<TModel = any>(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>): ProxyRobotCopyStateMachine<TModel>;
export declare function createViewStateMachine<TModel = any>(config: ViewStateMachineConfig<TModel>): ViewStateMachine<TModel>;
