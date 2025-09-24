/**
 * TomeClient - Browser-compatible client for TomeManager API
 *
 * This client implements the TomeManager interface but communicates with
 * server-side Tome functionality via HTTP API calls, avoiding the need
 * to bundle Express or other server dependencies in the browser.
 */
import { TomeManager } from './TomeConfig';
import { TomeAPI, TomeInstanceResponse, TomeListResponse, TomeStatusResponse, TomeMessageRequest, TomeMessageResponse } from './TomeAPI';
export declare class TomeClient implements TomeManager {
    tomes: Map<string, any>;
    private api;
    constructor(api: TomeAPI);
    /**
     * Register a new Tome with the server
     */
    registerTome(config: any): Promise<any>;
    /**
     * Unregister a Tome from the server
     */
    unregisterTome(id: string): Promise<void>;
    /**
     * Get a Tome instance (from cache or server)
     */
    getTome(id: string): any | undefined;
    /**
     * Start a Tome on the server
     */
    startTome(id: string): Promise<void>;
    /**
     * Stop a Tome on the server
     */
    stopTome(id: string): Promise<void>;
    /**
     * List all registered Tomes
     */
    listTomes(): string[];
    /**
     * Create a client-side proxy for a Tome instance
     */
    private createTomeInstanceProxy;
    /**
     * Send a message to a Tome machine (convenience method)
     */
    sendTomeMessage(request: TomeMessageRequest): Promise<TomeMessageResponse>;
}
/**
 * HTTP implementation of TomeAPI
 */
export declare class HttpTomeAPI implements TomeAPI {
    baseUrl: string;
    constructor(baseUrl?: string);
    private request;
    registerTome(config: any): Promise<TomeInstanceResponse>;
    unregisterTome(id: string): Promise<void>;
    getTome(id: string): Promise<TomeInstanceResponse | null>;
    listTomes(): Promise<TomeListResponse>;
    startTome(id: string): Promise<void>;
    stopTome(id: string): Promise<void>;
    getTomeStatus(id: string): Promise<TomeStatusResponse>;
    sendTomeMessage(tomeId: string, machineId: string, event: string, data?: any): Promise<any>;
    getTomeMachineState(tomeId: string, machineId: string): Promise<any>;
    getTomeMachineContext(tomeId: string, machineId: string): Promise<any>;
}
/**
 * Factory function to create a TomeClient
 */
export declare function createTomeClient(apiUrl?: string): TomeClient;
