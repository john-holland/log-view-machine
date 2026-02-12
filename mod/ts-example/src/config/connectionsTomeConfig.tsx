import React from 'react';
import { createTomeConfig, type TomeConfig } from 'log-view-machine';

export const connectionsTomeConfig: TomeConfig = createTomeConfig({
  id: 'connections-tome',
  name: 'Tome Connections',
  description: 'Order, Payment, and Inventory machines with TomeConnector',
  version: '1.0.0',
  machines: {
    order: {
      id: 'order-machine',
      name: 'Order Machine',
      xstateConfig: {
        id: 'order-machine',
        initial: 'idle',
        context: {
          orderId: null as string | null,
          items: [] as any[],
          total: 0,
          status: 'pending' as string,
        },
        states: {
          idle: { on: { START_ORDER: 'processing' } },
          processing: {
            on: {
              ADD_ITEM: 'processing',
              COMPLETE_ORDER: 'completed',
            },
          },
          completed: { on: { RESET: 'idle' } },
        },
      },
      logStates: {
        idle: async ({ model, log, view, transition }) => {
          await log('Order machine is idle', { orderId: model.orderId });
          view(
            <div className="order-machine idle">
              <h3>Order Machine - Idle</h3>
              <p>Status: {model.status}</p>
              <button onClick={() => transition('START_ORDER')}>Start Order</button>
            </div>
          );
        },
        processing: async ({ model, log, view, transition }) => {
          await log('Order is processing', { orderId: model.orderId, itemCount: model.items.length });
          view(
            <div className="order-machine processing">
              <h3>Order Machine - Processing</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Items: {model.items.length}</p>
              <p>Total: ${model.total}</p>
              <button onClick={() => transition('ADD_ITEM')}>Add Item</button>
              <button onClick={() => transition('COMPLETE_ORDER')}>Complete Order</button>
            </div>
          );
        },
        completed: async ({ model, log, view, transition }) => {
          await log('Order completed', { orderId: model.orderId });
          view(
            <div className="order-machine completed">
              <h3>Order Machine - Completed</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Total: ${model.total}</p>
              <button onClick={() => transition('RESET')}>Reset</button>
            </div>
          );
        },
      },
    },
    payment: {
      id: 'payment-machine',
      name: 'Payment Machine',
      xstateConfig: {
        id: 'payment-machine',
        initial: 'waiting',
        context: {
          orderId: null as string | null,
          amount: 0,
          paymentMethod: null as string | null,
          status: 'waiting' as string,
        },
        states: {
          waiting: { on: { ORDER_READY: 'processing' } },
          processing: {
            on: {
              PAYMENT_SUCCESS: 'completed',
              PAYMENT_FAILED: 'failed',
            },
          },
          completed: { on: { RESET: 'waiting' } },
          failed: { on: { RETRY: 'processing', RESET: 'waiting' } },
        },
      },
      logStates: {
        waiting: async ({ model, log, view, transition }) => {
          await log('Payment machine waiting', { orderId: model.orderId });
          view(
            <div className="payment-machine waiting">
              <h3>Payment Machine - Waiting</h3>
              <p>Order ID: {model.orderId || 'None'}</p>
              <p>Amount: ${model.amount}</p>
              <p>Status: {model.status}</p>
            </div>
          );
        },
        processing: async ({ model, log, view, transition }) => {
          await log('Payment processing', { orderId: model.orderId, amount: model.amount });
          view(
            <div className="payment-machine processing">
              <h3>Payment Machine - Processing</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Amount: ${model.amount}</p>
              <button onClick={() => transition('PAYMENT_SUCCESS')}>Simulate Success</button>
              <button onClick={() => transition('PAYMENT_FAILED')}>Simulate Failure</button>
            </div>
          );
        },
        completed: async ({ model, log, view, transition }) => {
          await log('Payment completed', { orderId: model.orderId });
          view(
            <div className="payment-machine completed">
              <h3>Payment Machine - Completed</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Amount: ${model.amount}</p>
              <button onClick={() => transition('RESET')}>Reset</button>
            </div>
          );
        },
        failed: async ({ model, log, view, transition }) => {
          await log('Payment failed', { orderId: model.orderId });
          view(
            <div className="payment-machine failed">
              <h3>Payment Machine - Failed</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Amount: ${model.amount}</p>
              <button onClick={() => transition('RETRY')}>Retry</button>
              <button onClick={() => transition('RESET')}>Reset</button>
            </div>
          );
        },
      },
    },
    inventory: {
      id: 'inventory-machine',
      name: 'Inventory Machine',
      xstateConfig: {
        id: 'inventory-machine',
        initial: 'available',
        context: {
          items: [] as any[],
          lowStock: [] as string[],
          status: 'available' as string,
        },
        states: {
          available: {
            on: {
              ITEM_ADDED: 'available',
              ITEM_REMOVED: 'available',
              LOW_STOCK: 'low_stock',
            },
          },
          low_stock: { on: { RESTOCKED: 'available' } },
        },
      },
      logStates: {
        available: async ({ model, log, view, transition }) => {
          await log('Inventory available', { itemCount: model.items.length });
          view(
            <div className="inventory-machine available">
              <h3>Inventory Machine - Available</h3>
              <p>Items: {model.items.length}</p>
              <p>Low Stock: {model.lowStock.length}</p>
              <button onClick={() => transition('ITEM_ADDED')}>Add Item</button>
              <button onClick={() => transition('ITEM_REMOVED')}>Remove Item</button>
            </div>
          );
        },
        low_stock: async ({ model, log, view, transition }) => {
          await log('Low stock warning', { lowStockItems: model.lowStock });
          view(
            <div className="inventory-machine low-stock">
              <h3>Inventory Machine - Low Stock</h3>
              <p>Low Stock Items: {model.lowStock.join(', ')}</p>
              <button onClick={() => transition('RESTOCKED')}>Restock</button>
            </div>
          );
        },
      },
    },
  },
});
