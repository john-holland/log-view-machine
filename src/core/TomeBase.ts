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
    private parent: any = null;

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
     * Set the parent router for upward routing
     */
    setParent(parent: any): void {
        this.parent = parent;
    }

    /**
     * Resolve a path to a machine
     * Supports: './' (child), '..' (parent), '.' (self)
     */
    resolve(path: string): any | null {
        // Self reference
        if (path === '.') {
            return this;
        }

        // Parent reference
        if (path === '..') {
            return this.parent;
        }

        // Child reference (relative path)
        if (path.startsWith('./')) {
            const childPath = path.substring(2);
            const parts = childPath.split('/');
            
            // Direct child
            if (parts.length === 1) {
                return this.machines.get(parts[0]) || null;
            }
            
            // Nested child - resolve recursively
            const firstChild = this.machines.get(parts[0]);
            if (firstChild && firstChild.router) {
                return firstChild.router.resolve('./' + parts.slice(1).join('/'));
            }
            
            return null;
        }

        // Absolute or unrecognized path
        return this.machines.get(path) || null;
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
        tome.router.setParent(this.router);
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

