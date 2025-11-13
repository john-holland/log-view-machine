/**
 * StorageService
 *
 * Handles component persistence and retrieval
 * Can be extended to support different storage backends
 */
export interface ComponentMetadata {
    created: number;
    modified: number;
    author?: string;
    version?: string;
}
export interface Component {
    id: string;
    name: string;
    type: string;
    content: string;
    metadata: ComponentMetadata;
}
declare class StorageService {
    private components;
    private storageKey;
    constructor();
    /**
     * Load components from localStorage
     */
    private loadFromLocalStorage;
    /**
     * Save components to localStorage
     */
    private saveToLocalStorage;
    /**
     * Get all components
     */
    listComponents(): Promise<Component[]>;
    /**
     * Get a component by ID
     */
    getComponent(id: string): Promise<Component | null>;
    /**
     * Save a component
     */
    saveComponent(component: Component): Promise<Component>;
    /**
     * Delete a component
     */
    deleteComponent(id: string): Promise<boolean>;
    /**
     * Create a new component with default values
     */
    createComponent(name: string, type?: string): Promise<Component>;
    /**
     * Check if a component exists
     */
    exists(id: string): Promise<boolean>;
    /**
     * Clear all components (useful for testing)
     */
    clearAll(): Promise<void>;
    /**
     * Get storage statistics
     */
    getStats(): Promise<{
        count: number;
        totalSize: number;
    }>;
}
export declare const storageService: StorageService;
export { StorageService };
