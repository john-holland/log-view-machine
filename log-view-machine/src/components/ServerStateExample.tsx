import React, { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { RobotCopy, createRobotCopy } from '../core/RobotCopy';

// Example of a state machine that uses both client and server state handlers
const serverStateExampleMachine = createViewStateMachine({
  machineId: 'server-state-example',
  xstateConfig: {
    id: 'server-state-example',
    initial: 'idle',
    context: {
      orderId: null as string | null,
      customer: null as any,
      items: [] as any[],
      total: 0,
      status: 'pending' as string,
      serverRenderedHtml: '',
      clientState: 'idle' as string,
    },
    states: {
      idle: {
        on: {
          START_ORDER: {
            target: 'processing',
            actions: 'startOrder',
          },
        },
      },
      processing: {
        on: {
          SERVER_RENDER: {
            target: 'serverRendered',
            actions: 'serverRender',
          },
          CLIENT_UPDATE: {
            target: 'clientUpdated',
            actions: 'clientUpdate',
          },
        },
      },
      serverRendered: {
        on: {
          COMPLETE_ORDER: {
            target: 'completed',
            actions: 'completeOrder',
          },
        },
      },
      clientUpdated: {
        on: {
          COMPLETE_ORDER: {
            target: 'completed',
            actions: 'completeOrder',
          },
        },
      },
      completed: {
        on: {
          RESET: {
            target: 'idle',
            actions: 'reset',
          },
        },
      },
    },
  },
  logStates: {
    idle: async ({ state, model, log, view, transition }) => {
      await log('Order machine is idle', {
        orderId: model.orderId,
        status: model.status,
      });

      view(
        <div className="idle-state">
          <h3>Order Machine - Idle</h3>
          <p>Status: {model.status}</p>
          <p>Server HTML: {model.serverRenderedHtml ? 'Available' : 'None'}</p>
          <button onClick={() => transition('START_ORDER')}>
            Start Order
          </button>
        </div>
      );
    },

    processing: async ({ state, model, log, view, transition }) => {
      await log('Order is processing', {
        orderId: model.orderId,
        status: model.status,
        items: model.items.length,
      });

      view(
        <div className="processing-state">
          <h3>Order Machine - Processing</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Status: {model.status}</p>
          <p>Items: {model.items.length}</p>
          <button onClick={() => transition('SERVER_RENDER')}>
            Server Render
          </button>
          <button onClick={() => transition('CLIENT_UPDATE')}>
            Client Update
          </button>
        </div>
      );
    },

    serverRendered: async ({ state, model, log, view, transition }) => {
      await log('Order server rendered', {
        orderId: model.orderId,
        status: model.status,
        serverHtml: model.serverRenderedHtml ? 'Generated' : 'None',
      });

      view(
        <div className="server-rendered-state">
          <h3>Order Machine - Server Rendered</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Status: {model.status}</p>
          <p>Server HTML: {model.serverRenderedHtml ? 'Generated' : 'None'}</p>
          <button onClick={() => transition('COMPLETE_ORDER')}>
            Complete Order
          </button>
        </div>
      );
    },

    clientUpdated: async ({ state, model, log, view, transition }) => {
      await log('Order client updated', {
        orderId: model.orderId,
        status: model.status,
        clientState: model.clientState,
      });

      view(
        <div className="client-updated-state">
          <h3>Order Machine - Client Updated</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Status: {model.status}</p>
          <p>Client State: {model.clientState}</p>
          <button onClick={() => transition('COMPLETE_ORDER')}>
            Complete Order
          </button>
        </div>
      );
    },

    completed: async ({ state, model, log, view, transition }) => {
      await log('Order completed', {
        orderId: model.orderId,
        status: model.status,
      });

      view(
        <div className="completed-state">
          <h3>Order Machine - Completed</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Status: {model.status}</p>
          <button onClick={() => transition('RESET')}>
            Reset
          </button>
        </div>
      );
    },
  },
});

const ServerStateExample: React.FC = () => {
  const [robotCopy] = useState(() => createRobotCopy());
  const [serverHtml, setServerHtml] = useState<string>('');

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
  } = serverStateExampleMachine.useViewStateMachine({
    orderId: null,
    customer: null,
    items: [],
    total: 0,
    status: 'pending',
    serverRenderedHtml: '',
    clientState: 'idle',
  });

  // Initialize RobotCopy integration (optional; e.g. fish-burger wrapper provides it)
  useEffect(() => {
    robotCopy.integrateWithViewStateMachine?.(serverStateExampleMachine);
  }, [robotCopy]);

  const handleStartOrder = async () => {
    const orderId = `ORDER-${Date.now()}`;
    const customer = {
      name: 'John Doe',
      email: 'john@example.com',
      address: '123 Main St',
    };
    const items = [
      { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 },
      { id: 2, name: 'French Fries', price: 4.99, quantity: 1 },
    ];
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    send({
      type: 'START_ORDER',
      orderId,
      customer,
      items,
      total,
      status: 'processing',
    });
  };

  const handleServerRender = async () => {
    try {
      // Simulate server-side rendering
      const orderData = {
        orderId: context.orderId,
        customer: context.customer,
        items: context.items,
        total: context.total,
        payment: { method: 'credit' },
      };

      const result = await robotCopy.sendMessage('checkout/process', { orderData });
      console.log('Server render result:', result);

      // Simulate server-side HTML generation
      const serverHtml = `
        <div class="server-rendered-checkout">
          <h2>Server-Side Rendered Checkout</h2>
          <p>Order ID: ${context.orderId}</p>
          <p>Status: ${result.status}</p>
          <p>Total: $${context.total}</p>
          <form>
            <input type="text" placeholder="Name" value="${context.customer?.name || ''}" />
            <input type="email" placeholder="Email" value="${context.customer?.email || ''}" />
            <button type="submit">Complete Order</button>
          </form>
        </div>
      `;

      setServerHtml(serverHtml);

      send({
        type: 'SERVER_RENDER',
        serverRenderedHtml: serverHtml,
        status: result.status,
      });
    } catch (error) {
      console.error('Error in server render:', error);
    }
  };

  const handleClientUpdate = async () => {
    try {
      // Simulate client-side update
      const result = await robotCopy.sendMessage('cart/update', {
        items: context.items,
        total: context.total,
      });

      send({
        type: 'CLIENT_UPDATE',
        clientState: 'updated',
        status: 'client_processed',
      });
    } catch (error) {
      console.error('Error in client update:', error);
    }
  };

  const handleCompleteOrder = async () => {
    try {
      const result = await robotCopy.sendMessage('order/complete', {
        orderId: context.orderId,
        status: 'completed',
      });

      send({
        type: 'COMPLETE_ORDER',
        status: 'completed',
      });
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleReset = () => {
    setServerHtml('');
    send({ type: 'RESET' });
  };

  return (
    <div className="server-state-example">
      <div className="header">
        <h2>Server State Example - withServerState() Demo</h2>
        <div className="status">
          <p>Current State: {state}</p>
          <p>Order ID: {context.orderId || 'None'}</p>
          <p>Status: {context.status}</p>
          <p>Client State: {context.clientState}</p>
          <p>Server HTML: {context.serverRenderedHtml ? 'Generated' : 'None'}</p>
        </div>
      </div>

      <div className="controls">
        <button onClick={handleStartOrder} disabled={state !== 'idle'}>
          Start Order
        </button>
        <button onClick={handleServerRender} disabled={state !== 'processing'}>
          Server Render (withServerState)
        </button>
        <button onClick={handleClientUpdate} disabled={state !== 'processing'}>
          Client Update (withState)
        </button>
        <button onClick={handleCompleteOrder} disabled={!['serverRendered', 'clientUpdated'].includes(state)}>
          Complete Order
        </button>
        <button onClick={handleReset} disabled={state !== 'completed'}>
          Reset
        </button>
      </div>

      <div className="content">
        {/* Render current view */}
        {viewStack.length > 0 && (
          <div className="current-view">
            {viewStack[viewStack.length - 1]}
          </div>
        )}

        {/* Server HTML display */}
        {serverHtml && (
          <div className="server-html-display">
            <h3>Server-Side Rendered HTML</h3>
            <div className="html-preview">
              <div dangerouslySetInnerHTML={{ __html: serverHtml }} />
            </div>
            <details>
              <summary>Raw HTML</summary>
              <pre>{serverHtml}</pre>
            </details>
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

      <div className="explanation">
        <h3>withServerState() vs withState()</h3>
        <div className="comparison">
          <div className="server-state">
            <h4>Server State (withServerState)</h4>
            <ul>
              <li>Renders static HTML on server</li>
              <li>No client-side interactivity</li>
              <li>Better SEO and performance</li>
              <li>Uses renderHtml() instead of view()</li>
              <li>Returns HTML string</li>
            </ul>
          </div>
          <div className="client-state">
            <h4>Client State (withState)</h4>
            <ul>
              <li>Renders React components</li>
              <li>Full client-side interactivity</li>
              <li>Real-time updates</li>
              <li>Uses view() for React components</li>
              <li>Returns React.ReactNode</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .server-state-example {
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

        .controls button:disabled {
          background: #ccc;
          cursor: not-allowed;
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

        .server-html-display {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }

        .html-preview {
          border: 1px solid #ddd;
          padding: 10px;
          margin: 10px 0;
          background: white;
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

        .explanation {
          background: #e3f2fd;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 10px;
        }

        .server-state,
        .client-state {
          background: white;
          padding: 15px;
          border-radius: 4px;
        }

        .server-state h4 {
          color: #d32f2f;
        }

        .client-state h4 {
          color: #1976d2;
        }

        .idle-state,
        .processing-state,
        .server-rendered-state,
        .client-updated-state,
        .completed-state {
          text-align: center;
        }

        .idle-state button,
        .processing-state button,
        .server-rendered-state button,
        .client-updated-state button,
        .completed-state button {
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

export default ServerStateExample; 