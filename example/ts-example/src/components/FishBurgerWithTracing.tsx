import React, { useState, useEffect } from 'react';
import { createViewStateMachine } from 'log-view-machine';
import { createFishBurgerRobotCopy } from '../fish-burger-robotcopy';

// Fish Burger State Machine with tracing
const fishBurgerMachine = createViewStateMachine({
  machineId: 'fish-burger-with-tracing',
  xstateConfig: {
    id: 'fish-burger-with-tracing',
    initial: 'idle',
    context: {
      orderId: null as string | null,
      ingredients: [] as string[],
      cookingTime: 0,
      temperature: 0,
      backend: 'node' as 'kotlin' | 'node',
      traceId: null as string | null,
      messageHistory: [] as any[],
    },
    states: {
      idle: {
        on: {
          START_COOKING: {
            target: 'processing',
            actions: 'logStartCooking',
          },
        },
      },
      processing: {
        on: {
          UPDATE_PROGRESS: {
            target: 'processing',
            actions: 'logProgress',
          },
          COMPLETE_COOKING: {
            target: 'completed',
            actions: 'logCompletion',
          },
          ERROR: {
            target: 'error',
            actions: 'logError',
          },
        },
      },
      completed: {
        on: {
          RESET: {
            target: 'idle',
            actions: 'logReset',
          },
        },
      },
      error: {
        on: {
          RETRY: {
            target: 'processing',
            actions: 'logRetry',
          },
          RESET: {
            target: 'idle',
            actions: 'logReset',
          },
        },
      },
    },
  },
  logStates: {
    idle: async ({ state, model, log, view, transition }) => {
      await log('Fish burger machine is idle', { 
        orderId: model.orderId,
        backend: model.backend,
        traceId: model.traceId 
      });
      
      view(
        <div className="idle-state">
          <h3>Fish Burger Machine - Idle</h3>
          <p>Backend: {model.backend}</p>
          <p>Trace ID: {model.traceId || 'None'}</p>
          <button onClick={() => transition('START_COOKING')}>
            Start Cooking
          </button>
        </div>
      );
    },
    
    processing: async ({ state, model, log, view, transition }) => {
      await log('Fish burger cooking in progress', {
        orderId: model.orderId,
        cookingTime: model.cookingTime,
        temperature: model.temperature,
        backend: model.backend,
        traceId: model.traceId
      });
      
      view(
        <div className="processing-state">
          <h3>Fish Burger Machine - Processing</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Cooking Time: {model.cookingTime}s</p>
          <p>Temperature: {model.temperature}°F</p>
          <p>Backend: {model.backend}</p>
          <p>Trace ID: {model.traceId}</p>
          <button onClick={() => transition('COMPLETE_COOKING')}>
            Complete Cooking
          </button>
          <button onClick={() => transition('ERROR')}>
            Simulate Error
          </button>
        </div>
      );
    },
    
    completed: async ({ state, model, log, view, transition }) => {
      await log('Fish burger cooking completed', {
        orderId: model.orderId,
        backend: model.backend,
        traceId: model.traceId
      });
      
      view(
        <div className="completed-state">
          <h3>Fish Burger Machine - Completed</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Backend: {model.backend}</p>
          <p>Trace ID: {model.traceId}</p>
          <button onClick={() => transition('RESET')}>
            Reset Machine
          </button>
        </div>
      );
    },
    
    error: async ({ state, model, log, view, transition }) => {
      await log('Error occurred while cooking fish burger', {
        orderId: model.orderId,
        backend: model.backend,
        traceId: model.traceId
      });
      
      view(
        <div className="error-state">
          <h3>Fish Burger Machine - Error</h3>
          <p>Order ID: {model.orderId}</p>
          <p>Backend: {model.backend}</p>
          <p>Trace ID: {model.traceId}</p>
          <button onClick={() => transition('RETRY')}>
            Retry
          </button>
          <button onClick={() => transition('RESET')}>
            Reset
          </button>
        </div>
      );
    },
  },
});

