import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { createRobotCopy } from '../core/Cave/tome/viewstatemachine/robotcopy/RobotCopy';
// Create the CompleteOrderStateMachine as a reusable sub-machine
export const createCompleteOrderStateMachine = () => {
    return createViewStateMachine({
        machineId: 'complete-order-submachine',
        xstateConfig: {
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
                parentMachineId: null,
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
                    view(_jsxs("div", { className: "validation-error", children: [_jsx("h3", { children: "\u274C Order Validation Failed" }), _jsx("div", { className: "errors", children: errors.map((error, index) => (_jsxs("div", { className: "error-item", children: ["\u2022 ", error] }, index))) }), _jsxs("div", { className: "actions", children: [_jsx("button", { onClick: () => transition('RETRY'), className: "retry-btn", children: "Fix Errors & Retry" }), _jsx("button", { onClick: () => transition('CANCEL'), className: "cancel-btn", children: "Cancel Order" })] })] }));
                }
                else {
                    view(_jsxs("div", { className: "validation-success", children: [_jsx("h3", { children: "\u2705 Order Validation Passed" }), _jsxs("div", { className: "order-summary", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Customer:" }), " ", model.customer?.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Items:" }), " ", model.items?.length, " items"] }), _jsxs("p", { children: [_jsx("strong", { children: "Total:" }), " $", model.total] })] }), _jsx("button", { onClick: () => transition('PROCESS_PAYMENT'), className: "proceed-btn", children: "Proceed to Payment" })] }));
                }
            },
            payment: async ({ state, model, log, view, transition }) => {
                await log('Processing payment', {
                    orderId: model.orderId,
                    paymentMethod: model.payment?.method,
                    total: model.total,
                });
                view(_jsxs("div", { className: "payment-processing", children: [_jsx("h3", { children: "\uD83D\uDCB3 Processing Payment" }), _jsxs("div", { className: "payment-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Payment Method:" }), " ", model.payment?.method] }), _jsxs("p", { children: [_jsx("strong", { children: "Amount:" }), " $", model.total] }), _jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderId] })] }), _jsx("div", { className: "payment-status", children: _jsx("div", { className: "spinner", children: "\u23F3 Processing..." }) }), _jsx("button", { onClick: () => transition('PROCESS_PAYMENT'), className: "process-btn", children: "Process Payment" })] }));
            },
            processing: async ({ state, model, log, view, transition }) => {
                await log('Completing order', {
                    orderId: model.orderId,
                    status: model.status,
                });
                view(_jsxs("div", { className: "order-processing", children: [_jsx("h3", { children: "\uD83D\uDD04 Completing Order" }), _jsxs("div", { className: "processing-steps", children: [_jsx("div", { className: "step completed", children: "\u2705 Validation" }), _jsx("div", { className: "step completed", children: "\u2705 Payment" }), _jsx("div", { className: "step active", children: "\uD83D\uDD04 Processing" }), _jsx("div", { className: "step", children: "\u23F3 Completion" })] }), _jsxs("div", { className: "order-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.status] })] }), _jsx("button", { onClick: () => transition('COMPLETE_ORDER'), className: "complete-btn", children: "Complete Order" })] }));
            },
            completed: async ({ state, model, log, view, transition }) => {
                await log('Order completed successfully', {
                    orderId: model.orderId,
                    status: model.status,
                });
                view(_jsxs("div", { className: "order-completed", children: [_jsx("h3", { children: "\uD83C\uDF89 Order Completed Successfully!" }), _jsxs("div", { className: "completion-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.status] }), _jsxs("p", { children: [_jsx("strong", { children: "Total:" }), " $", model.total] }), _jsxs("p", { children: [_jsx("strong", { children: "Customer:" }), " ", model.customer?.name] })] }), _jsx("div", { className: "success-message", children: _jsx("p", { children: "Your order has been processed and confirmed. You will receive an email confirmation shortly." }) })] }));
            },
            error: async ({ state, model, log, view, transition }) => {
                await log('Order error state', {
                    orderId: model.orderId,
                    status: model.status,
                    errors: [...(model.validationErrors || []), ...(model.paymentErrors || [])],
                });
                const allErrors = [...(model.validationErrors || []), ...(model.paymentErrors || [])];
                view(_jsxs("div", { className: "order-error", children: [_jsx("h3", { children: "\u274C Order Processing Error" }), _jsxs("div", { className: "error-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.status] })] }), allErrors.length > 0 && (_jsxs("div", { className: "errors", children: [_jsx("h4", { children: "Errors:" }), allErrors.map((error, index) => (_jsxs("div", { className: "error-item", children: ["\u2022 ", error] }, index)))] })), _jsxs("div", { className: "actions", children: [_jsx("button", { onClick: () => transition('RETRY'), className: "retry-btn", children: "Retry Order" }), _jsx("button", { onClick: () => transition('CANCEL'), className: "cancel-btn", children: "Cancel Order" })] })] }));
            },
            cancelled: async ({ state, model, log, view, transition }) => {
                await log('Order cancelled', {
                    orderId: model.orderId,
                    status: model.status,
                });
                view(_jsxs("div", { className: "order-cancelled", children: [_jsx("h3", { children: "\uD83D\uDEAB Order Cancelled" }), _jsxs("div", { className: "cancellation-details", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.status] })] }), _jsx("div", { className: "cancellation-message", children: _jsx("p", { children: "Your order has been cancelled. No charges will be made to your account." }) })] }));
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
            currentPage: 'browsing',
            cartItems: [],
            orderData: null,
            completeOrderResult: null,
            traceId: null,
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
            view(_jsxs("div", { className: "browsing-state", children: [_jsx("h3", { children: "\uD83D\uDECD\uFE0F Browse Products" }), _jsxs("div", { className: "cart-summary", children: [_jsxs("p", { children: [_jsx("strong", { children: "Cart Items:" }), " ", model.cartItems?.length || 0] }), _jsxs("p", { children: [_jsx("strong", { children: "Total:" }), " $", model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0] })] }), _jsxs("div", { className: "actions", children: [_jsx("button", { onClick: () => transition('ADD_TO_CART'), className: "add-btn", children: "Add Fish Burger to Cart" }), _jsx("button", { onClick: () => transition('PROCEED_TO_CHECKOUT'), className: "checkout-btn", disabled: !model.cartItems?.length, children: "Proceed to Checkout" })] })] }));
        },
        checkout: async ({ state, model, log, view, transition, subMachine }) => {
            await log('Checkout page', {
                cartItems: model.cartItems?.length || 0,
                orderData: model.orderData,
            });
            view(_jsxs("div", { className: "checkout-state", children: [_jsx("h3", { children: "\uD83D\uDED2 Checkout" }), _jsxs("div", { className: "order-summary", children: [_jsx("h4", { children: "Order Summary" }), model.cartItems?.map((item, index) => (_jsxs("div", { className: "cart-item", children: [_jsx("span", { children: item.name }), _jsxs("span", { children: ["$", item.price, " x ", item.quantity] })] }, index))), _jsx("div", { className: "total", children: _jsxs("strong", { children: ["Total: $", model.cartItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0] }) })] }), _jsxs("div", { className: "actions", children: [_jsx("button", { onClick: () => transition('START_ORDER_PROCESSING'), className: "process-btn", children: "Process Order" }), _jsx("button", { onClick: () => transition('BACK_TO_BROWSING'), className: "back-btn", children: "Back to Browsing" })] })] }));
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
                view(_jsxs("div", { className: "order-processing-state", children: [_jsx("h3", { children: "\uD83D\uDD04 Processing Order" }), _jsx("p", { children: "Using CompleteOrderStateMachine sub-machine..." }), _jsx("div", { className: "sub-machine-view", children: completeOrderMachine.render(model.orderData) })] }));
            }
            else {
                view(_jsxs("div", { className: "error-state", children: [_jsx("h3", { children: "\u274C Error" }), _jsx("p", { children: "Could not initialize CompleteOrderStateMachine" })] }));
            }
        },
        orderCompleted: async ({ state, model, log, view, transition }) => {
            await log('Order completed', {
                result: model.completeOrderResult,
            });
            view(_jsxs("div", { className: "order-completed-state", children: [_jsx("h3", { children: "\uD83C\uDF89 Order Successfully Completed!" }), _jsxs("div", { className: "completion-summary", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.completeOrderResult?.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.completeOrderResult?.status] }), _jsxs("p", { children: [_jsx("strong", { children: "Total:" }), " $", model.orderData?.total] })] }), _jsx("div", { className: "success-message", children: _jsx("p", { children: "Thank you for your order! You will receive a confirmation email shortly." }) }), _jsx("button", { onClick: () => transition('START_NEW_ORDER'), className: "new-order-btn", children: "Start New Order" })] }));
        },
        orderCancelled: async ({ state, model, log, view, transition }) => {
            await log('Order cancelled', {
                result: model.completeOrderResult,
            });
            view(_jsxs("div", { className: "order-cancelled-state", children: [_jsx("h3", { children: "\uD83D\uDEAB Order Cancelled" }), _jsxs("div", { className: "cancellation-summary", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.completeOrderResult?.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.completeOrderResult?.status] })] }), _jsx("div", { className: "cancellation-message", children: _jsx("p", { children: "Your order has been cancelled. No charges will be made to your account." }) }), _jsx("button", { onClick: () => transition('START_NEW_ORDER'), className: "new-order-btn", children: "Start New Order" })] }));
        },
        orderError: async ({ state, model, log, view, transition }) => {
            await log('Order error', {
                result: model.completeOrderResult,
            });
            view(_jsxs("div", { className: "order-error-state", children: [_jsx("h3", { children: "\u274C Order Processing Error" }), _jsxs("div", { className: "error-summary", children: [_jsxs("p", { children: [_jsx("strong", { children: "Order ID:" }), " ", model.completeOrderResult?.orderId] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), " ", model.completeOrderResult?.status] })] }), _jsxs("div", { className: "actions", children: [_jsx("button", { onClick: () => transition('RETRY_ORDER'), className: "retry-btn", children: "Retry Order" }), _jsx("button", { onClick: () => transition('CANCEL_ORDER'), className: "cancel-btn", children: "Cancel Order" })] })] }));
        },
    },
});
const CompleteOrderStateMachine = () => {
    const [robotCopy] = useState(() => createRobotCopy());
    const { state, context, send, logEntries, viewStack, log, view, clear, transition, } = mainOrderMachine.useViewStateMachine({
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
            }
            else {
                send({
                    type: 'ORDER_ERROR',
                    data: { result },
                });
            }
        }
        catch (error) {
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
    return (_jsxs("div", { className: "complete-order-state-machine", children: [_jsxs("div", { className: "header", children: [_jsx("h2", { children: "Complete Order State Machine - With Sub-Machine" }), _jsxs("div", { className: "status", children: [_jsxs("p", { children: [_jsx("strong", { children: "Current State:" }), " ", state] }), _jsxs("p", { children: [_jsx("strong", { children: "Current Page:" }), " ", context.currentPage] }), _jsxs("p", { children: [_jsx("strong", { children: "Cart Items:" }), " ", context.cartItems?.length || 0] }), _jsxs("p", { children: [_jsx("strong", { children: "Trace ID:" }), " ", context.traceId || 'None'] })] })] }), _jsxs("div", { className: "controls", children: [state === 'browsing' && (_jsx("button", { onClick: handleAddToCart, className: "add-btn", children: "Add Fish Burger to Cart" })), state === 'checkout' && (_jsx("button", { onClick: handleStartOrderProcessing, className: "process-btn", children: "Process Order" })), state === 'orderError' && (_jsxs("div", { className: "error-controls", children: [_jsx("button", { onClick: handleRetryOrder, className: "retry-btn", children: "Retry Order" }), _jsx("button", { onClick: handleCancelOrder, className: "cancel-btn", children: "Cancel Order" })] })), (state === 'orderCompleted' || state === 'orderCancelled') && (_jsx("button", { onClick: handleStartNewOrder, className: "new-order-btn", children: "Start New Order" }))] }), _jsxs("div", { className: "content", children: [viewStack.length > 0 && (_jsx("div", { className: "current-view", children: viewStack[viewStack.length - 1] })), logEntries.length > 0 && (_jsxs("div", { className: "log-entries", children: [_jsx("h3", { children: "Log Entries" }), _jsx("div", { className: "logs", children: logEntries.map((entry, index) => (_jsxs("div", { className: "log-entry", children: [_jsxs("strong", { children: ["[", entry.level, "]"] }), " ", entry.message, entry.metadata && (_jsx("pre", { children: JSON.stringify(entry.metadata, null, 2) }))] }, index))) })] }))] }), _jsx("style", { jsx: true, children: `
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
      ` })] }));
};
export default CompleteOrderStateMachine;
