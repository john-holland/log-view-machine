import { subView } from "../../core/ViewMachine";
import { CartItem } from "../../types/TastyFishBurger";
    
export const view = subView(({ model, state, transition, sendMessage }) => {
    if (model.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Your cart is empty. Time to build some burgers!</p>
                <button
                    onClick={() => sendMessage({ type: 'buildBurger' })}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Build a Burger
                </button>
            </div>
        );
    } else {
        return (
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
        );
    }
});
