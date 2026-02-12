/**
 * Fish Burger UI Component
 * 
 * React component that integrates with Fish Burger Tome backend
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createFishBurgerTome } from './fish-burger-integration.js';

/**
 * Fish Burger UI Component
 */
export function FishBurgerUI({ config = {} }) {
  const [tome, setTome] = useState(null);
  const [state, setState] = useState({
    orderId: null,
    ingredients: [],
    cookingTime: 0,
    temperature: 0,
    status: 'idle',
    backend: 'generic-editor',
    traceId: null,
    messageHistory: [],
    lastSaved: null,
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  // Initialize Tome
  useEffect(() => {
    const initializeTome = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const fishBurgerTome = createFishBurgerTome({
          genericEditorUrl: config.genericEditorUrl || 'http://localhost:3000',
          fishBurgerBackendUrl: config.fishBurgerBackendUrl || 'http://localhost:3001',
          enablePersistence: config.enablePersistence !== false,
          enableTracing: config.enableTracing !== false,
          autoSaveInterval: config.autoSaveInterval || 5000
        });

        // Set up event listeners
        fishBurgerTome.on('initialized', ({ state }) => {
          setState(state);
          addLog('info', 'Fish Burger Tome initialized', state);
        });

        fishBurgerTome.on('cookingStarted', ({ state, result }) => {
          setState(state);
          addLog('success', 'Cooking started', { state, result });
        });

        fishBurgerTome.on('progressUpdated', ({ state, result }) => {
          setState(state);
          addLog('info', 'Progress updated', { state, result });
        });

        fishBurgerTome.on('cookingCompleted', ({ state, result }) => {
          setState(state);
          addLog('success', 'Cooking completed', { state, result });
        });

        fishBurgerTome.on('cookingError', ({ error, state }) => {
          setState(state);
          setError(error);
          addLog('error', 'Cooking error', { error, state });
        });

        fishBurgerTome.on('progressError', ({ error, state }) => {
          setState(state);
          setError(error);
          addLog('error', 'Progress error', { error, state });
        });

        fishBurgerTome.on('completionError', ({ error, state }) => {
          setState(state);
          setError(error);
          addLog('error', 'Completion error', { error, state });
        });

        fishBurgerTome.on('stateReset', ({ state }) => {
          setState(state);
          addLog('info', 'State reset', state);
        });

        // Initialize the Tome
        await fishBurgerTome.initialize();
        setTome(fishBurgerTome);
        
      } catch (err) {
        setError(err.message);
        addLog('error', 'Failed to initialize Tome', { error: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    initializeTome();

    // Cleanup on unmount
    return () => {
      if (tome) {
        tome.cleanup();
      }
    };
  }, []);

  // Add log entry
  const addLog = useCallback((level, message, data = {}) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs
  }, []);

  // Start cooking
  const handleStartCooking = useCallback(async () => {
    if (!tome) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const orderData = {
        orderId: `order-${Date.now()}`,
        ingredients: ['fish-patty', 'bun', 'lettuce', 'tomato', 'cheese'],
        traceId: state.traceId
      };
      
      await tome.startCooking(orderData);
      
    } catch (err) {
      setError(err.message);
      addLog('error', 'Failed to start cooking', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [tome, state.traceId, addLog]);

  // Update progress
  const handleUpdateProgress = useCallback(async () => {
    if (!tome) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const progressData = {
        timeIncrement: 1,
        temperature: Math.min(state.temperature + 10, 200)
      };
      
      await tome.updateProgress(progressData);
      
    } catch (err) {
      setError(err.message);
      addLog('error', 'Failed to update progress', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [tome, state.temperature, addLog]);

  // Complete cooking
  const handleCompleteCooking = useCallback(async () => {
    if (!tome) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const completionData = {
        finalCookingTime: state.cookingTime,
        finalTemperature: state.temperature
      };
      
      await tome.completeCooking(completionData);
      
    } catch (err) {
      setError(err.message);
      addLog('error', 'Failed to complete cooking', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [tome, state.cookingTime, state.temperature, addLog]);

  // Reset state
  const handleReset = useCallback(async () => {
    if (!tome) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await tome.reset();
      
    } catch (err) {
      setError(err.message);
      addLog('error', 'Failed to reset state', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [tome, addLog]);

  // Get trace
  const handleGetTrace = useCallback(async () => {
    if (!tome) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const trace = await tome.getTrace();
      addLog('info', 'Trace retrieved', trace);
      
    } catch (err) {
      setError(err.message);
      addLog('error', 'Failed to get trace', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [tome, addLog]);

  // Get message history
  const handleGetMessageHistory = useCallback(async () => {
    if (!tome) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const history = await tome.getMessageHistory();
      addLog('info', 'Message history retrieved', history);
      
    } catch (err) {
      setError(err.message);
      addLog('error', 'Failed to get message history', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [tome, addLog]);

  // Render idle state
  const renderIdleState = () => (
    <div className="fish-burger-idle">
      <h3>🐟 Fish Burger Machine - Idle</h3>
      <div className="status-info">
        <p><strong>Backend:</strong> {state.backend}</p>
        <p><strong>Trace ID:</strong> {state.traceId || 'None'}</p>
        <p><strong>Connection:</strong> {state.isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
      </div>
      <button 
        onClick={handleStartCooking}
        disabled={isLoading || !state.isConnected}
        className="btn btn-primary"
      >
        {isLoading ? 'Starting...' : '🍳 Start Cooking'}
      </button>
    </div>
  );

  // Render processing state
  const renderProcessingState = () => (
    <div className="fish-burger-processing">
      <h3>🍳 Fish Burger Machine - Processing</h3>
      <div className="cooking-info">
        <p><strong>Order ID:</strong> {state.orderId}</p>
        <p><strong>Cooking Time:</strong> {state.cookingTime}s</p>
        <p><strong>Temperature:</strong> {state.temperature}°C</p>
        <p><strong>Status:</strong> {state.status}</p>
      </div>
      <div className="ingredients">
        <h4>Ingredients:</h4>
        <ul>
          {state.ingredients.map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
        </ul>
      </div>
      <div className="controls">
        <button 
          onClick={handleUpdateProgress}
          disabled={isLoading}
          className="btn btn-secondary"
        >
          {isLoading ? 'Updating...' : '📈 Update Progress'}
        </button>
        <button 
          onClick={handleCompleteCooking}
          disabled={isLoading}
          className="btn btn-success"
        >
          {isLoading ? 'Completing...' : '✅ Complete Cooking'}
        </button>
      </div>
    </div>
  );

  // Render completed state
  const renderCompletedState = () => (
    <div className="fish-burger-completed">
      <h3>✅ Fish Burger Machine - Completed</h3>
      <div className="completion-info">
        <p><strong>Order ID:</strong> {state.orderId}</p>
        <p><strong>Final Cooking Time:</strong> {state.cookingTime}s</p>
        <p><strong>Final Temperature:</strong> {state.temperature}°C</p>
        <p><strong>Status:</strong> {state.status}</p>
      </div>
      <button 
        onClick={handleReset}
        disabled={isLoading}
        className="btn btn-warning"
      >
        {isLoading ? 'Resetting...' : '🔄 Reset'}
      </button>
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <div className="fish-burger-error">
      <h3>❌ Fish Burger Machine - Error</h3>
      <div className="error-info">
        <p><strong>Status:</strong> {state.status}</p>
        {error && <p><strong>Error:</strong> {error}</p>}
      </div>
      <div className="controls">
        <button 
          onClick={handleReset}
          disabled={isLoading}
          className="btn btn-warning"
        >
          {isLoading ? 'Resetting...' : '🔄 Reset'}
        </button>
      </div>
    </div>
  );

  // Render current state
  const renderCurrentState = () => {
    switch (state.status) {
      case 'idle':
        return renderIdleState();
      case 'processing':
        return renderProcessingState();
      case 'completed':
        return renderCompletedState();
      case 'error':
        return renderErrorState();
      default:
        return renderIdleState();
    }
  };

  return (
    <div className="fish-burger-ui">
      <div className="header">
        <h2>🐟 Fish Burger with Tome Integration</h2>
        <p>Connected to Generic Editor backend via RobotCopy proxy machines</p>
      </div>

      {/* Main content */}
      <div className="main-content">
        {renderCurrentState()}
      </div>

      {/* Debug controls */}
      <div className="debug-controls">
        <h4>🔧 Debug Controls</h4>
        <div className="debug-buttons">
          <button 
            onClick={handleGetTrace}
            disabled={isLoading || !state.traceId}
            className="btn btn-info"
          >
            📊 Get Trace
          </button>
          <button 
            onClick={handleGetMessageHistory}
            disabled={isLoading}
            className="btn btn-info"
          >
            📝 Get Message History
          </button>
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="logs-section">
          <h4>📋 Logs</h4>
          <div className="logs-container">
            {logs.map((log) => (
              <div key={log.id} className={`log-entry log-${log.level}`}>
                <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="log-level">[{log.level.toUpperCase()}]</span>
                <span className="log-message">{log.message}</span>
                {log.data && Object.keys(log.data).length > 0 && (
                  <details className="log-details">
                    <summary>Details</summary>
                    <pre>{JSON.stringify(log.data, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .fish-burger-ui {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 10px;
        }

        .header h2 {
          margin: 0 0 10px 0;
          font-size: 2em;
        }

        .main-content {
          margin-bottom: 30px;
        }

        .fish-burger-idle,
        .fish-burger-processing,
        .fish-burger-completed,
        .fish-burger-error {
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .fish-burger-idle {
          background: #e3f2fd;
          border: 2px solid #2196f3;
        }

        .fish-burger-processing {
          background: #fff3e0;
          border: 2px solid #ff9800;
        }

        .fish-burger-completed {
          background: #e8f5e8;
          border: 2px solid #4caf50;
        }

        .fish-burger-error {
          background: #ffebee;
          border: 2px solid #f44336;
        }

        .status-info,
        .cooking-info,
        .completion-info,
        .error-info {
          margin: 15px 0;
          padding: 15px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 5px;
        }

        .ingredients {
          margin: 15px 0;
        }

        .ingredients ul {
          list-style: none;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ingredients li {
          background: #f0f0f0;
          padding: 5px 10px;
          border-radius: 15px;
          font-size: 0.9em;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 15px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          transition: all 0.3s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #2196f3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1976d2;
        }

        .btn-secondary {
          background: #ff9800;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #f57c00;
        }

        .btn-success {
          background: #4caf50;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #388e3c;
        }

        .btn-warning {
          background: #ff9800;
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background: #f57c00;
        }

        .btn-info {
          background: #00bcd4;
          color: white;
        }

        .btn-info:hover:not(:disabled) {
          background: #0097a7;
        }

        .debug-controls {
          margin: 20px 0;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 5px;
        }

        .debug-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .logs-section {
          margin-top: 30px;
        }

        .logs-container {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 5px;
          background: #f9f9f9;
        }

        .log-entry {
          padding: 10px;
          border-bottom: 1px solid #eee;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }

        .log-entry:last-child {
          border-bottom: none;
        }

        .log-timestamp {
          color: #666;
          margin-right: 10px;
        }

        .log-level {
          font-weight: bold;
          margin-right: 10px;
        }

        .log-info .log-level {
          color: #2196f3;
        }

        .log-success .log-level {
          color: #4caf50;
        }

        .log-error .log-level {
          color: #f44336;
        }

        .log-message {
          color: #333;
        }

        .log-details {
          margin-top: 5px;
        }

        .log-details summary {
          cursor: pointer;
          color: #666;
          font-size: 0.8em;
        }

        .log-details pre {
          background: #f0f0f0;
          padding: 5px;
          border-radius: 3px;
          font-size: 0.8em;
          overflow-x: auto;
        }

        @media (max-width: 600px) {
          .fish-burger-ui {
            padding: 10px;
          }

          .controls {
            flex-direction: column;
          }

          .debug-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default FishBurgerUI; 