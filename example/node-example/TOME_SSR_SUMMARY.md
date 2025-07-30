# Tome Server-Side Rendering Implementation

## Overview

This implementation provides a hybrid rendering approach where:
- **Checkout Page**: Server-side rendered (SSR) for better SEO and performance
- **Cart Page**: Client-side rendered for interactive functionality
- **Tome Server**: Handles both SSR and API endpoints with OpenTelemetry tracing

## Architecture

### Tome Server (`src/tome-server.js`)

The Tome server provides:

1. **Server-Side Rendering (SSR)**
   - `/checkout` - Fully server-side rendered checkout page
   - XState state machine for checkout flow
   - OpenTelemetry tracing for observability

2. **Client-Side API Endpoints**
   - `/api/cart/add` - Add items to cart
   - `/api/cart/remove` - Remove items from cart
   - `/api/checkout/process` - Process checkout (server-side)

3. **Static Pages**
   - `/cart` - Client-side rendered cart page
   - `/health` - Health check endpoint

### Key Features

#### Server-Side Rendering (Checkout)

```javascript
// Checkout page with SSR
app.get('/checkout', async (req, res) => {
  const span = tracer.startSpan('checkout_page_ssr');
  
  // Server-side state machine
  const checkoutMachine = createCheckoutMachine();
  const service = interpret(checkoutMachine).start();
  
  // Generate SSR HTML
  const html = renderCheckoutPage(state, traceId);
  res.send(html);
});
```

#### Client-Side Rendering (Cart)

```javascript
// Cart page (client-side)
app.get('/cart', (req, res) => {
  const html = renderCartPage(traceId);
  res.send(html);
});
```

#### State Machine Integration

```javascript
// Checkout state machine
const checkoutMachine = createMachine({
  id: 'checkout',
  initial: 'initializing',
  states: {
    initializing: { /* ... */ },
    ready: { /* ... */ },
    validating: { /* ... */ },
    payment: { /* ... */ },
    completed: { /* ... */ },
    error: { /* ... */ },
  },
});
```

## Page Rendering

### Checkout Page (SSR)

**Features:**
- Server-side state machine processing
- Pre-rendered HTML with form validation
- OpenTelemetry tracing
- Client-side JavaScript for form submission

**HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Checkout - Fish Burger</title>
    <style>/* CSS styles */</style>
</head>
<body>
    <div class="checkout-container">
        <h1>🐟 Fish Burger Checkout</h1>
        <p>Server-Side Rendered</p>
        
        <div class="checkout-status">
            <h3>Checkout Status: ${state.context.status}</h3>
            <p>Order ID: ${state.context.orderId}</p>
        </div>

        <form id="checkout-form">
            <!-- Form fields -->
            <button type="submit">Complete Order</button>
        </form>

        <div class="trace-info">
            <strong>Trace ID:</strong> ${traceId}<br>
            <strong>SSR:</strong> Enabled
        </div>
    </div>

    <script>
        // Client-side form submission
        document.getElementById('checkout-form').addEventListener('submit', async (e) => {
            // Handle form submission
        });
    </script>
</body>
</html>
```

### Cart Page (Client-Side)

**Features:**
- Interactive cart management
- Real-time updates
- Client-side state management
- API integration

**HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Cart - Fish Burger</title>
    <style>/* CSS styles */</style>
</head>
<body>
    <div class="cart-container">
        <h1>🛒 Fish Burger Cart</h1>
        <p>Client-Side Rendered</p>

        <div id="cart-items">
            <!-- Dynamic cart items -->
        </div>

        <button onclick="proceedToCheckout()">
            Proceed to Checkout
        </button>

        <div class="trace-info">
            <strong>Trace ID:</strong> ${traceId}<br>
            <strong>SSR:</strong> Disabled (Client-side)
        </div>
    </div>

    <script>
        // Client-side cart management
        let cartItems = [/* ... */];
        
        function renderCart() { /* ... */ }
        function updateQuantity() { /* ... */ }
        function removeItem() { /* ... */ }
        function proceedToCheckout() { /* ... */ }
    </script>
</body>
</html>
```

