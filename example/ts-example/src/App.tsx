import React, { useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BurgerBuilder } from './components/BurgerBuilder';
import { CartPage } from './pages/CartPage';
import { CartItem, FishBurgerData } from './types/TastyFishBurger';
import { apolloClient } from './core/apolloClient';
import { TastyFishBurgerView } from './components/ViewMachineComponent';
import { TastyFishBurgerMachine } from './machines/TastyFishBurgerMachine';

const burgerMachine = new TastyFishBurgerMachine();

export function App() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const handleAddToCart = (burger: FishBurgerData) => {
        setCartItems(prev => {
            const existingItem = prev.find(item => 
                item.burger.ingredients.join(',') === burger.ingredients.join(',')
            );

            if (existingItem) {
                return prev.map(item =>
                    item.id === existingItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [...prev, { id: burger.orderId, burger, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) {
            handleRemoveItem(id);
            return;
        }

        setCartItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        );
    };

    const handleRemoveItem = (id: string) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <ApolloProvider client={apolloClient}>
            <Router>
                <div className="min-h-screen bg-gray-100">
                    <nav className="bg-white shadow-md">
                        <div className="max-w-7xl mx-auto px-4">
                            <div className="flex justify-between h-16">
                                <div className="flex items-center">
                                    <Link to="/" className="text-xl font-bold text-gray-800">
                                        Tasty Fish Burger 🐟
                                    </Link>
                                </div>
                                <div className="flex items-center">
                                    <Link
                                        to="/cart"
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </nav>

                    <main className="py-8">
                        <Routes>
                            <Route
                                path="/"
                                element={<TastyFishBurgerView stateMachine={burgerMachine} />}
                            />
                            <Route
                                path="/cart"
                                element={
                                    <CartPage
                                        cartItems={cartItems}
                                        onUpdateQuantity={handleUpdateQuantity}
                                        onRemoveItem={handleRemoveItem}
                                    />
                                }
                            />
                            <Route
                                path="/success"
                                element={
                                    <div className="text-center py-16">
                                        <h1 className="text-4xl font-bold mb-4">Enjoy Your Meal! 🍽️</h1>
                                        <p className="text-xl text-gray-600 mb-8">
                                            Your tasty fish burgers are being prepared with love!
                                        </p>
                                        <Link
                                            to="/"
                                            className="px-6 py-3 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600"
                                        >
                                            Order More
                                        </Link>
                                    </div>
                                }
                            />
                        </Routes>
                    </main>
                </div>
            </Router>
        </ApolloProvider>
    );
} 