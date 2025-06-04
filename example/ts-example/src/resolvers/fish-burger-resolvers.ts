import { createTastyFishBurgerCart } from '../machines/TastyFishBurgerCartMachine';
import { createTastyFishBurger } from '../machines/TastyFishBurgerMachine';
import { GraphQLContext } from '../types/context';
import { CartItem, FishBurgerData, ViewModel } from '../types/TastyFishBurger';
import { TastyFishBurgerCartModel } from '../machines/TastyFishBurgerCartMachine';

// Initialize our state machines
const cartMachine = createTastyFishBurgerCart({
    machineId: 'fish-burger-cart-1',
    initialState: 'INITIAL'
});

const burgerMachine = createTastyFishBurger({
    machineId: 'fish-burger-1',
    initialState: 'INITIAL'
});

const getCartViewModel = (viewModel: ViewModel): TastyFishBurgerCartModel => {
    return {
        ...viewModel,
        burgers: (viewModel as any).burgers || [],
        subMachines: (viewModel as any).subMachines || {}
    };
};

export const fishBurgerResolvers = {
    Query: {
        burger: async (_: any, { id }: { id: string }, { burgerService }: GraphQLContext) => {
            return burgerService.getBurger(parseInt(id));
        },

        burgers: async (_: any, {
            status,
            limit,
            offset
        }: {
            status?: string;
            limit?: number;
            offset?: number;
        }, { burgerService }: GraphQLContext) => {
            return burgerService.listBurgers({
                status,
                limit,
                offset
            });
        },

        cart: async (_: any, __: any, { cartService }: GraphQLContext) => {
            const viewModel = getCartViewModel(cartMachine.getViewModel());
            return {
                id: 'cart-1',
                items: viewModel.burgers,
                totalPrice: viewModel.burgers.reduce((sum: number, item: CartItem) => 
                    sum + (item.burger.price * item.quantity), 0),
                status: viewModel.currentState,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
    },

    Mutation: {
        createBurger: async (_: any, { input }: { input: any }, { burgerService }: GraphQLContext) => {
            const burger = await burgerService.createBurger(input);
            burgerMachine.transition('PREPARING');
            return burger;
        },

        updateBurgerStatus: async (_: any, {
            id,
            status
        }: {
            id: string;
            status: string;
        }, { burgerService }: GraphQLContext) => {
            const burger = await burgerService.getBurger(parseInt(id));
            if (!burger) throw new Error('Burger not found');
            
            burgerMachine.transition(status);
            return burgerService.updateBurgerStatus(parseInt(id), status);
        },

        addToCart: async (_: any, { burgerId }: { burgerId: string }, { burgerService }: GraphQLContext) => {
            const burger = await burgerService.getBurger(parseInt(burgerId));
            if (!burger) throw new Error('Burger not found');

            cartMachine.transition('ADD_TO_CART');
            const viewModel = getCartViewModel(cartMachine.getViewModel());
            
            return {
                id: 'cart-1',
                items: viewModel.burgers,
                totalPrice: viewModel.burgers.reduce((sum: number, item: CartItem) => 
                    sum + (item.burger.price * item.quantity), 0),
                status: viewModel.currentState,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        },

        updateCartItemQuantity: async (_: any, {
            itemId,
            quantity
        }: {
            itemId: string;
            quantity: number;
        }, { cartService }: GraphQLContext) => {
            const viewModel = getCartViewModel(cartMachine.getViewModel());
            const updatedBurgers = viewModel.burgers.map(item => 
                item.id === itemId ? { ...item, quantity } : item
            );

            cartMachine.sendMessage('LOG', {
                level: 'INFO',
                message: 'Cart item quantity updated',
                metadata: { machineId: 'fish-burger-cart-1' },
                viewModel: { burgers: updatedBurgers }
            });

            return {
                id: 'cart-1',
                items: updatedBurgers,
                totalPrice: updatedBurgers.reduce((sum: number, item: CartItem) => 
                    sum + (item.burger.price * item.quantity), 0),
                status: viewModel.currentState,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        },

        removeFromCart: async (_: any, { itemId }: { itemId: string }, { cartService }: GraphQLContext) => {
            const viewModel = getCartViewModel(cartMachine.getViewModel());
            const updatedBurgers = viewModel.burgers.filter(item => item.id !== itemId);

            cartMachine.sendMessage('LOG', {
                level: 'INFO',
                message: 'Item removed from cart',
                metadata: { machineId: 'fish-burger-cart-1' },
                viewModel: { burgers: updatedBurgers }
            });

            return {
                id: 'cart-1',
                items: updatedBurgers,
                totalPrice: updatedBurgers.reduce((sum: number, item: CartItem) => 
                    sum + (item.burger.price * item.quantity), 0),
                status: viewModel.currentState,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        },

        eatBurgers: async (_: any, __: any, { cartService }: GraphQLContext) => {
            cartMachine.transition('EAT');
            const viewModel = getCartViewModel(cartMachine.getViewModel());

            return {
                id: 'cart-1',
                items: viewModel.burgers,
                totalPrice: 0,
                status: viewModel.currentState,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        },

        trashBurgers: async (_: any, __: any, { cartService }: GraphQLContext) => {
            cartMachine.transition('TRASH');
            const viewModel = getCartViewModel(cartMachine.getViewModel());

            return {
                id: 'cart-1',
                items: viewModel.burgers,
                totalPrice: 0,
                status: viewModel.currentState,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
    }
}; 