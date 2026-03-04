import React, { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { RobotCopy, createRobotCopy } from '../core/Cave/tome/viewstatemachine/robotcopy/RobotCopy';

// Create the CompleteOrderStateMachine as a reusable sub-machine
export const createCompleteOrderStateMachine = () => {
  return createViewStateMachine({
    machineId: 'complete-order-submachine',
    xstateConfig: {
      id: 'completeOrder',
      initial: 'validating',
      context: {
        orderId: null as string | null,
        customer: null as any,
        items: [] as any[],
        total: 0,
        payment: null as any,
        status: 'pending' as string,
        validationErrors: [] as string[],
        paymentErrors: [] as string[],
        traceId: null as string | null,
        spanId: null as string | null,
        parentMachineId: null as string | null,
      },
      states: {
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
              target: 'processing',
              actions: 'processPayment',
            },
            PAYMENT_ERROR: {
              target: 'error',
              actions: 'handlePaymentError',
            },
          },
        },
        processing: {
          on: {
            COMPLETE_ORDER: {
              target: 'completed',
              actions: 'completeOrder',
            },
            PROCESSING_ERROR: {
              target: 'error',
              actions: 'handleProcessingError',
            },
          },
        },
        completed: {
          type: 'final',
          entry: 'logOrderCompleted',
        },
        error: {
          on: {
            RETRY: {
              target: 'validating',
              actions: 'resetOrder',
            },
            CANCEL: {
              target: 'cancelled',
              actions: 'cancelOrder',
            },
          },
        },
        cancelled: {
          type: 'final',
          entry: 'logOrderCancelled',
        },
      },
    },
    logStates: {
      validating: async ({ state, model, log, view, transition, subMachine }) => {
        await log('Validating order', {
          orderId: model.orderId,
          customer: model.customer?.name,
          items: model.items?.length,
          total: model.total,
          parentMachine: model.parentMachineId,
        });

        // Validate order data
        const errors = [];
        
        if (!model.customer?.name) {
          errors.push('Customer name is required');
        }
        
        if (!model.customer?.email) {
          errors.push('Customer email is required');
        }
        
        if (!model.customer?.address) {
          errors.push('Delivery address is required');
        }
        
        if (!model.payment?.method) {
          errors.push('Payment method is required');
        }
        
        if (model.items?.length === 0) {
          errors.push('Order must contain at least one item');
        }

        if (errors.length > 0) {
          view(
            <div className="validation-error">
              <h3>❌ Order Validation Failed</h3>
              <div className="errors">
                {errors.map((error, index) => (
                  <div key={index} className="error-item">
                    • {error}
                  </div>
                ))}
              </div>
              <div className="actions">
                <button onClick={() => transition('RETRY')} className="retry-btn">
                  Fix Errors & Retry
                </button>
                <button onClick={() => transition('CANCEL')} className="cancel-btn">
                  Cancel Order
                </button>
              </div>
            </div>
          );
        } else {
          view(
            <div className="validation-success">
              <h3>✅ Order Validation Passed</h3>
              <div className="order-summary">
                <p><strong>Order ID:</strong> {model.orderId}</p>
                <p><strong>Customer:</strong> {model.customer?.name}</p>
                <p><strong>Items:</strong> {model.items?.length} items</p>
                <p><strong>Total:</strong> ${model.total}</p>
              </div>
              <button onClick={() => transition('PROCESS_PAYMENT')} className="proceed-btn">
                Proceed to Payment
              </button>
            </div>
          );
        }
      },

      payment: async ({ state, model, log, view, transition }) => {
        await log('Processing payment', {
          orderId: model.orderId,
          paymentMethod: model.payment?.method,
          total: model.total,
        });

        view(
          <div className="payment-processing">
            <h3>💳 Processing Payment</h3>
            <div className="payment-details">
              <p><strong>Payment Method:</strong> {model.payment?.method}</p>
              <p><strong>Amount:</strong> ${model.total}</p>
              <p><strong>Order ID:</strong> {model.orderId}</p>
            </div>
            <div className="payment-status">
              <div className="spinner">⏳ Processing...</div>
            </div>
            <button onClick={() => transition('PROCESS_PAYMENT')} className="process-btn">
              Process Payment
            </button>
          </div>
        );
      },

      processing: async ({ state, model, log, view, transition }) => {
        await log('Completing order', {
          orderId: model.orderId,
          status: model.status,
        });

        view(
          <div className="order-processing">
            <h3>🔄 Completing Order</h3>
            <div className="processing-steps">
              <div className="step completed">✅ Validation</div>
              <div className="step completed">✅ Payment</div>
              <div className="step active">🔄 Processing</div>
              <div className="step">⏳ Completion</div>
            </div>
            <div className="order-details">
              <p><strong>Order ID:</strong> {model.orderId}</p>
              <p><strong>Status:</strong> {model.status}</p>
            </div>
            <button onClick={() => transition('COMPLETE_ORDER')} className="complete-btn">
              Complete Order
            </button>
          </div>
        );
      },

      completed: async ({ state, model, log, view, transition }) => {
        await log('Order completed successfully', {
          orderId: model.orderId,
          status: model.status,
        });

        view(
          <div className="order-completed">
            <h3>🎉 Order Completed Successfully!</h3>
            <div className="completion-details">
              <p><strong>Order ID:</strong> {model.orderId}</p>
              <p><strong>Status:</strong> {model.status}</p>
              <p><strong>Total:</strong> ${model.total}</p>
              <p><strong>Customer:</strong> {model.customer?.name}</p>
            </div>
            <div className="success-message">
              <p>Your order has been processed and confirmed. You will receive an email confirmation shortly.</p>
            </div>
          </div>
        );
      },

      error: async ({ state, model, log, view, transition }) => {
        await log('Order error state', {
          orderId: model.orderId,
          status: model.status,
          errors: [...(model.validationErrors || []), ...(model.paymentErrors || [])],
        });

        const allErrors = [...(model.validationErrors || []), ...(model.paymentErrors || [])];

        view(
          <div className="order-error">
            <h3>❌ Order Processing Error</h3>
            <div className="error-details">
              <p><strong>Order ID:</strong> {model.orderId}</p>
              <p><strong>Status:</strong> {model.status}</p>
            </div>
            {allErrors.length > 0 && (
              <div className="errors">
                <h4>Errors:</h4>
                {allErrors.map((error, index) => (
                  <div key={index} className="error-item">
                    • {error}
                  </div>
                ))}
              </div>
            )}
            <div className="actions">
              <button onClick={() => transition('RETRY')} className="retry-btn">
                Retry Order
              </button>
              <button onClick={() => transition('CANCEL')} className="cancel-btn">
                Cancel Order
              </button>
            </div>
          </div>
        );
      },

      cancelled: async ({ state, model, log, view, transition }) => {
        await log('Order cancelled', {
          orderId: model.orderId,
          status: model.status,
        });

        view(
          <div className="order-cancelled">
            <h3>🚫 Order Cancelled</h3>
            <div className="cancellation-details">
              <p><strong>Order ID:</strong> {model.orderId}</p>
              <p><strong>Status:</strong> {model.status}</p>
            </div>
            <div className="cancellation-message">
              <p>Your order has been cancelled. No charges will be made to your account.</p>
            </div>
          </div>
        );
      },
    },
  });
};

