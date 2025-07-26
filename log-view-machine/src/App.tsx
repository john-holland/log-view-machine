import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import XStateBurgerCreationUI from './components/XStateBurgerCreationUI';
import FluentBurgerCreationUI from './components/FluentBurgerCreationUI';
import AdvancedFluentDemo from './components/AdvancedFluentDemo';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-container">
            <h1>🍔 Fish Burger Examples</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">🏠 Home</Link>
              <Link to="/xstate" className="nav-link">⚡ XState Demo</Link>
              <Link to="/fluent" className="nav-link">✨ Fluent API</Link>
              <Link to="/advanced" className="nav-link">🤖 Advanced Demo</Link>
            </div>
          </div>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={
              <div className="home-page">
                <h2>Welcome to Fish Burger Examples</h2>
                <p>This demonstrates the ViewStateMachine package with different approaches:</p>
                <div className="demo-cards">
                  <div className="demo-card">
                    <h3>⚡ XState Demo</h3>
                    <p>Traditional XState implementation with manual state management</p>
                    <Link to="/xstate" className="demo-link">View Demo</Link>
                  </div>
                  <div className="demo-card">
                    <h3>✨ Fluent API</h3>
                    <p>ViewStateMachine with beautiful fluent API for state management</p>
                    <Link to="/fluent" className="demo-link">View Demo</Link>
                  </div>
                  <div className="demo-card">
                    <h3>🤖 Advanced Demo</h3>
                    <p>Sub-machines + RobotCopy message broker + ClientGenerator</p>
                    <Link to="/advanced" className="demo-link">View Demo</Link>
                  </div>
                </div>
              </div>
            } />
            <Route path="/xstate" element={<XStateBurgerCreationUI />} />
            <Route path="/fluent" element={<FluentBurgerCreationUI />} />
            <Route path="/advanced" element={<AdvancedFluentDemo />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>Powered by ViewStateMachine Package</p>
        </footer>
      </div>
    </Router>
  );
};

export default App; 