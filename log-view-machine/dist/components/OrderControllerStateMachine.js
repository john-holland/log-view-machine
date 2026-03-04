import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { createRobotCopy } from '../core/Cave/tome/viewstatemachine/robotcopy/RobotCopy';
import { createCompleteOrderStateMachine } from './CompleteOrderStateMachine';
// OrderControllerStateMachine - High-level orchestration
const orderControllerMachine = createViewStateMachine({
    machineId: 'order-controller',
    xstateConfig: {
        id: 'orderController',
        initial: 'browsing',
        context: {
            currentPage: 'browsing',
            cartItems: [],
            orderData: null,
            completeOrderResult: null,
            traceId: null,
            errorMessage: null,
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
            view(_jsxs("div", { className: "browsing-view", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "\uD83D\uDECD\uFE0F Fish Burger Restaurant" }), _jsx("p", { children: "Welcome! Browse our delicious menu and add items to your cart." })] }), _jsxs("div", { className: "menu-section", children: [_jsx("h3", { children: "\uD83C\uDF54 Our Menu" }), _jsxs("div", { className: "menu-items", children: [_jsxs("div", { className: "menu-item", children: [_jsxs("div", { className: "item-info", children: [_jsx("h4", { children: "Fish Burger Deluxe" }), _jsx("p", { children: "Fresh fish fillet with lettuce, tomato, and special sauce" }), _jsx("span", { className: "price", children: "$12.99" })] }), _jsx("button", { onClick: () => transition('ADD_TO_CART'), className: "add-to-cart-btn", children: "Add to Cart" })] }), _jsxs("div", { className: "menu-item", children: [_jsxs("div", { className: "item-info", children: [_jsx("h4", { children: "French Fries" }), _jsx("p", { children: "Crispy golden fries with sea salt" }), _jsx("span", { className: "price", children: "$4.99" })] }), _jsx("button", { onClick: () => transition('ADD_TO_CART'), className: "add-to-cart-btn", children: "Add to Cart" })] }), _jsxs("div", { className: "menu-item", children: [_jsxs("div", { className: "item-info", children: [_jsx("h4", { children: "Soft Drink" }), _jsx("p", { children: "Refreshing beverage of your choice" }), _jsx("span", { className: "price", children: "$2.99" })] }), _jsx("button", { onClick: () => transition('ADD_TO_CART'), className: "add-to-cart-btn", children: "Add to Cart" })] })] })] }), _jsxs("div", { className: "cart-summary", children: [_jsx("h3", { children: "\uD83D\uDED2 Your Cart" }), model.cartItems?.length > 0 ? (_jsxs("div", { className: "cart-items", children: [model.cartItems.map((item, index) => (_jsxs("div", { className: "cart-item", children: [_jsx("span", { className: "item-name", children: item.name }), _jsxs("span", { className: "item-price", children: ["$", item.price] })] }, index))), _jsx("div", { className: "cart-total", children: _jsxs("strong", { children: ["Total: $", model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0] }) }), _jsx("button", { onClick: () => transition('PROCEED_TO_CHECKOUT'), className: "checkout-btn", children: "Proceed to Checkout" })] })) : (_jsx("div", { className: "empty-cart", children: _jsx("p", { children: "Your cart is empty. Add some delicious items!" }) }))] })] }));
        },
        checkout: async ({ state, model, log, view, transition }) => {
            await log('Checkout page', {
                cartItems: model.cartItems?.length || 0,
                orderData: model.orderData,
            });
            view(_jsxs("div", { className: "checkout-view", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "\uD83D\uDED2 Checkout" }), _jsx("p", { children: "Review your order and complete your purchase." })] }), _jsxs("div", { className: "checkout-content", children: [_jsxs("div", { className: "order-summary", children: [_jsx("h3", { children: "\uD83D\uDCCB Order Summary" }), model.cartItems?.map((item, index) => (_jsxs("div", { className: "summary-item", children: [_jsxs("div", { className: "item-details", children: [_jsx("span", { className: "item-name", children: item.name }), _jsxs("span", { className: "item-quantity", children: ["x", item.quantity] })] }), _jsxs("span", { className: "item-price", children: ["$", item.price * item.quantity] })] }, index))), _jsx("div", { className: "summary-total", children: _jsxs("strong", { children: ["Total: $", model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0] }) })] }), _jsxs("div", { className: "customer-info", children: [_jsx("h3", { children: "\uD83D\uDC64 Customer Information" }), _jsxs("div", { className: "info-preview", children: [_jsxs("p", { children: [_jsx("strong", { children: "Name:" }), " John Doe"] }), _jsxs("p", { children: [_jsx("strong", { children: "Email:" }), " john@example.com"] }), _jsxs("p", { children: [_jsx("strong", { children: "Address:" }), " 123 Main St, City, State 12345"] })] })] }), _jsxs("div", { className: "payment-info", children: [_jsx("h3", { children: "\uD83D\uDCB3 Payment Information" }), _jsxs("div", { className: "payment-preview", children: [_jsxs("p", { children: [_jsx("strong", { children: "Method:" }), " Credit Card"] }), _jsxs("p", { children: [_jsx("strong", { children: "Card Type:" }), " Visa"] })] })] }), _jsxs("div", { className: "checkout-actions", children: [_jsx("button", { onClick: () => transition('START_ORDER_PROCESSING'), className: "process-order-btn", children: "Process Order" }), _jsx("button", { onClick: () => transition('BACK_TO_BROWSING'), className: "back-btn", children: "Back to Menu" })] })] })] }));
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
                view(_jsxs("div", { className: "order-processing-view", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "\uD83D\uDD04 Processing Your Order" }), _jsx("p", { children: "We're processing your order through our CompleteOrderStateMachine..." })] }), _jsxs("div", { className: "processing-container", children: [_jsx("div", { className: "processing-status", children: _jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: "spinner", children: "\u23F3" }), _jsx("p", { children: "Processing order..." })] }) }), _jsxs("div", { className: "sub-machine-container", children: [_jsx("h3", { children: "\uD83D\uDCCB Order Processing Details" }), _jsx("div", { className: "sub-machine-view", children: completeOrderMachine.render(model.orderData) })] }), _jsxs("div", { className: "order-details", children: [_jsx("h3", { children: "\uD83D\uDCC4 Order Information" }), _jsxs("div", { className: "details-grid", children: [_jsxs("div", { className: "detail-item", children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderData?.orderId] }), _jsxs("div", { className: "detail-item", children: [_jsx("strong", { children: "Customer:" }), " ", model.orderData?.customer?.name] }), _jsxs("div", { className: "detail-item", children: [_jsx("strong", { children: "Items:" }), " ", model.orderData?.items?.length, " items"] }), _jsxs("div", { className: "detail-item", children: [_jsx("strong", { children: "Total:" }), " $", model.orderData?.total] }), _jsxs("div", { className: "detail-item", children: [_jsx("strong", { children: "Trace ID:" }), " ", model.traceId] })] })] })] })] }));
            }
            else {
                view(_jsxs("div", { className: "error-view", children: [_jsx("h3", { children: "\u274C Error" }), _jsx("p", { children: "Could not initialize CompleteOrderStateMachine" }), _jsx("button", { onClick: () => transition('BACK_TO_BROWSING'), className: "back-btn", children: "Back to Menu" })] }));
            }
        },
        orderCompleted: async ({ state, model, log, view, transition }) => {
            await log('Order completed successfully', {
                result: model.completeOrderResult,
            });
            view(_jsxs("div", { className: "order-completed-view", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "\uD83C\uDF89 Order Successfully Completed!" }), _jsx("p", { children: "Thank you for your order! Your food is being prepared." })] }), _jsxs("div", { className: "completion-details", children: [_jsxs("div", { className: "success-message", children: [_jsx("div", { className: "success-icon", children: "\u2705" }), _jsx("h3", { children: "Order Confirmed" }), _jsx("p", { children: "Your order has been processed and confirmed. You will receive a confirmation email shortly." })] }), _jsxs("div", { className: "order-summary", children: [_jsx("h3", { children: "\uD83D\uDCCB Order Summary" }), _jsxs("div", { className: "summary-details", children: [_jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Order ID:" }), " ", model.completeOrderResult?.orderId || model.orderData?.orderId] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Status:" }), " ", model.completeOrderResult?.status || 'completed'] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Total:" }), " $", model.orderData?.total] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Customer:" }), " ", model.orderData?.customer?.name] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Trace ID:" }), " ", model.traceId] })] })] }), _jsxs("div", { className: "next-steps", children: [_jsx("h3", { children: "\uD83D\uDCF1 What's Next?" }), _jsxs("ul", { children: [_jsx("li", { children: "You'll receive an email confirmation" }), _jsx("li", { children: "Your order will be prepared in our kitchen" }), _jsx("li", { children: "We'll notify you when it's ready for pickup" }), _jsx("li", { children: "Estimated preparation time: 15-20 minutes" })] })] })] }), _jsx("div", { className: "completion-actions", children: _jsx("button", { onClick: () => transition('START_NEW_ORDER'), className: "new-order-btn", children: "Start New Order" }) })] }));
        },
        orderCancelled: async ({ state, model, log, view, transition }) => {
            await log('Order cancelled', {
                result: model.completeOrderResult,
            });
            view(_jsxs("div", { className: "order-cancelled-view", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "\uD83D\uDEAB Order Cancelled" }), _jsx("p", { children: "Your order has been cancelled. No charges will be made to your account." })] }), _jsxs("div", { className: "cancellation-details", children: [_jsxs("div", { className: "cancellation-message", children: [_jsx("div", { className: "cancellation-icon", children: "\uD83D\uDEAB" }), _jsx("h3", { children: "Order Cancelled" }), _jsx("p", { children: "Your order has been successfully cancelled. No charges will be made to your account." })] }), _jsxs("div", { className: "order-summary", children: [_jsx("h3", { children: "\uD83D\uDCCB Cancelled Order Details" }), _jsxs("div", { className: "summary-details", children: [_jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Order ID:" }), " ", model.completeOrderResult?.orderId || model.orderData?.orderId] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Status:" }), " ", model.completeOrderResult?.status || 'cancelled'] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Total:" }), " $", model.orderData?.total] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Trace ID:" }), " ", model.traceId] })] })] })] }), _jsx("div", { className: "cancellation-actions", children: _jsx("button", { onClick: () => transition('START_NEW_ORDER'), className: "new-order-btn", children: "Start New Order" }) })] }));
        },
        orderError: async ({ state, model, log, view, transition }) => {
            await log('Order error', {
                result: model.completeOrderResult,
                errorMessage: model.errorMessage,
            });
            view(_jsxs("div", { className: "order-error-view", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "\u274C Order Processing Error" }), _jsx("p", { children: "We encountered an issue while processing your order. Please try again." })] }), _jsxs("div", { className: "error-details", children: [_jsxs("div", { className: "error-message", children: [_jsx("div", { className: "error-icon", children: "\u274C" }), _jsx("h3", { children: "Processing Error" }), _jsx("p", { children: model.errorMessage || 'An error occurred while processing your order. Please try again.' })] }), _jsxs("div", { className: "order-summary", children: [_jsx("h3", { children: "\uD83D\uDCCB Order Details" }), _jsxs("div", { className: "summary-details", children: [_jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Order ID:" }), " ", model.completeOrderResult?.orderId || model.orderData?.orderId] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Status:" }), " ", model.completeOrderResult?.status || 'error'] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Total:" }), " $", model.orderData?.total] }), _jsxs("div", { className: "detail-row", children: [_jsx("strong", { children: "Trace ID:" }), " ", model.traceId] })] })] }), _jsxs("div", { className: "error-suggestions", children: [_jsx("h3", { children: "\uD83D\uDCA1 What you can do:" }), _jsxs("ul", { children: [_jsx("li", { children: "Check your payment information" }), _jsx("li", { children: "Verify your delivery address" }), _jsx("li", { children: "Try processing the order again" }), _jsx("li", { children: "Contact customer support if the issue persists" })] })] })] }), _jsxs("div", { className: "error-actions", children: [_jsx("button", { onClick: () => transition('RETRY_ORDER'), className: "retry-btn", children: "Retry Order" }), _jsx("button", { onClick: () => transition('CANCEL_ORDER'), className: "cancel-btn", children: "Cancel Order" }), _jsx("button", { onClick: () => transition('BACK_TO_BROWSING'), className: "back-btn", children: "Back to Menu" })] })] }));
        },
    },
});
const OrderControllerStateMachine = () => {
    const [robotCopy] = useState(() => createRobotCopy());
    const { state, context, send, logEntries, viewStack, log, view, clear, transition, } = orderControllerMachine.useViewStateMachine({
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
            }
            else {
                send({
                    type: 'ORDER_ERROR',
                    data: { result, errorMessage: 'Payment processing failed' },
                });
            }
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('Cancel error:', error);
        }
    };
    const handleStartNewOrder = () => {
        send({ type: 'START_NEW_ORDER' });
    };
    return (_jsxs("div", { className: "order-controller-state-machine", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "Order Controller State Machine" }), _jsxs("div", { className: "status", children: [_jsxs("p", { children: [_jsx("strong", { children: "Current State:" }), " ", state] }), _jsxs("p", { children: [_jsx("strong", { children: "Current Page:" }), " ", context.currentPage] }), _jsxs("p", { children: [_jsx("strong", { children: "Cart Items:" }), " ", context.cartItems?.length || 0] }), _jsxs("p", { children: [_jsx("strong", { children: "Trace ID:" }), " ", context.traceId || 'None'] })] })] }), _jsxs("div", { className: "controls", children: [state === 'browsing' && (_jsx("button", { onClick: handleAddToCart, className: "add-btn", children: "Add Fish Burger to Cart" })), state === 'checkout' && (_jsx("button", { onClick: handleStartOrderProcessing, className: "process-btn", children: "Process Order" })), state === 'orderError' && (_jsxs("div", { className: "error-controls", children: [_jsx("button", { onClick: handleRetryOrder, className: "retry-btn", children: "Retry Order" }), _jsx("button", { onClick: handleCancelOrder, className: "cancel-btn", children: "Cancel Order" })] })), "// todo: reorganize these state condition renders into withState() views, and add a state for 'completed' that is invoked by both orderCancelled and orderCompleted", (state === 'orderCompleted' || state === 'orderCancelled') && (_jsx("button", { onClick: handleStartNewOrder, className: "new-order-btn", children: "Start New Order" }))] }), _jsxs("div", { className: "content", children: [viewStack.length > 0 && (_jsx("div", { className: "current-view", children: viewStack[viewStack.length - 1] })), logEntries.length > 0 && (_jsxs("div", { className: "log-entries", children: [_jsx("h3", { children: "Log Entries" }), _jsx("div", { className: "logs", children: logEntries.map((entry, index) => (_jsxs("div", { className: "log-entry", children: [_jsxs("strong", { children: ["[", entry.level, "]"] }), " ", entry.message, entry.metadata && (_jsx("pre", { children: JSON.stringify(entry.metadata, null, 2) }))] }, index))) })] }))] }), _jsx("style", { jsx: true, children: `
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
      ` })] }));
};
export default OrderControllerStateMachine;