## API Endpoints

### Cart Operations (Client-Side)

```javascript
// Add item to cart
POST /api/cart/add
{
  "item": {
    "id": 1,
    "name": "Fish Burger",
    "price": 12.99
  }
}

// Remove item from cart
POST /api/cart/remove
{
  "itemId": 1
}
```

### Checkout Operations (Server-Side)

```javascript
// Process checkout
POST /api/checkout/process
{
  "orderData": {
    "orderId": "ORDER-123",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "address": "123 Main St"
    },
    "payment": {
      "method": "credit"
    },
    "items": [...],
    "total": 25.97
  }
}
```

## Tracing Integration

### OpenTelemetry Spans

```javascript
// Checkout page SSR span
const span = tracer.startSpan('checkout_page_ssr');
span.setAttributes({
  'page.type': 'checkout',
  'trace.id': traceId,
  'ssr.enabled': true,
  'state.machine.state': state.value,
  'checkout.items': state.context.items?.length || 0,
});
span.end();

// Cart page client span
const span = tracer.startSpan('cart_page_client');
span.setAttributes({
  'page.type': 'cart',
  'trace.id': traceId,
  'ssr.enabled': false,
});
span.end();
```

### Trace Flow

1. **Client Request** → Generate trace ID
2. **SSR Processing** → Create span for page rendering
3. **State Machine** → Process checkout flow
4. **HTML Generation** → Include trace ID in page
5. **Client Interaction** → Continue trace in browser

## Docker Integration

### Docker Compose Services

```yaml
# Tome Server (SSR)
tome-server:
  build: .
  ports:
    - "3002:3002"
  environment:
    - NODE_ENV=development
    - OTEL_EXPORTER_OTLP_ENDPYPOINT=http://otel-collector:4318/v1/traces
  command: ["node", "src/tome-server.js"]
```

### Running the Stack

```bash
# Start all services including Tome server
docker-compose up -d

# Access pages
curl http://localhost:3002/cart      # Client-side cart
curl http://localhost:3002/checkout  # SSR checkout
```

## Benefits

### Server-Side Rendering (Checkout)

1. **SEO Optimization**: Pre-rendered HTML for search engines
2. **Performance**: Faster initial page load
3. **Security**: Form validation on server
4. **Accessibility**: Better screen reader support
5. **Tracing**: Full request traceability

### Client-Side Rendering (Cart)

1. **Interactivity**: Real-time cart updates
2. **Responsiveness**: Immediate user feedback
3. **State Management**: Client-side state persistence
4. **API Integration**: Dynamic data loading

### Hybrid Approach

1. **Best of Both Worlds**: SSR for critical pages, CSR for interactive features
2. **Performance**: Optimized for each use case
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Independent scaling of SSR and API services

## Usage Examples

### Starting the Tome Server

```bash
# Development
npm run dev:tome

# Production
npm run tome

# Docker
docker-compose up tome-server
```

### Accessing Pages

```bash
# Cart page (client-side)
curl http://localhost:3002/cart

# Checkout page (SSR)
curl http://localhost:3002/checkout

# Health check
curl http://localhost:3002/health
```

### API Operations

```bash
# Add to cart
curl -X POST http://localhost:3002/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"item":{"id":1,"name":"Fish Burger","price":12.99}}'

# Process checkout
curl -X POST http://localhost:3002/api/checkout/process \
  -H "Content-Type: application/json" \
  -d '{"orderData":{"orderId":"ORDER-123","items":[],"total":0}}'
```

## Integration with RobotCopy

The Tome server integrates with RobotCopy for:

1. **Trace Correlation**: Consistent trace IDs across services
2. **Message Tracking**: Track cart and checkout operations
3. **Backend Switching**: Support for different backend services
4. **Unleash Integration**: Feature toggle support

This implementation provides a solid foundation for a production-ready e-commerce system with optimal rendering strategies for different page types. 