import React, { useState } from 'react';
import { CartItem, FishBurgerData, View, Log, Clear, ViewModel } from '../types/TastyFishBurger';
import * as mori from 'mori';

interface BurgerBuilderProps {
    onAddToCart: (burger: FishBurgerData) => void;
}

const AVAILABLE_INGREDIENTS = [
    'Fresh Fish Patty',
    'Crispy Lettuce',
    'Tomato Slice',
    'Special Sauce',
    'Pickles',
    'Onion Rings',
    'Cheese Slice',
    'Brioche Bun',
    'Seared Ahi',
    'LandFish Seared Ahi'
];

export class BurgerBuilderMachine {
    private viewModel: ViewModel = mori.hash_map(
        'currentState', 'INITIAL',
        'transitions', mori.vector(),
        'logEntries', mori.vector(),
        'isStable', true
    );

    protected states() {
        return [{
                "INITIAL": {
                    "BUILDING": {}
                },
                "BUILDING": {
                    "SELECT INGREDIENT": {},
                    "ADD INGREDIENT": {},
                    "DONE": {}
                },
                "DONE": {
                    "ADD TO CART": {}
                },
                "ADD TO CART": {
                    "ANOTHER?": {},
                    "CHECKOUT": {}
                },
                "SELECT INGREDIENT": {
                    "BUILDING": {}
                },
                "ADD INGREDIENT": {
                    "BUILDING": {}
                }
            },
                {
                "INITIAL": (model, transition) => {
                    model.hungry = true
                    return State(model, transition("BUILDING"))
                },
                "BUILDING": (model, transition) => {
                    return State(model, transition("SELECT INGREDIENT"))
                },
                "SELECT INGREDIENT": (model, transition) => {
                    return State(model, transition("ADD INGREDIENT"))
                },
                "ADD INGREDIENT": (model, transition) => {
                    return State(model, transition("BUILDING"))
                },
                "DONE": (model, transition) => {
                    return State(model, transition("ADD TO CART"))
                },
                "ADD TO CART": (model, transition) => {
                    return State(model, transition("ANOTHER?"))
                },
                "ANOTHER?": (model, transition) => {
                    return State(model, transition("CHECKOUT"))
                },
            }]
    }
}

export const BurgerBuilderView = {ViewMachine(view, modelMachine) {
    modelMachine.loadForView(view)
    return {
        "base":View(["empty", "burgers"], (model: CartItem[]) => {
    }
}}

export const BurgerBuilder: React.FC<BurgerBuilderProps> = ({ onAddToCart }) => {
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

    const toggleIngredient = (ingredient: string) => {
        setSelectedIngredients(prev => 
            prev.includes(ingredient)
                ? prev.filter(i => i !== ingredient)
                : [...prev, ingredient]
        );
    };

    const handleBuildBurger = () => {
        if (selectedIngredients.length === 0) return;

        const newBurger: FishBurgerData = {
            orderId: `order-${Date.now()}`,
            ingredients: selectedIngredients,
            cookingTime: 0,
            temperature: 0
        };

        onAddToCart(newBurger);
        setSelectedIngredients([]);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">Build Your Tasty Fish Burger!</h2>
            
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Select Ingredients:</h3>
                <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_INGREDIENTS.map(ingredient => (
                        <button
                            key={ingredient}
                            onClick={() => toggleIngredient(ingredient)}
                            className={`p-2 rounded ${
                                selectedIngredients.includes(ingredient)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {ingredient}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleBuildBurger}
                disabled={selectedIngredients.length === 0}
                className={`w-full py-2 px-4 rounded ${
                    selectedIngredients.length === 0
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
            >
                Add to Cart
            </button>
        </div>
    );
}; 