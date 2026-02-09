import React, { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { RobotCopy, createRobotCopy } from '../core/RobotCopy';

// Tome integration state machine
const tomeMachine = createViewStateMachine({
  machineId: 'tome-integration',
  xstateConfig: {
    id: 'tome-integration',
    initial: 'browsing',
    context: {
      cartItems: [] as any[],
      checkoutData: null as any,
      currentPage: 'cart' as 'cart' | 'checkout',
      traceId: null as string | null,
      ssrEnabled: false,
    },
    states: {
      browsing: {
        on: {
          ADD_TO_CART: {
            target: 'browsing',
            actions: 'addToCart',
          },
          REMOVE_FROM_CART: {
            target: 'browsing',
            actions: 'removeFromCart',
          },
          PROCEED_TO_CHECKOUT: {
            target: 'checkout',
            actions: 'prepareCheckout',
          },
        },
      },
      checkout: {
        on: {
          COMPLETE_ORDER: {
            target: 'completed',
            actions: 'completeOrder',
          },
          BACK_TO_CART: {
            target: 'browsing',
            actions: 'returnToCart',
          },
        },
      },
      completed: {
        on: {
          NEW_ORDER: {
            target: 'browsing',
            actions: 'startNewOrder',
          },
        },
      },
    },
  },
  logStates: {
    browsing: async ({ state, model, log, view, transition }) => {
      await log('User browsing cart', {
        cartItems: model.cartItems.length,
        currentPage: model.currentPage,
        ssrEnabled: model.ssrEnabled,
      });

      view(
        <div className="cart-page">
          <h2>🛒 Shopping Cart (Client-Side)</h2>
          <p>SSR: {model.ssrEnabled ? 'Enabled' : 'Disabled'}</p>
          <p>Items: {model.cartItems.length}</p>
          <button onClick={() => transition('PROCEED_TO_CHECKOUT')}>
            Proceed to Checkout (SSR)
          </button>
        </div>
      );
    },

    checkout: async ({ state, model, log, view, transition }) => {
      await log('User in checkout', {
        cartItems: model.cartItems.length,
        currentPage: model.currentPage,
        ssrEnabled: model.ssrEnabled,
      });

      view(
        <div className="checkout-page">
          <h2>🐟 Checkout (Server-Side Rendered)</h2>
          <p>SSR: {model.ssrEnabled ? 'Enabled' : 'Disabled'}</p>
          <p>Items: {model.cartItems.length}</p>
          <button onClick={() => transition('COMPLETE_ORDER')}>
            Complete Order
          </button>
          <button onClick={() => transition('BACK_TO_CART')}>
            Back to Cart
          </button>
        </div>
      );
    },

    completed: async ({ state, model, log, view, transition }) => {
      await log('Order completed', {
        cartItems: model.cartItems.length,
        currentPage: model.currentPage,
        ssrEnabled: model.ssrEnabled,
      });

      view(
        <div className="completed-page">
          <h2>✅ Order Completed</h2>
          <p>Thank you for your order!</p>
          <button onClick={() => transition('NEW_ORDER')}>
            Start New Order
          </button>
        </div>
      );
    },
  },
});

const TomeIntegration: React.FC = () => {
  const [robotCopy] = useState(() => createRobotCopy());
  const [currentPage, setCurrentPage] = useState<'cart' | 'checkout'>('cart');
  const [cartItems, setCartItems] = useState([
    { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 },
    { id: 2, name: 'French Fries', price: 4.99, quantity: 1 },
  ]);

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
  } = tomeMachine.useViewStateMachine({
    cartItems: [],
    checkoutData: null,
    currentPage: 'cart',
    traceId: null,
    ssrEnabled: false,
  });

  // Initialize RobotCopy integration (optional; e.g. fish-burger wrapper provides it)
  useEffect(() => {
    robotCopy.integrateWithViewStateMachine?.(tomeMachine);
  }, [robotCopy]);

  const handleAddToCart = async (item: any) => {
    try {
      const result = await robotCopy.sendMessage('cart/add', { item });
      console.log('Add to cart result:', result);
      
      send({
        type: 'ADD_TO_CART',
        data: { item },
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleRemoveFromCart = async (itemId: number) => {
    try {
      const result = await robotCopy.sendMessage('cart/remove', { itemId });
      console.log('Remove from cart result:', result);
      
      send({
        type: 'REMOVE_FROM_CART',
        data: { itemId },
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleProceedToCheckout = async () => {
    const traceId = robotCopy.generateTraceId();
    
    try {
      // Navigate to SSR checkout page
      window.open(`http://localhost:3002/checkout?traceId=${traceId}`, '_blank');
      
      send({
        type: 'PROCEED_TO_CHECKOUT',
        data: { traceId },
      });
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      const result = await robotCopy.sendMessage('checkout/process', {
        orderData: {
          items: cartItems,
          total: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        },
      });
      
      console.log('Complete order result:', result);
      
      send({
        type: 'COMPLETE_ORDER',
        data: { result },
      });
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleBackToCart = () => {
    send({ type: 'BACK_TO_CART' });
  };

  const handleStartNewOrder = () => {
    setCartItems([]);
    send({ type: 'NEW_ORDER' });
  };

  return (
    <div className="tome-integration">
      <div className="header">
        <h2>Tome Integration - SSR Checkout & Client Cart</h2>
        <div className="status">
          <p>Current State: {state}</p>
          <p>Current Page: {context.currentPage}</p>
          <p>SSR Enabled: {context.ssrEnabled ? 'Yes' : 'No'}</p>
          <p>Cart Items: {cartItems.length}</p>
        </div>
      </div>

      <div className="controls">
        <button onClick={() => handleAddToCart({ id: 3, name: 'Soda', price: 2.99 })}>
          Add Soda to Cart
        </button>
        <button onClick={() => handleRemoveFromCart(1)}>
          Remove Fish Burger
        </button>
        <button onClick={handleProceedToCheckout}>
          Go to SSR Checkout
        </button>
        <button onClick={handleCompleteOrder}>
          Complete Order
        </button>
        <button onClick={handleBackToCart}>
          Back to Cart
        </button>
        <button onClick={handleStartNewOrder}>
          New Order
        </button>
      </div>

      <div className="content">
        {/* Render current view */}
        {viewStack.length > 0 && (
          <div className="current-view">
            {viewStack[viewStack.length - 1]}
          </div>
        )}

        {/* Cart display */}
        <div className="cart-display">
          <h3>Current Cart Items</h3>
          {cartItems.map((item) => (
            <div key={item.id} className="cart-item">
              <span>{item.name} - ${item.price}</span>
              <span>Qty: {item.quantity}</span>
            </div>
          ))}
          <p>Total: ${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
        </div>

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

      <div className="navigation">
        <h3>Navigation</h3>
        <p>
          <strong>Cart Page:</strong> Client-side rendered with interactive cart management
        </p>
        <p>
          <strong>Checkout Page:</strong> Server-side rendered with form processing
        </p>
        <p>
          <strong>Tome Server:</strong> Handles SSR for checkout and API for cart operations
        </p>
      </div>

      <style jsx>{`
        .tome-integration {
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
          background: #007bff;
          color: white;
          cursor: pointer;
        }

        .controls button:hover {
          background: #0056b3;
        }

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
        }

        .cart-display {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }

        .cart-item {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid #eee;
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

        .navigation {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .cart-page,
        .checkout-page,
        .completed-page {
          text-align: center;
        }

        .cart-page button,
        .checkout-page button,
        .completed-page button {
          margin: 5px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default TomeIntegration; 