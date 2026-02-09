import React, { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { RobotCopy, createRobotCopy } from '../core/RobotCopy';
import { createCompleteOrderStateMachine } from './CompleteOrderStateMachine';

// OrderControllerStateMachine - High-level orchestration
const orderControllerMachine = createViewStateMachine({
  machineId: 'order-controller',
  xstateConfig: {
    id: 'orderController',
    initial: 'browsing',
    context: {
      currentPage: 'browsing' as string,
      cartItems: [] as any[],
      orderData: null as any,
      completeOrderResult: null as any,
      traceId: null as string | null,
      errorMessage: null as string | null,
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
          BACK_TO_BROWSING: {
            target: 'browsing',
            actions: 'returnToBrowsing',
          },
        },
      },
    },
  },
  logStates: {
    browsing: async ({ state, model, log, view, transition }) => {
      await log('Browsing products', {
        cartItems: model.cartItems?.length || 0,
        currentPage: model.currentPage,
      });

      view(
        <div className="browsing-view">
          <div className="header">
            <h2>🛍️ Fish Burger Restaurant</h2>
            <p>Welcome! Browse our delicious menu and add items to your cart.</p>
          </div>

          <div className="menu-section">
            <h3>🍔 Our Menu</h3>
            <div className="menu-items">
              <div className="menu-item">
                <div className="item-info">
                  <h4>Fish Burger Deluxe</h4>
                  <p>Fresh fish fillet with lettuce, tomato, and special sauce</p>
                  <span className="price">$12.99</span>
                </div>
                <button 
                  onClick={() => transition('ADD_TO_CART')} 
                  className="add-to-cart-btn"
                >
                  Add to Cart
                </button>
              </div>
              
              <div className="menu-item">
                <div className="item-info">
                  <h4>French Fries</h4>
                  <p>Crispy golden fries with sea salt</p>
                  <span className="price">$4.99</span>
                </div>
                <button 
                  onClick={() => transition('ADD_TO_CART')} 
                  className="add-to-cart-btn"
                >
                  Add to Cart
                </button>
              </div>
              
              <div className="menu-item">
                <div className="item-info">
                  <h4>Soft Drink</h4>
                  <p>Refreshing beverage of your choice</p>
                  <span className="price">$2.99</span>
                </div>
                <button 
                  onClick={() => transition('ADD_TO_CART')} 
                  className="add-to-cart-btn"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          <div className="cart-summary">
            <h3>🛒 Your Cart</h3>
            {model.cartItems?.length > 0 ? (
              <div className="cart-items">
                {model.cartItems.map((item, index) => (
                  <div key={index} className="cart-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">${item.price}</span>
                  </div>
                ))}
                <div className="cart-total">
                  <strong>Total: ${model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}</strong>
                </div>
                <button 
                  onClick={() => transition('PROCEED_TO_CHECKOUT')} 
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>
              </div>
            ) : (
              <div className="empty-cart">
                <p>Your cart is empty. Add some delicious items!</p>
              </div>
            )}
          </div>
        </div>
      );
    },

    checkout: async ({ state, model, log, view, transition }) => {
      await log('Checkout page', {
        cartItems: model.cartItems?.length || 0,
        orderData: model.orderData,
      });

      view(
        <div className="checkout-view">
          <div className="header">
            <h2>🛒 Checkout</h2>
            <p>Review your order and complete your purchase.</p>
          </div>

          <div className="checkout-content">
            <div className="order-summary">
              <h3>📋 Order Summary</h3>
              {model.cartItems?.map((item, index) => (
                <div key={index} className="summary-item">
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                  </div>
                  <span className="item-price">${item.price * item.quantity}</span>
                </div>
              ))}
              <div className="summary-total">
                <strong>Total: ${model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}</strong>
              </div>
            </div>

            <div className="customer-info">
              <h3>👤 Customer Information</h3>
              <div className="info-preview">
                <p><strong>Name:</strong> John Doe</p>
                <p><strong>Email:</strong> john@example.com</p>
                <p><strong>Address:</strong> 123 Main St, City, State 12345</p>
              </div>
            </div>

            <div className="payment-info">
              <h3>💳 Payment Information</h3>
              <div className="payment-preview">
                <p><strong>Method:</strong> Credit Card</p>
                <p><strong>Card Type:</strong> Visa</p>
              </div>
            </div>

            <div className="checkout-actions">
              <button 
                onClick={() => transition('START_ORDER_PROCESSING')} 
                className="process-order-btn"
              >
                Process Order
              </button>
              <button 
                onClick={() => transition('BACK_TO_BROWSING')} 
                className="back-btn"
              >
                Back to Menu
              </button>
            </div>
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
            parentMachineId: 'order-controller',
            traceId: model.traceId,
          },
        });

        // Start the order processing
        completeOrderMachine.send({ type: 'VALIDATE_ORDER' });

        view(
          <div className="order-processing-view">
            <div className="header">
              <h2>🔄 Processing Your Order</h2>
              <p>We're processing your order through our CompleteOrderStateMachine...</p>
            </div>

            <div className="processing-container">
              <div className="processing-status">
                <div className="status-indicator">
                  <div className="spinner">⏳</div>
                  <p>Processing order...</p>
                </div>
              </div>

              <div className="sub-machine-container">
                <h3>📋 Order Processing Details</h3>
                <div className="sub-machine-view">
                  {/* The sub-machine renders its own beautiful view */}
                  {completeOrderMachine.render(model.orderData)}
                </div>
              </div>

              <div className="order-details">
                <h3>📄 Order Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Order ID:</strong> {model.orderData?.orderId}
                  </div>
                  <div className="detail-item">
                    <strong>Customer:</strong> {model.orderData?.customer?.name}
                  </div>
                  <div className="detail-item">
                    <strong>Items:</strong> {model.orderData?.items?.length} items
                  </div>
                  <div className="detail-item">
                    <strong>Total:</strong> ${model.orderData?.total}
                  </div>
                  <div className="detail-item">
                    <strong>Trace ID:</strong> {model.traceId}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        view(
          <div className="error-view">
            <h3>❌ Error</h3>
            <p>Could not initialize CompleteOrderStateMachine</p>
            <button onClick={() => transition('BACK_TO_BROWSING')} className="back-btn">
              Back to Menu
            </button>
          </div>
        );
      }
    },

    orderCompleted: async ({ state, model, log, view, transition }) => {
      await log('Order completed successfully', {
        result: model.completeOrderResult,
      });

      view(
        <div className="order-completed-view">
          <div className="header">
            <h2>🎉 Order Successfully Completed!</h2>
            <p>Thank you for your order! Your food is being prepared.</p>
          </div>

          <div className="completion-details">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Order Confirmed</h3>
              <p>Your order has been processed and confirmed. You will receive a confirmation email shortly.</p>
            </div>

            <div className="order-summary">
              <h3>📋 Order Summary</h3>
              <div className="summary-details">
                <div className="detail-row">
                  <strong>Order ID:</strong> {model.completeOrderResult?.orderId || model.orderData?.orderId}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> {model.completeOrderResult?.status || 'completed'}
                </div>
                <div className="detail-row">
                  <strong>Total:</strong> ${model.orderData?.total}
                </div>
                <div className="detail-row">
                  <strong>Customer:</strong> {model.orderData?.customer?.name}
                </div>
                <div className="detail-row">
                  <strong>Trace ID:</strong> {model.traceId}
                </div>
              </div>
            </div>

            <div className="next-steps">
              <h3>📱 What's Next?</h3>
              <ul>
                <li>You'll receive an email confirmation</li>
                <li>Your order will be prepared in our kitchen</li>
                <li>We'll notify you when it's ready for pickup</li>
                <li>Estimated preparation time: 15-20 minutes</li>
              </ul>
            </div>
          </div>

          <div className="completion-actions">
            <button onClick={() => transition('START_NEW_ORDER')} className="new-order-btn">
              Start New Order
            </button>
          </div>
        </div>
      );
    },

    orderCancelled: async ({ state, model, log, view, transition }) => {
      await log('Order cancelled', {
        result: model.completeOrderResult,
      });

      view(
        <div className="order-cancelled-view">
          <div className="header">
            <h2>🚫 Order Cancelled</h2>
            <p>Your order has been cancelled. No charges will be made to your account.</p>
          </div>

          <div className="cancellation-details">
            <div className="cancellation-message">
              <div className="cancellation-icon">🚫</div>
              <h3>Order Cancelled</h3>
              <p>Your order has been successfully cancelled. No charges will be made to your account.</p>
            </div>

            <div className="order-summary">
              <h3>📋 Cancelled Order Details</h3>
              <div className="summary-details">
                <div className="detail-row">
                  <strong>Order ID:</strong> {model.completeOrderResult?.orderId || model.orderData?.orderId}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> {model.completeOrderResult?.status || 'cancelled'}
                </div>
                <div className="detail-row">
                  <strong>Total:</strong> ${model.orderData?.total}
                </div>
                <div className="detail-row">
                  <strong>Trace ID:</strong> {model.traceId}
                </div>
              </div>
            </div>
          </div>

          <div className="cancellation-actions">
            <button onClick={() => transition('START_NEW_ORDER')} className="new-order-btn">
              Start New Order
            </button>
          </div>
        </div>
      );
    },

    orderError: async ({ state, model, log, view, transition }) => {
      await log('Order error', {
        result: model.completeOrderResult,
        errorMessage: model.errorMessage,
      });

      view(
        <div className="order-error-view">
          <div className="header">
            <h2>❌ Order Processing Error</h2>
            <p>We encountered an issue while processing your order. Please try again.</p>
          </div>

          <div className="error-details">
            <div className="error-message">
              <div className="error-icon">❌</div>
              <h3>Processing Error</h3>
              <p>{model.errorMessage || 'An error occurred while processing your order. Please try again.'}</p>
            </div>

            <div className="order-summary">
              <h3>📋 Order Details</h3>
              <div className="summary-details">
                <div className="detail-row">
                  <strong>Order ID:</strong> {model.completeOrderResult?.orderId || model.orderData?.orderId}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> {model.completeOrderResult?.status || 'error'}
                </div>
                <div className="detail-row">
                  <strong>Total:</strong> ${model.orderData?.total}
                </div>
                <div className="detail-row">
                  <strong>Trace ID:</strong> {model.traceId}
                </div>
              </div>
            </div>

            <div className="error-suggestions">
              <h3>💡 What you can do:</h3>
              <ul>
                <li>Check your payment information</li>
                <li>Verify your delivery address</li>
                <li>Try processing the order again</li>
                <li>Contact customer support if the issue persists</li>
              </ul>
            </div>
          </div>

          <div className="error-actions">
            <button onClick={() => transition('RETRY_ORDER')} className="retry-btn">
              Retry Order
            </button>
            <button onClick={() => transition('CANCEL_ORDER')} className="cancel-btn">
              Cancel Order
            </button>
            <button onClick={() => transition('BACK_TO_BROWSING')} className="back-btn">
              Back to Menu
            </button>
          </div>
        </div>
      );
    },
  },
});

