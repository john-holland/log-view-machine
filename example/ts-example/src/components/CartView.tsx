import React from 'react';
import { createView, ViewMachine } from '../core/ViewMachine';
import { BaseStateMachine } from '../core/StateMachine';
import { CartItem, FishBurgerData } from '../types/TastyFishBurger';
import * as mori from 'mori';

// Create a view for the cart items that only handles UI concerns
const cartItemsView = createView({
    machineId: 'cart-items',
    states: ['EMPTY', 'ITEMS', 'LOADING'],
    render: ({ state }) => {
        if (state === undefined) {
            return <div>Loading...</div>
        }
        return <></>;
    },
    container: ({ children }) => {
        return (<div className="cart-items">{children}</div>);
    }
}).withState('EMPTY', ({ sendMessage }) => {
    return (<div className="empty-cart">
        <p>Your cart is empty</p>
        <button onClick={() => sendMessage({ type: 'START_SHOPPING' })}>
            Start Shopping
        </button>
    </div>);
}).withState('ITEMS', ({ model, sendMessage }) => {
    return (<div className="items-list">
        {model.items.map((item: CartItem) => (
            <div key={item.id} className="cart-item">
                <span>{item.name}</span>
                <span>${item.price}</span>
                <button onClick={() => sendMessage({ 
                    type: 'REMOVE_ITEM', 
                    payload: { itemId: item.id }
                })}>
                    Remove
                </button>
            </div>
        ))}
    </div>);
});

// Create a view for the cart summary that handles pricing
const cartSummaryView = createView({
    machineId: 'cart-summary',
    states: ['EMPTY', 'ITEMS', 'CHECKOUT'],
    render: ({ state }) => {
        if (state === undefined) {
            return <div>Loading...</div>
        }
        return <></>;
    },
    container: ({ children }) => {
        return <div className="cart-summary">{children}</div>
    }
}).withState('EMPTY', ({ }) => {
    return (<div className="empty-summary">
        <p>No items in cart</p>
    </div>)
}).withState('ITEMS', ({ model, sendMessage }) => {
    return (<div className="summary-details">
        <p>Total Items: {model.items.length}</p>
        <p>Total: ${model.total}</p>
        <button onClick={() => sendMessage({ type: 'INITIATE_CHECKOUT' })}>
            Checkout
        </button>
    </div>)
});

// Create a view for the checkout process
const checkoutView = createView({
    machineId: 'checkout',
    states: ['INITIAL', 'PROCESSING', 'COMPLETE'],
    render: (props) => {
        const { state, sendMessage } = props;
        if (state === undefined) {
            return <div>Loading...</div>
        }
        return <></>;
    },
    container: ({ children }) => {
        return <div className="checkout">{children}</div>
    }
}).withState('INITIAL', ({ sendMessage }) => {
    return (<div className="checkout-form">
        <h2>Checkout</h2>
        <button onClick={() => sendMessage({ type: 'PROCESS_PAYMENT' })}>
            Process Payment
        </button>
    </div>)
}).withState('PROCESSING', ({ }) => {
    return (<div className="processing">
        <p>Processing your payment...</p>
    </div>)
}).withState('COMPLETE', ({ }) => {
    return (<div className="complete">
        <p>Thank you for your order!</p>
    </div>)
});

// Create the main cart view that composes everything
export const createCartView = (
    cartMachine: BaseStateMachine,
    burgerBuilderMachine: BaseStateMachine
) => {
    // Create base views with their respective machines
    const itemsView = cartItemsView(cartMachine);
    const summaryView = cartSummaryView(cartMachine);
    const checkoutView = checkoutView(cartMachine);

    // Create state-specific views
    const checkoutStateView = itemsView
        .withState('CHECKOUT', (props) => (
            <div className="checkout-flow">
                {checkoutView.render(props)}
                {summaryView.render(props)}
            </div>
        ));

    // Add methods for burger builder integration
    const enhancedView = itemsView
        .compose(summaryView)
        .withState('CHECKOUT', (props) => checkoutStateView.render(props))
        .withMethod('addBurger', (props) => {
            // Send message to burger builder machine
            props.sendMessage({ 
                type: 'ADD_TO_CART',
                payload: props.model.currentBurger
            }, 'burgerBuilder');
        })
        .withMethod('removeBurger', (props) => {
            props.sendMessage({ 
                type: 'REMOVE_FROM_CART',
                payload: { burgerId: props.model.burgerId }
            }, 'burgerBuilder');
        });

    return enhancedView;
};

// Usage in a React component
export const CartPage: React.FC = () => {
    const [cartMachine] = React.useState(() => new BaseStateMachine());
    const [burgerBuilderMachine] = React.useState(() => new BaseStateMachine());
    
    const cartView = React.useMemo(() => 
        createCartView(cartMachine, burgerBuilderMachine), 
        [cartMachine, burgerBuilderMachine]
    );

    return (
        <div className="cart-page">
            <h1>Shopping Cart</h1>
            {cartView.render({
                items: [],
                total: 0,
                currentBurger: null
            })}
        </div>
    );
}; 