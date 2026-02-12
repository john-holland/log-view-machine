const request = require('supertest');
const { TomeServer } = require('../tome-server');

describe('Tome Server Tests', () => {
  let tomeServer;
  let app;

  beforeAll(() => {
    tomeServer = new TomeServer();
    app = tomeServer.app;
  });

  describe('SSR Checkout Page', () => {
    it('should render server-side checkout page', async () => {
      const response = await request(app)
        .get('/checkout')
        .set('x-trace-id', 'test-trace-123')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Server-Side Rendered Checkout');
      expect(response.text).toContain('test-trace-123');
      expect(response.text).toContain('Order Summary');
      expect(response.text).toContain('Customer Information');
      expect(response.text).toContain('Payment Information');
    });

    it('should include trace ID in rendered HTML', async () => {
      const traceId = 'tome-trace-456';
      const response = await request(app)
        .get('/checkout')
        .set('x-trace-id', traceId)
        .expect(200);

      expect(response.text).toContain(traceId);
      expect(response.text).toContain('data-trace-id');
    });

    it('should render with default trace ID if not provided', async () => {
      const response = await request(app)
        .get('/checkout')
        .expect(200);

      expect(response.text).toContain('data-trace-id');
      expect(response.text).toContain('Server-Side Rendered Checkout');
    });
  });

  describe('CSR Cart Page', () => {
    it('should render client-side cart page', async () => {
      const response = await request(app)
        .get('/cart')
        .set('x-trace-id', 'test-trace-789')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Client-Side Cart');
      expect(response.text).toContain('test-trace-789');
      expect(response.text).toContain('Add to Cart');
      expect(response.text).toContain('Proceed to Checkout');
    });

    it('should include client-side JavaScript', async () => {
      const response = await request(app)
        .get('/cart')
        .expect(200);

      expect(response.text).toContain('<script>');
      expect(response.text).toContain('addToCart');
      expect(response.text).toContain('removeFromCart');
      expect(response.text).toContain('proceedToCheckout');
    });
  });

  describe('Cart API Endpoints', () => {
    it('should add item to cart', async () => {
      const item = {
        id: 1,
        name: 'Fish Burger',
        price: 12.99,
        quantity: 1
      };

      const response = await request(app)
        .post('/api/cart/add')
        .set('x-trace-id', 'cart-trace-123')
        .send({ item })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Item added to cart'),
        item: item,
        traceId: 'cart-trace-123'
      });
    });

    it('should remove item from cart', async () => {
      const itemId = 1;

      const response = await request(app)
        .post('/api/cart/remove')
        .set('x-trace-id', 'cart-trace-456')
        .send({ itemId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Item removed from cart'),
        itemId: itemId,
        traceId: 'cart-trace-456'
      });
    });

    it('should handle cart operations with missing data', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Item data is required')
      });
    });
  });

  describe('Checkout API Endpoints', () => {
    it('should process checkout successfully', async () => {
      const orderData = {
        orderId: 'TOME-ORDER-001',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St'
        },
        items: [
          { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }
        ],
        total: 12.99,
        payment: { method: 'credit', cardType: 'Visa' }
      };

      const response = await request(app)
        .post('/api/checkout/process')
        .set('x-trace-id', 'checkout-trace-123')
        .send({ orderData })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TOME-ORDER-001',
        status: expect.any(String),
        state: expect.any(String),
        messageId: expect.any(String),
        traceId: 'checkout-trace-123'
      });
    });

    it('should handle checkout with invalid order data', async () => {
      const response = await request(app)
        .post('/api/checkout/process')
        .send({ orderData: {} })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid order data')
      });
    });
  });

  describe('Order Management API', () => {
    it('should retry order successfully', async () => {
      const orderId = 'TOME-RETRY-001';

      const response = await request(app)
        .post('/api/order/retry')
        .set('x-trace-id', 'retry-trace-123')
        .send({ orderId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TOME-RETRY-001',
        status: expect.any(String),
        state: expect.any(String),
        traceId: 'retry-trace-123'
      });
    });

    it('should cancel order successfully', async () => {
      const orderId = 'TOME-CANCEL-001';

      const response = await request(app)
        .post('/api/order/cancel')
        .set('x-trace-id', 'cancel-trace-123')
        .send({ orderId })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        orderId: 'TOME-CANCEL-001',
        status: expect.any(String),
        state: expect.any(String),
        traceId: 'cancel-trace-123'
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'tome-server',
        ssr: {
          checkout: true,
          cart: false
        },
        stateMachines: {
          completeOrder: true
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Route not found'
      });
    });

    it('should handle server errors gracefully', async () => {
      // Mock a server error by sending invalid data
      const response = await request(app)
        .post('/api/checkout/process')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Tracing Integration', () => {
    it('should propagate trace headers through all endpoints', async () => {
      const traceId = 'tome-trace-integration';
      const spanId = 'tome-span-integration';

      // Test cart operation
      const cartResponse = await request(app)
        .post('/api/cart/add')
        .set('x-trace-id', traceId)
        .set('x-span-id', spanId)
        .send({ item: { id: 1, name: 'Test Item', price: 10.00 } })
        .expect(200);

      expect(cartResponse.body.traceId).toBe(traceId);

      // Test checkout operation
      const checkoutResponse = await request(app)
        .post('/api/checkout/process')
        .set('x-trace-id', traceId)
        .set('x-span-id', spanId)
        .send({
          orderData: {
            orderId: 'TRACE-TEST-001',
            customer: { name: 'Test', email: 'test@example.com' },
            items: [{ id: 1, name: 'Test Item', price: 10.00 }],
            total: 10.00,
            payment: { method: 'credit' }
          }
        })
        .expect(200);

      expect(checkoutResponse.body.traceId).toBe(traceId);
    });

    it('should handle missing trace headers gracefully', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({ item: { id: 1, name: 'Test Item', price: 10.00 } })
        .expect(200);

      // Should still work without trace headers
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('traceId');
    });
  });

  describe('SSR vs CSR Pattern', () => {
    it('should render checkout page with server-side state', async () => {
      const response = await request(app)
        .get('/checkout')
        .expect(200);

      // Should contain server-rendered content
      expect(response.text).toContain('Server-Side Rendered Checkout');
      expect(response.text).toContain('Order Summary');
      expect(response.text).toContain('Customer Information');
      
      // Should NOT contain client-side JavaScript for checkout
      expect(response.text).not.toContain('addToCart');
      expect(response.text).not.toContain('removeFromCart');
    });

    it('should render cart page with client-side interactivity', async () => {
      const response = await request(app)
        .get('/cart')
        .expect(200);

      // Should contain client-side JavaScript
      expect(response.text).toContain('Client-Side Cart');
      expect(response.text).toContain('<script>');
      expect(response.text).toContain('addToCart');
      expect(response.text).toContain('removeFromCart');
      expect(response.text).toContain('proceedToCheckout');
    });

    it('should demonstrate hybrid rendering pattern', async () => {
      // Test SSR checkout page
      const checkoutResponse = await request(app)
        .get('/checkout')
        .expect(200);

      expect(checkoutResponse.text).toContain('Server-Side Rendered Checkout');
      expect(checkoutResponse.text).toContain('data-trace-id');

      // Test CSR cart page
      const cartResponse = await request(app)
        .get('/cart')
        .expect(200);

      expect(cartResponse.text).toContain('Client-Side Cart');
      expect(cartResponse.text).toContain('addToCart');

      // Both should work with the same trace ID
      const traceId = 'hybrid-trace-123';
      
      const checkoutWithTrace = await request(app)
        .get('/checkout')
        .set('x-trace-id', traceId)
        .expect(200);

      const cartWithTrace = await request(app)
        .get('/cart')
        .set('x-trace-id', traceId)
        .expect(200);

      expect(checkoutWithTrace.text).toContain(traceId);
      expect(cartWithTrace.text).toContain(traceId);
    });
  });
}); 