// Main state machine that uses CompleteOrderStateMachine as a sub-machine
const mainOrderMachine = createViewStateMachine({
  machineId: 'main-order-machine',
  xstateConfig: {
    id: 'mainOrder',
    initial: 'browsing',
    context: {
      currentPage: 'browsing' as string,
      cartItems: [] as any[],
      orderData: null as any,
      completeOrderResult: null as any,
      traceId: null as string | null,
    },
    states: {
      browsing: {
        on: {
          ADD_TO_CART: {
            target: 'browsing',
            actions: 'addToCart',
          },
          PROCEED_TO_CHECKOUT: {
            target: 'checkout',
            actions: 'prepareCheckout',
          },
        },
      },
      checkout: {
        on: {
          START_ORDER_PROCESSING: {
            target: 'orderProcessing',
            actions: 'startOrderProcessing',
          },
          BACK_TO_BROWSING: {
            target: 'browsing',
            actions: 'returnToBrowsing',
          },
        },
      },
      orderProcessing: {
        on: {
          ORDER_COMPLETED: {
            target: 'orderCompleted',
            actions: 'handleOrderCompleted',
          },
          ORDER_CANCELLED: {
            target: 'orderCancelled',
            actions: 'handleOrderCancelled',
          },
          ORDER_ERROR: {
            target: 'orderError',
            actions: 'handleOrderError',
          },
        },
      },
      orderCompleted: {
        on: {
          START_NEW_ORDER: {
            target: 'browsing',
            actions: 'startNewOrder',
          },
        },
      },
      orderCancelled: {
        on: {
          START_NEW_ORDER: {
            target: 'browsing',
            actions: 'startNewOrder',
          },
        },
      },
      orderError: {
        on: {
          RETRY_ORDER: {
            target: 'orderProcessing',
            actions: 'retryOrder',
          },
          CANCEL_ORDER: {
            target: 'orderCancelled',
            actions: 'handleOrderCancelled',
          },
        },
      },
    },
  },
  logStates: {
    browsing: async ({ state, model, log, view, transition, subMachine }) => {
      await log('Browsing products', {
        cartItems: model.cartItems?.length || 0,
        currentPage: model.currentPage,
      });

      view(
        <div className="browsing-state">
          <h3>🛍️ Browse Products</h3>
          <div className="cart-summary">
            <p><strong>Cart Items:</strong> {model.cartItems?.length || 0}</p>
            <p><strong>Total:</strong> ${model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}</p>
          </div>
          <div className="actions">
            <button onClick={() => transition('ADD_TO_CART')} className="add-btn">
              Add Fish Burger to Cart
            </button>
            <button 
              onClick={() => transition('PROCEED_TO_CHECKOUT')} 
              className="checkout-btn"
              disabled={!model.cartItems?.length}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      );
    },

    checkout: async ({ state, model, log, view, transition, subMachine }) => {
      await log('Checkout page', {
        cartItems: model.cartItems?.length || 0,
        orderData: model.orderData,
      });

      view(
        <div className="checkout-state">
          <h3>🛒 Checkout</h3>
          <div className="order-summary">
            <h4>Order Summary</h4>
            {model.cartItems?.map((item, index) => (
              <div key={index} className="cart-item">
                <span>{item.name}</span>
                <span>${item.price} x {item.quantity}</span>
              </div>
            ))}
            <div className="total">
              <strong>Total: ${model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}</strong>
            </div>
          </div>
          <div className="actions">
            <button onClick={() => transition('START_ORDER_PROCESSING')} className="process-btn">
              Process Order
            </button>
            <button onClick={() => transition('BACK_TO_BROWSING')} className="back-btn">
              Back to Browsing
            </button>
          </div>
        </div>
      );
    },

    orderProcessing: async ({ state, model, log, view, transition, subMachine }) => {
      await log('Processing order with sub-machine', {
        orderData: model.orderData,
        traceId: model.traceId,
      });

      // Create and use the CompleteOrderStateMachine as a sub-machine
      const completeOrderMachine = subMachine('completeOrder', createCompleteOrderStateMachine());
      
      if (completeOrderMachine) {
        // Initialize the sub-machine with order data
        completeOrderMachine.send({
          type: 'SET_CONTEXT',
          data: {
            ...model.orderData,
            parentMachineId: 'main-order-machine',
            traceId: model.traceId,
          },
        });

        // Start the order processing
        completeOrderMachine.send({ type: 'VALIDATE_ORDER' });

        view(
          <div className="order-processing-state">
            <h3>🔄 Processing Order</h3>
            <p>Using CompleteOrderStateMachine sub-machine...</p>
            <div className="sub-machine-view">
              {/* The sub-machine will render its own view */}
              {completeOrderMachine.render(model.orderData)}
            </div>
          </div>
        );
      } else {
        view(
          <div className="error-state">
            <h3>❌ Error</h3>
            <p>Could not initialize CompleteOrderStateMachine</p>
          </div>
        );
      }
    },

    orderCompleted: async ({ state, model, log, view, transition }) => {
      await log('Order completed', {
        result: model.completeOrderResult,
      });

      view(
        <div className="order-completed-state">
          <h3>🎉 Order Successfully Completed!</h3>
          <div className="completion-summary">
            <p><strong>Order ID:</strong> {model.completeOrderResult?.orderId}</p>
            <p><strong>Status:</strong> {model.completeOrderResult?.status}</p>
            <p><strong>Total:</strong> ${model.orderData?.total}</p>
          </div>
          <div className="success-message">
            <p>Thank you for your order! You will receive a confirmation email shortly.</p>
          </div>
          <button onClick={() => transition('START_NEW_ORDER')} className="new-order-btn">
            Start New Order
          </button>
        </div>
      );
    },

    orderCancelled: async ({ state, model, log, view, transition }) => {
      await log('Order cancelled', {
        result: model.completeOrderResult,
      });

      view(
        <div className="order-cancelled-state">
          <h3>🚫 Order Cancelled</h3>
          <div className="cancellation-summary">
            <p><strong>Order ID:</strong> {model.completeOrderResult?.orderId}</p>
            <p><strong>Status:</strong> {model.completeOrderResult?.status}</p>
          </div>
          <div className="cancellation-message">
            <p>Your order has been cancelled. No charges will be made to your account.</p>
          </div>
          <button onClick={() => transition('START_NEW_ORDER')} className="new-order-btn">
            Start New Order
          </button>
        </div>
      );
    },

    orderError: async ({ state, model, log, view, transition }) => {
      await log('Order error', {
        result: model.completeOrderResult,
      });

      view(
        <div className="order-error-state">
          <h3>❌ Order Processing Error</h3>
          <div className="error-summary">
            <p><strong>Order ID:</strong> {model.completeOrderResult?.orderId}</p>
            <p><strong>Status:</strong> {model.completeOrderResult?.status}</p>
          </div>
          <div className="actions">
            <button onClick={() => transition('RETRY_ORDER')} className="retry-btn">
              Retry Order
            </button>
            <button onClick={() => transition('CANCEL_ORDER')} className="cancel-btn">
              Cancel Order
            </button>
          </div>
        </div>
      );
    },
  },
});

