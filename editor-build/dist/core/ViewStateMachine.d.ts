import React from 'react';
import { RobotCopy } from './RobotCopy';
import { MachineRouter } from './TomeBase';
/**
 * Routed send function type for services
 * Allows services to communicate with other machines via the router
 */
export type RoutedSend = (target: string, event: string, payload?: any) => Promise<any>;
/**
 * Service meta parameter - provides context and utilities to services
 */
export interface ServiceMeta {
    routedSend?: RoutedSend;
    machineId: string;
    router?: MachineRouter;
    machine?: any;
}
/**
 * XState Action Types for better IDE support
 */
export type XStateAction<TContext = any, TEvent = any> = string | ((context: TContext, event: TEvent) => void) | {
    type: string;
    [key: string]: any;
};
/**
 * XState Action Creator for assign actions
 * @template TContext - The context type
 * @template TEvent - The event type
 */
export type ActionCreator<TContext = any, TEvent = any> = ((context: TContext, event: TEvent) => Partial<TContext>) | Partial<TContext>;
/**
 * XState Actions Configuration
 * @template TContext - The context type
 * @template TEvent - The event type
 */
export type XStateActions<TContext = any, TEvent = any> = {
    [key: string]: XStateAction<TContext, TEvent>;
};
/**
 * Helper function to create assign actions with better IDE support
 * @template TContext - The context type
 * @template TEvent - The event type
 * @param actionCreator - Function or object that creates the context update
 * @returns XState assign action
 *
 * @example
 * ```typescript
 * // Function-based assign
 * const addItem = createAssignAction<MyContext, AddItemEvent>((context, event) => ({
 *   items: [...context.items, event.payload]
 * }));
 *
 * // Object-based assign
 * const clearItems = createAssignAction<MyContext>({ items: [] });
 * ```
 */
export declare function createAssignAction<TContext = any, TEvent = any>(actionCreator: ActionCreator<TContext, TEvent>): import("xstate").AssignAction<unknown, import("xstate").EventObject, import("xstate").EventObject>;
/**
 * Helper function to create named actions for better navigation
 * @template TContext - The context type
 * @template TEvent - The event type
 * @param name - The action name
 * @param action - The action implementation
 * @returns Named action object
 *
 * @example
 * ```typescript
 * const logAction = createNamedAction('logAction', (context, event) => {
 *   console.log('Action executed:', event.type);
 * });
 * ```
 */
export declare function createNamedAction<TContext = any, TEvent = any>(name: string, action: (context: TContext, event: TEvent) => void): {
    [name]: (context: TContext, event: TEvent) => void;
};
export interface LogEntry {
    id: string;
    timestamp: string;
    level: string;
    message: string;
    metadata?: any;
}
/**
 * Context object provided to state handlers in withState() methods
 * @template TModel - The type of the model/context data
 */
export type StateContext<TModel = any> = {
    /** Current state name */
    state: string;
    /** Current model/context data */
    model: TModel;
    /** Available state transitions */
    transitions: any[];
    /**
     * Log a message with optional metadata
     * @param message - The log message
     * @param metadata - Optional metadata object
     */
    log: (message: string, metadata?: any) => Promise<void>;
    /**
     * Render a React component for this state
     * @param component - The React component to render
     * @returns The rendered component
     */
    view: (component: React.ReactNode) => React.ReactNode;
    /** Clear the current view */
    clear: () => void;
    /**
     * Transition to a different state
     * @param to - Target state name
     */
    transition: (to: string) => void;
    /**
     * Send an event to the state machine
     * @param event - Event object with type and optional payload
     */
    send: (event: any) => void;
    /**
     * Register an event handler
     * @param eventName - Name of the event to listen for
     * @param handler - Function to call when event occurs
     */
    on: (eventName: string, handler: () => void) => void;
    /**
     * Create a sub-machine
     * @param machineId - Unique identifier for the sub-machine
     * @param config - Configuration for the sub-machine
     * @returns The created sub-machine instance
     */
    subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => ViewStateMachine<any>;
    /**
     * Get an existing sub-machine
     * @param machineId - Unique identifier of the sub-machine
     * @returns The sub-machine instance or undefined if not found
     */
    getSubMachine: (machineId: string) => ViewStateMachine<any> | undefined;
    graphql: {
        /** Execute a GraphQL query */
        query: (query: string, variables?: any) => Promise<any>;
        /** Execute a GraphQL mutation */
        mutation: (mutation: string, variables?: any) => Promise<any>;
        /** Subscribe to a GraphQL subscription */
        subscription: (subscription: string, variables?: any) => Promise<any>;
    };
};
/**
 * Handler function for state-specific logic
 * @template TModel - The type of the model/context data
 * @param context - The state context containing model, view functions, and utilities
 * @returns Promise that resolves when state handling is complete
 */
