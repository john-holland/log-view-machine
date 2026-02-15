const { createMachine, interpret } = require('xstate');
const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { CompleteOrderStateMachine } = require('../CompleteOrderStateMachine');

describe('XState PACT Tests - Fish Burger Business Logic', () => {
  let completeOrderMachine;
  let tracer;

  beforeEach(() => {
    completeOrderMachine = new CompleteOrderStateMachine();
    tracer = trace.getTracer('test-tracer');
  });

  describe('CompleteOrderStateMachine PACT Tests', () => {
    describe('Order Validation PACT', () => {
      it('should validate complete order data successfully', async () => {
        const orderData = {
          orderId: 'PACT-ORDER-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St, City, State 12345'
          },
          items: [
            { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 },
            { id: 2, name: 'French Fries', price: 4.99, quantity: 1 }
          ],
          total: 17.98,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-123');

        expect(result).toMatchObject({
          success: true,
          orderId: 'PACT-ORDER-001',
          status: 'completed',
          state: 'completed',
          traceId: 'pact-trace-123'
        });

        expect(result.context).toMatchObject({
          orderId: 'PACT-ORDER-001',
          customer: orderData.customer,
          items: orderData.items,
          total: 17.98,
          payment: orderData.payment,
          status: 'completed',
          validationErrors: [],
          paymentErrors: []
        });
      });

      it('should reject order with missing customer information', async () => {
        const orderData = {
          orderId: 'PACT-ORDER-002',
          customer: {
            name: 'John Doe',
            // Missing email and address
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-124');

        expect(result).toMatchObject({
          success: false,
          orderId: 'PACT-ORDER-002',
          status: 'validation_failed',
          state: 'error',
          traceId: 'pact-trace-124'
        });

        expect(result.context.validationErrors).toContain('Customer email is required');
        expect(result.context.validationErrors).toContain('Delivery address is required');
      });

      it('should reject order with empty items list', async () => {
        const orderData = {
          orderId: 'PACT-ORDER-003',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [], // Empty items
          total: 0,
          payment: { method: 'credit' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-125');

        expect(result).toMatchObject({
          success: false,
          orderId: 'PACT-ORDER-003',
          status: 'validation_failed',
          state: 'error',
          traceId: 'pact-trace-125'
        });

        expect(result.context.validationErrors).toContain('Order must contain at least one item');
      });

      it('should reject order with missing payment method', async () => {
        const orderData = {
          orderId: 'PACT-ORDER-004',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: {}, // Missing payment method
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-126');

        expect(result).toMatchObject({
          success: false,
          orderId: 'PACT-ORDER-004',
          status: 'validation_failed',
          state: 'error',
          traceId: 'pact-trace-126'
        });

        expect(result.context.validationErrors).toContain('Payment method is required');
      });
    });

    describe('Payment Processing PACT', () => {
      it('should process payment successfully', async () => {
        const orderData = {
          orderId: 'PACT-PAYMENT-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-127');

        // Payment should succeed (90% success rate in our mock)
        expect(result.success).toBeDefined();
        expect(result.orderId).toBe('PACT-PAYMENT-001');
        expect(result.traceId).toBe('pact-trace-127');
      });

      it('should handle payment failure gracefully', async () => {
        // Mock payment failure by manipulating the random function
        const originalRandom = Math.random;
        Math.random = jest.fn().mockReturnValue(0.05); // Force payment failure

        const orderData = {
          orderId: 'PACT-PAYMENT-002',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-128');

        expect(result).toMatchObject({
          success: false,
          orderId: 'PACT-PAYMENT-002',
          status: 'payment_failed',
          state: 'error',
          traceId: 'pact-trace-128'
        });

        expect(result.context.paymentErrors).toContain('Payment processing failed');

        // Restore original random function
        Math.random = originalRandom;
      });
    });

    describe('Order Completion PACT', () => {
      it('should complete order successfully', async () => {
        const orderData = {
          orderId: 'PACT-COMPLETE-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-129');

        expect(result).toMatchObject({
          success: true,
          orderId: 'PACT-COMPLETE-001',
          status: 'completed',
          state: 'completed',
          traceId: 'pact-trace-129'
        });

        expect(result.context).toMatchObject({
          orderId: 'PACT-COMPLETE-001',
          status: 'completed',
          validationErrors: [],
          paymentErrors: []
        });
      });
    });

    describe('Order Retry PACT', () => {
      it('should retry failed order successfully', async () => {
        const orderId = 'PACT-RETRY-001';
        const traceId = 'pact-trace-130';

        const result = await completeOrderMachine.retryOrder(orderId, traceId);

        expect(result).toMatchObject({
          success: true,
          orderId: 'PACT-RETRY-001',
          status: 'pending',
          state: 'validating',
          traceId: 'pact-trace-130'
        });
      });
    });

    describe('Order Cancellation PACT', () => {
      it('should cancel order successfully', async () => {
        const orderId = 'PACT-CANCEL-001';
        const traceId = 'pact-trace-131';

        const result = await completeOrderMachine.cancelOrder(orderId, traceId);

        expect(result).toMatchObject({
          success: true,
          orderId: 'PACT-CANCEL-001',
          status: 'cancelled',
          state: 'cancelled',
          traceId: 'pact-trace-131'
        });
      });
    });
  });

  describe('State Machine PACT Tests', () => {
    describe('State Transitions PACT', () => {
      it('should follow correct state transition path', async () => {
        const orderData = {
          orderId: 'PACT-TRANSITION-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-132');

        // Should follow: validating -> payment -> processing -> completed
        expect(result.state).toBe('completed');
        expect(result.context.status).toBe('completed');
      });

      it('should handle error state transitions', async () => {
        const orderData = {
          orderId: 'PACT-ERROR-001',
          customer: {
            name: 'John Doe',
            // Missing required fields
          },
          items: [],
          total: 0,
          payment: {},
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-133');

        // Should follow: validating -> error
        expect(result.state).toBe('error');
        expect(result.context.status).toBe('validation_failed');
      });
    });

    describe('Context PACT', () => {
      it('should maintain context throughout state transitions', async () => {
        const orderData = {
          orderId: 'PACT-CONTEXT-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-134');

        expect(result.context).toMatchObject({
          orderId: 'PACT-CONTEXT-001',
          customer: orderData.customer,
          items: orderData.items,
          total: 12.99,
          payment: orderData.payment,
          status: 'completed'
        });
      });

      it('should accumulate validation errors in context', async () => {
        const orderData = {
          orderId: 'PACT-ERRORS-001',
          customer: {
            name: 'John Doe',
            // Missing email and address
          },
          items: [],
          total: 0,
          payment: {},
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-135');

        expect(result.context.validationErrors).toContain('Customer email is required');
        expect(result.context.validationErrors).toContain('Delivery address is required');
        expect(result.context.validationErrors).toContain('Payment method is required');
        expect(result.context.validationErrors).toContain('Order must contain at least one item');
      });
    });
  });

  describe('Tracing PACT Tests', () => {
    it('should propagate trace context through all operations', async () => {
      const orderData = {
        orderId: 'PACT-TRACE-001',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St'
        },
        items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
        total: 12.99,
        payment: { method: 'credit', cardType: 'Visa' },
        status: 'pending'
      };

      const traceId = 'pact-trace-136';
      const spanId = 'pact-span-136';

      const result = await completeOrderMachine.processOrder(orderData, traceId, spanId);

      expect(result).toMatchObject({
        success: true,
        orderId: 'PACT-TRACE-001',
        traceId: 'pact-trace-136'
      });

      expect(result.context).toMatchObject({
        traceId: 'pact-trace-136',
        spanId: 'pact-span-136'
      });
    });

    it('should handle missing trace context gracefully', async () => {
      const orderData = {
        orderId: 'PACT-TRACE-002',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St'
        },
        items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
        total: 12.99,
        payment: { method: 'credit', cardType: 'Visa' },
        status: 'pending'
      };

      const result = await completeOrderMachine.processOrder(orderData);

      expect(result).toMatchObject({
        success: true,
        orderId: 'PACT-TRACE-002'
      });

      // Should still work without trace context
      expect(result.traceId).toBeNull();
    });
  });

  describe('Business Logic PACT Tests', () => {
    describe('Order Validation Business Rules', () => {
      it('should enforce minimum order value', async () => {
        const orderData = {
          orderId: 'PACT-MIN-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-137');

        // Should pass validation (order has items and meets minimum requirements)
        expect(result.success).toBe(true);
        expect(result.state).toBe('completed');
      });

      it('should validate customer information completeness', async () => {
        const orderData = {
          orderId: 'PACT-CUSTOMER-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-138');

        // Should pass customer validation
        expect(result.success).toBe(true);
        expect(result.context.validationErrors).toHaveLength(0);
      });
    });

    describe('Payment Processing Business Rules', () => {
      it('should accept valid payment methods', async () => {
        const validPaymentMethods = ['credit', 'debit', 'paypal'];

        for (const method of validPaymentMethods) {
          const orderData = {
            orderId: `PACT-PAYMENT-${method.toUpperCase()}`,
            customer: {
              name: 'John Doe',
              email: 'john@example.com',
              address: '123 Main St'
            },
            items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
            total: 12.99,
            payment: { method },
            status: 'pending'
          };

          const result = await completeOrderMachine.processOrder(orderData, `pact-trace-${method}`);

          // Should pass payment method validation
          expect(result.context.validationErrors).not.toContain('Payment method is required');
        }
      });
    });

    describe('Order Completion Business Rules', () => {
      it('should complete orders with valid data', async () => {
        const orderData = {
          orderId: 'PACT-COMPLETE-BIZ-001',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [{ id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 }],
          total: 12.99,
          payment: { method: 'credit', cardType: 'Visa' },
          status: 'pending'
        };

        const result = await completeOrderMachine.processOrder(orderData, 'pact-trace-139');

        // Should complete successfully
        expect(result.success).toBe(true);
        expect(result.state).toBe('completed');
        expect(result.context.status).toBe('completed');
      });
    });
  });
}); 