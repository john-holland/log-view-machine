/**
 * Burger Cart Component Template
 * 
 * A template for a burger cart with ingredient builder that can be edited
 * by the generic editor system. Includes routing support for checkout flow.
 */

import { createViewStateMachine } from '../../../../../../log-view-machine/src/core/ViewStateMachine.tsx';

const BurgerCartComponentTemplate = {
  id: 'burger-cart-component',
  name: 'Burger Cart Component',
  description: 'Interactive burger cart with ingredient builder and cart management with routing support',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'burger-cart-component',
    xstateConfig: {
      id: 'burger-cart-component',
      initial: 'cart',
      context: {
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
          { id: 9, name: 'Flash Sale Burger', price: 7.99, quantity: 1, timeSensitive: true, expiresAt: Date.now() + 300000 }, // 5 minutes
          { id: 10, name: 'Limited Time Combo', price: 15.99, quantity: 1, timeSensitive: true, expiresAt: Date.now() + 600000 } // 10 minutes
        ],
        total: 0,
        traceId: null,
        userInfo: null,
        shippingInfo: null,
        paymentInfo: null,
        orderStatus: 'pending'
      }
    }
  },

  // Create the template instance
  create: (config = {}) => {
    return createViewStateMachine({
      machineId: 'burger-cart-component',
      xstateConfig: {
        ...BurgerCartComponentTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        cart: async (context) => {
          await context.log('Displaying cart view');
          
          // Calculate total
          const total = context.model.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          return context.view(`
            <div class="burger-cart-container">
              <div class="cart-header">
                <h1>🍔 Burger Builder & Cart</h1>
                <p>Customize your burger and manage your order</p>
              </div>
              
              <!-- Burger Builder Section -->
              <div class="burger-builder">
                <h3>🍔 Build Your Burger</h3>
                <div class="ingredients-grid">
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🥖</span>
                    <span class="ingredient-name">Bun</span>
                    <span class="ingredient-count" id="bun-count">${context.model.burgerIngredients.bun}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('bun')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('bun')">-</button>
                    </div>
                  </div>
                  
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🥩</span>
                    <span class="ingredient-name">Beef Patty</span>
                    <span class="ingredient-count" id="beef-count">${context.model.burgerIngredients.beef}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('beef')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('beef')">-</button>
                    </div>
                  </div>
                  
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🧀</span>
                    <span class="ingredient-name">Cheese</span>
                    <span class="ingredient-count" id="cheese-count">${context.model.burgerIngredients.cheese}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('cheese')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('cheese')">-</button>
                    </div>
                  </div>
                  
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🥬</span>
                    <span class="ingredient-name">Lettuce</span>
                    <span class="ingredient-count" id="lettuce-count">${context.model.burgerIngredients.lettuce}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('lettuce')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('lettuce')">-</button>
                    </div>
                  </div>
                  
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🍅</span>
                    <span class="ingredient-name">Tomato</span>
                    <span class="ingredient-count" id="tomato-count">${context.model.burgerIngredients.tomato}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('tomato')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('tomato')">-</button>
                    </div>
                  </div>
                  
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🍆</span>
                    <span class="ingredient-name">Eggplant</span>
                    <span class="ingredient-count" id="eggplant-count">${context.model.burgerIngredients.eggplant}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('eggplant')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('eggplant')">-</button>
                    </div>
                  </div>
                  
                  <div class="ingredient-item">
                    <span class="ingredient-emoji">🧅</span>
                    <span class="ingredient-name">Onion</span>
                    <span class="ingredient-count" id="onion-count">${context.model.burgerIngredients.onion}</span>
                    <div class="ingredient-controls">
                      <button class="btn btn-sm btn-secondary" onclick="addIngredient('onion')">+</button>
                      <button class="btn btn-sm btn-secondary" onclick="removeIngredient('onion')">-</button>
                    </div>
                  </div>
                </div>
                
                <div class="builder-actions">
                  <button class="btn btn-secondary" onclick="resetIngredients()">
                    🔄 Reset Ingredients
                  </button>
                  <button class="btn btn-primary" onclick="addCustomBurger()">
                    🍔 Add to Cart
                  </button>
                </div>
              </div>
              
              <!-- Cart Section -->
              <div class="cart-section">
                <h3>🛒 Your Cart</h3>
                <div id="cart-items" class="cart-items">
                  ${context.model.cartItems.length === 0 ? '<p class="empty-cart">Your cart is empty</p>' : 
                    context.model.cartItems.map(item => `
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
                          <button class="btn btn-secondary" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                          <button class="btn btn-secondary" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                          <button class="btn btn-secondary" onclick="removeItem(${item.id})">Remove</button>
                        </div>
                      </div>
                    `).join('')
                  }
                </div>
                
                <div class="cart-summary">
                  <div id="cart-total" class="cart-total">
                    <h4>Total: $${total.toFixed(2)}</h4>
                  </div>
                  <button class="btn btn-success checkout-btn" onclick="proceedToCheckout()">
                    💳 Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          `);
        },
        
        'checkout.customer_info': async (context) => {
          await context.log('Collecting customer information');
          
          return context.view(`
            <div class="checkout-customer-info">
              <h2>👤 Customer Information</h2>
              <form id="customer-form" class="checkout-form">
                <div class="form-group">
                  <label for="customer-name">Full Name</label>
                  <input type="text" id="customer-name" name="name" required 
                         value="${context.model.userInfo?.name || ''}" />
                </div>
                
                <div class="form-group">
                  <label for="customer-email">Email</label>
                  <input type="email" id="customer-email" name="email" required 
                         value="${context.model.userInfo?.email || ''}" />
                </div>
                
                <div class="form-group">
                  <label for="customer-phone">Phone</label>
                  <input type="tel" id="customer-phone" name="phone" 
                         value="${context.model.userInfo?.phone || ''}" />
                </div>
                
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" onclick="goBackToCart()">
                    ← Back to Cart
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Continue to Shipping →
                  </button>
                </div>
              </form>
            </div>
          `);
        },
        
        'checkout.shipping': async (context) => {
          await context.log('Collecting shipping information');
          
          return context.view(`
            <div class="checkout-shipping">
              <h2>🚚 Shipping Information</h2>
              <form id="shipping-form" class="checkout-form">
                <div class="form-group">
                  <label for="shipping-address">Street Address</label>
                  <input type="text" id="shipping-address" name="address" required 
                         value="${context.model.shippingInfo?.address || ''}" />
                </div>
                
                <div class="form-group">
                  <label for="shipping-city">City</label>
                  <input type="text" id="shipping-city" name="city" required 
                         value="${context.model.shippingInfo?.city || ''}" />
                </div>
                
                <div class="form-group">
                  <label for="shipping-state">State</label>
                  <input type="text" id="shipping-state" name="state" required 
                         value="${context.model.shippingInfo?.state || ''}" />
                </div>
                
                <div class="form-group">
                  <label for="shipping-zip">ZIP Code</label>
                  <input type="text" id="shipping-zip" name="zip" required 
                         value="${context.model.shippingInfo?.zip || ''}" />
                </div>
                
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" onclick="goBackToCustomerInfo()">
                    ← Back to Customer Info
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Continue to Payment →
                  </button>
                </div>
              </form>
            </div>
          `);
        },
        
        'checkout.payment': async (context) => {
          await context.log('Processing payment');
          
          return context.view(`
            <div class="checkout-payment">
              <h2>💳 Payment Information</h2>
              <form id="payment-form" class="checkout-form">
                <div class="form-group">
                  <label for="card-number">Card Number</label>
                  <input type="text" id="card-number" name="cardNumber" required 
                         placeholder="1234 5678 9012 3456" />
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label for="expiry">Expiry Date</label>
                    <input type="text" id="expiry" name="expiry" required 
                           placeholder="MM/YY" />
                  </div>
                  
                  <div class="form-group">
                    <label for="cvv">CVV</label>
                    <input type="text" id="cvv" name="cvv" required 
                           placeholder="123" />
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="card-name">Name on Card</label>
                  <input type="text" id="card-name" name="cardName" required 
                         value="${context.model.userInfo?.name || ''}" />
                </div>
                
                <div class="order-summary">
                  <h4>Order Summary</h4>
                  <div class="summary-items">
                    ${context.model.cartItems.map(item => `
                      <div class="summary-item">
                        <span>${item.name} x${item.quantity}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    `).join('')}
                  </div>
                  <div class="summary-total">
                    <strong>Total: $${context.model.total.toFixed(2)}</strong>
                  </div>
                </div>
                
                <div class="form-actions">
                  <button type="button" class="btn btn-secondary" onclick="goBackToShipping()">
                    ← Back to Shipping
                  </button>
                  <button type="submit" class="btn btn-success">
                    Complete Order
                  </button>
                </div>
              </form>
            </div>
          `);
        },
        
        'checkout.processing': async (context) => {
          await context.log('Processing order');
          
          return context.view(`
            <div class="checkout-processing">
              <div class="processing-spinner">🔄</div>
              <h3>Processing Your Order</h3>
              <p>Please wait while we process your payment and prepare your order...</p>
              <div class="processing-steps">
                <div class="step active">✓ Customer Info</div>
                <div class="step active">✓ Shipping Info</div>
                <div class="step active">✓ Payment Info</div>
                <div class="step processing">Processing Order</div>
              </div>
            </div>
          `);
        },
        
        'checkout.complete': async (context) => {
          await context.log('Order completed successfully');
          
          return context.view(`
            <div class="checkout-complete">
              <div class="success-icon">✅</div>
              <h2>Order Complete!</h2>
              <p>Thank you for your order. We'll send you a confirmation email shortly.</p>
              
              <div class="order-details">
                <h4>Order Details</h4>
                <p><strong>Order ID:</strong> ${context.model.orderId || 'ORDER-' + Date.now()}</p>
                <p><strong>Total:</strong> $${context.model.total.toFixed(2)}</p>
                <p><strong>Status:</strong> ${context.model.orderStatus}</p>
              </div>
              
              <div class="completion-actions">
                <button class="btn btn-primary" onclick="viewOrderStatus()">
                  View Order Status
                </button>
                <button class="btn btn-secondary" onclick="startNewOrder()">
                  Start New Order
                </button>
              </div>
            </div>
          `);
        }
      }
    });
  }
};

export { BurgerCartComponentTemplate }; 