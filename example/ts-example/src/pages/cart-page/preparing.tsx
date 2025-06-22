import { subView } from "../../core/ViewMachine";

export const view = subView(({ model, state, transition, sendMessage }) => {
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
    });