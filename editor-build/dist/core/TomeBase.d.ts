import React from 'react';
import { ViewStack } from './ViewStack';
/**
 * ViewKeyObserver
 *
 * Callback type for observing view key changes
 */
export type ViewKeyObserver = (key: string) => void;
/**
 * MachineRouter
 *
 * Handles routing messages between machines using path-based addressing
 */
export declare class MachineRouter {
    private machines;
    constructor();
    /**
     * Register a machine with a path
     */
    register(path: string, machine: any): void;
    /**
     * Unregister a machine
     */
    unregister(path: string): void;
    /**
     * Resolve a path to a machine (absolute paths only)
     * For relative paths, use resolveRelative() with a context machine
     */
    resolve(path: string): any | null;
    /**
     * Resolve hierarchical paths like "Parent.Child.GrandChild"
     */
    resolveHierarchical(path: string): any | null;
    /**
     * Resolve relative paths from a context machine
     * Supports: '.', '..', './', '../', '../../', etc.
     */
    resolveRelative(path: string, contextMachine: any): any | null;
    /**
     * Navigate from a specific machine following a path
     * Supports '/', '.', and '..' as path separators
     */
    private navigateFromMachine;
    /**
     * Send a message to a machine at the specified path
     */
    send(path: string, event: string, data?: any): Promise<any>;
}
/**
 * TomeBase
 *
 * Base class for all Tome modules with observable pattern and view stack integration
 */
export declare abstract class TomeBase {
    protected viewStack: ViewStack;
    protected viewKeyObservers: Set<ViewKeyObserver>;
    protected currentViewKey: string;
    protected router: MachineRouter;
    protected machine: any;
    protected childTomes: Map<string, TomeBase>;
    constructor();
    /**
     * Get the current view key
     */
    getViewKey(): string;
    /**
     * Observe view key changes
     * Returns an unsubscribe function
     */
    observeViewKey(callback: ViewKeyObserver): () => void;
    /**
     * Update the view key and notify observers
     */
    protected updateViewKey(newKey: string): void;
    /**
     * Notify all view key observers
     */
    protected notifyViewKeyObservers(): void;
    /**
     * Clear the view stack
     */
    clear(): void;
    /**
     * Append a view to the stack
     */
    protected appendView(key: string, component: React.ReactNode): void;
    /**
     * Render the composed view from the view stack
     * Note: For ViewStateMachines, rendering is handled by the view() function in withState
     * This method returns the composed view stack for display
     */
    render(): React.ReactNode;
    /**
     * Register a child tome
     */
    registerChild(path: string, tome: TomeBase): void;
    /**
     * Unregister a child tome
     */
    unregisterChild(path: string): void;
    /**
     * Send a message using hierarchical routing
     */
    protected send(path: string, event: string, data?: any): Promise<any>;
    /**
     * Initialize the tome (to be implemented by subclasses)
     */
    abstract initialize(): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): void;
    /**
     * Get debug information about the tome
     */
    getDebugInfo(): any;
}
