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
export class MachineRouter {
    private machines: Map<string, any> = new Map();

    constructor() {
        // Router for managing hierarchical machine communication
    }

    /**
     * Register a machine with a path
     */
    register(path: string, machine: any): void {
        this.machines.set(path, machine);
    }

    /**
     * Unregister a machine
     */
    unregister(path: string): void {
        this.machines.delete(path);
    }

    /**
     * Resolve a path to a machine (absolute paths only)
     * For relative paths, use resolveRelative() with a context machine
     */
    resolve(path: string): any | undefined {
        return this.machines.get(path) || undefined;
    }

    /**
     * Resolve hierarchical paths like "Parent.Child.GrandChild"
     */
    resolveHierarchical(path: string): any | null {
        const parts = path.split('.');
        let current = this.machines.get(parts[0]);
        
        for (let i = 1; i < parts.length && current; i++) {
            // Try to get sub-machine
            if (current.subMachines && current.subMachines.get) {
                current = current.subMachines.get(parts[i]);
            } else if (current.router && current.router.machines) {
                current = current.router.machines.get(parts[i]);
            } else {
                return null;
            }
        }
        
        return current;
    }

    /**
     * Resolve relative paths from a context machine
     * Supports: '.', '..', './', '../', '../../', etc.
     */
    resolveRelative(path: string, contextMachine: any): any | null {
        // Handle absolute paths (no . or ..)
        if (!path.startsWith('.')) {
            return this.resolveHierarchical(path);
        }
        
        // Handle current machine reference (.)
        if (path === '.') {
            return contextMachine;
        }
        
        // Handle parent machine reference (..)
        if (path === '..') {
            return contextMachine.parentMachine || null;
        }
        
        // Handle relative child (./ prefix)
        if (path.startsWith('./')) {
            const subPath = path.substring(2);
            return this.navigateFromMachine(contextMachine, subPath);
        }
        
        // Handle relative parent (../ prefix)
        if (path.startsWith('../')) {
            let remainingPath = path;
            let currentMachine = contextMachine;

            while (remainingPath.startsWith('../') || remainingPath.startsWith('..')) {
                remainingPath = remainingPath.startsWith('../') ?
                    remainingPath.substring(3) :
                    remainingPath.substring(2);

                if (currentMachine.parentMachine) {
                    currentMachine = currentMachine.parentMachine;
                } else {
                    console.warn(`🌊 TomeBase: No parent available for relative path: ${path} fall back to absolute resolution for: ${remainingPath}`);
                    // No parent available, fall back to absolute resolution
                    return remainingPath
                        ? this.resolveHierarchical(remainingPath)
                        : null;
                }
            }

            if (!remainingPath) {
                return currentMachine;
            }

            return this.navigateFromMachine(currentMachine, remainingPath);
        }
        
        return null;
    }

    /**
     * Navigate from a specific machine following a path
     * Supports '/', '.', and '..' as path separators
     */
    private navigateFromMachine(machine: any, path: string): any | null {
        if (!path) return machine;
        
        const parts = path.split('/');
        let current = machine;
        
        for (const part of parts) {
            if (!part || part === '.') {
                continue; // Empty or stay at current
            } else if (part === '..') {
                current = current.parentMachine;
                if (!current) return null;
            } else {
                // Navigate to sub-machine
                if (current.subMachines && current.subMachines.get) {
                    current = current.subMachines.get(part);
                } else if (current.router && current.router.machines) {
                    current = current.router.machines.get(part);
                } else {
                    return null;
                }
                if (!current) return null;
            }
        }
        
        return current;
    }

    /**
     * Send a message to a machine at the specified path
     */
    send(path: string, event: string, data?: any): Promise<any> {
        const machine = this.resolve(path);
        
        if (!machine) {
            console.warn(`🌊 TomeBase: Cannot resolve path "${path}"`);
            return Promise.resolve({ success: false, error: `Path not found: ${path}` });
        }

        // If machine has a send method, use it
        if (machine.send && typeof machine.send === 'function') {
            try {
                const result = machine.send({ type: event, ...data });
                return Promise.resolve(result);
            } catch (error) {
                console.error(`🌊 TomeBase: Error sending to "${path}":`, error);
                return Promise.resolve({ success: false, error });
            }
        }

        console.warn(`🌊 TomeBase: Machine at "${path}" has no send method`);
        return Promise.resolve({ success: false, error: 'No send method' });
    }
}

