import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { createRobotCopy } from '../core/Cave/tome/viewstatemachine/robotcopy/RobotCopy';
// Example of a state machine that uses both client and server state handlers
const serverStateExampleMachine = createViewStateMachine({
    machineId: 'server-state-example',
    xstateConfig: {
        id: 'server-state-example',
        initial: 'idle',
        context: {
            orderId: null,
            customer: null,
            items: [],
            total: 0,
            status: 'pending',
            serverRenderedHtml: '',
            clientState: 'idle',
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
            view(_jsxs("div", { className: "idle-state", children: [_jsx("h3", { children: "Order Machine - Idle" }), _jsxs("p", { children: ["Status: ", model.status] }), _jsxs("p", { children: ["Server HTML: ", model.serverRenderedHtml ? 'Available' : 'None'] }), _jsx("button", { onClick: () => transition('START_ORDER'), children: "Start Order" })] }));
        },
        processing: async ({ state, model, log, view, transition }) => {
            await log('Order is processing', {
                orderId: model.orderId,
                status: model.status,
                items: model.items.length,
            });
            view(_jsxs("div", { className: "processing-state", children: [_jsx("h3", { children: "Order Machine - Processing" }), _jsxs("p", { children: ["Order ID: ", model.orderId] }), _jsxs("p", { children: ["Status: ", model.status] }), _jsxs("p", { children: ["Items: ", model.items.length] }), _jsx("button", { onClick: () => transition('SERVER_RENDER'), children: "Server Render" }), _jsx("button", { onClick: () => transition('CLIENT_UPDATE'), children: "Client Update" })] }));
        },
        serverRendered: async ({ state, model, log, view, transition }) => {
            await log('Order server rendered', {
                orderId: model.orderId,
                status: model.status,
                serverHtml: model.serverRenderedHtml ? 'Generated' : 'None',
            });
            view(_jsxs("div", { className: "server-rendered-state", children: [_jsx("h3", { children: "Order Machine - Server Rendered" }), _jsxs("p", { children: ["Order ID: ", model.orderId] }), _jsxs("p", { children: ["Status: ", model.status] }), _jsxs("p", { children: ["Server HTML: ", model.serverRenderedHtml ? 'Generated' : 'None'] }), _jsx("button", { onClick: () => transition('COMPLETE_ORDER'), children: "Complete Order" })] }));
        },
        clientUpdated: async ({ state, model, log, view, transition }) => {
            await log('Order client updated', {
                orderId: model.orderId,
                status: model.status,
                clientState: model.clientState,
            });
            view(_jsxs("div", { className: "client-updated-state", children: [_jsx("h3", { children: "Order Machine - Client Updated" }), _jsxs("p", { children: ["Order ID: ", model.orderId] }), _jsxs("p", { children: ["Status: ", model.status] }), _jsxs("p", { children: ["Client State: ", model.clientState] }), _jsx("button", { onClick: () => transition('COMPLETE_ORDER'), children: "Complete Order" })] }));
        },
        completed: async ({ state, model, log, view, transition }) => {
            await log('Order completed', {
                orderId: model.orderId,
                status: model.status,
            });
            view(_jsxs("div", { className: "completed-state", children: [_jsx("h3", { children: "Order Machine - Completed" }), _jsxs("p", { children: ["Order ID: ", model.orderId] }), _jsxs("p", { children: ["Status: ", model.status] }), _jsx("button", { onClick: () => transition('RESET'), children: "Reset" })] }));
        },
    },
});
const ServerStateExample = () => {
    const [robotCopy] = useState(() => createRobotCopy());
    const [serverHtml, setServerHtml] = useState('');
    const { state, context, send, logEntries, viewStack, log, view, clear, transition, } = serverStateExampleMachine.useViewStateMachine({
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Error completing order:', error);
        }
    };
    const handleReset = () => {
        setServerHtml('');
        send({ type: 'RESET' });
    };
    return (_jsxs("div", { className: "server-state-example", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "Server State Example - withServerState() Demo" }), _jsxs("div", { className: "status", children: [_jsxs("p", { children: ["Current State: ", state] }), _jsxs("p", { children: ["Order ID: ", context.orderId || 'None'] }), _jsxs("p", { children: ["Status: ", context.status] }), _jsxs("p", { children: ["Client State: ", context.clientState] }), _jsxs("p", { children: ["Server HTML: ", context.serverRenderedHtml ? 'Generated' : 'None'] })] })] }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: handleStartOrder, disabled: state !== 'idle', children: "Start Order" }), _jsx("button", { onClick: handleServerRender, disabled: state !== 'processing', children: "Server Render (withServerState)" }), _jsx("button", { onClick: handleClientUpdate, disabled: state !== 'processing', children: "Client Update (withState)" }), _jsx("button", { onClick: handleCompleteOrder, disabled: !['serverRendered', 'clientUpdated'].includes(state), children: "Complete Order" }), _jsx("button", { onClick: handleReset, disabled: state !== 'completed', children: "Reset" })] }), _jsxs("div", { className: "content", children: [viewStack.length > 0 && (_jsx("div", { className: "current-view", children: viewStack[viewStack.length - 1] })), serverHtml && (_jsxs("div", { className: "server-html-display", children: [_jsx("h3", { children: "Server-Side Rendered HTML" }), _jsx("div", { className: "html-preview", children: _jsx("div", { dangerouslySetInnerHTML: { __html: serverHtml } }) }), _jsxs("details", { children: [_jsx("summary", { children: "Raw HTML" }), _jsx("pre", { children: serverHtml })] })] })), logEntries.length > 0 && (_jsxs("div", { className: "log-entries", children: [_jsx("h3", { children: "Log Entries" }), _jsx("div", { className: "logs", children: logEntries.map((entry, index) => (_jsxs("div", { className: "log-entry", children: [_jsxs("strong", { children: ["[", entry.level, "]"] }), " ", entry.message, entry.metadata && (_jsx("pre", { children: JSON.stringify(entry.metadata, null, 2) }))] }, index))) })] }))] }), _jsxs("div", { className: "explanation", children: [_jsx("h3", { children: "withServerState() vs withState()" }), _jsxs("div", { className: "comparison", children: [_jsxs("div", { className: "server-state", children: [_jsx("h4", { children: "Server State (withServerState)" }), _jsxs("ul", { children: [_jsx("li", { children: "Renders static HTML on server" }), _jsx("li", { children: "No client-side interactivity" }), _jsx("li", { children: "Better SEO and performance" }), _jsx("li", { children: "Uses renderHtml() instead of view()" }), _jsx("li", { children: "Returns HTML string" })] })] }), _jsxs("div", { className: "client-state", children: [_jsx("h4", { children: "Client State (withState)" }), _jsxs("ul", { children: [_jsx("li", { children: "Renders React components" }), _jsx("li", { children: "Full client-side interactivity" }), _jsx("li", { children: "Real-time updates" }), _jsx("li", { children: "Uses view() for React components" }), _jsx("li", { children: "Returns React.ReactNode" })] })] })] })] }), _jsx("style", { children: `
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
      ` })] }));
};
export default ServerStateExample;
