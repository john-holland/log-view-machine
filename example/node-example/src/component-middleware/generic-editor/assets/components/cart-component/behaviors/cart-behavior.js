/**
 * Cart Component Behavior
 * Handles all cart functionality including ingredient selection, cart management, and checkout
 */

export class CartBehavior {
    constructor() {
        this.cart = [];
        this.selectedIngredients = new Map();
        this.isInitialized = false;
        this.eventListeners = new Map();
        
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.loadCartFromStorage();
            this.updateCartDisplay();
            this.isInitialized = true;
            console.log('✅ Cart behavior initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize cart behavior:', error);
        }
    }

    // Ensure cart state is properly synchronized
    syncCartState() {
        try {
            console.log('🔄 Syncing cart state...');
            this.loadCartFromStorage();
            this.updateCartDisplay();
            console.log('✅ Cart state synchronized');
        } catch (error) {
            console.error('❌ Error syncing cart state:', error);
        }
    }

    setupEventListeners() {
        // Ingredient selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ingredient-btn')) {
                this.handleIngredientSelection(e.target);
            }
        });

        // Cart actions
        this.addEventListener('clear-cart-btn', 'click', () => this.clearCart());
        this.addEventListener('checkout-btn', 'click', () => this.showCheckout());
        this.addEventListener('close-modal-btn', 'click', () => this.hideModal());
        this.addEventListener('cancel-order-btn', 'click', () => this.hideModal());
        this.addEventListener('confirm-order-btn', 'click', () => this.confirmOrder());

        // Quantity controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const action = e.target.dataset.action;
                const ingredientId = e.target.dataset.ingredientId;
                
                if (action === 'increase') {
                    this.increaseQuantity(ingredientId);
                } else if (action === 'decrease') {
                    this.decreaseQuantity(ingredientId);
                }
            }
        });

        // Remove buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const ingredientId = e.target.dataset.ingredientId;
                this.removeFromCart(ingredientId);
            }
        });
    }

    addEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
            this.eventListeners.set(`${elementId}-${event}`, { element, event, handler });
        }
    }

    removeEventListener(elementId, event) {
        const key = `${elementId}-${event}`;
        const listener = this.eventListeners.get(key);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            this.eventListeners.delete(key);
        }
    }

    handleIngredientSelection(button) {
        const ingredient = button.dataset.ingredient;
        const type = button.dataset.type;
        const price = parseFloat(button.dataset.price);
        const ingredientId = `${ingredient}-${type}`;

        // Toggle selection
        if (this.selectedIngredients.has(ingredientId)) {
            this.selectedIngredients.delete(ingredientId);
            button.classList.remove('selected');
        } else {
                    // Remove any existing ingredient of the same category
        for (const [key] of this.selectedIngredients) {
            if (key.startsWith(ingredient + '-')) {
                this.selectedIngredients.delete(key);
                // Remove selected class from other buttons in same category
                const otherButton = document.querySelector(`[data-ingredient="${ingredient}"][data-type="${key.split('-')[1]}"]`);
                if (otherButton) otherButton.classList.remove('selected');
            }
        }
            
            this.selectedIngredients.set(ingredientId, {
                ingredient,
                type,
                price,
                name: button.textContent.trim()
            });
            button.classList.add('selected');
        }

        this.updateCartDisplay();
    }

    addToCart(ingredientData) {
        const existingItem = this.cart.find(item => item.id === ingredientData.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...ingredientData,
                quantity: 1
            });
        }

        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    removeFromCart(ingredientId) {
        this.cart = this.cart.filter(item => item.id !== ingredientId);
        this.saveCartToStorage();
        this.updateCartDisplay();
    }

    increaseQuantity(ingredientId) {
        const item = this.cart.find(item => item.id === ingredientId);
        if (item) {
            item.quantity += 1;
            this.saveCartToStorage();
            this.updateCartDisplay();
        }
    }

    decreaseQuantity(ingredientId) {
        const item = this.cart.find(item => item.id === ingredientId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                this.removeFromCart(ingredientId);
                return;
            }
            this.saveCartToStorage();
            this.updateCartDisplay();
        }
    }

    clearCart() {
        if (confirm('Are you sure you want to clear your cart?')) {
            this.cart = [];
            this.selectedIngredients.clear();
            this.saveCartToStorage();
            this.updateCartDisplay();
            
            // Remove selected class from all ingredient buttons
            document.querySelectorAll('.ingredient-btn.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
        }
    }

    updateCartDisplay() {
        const cartItemsContainer = document.getElementById('cart-items');
        const itemCountElement = document.querySelector('.item-count');
        const cartTotalElement = document.querySelector('.cart-total');

        if (!cartItemsContainer) return;

        // Update item count and total
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (itemCountElement) {
            itemCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = `$${totalPrice.toFixed(2)}`;
        }

        // Update cart items display
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <p>Start building your burger! 🍔</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="decrease" data-ingredient-id="${item.id}">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" data-action="increase" data-ingredient-id="${item.id}">+</button>
                        </div>
                        <button class="remove-btn" data-ingredient-id="${item.id}">Remove</button>
                    </div>
                </div>
            `).join('');
        }

        // Restore visual state of ingredient buttons based on current cart
        this.restoreIngredientButtonStates();
    }

    restoreIngredientButtonStates() {
        // Clear all selected states first
        const allIngredientButtons = document.querySelectorAll('.ingredient-btn');
        allIngredientButtons.forEach(btn => {
            btn.classList.remove('selected');
        });

        // Restore selected state based on cart contents
        this.cart.forEach(cartItem => {
            const button = document.querySelector(`[data-ingredient="${cartItem.ingredient}"][data-type="${cartItem.type}"]`);
            if (button) {
                button.classList.add('selected');
                console.log(`Restored selected state for ${cartItem.ingredient}-${cartItem.type}`);
            }
        });

        // Update selectedIngredients map to match cart state
        this.selectedIngredients.clear();
        this.cart.forEach(cartItem => {
            const ingredientId = `${cartItem.ingredient}-${cartItem.type}`;
            this.selectedIngredients.set(ingredientId, {
                ingredient: cartItem.ingredient,
                type: cartItem.type,
                price: cartItem.price,
                name: cartItem.name
            });
        });

        console.log('Ingredient button states restored from cart:', this.selectedIngredients.size, 'items');
    }

    showCheckout() {
        if (this.cart.length === 0) {
            alert('Your cart is empty! Add some ingredients first.');
            return;
        }

        const modal = document.getElementById('order-summary-modal');
        const orderItemsContainer = document.getElementById('order-items');
        const orderTotalElement = document.getElementById('order-total');

        if (!modal || !orderItemsContainer || !orderTotalElement) return;

        // Populate order items
        orderItemsContainer.innerHTML = this.cart.map(item => `
            <div class="order-item">
                <span class="order-item-name">${item.name} × ${item.quantity}</span>
                <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        // Update total
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        orderTotalElement.textContent = `$${total.toFixed(2)}`;

        // Show modal
        modal.style.display = 'block';
    }

    hideModal() {
        const modal = document.getElementById('order-summary-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async confirmOrder() {
        try {
            // Simulate order processing
            this.hideModal();
            
            // Show success message
            this.showSuccessMessage('Order placed successfully! 🎉');
            
            // Clear cart after successful order
            setTimeout(() => {
                this.clearCart();
            }, 2000);

        } catch (error) {
            console.error('Error confirming order:', error);
            alert('There was an error processing your order. Please try again.');
        }
    }

    showSuccessMessage(message) {
        const successMessage = document.getElementById('success-message');
        if (successMessage) {
            const successText = successMessage.querySelector('.success-text');
            if (successText) {
                successText.textContent = message;
            }
            successMessage.style.display = 'block';
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
        }
    }

    saveCartToStorage() {
        try {
            localStorage.setItem('fish-burger-cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('fish-burger-cart');
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
                console.log('📦 Cart loaded from storage:', this.cart);
                console.log('🔢 Cart contains', this.cart.length, 'items');
                
                // Log each item for debugging
                this.cart.forEach((item, index) => {
                    console.log(`  ${index + 1}. ${item.name} (${item.ingredient}-${item.type}) x${item.quantity} - $${item.price}`);
                });
            } else {
                console.log('📦 No saved cart found in localStorage');
                this.cart = [];
            }
        } catch (error) {
            console.error('❌ Error loading cart from storage:', error);
            this.cart = [];
        }
    }

    getCart() {
        return [...this.cart];
    }

    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    isCartEmpty() {
        return this.cart.length === 0;
    }

    // Public API methods
    addIngredient(ingredient, type, price, name) {
        const ingredientId = `${ingredient}-${type}`;
        const ingredientData = { id: ingredientId, ingredient, type, price, name };
        this.addToCart(ingredientData);
    }

    removeIngredient(ingredientId) {
        this.removeFromCart(ingredientId);
    }

    updateIngredientQuantity(ingredientId, quantity) {
        const item = this.cart.find(item => item.id === ingredientId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(ingredientId);
            } else {
                item.quantity = quantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
            }
        }
    }

    // Cleanup
    destroy() {
        // Remove all event listeners
        for (const [key, listener] of this.eventListeners) {
            listener.element.removeEventListener(listener.event, listener.handler);
        }
        this.eventListeners.clear();
        
        this.isInitialized = false;
        console.log('Cart behavior destroyed');
    }
}

// Create and export a singleton instance
export const cartBehavior = new CartBehavior();
