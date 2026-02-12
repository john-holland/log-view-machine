/**
 * Cart Template
 * 
 * A template for cart functionality with burger builder integration
 */

// Note: This template is designed to work with the generic editor system
// but for now we'll use a simpler approach compatible with the tome server

const CartTemplate = {
  id: 'cart-template',
  name: 'Cart Template',
  description: 'Shopping cart with burger builder and item management',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  config: {
    machineId: 'cart-template',
    xstateConfig: {
      id: 'cart-template',
      initial: 'loading',
      states: {
        loading: {
          on: {
            CART_LOADED: 'ready',
            LOAD_ERROR: 'error'
          }
        },
        ready: {
          on: {
            ADD_ITEM: 'adding',
            REMOVE_ITEM: 'removing',
            UPDATE_QUANTITY: 'updating',
            BUILD_BURGER: 'building',
            CHECKOUT: 'checkout'
          }
        },
        adding: {
          on: {
            ADD_SUCCESS: 'ready',
            ADD_ERROR: 'error'
          }
        },
        removing: {
          on: {
            REMOVE_SUCCESS: 'ready',
            REMOVE_ERROR: 'error'
          }
        },
        updating: {
          on: {
            UPDATE_SUCCESS: 'ready',
            UPDATE_ERROR: 'error'
          }
        },
        building: {
          on: {
            BURGER_BUILT: 'ready',
            BUILD_CANCELLED: 'ready'
          }
        },
        checkout: {
          on: {
            PAYMENT_SUCCESS: 'success',
            PAYMENT_ERROR: 'error'
          }
        },
        success: {
          on: {
            NEW_ORDER: 'loading'
          }
        },
        error: {
          on: {
            RETRY: 'loading'
          }
        }
      }
    }
  },

  create: (config = {}) => {
    return {
      machineId: 'cart-template',
      xstateConfig: {
        ...CartTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        loading: async (context) => {
          await context.log('Loading cart...');
          return context.view(`
            <div class="cart-loading">
              <div class="loading-spinner">🔄 Loading cart...</div>
            </div>
          `);
        },
        ready: async (context) => {
          await context.log('Cart ready');
          return context.view(`
            <div class="cart-container">
              <div class="cart-header">
                <h1>🛒 Fish Burger Cart</h1>
                <p>Manage your order and customize your burger</p>
              </div>
              
              <!-- Burger Builder -->
              <div class="burger-builder">
                <h4>🍔 Burger Builder</h4>
                <ul class="burger-ingredients" id="burger-ingredients">
                  <li>
                    <span class="ingredient-emoji">🥖</span>
                    <span class="ingredient-name">Bun</span>
                    <span class="ingredient-count" id="bun-count">2</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('bun')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('bun')">-</button>
                    </div>
                  </li>
                  <li>
                    <span class="ingredient-emoji">🥩</span>
                    <span class="ingredient-name">Beef Patty</span>
                    <span class="ingredient-count" id="beef-count">1</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('beef')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('beef')">-</button>
                    </div>
                  </li>
                  <li>
                    <span class="ingredient-emoji">🧀</span>
                    <span class="ingredient-name">Cheese</span>
                    <span class="ingredient-count" id="cheese-count">1</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('cheese')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('cheese')">-</button>
                    </div>
                  </li>
                  <li>
                    <span class="ingredient-emoji">🥬</span>
                    <span class="ingredient-name">Lettuce</span>
                    <span class="ingredient-count" id="lettuce-count">1</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('cheese')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('cheese')">-</button>
                    </div>
                  </li>
                  <li>
                    <span class="ingredient-emoji">🍅</span>
                    <span class="ingredient-name">Tomato</span>
                    <span class="ingredient-count" id="tomato-count">1</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('tomato')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('tomato')">-</button>
                    </div>
                  </li>
                  <li>
                    <span class="ingredient-emoji">🍆</span>
                    <span class="ingredient-name">Eggplant</span>
                    <span class="ingredient-count" id="eggplant-count">0</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('eggplant')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('eggplant')">-</button>
                    </div>
                  </li>
                  <li>
                    <span class="ingredient-emoji">🧅</span>
                    <span class="ingredient-name">Onion</span>
                    <span class="ingredient-count" id="onion-count">1</span>
                    <div class="ingredient-controls">
                      <button class="ingredient-btn add" onclick="addIngredient('onion')">+</button>
                      <button class="ingredient-btn remove" onclick="removeIngredient('onion')">-</button>
                    </div>
                  </li>
                </ul>
                <button class="btn" onclick="resetIngredients()" style="margin-top: 10px; width: 100%; background: #6c757d; color: white;">
                  🔄 Reset Ingredients
                </button>
              </div>

              <div id="cart-items" class="cart-items">
                <p>Loading cart items...</p>
              </div>

              <div id="cart-total">
                <h3>Total: $0.00</h3>
              </div>

              <button class="btn" onclick="addCustomBurger()" style="margin-top: 10px; width: 100%; background: #ffc107; color: #000;">
                🍔 Add Custom Burger to Cart
              </button>

              <button class="checkout-btn" onclick="proceedToCheckout()">
                Proceed to Checkout
              </button>
            </div>
          `);
        },
        adding: async (context) => {
          await context.log('Adding item to cart...');
          return context.view(`
            <div class="cart-adding">
              <div class="adding-spinner">➕ Adding item to cart...</div>
            </div>
          `);
        },
        removing: async (context) => {
          await context.log('Removing item from cart...');
          return context.view(`
            <div class="cart-removing">
              <div class="removing-spinner">➖ Removing item from cart...</div>
            </div>
          `);
        },
        updating: async (context) => {
          await context.log('Updating cart quantities...');
          return context.view(`
            <div class="cart-updating">
              <div class="updating-spinner">🔄 Updating cart...</div>
            </div>
          `);
        },
        building: async (context) => {
          await context.log('Building custom burger...');
          return context.view(`
            <div class="burger-building">
              <div class="building-spinner">🍔 Building your burger...</div>
              <div class="ingredient-preview">
                <h4>Your Custom Burger:</h4>
                <div id="ingredient-preview"></div>
              </div>
            </div>
          `);
        },
        checkout: async (context) => {
          await context.log('Processing checkout...');
          return context.view(`
            <div class="checkout-process">
              <div class="checkout-spinner">💳 Processing checkout...</div>
              <div class="order-summary">
                <h4>Order Summary:</h4>
                <div id="order-summary"></div>
              </div>
            </div>
          `);
        },
        success: async (context) => {
          await context.log('Order completed successfully');
          return context.view(`
            <div class="order-success">
              <div class="success-icon">✅</div>
              <h3>Order Completed!</h3>
              <p>Your order has been processed successfully.</p>
              <div class="order-details">
                <p><strong>Order ID:</strong> ${context.model.orderId || 'N/A'}</p>
                <p><strong>Total:</strong> $${context.model.total || '0.00'}</p>
              </div>
              <button class="btn btn-primary" onclick="startNewOrder()">Start New Order</button>
            </div>
          `);
        },
        error: async (context) => {
          await context.log('Error occurred', { error: context.model.error });
          return context.view(`
            <div class="cart-error">
              <div class="error-icon">❌</div>
              <h3>Error Occurred</h3>
              <p>${context.model.error || 'An unexpected error occurred'}</p>
              <button class="btn btn-secondary" onclick="retryOperation()">Retry</button>
            </div>
          `);
        }
      }
    };
  }
};

export default CartTemplate;
