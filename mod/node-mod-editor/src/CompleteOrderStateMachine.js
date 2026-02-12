import { createMachine, interpret } from 'xstate';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

class CompleteOrderStateMachine {
  constructor() {
    this.tracer = trace.getTracer('complete-order-state-machine');
    this.machine = this.createCompleteOrderMachine();
  }

  createCompleteOrderMachine() {
    return createMachine({
      id: 'completeOrder',
      initial: 'validating',
      context: {
        orderId: null,
        customer: null,
        items: [],
        total: 0,
        payment: null,
        status: 'pending',
        validationErrors: [],
        paymentErrors: [],
        traceId: null,
        spanId: null,
      },
      states: {
        validating: {
          on: {
            VALIDATE_ORDER: {
              target: 'payment',
              actions: ['validateOrder', 'logValidation'],
            },
            VALIDATION_ERROR: {
              target: 'error',
              actions: ['handleValidationError', 'logValidationError'],
            },
          },
        },
        payment: {
          on: {
            PROCESS_PAYMENT: {
              target: 'processing',
              actions: ['processPayment', 'logPayment'],
            },
            PAYMENT_ERROR: {
              target: 'error',
              actions: ['handlePaymentError', 'logPaymentError'],
            },
          },
        },
        processing: {
          on: {
            COMPLETE_ORDER: {
              target: 'completed',
              actions: ['completeOrder', 'logCompletion'],
            },
            PROCESSING_ERROR: {
              target: 'error',
              actions: ['handleProcessingError', 'logProcessingError'],
            },
          },
        },
        completed: {
          type: 'final',
          entry: ['logOrderCompleted'],
        },
        error: {
          on: {
            RETRY: {
              target: 'validating',
              actions: ['resetOrder', 'logRetry'],
            },
            CANCEL: {
              target: 'cancelled',
              actions: ['cancelOrder', 'logCancellation'],
            },
          },
        },
        cancelled: {
          type: 'final',
          entry: ['logOrderCancelled'],
        },
      },
    }, {
      actions: {
        validateOrder: (context, event) => {
          const span = this.tracer.startSpan('validate_order');
          span.setAttributes({
            'order.id': context.orderId,
            'customer.email': context.customer?.email,
            'items.count': context.items?.length || 0,
            'total.amount': context.total,
            'trace.id': context.traceId,
          });

          // Simulate validation
          const errors = [];
          
          if (!context.customer?.name) {
            errors.push('Customer name is required');
          }
          
          if (!context.customer?.email) {
            errors.push('Customer email is required');
          }
          
          if (!context.customer?.address) {
            errors.push('Delivery address is required');
          }
          
          if (!context.payment?.method) {
            errors.push('Payment method is required');
          }
          
          if (context.items?.length === 0) {
            errors.push('Order must contain at least one item');
          }

          context.validationErrors = errors;
          
          if (errors.length > 0) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation failed' });
            span.setAttributes({ 'validation.errors': JSON.stringify(errors) });
          } else {
            span.setAttributes({ 'validation.status': 'passed' });
          }
          
          span.end();
        },

        processPayment: (context, event) => {
          const span = this.tracer.startSpan('process_payment');
          span.setAttributes({
            'order.id': context.orderId,
            'payment.method': context.payment?.method,
            'total.amount': context.total,
            'trace.id': context.traceId,
          });

          // Simulate payment processing
          const paymentSuccess = Math.random() > 0.1; // 90% success rate
          
          if (paymentSuccess) {
            context.status = 'payment_processed';
            span.setAttributes({ 'payment.status': 'success' });
          } else {
            context.paymentErrors = ['Payment processing failed'];
            span.setStatus({ code: SpanStatusCode.ERROR, message: 'Payment failed' });
          }
          
          span.end();
        },

        completeOrder: (context, event) => {
          const span = this.tracer.startSpan('complete_order');
          span.setAttributes({
            'order.id': context.orderId,
            'total.amount': context.total,
            'trace.id': context.traceId,
          });

          // Simulate order completion
          context.status = 'completed';
          context.orderId = context.orderId || `ORDER-${Date.now()}`;
          
          span.setAttributes({ 'order.status': 'completed' });
          span.end();
        },

        handleValidationError: (context, event) => {
          const span = this.tracer.startSpan('handle_validation_error');
          span.setAttributes({
            'order.id': context.orderId,
            'validation.errors': JSON.stringify(context.validationErrors),
            'trace.id': context.traceId,
          });
          
          context.status = 'validation_failed';
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation error' });
          span.end();
        },

        handlePaymentError: (context, event) => {
          const span = this.tracer.startSpan('handle_payment_error');
          span.setAttributes({
            'order.id': context.orderId,
            'payment.errors': JSON.stringify(context.paymentErrors),
            'trace.id': context.traceId,
          });
          
          context.status = 'payment_failed';
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Payment error' });
          span.end();
        },

        handleProcessingError: (context, event) => {
          const span = this.tracer.startSpan('handle_processing_error');
          span.setAttributes({
            'order.id': context.orderId,
            'trace.id': context.traceId,
          });
          
          context.status = 'processing_failed';
          span.setStatus({ code: SpanStatusCode.ERROR, message: 'Processing error' });
          span.end();
        },

        resetOrder: (context, event) => {
          const span = this.tracer.startSpan('reset_order');
          span.setAttributes({
            'order.id': context.orderId,
            'trace.id': context.traceId,
          });
          
          context.status = 'pending';
          context.validationErrors = [];
          context.paymentErrors = [];
          
          span.setAttributes({ 'order.status': 'reset' });
          span.end();
        },

        cancelOrder: (context, event) => {
          const span = this.tracer.startSpan('cancel_order');
          span.setAttributes({
            'order.id': context.orderId,
            'trace.id': context.traceId,
          });
          
          context.status = 'cancelled';
          span.setAttributes({ 'order.status': 'cancelled' });
          span.end();
        },

        logValidation: (context, event) => {
          console.log(`[${new Date().toISOString()}] Order validation started for ${context.orderId}`);
        },

        logPayment: (context, event) => {
          console.log(`[${new Date().toISOString()}] Payment processing started for ${context.orderId}`);
        },

        logCompletion: (context, event) => {
          console.log(`[${new Date().toISOString()}] Order completion started for ${context.orderId}`);
        },

        logValidationError: (context, event) => {
          console.log(`[${new Date().toISOString()}] Validation error for ${context.orderId}:`, context.validationErrors);
        },

        logPaymentError: (context, event) => {
          console.log(`[${new Date().toISOString()}] Payment error for ${context.orderId}:`, context.paymentErrors);
        },

        logProcessingError: (context, event) => {
          console.log(`[${new Date().toISOString()}] Processing error for ${context.orderId}`);
        },

        logOrderCompleted: (context, event) => {
          console.log(`[${new Date().toISOString()}] Order completed successfully: ${context.orderId}`);
        },

        logOrderCancelled: (context, event) => {
          console.log(`[${new Date().toISOString()}] Order cancelled: ${context.orderId}`);
        },

        logRetry: (context, event) => {
          console.log(`[${new Date().toISOString()}] Order retry for ${context.orderId}`);
        },

        logCancellation: (context, event) => {
          console.log(`[${new Date().toISOString()}] Order cancellation for ${context.orderId}`);
        },
      },
    });
  }

  async processOrder(orderData, traceId = null, spanId = null) {
    const span = this.tracer.startSpan('process_order');
    span.setAttributes({
      'order.id': orderData.orderId,
      'customer.name': orderData.customer?.name,
      'items.count': orderData.items?.length || 0,
      'total.amount': orderData.total,
      'trace.id': traceId,
    });

    try {
      // Initialize the service
      const service = interpret(this.machine).start();
      
      // Set initial context
      service.send({
        type: 'SET_CONTEXT',
        data: {
          orderId: orderData.orderId,
          customer: orderData.customer,
          items: orderData.items,
          total: orderData.total,
          payment: orderData.payment,
          traceId,
          spanId,
        },
      });

      // Process the order through states
      service.send({ type: 'VALIDATE_ORDER' });
      
      if (service.getSnapshot().context.validationErrors.length === 0) {
        service.send({ type: 'PROCESS_PAYMENT' });
        
        if (service.getSnapshot().context.paymentErrors.length === 0) {
          service.send({ type: 'COMPLETE_ORDER' });
        } else {
          service.send({ type: 'PAYMENT_ERROR' });
        }
      } else {
        service.send({ type: 'VALIDATION_ERROR' });
      }

      const finalState = service.getSnapshot();
      
      span.setAttributes({
        'state.machine.state': finalState.value,
        'order.status': finalState.context.status,
        'order.id': finalState.context.orderId,
      });

      return {
        success: finalState.value === 'completed',
        orderId: finalState.context.orderId,
        status: finalState.context.status,
        state: finalState.value,
        context: finalState.context,
        traceId,
      };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }

  async retryOrder(orderId, traceId = null) {
    const span = this.tracer.startSpan('retry_order');
    span.setAttributes({
      'order.id': orderId,
      'trace.id': traceId,
    });

    try {
      const service = interpret(this.machine).start();
      service.send({ type: 'RETRY' });
      
      const state = service.getSnapshot();
      
      span.setAttributes({
        'state.machine.state': state.value,
        'order.status': state.context.status,
      });

      return {
        success: true,
        orderId,
        status: state.context.status,
        state: state.value,
        traceId,
      };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }

  async cancelOrder(orderId, traceId = null) {
    const span = this.tracer.startSpan('cancel_order');
    span.setAttributes({
      'order.id': orderId,
      'trace.id': traceId,
    });

    try {
      const service = interpret(this.machine).start();
      service.send({ type: 'CANCEL' });
      
      const state = service.getSnapshot();
      
      span.setAttributes({
        'state.machine.state': state.value,
        'order.status': state.context.status,
      });

      return {
        success: true,
        orderId,
        status: state.context.status,
        state: state.value,
        traceId,
      };
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  }
}

export { CompleteOrderStateMachine }; 