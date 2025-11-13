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

class StorageService {
    private components: Map<string, Component> = new Map();
    private storageKey = 'tome-editor-components';

    constructor() {
        this.loadFromLocalStorage();
    }

    /**
     * Load components from localStorage
     */
    private loadFromLocalStorage(): void {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const data = window.localStorage.getItem(this.storageKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    this.components = new Map(Object.entries(parsed));
                    console.log('💾 StorageService: Loaded', this.components.size, 'components from localStorage');
                }
            }
        } catch (error) {
            console.error('💾 StorageService: Failed to load from localStorage', error);
        }
    }

    /**
     * Save components to localStorage
     */
    private saveToLocalStorage(): void {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const data = Object.fromEntries(this.components);
                window.localStorage.setItem(this.storageKey, JSON.stringify(data));
                console.log('💾 StorageService: Saved', this.components.size, 'components to localStorage');
            }
        } catch (error) {
            console.error('💾 StorageService: Failed to save to localStorage', error);
        }
    }

    /**
     * Get all components
     */
    async listComponents(): Promise<Component[]> {
        return Array.from(this.components.values());
    }

    /**
     * Get a component by ID
     */
    async getComponent(id: string): Promise<Component | null> {
        const component = this.components.get(id);
        if (!component) {
            console.warn('💾 StorageService: Component not found:', id);
            return null;
        }
        return component;
    }

    /**
     * Save a component
     */
    async saveComponent(component: Component): Promise<Component> {
        const now = Date.now();
        
        const existing = this.components.get(component.id);
        const savedComponent: Component = {
            ...component,
            metadata: {
                ...component.metadata,
                created: existing?.metadata.created || now,
                modified: now
            }
        };

        this.components.set(component.id, savedComponent);
        this.saveToLocalStorage();

        console.log('💾 StorageService: Saved component:', savedComponent.id);
        return savedComponent;
    }

    /**
     * Delete a component
     */
    async deleteComponent(id: string): Promise<boolean> {
        const existed = this.components.has(id);
        this.components.delete(id);
        
        if (existed) {
            this.saveToLocalStorage();
            console.log('💾 StorageService: Deleted component:', id);
        } else {
            console.warn('💾 StorageService: Component to delete not found:', id);
        }

        return existed;
    }

    /**
     * Create a new component with default values
     */
    async createComponent(name: string, type: string = 'generic'): Promise<Component> {
        const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const component: Component = {
            id,
            name,
            type,
            content: '',
            metadata: {
                created: Date.now(),
                modified: Date.now()
            }
        };

        return this.saveComponent(component);
    }

    /**
     * Check if a component exists
     */
    async exists(id: string): Promise<boolean> {
        return this.components.has(id);
    }

    /**
     * Clear all components (useful for testing)
     */
    async clearAll(): Promise<void> {
        this.components.clear();
        this.saveToLocalStorage();
        console.log('💾 StorageService: Cleared all components');
    }

    /**
     * Get storage statistics
     */
    async getStats(): Promise<{ count: number; totalSize: number }> {
        const components = Array.from(this.components.values());
        const totalSize = JSON.stringify(components).length;
        
        return {
            count: components.length,
            totalSize
        };
    }
}

// Export singleton instance
export const storageService = new StorageService();

// Export class for testing
export { StorageService };

