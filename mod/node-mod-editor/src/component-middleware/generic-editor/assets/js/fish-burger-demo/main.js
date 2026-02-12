/**
 * Fish Burger Demo Main
 * Main entry point for the fish burger demo
 */

import { fishBurgerDemo } from './demo-controller.js';

// Demo state
let cartComponent = null;
let isDemoLoaded = false;

// Initialize demo
async function initializeDemo() {
    console.log('🚀 Initializing Fish Burger Demo...');
    
    try {
        // Wait for the demo controller to be ready
        await new Promise(resolve => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });

        // Load cart component
        await loadCartComponent();
        
        // Setup demo event listeners
        setupDemoEventListeners();
        
        // Mark demo as loaded
        isDemoLoaded = true;
        
        console.log('✅ Fish Burger Demo initialized successfully');
        
        // Dispatch ready event
        window.dispatchEvent(new CustomEvent('fish-burger-demo-ready', {
            detail: { fishBurgerDemo, cartComponent }
        }));
        
    } catch (error) {
        console.error('❌ Error initializing Fish Burger Demo:', error);
    }
}

// Load cart component
async function loadCartComponent() {
    try {
        console.log('Loading cart component...');
        
        // Check if we should use pact test proxy
        if (fishBurgerDemo.shouldUsePactProxy()) {
            console.log('Using Pact Test Proxy for cart component');
            cartComponent = await loadCartComponentWithPactProxy();
        } else {
            console.log('Using Live Server for cart component');
            cartComponent = await loadCartComponentFromLiveServer();
        }
        
        if (cartComponent) {
            updateCartComponentStatus('Loaded Successfully');
            console.log('Cart component loaded:', cartComponent);
        } else {
            updateCartComponentStatus('Failed to Load');
            console.error('Failed to load cart component');
        }
        
    } catch (error) {
        console.error('Error loading cart component:', error);
        updateCartComponentStatus('Error Loading');
    }
}

// Load cart component using pact test proxy
async function loadCartComponentWithPactProxy() {
    try {
        // This would load the cart component through our pact test proxy
        // For now, we'll create a mock component
        return {
            id: 'cart-component-pact',
            name: 'Cart Component (Pact Test)',
            template: `
                <div class="cart-component-pact">
                    <h3>🛒 Cart Component (Pact Test Mode)</h3>
                    <p>This component is loaded through the Pact Test Proxy</p>
                    <div class="cart-items">
                        <div class="cart-item">
                            <span>🍔 Fish Burger</span>
                            <span>$12.99</span>
                        </div>
                        <div class="cart-item">
                            <span>🥤 Drink</span>
                            <span>$2.99</span>
                        </div>
                    </div>
                    <div class="cart-total">
                        <strong>Total: $15.98</strong>
                    </div>
                    <button onclick="testCartFlow()" class="test-button">Test Cart Flow</button>
                </div>
            `,
            styles: `
                .cart-component-pact {
                    padding: 20px;
                    border: 2px solid #4CAF50;
                    border-radius: 8px;
                    background: #f9f9f9;
                }
                .cart-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #ddd;
                }
                .cart-total {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 2px solid #4CAF50;
                    font-size: 1.2em;
                }
                .test-button {
                    margin-top: 15px;
                    padding: 10px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .test-button:hover {
                    background: #45a049;
                }
            `,
            script: `
                // Cart component behavior will be loaded here
                console.log('Cart component script loaded (Pact Test Mode)');
            `
        };
    } catch (error) {
        console.error('Error loading cart component with pact proxy:', error);
        return null;
    }
}

// Load cart component from live server
async function loadCartComponentFromLiveServer() {
    try {
        const config = fishBurgerDemo.getConfig();
        const response = await fetch(`${config.apiBaseUrl}/api/cart-component`, {
            headers: fishBurgerDemo.getAuthHeaders()
        });
        
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error loading cart component from live server:', error);
        return null;
    }
}

// Setup demo event listeners
function setupDemoEventListeners() {
    // Test cart flow button
    const testButton = document.querySelector('.test-button');
    if (testButton) {
        testButton.addEventListener('click', testCartFlow);
    }
    
    // Connection mode change
    document.addEventListener('fish-burger-demo-connection-mode-changed', async (event) => {
        console.log('Connection mode changed, reloading cart component...');
        await loadCartComponent();
    });
}

// Test cart flow
function testCartFlow() {
    console.log('Testing cart flow...');
    
    if (fishBurgerDemo.shouldUsePactProxy()) {
        console.log('Testing cart flow with Pact Test Proxy');
        // This would test the cart flow through our pact test proxy
        alert('Testing cart flow with Pact Test Proxy!\n\nThis simulates the cart interaction without making real API calls.');
    } else {
        console.log('Testing cart flow with Live Server');
        // This would test the cart flow with the live server
        alert('Testing cart flow with Live Server!\n\nThis will make real API calls to your live server.');
    }
}

// Update cart component status
function updateCartComponentStatus(status) {
    const statusElement = document.getElementById('cart-component-status');
    if (statusElement) {
        statusElement.textContent = `Cart Component Status: ${status}`;
        
        // Update status styling
        statusElement.className = 'status-indicator';
        if (status.includes('Successfully')) {
            statusElement.classList.add('status-success');
        } else if (status.includes('Failed') || status.includes('Error')) {
            statusElement.classList.add('status-error');
        } else {
            statusElement.classList.add('status-info');
        }
    }
}

// Public API
window.fishBurgerDemoAPI = {
    initializeDemo,
    loadCartComponent,
    testCartFlow,
    getCartComponent: () => cartComponent,
    isDemoLoaded: () => isDemoLoaded,
    getConnectionMode: () => fishBurgerDemo.getConnectionMode(),
    switchConnectionMode: (mode) => fishBurgerDemo.switchConnectionMode(mode)
};

// Initialize demo when this script loads
initializeDemo();

// Export for module use
export {
    initializeDemo,
    loadCartComponent,
    testCartFlow,
    fishBurgerDemo
};
