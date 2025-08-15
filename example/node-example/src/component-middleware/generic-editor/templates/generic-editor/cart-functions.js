/**
 * Cart Functions for Generic Editor
 * 
 * This module provides all the cart functionality including:
 * - Burger ingredient management
 * - Cart item operations
 * - Checkout flow
 * - Payment processing
 */

// Global cart state
let cartState = {
  burgerIngredients: {
    bun: 2,
    beef: 1,
    cheese: 1,
    lettuce: 1,
    tomato: 1,
    eggplant: 0,
    onion: 1
  },
  cartItems: [
    { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1, timeSensitive: false },
    { id: 2, name: 'French Fries', price: 4.99, quantity: 1, timeSensitive: false },
    { id: 3, name: 'Soda', price: 2.99, quantity: 1, timeSensitive: false },
    { id: 4, name: 'Onion Rings', price: 5.99, quantity: 1, timeSensitive: false },
    { id: 5, name: 'Milkshake', price: 6.99, quantity: 1, timeSensitive: false },
    { id: 6, name: 'Side Salad', price: 3.99, quantity: 1, timeSensitive: false },
    { id: 7, name: 'Chicken Wings', price: 8.99, quantity: 1, timeSensitive: false },
    { id: 8, name: 'Ice Cream', price: 4.99, quantity: 1, timeSensitive: false },
    { id: 9, name: 'Flash Sale Burger', price: 7.99, quantity: 1, timeSensitive: true, expiresAt: Date.now() + 300000 },
    { id: 10, name: 'Limited Time Combo', price: 15.99, quantity: 1, timeSensitive: true, expiresAt: Date.now() + 600000 }
  ],
  total: 0,
  userInfo: null,
  shippingInfo: null,
  paymentInfo: null,
  orderStatus: 'pending'
};

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
  initializeCart();
  updateCartDisplay();
  startCountdownTimer();
});

/**
 * Initialize the cart system
 */
function initializeCart() {
  console.log('🍔 Initializing cart system...');
  
  // Load saved cart data from localStorage if available
  const savedCart = localStorage.getItem('burgerCart');
  if (savedCart) {
    try {
      const parsedCart = JSON.parse(savedCart);
      cartState = { ...cartState, ...parsedCart };
      console.log('📦 Loaded saved cart data');
    } catch (error) {
      console.error('❌ Error loading saved cart:', error);
    }
  }
  
  // Calculate initial total
  calculateTotal();
  
  // Set up auto-save
  setInterval(saveCartToStorage, 30000); // Save every 30 seconds
  
  console.log('✅ Cart system initialized');
}

/**
 * Add ingredient to burger
 */
function addIngredient(type) {
  if (cartState.burgerIngredients[type] !== undefined) {
    cartState.burgerIngredients[type]++;
    updateIngredientDisplay(type);
    console.log(`➕ Added ${type}, new count: ${cartState.burgerIngredients[type]}`);
    
    // Mark as unsaved
    markAsUnsaved();
  }
}

/**
 * Remove ingredient from burger
 */
function removeIngredient(type) {
  if (cartState.burgerIngredients[type] !== undefined && cartState.burgerIngredients[type] > 0) {
    cartState.burgerIngredients[type]--;
    updateIngredientDisplay(type);
    console.log(`➖ Removed ${type}, new count: ${cartState.burgerIngredients[type]}`);
    
    // Mark as unsaved
    markAsUnsaved();
  }
}

/**
 * Reset all ingredients to default values
 */
function resetIngredients() {
  cartState.burgerIngredients = {
    bun: 2,
    beef: 1,
    cheese: 1,
    lettuce: 1,
    tomato: 1,
    eggplant: 0,
    onion: 1
  };
  
  updateAllIngredientDisplays();
  console.log('🔄 Reset all ingredients to default');
  
  // Mark as unsaved
  markAsUnsaved();
}

/**
 * Update ingredient display in the UI
 */
function updateIngredientDisplay(type) {
  const countElement = document.getElementById(`${type}-count`);
  if (countElement) {
    countElement.textContent = cartState.burgerIngredients[type];
  }
}

/**
 * Update all ingredient displays
 */
