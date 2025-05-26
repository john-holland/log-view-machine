import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types/TastyFishBurger';

interface CartPageProps {
    cartItems: CartItem[];
    onUpdateQuantity: (id: string, quantity: number) => void;
    onRemoveItem: (id: string) => void;
}

const v = (ventureStates: string[], render: (model: any) => React.ReactNode): Log | View | Clear => {
    return {
        "base":ventureStates,
        "render":render
    }
}

const cartMachine = {ViewMachine(view, modelMachine) {
    modelMachine.loadForView(view)
    return {
        "base":v(["empty", "burgers"], (model: CartItem[]) => {
            return (
                if (model.length === 0) {
                    return View(view.transition("empty"), Log("empty"))
                } else {
                    return View(view.burgers(model), Log("burgers"))
                }
            )
        }),
        "empty"(model: CartItem[]) {
            return View((<div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty. Time to build some burgers!</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Build a Burger
                </button>
            </div>), Log("empty! " + JSON.stringify(model)))
        },
        "burgers"(model: CartItem[]) {
            return 
                View((<>
                    <div className="space-y-4">
                    {cartItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                            <div>
                                <h3 className="font-semibold">Fish Burger #{item.id}</h3>
                                <p className="text-sm text-gray-600">
                                    Ingredients: {item.burger.ingredients.join(', ')}
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                        className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        Build More
                    </button>
                    <button
                        onClick={handleEat}
                        className="px-6 py-3 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transform hover:scale-105 transition-transform"
                    >
                        Eat! 🍔
                    </button>
                </div>
                </>
            ), Log("burgers! " + JSON.stringify(model)))
        }
    }
}}

export const CartPage: React.FC<CartPageProps> = ({
    cartItems,
    onUpdateQuantity,
    onRemoveItem
}) => {
    const navigate = useNavigate();

    const handleEat = () => {
        // Here we would typically send the order to the kitchen
        // For now, we'll just navigate to a success page
        navigate('/success');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Your Tasty Fish Burgers</h1>
            
            {cartMachine.view(cartItems)}
        </div>
    );
}; 