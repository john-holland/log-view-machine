import React, { ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GenericEditor from './components/GenericEditor';
import TomeIntegration from './components/TomeIntegration';
import StructuralExample from './components/StructuralExample';
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
              <Link to="/tome-integration" className="nav-link">🔗 Tome Integration</Link>
              <Link to="/structural" className="nav-link">🏗️ Structural System</Link>
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
                      <h3>🔗 Tome Integration</h3>
                      <p>Connect state machines with RobotCopy message broker and distributed tracing</p>
                      <Link to="/tome-integration" className="feature-link">Explore Integration</Link>
                    </div>
                    
                    <div className="feature-card">
                      <h3>🏗️ Structural System</h3>
                      <p>Organize applications with routing, navigation, and component mapping</p>
                      <Link to="/structural" className="feature-link">View Structure</Link>
                    </div>
                    
                    <div className="feature-card">
                      <h3>📊 Observability</h3>
                      <p>Monitor performance with OpenTelemetry, Prometheus, and Grafana</p>
                      <span className="feature-status">✅ Running</span>
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
                        <span className="status-label">TomeConnector Server:</span>
                        <span className="status-value success">🟢 Running</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">OpenTelemetry:</span>
                        <span className="status-value success">🟢 Active</span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Metrics:</span>
                        <span className="status-value success">🟢 Collecting</span>
                      </div>
                    </div>
                  </div>
                </div>
              </GenericEditor>
            } />
            
            <Route path="/tome-integration" element={
              <GenericEditor 
                title="Tome Integration Demo"
                description="Experience the power of TomeConnector with RobotCopy message broker and distributed tracing."
                onError={handleError}
              >
                <TomeIntegration />
              </GenericEditor>
            } />
            
            <Route path="/structural" element={
              <GenericEditor 
                title="Structural System Demo"
                description="Explore the structural system for organizing applications with routing and navigation."
                onError={handleError}
              >
                <StructuralExample />
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