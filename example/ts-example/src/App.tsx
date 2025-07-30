import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FishBurgerWithTracing from './components/FishBurgerWithTracing';
import TomeConnectionExample from './components/TomeConnectionExample';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-container">
            <h1>🍔 ViewStateMachine Examples</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">🏠 Home</Link>
              <Link to="/tracing" className="nav-link">🔍 Tracing Demo</Link>
              <Link to="/connections" className="nav-link">🔄 Tome Connections</Link>
            </div>
          </div>
        </nav>

        <main className="app-main">
                    <Routes>
            <Route path="/" element={
              <div className="home-page">
                <h2>Welcome to ViewStateMachine Examples</h2>
                <p>This demonstrates the ViewStateMachine package with different approaches:</p>
                              <div className="demo-cards">
                <div className="demo-card">
                  <h3>🔍 Tracing Demo</h3>
                  <p>Fish Burger with tracing, RobotCopy integration, and Unleash feature toggles</p>
                  <Link to="/tracing" className="demo-link">View Demo</Link>
                </div>
                <div className="demo-card">
                  <h3>🔄 Tome Connections</h3>
                  <p>Dynamic connections between ViewStateMachines with bidirectional state and event flow</p>
                  <Link to="/connections" className="demo-link">View Demo</Link>
                </div>
              </div>
              </div>
            } />
            <Route path="/tracing" element={<FishBurgerWithTracing />} />
            <Route path="/connections" element={<TomeConnectionExample />} />
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