/**
 * TomeBase
 * 
 * Base class for all Tome modules with observable pattern and view stack integration
 */
export abstract class TomeBase {
    protected viewStack: ViewStack;
    protected viewKeyObservers: Set<ViewKeyObserver>;
    protected currentViewKey: string;
    protected router: MachineRouter;
    protected machine: any;
    protected childTomes: Map<string, TomeBase>;

    constructor() {
        this.viewStack = new ViewStack();
        this.viewKeyObservers = new Set();
        this.currentViewKey = 'initial';
        this.router = new MachineRouter();
        this.machine = null;
        this.childTomes = new Map();
    }

    /**
     * Get the current view key
     */
    getViewKey(): string {
        return this.currentViewKey;
    }

    /**
     * Observe view key changes
     * Returns an unsubscribe function
     */
    observeViewKey(callback: ViewKeyObserver): () => void {
        this.viewKeyObservers.add(callback);
        
        // Immediately call with current value
        callback(this.currentViewKey);
        
        // Return unsubscribe function
        return () => {
            this.viewKeyObservers.delete(callback);
        };
    }

    /**
     * Update the view key and notify observers
     */
    protected updateViewKey(newKey: string): void {
        if (this.currentViewKey !== newKey) {
            this.currentViewKey = newKey;
            this.notifyViewKeyObservers();
        }
    }

    /**
     * Notify all view key observers
     */
    protected notifyViewKeyObservers(): void {
        this.viewKeyObservers.forEach(observer => {
            try {
                observer(this.currentViewKey);
            } catch (error) {
                console.error('🌊 TomeBase: Error in view key observer:', error);
            }
        });
    }

    /**
     * Clear the view stack
     */
    clear(): void {
        this.viewStack.clear();
        this.updateViewKey(`cleared-${Date.now()}`);
    }

    /**
     * Append a view to the stack
     */
    protected appendView(key: string, component: React.ReactNode): void {
        this.viewStack.append(key, component);
        this.updateViewKey(key);
    }

    /**
     * Render the composed view from the view stack
     * Note: For ViewStateMachines, rendering is handled by the view() function in withState
     * This method returns the composed view stack for display
     */
    render(): React.ReactNode {
        // If we have a machine with a render method, use it
        if (this.machine && typeof this.machine.render === 'function') {
            return this.machine.render();
        }
        
        // Otherwise compose from view stack
        return this.viewStack.compose();
    }

    /**
     * Register a child tome
     */
    registerChild(path: string, tome: TomeBase): void {
        this.childTomes.set(path, tome);
        this.router.register(path, tome);
        // Note: Parent-child relationships are handled via machine.parentMachine property
    }

    /**
     * Unregister a child tome
     */
    unregisterChild(path: string): void {
        this.childTomes.delete(path);
        this.router.unregister(path);
    }

    /**
     * Send a message using hierarchical routing
     */
    protected send(path: string, event: string, data?: any): Promise<any> {
        return this.router.send(path, event, data);
    }

    /**
     * Initialize the tome (to be implemented by subclasses)
     */
    abstract initialize(): Promise<void>;

    /**
     * Cleanup resources
     */
    cleanup(): void {
        this.viewKeyObservers.clear();
        this.viewStack.clear();
        this.childTomes.forEach(child => child.cleanup());
        this.childTomes.clear();
    }

    /**
     * Get debug information about the tome
     */
    getDebugInfo(): any {
        return {
            currentViewKey: this.currentViewKey,
            viewStackSize: this.viewStack.getStackSize(),
            observerCount: this.viewKeyObservers.size,
            childTomes: Array.from(this.childTomes.keys()),
            lastViewCleared: this.viewStack.getLastViewCleared()
        };
    }
}

