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
export class ViewStack {
    private stack: ViewStackEntry[] = [];
    private currentView: string = '';
    private lastViewCleared: number = 0;

    /**
     * Append a new view to the stack
     */
    append(key: string, component: React.ReactNode): void {
        this.stack.push({
            key,
            component,
            timestamp: Date.now()
        });
        this.currentView = key;
    }

    /**
     * Clear the entire view stack
     * Resets to empty state and updates lastViewCleared timestamp
     */
    clear(): void {
        this.stack = [];
        this.currentView = '';
        this.lastViewCleared = Date.now();
    }

    /**
     * Compose all views in the stack into a single React fragment
     */
    compose(): React.ReactNode {
        if (this.stack.length === 0) {
            return null;
        }

        if (this.stack.length === 1) {
            return this.stack[0].component;
        }

        // Compose multiple views with unique keys
        return React.createElement(
            React.Fragment,
            null,
            ...this.stack.map((entry, index) =>
                React.createElement(
                    React.Fragment,
                    { key: `${entry.key}-${entry.timestamp}-${index}` },
                    entry.component
                )
            )
        );
    }

    /**
     * Get the current view key
     */
    getCurrentView(): string {
        return this.currentView;
    }

    /**
     * Get the timestamp of the last view clear operation
     */
    getLastViewCleared(): number {
        return this.lastViewCleared;
    }

    /**
     * Get the number of views in the stack
     */
    getStackSize(): number {
        return this.stack.length;
    }

    /**
     * Check if the stack is empty
     */
    isEmpty(): boolean {
        return this.stack.length === 0;
    }

    /**
     * Get a copy of the current stack (for debugging)
     */
    getStack(): ViewStackEntry[] {
        return [...this.stack];
    }
}