const CompleteOrderStateMachine: React.FC = () => {
  const [robotCopy] = useState(() => createRobotCopy());

  const {
    state,
    context,
    send,
    logEntries,
    viewStack,
    log,
    view,
    clear,
    transition,
  } = mainOrderMachine.useViewStateMachine({
    currentPage: 'browsing',
    cartItems: [],
    orderData: null,
    completeOrderResult: null,
    traceId: null,
  });

  // Initialize RobotCopy integration (optional; e.g. fish-burger wrapper provides it)
  useEffect(() => {
    robotCopy.integrateWithViewStateMachine?.(mainOrderMachine);
  }, [robotCopy]);

  const handleAddToCart = () => {
    const newItem = {
      id: Date.now(),
      name: 'Fish Burger',
      price: 12.99,
      quantity: 1,
    };

    send({
      type: 'ADD_TO_CART',
      data: { item: newItem },
    });
  };

  const handleProceedToCheckout = () => {
    const orderData = {
      orderId: `ORDER-${Date.now()}`,
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        address: '123 Main St, City, State 12345',
      },
      items: context.cartItems,
      total: context.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      payment: { method: 'credit', cardType: 'Visa' },
      status: 'pending',
      traceId: robotCopy.generateTraceId(),
      spanId: robotCopy.generateSpanId(),
    };

    send({
      type: 'PROCEED_TO_CHECKOUT',
      data: { orderData },
    });
  };

  const handleStartOrderProcessing = async () => {
    try {
      const result = await robotCopy.sendMessage('checkout/process', { 
        orderData: context.orderData 
      });

      if (result.success) {
        send({
          type: 'ORDER_COMPLETED',
          data: { result },
        });
      } else {
        send({
          type: 'ORDER_ERROR',
          data: { result },
        });
      }
    } catch (error) {
      console.error('Order processing error:', error);
      send({
        type: 'ORDER_ERROR',
        data: { error: error.message },
      });
    }
  };

  const handleRetryOrder = async () => {
    try {
      const result = await robotCopy.sendMessage('order/retry', {
        orderId: context.orderData?.orderId,
      });

      send({
        type: 'RETRY_ORDER',
        data: { result },
      });
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  const handleCancelOrder = async () => {
    try {
      const result = await robotCopy.sendMessage('order/cancel', {
        orderId: context.orderData?.orderId,
      });

      send({
        type: 'ORDER_CANCELLED',
        data: { result },
      });
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const handleStartNewOrder = () => {
    send({ type: 'START_NEW_ORDER' });
  };

  return (
    <div className="complete-order-state-machine">
      <div className="header">
        <h2>Complete Order State Machine - With Sub-Machine</h2>
        <div className="status">
          <p><strong>Current State:</strong> {state}</p>
          <p><strong>Current Page:</strong> {context.currentPage}</p>
          <p><strong>Cart Items:</strong> {context.cartItems?.length || 0}</p>
          <p><strong>Trace ID:</strong> {context.traceId || 'None'}</p>
        </div>
      </div>

      <div className="controls">
        {state === 'browsing' && (
          <button onClick={handleAddToCart} className="add-btn">
            Add Fish Burger to Cart
          </button>
        )}
        
        {state === 'checkout' && (
          <button onClick={handleStartOrderProcessing} className="process-btn">
            Process Order
          </button>
        )}
        
        {state === 'orderError' && (
          <div className="error-controls">
            <button onClick={handleRetryOrder} className="retry-btn">
              Retry Order
            </button>
            <button onClick={handleCancelOrder} className="cancel-btn">
              Cancel Order
            </button>
          </div>
        )}
        
        {(state === 'orderCompleted' || state === 'orderCancelled') && (
          <button onClick={handleStartNewOrder} className="new-order-btn">
            Start New Order
          </button>
        )}
      </div>

      <div className="content">
        {/* Render current view */}
        {viewStack.length > 0 && (
          <div className="current-view">
            {viewStack[viewStack.length - 1]}
          </div>
        )}

        {/* Log entries */}
        {logEntries.length > 0 && (
          <div className="log-entries">
            <h3>Log Entries</h3>
            <div className="logs">
              {logEntries.map((entry, index) => (
                <div key={index} className="log-entry">
                  <strong>[{entry.level}]</strong> {entry.message}
                  {entry.metadata && (
                    <pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .complete-order-state-machine {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .controls button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
        }

        .add-btn { background: #28a745; color: white; }
        .process-btn { background: #007bff; color: white; }
        .retry-btn { background: #ffc107; color: black; }
        .cancel-btn { background: #dc3545; color: white; }
        .new-order-btn { background: #6c757d; color: white; }

        .content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .current-view {
          grid-column: 1 / -1;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          min-height: 200px;
        }

        .log-entries {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .logs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .log-entry {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }

        pre {
          background: #f0f0f0;
          padding: 5px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
        }

        /* State-specific styles */
        .browsing-state,
        .checkout-state,
        .order-processing-state,
        .order-completed-state,
        .order-cancelled-state,
        .order-error-state {
          text-align: center;
          padding: 20px;
        }

        .cart-summary,
        .order-summary,
        .completion-summary,
        .cancellation-summary,
        .error-summary {
          background: white;
          padding: 15px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }

        .total {
          font-weight: bold;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #007bff;
        }

        .actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 15px;
        }

        .actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-btn { background: #28a745; color: white; }
        .checkout-btn { background: #007bff; color: white; }
        .process-btn { background: #17a2b8; color: white; }
        .back-btn { background: #6c757d; color: white; }
        .retry-btn { background: #ffc107; color: black; }
        .cancel-btn { background: #dc3545; color: white; }
        .new-order-btn { background: #6c757d; color: white; }

        .success-message,
        .cancellation-message {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 4px;
          padding: 10px;
          margin: 10px 0;
          color: #155724;
        }

        .sub-machine-view {
          border: 2px solid #007bff;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
          background: #f8f9fa;
        }

        .error-controls {
          display: flex;
          gap: 10px;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default CompleteOrderStateMachine; 