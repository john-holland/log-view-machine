const express = require('express');
const { createMachine, interpret } = require('xstate');
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { CompleteOrderStateMachine } = require('./CompleteOrderStateMachine');

// Tome server for SSR
class TomeServer {
  constructor() {
    this.app = express();
    this.tracer = trace.getTracer('tome-server');
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Extract trace context
    this.app.use((req, res, next) => {
      const traceId = req.headers['x-trace-id'] || uuidv4();
      const spanId = req.headers['x-span-id'] || uuidv4();
      req.traceContext = { traceId, spanId };
      next();
    });
  }

  setupRoutes() {
    // Server-side rendered checkout page
    this.app.get('/checkout', async (req, res) => {
      const { traceId, spanId } = req.traceContext;
      const span = this.tracer.startSpan('checkout_page_ssr');
      
      try {
        span.setAttributes({
          'page.type': 'checkout',
          'trace.id': traceId,
          'ssr.enabled': true,
        });

        // Simulate server-side state machine for checkout
        const checkoutMachine = this.createCheckoutMachine();
        const service = interpret(checkoutMachine).start();
        
        // Server-side state processing
        service.send({ type: 'INITIALIZE_CHECKOUT' });
        const state = service.getSnapshot();

        // Generate SSR HTML
        const html = this.renderCheckoutPage(state, traceId);
        
        span.setAttributes({
          'state.machine.state': state.value,
          'checkout.items': state.context.items?.length || 0,
        });

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).send('Error rendering checkout page');
      } finally {
        span.end();
      }
    });

