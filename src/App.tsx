import React, { ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import GenericEditor from './components/GenericEditor';
import WaveTabs from './components/WaveTabs';
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
            <p>Integrated wave-tabs system with Settings and About functionality</p>
          </div>
        </nav>

        <main className="app-main">
          <GenericEditor 
            title="TomeConnector Studio"
            description="A powerful platform for building connected, observable applications with state machines and distributed tracing."
            onError={handleError}
          >
            <WaveTabs 
              initialActiveTab="selector"
              onTabChange={(tabId) => console.log('Tab changed to:', tabId)}
            />
          </GenericEditor>
        </main>

        <footer className="app-footer">
          <p>🔗 TomeConnector Studio - Powered by ViewStateMachine & OpenTelemetry</p>
        </footer>
      </div>
    </Router>
  );
};

export default App; 