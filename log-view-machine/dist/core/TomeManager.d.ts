/**
 * TomeManager - Manages Tome instances and routing
 *
 * This class handles the registration, lifecycle, and routing of Tome instances,
 * allowing them to insert gracefully into a routing hierarchy.
 */
import { TomeConfig, TomeInstance, TomeManager as ITomeManager } from './TomeConfig';
import express, { type Application } from 'express';
export declare class TomeManager implements ITomeManager {
    tomes: Map<string, TomeInstance>;
    private app;
    constructor(app: Application);
    /**
     * Register a new Tome with the manager
     */
    registerTome(config: TomeConfig): Promise<TomeInstance>;
    /**
     * Setup routing for a tome
     */
    private setupTomeRouting;
    /**
     * Unregister a Tome
     */
    unregisterTome(id: string): Promise<void>;
    /**
     * Get a Tome by ID
     */
    getTome(id: string): TomeInstance | undefined;
    /**
     * Start a Tome
     */
    startTome(id: string): Promise<void>;
    /**
     * Stop a Tome
     */
    stopTome(id: string): Promise<void>;
    /**
     * List all registered Tome IDs
     */
    listTomes(): string[];
    /**
     * Get status of all tomes
     */
    getTomeStatus(): {
        id: string;
        name: string;
        description: string | undefined;
        version: string | undefined;
        machines: {};
        context: Record<string, any>;
    }[];
    /**
     * Send message to a specific machine in a tome
     */
    sendTomeMessage(tomeId: string, machineId: string, event: string, data?: any): Promise<any>;
    /**
     * Get state of a specific machine in a tome
     */
    getTomeMachineState(tomeId: string, machineId: string): any;
    /**
     * Update context for a tome
     */
    updateTomeContext(tomeId: string, updates: Record<string, any>): void;
}
/**
 * Create a TomeManager instance
 */
export declare function createTomeManager(app: express.Application): TomeManager;
