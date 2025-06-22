import { StateMachine, StateMachineContext } from '../core/StateMachine';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface CartModel {
    items: CartItem[];
    total: number;
    status: 'EMPTY' | 'HAS_ITEMS' | 'CHECKING_OUT' | 'COMPLETED';
}

export interface CartConfig {
    cartId: string;
}

// Mock data for testing
const mockBurgers = [
    { id: '1', name: 'Classic Fish Burger', price: 8.99 },
    { id: '2', name: 'Spicy Fish Burger', price: 9.99 },
    { id: '3', name: 'Deluxe Fish Burger', price: 11.99 }
];

export const createSimpleCart = (config: CartConfig) => {
    const initialState: CartModel = {
        items: [],
        total: 0,
        status: 'EMPTY'
    };

    const machine = new StateMachine<CartConfig, CartModel>({
        defaultConfig: config,
        defaultViewModel: initialState,
        states: {
            EMPTY: {},
            HAS_ITEMS: {},
            CHECKING_OUT: {},
            COMPLETED: {}
        }
    });

    // State handlers
    machine.withState('EMPTY', async (context: StateMachineContext<CartConfig, CartModel>) => {
        context.viewModel.status = 'EMPTY';
        context.viewModel.items = [];
        context.viewModel.total = 0;
    });

    machine.withState('HAS_ITEMS', async (context: StateMachineContext<CartConfig, CartModel>) => {
        context.viewModel.status = 'HAS_ITEMS';
    });

    machine.withState('CHECKING_OUT', async (context: StateMachineContext<CartConfig, CartModel>) => {
        context.viewModel.status = 'CHECKING_OUT';
    });

    machine.withState('COMPLETED', async (context: StateMachineContext<CartConfig, CartModel>) => {
        context.viewModel.status = 'COMPLETED';
    });

    // Methods - these will be called via sendMessage
    machine.withMethod('addItem', async (context: StateMachineContext<CartConfig, CartModel>) => {
        // In a real implementation, the burgerId would come from the message payload
        const burgerId = '1'; // Default for demo
        const burger = mockBurgers.find(b => b.id === burgerId);
        if (!burger) {
            throw new Error('Burger not found');
        }

        const existingItem = context.viewModel.items.find(item => item.id === burgerId);
        const newItems = existingItem
            ? context.viewModel.items.map((item: CartItem) =>
                item.id === burgerId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
            : [...context.viewModel.items, { id: burger.id, name: burger.name, price: burger.price, quantity: 1 }];

        const newTotal = newItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);

        context.viewModel.items = newItems;
        context.viewModel.total = newTotal;
        await context.transition('HAS_ITEMS');
    });

    machine.withMethod('checkout', async (context: StateMachineContext<CartConfig, CartModel>) => {
        await context.transition('CHECKING_OUT');
    });

    machine.withMethod('handlePaymentSuccess', async (context: StateMachineContext<CartConfig, CartModel>) => {
        await context.transition('COMPLETED');
    });

    machine.withMethod('startNewOrder', async (context: StateMachineContext<CartConfig, CartModel>) => {
        await context.transition('EMPTY');
    });

    return machine;
}; 