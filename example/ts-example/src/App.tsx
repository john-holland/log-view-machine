import React, { ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GenericEditor from './components/GenericEditor';
import FishBurgerWithTracing from './components/FishBurgerWithTracing';
import TomeConnectionExample from './components/TomeConnectionExample';
import './index.css';

const App: React.FC = () => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('App-level error:', error, errorInfo);
    // You could send this to your error tracking service
    // or log it to your TomeConnector for monitoring
  };

  return (
    <Router>
      <div className="app">
        <nav className="app-nav">
          <div className="nav-container">
            <h1>🔗 TomeConnector Studio</h1>
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
              <GenericEditor 
                title="Welcome to TomeConnector Studio"
                description="A powerful platform for building connected, observable applications with state machines and distributed tracing."
                onError={handleError}
              >
                <div className="home-page">
                  <div className="hero-section">
                    <h2>🚀 Build Connected Applications</h2>
                    <p>Leverage the power of TomeConnector, ViewStateMachine, and OpenTelemetry to create robust, observable systems.</p>
                  </div>
                  
                  <div className="feature-grid">
                    <div className="feature-card">
                      <h3>🔍 Tracing Demo</h3>
                      <p>Fish Burger with tracing, RobotCopy integration, and Unleash feature toggles</p>
                      <Link to="/tracing" className="feature-link">View Demo</Link>
                    </div>
                    
                    <div className="feature-card">
                      <h3>🔄 Tome Connections</h3>
                      <p>Dynamic connections between ViewStateMachines with bidirectional state and event flow</p>
                      <Link to="/connections" className="feature-link">View Demo</Link>
                    </div>
                    
                    <div className="feature-card">
                      <h3>📊 Observability</h3>
                      <p>Monitor performance with OpenTelemetry, Prometheus, and Grafana</p>
                      <span className="feature-status">✅ Available</span>
                    </div>
                    
                    <div className="feature-card">
                      <h3>🐳 Container Ready</h3>
                      <p>Deploy anywhere with Docker and Kubernetes support</p>
                      <span className="feature-status">✅ Ready</span>
                    </div>
                  </div>
                  
                  <div className="status-section">
                    <h3>System Status</h3>
                    <div className="status-grid">
                      <div className="status-item">
                        <span className="status-label">ViewStateMachine:</span>
                        <span className="status-value success">🟢 Active</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">RobotCopy:</span>
                        <span className="status-value success">🟢 Integrated</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Error Boundaries:</span>
                        <span className="status-value success">🟢 Protecting</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GenericEditor>
            } />
            
            <Route path="/tracing" element={
              <GenericEditor 
                title="Tracing Demo"
                description="Experience the power of distributed tracing with Fish Burger creation and RobotCopy integration."
                onError={handleError}
              >
                <FishBurgerWithTracing />
              </GenericEditor>
            } />
            
            <Route path="/connections" element={
              <GenericEditor 
                title="Tome Connections Demo"
                description="Explore dynamic connections between ViewStateMachines with bidirectional state and event flow."
                onError={handleError}
              >
                <TomeConnectionExample />
              </GenericEditor>
            } />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>🔗 TomeConnector Studio - Powered by ViewStateMachine & OpenTelemetry</p>
        </footer>
      </div>
    </Router>
  );
};

export default App; 