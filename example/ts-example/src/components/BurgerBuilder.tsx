import React, { useState } from 'react';
import { createView, ViewProps, ViewMachine } from '../core/ViewMachine';
import { FishBurgerData } from '../types/TastyFishBurger';
import { StateMachine } from '../core/StateMachine';

interface Ingredient {
    name: string;
}

interface BurgerBuilderProps {
    onAddToCart: (burger: { ingredients: Ingredient[] }) => void;
    stateMachine: StateMachine<any, any>;
}

const burgerBuilderView = createView({
    machineId: 'burgerBuilder',
    states: ['INITIAL', 'BUILDING', 'SELECT_INGREDIENT', 'ADD_INGREDIENT', 'DONE', 'ADD_TO_CART'],
    render: (props: ViewProps) => {
        // Default loading UI for undefined states
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    },
    container: ({ children }: { children: React.ReactNode }) => (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            {children}
        </div>
    )
})
.withState('INITIAL', (props: ViewProps) => (
    <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Welcome to Burger Builder</h2>
        <button
            onClick={() => props.transition('BUILDING')}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
            Start Building
        </button>
    </div>
))
.withState('BUILDING', (props: ViewProps) => {
    const ingredients = props.model as Ingredient[];
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Build Your Burger</h2>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Selected Ingredients</h3>
                    {ingredients.length === 0 ? (
                        <p className="text-gray-500">No ingredients selected yet</p>
                    ) : (
                        <ul className="space-y-2">
                            {ingredients.map((ingredient: Ingredient, index: number) => (
                                <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span>{ingredient.name}</span>
                                    <button
                                        onClick={() => props.sendMessage({ type: 'REMOVE_INGREDIENT', payload: { index } })}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Available Ingredients</h3>
                    <div className="space-y-2">
                        {['Lettuce', 'Tomato', 'Cheese', 'Bacon', 'Onion'].map((name: string) => (
                            <button
                                key={name}
                                onClick={() => props.sendMessage({ type: 'ADD_INGREDIENT', payload: { name } })}
                                className="w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    onClick={() => props.transition('DONE')}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                >
                    Finish Building
                </button>
            </div>
        </div>
    );
})
.withState('DONE', (props: ViewProps) => {
    const ingredients = props.model as Ingredient[];
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Burger Complete!</h2>
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Your Burger Ingredients:</h3>
                <ul className="space-y-1">
                    {ingredients.map((ingredient: Ingredient, index: number) => (
                        <li key={index}>{ingredient.name}</li>
                    ))}
                </ul>
            </div>
            <div className="space-x-4">
                <button
                    onClick={() => props.transition('BUILDING')}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                    Continue Building
                </button>
                <button
                    onClick={() => props.transition('ADD_TO_CART')}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
})
.withState('ADD_TO_CART', (props: ViewProps) => {
    const ingredients = props.model as Ingredient[];
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Burger Added to Cart!</h2>
            <p className="mb-6">Your burger has been added to your cart.</p>
            <button
                onClick={() => props.transition('INITIAL')}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
            >
                Build Another Burger
            </button>
        </div>
    );
});

export const BurgerBuilder: React.FC<BurgerBuilderProps> = ({ onAddToCart, stateMachine }: BurgerBuilderProps) => {
    const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);

    // Use the state machine's view model
    const viewModel = stateMachine.getViewModel();

    const handleStateChange = (newState: string) => {
        if (newState === 'ADD_TO_CART') {
            onAddToCart({ ingredients: selectedIngredients });
        }
    };

    const handleMessage = (message: { type: string; payload: any }) => {
        switch (message.type) {
            case 'ADD_INGREDIENT':
                setSelectedIngredients([...selectedIngredients, { name: message.payload.name }]);
                break;
            case 'REMOVE_INGREDIENT':
                setSelectedIngredients(selectedIngredients.filter((_: Ingredient, index: number) => index !== message.payload.index));
                break;
        }
    };

    // Use ViewMachine directly for the view instance
    const viewMachine = new ViewMachine({
        machineId: 'burgerBuilder',
        states: ['INITIAL', 'BUILDING', 'SELECT_INGREDIENT', 'ADD_INGREDIENT', 'DONE', 'ADD_TO_CART'],
        render: burgerBuilderView({} as any).viewConfig.render,
        container: burgerBuilderView({} as any).viewConfig.container
    }, {
        getViewModel: () => ({ currentState: selectedIngredients.length === 0 ? 'INITIAL' : 'BUILDING', transitions: [], logEntries: [], isStable: true })
    } as any);

    return burgerBuilderView(viewMachine).render(selectedIngredients);
}; 