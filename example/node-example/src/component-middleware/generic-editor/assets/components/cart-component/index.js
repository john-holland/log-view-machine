/**
 * Cart Component
 * Main entry point and exports for the cart component
 */

import { CartBehavior } from './behaviors/cart-behavior.js';

// Component class
export class CartComponent {
    constructor() {
        this.behavior = null;
        this.isInitialized = false;
        this.metadata = {
            id: 'cart-component',
            name: 'Cart Component',
            version: '1.0.0',
            type: 'interactive'
        };
    }

    // Initialize the component
    async initialize() {
        try {
            console.log('Initializing Cart Component...');
            
            // Create behavior instance
            this.behavior = new CartBehavior();
            
            // Wait for behavior to be ready
            await new Promise(resolve => {
                const checkReady = () => {
                    if (this.behavior.isInitialized) {
                        resolve();
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            });
            
            this.isInitialized = true;
            console.log('✅ Cart Component initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Cart Component:', error);
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
            cartItemCount: this.behavior?.getCartItemCount() || 0,
            cartTotal: this.behavior?.getCartTotal() || 0,
            isCartEmpty: this.behavior?.isCartEmpty() || true
        };
    }

    // Cart management methods
    addIngredient(ingredient, type, price, name) {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.addIngredient(ingredient, type, price, name);
    }

    removeIngredient(ingredientId) {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.removeIngredient(ingredientId);
    }

    updateIngredientQuantity(ingredientId, quantity) {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.updateIngredientQuantity(ingredientId, quantity);
    }

    clearCart() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.clearCart();
    }

    // Cart information methods
    getCart() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.getCart();
    }

    getCartTotal() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.getCartTotal();
    }

    getCartItemCount() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.getCartItemCount();
    }

    isCartEmpty() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.isCartEmpty();
    }

    // Checkout methods
    showCheckout() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.showCheckout();
    }

    hideCheckout() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.hideModal();
    }

    confirmOrder() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.confirmOrder();
    }

    // Utility methods
    saveCartToStorage() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.saveCartToStorage();
    }

    loadCartFromStorage() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.loadCartFromStorage();
    }

    updateCartDisplay() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.updateCartDisplay();
    }

    // Synchronize cart state (useful for restoring state after page reload)
    syncCartState() {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.syncCartState();
    }

    // Event handling
    addEventListener(elementId, event, handler) {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.addEventListener(elementId, event, handler);
    }

    removeEventListener(elementId, event) {
        if (!this.isInitialized || !this.behavior) {
            throw new Error('Component not initialized');
        }
        
        return this.behavior.removeEventListener(elementId, event);
    }

    // Component lifecycle
    destroy() {
        if (this.behavior) {
            this.behavior.destroy();
            this.behavior = null;
        }
        
        this.isInitialized = false;
        console.log('Cart Component destroyed');
    }

    // Static factory method
    static async create() {
        const component = new CartComponent();
        await component.initialize();
        return component;
    }
}

// Create and export a singleton instance
export const cartComponent = new CartComponent();

// Export individual classes and functions for direct use
export {
    CartBehavior
};

// Export for global use (if needed)
if (typeof window !== 'undefined') {
    window.CartComponent = CartComponent;
    window.cartComponent = cartComponent;
}

// Auto-initialize when imported
cartComponent.initialize().catch(console.error);
