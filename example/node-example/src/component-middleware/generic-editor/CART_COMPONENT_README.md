# 🛒 Cart Component

A fully functional, interactive cart component designed for the Generic Editor system. This component provides a complete shopping cart experience with ingredient selection, quantity management, and checkout functionality.

## 🚀 Quick Start

### 1. Access the Demo
Visit the live demo to see the cart component in action:
- **Demo Page**: `/cart-demo` - See the component working with sample data
- **Test Page**: `/cart-test` - Run basic functionality tests
- **Integration Test**: `/cart-integration-test` - Comprehensive testing suite

### 2. Basic Usage
```javascript
import { CartComponent } from './assets/components/cart-component/index.js';

// Create and initialize the component
const cartComponent = new CartComponent();
await cartComponent.initialize();

// Add ingredients to cart
cartComponent.addIngredient('bun', 'sesame', 2.99, '🥯 Sesame Bun');
cartComponent.addIngredient('patty', 'beef', 4.99, '🥩 Beef Patty');

// Get cart status
const status = cartComponent.getStatus();
console.log(`Cart has ${status.cartItemCount} items, total: $${status.cartTotal}`);
```

## 🏗️ Architecture

### Component Structure
```
cart-component/
├── index.js              # Main component class and exports
├── behaviors/
│   └── cart-behavior.js  # Core cart logic and event handling
├── templates/
│   └── cart-template.html # HTML structure
└── styles/
    └── cart-styles.css   # Component styling
```

### Key Classes

#### CartComponent
The main component class that provides the public API:
- **Lifecycle Management**: Initialization, cleanup, and status tracking
- **Public Methods**: Safe access to cart operations
- **Error Handling**: Graceful error handling and validation

#### CartBehavior
The core logic engine that handles:
- **Cart State**: Item management, quantities, and totals
- **Event Handling**: User interactions and DOM updates
- **Persistence**: Local storage synchronization
- **UI Updates**: Real-time cart display updates

## 🎯 Features

### Core Functionality
- ✅ **Ingredient Selection**: Click to add ingredients to cart
- ✅ **Category Management**: Only one ingredient per category allowed
- ✅ **Quantity Control**: Increase/decrease quantities with +/- buttons
- ✅ **Real-time Updates**: Cart total and item count update instantly
- ✅ **Persistent Storage**: Cart data saved to localStorage
- ✅ **Checkout Flow**: Order summary modal with confirmation

### UI Features
- 🎨 **Modern Design**: Clean, responsive interface
- 📱 **Mobile Friendly**: Works on all device sizes
- ♿ **Accessibility**: Proper ARIA labels and keyboard navigation
- 🎭 **Smooth Animations**: CSS transitions and hover effects
- 🎨 **Visual Feedback**: Selected states and interactive elements

### Technical Features
- 🔧 **Modular Architecture**: Easy to extend and customize
- 🧪 **Testable Design**: Comprehensive testing support
- 💾 **State Management**: Predictable state transitions
- 🔌 **Event System**: Clean event handling and delegation
- 🎯 **Error Handling**: Graceful error recovery

## 📖 API Reference

### CartComponent Methods

#### Initialization
```javascript
// Initialize the component
await cartComponent.initialize();

// Check if component is ready
const isReady = cartComponent.isInitialized;

// Get component metadata
const metadata = cartComponent.getMetadata();
```

#### Cart Operations
```javascript
// Add ingredient to cart
cartComponent.addIngredient(ingredient, type, price, name);

// Remove ingredient from cart
cartComponent.removeIngredient(ingredientId);

// Update ingredient quantity
cartComponent.updateIngredientQuantity(ingredientId, quantity);

// Clear entire cart
cartComponent.behavior.clearCart();
```

#### Status and Information
```javascript
// Get current cart status
const status = cartComponent.getStatus();
// Returns: { status, message, cartItemCount, cartTotal, isCartEmpty }

// Get cart contents
const cart = cartComponent.behavior.getCart();

// Get cart total
const total = cartComponent.behavior.getCartTotal();

// Check if cart is empty
const isEmpty = cartComponent.behavior.isCartEmpty();
```

### CartBehavior Methods

#### Cart Management
```javascript
// Add item to cart
behavior.addToCart(ingredientData);

// Remove item from cart
behavior.removeFromCart(ingredientId);

// Update item quantity
behavior.increaseQuantity(ingredientId);
behavior.decreaseQuantity(ingredientId);
```

#### UI Management
```javascript
// Update cart display
behavior.updateCartDisplay();

// Show checkout modal
behavior.showCheckout();

// Hide modal
behavior.hideModal();

// Confirm order
behavior.confirmOrder();
```