    // Client-side cart page (static)
    this.app.get('/cart', (req, res) => {
      const { traceId } = req.traceContext;
      const span = this.tracer.startSpan('cart_page_client');
      
      try {
        span.setAttributes({
          'page.type': 'cart',
          'trace.id': traceId,
          'ssr.enabled': false,
        });

        const html = this.renderCartPage(traceId);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).send('Error rendering cart page');
      } finally {
        span.end();
      }
    });

    // API endpoints for cart operations (client-side)
    this.app.post('/api/cart/add', async (req, res) => {
      const { item } = req.body;
      const { traceId, spanId } = req.traceContext;
      
      const span = this.tracer.startSpan('add_to_cart');
      span.setAttributes({
        'item.id': item?.id,
        'item.name': item?.name,
        'trace.id': traceId,
      });

      try {
        // Simulate cart addition
        const result = { success: true, item, messageId: uuidv4() };
        res.json(result);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: error.message });
      } finally {
        span.end();
      }
    });

    this.app.post('/api/cart/remove', async (req, res) => {
      const { itemId } = req.body;
      const { traceId } = req.traceContext;
      
      const span = this.tracer.startSpan('remove_from_cart');
      span.setAttributes({
        'item.id': itemId,
        'trace.id': traceId,
      });

      try {
        const result = { success: true, itemId, messageId: uuidv4() };
        res.json(result);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: error.message });
      } finally {
        span.end();
      }
    });

    // Checkout API (server-side processing)
    this.app.post('/api/checkout/process', async (req, res) => {
      const { orderData } = req.body;
      const { traceId, spanId } = req.traceContext;
      
      const span = this.tracer.startSpan('process_checkout');
      span.setAttributes({
        'order.id': orderData?.orderId,
        'trace.id': traceId,
      });

      try {
        // Use CompleteOrderStateMachine for server-side processing
        const completeOrderMachine = new CompleteOrderStateMachine();
        const result = await completeOrderMachine.processOrder(orderData, traceId, spanId);
        
        span.setAttributes({
          'state.machine.state': result.state,
          'checkout.status': result.status,
          'order.success': result.success,
        });

        res.json({
          success: result.success,
          orderId: result.orderId,
          status: result.status,
          state: result.state,
          messageId: uuidv4(),
          traceId,
        });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: error.message });
      } finally {
        span.end();
      }
    });

    // CompleteOrderStateMachine API endpoints
    this.app.post('/api/order/retry', async (req, res) => {
      const { orderId } = req.body;
      const { traceId } = req.traceContext;
      
      const span = this.tracer.startSpan('retry_order');
      span.setAttributes({
        'order.id': orderId,
        'trace.id': traceId,
      });

      try {
        const completeOrderMachine = new CompleteOrderStateMachine();
        const result = await completeOrderMachine.retryOrder(orderId, traceId);
        
        span.setAttributes({
          'state.machine.state': result.state,
          'order.status': result.status,
        });

        res.json({
          success: result.success,
          orderId: result.orderId,
          status: result.status,
          state: result.state,
          traceId,
        });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: error.message });
      } finally {
        span.end();
      }
    });

    this.app.post('/api/order/cancel', async (req, res) => {
      const { orderId } = req.body;
      const { traceId } = req.traceContext;
      
      const span = this.tracer.startSpan('cancel_order');
      span.setAttributes({
        'order.id': orderId,
        'trace.id': traceId,
      });

      try {
        const completeOrderMachine = new CompleteOrderStateMachine();
        const result = await completeOrderMachine.cancelOrder(orderId, traceId);
        
        span.setAttributes({
          'state.machine.state': result.state,
          'order.status': result.status,
        });

        res.json({
          success: result.success,
          orderId: result.orderId,
          status: result.status,
          state: result.state,
          traceId,
        });
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: error.message });
      } finally {
        span.end();
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'tome-server',
        ssr: {
          checkout: true,
          cart: false,
        },
        stateMachines: {
          completeOrder: true,
        },
      });
    });
  }

  createCheckoutMachine() {
    return createMachine({
      id: 'checkout',
      initial: 'initializing',
      context: {
        items: [],
        total: 0,
        status: 'pending',
        orderId: null,
        customer: null,
        payment: null,
      },
      states: {
        initializing: {
          on: {
            INITIALIZE_CHECKOUT: {
              target: 'ready',
              actions: 'initializeCheckout',
            },
          },
        },
        ready: {
          on: {
            START_CHECKOUT: {
              target: 'validating',
              actions: 'startCheckout',
            },
          },
        },
        validating: {
          on: {
            VALIDATE_ORDER: {
              target: 'payment',
              actions: 'validateOrder',
            },
            VALIDATION_ERROR: {
              target: 'error',
              actions: 'handleValidationError',
            },
          },
        },
        payment: {
          on: {
            PROCESS_PAYMENT: {
              target: 'completed',
              actions: 'processPayment',
            },
            PAYMENT_ERROR: {
              target: 'error',
              actions: 'handlePaymentError',
            },
          },
        },
        completed: {
          type: 'final',
        },
        error: {
          on: {
            RETRY: {
              target: 'ready',
              actions: 'resetCheckout',
            },
          },
        },
      },
    }, {
      actions: {
        initializeCheckout: (context, event) => {
          context.status = 'initializing';
        },
        startCheckout: (context, event) => {
          context.orderId = event.data?.orderId || uuidv4();
          context.items = event.data?.items || [];
          context.total = event.data?.total || 0;
          context.status = 'validating';
        },
        validateOrder: (context, event) => {
          context.status = 'payment';
        },
        processPayment: (context, event) => {
          context.status = 'completed';
        },
        handleValidationError: (context, event) => {
          context.status = 'error';
        },
        handlePaymentError: (context, event) => {
          context.status = 'error';
        },
        resetCheckout: (context, event) => {
          context.status = 'ready';
        },
      },
    });
  }

  renderCheckoutPage(state, traceId) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - Fish Burger</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .checkout-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .checkout-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .checkout-status {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .order-summary {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
        }
        button {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            background: #0056b3;
        }
        .trace-info {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="checkout-container">
        <div class="checkout-header">
            <h1>🐟 Fish Burger Checkout</h1>
            <p>Server-Side Rendered</p>
        </div>

        <div class="checkout-status">
            <h3>Checkout Status: ${state.context.status}</h3>
            <p>Order ID: ${state.context.orderId || 'Pending'}</p>
        </div>

        <div class="order-summary">
            <h3>Order Summary</h3>
            <p>Items: ${state.context.items?.length || 0}</p>
            <p>Total: $${state.context.total || 0}</p>
        </div>

        <form id="checkout-form">
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required>
            </div>

            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required>
            </div>

            <div class="form-group">
                <label for="address">Delivery Address</label>
                <input type="text" id="address" name="address" required>
            </div>

            <div class="form-group">
                <label for="payment">Payment Method</label>
                <select id="payment" name="payment" required>
                    <option value="">Select payment method</option>
                    <option value="credit">Credit Card</option>
                    <option value="debit">Debit Card</option>
                    <option value="paypal">PayPal</option>
                </select>
            </div>

            <button type="submit">Complete Order</button>
        </form>

        <div class="trace-info">
            <strong>Trace ID:</strong> ${traceId}<br>
            <strong>State:</strong> ${state.value}<br>
            <strong>SSR:</strong> Enabled
        </div>
    </div>

    <script>
        // Client-side JavaScript for form submission
        document.getElementById('checkout-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const orderData = {
                orderId: '${state.context.orderId || uuidv4()}',
                customer: {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    address: formData.get('address'),
                },
                payment: {
                    method: formData.get('payment'),
                },
                items: ${JSON.stringify(state.context.items || [])},
                total: ${state.context.total || 0},
            };

            try {
                const response = await fetch('/api/checkout/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-trace-id': '${traceId}',
                    },
                    body: JSON.stringify({ orderData }),
                });

                const result = await response.json();
                
                if (result.success) {
                    alert('Order completed successfully!');
                    window.location.href = '/cart';
                } else {
                    alert('Error processing order: ' + result.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error processing order');
            }
        });
    </script>
