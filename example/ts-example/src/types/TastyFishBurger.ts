import React from 'react';

export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
    metadata: Record<string, unknown>;
    viewModel: Record<string, unknown>;
}

export type _View = {
    componentView: React.ReactNode | _Transition,
    log: unknown,
    timestamp?: Date
}

export type _Log = {
    log: unknown,
    timestamp?: Date
}

export type _Clear = {
    timestamp?: Date
}

export type _Transition = {
    transition: string,
    timestamp?: Date
}

export const View = (componentView: React.ReactNode | _Transition, log: unknown) => {
    return {
        "componentView": componentView,
        "log": log,
        // add timestamp on consumption
    } as any as _View
}

export const Log = (log: unknown) => {
    return {
        "log": log,
        // add timestamp on consumption
    } as any as _Log;
}

export const Clear = () => {
    return {} as any as _Clear;
}

export interface StateTransition {
    from: string;
    to: string;
    timestamp: string;
}

export interface QueueEntry {
    id: string;
    stateMachine: string;
    transition: StateTransition;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
    error?: string;
}

export interface ViewModel {
    currentState: string;
    transitions: StateTransition[];
    logEntries: LogEntry[];
    isStable: boolean;
    isHungry?: boolean;
}

export interface FishBurgerData {
    orderId: string;
    name: string;
    price: number;
    ingredients: string[];
    cookingTime: number;
    temperature: number;
    currentState: string;
    transitions: StateTransition[];
    logEntries: LogEntry[];
}

export interface StateMachine {
    name: string;
    viewModel: ViewModel;
    processTransition(transition: StateTransition): Promise<void>;
    addLogEntry(entry: LogEntry): void;
    isStable(): boolean;
    getCurrentState(): string;
}

export interface CartItem {
    id: string;
    burger: FishBurgerData;
    quantity: number;
}

export interface StateMachineUpdate {
    id: string;
    currentState: string;
    transitions: StateTransition[];
    logEntries: LogEntry[];
    isStable: boolean;
}

export interface MessageUpdate {
    id: string;
    content: string;
    timestamp: string;
}

// GraphQL Queries and Subscriptions
export const STATE_MACHINE_UPDATES = `
    subscription StateMachineUpdates($id: ID!) {
        stateMachineUpdates(id: $id) {
            id
            currentState
            transitions {
                from
                to
                timestamp
            }
            logEntries {
                id
                timestamp
                level
                message
                metadata
                viewModel
            }
            isStable
        }
    }
`;