const FishBurgerWithTracing: React.FC = () => {
  const [robotCopy] = useState(() => createFishBurgerRobotCopy());
  const [backendType, setBackendType] = useState<'kotlin' | 'node'>('node');
  const [tracingEnabled, setTracingEnabled] = useState(true);
  const [currentTrace, setCurrentTrace] = useState<any>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  const {
    state,
    context,
    send,
    logEntries,
    viewStack,
    log,
    view,
    clear,
    transition,
  } = fishBurgerMachine.useViewStateMachine({
    orderId: null,
    ingredients: [],
    cookingTime: 0,
    temperature: 0,
    backend: 'node',
    traceId: null,
    messageHistory: [],
  });

  // Initialize RobotCopy integration
  useEffect(() => {
    robotCopy.integrateWithViewStateMachine(fishBurgerMachine);
  }, [robotCopy]);

  // Update backend type based on Unleash toggle
  useEffect(() => {
    const updateBackendType = async () => {
      const backend = await robotCopy.getBackendType();
      setBackendType(backend);
    };
    updateBackendType();
  }, [robotCopy]);

  // Update tracing enabled based on Unleash toggle
  useEffect(() => {
    const updateTracingEnabled = async () => {
      const enabled = await robotCopy.isEnabled('enable-tracing');
      setTracingEnabled(enabled);
    };
    updateTracingEnabled();
  }, [robotCopy]);

  const handleStartCooking = async () => {
    const orderId = `ORDER-${Date.now()}`;
    const ingredients = ['fish', 'lettuce', 'tomato', 'bun'];
    
    try {
      const result = await robotCopy.startCooking(orderId, ingredients);
      console.log('Start cooking result:', result);
      
      // Update context with backend info
      send({
        type: 'START_COOKING',
        orderId,
        ingredients,
        backend: result.backend || backendType,
        traceId: result.traceId,
      });
    } catch (error) {
      console.error('Error starting cooking:', error);
      send({ type: 'ERROR', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleUpdateProgress = async () => {
    const cookingTime = Math.floor(Math.random() * 120) + 30;
    const temperature = 150 + Math.random() * 50;
    
    try {
      const result = await robotCopy.updateProgress(
        context.orderId || 'unknown',
        cookingTime,
        temperature
      );
      console.log('Update progress result:', result);
      
      send({
        type: 'UPDATE_PROGRESS',
        orderId: context.orderId,
        cookingTime,
        temperature,
        backend: result.backend || backendType,
        traceId: result.traceId,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      send({ type: 'ERROR', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleCompleteCooking = async () => {
    try {
      const result = await robotCopy.completeCooking(context.orderId || 'unknown');
      console.log('Complete cooking result:', result);
      
      send({
        type: 'COMPLETE_COOKING',
        orderId: context.orderId,
        backend: result.backend || backendType,
        traceId: result.traceId,
      });
    } catch (error) {
      console.error('Error completing cooking:', error);
      send({ type: 'ERROR', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleGetTrace = async () => {
    if (context.traceId) {
      try {
        const trace = await robotCopy.getTrace(context.traceId);
        setCurrentTrace(trace);
        console.log('Trace:', trace);
      } catch (error) {
        console.error('Error getting trace:', error);
      }
    }
  };

  const handleGetMessageHistory = () => {
    const history = robotCopy.getMessageHistory();
    setMessageHistory(history);
    console.log('Message history:', history);
  };

  return (
    <div className="fish-burger-with-tracing demo-container">
      <div className="demo-header header">
        <h2>Fish Burger with Tracing & Unleash</h2>
        <div className="status">
          <p>Backend: {backendType}</p>
          <p>Tracing: {tracingEnabled ? 'Enabled' : 'Disabled'}</p>
          <p>State: {state}</p>
          <p>Trace ID: {context.traceId || 'None'}</p>
        </div>
      </div>

      <div className="controls">
        <button onClick={handleStartCooking} disabled={state !== 'idle'}>
          Start Cooking
        </button>
        <button onClick={handleUpdateProgress} disabled={state !== 'processing'}>
          Update Progress
        </button>
        <button onClick={handleCompleteCooking} disabled={state !== 'processing'}>
          Complete Cooking
        </button>
        <button onClick={() => send({ type: 'RESET' })}>
          Reset Machine
        </button>
        <button onClick={handleGetTrace} disabled={!context.traceId}>
          Get Trace
        </button>
        <button onClick={handleGetMessageHistory}>
          Get Message History
        </button>
      </div>

      <div className="demo-content content">
        {/* Render current view */}
        {viewStack.length > 0 && (
          <div className="current-view">
            {viewStack[viewStack.length - 1]}
          </div>
        )}

        {/* Trace information */}
        {currentTrace && (
          <div className="trace-info">
            <h3>Current Trace</h3>
            <pre>{JSON.stringify(currentTrace, null, 2)}</pre>
          </div>
        )}

        {/* Message history */}
        {messageHistory.length > 0 && (
          <div className="message-history">
            <h3>Message History</h3>
            <div className="messages">
              {messageHistory.map((msg, index) => (
                <div key={index} className="message">
                  <strong>{msg.action}</strong> - {msg.timestamp}
                  <br />
                  Backend: {msg.backend} | Trace: {msg.traceId}
                  {msg.data && (
                    <pre>{JSON.stringify(msg.data, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log entries */}
        {logEntries.length > 0 && (
          <div className="log-entries">
            <h3>Log Entries</h3>
            <div className="logs">
              {logEntries.map((entry, index) => (
                <div key={index} className="log-entry">
                  <strong>[{entry.level}]</strong> {entry.message}
                  {entry.metadata && (
                    <pre>{JSON.stringify(entry.metadata, null, 2)}</pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .fish-burger-with-tracing {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .controls button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }

        .controls button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .current-view {
          grid-column: 1 / -1;
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
        }

        .trace-info,
        .message-history,
        .log-entries {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          max-height: 400px;
          overflow-y: auto;
        }

        .messages,
        .logs {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message,
        .log-entry {
          background: white;
          padding: 10px;
          border-radius: 4px;
          border-left: 4px solid #007bff;
        }

        pre {
          background: #f0f0f0;
          padding: 5px;
          border-radius: 4px;
          font-size: 12px;
          overflow-x: auto;
        }

        .idle-state,
        .processing-state,
        .completed-state,
        .error-state {
          text-align: center;
        }

        .idle-state button,
        .processing-state button,
        .completed-state button,
        .error-state button {
          margin: 5px;
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background: #007bff;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default FishBurgerWithTracing; 