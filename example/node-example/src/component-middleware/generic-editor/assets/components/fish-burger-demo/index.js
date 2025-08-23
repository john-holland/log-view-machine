/**
 * Fish Burger Demo Component
 * Main entry point and exports for the fish burger demo component
 */

import { FishBurgerDemoController } from '../../js/fish-burger-demo/demo-controller.js';
import { initializeDemo, loadCartComponent, testCartFlow } from '../../js/fish-burger-demo/main.js';

// Component class
export class FishBurgerDemoComponent {
    constructor() {
        this.controller = null;
        this.isInitialized = false;
        this.metadata = {
            id: 'fish-burger-demo',
            name: 'Fish Burger Demo',
            version: '1.0.0',
            type: 'demo'
        };
    }

    // Initialize the component
    async initialize() {
        try {
            console.log('Initializing Fish Burger Demo Component...');
            
            // Initialize the demo
            await initializeDemo();
            
            // Create controller instance
            this.controller = new FishBurgerDemoController();
            
            this.isInitialized = true;
            console.log('✅ Fish Burger Demo Component initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Fish Burger Demo Component:', error);
            return false;
        }
    }

    // Get component metadata
    getMetadata() {
        return this.metadata;
    }

    // Get component status
    getStatus() {
        if (!this.isInitialized) {
            return { status: 'not_initialized', message: 'Component not initialized' };
        }
        
        return {
            status: 'active',
            message: 'Component is running',
            connectionMode: this.controller?.getConnectionMode() || 'unknown',
            isInitialized: this.isInitialized
        };
    }

    // Load cart component
    async loadCart() {
        if (!this.isInitialized) {
            throw new Error('Component not initialized');
        }
        
        return await loadCartComponent();
    }

    // Test cart flow
    async testCart() {
        if (!this.isInitialized) {
            throw new Error('Component not initialized');
        }
        
        return await testCartFlow();
    }

    // Switch connection mode
    switchConnectionMode(mode) {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return this.controller.switchConnectionMode(mode);
    }

    // Get current configuration
    getConfiguration() {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return this.controller.getConfig();
    }

    // Update pact test configuration
    async updatePactConfig(config) {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return await this.controller.updatePactConfig(config);
    }

    // Refresh pact test statistics
    async refreshPactStats() {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return await this.controller.refreshPactStats();
    }

    // Reset pact test statistics
    async resetPactStats() {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return await this.controller.resetPactStats();
    }

    // Test live connection
    async testLiveConnection() {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return await this.controller.testLiveConnection();
    }

    // Save live server configuration
    saveLiveConfig() {
        if (!this.isInitialized || !this.controller) {
            throw new Error('Component not initialized');
        }
        
        return this.controller.saveLiveConfig();
    }

    // Destroy component
    destroy() {
        if (this.controller) {
            // Clean up any event listeners or resources
            this.controller = null;
        }
        
        this.isInitialized = false;
        console.log('Fish Burger Demo Component destroyed');
    }
}

// Create and export a singleton instance
export const fishBurgerDemoComponent = new FishBurgerDemoComponent();

// Export individual functions for direct use
export {
    FishBurgerDemoController,
    initializeDemo,
    loadCartComponent,
    testCartFlow
};

// Export for global use (if needed)
if (typeof window !== 'undefined') {
    window.FishBurgerDemoComponent = FishBurgerDemoComponent;
    window.fishBurgerDemoComponent = fishBurgerDemoComponent;
}
