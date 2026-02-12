import express from 'express';
import { createMachine, interpret } from 'xstate';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { CompleteOrderStateMachine } from './CompleteOrderStateMachine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Client-side cart page (static template)
    this.app.get('/cart', (req, res) => {
      const { traceId } = req.traceContext;
      const span = this.tracer.startSpan('cart_page_client');
      
      try {
        span.setAttributes({
          'page.type': 'cart',
          'trace.id': traceId,
          'ssr.enabled': false,
        });

        // Serve the static burger cart template
        const templatePath = path.join(__dirname, 'component-middleware/generic-editor/templates/burger-cart-component/template.html');
        res.sendFile(templatePath);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).send('Error serving cart template');
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
        const result = {
          success: true,
          message: 'Item added to cart',
          item: item,
          timestamp: new Date().toISOString(),
          traceId: traceId
        };

        span.setAttributes({
          'cart.operation': 'add',
          'cart.item_count': 1,
        });

        res.json(result);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: 'Failed to add item to cart' });
      } finally {
        span.end();
      }
    });

    this.app.post('/api/cart/remove', async (req, res) => {
      const { itemId } = req.body;
      const { traceId, spanId } = req.traceContext;
      
      const span = this.tracer.startSpan('remove_from_cart');
      span.setAttributes({
        'item.id': itemId,
        'trace.id': traceId,
      });

      try {
        // Simulate cart removal
        const result = {
          success: true,
          message: 'Item removed from cart',
          itemId: itemId,
          timestamp: new Date().toISOString(),
          traceId: traceId
        };

        span.setAttributes({
          'cart.operation': 'remove',
          'cart.item_removed': true,
        });

        res.json(result);
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        res.status(500).json({ error: 'Failed to remove item from cart' });
      } finally {
        span.end();
      }
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.redirect('/cart');
    });
  }

  createCheckoutMachine() {
    return createMachine({
      id: 'checkout',
      initial: 'idle',
      context: {
        items: [],
        total: 0,
        user: null,
        payment: null,
        shipping: null,
        traceId: null
      },
      states: {
        idle: {
          on: {
            INITIALIZE_CHECKOUT: 'loading'
          }
        },
        loading: {
          on: {
            CHECKOUT_LOADED: 'ready',
            LOAD_ERROR: 'error'
          }
        },
        ready: {
          on: {
            ADD_ITEM: 'adding_item',
            REMOVE_ITEM: 'removing_item',
            UPDATE_QUANTITY: 'updating',
            PROCEED_TO_PAYMENT: 'payment'
          }
        },
        adding_item: {
          on: {
            ITEM_ADDED: 'ready',
            ADD_ERROR: 'error'
          }
        },
        removing_item: {
          on: {
            ITEM_REMOVED: 'ready',
            REMOVE_ERROR: 'error'
          }
        },
        updating: {
          on: {
            QUANTITY_UPDATED: 'ready',
            UPDATE_ERROR: 'error'
          }
        },
        payment: {
          on: {
            PAYMENT_SUCCESS: 'shipping',
            PAYMENT_ERROR: 'error'
          }
        },
        shipping: {
          on: {
            SHIPPING_SELECTED: 'review',
            SHIPPING_ERROR: 'error'
          }
        },
        review: {
          on: {
            CONFIRM_ORDER: 'processing',
            MODIFY_ORDER: 'ready'
          }
        },
        processing: {
          on: {
            ORDER_PROCESSED: 'success',
            PROCESSING_ERROR: 'error'
          }
        },
        success: {
          on: {
            NEW_ORDER: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'idle'
          }
        }
      }
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
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }

            .checkout-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }

            .checkout-header {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                padding: 30px;
                text-align: center;
            }

            .checkout-content {
                padding: 30px;
            }

            .order-summary {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
            }

            .order-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }

            .order-item:last-child {
                border-bottom: none;
            }

            .checkout-form {
                margin-top: 30px;
            }

            .form-group {
                margin-bottom: 20px;
            }

            .form-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 500;
                color: #2c3e50;
            }

            .form-group input, .form-group select {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                font-size: 16px;
            }

            .checkout-btn {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                border: none;
                border-radius: 8px;
                padding: 15px 30px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                width: 100%;
                transition: all 0.3s;
            }

            .checkout-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
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
                <h1>💳 Checkout</h1>
                <p>Complete your order</p>
            </div>

            <div class="checkout-content">
                <div class="order-summary">
                    <h3>Order Summary</h3>
                    <div class="order-item">
                        <span>Fish Burger</span>
                        <span>$12.99</span>
                    </div>
                    <div class="order-item">
                        <span>French Fries</span>
                        <span>$4.99</span>
                    </div>
                    <div class="order-item">
                        <span>Soda</span>
                        <span>$2.99</span>
                    </div>
                    <hr>
                    <div class="order-item">
                        <strong>Total</strong>
                        <strong>$20.97</strong>
                    </div>
                </div>

                <form class="checkout-form">
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

                    <button type="submit" class="checkout-btn">
                        Complete Order
                    </button>
                </form>

                <div class="trace-info">
                    <p>Server-Side Rendered</p>
                    <p>Trace ID: ${traceId}</p>
                    <p>State: ${state.value}</p>
                </div>
            </div>
        </div>

        <script>
            document.querySelector('.checkout-form').addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Order completed! (This is a demo)');
                window.location.href = '/cart';
            });
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

export { TomeServer };