const OrderControllerStateMachine: React.FC = () => {
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
  } = orderControllerMachine.useViewStateMachine({
    currentPage: 'browsing',
    cartItems: [],
    orderData: null,
    completeOrderResult: null,
    traceId: null,
    errorMessage: null,
  });

  // Initialize RobotCopy integration (optional; e.g. fish-burger wrapper provides it)
  useEffect(() => {
    robotCopy.integrateWithViewStateMachine?.(orderControllerMachine);
  }, [robotCopy]);

  const handleAddToCart = () => {
    const newItem = {
      id: Date.now(),
      name: 'Fish Burger Deluxe',
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
          data: { result, errorMessage: 'Payment processing failed' },
        });
      }
    } catch (error) {
      console.error('Order processing error:', error);
      send({
        type: 'ORDER_ERROR',
        data: { error: error.message, errorMessage: 'Network error occurred' },
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
    <div className="order-controller-state-machine">
      <div className="header">
        <h2>Order Controller State Machine</h2>
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
        
        // todo: reorganize these state condition renders into withState() views, and add a state for 'completed' that is invoked by both orderCancelled and orderCompleted
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
        .order-controller-state-machine {
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

        /* View-specific styles */
        .browsing-view,
        .checkout-view,
        .order-processing-view,
        .order-completed-view,
        .order-cancelled-view,
        .order-error-view {
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
        }

        .header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .menu-section,
        .cart-summary,
        .checkout-content,
        .processing-container,
        .completion-details,
        .cancellation-details,
        .error-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin: 15px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .menu-items {
          display: grid;
          gap: 15px;
          margin: 15px 0;
        }

        .menu-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .item-info h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .item-info p {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 14px;
        }

        .price {
          font-weight: bold;
          color: #28a745;
          font-size: 18px;
        }

        .add-to-cart-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .cart-items {
          margin: 15px 0;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .cart-total {
          font-weight: bold;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #007bff;
          text-align: right;
        }

        .checkout-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 15px;
          width: 100%;
        }

        .empty-cart {
          text-align: center;
          color: #666;
          padding: 20px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .summary-total {
          font-weight: bold;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #007bff;
          text-align: right;
        }

        .info-preview,
        .payment-preview {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .checkout-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .process-order-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          flex: 1;
        }

        .back-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
        }

        .processing-status {
          text-align: center;
          margin: 20px 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .spinner {
          font-size: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sub-machine-container {
          margin: 20px 0;
        }

        .sub-machine-view {
          border: 2px solid #007bff;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin: 15px 0;
        }

        .detail-item {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
        }

        .success-message,
        .cancellation-message,
        .error-message {
          text-align: center;
          margin: 20px 0;
        }

        .success-icon,
        .cancellation-icon,
        .error-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .summary-details {
          margin: 15px 0;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .next-steps,
        .error-suggestions {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .next-steps ul,
        .error-suggestions ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .completion-actions,
        .cancellation-actions,
        .error-actions {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }

        .new-order-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
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

export default OrderControllerStateMachine; 