</body>
</html>
    `;
  }

  renderCartPage(traceId) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cart - Fish Burger</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .cart-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .cart-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .cart-items {
            margin-bottom: 20px;
        }
        .cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        .item-info {
            flex: 1;
        }
        .item-actions {
            display: flex;
            gap: 10px;
        }
        button {
            background: #007bff;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
        .checkout-btn {
            background: #28a745;
            padding: 12px 24px;
            font-size: 16px;
            width: 100%;
        }
        .checkout-btn:hover {
            background: #218838;
        }
        .trace-info {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="cart-container">
        <div class="cart-header">
            <h1>🛒 Fish Burger Cart</h1>
            <p>Client-Side Rendered</p>
        </div>

        <div id="cart-items" class="cart-items">
            <p>Loading cart items...</p>
        </div>

        <div id="cart-total">
            <h3>Total: $0.00</h3>
        </div>

        <button class="checkout-btn" onclick="proceedToCheckout()">
            Proceed to Checkout
        </button>

        <div class="trace-info">
            <strong>Trace ID:</strong> ${traceId}<br>
            <strong>SSR:</strong> Disabled (Client-side)
        </div>
    </div>

    <script>
        // Client-side cart management
        let cartItems = [
            { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 },
            { id: 2, name: 'French Fries', price: 4.99, quantity: 1 },
            { id: 3, name: 'Soda', price: 2.99, quantity: 1 },
        ];

        function renderCart() {
            const cartContainer = document.getElementById('cart-items');
            const totalElement = document.getElementById('cart-total');
            
            if (cartItems.length === 0) {
                cartContainer.innerHTML = '<p>Your cart is empty</p>';
                totalElement.innerHTML = '<h3>Total: $0.00</h3>';
                return;
            }

            const itemsHtml = cartItems.map(item => \`
                <div class="cart-item">
                    <div class="item-info">
                        <h4>\${item.name}</h4>
                        <p>Quantity: \${item.quantity} | Price: $\${item.price}</p>
                    </div>
                    <div class="item-actions">
                        <button onclick="updateQuantity(\${item.id}, \${item.quantity + 1})">+</button>
                        <button onclick="updateQuantity(\${item.id}, \${item.quantity - 1})">-</button>
                        <button onclick="removeItem(\${item.id})">Remove</button>
                    </div>
                </div>
            \`).join('');

            cartContainer.innerHTML = itemsHtml;

            const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            totalElement.innerHTML = \`<h3>Total: $\${total.toFixed(2)}</h3>\`;
        }

        function updateQuantity(itemId, newQuantity) {
            if (newQuantity <= 0) {
                removeItem(itemId);
                return;
            }

            const item = cartItems.find(item => item.id === itemId);
            if (item) {
                item.quantity = newQuantity;
                renderCart();
            }
        }

        function removeItem(itemId) {
            cartItems = cartItems.filter(item => item.id !== itemId);
            renderCart();
        }

        function proceedToCheckout() {
            const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const orderData = {
                items: cartItems,
                total: total,
            };

            // Store order data in sessionStorage for checkout page
            sessionStorage.setItem('orderData', JSON.stringify(orderData));
            window.location.href = '/checkout';
        }

        // Initialize cart on page load
        renderCart();
    </script>
</body>
</html>
    `;
  }

  start(port = 3002) {
    this.app.listen(port, () => {
      console.log(`Tome Server running on port ${port}`);
      console.log('Checkout page: http://localhost:3002/checkout (SSR)');
      console.log('Cart page: http://localhost:3002/cart (Client-side)');
    });
  }
}

// Create and start the Tome server
const tomeServer = new TomeServer();
tomeServer.start(3002);

module.exports = { TomeServer }; 