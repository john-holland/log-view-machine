import React from 'react';
import { RobotCopy } from './RobotCopy';
export type StateContext<TModel = any> = {
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
export type StateHandler<TModel = any> = (context: StateContext<TModel>) => Promise<any>;
export type ViewStateMachineConfig<TModel = any> = {
    machineId: string;
    xstateConfig: any;
    logStates?: Record<string, StateHandler<TModel>>;
    tomeConfig?: any;
    subMachines?: Record<string, ViewStateMachineConfig<any>>;
};
export declare class ViewStateMachine<TModel = any> {
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
    compose(otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel>;
    synchronizeWithTome(tomeConfig: any): ViewStateMachine<TModel>;
    render(model: TModel): React.ReactNode;
}
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
    withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel>;
}
export declare function createProxyRobotCopyStateMachine<TModel = any>(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>): ProxyRobotCopyStateMachine<TModel>;
export declare function createViewStateMachine<TModel = any>(config: ViewStateMachineConfig<TModel>): ViewStateMachine<TModel>;
