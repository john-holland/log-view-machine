import * as React from 'react';
import { useState } from 'react';
import { CartItem, FishBurgerData, Log, ViewModel } from '../types/TastyFishBurger';
import { BaseStateMachine, StateDefinition, StateHandler } from '../core/StateMachine';
import * as mori from 'mori';

interface BurgerBuilderProps {
    onAddToCart: (burger: FishBurgerData) => void;
}



class BurgerBuilderView {
    ViewMachine(view, modelMachine) {
        modelMachine.loadForView(view)
        return {
            "base":View(, (model: CartItem[]) => {
            },
            "select"
        }
    }
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
] as const;

type Ingredient = typeof AVAILABLE_INGREDIENTS[number];

export class BurgerBuilderMachine extends BaseStateMachine {
    constructor() {
        super();
        this.addLogEntry('INFO', 'BurgerBuilderMachine initialized');
    }

    protected states(): [StateDefinition, StateHandler] {
        return [{
            "INITIAL": {
                "BUILDING": {}
            },
            "BUILDING": {
                "SELECT_INGREDIENT": {},
                "ADD_INGREDIENT": {},
                "DONE": {}
            },
            "DONE": {
                "ADD_TO_CART": {}
            },
            "ADD_TO_CART": {
                "ANOTHER": {},
                "CHECKOUT": {}
            }
        }, {
            "INITIAL": (model, transition) => {
                return Log(model, this.transition("BUILDING"));
            },
            "BUILDING": (model, transition) => {
                return Log(model, this.transition("SELECT_INGREDIENT"));
            },
            "SELECT_INGREDIENT": (model, transition) => {
                return Log(model, this.transition("ADD_INGREDIENT"));
            },
            "ADD_INGREDIENT": (model, transition) => {
                return Log(model, this.transition("BUILDING"));
            },
            "DONE": (model, transition) => {
                return Log(model, this.transition("ADD_TO_CART"));
            },
            "ADD_TO_CART": (model, transition) => {
                if (model.wantsAnother) {
                    return this.transition("ANOTHER");
                }
                return this.transition("CHECKOUT");
            }
        }];
    }

    protected transition(to: string) {
        const viewModel = this.getViewModel();
        const from = viewModel.currentState;
        this.addTransition(from, to);
        return { from, to, timestamp: new Date().toISOString() };
    }

    public addIngredient(ingredient: Ingredient) {
        this.addLogEntry('INFO', `Adding ingredient: ${ingredient}`);
        this.transition("ADD_INGREDIENT");
    }

    public finishBuilding() {
        this.addLogEntry('INFO', 'Finished building burger');
        this.transition("DONE");
    }
}

export const BurgerBuilder: React.FC<BurgerBuilderProps> = ({ onAddToCart }: BurgerBuilderProps) => {
    const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
    const [machine] = useState(() => new BurgerBuilderMachine());

    const toggleIngredient = (ingredient: Ingredient) => {
        setSelectedIngredients((prev: Ingredient[]) => {
            const newIngredients = prev.includes(ingredient)
                ? prev.filter((i: Ingredient) => i !== ingredient)
                : [...prev, ingredient];
            machine.addIngredient(ingredient);
            return newIngredients;
        });
    };

    const handleBuildBurger = () => {
        if (selectedIngredients.length === 0) return;

        const newBurger: FishBurgerData = {
            orderId: `order-${Date.now()}`,
            ingredients: selectedIngredients,
            cookingTime: 0,
            temperature: 0,
            currentState: 'INITIAL',
            transitions: [],
            logEntries: []
        };

        machine.finishBuilding();
        onAddToCart(newBurger);
        setSelectedIngredients([]);
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
            <h2 className="text-2xl font-bold mb-4">Build Your Tasty Fish Burger!</h2>
            
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Select Ingredients:</h3>
                <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_INGREDIENTS.map((ingredient: Ingredient) => (
                        <button
                            key={ingredient}
                            onClick={() => toggleIngredient(ingredient)}
                            className={`p-2 rounded ${
                                selectedIngredients.includes(ingredient)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                            type="button"
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
                type="button"
            >
                Add to Cart
            </button>
        </div>
    );
}; 