function updateAllIngredientDisplays() {
  Object.keys(cartState.burgerIngredients).forEach(type => {
    updateIngredientDisplay(type);
  });
}

/**
 * Add custom burger to cart
 */
function addCustomBurger() {
  const customBurger = {
    id: Date.now(),
    name: 'Custom Burger',
    price: calculateCustomBurgerPrice(),
    quantity: 1,
    timeSensitive: false,
    ingredients: { ...cartState.burgerIngredients }
  };
  
  cartState.cartItems.push(customBurger);
  calculateTotal();
  updateCartDisplay();
  
  console.log('🍔 Added custom burger to cart:', customBurger);
  
  // Show success message
  showNotification('Custom burger added to cart!', 'success');
  
  // Mark as unsaved
  markAsUnsaved();
}

/**
 * Calculate custom burger price based on ingredients
 */
function calculateCustomBurgerPrice() {
  const basePrice = 8.99;
  const ingredientPrices = {
    bun: 0.50,
    beef: 2.99,
    cheese: 0.75,
    lettuce: 0.25,
    tomato: 0.30,
    eggplant: 0.40,
    onion: 0.20
  };
  
  let totalPrice = basePrice;
  Object.keys(cartState.burgerIngredients).forEach(ingredient => {
    totalPrice += ingredientPrices[ingredient] * cartState.burgerIngredients[ingredient];
  });
  
  return Math.round(totalPrice * 100) / 100;
}

/**
 * Update cart item quantity
 */
function updateQuantity(itemId, newQuantity) {
  if (newQuantity <= 0) {
    removeItem(itemId);
    return;
  }
  
  const item = cartState.cartItems.find(item => item.id === itemId);
  if (item) {
    item.quantity = newQuantity;
    calculateTotal();
    updateCartDisplay();
    console.log(`📊 Updated quantity for ${item.name} to ${newQuantity}`);
    
    // Mark as unsaved
    markAsUnsaved();
  }
}

/**
 * Remove item from cart
 */
function removeItem(itemId) {
  cartState.cartItems = cartState.cartItems.filter(item => item.id !== itemId);
  calculateTotal();
  updateCartDisplay();
  console.log(`🗑️ Removed item ${itemId} from cart`);
  
  // Mark as unsaved
  markAsUnsaved();
}

/**
 * Calculate cart total
 */
function calculateTotal() {
  cartState.total = cartState.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return cartState.total;
}

/**
 * Update cart display in the UI
 */
