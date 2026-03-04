import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { createRobotCopy } from '../core/Cave/tome/viewstatemachine/robotcopy/RobotCopy';
// Tome integration state machine
const tomeMachine = createViewStateMachine({
    machineId: 'tome-integration',
    xstateConfig: {
        id: 'tome-integration',
        initial: 'browsing',
        context: {
            cartItems: [],
            checkoutData: null,
            currentPage: 'cart',
            traceId: null,
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
            view(_jsxs("div", { className: "cart-page", children: [_jsx("h2", { children: "\uD83D\uDED2 Shopping Cart (Client-Side)" }), _jsxs("p", { children: ["SSR: ", model.ssrEnabled ? 'Enabled' : 'Disabled'] }), _jsxs("p", { children: ["Items: ", model.cartItems.length] }), _jsx("button", { onClick: () => transition('PROCEED_TO_CHECKOUT'), children: "Proceed to Checkout (SSR)" })] }));
        },
        checkout: async ({ state, model, log, view, transition }) => {
            await log('User in checkout', {
                cartItems: model.cartItems.length,
                currentPage: model.currentPage,
                ssrEnabled: model.ssrEnabled,
            });
            view(_jsxs("div", { className: "checkout-page", children: [_jsx("h2", { children: "\uD83D\uDC1F Checkout (Server-Side Rendered)" }), _jsxs("p", { children: ["SSR: ", model.ssrEnabled ? 'Enabled' : 'Disabled'] }), _jsxs("p", { children: ["Items: ", model.cartItems.length] }), _jsx("button", { onClick: () => transition('COMPLETE_ORDER'), children: "Complete Order" }), _jsx("button", { onClick: () => transition('BACK_TO_CART'), children: "Back to Cart" })] }));
        },
        completed: async ({ state, model, log, view, transition }) => {
            await log('Order completed', {
                cartItems: model.cartItems.length,
                currentPage: model.currentPage,
                ssrEnabled: model.ssrEnabled,
            });
            view(_jsxs("div", { className: "completed-page", children: [_jsx("h2", { children: "\u2705 Order Completed" }), _jsx("p", { children: "Thank you for your order!" }), _jsx("button", { onClick: () => transition('NEW_ORDER'), children: "Start New Order" })] }));
        },
    },
});
const TomeIntegration = () => {
    const [robotCopy] = useState(() => createRobotCopy());
    const [currentPage, setCurrentPage] = useState('cart');
    const [cartItems, setCartItems] = useState([
        { id: 1, name: 'Fish Burger', price: 12.99, quantity: 1 },
        { id: 2, name: 'French Fries', price: 4.99, quantity: 1 },
    ]);
    const { state, context, send, logEntries, viewStack, log, view, clear, transition, } = tomeMachine.useViewStateMachine({
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
    const handleAddToCart = async (item) => {
        try {
            const result = await robotCopy.sendMessage('cart/add', { item });
            console.log('Add to cart result:', result);
            send({
                type: 'ADD_TO_CART',
                data: { item },
            });
        }
        catch (error) {
            console.error('Error adding to cart:', error);
        }
    };
    const handleRemoveFromCart = async (itemId) => {
        try {
            const result = await robotCopy.sendMessage('cart/remove', { itemId });
            console.log('Remove from cart result:', result);
            send({
                type: 'REMOVE_FROM_CART',
                data: { itemId },
            });
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
    return (_jsxs("div", { className: "tome-integration", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "Tome Integration - SSR Checkout & Client Cart" }), _jsxs("div", { className: "status", children: [_jsxs("p", { children: ["Current State: ", state] }), _jsxs("p", { children: ["Current Page: ", context.currentPage] }), _jsxs("p", { children: ["SSR Enabled: ", context.ssrEnabled ? 'Yes' : 'No'] }), _jsxs("p", { children: ["Cart Items: ", cartItems.length] })] })] }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: () => handleAddToCart({ id: 3, name: 'Soda', price: 2.99 }), children: "Add Soda to Cart" }), _jsx("button", { onClick: () => handleRemoveFromCart(1), children: "Remove Fish Burger" }), _jsx("button", { onClick: handleProceedToCheckout, children: "Go to SSR Checkout" }), _jsx("button", { onClick: handleCompleteOrder, children: "Complete Order" }), _jsx("button", { onClick: handleBackToCart, children: "Back to Cart" }), _jsx("button", { onClick: handleStartNewOrder, children: "New Order" })] }), _jsxs("div", { className: "content", children: [viewStack.length > 0 && (_jsx("div", { className: "current-view", children: viewStack[viewStack.length - 1] })), _jsxs("div", { className: "cart-display", children: [_jsx("h3", { children: "Current Cart Items" }), cartItems.map((item) => (_jsxs("div", { className: "cart-item", children: [_jsxs("span", { children: [item.name, " - $", item.price] }), _jsxs("span", { children: ["Qty: ", item.quantity] })] }, item.id))), _jsxs("p", { children: ["Total: $", cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)] })] }), logEntries.length > 0 && (_jsxs("div", { className: "log-entries", children: [_jsx("h3", { children: "Log Entries" }), _jsx("div", { className: "logs", children: logEntries.map((entry, index) => (_jsxs("div", { className: "log-entry", children: [_jsxs("strong", { children: ["[", entry.level, "]"] }), " ", entry.message, entry.metadata && (_jsx("pre", { children: JSON.stringify(entry.metadata, null, 2) }))] }, index))) })] }))] }), _jsxs("div", { className: "navigation", children: [_jsx("h3", { children: "Navigation" }), _jsxs("p", { children: [_jsx("strong", { children: "Cart Page:" }), " Client-side rendered with interactive cart management"] }), _jsxs("p", { children: [_jsx("strong", { children: "Checkout Page:" }), " Server-side rendered with form processing"] }), _jsxs("p", { children: [_jsx("strong", { children: "Tome Server:" }), " Handles SSR for checkout and API for cart operations"] })] }), _jsx("style", { jsx: true, children: `
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
      ` })] }));
};
export default TomeIntegration;
