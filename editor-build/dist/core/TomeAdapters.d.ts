import React from 'react';
import { ISubMachine } from './TomeConfig';
/**
 * ProxyMachineAdapter
 *
 * Adapter that wraps ProxyRobotCopyStateMachine to implement ISubMachine interface
 */
export declare class ProxyMachineAdapter implements ISubMachine {
    private machine;
    private startTime;
    private errorCount;
    private eventHandlers;
    constructor(machine: any);
    get machineId(): string;
    get machineType(): 'proxy' | 'view' | 'background' | 'content';
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
    sendToChild(_machineId: string, _message: any): Promise<any>;
    broadcast(message: any): Promise<any>;
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
 * ViewMachineAdapter
 *
 * Adapter that wraps ViewStateMachine to implement ISubMachine interface
 */
export declare class ViewMachineAdapter implements ISubMachine {
    private machine;
    private startTime;
    private errorCount;
    private eventHandlers;
    constructor(machine: any);
    get machineId(): string;
    get machineType(): 'proxy' | 'view' | 'background' | 'content';
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
    sendToChild(_machineId: string, _message: any): Promise<any>;
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
 * LazyTomeManager - Only instantiated when needed
 */
export declare class LazyTomeManager {
    private tome;
    private isInitialized;
    private subTomes;
    private eventListeners;
    private renderKey;
    constructor(tome: any);
    private _ensureInitialized;
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
    on(event: string, handler: (data: any) => void): LazyTomeManager;
    off(event: string, handler: (data: any) => void): LazyTomeManager;
    emit(event: string, data: any): LazyTomeManager;
    forceRender(): LazyTomeManager;
    getSubMachine(machineId: string): any;
    getState(): any;
    getContext(): any;
    getHealth(): any;
    route(path: string, method: string, data: any): any;
}