function updateCartDisplay() {
  const cartContainer = document.getElementById('cart-items');
  const totalElement = document.getElementById('cart-total');
  
  if (!cartContainer || !totalElement) return;
  
  if (cartState.cartItems.length === 0) {
    cartContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    totalElement.innerHTML = '<h4>Total: $0.00</h4>';
    return;
  }
  
  const itemsHtml = cartState.cartItems.map(item => `
    <div class="cart-item ${item.timeSensitive ? 'time-sensitive' : ''}">
      <div class="item-info">
        <h4>${item.name}</h4>
        <p>Quantity: ${item.quantity} | Price: $${item.price}</p>
        ${item.timeSensitive ? `
          <div class="time-sensitive-badge">
            ⏰ Limited Time Offer
            ${item.expiresAt ? `<span class="countdown" data-expires="${item.expiresAt}"></span>` : ''}
          </div>
        ` : ''}
      </div>
      <div class="item-actions">
        <button class="btn btn-sm btn-secondary" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
        <button class="btn btn-sm btn-secondary" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
        <button class="btn btn-sm btn-secondary" onclick="removeItem(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');
  
  cartContainer.innerHTML = itemsHtml;
  
  const total = calculateTotal();
  totalElement.innerHTML = `<h4>Total: $${total.toFixed(2)}</h4>`;
  
  // Update countdown timers
  updateCountdownTimers();
}

/**
 * Start countdown timer for time-sensitive items
 */
function startCountdownTimer() {
  setInterval(updateCountdownTimers, 1000);
}

/**
 * Update countdown timers for time-sensitive items
 */
function updateCountdownTimers() {
  const countdownElements = document.querySelectorAll('.countdown');
  
  countdownElements.forEach(element => {
    const expiresAt = parseInt(element.getAttribute('data-expires'));
    const now = Date.now();
    const timeLeft = expiresAt - now;
    
    if (timeLeft <= 0) {
      element.textContent = 'EXPIRED';
      element.style.color = '#dc3545';
      element.style.fontWeight = 'bold';
    } else {
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  });
}

/**
 * Proceed to checkout
 */
function proceedToCheckout() {
  if (cartState.cartItems.length === 0) {
    showNotification('Your cart is empty!', 'error');
    return;
  }
  
  console.log('💳 Proceeding to checkout...');
  
  // Check for expired time-sensitive items
  const expiredItems = cartState.cartItems.filter(item => 
    item.timeSensitive && item.expiresAt && item.expiresAt < Date.now()
  );
  
  if (expiredItems.length > 0) {
    showNotification('Some items in your cart have expired and will be removed.', 'warning');
    cartState.cartItems = cartState.cartItems.filter(item => 
      !(item.timeSensitive && item.expiresAt && item.expiresAt < Date.now())
    );
    calculateTotal();
    updateCartDisplay();
  }
  
  // Navigate to checkout (this would integrate with your routing system)
  if (typeof window !== 'undefined' && window.location) {
    window.location.href = '/checkout';
  } else {
    console.log('Checkout navigation not available in this context');
    showNotification('Checkout functionality not available in this context', 'info');
  }
}

/**
 * Save cart to localStorage
 */
function saveCartToStorage() {
  try {
    localStorage.setItem('burgerCart', JSON.stringify(cartState));
    console.log('💾 Cart saved to storage');
  } catch (error) {
    console.error('❌ Error saving cart to storage:', error);
  }
}

/**
 * Mark cart as having unsaved changes
 */
function markAsUnsaved() {
  // This would integrate with your editor's unsaved changes system
  if (typeof window !== 'undefined' && window.markEditorAsUnsaved) {
    window.markEditorAsUnsaved();
  }
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    max-width: 400px;
    animation: slideInRight 0.3s ease;
  `;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.remove();
    }
  }, 5000);
}

/**
 * Export cart data
 */
function exportCart() {
  const cartData = {
    ...cartState,
    exportDate: new Date().toISOString(),
    exportVersion: '1.0.0'
  };
  
  const dataStr = JSON.stringify(cartData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `burger-cart-${Date.now()}.json`;
  link.click();
  
  console.log('📤 Cart exported');
  showNotification('Cart exported successfully!', 'success');
}

/**
 * Import cart data
 */
function importCart(file) {
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const importedCart = JSON.parse(e.target.result);
      
      // Validate imported data
      if (importedCart.cartItems && importedCart.burgerIngredients) {
        cartState = { ...cartState, ...importedCart };
        calculateTotal();
        updateCartDisplay();
        updateAllIngredientDisplays();
        
        console.log('📥 Cart imported successfully');
        showNotification('Cart imported successfully!', 'success');
      } else {
        throw new Error('Invalid cart data format');
      }
    } catch (error) {
      console.error('❌ Error importing cart:', error);
      showNotification('Error importing cart data', 'error');
    }
  };
  
  reader.readAsText(file);
}

/**
 * Clear cart
 */
function clearCart() {
  if (confirm('Are you sure you want to clear your cart? This action cannot be undone.')) {
    cartState.cartItems = [];
    calculateTotal();
    updateCartDisplay();
    
    console.log('🗑️ Cart cleared');
    showNotification('Cart cleared successfully!', 'success');
    
    // Mark as unsaved
    markAsUnsaved();
  }
}

/**
 * Get cart summary for external use
 */
function getCartSummary() {
  return {
    itemCount: cartState.cartItems.length,
    total: cartState.total,
    items: cartState.cartItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity
    }))
  };
}

// Export functions for external use
window.cartFunctions = {
  addIngredient,
  removeIngredient,
  resetIngredients,
  addCustomBurger,
  updateQuantity,
  removeItem,
  proceedToCheckout,
  exportCart,
  importCart,
  clearCart,
  getCartSummary,
  cartState: () => ({ ...cartState })
};

// Add CSS for notifications
const notificationStyles = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  
  .notification-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }
  
  .notification-close:hover {
    opacity: 1;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

console.log('🍔 Cart functions loaded and ready!');
