import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BurgerCreationUI } from './components/BurgerCreationUI';
import { SimpleFishBurgerView } from './components/SimpleFishBurgerView';
import MetricsDashboard from './components/MetricsDashboard';
import AdminDashboard from './components/AdminDashboard';

export function App() {
    const [showAdmin, setShowAdmin] = useState(false);

    return (
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
                            <div className="flex items-center space-x-4">
                                <Link to="/" className="text-gray-600 hover:text-gray-800">
                                    🍔 Burger Builder
                                </Link>
                                <Link to="/simple" className="text-gray-600 hover:text-gray-800">
                                    🔧 Simple API View
                                </Link>
                                <Link to="/metrics" className="text-gray-600 hover:text-gray-800">
                                    📊 Metrics Dashboard
                                </Link>
                                <button 
                                    onClick={() => setShowAdmin(true)}
                                    className="text-gray-600 hover:text-gray-800"
                                >
                                    🛡️ Admin
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="py-8">
                    <Routes>
                        <Route path="/" element={<BurgerCreationUI />} />
                        <Route path="/simple" element={<SimpleFishBurgerView />} />
                        <Route path="/metrics" element={<MetricsDashboard />} />
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

                {showAdmin && (
                    <AdminDashboard isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
                )}
            </div>
        </Router>
    );
} 