#### Storage
```javascript
// Save cart to localStorage
behavior.saveCartToStorage();

// Load cart from localStorage
behavior.loadCartFromStorage();
```

## 🎨 Customization

### Styling
The component uses CSS custom properties for easy theming:
```css
:root {
  --cart-primary-color: #007bff;
  --cart-secondary-color: #6c757d;
  --cart-success-color: #28a745;
  --cart-danger-color: #dc3545;
  --cart-border-radius: 8px;
  --cart-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
```

### Template Customization
Modify `cart-template.html` to:
- Add new ingredient categories
- Change button layouts
- Modify modal structure
- Add custom elements

### Behavior Extension
Extend `CartBehavior` class to:
- Add new cart operations
- Implement custom validation
- Add analytics tracking
- Integrate with backend services

## 🔧 Integration

### Generic Editor Integration
The cart component is designed to work seamlessly with the Generic Editor:
- **Component Registry**: Can be registered as a reusable component
- **State Machine Integration**: Works with XState workflows
- **Template System**: Integrates with editor's template management
- **Persistence Layer**: Uses editor's persistence manager

### Backend Integration
Ready for backend integration:
- **REST API**: Send cart data for order processing
- **GraphQL**: Integrate with Log View Machine's schema
- **WebSocket**: Real-time updates and collaboration
- **Database**: Persistent storage with SQLite or other databases

## 🧪 Testing

### Test Pages
- **Basic Tests**: `/cart-test` - Simple functionality testing
- **Integration Tests**: `/cart-integration-test` - Comprehensive testing suite
- **Live Demo**: `/cart-demo` - See the component in action

### Test Coverage
The component includes tests for:
- ✅ Component initialization and lifecycle
- ✅ Cart operations (add, remove, update)
- ✅ Event handling and DOM interaction
- ✅ Storage and persistence
- ✅ Error scenarios and edge cases
- ✅ Integration with Generic Editor

### Running Tests
```bash
# Start the server
npm run dev

# Visit test pages
open http://localhost:3000/cart-test
open http://localhost:3000/cart-integration-test
open http://localhost:3000/cart-demo
```

## 🐛 Troubleshooting

### Common Issues

#### Component Not Initializing
```javascript
// Check if component is ready
if (!cartComponent.isInitialized) {
    console.error('Component not initialized');
    return;
}
```

#### Cart Not Updating
```javascript
// Force cart display update
cartComponent.behavior.updateCartDisplay();

// Check for DOM elements
const cartContainer = document.getElementById('cart-items');
if (!cartContainer) {
    console.error('Cart container not found');
}
```

#### Event Listeners Not Working
```javascript
// Check if behavior is ready
if (!cartComponent.behavior) {
    console.error('Cart behavior not available');
    return;
}

// Verify event listeners are attached
const listeners = cartComponent.behavior.eventListeners;
console.log('Active listeners:', listeners.size);
```

### Debug Mode
Enable debug logging:
```javascript
// Set debug level
localStorage.setItem('cart-debug', 'true');

// Check console for detailed logs
```

## 📚 Examples

### Basic Implementation
```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="cart-styles.css">
</head>
<body>
    <div id="cart-container"></div>
    
    <script type="module">
        import { CartComponent } from './cart-component/index.js';
        
        async function initCart() {
            const cart = new CartComponent();
            await cart.initialize();
            
            // Load template
            const container = document.getElementById('cart-container');
            const response = await fetch('./cart-template.html');
            const template = await response.text();
            container.innerHTML = template;
        }
        
        initCart();
    </script>
</body>
</html>
```

### Advanced Usage
```javascript
// Custom cart operations
class CustomCartComponent extends CartComponent {
    async initialize() {
        await super.initialize();
        
        // Add custom event listeners
        this.behavior.addEventListener('custom-event', 'click', this.handleCustomEvent);
        
        // Initialize with custom data
        this.loadCustomData();
    }
    
    handleCustomEvent(event) {
        // Custom event handling
        console.log('Custom event triggered:', event);
    }
    
    loadCustomData() {
        // Load custom ingredient data
        const customIngredients = this.getCustomIngredients();
        this.behavior.setCustomIngredients(customIngredients);
    }
}
```

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Make changes and test with the test pages

### Code Style
- Use ES6+ features
- Follow the existing component architecture
- Add comprehensive error handling
- Include JSDoc comments for public methods
- Test all new functionality

### Testing Guidelines
- Test all public methods
- Verify error scenarios
- Check edge cases
- Ensure mobile compatibility
- Validate accessibility features

## 📄 License

This component is part of the Generic Editor system and follows the same licensing terms.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the test pages for examples
3. Check browser console for error messages
4. Verify component initialization status
5. Test with the integration test page

---

**Cart Component** - Built with ❤️ for the Generic Editor system

