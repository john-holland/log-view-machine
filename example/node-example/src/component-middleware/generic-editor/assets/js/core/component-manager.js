/**
 * Component Manager
 * Handles component loading, saving, and management
 */

import { setCurrentComponent, markAsChanged, markAsSaved } from './editor-core.js';

export class ComponentManager {
    constructor() {
        this.components = [];
        this.currentComponent = null;
        this.originalComponentData = null;
        this.hasUnsavedChanges = false;
    }

    // Load components from localStorage or API
    async loadComponents() {
        try {
            // Try to load from localStorage first
            const savedComponents = localStorage.getItem('generic-editor-components');
            if (savedComponents) {
                this.components = JSON.parse(savedComponents);
                console.log('Loaded components from localStorage:', this.components.length);
            }

            // If no components exist, load sample components
            if (this.components.length === 0) {
                this.loadSampleComponents();
            }

            // Update the global components array
            window.components = this.components;
            
            return this.components;
        } catch (error) {
            console.error('Error loading components:', error);
            this.loadSampleComponents();
            return this.components;
        }
    }

    // Load sample components for demonstration
    loadSampleComponents() {
        const sampleComponents = [
            {
                id: 'sample-1',
                name: 'Sample Button',
                template: '<button class="sample-btn">Click me!</button>',
                styles: '.sample-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; } .sample-btn:hover { background: #0056b3; }',
                script: 'document.querySelector(".sample-btn").addEventListener("click", () => alert("Button clicked!"));',
                version: '1.0.0'
            },
            {
                id: 'sample-2',
                name: 'Sample Card',
                template: '<div class="sample-card"><h3>Sample Card</h3><p>This is a sample card component.</p></div>',
                styles: '.sample-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); } .sample-card h3 { margin: 0 0 10px 0; color: #333; } .sample-card p { margin: 0; color: #666; }',
                script: '',
                version: '1.0.0'
            }
        ];

        this.components = sampleComponents;
        window.components = this.components;
        this.saveComponentsToStorage();
        console.log('Loaded sample components');
    }

    // Save components to localStorage
    saveComponentsToStorage() {
        try {
            localStorage.setItem('generic-editor-components', JSON.stringify(this.components));
            console.log('Components saved to localStorage');
        } catch (error) {
            console.error('Error saving components to localStorage:', error);
        }
    }

    // Load a specific component
    loadComponent(componentId) {
        const component = this.components.find(c => c.id === componentId);
        if (component) {
            this.currentComponent = component;
            this.originalComponentData = JSON.parse(JSON.stringify(component));
            setCurrentComponent(component);
            this.hasUnsavedChanges = false;
            console.log('Component loaded:', component.name);
            return component;
        } else {
            console.error('Component not found:', componentId);
            return null;
        }
    }

    // Save current component
    saveComponent() {
        if (!this.currentComponent) {
            console.error('No component to save');
            return false;
        }

        try {
            // Find and update the component in the array
            const index = this.components.findIndex(c => c.id === this.currentComponent.id);
            if (index !== -1) {
                this.components[index] = { ...this.currentComponent };
                this.originalComponentData = JSON.parse(JSON.stringify(this.currentComponent));
                this.hasUnsavedChanges = false;
                
                // Save to localStorage
                this.saveComponentsToStorage();
                
                // Update global components array
                window.components = this.components;
                
                markAsSaved();
                console.log('Component saved:', this.currentComponent.name);
                return true;
            } else {
                console.error('Component not found in array');
                return false;
            }
        } catch (error) {
            console.error('Error saving component:', error);
            return false;
        }
    }

    // Create new component
    createComponent(name, template = '', styles = '', script = '') {
        const newComponent = {
            id: 'component-' + Date.now(),
            name: name || 'New Component',
            template: template,
            styles: styles,
            script: script,
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.components.push(newComponent);
        this.saveComponentsToStorage();
        window.components = this.components;
        
        console.log('New component created:', newComponent.name);
        return newComponent;
    }

    // Delete component
    deleteComponent(componentId) {
        const index = this.components.findIndex(c => c.id === componentId);
        if (index !== -1) {
            const deletedComponent = this.components.splice(index, 1)[0];
            this.saveComponentsToStorage();
            window.components = this.components;
            
            // If the deleted component was the current one, clear it
            if (this.currentComponent && this.currentComponent.id === componentId) {
                this.currentComponent = null;
                this.originalComponentData = null;
                setCurrentComponent(null);
            }
            
            console.log('Component deleted:', deletedComponent.name);
            return true;
        }
        return false;
    }

    // Duplicate component
    duplicateComponent(componentId) {
        const originalComponent = this.components.find(c => c.id === componentId);
        if (originalComponent) {
            const duplicatedComponent = {
                ...originalComponent,
                id: 'component-' + Date.now(),
                name: originalComponent.name + ' (Copy)',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.components.push(duplicatedComponent);
            this.saveComponentsToStorage();
            window.components = this.components;
            
            console.log('Component duplicated:', duplicatedComponent.name);
            return duplicatedComponent;
        }
        return null;
    }

    // Update component data
    updateComponent(updates) {
        if (!this.currentComponent) {
            console.error('No component to update');
            return false;
        }

        // Update the current component
        Object.assign(this.currentComponent, updates);
        this.currentComponent.updatedAt = new Date().toISOString();
        
        // Mark as changed
        this.hasUnsavedChanges = true;
        markAsChanged();
        
        console.log('Component updated:', this.currentComponent.name);
        return true;
    }

    // Check if component has unsaved changes
    hasUnsavedChanges() {
        if (!this.currentComponent || !this.originalComponentData) {
            return false;
        }
        
        return JSON.stringify(this.currentComponent) !== JSON.stringify(this.originalComponentData);
    }

    // Get component by ID
    getComponent(componentId) {
        return this.components.find(c => c.id === componentId);
    }

    // Get all components
    getAllComponents() {
        return [...this.components];
    }

    // Search components by name
    searchComponents(query) {
        const searchTerm = query.toLowerCase();
        return this.components.filter(c => 
            c.name.toLowerCase().includes(searchTerm) ||
            c.template.toLowerCase().includes(searchTerm)
        );
    }

    // Export component to JSON
    exportComponent(componentId) {
        const component = this.getComponent(componentId);
        if (component) {
            return JSON.stringify(component, null, 2);
        }
        return null;
    }

    // Import component from JSON
    importComponent(jsonString) {
        try {
            const component = JSON.parse(jsonString);
            
            // Validate required fields
            if (!component.id || !component.name) {
                throw new Error('Invalid component format: missing required fields');
            }
            
            // Generate new ID to avoid conflicts
            component.id = 'component-' + Date.now();
            component.createdAt = new Date().toISOString();
            component.updatedAt = new Date().toISOString();
            
            this.components.push(component);
            this.saveComponentsToStorage();
            window.components = this.components;
            
            console.log('Component imported:', component.name);
            return component;
        } catch (error) {
            console.error('Error importing component:', error);
            return null;
        }
    }
}

// Create and export a singleton instance
export const componentManager = new ComponentManager();
