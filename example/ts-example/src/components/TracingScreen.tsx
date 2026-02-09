import React, { useState, useEffect } from 'react';
import type { TomeInstance } from 'log-view-machine';
import { useRobotCopy } from '../context/RobotCopyContext';

const initialModel = {
  orderId: null as string | null,
  ingredients: [] as string[],
  cookingTime: 0,
  temperature: 0,
  backend: 'node' as 'kotlin' | 'node',
  traceId: null as string | null,
  messageHistory: [] as any[],
};

interface TracingScreenProps {
  tome: TomeInstance;
}

const TracingScreen: React.FC<TracingScreenProps> = ({ tome }) => {
  const robotCopy = useRobotCopy();
  const [backendType, setBackendType] = useState<'kotlin' | 'node'>('node');
  const [tracingEnabled, setTracingEnabled] = useState(true);
  const [currentTrace, setCurrentTrace] = useState<any>(null);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);

  const machine = tome.getMachine('fishBurger');
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
  } = machine.useViewStateMachine(initialModel);

  useEffect(() => {
    robotCopy.integrateWithViewStateMachine(machine);
  }, [robotCopy, machine]);

  useEffect(() => {
    const updateBackendType = async () => {
      const backend = await robotCopy.getBackendType();
      setBackendType(backend);
    };
    updateBackendType();
  }, [robotCopy]);

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
      send({
        type: 'START_COOKING',
        orderId,
        ingredients,
        backend: result.backend || backendType,
        traceId: result.traceId,
      });
    } catch (error) {
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
      send({
        type: 'UPDATE_PROGRESS',
        orderId: context.orderId,
        cookingTime,
        temperature,
        backend: result.backend || backendType,
        traceId: result.traceId,
      });
    } catch (error) {
      send({ type: 'ERROR', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleCompleteCooking = async () => {
    try {
      const result = await robotCopy.completeCooking(context.orderId || 'unknown');
      send({
        type: 'COMPLETE_COOKING',
        orderId: context.orderId,
        backend: result.backend || backendType,
        traceId: result.traceId,
      });
    } catch (error) {
      send({ type: 'ERROR', error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleGetTrace = async () => {
    if (context.traceId) {
      try {
        const trace = await robotCopy.getTrace(context.traceId);
        setCurrentTrace(trace);
      } catch (error) {
        console.error('Error getting trace:', error);
      }
    }
  };

  const handleGetMessageHistory = () => {
    const history = robotCopy.getMessageHistory();
    setMessageHistory(history);
  };

  return (
    <div className="fish-burger-with-tracing demo-container" key={tome.getRenderKey()}>
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
        <button onClick={() => send({ type: 'RESET' })}>Reset Machine</button>
        <button onClick={handleGetTrace} disabled={!context.traceId}>
          Get Trace
        </button>
        <button onClick={handleGetMessageHistory}>Get Message History</button>
      </div>

      <div className="demo-content content">
        {viewStack.length > 0 && (
          <div className="current-view">
            {viewStack[viewStack.length - 1]}
          </div>
        )}

        {currentTrace && (
          <div className="trace-info">
            <h3>Current Trace</h3>
            <pre>{JSON.stringify(currentTrace, null, 2)}</pre>
          </div>
        )}

        {messageHistory.length > 0 && (
          <div className="message-history">
            <h3>Message History</h3>
            <div className="messages">
              {messageHistory.map((msg, index) => (
                <div key={index} className="message">
                  <strong>{msg.action}</strong> - {msg.timestamp}
                  <br />
                  Backend: {msg.backend} | Trace: {msg.traceId}
                  {msg.data && <pre>{JSON.stringify(msg.data, null, 2)}</pre>}
                </div>
              ))}
            </div>
          </div>
        )}

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
        .fish-burger-with-tracing { padding: 20px; max-width: 1200px; margin: 0 auto; }
        .header { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .status { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 10px; }
        .controls { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .controls button { padding: 10px 15px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; }
        .controls button:disabled { background: #ccc; cursor: not-allowed; }
        .content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .current-view { grid-column: 1 / -1; background: #f9f9f9; padding: 15px; border-radius: 8px; }
        .trace-info, .message-history, .log-entries { background: #f9f9f9; padding: 15px; border-radius: 8px; max-height: 400px; overflow-y: auto; }
        .messages, .logs { display: flex; flex-direction: column; gap: 10px; }
        .message, .log-entry { background: white; padding: 10px; border-radius: 4px; border-left: 4px solid #007bff; }
        pre { background: #f0f0f0; padding: 5px; border-radius: 4px; font-size: 12px; overflow-x: auto; }
        .idle-state, .processing-state, .completed-state, .error-state { text-align: center; }
        .idle-state button, .processing-state button, .completed-state button, .error-state button { margin: 5px; padding: 8px 16px; border: none; border-radius: 4px; background: #007bff; color: white; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default TracingScreen;
