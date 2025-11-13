import React from 'react';
/**
 * ViewStackEntry
 *
 * Represents a single entry in the view stack with metadata
 */
export interface ViewStackEntry {
    key: string;
    component: React.ReactNode;
    timestamp: number;
}
/**
 * ViewStack
 *
 * Manages a stack of React components for stateless rendering.
 * Supports clearing and composing views for the Tome architecture.
 */
export declare class ViewStack {
    private stack;
    private currentView;
    private lastViewCleared;
    /**
     * Append a new view to the stack
     */
    append(key: string, component: React.ReactNode): void;
    /**
     * Clear the entire view stack
     * Resets to empty state and updates lastViewCleared timestamp
     */
    clear(): void;
    /**
     * Compose all views in the stack into a single React fragment
     */
    compose(): React.ReactNode;
    /**
     * Get the current view key
     */
    getCurrentView(): string;
    /**
     * Get the timestamp of the last view clear operation
     */
    getLastViewCleared(): number;
    /**
     * Get the number of views in the stack
     */
    getStackSize(): number;
    /**
     * Check if the stack is empty
     */
    isEmpty(): boolean;
    /**
     * Get a copy of the current stack (for debugging)
     */
    getStack(): ViewStackEntry[];
}
