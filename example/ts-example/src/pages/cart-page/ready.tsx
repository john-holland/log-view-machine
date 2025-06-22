import { subView } from "../../core/ViewMachine";
import { CartItem } from "../../types/TastyFishBurger";

export const view = subView(({ model, state, transition, sendMessage }) => {
    return (
        <>
            <div className="space-y-4">
                {(model as CartItem[]).map((item: CartItem) => (
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
                                    onClick={() => sendMessage({ type: 'updateQuantity', payload: { id: item.id, quantity: item.quantity - 1 } })}
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                    onClick={() => sendMessage({ type: 'updateQuantity', payload: { id: item.id, quantity: item.quantity + 1 } })}
                                    className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={() => sendMessage({ type: 'removeItem', payload: { id: item.id } })}
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
                    onClick={() => sendMessage({ type: 'ANOTHER' })}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                    Build More
                </button>
                <button
                    onClick={() => sendMessage({ type: 'EAT' })}
                    className="px-6 py-3 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transform hover:scale-105 transition-transform"
                >
                    Eat! 🍔
                </button>
            </div>
        </>
    );
});