export type StateHandler<TModel = any> = (context: StateContext<TModel>) => Promise<any>;
export type ViewStateMachineConfig<TModel = any> = {
    machineId: string;
    xstateConfig: any;
    logStates?: Record<string, StateHandler<TModel>>;
    tomeConfig?: any;
    subMachines?: Record<string, ViewStateMachineConfig<any>>;
    predictableActionArguments?: boolean;
    router?: MachineRouter;
};
export declare class ViewStateMachine<TModel = any> {
    private machine;
    private stateHandlers;
    private serverStateHandlers;
    private viewStack;
    private logEntries;
    private tomeConfig?;
    private isTomeSynchronized;
    private subMachines;
    private robotCopy?;
    private incomingMessageHandlers;
    private router?;
    private machineId;
    private routedSend?;
    parentMachine?: any;
    constructor(config: ViewStateMachineConfig<TModel>);
    withRobotCopy(robotCopy: RobotCopy): ViewStateMachine<TModel>;
    private setupRobotCopyIncomingHandling;
    registerRobotCopyHandler(eventType: string, handler: (message: any) => void): ViewStateMachine<TModel>;
    handleRobotCopyMessage(message: any): void;
    /**
     * Register a state handler for the specified state
     * @param stateName - The name of the state to handle
     * @param handler - Function that handles the state logic
     * @returns This ViewStateMachine instance for method chaining
     *
     * @example
     * ```typescript
     * machine.withState('idle', async ({ state, model, log, view, transition }) => {
     *   await log('Entered idle state');
     *   view(<div>Idle UI</div>);
     * });
     * ```
     */
    withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel>;
    /**
     * Execute state handler with proper context
     * @param stateName - The name of the state to execute
     * @param context - The state context
     */
    private executeStateHandler;
    withStateAndMessageHandler(stateName: string, handler: StateHandler<TModel>, messageType: string, messageHandler: (message: any) => void): ViewStateMachine<TModel>;
    withServerState(stateName: string, handler: (context: ServerStateContext<TModel>) => void): ViewStateMachine<TModel>;
    withSubMachine(machineId: string, config: ViewStateMachineConfig<any>): ViewStateMachine<TModel>;
    getSubMachine(machineId: string): ViewStateMachine<any> | undefined;
    subscribe(callback: (state: any) => void): () => void;
    private createStateContext;
    useViewStateMachine(initialModel: TModel): {
        state: any;
        context: any;
        send: (event: import("xstate").SingleOrArray<import("xstate").Event<import("xstate").EventObject>> | import("xstate").SCXML.Event<import("xstate").EventObject>, payload?: import("xstate").EventData) => import("xstate").State<unknown, import("xstate").EventObject, import("xstate").StateSchema<any>, import("xstate").Typestate<unknown>, unknown>;
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
    /**
     * Set the router for inter-machine communication
     * Creates a routedSend function for services to use
     */
    setRouter(router: MachineRouter): void;
    /**
     * Create a routed send function that supports relative paths
     * This function is passed to services via the meta parameter
     */
    private createRoutedSendForContext;
    /**
     * Wrap services to provide meta parameter with routedSend and other utilities
     */
    private wrapServices;
    on(eventType: string, handler: (event: any) => void): void;
    send(event: any): void;
    start(): Promise<void>;
    getState(): any;
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
    private proxyIncomingMessageHandlers;
    constructor(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>);
    private setupIncomingMessageHandling;
    send(event: any): Promise<void>;
    registerIncomingHandler(eventType: string, handler: (message: any) => void): void;
    handleIncomingMessage(message: any): void;
    render(_model: TModel): React.ReactNode;
    useViewStateMachine(_initialModel: TModel): any;
    compose(_otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel>;
    synchronizeWithTome(_tomeConfig: any): ViewStateMachine<TModel>;
    withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel>;
}
export declare function createProxyRobotCopyStateMachine<TModel = any>(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>): ProxyRobotCopyStateMachine<TModel>;
export declare function createProxyRobotCopyStateMachine<TModel = any>(config: Omit<ProxyRobotCopyStateViewStateMachineConfig<TModel>, 'predictableActionArguments'>, predictableActionArguments?: boolean): ProxyRobotCopyStateMachine<TModel>;
export declare function createViewStateMachine<TModel = any>(config: ViewStateMachineConfig<TModel>): ViewStateMachine<TModel>;
export declare function createViewStateMachine<TModel = any>(config: Omit<ViewStateMachineConfig<TModel>, 'predictableActionArguments'>, predictableActionArguments?: boolean): ViewStateMachine<TModel>;
