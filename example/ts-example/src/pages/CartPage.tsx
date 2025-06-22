import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types/TastyFishBurger';
import { createView, ViewProps, ViewMachine } from '../core/ViewMachine';
import { ViewStateMachine } from '../core/ViewStateMachine';

interface CartPageProps {
    cartItems: CartItem[];
    onUpdateQuantity: (id: string, quantity: number) => void;
    onRemoveItem: (id: string) => void;
}

const cartView = createView({
    machineId: 'cart',
    states: ['INITIAL', 'PREPARING', 'READY'],
    render: (props: ViewProps) => {
        const { model, state, transition, sendMessage } = props;
        if (state === undefined) {
            // todo add gradient animated loading spinner placeholder 
            // for stateful view default render
            return <div>Loading...</div>
        }
        return <></>
    },
    container: ({ children }) => {
        return <div>{children}</div>
    }
})
.withState('INITIAL', ({ model, state, transition, sendMessage }) => {
    return initialView({ model, state, transition, sendMessage });
})
.withState('PREPARING', ({ model, state, transition, sendMessage }) => {
    return preparingView({ model, state, transition, sendMessage });
})
.withState('READY', ({ model, state, transition, sendMessage }) => {
    return readyView({ model, state, transition, sendMessage });
});

export const CartPage: React.FC<CartPageProps> = ({
    cartItems,
    onUpdateQuantity,
    onRemoveItem
}: CartPageProps) => {
    const navigate = useNavigate();
    const [view] = React.useState(() => cartView(new ViewStateMachine({
        machineId: 'cart',
        recognizedStates: ['INITIAL', 'PREPARING', 'READY']
    })));

    const handleEat = () => {
        // Here we would typically send the order to the kitchen
        // For now, we'll just navigate to a success page
        navigate('/success');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Your Tasty Fish Burgers</h1>
            {view.render(cartItems)}
        </div>
    );
}; 