import React, { useState, useEffect } from 'react';
import { createViewStateMachine, createRobotCopy, createProxyRobotCopyStateMachine } from 'log-view-machine';

// Create a RobotCopy sub-machine that handles all communication
const createRobotCopySubMachine = () => {
  const robotCopy = createRobotCopy();

  // Configure RobotCopy for different communication channels
  robotCopy.registerMachine('content-script-proxy', null, {
    description: 'Content script with RobotCopy sub-machine handling communication',
    messageBrokers: [
      {
        type: 'chrome-message',
        config: {
          extensionId: 'demo-extension',
          messageType: 'content-to-background',
          timeout: 5000
        }
      }
    ],
    autoDiscovery: true,
    clientSpecification: {
      supportedLanguages: ['typescript', 'javascript'],
      autoGenerateClients: true,
      includeExamples: true,
      includeDocumentation: true
    }
  });

    const robotCopyMachine = createProxyRobotCopyStateMachine({
        machineId: 'content-script-proxy',
        robotCopy
    });

  return robotCopyMachine;
};

// Create a ViewStateMachine that uses RobotCopy as a sub-machine
const contentScriptWithRobotCopySubMachine = createViewStateMachine({
  machineId: 'content-script-with-robotcopy-submachine',
  // RobotCopy as a sub-machine that handles all communication
  subMachines: {
    'content-script-proxy': createRobotCopySubMachine() // RobotCopy sub-machine
  },
  xstateConfig: {
    id: 'content-script-with-robotcopy-submachine',
    initial: 'idle',
    context: {
      messages: [] as any[],
      responses: [] as any[],
      backgroundResponses: [] as any[],
      popupResponses: [] as any[],
      apiResponses: [] as any[],
      currentAction: null as string | null,
      error: null as string | null,
      isConnected: false,
      connectionStatus: 'disconnected' as string
    },
    states: {
      idle: {
        on: {
          START_COMMUNICATION: 'connecting',
          SEND_TO_BACKGROUND: {
            target: 'idle',
            actions: 'sendToBackground'
          },
          SEND_TO_POPUP: {
            target: 'idle',
            actions: 'sendToPopup'
          },
          SEND_TO_API: {
            target: 'idle',
            actions: 'sendToApi'
          },
          RECEIVE_RESPONSE: {
            target: 'idle',
            actions: 'receiveResponse'
          }
        }
      },
      connecting: {
        entry: 'setConnecting',
        invoke: {
          src: 'establishRobotCopyConnections',
          onDone: {
            target: 'connected',
            actions: 'setConnected'
          },
          onError: {
            target: 'error',
            actions: 'setError'
          }
        }
      },
      connected: {
        on: {
          SEND_TO_BACKGROUND: {
            target: 'connected',
            actions: 'sendToBackground'
          },
          SEND_TO_POPUP: {
            target: 'connected',
            actions: 'sendToPopup'
          },
          SEND_TO_API: {
            target: 'connected',
            actions: 'sendToApi'
          },
          RECEIVE_RESPONSE: {
            target: 'connected',
            actions: 'receiveResponse'
          },
          DISCONNECT: 'idle'
        }
      },
      error: {
        on: {
          RETRY: 'connecting',
          RESET: 'idle'
        }
      }
    },
    actions: {
      setConnecting: (context: any) => ({
        connectionStatus: 'connecting',
        error: null
      }),
      setConnected: (context: any) => ({
        connectionStatus: 'connected',
        isConnected: true,
        error: null
      }),
      setError: (context: any, event: any) => ({
        connectionStatus: 'error',
        error: event.data?.message || 'Connection failed',
        isConnected: false
      }),
      sendToBackground: (context: any, event: any) => {
        // RobotCopy sub-machine handles this asynchronously
        console.log('RobotCopy sub-machine handling SEND_TO_BACKGROUND:', event.payload);
        return {
          messages: [...context.messages, { ...event.payload, timestamp: Date.now(), target: 'background' }]
        };
      },
      sendToPopup: (context: any, event: any) => {
        // RobotCopy sub-machine handles this asynchronously
        console.log('RobotCopy sub-machine handling SEND_TO_POPUP:', event.payload);
        return {
          messages: [...context.messages, { ...event.payload, timestamp: Date.now(), target: 'popup' }]
        };
      },
      sendToApi: (context: any, event: any) => {
        // RobotCopy sub-machine handles this asynchronously
        console.log('RobotCopy sub-machine handling SEND_TO_API:', event.payload);
        return {
          messages: [...context.messages, { ...event.payload, timestamp: Date.now(), target: 'api' }]
        };
      },
      receiveResponse: (context: any, event: any) => {
        const response = event.payload;
        if (response.target === 'background') {
          return {
            backgroundResponses: [...context.backgroundResponses, response]
          };
        } else if (response.target === 'popup') {
          return {
            popupResponses: [...context.popupResponses, response]
          };
        } else if (response.target === 'api') {
          return {
            apiResponses: [...context.apiResponses, response]
          };
        }
        return context;
      }
    },
    services: {
      establishRobotCopyConnections: async (context: any) => {
        // RobotCopy sub-machine establishes connections asynchronously
        console.log('RobotCopy sub-machine establishing connections...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { success: true, connections: ['background', 'popup', 'api'] };
      }
    }
  }
})
.withState('idle', async ({ state, model, log, view, on, send, getSubMachine }) => {
  on('idle', () => {
    console.log('Content script idle - RobotCopy sub-machine ready');
  });
  
  await log('Content script idle with RobotCopy sub-machine', { 
    messageCount: model.messages?.length || 0,
    connectionStatus: model.connectionStatus
  });
  
  return view(
    <div className="content-script-idle">
      <h3>Content Script with RobotCopy Sub-Machine</h3>
      <p>RobotCopy sub-machine handles all communication while main machine focuses on business logic</p>
      
      <div className="connection-status">
        <p>Connection Status: <strong>{model.connectionStatus}</strong></p>
        <p>Messages Sent: <strong>{model.messages?.length || 0}</strong></p>
      </div>
      
      <div className="communication-actions">
        <button onClick={() => {
          // Main machine delegates to RobotCopy sub-machine
          send({ 
            type: 'SEND_TO_BACKGROUND', 
            payload: { 
              message: 'Hello from content script!',
              data: { action: 'getUserData', userId: 123 }
            }
          });
        }}>
          Send to Background (via RobotCopy Sub-Machine)
        </button>
        
        <button onClick={() => {
          // Main machine delegates to RobotCopy sub-machine
          send({ 
            type: 'SEND_TO_POPUP', 
            payload: { 
              message: 'Update popup with new data',
              data: { action: 'updateUI', content: 'New content from content script' }
            }
          });
        }}>
          Send to Popup (via RobotCopy Sub-Machine)
        </button>
        
        <button onClick={() => {
          // Main machine delegates to RobotCopy sub-machine
          send({ 
            type: 'SEND_TO_API', 
            payload: { 
              message: 'Save user data',
              data: { action: 'saveUserData', userId: 123, data: { name: 'John', email: 'john@example.com' } }
            }
          });
        }}>
          Send to API (via RobotCopy Sub-Machine)
        </button>
      </div>
      
      <button onClick={() => send({ type: 'START_COMMUNICATION' })}>
        Start RobotCopy Communication
      </button>
    </div>
  );
})
.withState('connecting', async ({ state, model, log, view, on, getSubMachine }) => {
  on('connecting', () => {
    console.log('RobotCopy sub-machine establishing connections...');
  });
  
  await log('RobotCopy sub-machine establishing connections', { 
    connectionStatus: model.connectionStatus
  });
  
  return view(
    <div className="content-script-connecting">
      <h3>RobotCopy Sub-Machine - Establishing Connections</h3>
      <p>RobotCopy sub-machine is establishing asynchronous connections to all configured channels</p>
      
      <div className="loading-overlay">
        <div className="loading-spinner">Connecting to channels...</div>
        <p>Establishing connections to:</p>
        <ul>
          <li>Chrome Background Script</li>
          <li>Popup Window</li>
          <li>HTTP API</li>
        </ul>
      </div>
    </div>
  );
})
.withState('connected', async ({ state, model, log, view, on, send, getSubMachine }) => {
  on('connected', () => {
    console.log('RobotCopy sub-machine connected to all channels');
  });
  
  await log('RobotCopy sub-machine connected to all channels', { 
    messageCount: model.messages?.length || 0,
    responses: model.responses?.length || 0,
    connectionStatus: model.connectionStatus
  });
  
  return view(
    <div className="content-script-connected">
      <h3>RobotCopy Sub-Machine - Connected</h3>
      <p>RobotCopy sub-machine is connected to all channels and ready for communication</p>
      
      <div className="connection-info">
        <div className="info-item">
          <span className="label">Connection Status:</span>
          <span className="value connected">🟢 {model.connectionStatus}</span>
        </div>
        <div className="info-item">
          <span className="label">Messages Sent:</span>
          <span className="value">{model.messages?.length || 0}</span>
        </div>
        <div className="info-item">
          <span className="label">Background Responses:</span>
          <span className="value">{model.backgroundResponses?.length || 0}</span>
        </div>
        <div className="info-item">
          <span className="label">Popup Responses:</span>
          <span className="value">{model.popupResponses?.length || 0}</span>
        </div>
        <div className="info-item">
          <span className="label">API Responses:</span>
          <span className="value">{model.apiResponses?.length || 0}</span>
        </div>
      </div>
      
      <div className="response-summary">
        <div className="response-item">
          <h4>Background Responses ({model.backgroundResponses?.length || 0})</h4>
          {model.backgroundResponses?.map((response: any, index: number) => (
            <div key={index} className="response-entry">
              <span className="timestamp">{new Date(response.timestamp).toLocaleTimeString()}</span>
              <span className="message">{response.message}</span>
            </div>
          )) || <p>No responses yet</p>}
        </div>
        
        <div className="response-item">
          <h4>Popup Responses ({model.popupResponses?.length || 0})</h4>
          {model.popupResponses?.map((response: any, index: number) => (
            <div key={index} className="response-entry">
              <span className="timestamp">{new Date(response.timestamp).toLocaleTimeString()}</span>
              <span className="message">{response.message}</span>
            </div>
          )) || <p>No responses yet</p>}
        </div>
        
        <div className="response-item">
          <h4>API Responses ({model.apiResponses?.length || 0})</h4>
          {model.apiResponses?.map((response: any, index: number) => (
            <div key={index} className="response-entry">
              <span className="timestamp">{new Date(response.timestamp).toLocaleTimeString()}</span>
              <span className="message">{response.message}</span>
            </div>
          )) || <p>No responses yet</p>}
        </div>
      </div>
      
      <button onClick={() => send({ type: 'DISCONNECT' })}>
        Disconnect RobotCopy Sub-Machine
      </button>
    </div>
  );
})
.withState('error', async ({ state, model, log, view, on, send }) => {
  on('error', () => {
    console.log('RobotCopy sub-machine connection error');
  });
  
  await log('RobotCopy sub-machine connection error', { 
    error: model.error,
    connectionStatus: model.connectionStatus
  });
  
  return view(
    <div className="content-script-error">
      <h3>RobotCopy Sub-Machine - Connection Error</h3>
      <p className="error-message">{model.error}</p>
      
      <div className="error-actions">
        <button onClick={() => send({ type: 'RETRY' })}>
          Retry Connection
        </button>
        <button onClick={() => send({ type: 'RESET' })}>
          Reset RobotCopy Sub-Machine
        </button>
      </div>
    </div>
  );
});

// Create a background script that responds to RobotCopy sub-machine
const backgroundScriptWithRobotCopySubMachine = createViewStateMachine({
  machineId: 'background-script-with-robotcopy-submachine',
  // RobotCopy as a sub-machine that handles all communication
  subMachines: {
    'background-script-proxy': createRobotCopySubMachine() // RobotCopy sub-machine
  },
  xstateConfig: {
    id: 'background-script-with-robotcopy-submachine',
    initial: 'listening',
    context: {
      receivedMessages: [] as any[],
      responses: [] as any[],
      connectionStatus: 'listening' as string
    },
    states: {
      listening: {
        on: {
          RECEIVE_MESSAGE: {
            target: 'processing',
            actions: 'receiveMessage'
          }
        }
      },
      processing: {
        entry: 'processMessage',
        on: {
          SEND_RESPONSE: {
            target: 'listening',
            actions: 'sendResponse'
          }
        }
      }
    },
    actions: {
      receiveMessage: (context: any, event: any) => ({
        receivedMessages: [...context.receivedMessages, event.payload]
      }),
      processMessage: (context: any, event: any) => {
        const lastMessage = context.receivedMessages[context.receivedMessages.length - 1];
        return {
          responses: [...context.responses, {
            id: lastMessage.id,
            message: `Processed: ${lastMessage.message}`,
            data: { processed: true, timestamp: Date.now() }
          }]
        };
      },
      sendResponse: (context: any, event: any) => {
        return context;
      }
    }
  }
})
.withState('listening', async ({ state, model, log, view, on, getSubMachine }) => {
  on('listening', () => {
    console.log('Background script listening via RobotCopy sub-machine');
  });
  
  await log('Background script listening via RobotCopy sub-machine', { 
    receivedCount: model.receivedMessages?.length || 0,
    responseCount: model.responses?.length || 0,
    connectionStatus: model.connectionStatus
  });
  
  return view(
    <div className="background-script-listening">
      <h3>Background Script - RobotCopy Sub-Machine Listening</h3>
      <p>RobotCopy sub-machine is listening for messages from content script</p>
      
      <div className="connection-info">
        <div className="info-item">
          <span className="label">Connection Status:</span>
          <span className="value listening">🟡 {model.connectionStatus}</span>
        </div>
        <div className="info-item">
          <span className="label">Received Messages:</span>
          <span className="value">{model.receivedMessages?.length || 0}</span>
        </div>
        <div className="info-item">
          <span className="label">Responses Sent:</span>
          <span className="value">{model.responses?.length || 0}</span>
        </div>
      </div>
      
      <div className="message-log">
        <h4>Received Messages ({model.receivedMessages?.length || 0})</h4>
        {model.receivedMessages?.map((msg: any, index: number) => (
          <div key={index} className="message-entry">
            <span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            <span className="message">{msg.message}</span>
          </div>
        )) || <p>No messages received yet</p>}
      </div>
      
      <div className="response-log">
        <h4>Responses ({model.responses?.length || 0})</h4>
        {model.responses?.map((response: any, index: number) => (
          <div key={index} className="response-entry">
            <span className="timestamp">{new Date(response.data.timestamp).toLocaleTimeString()}</span>
            <span className="message">{response.message}</span>
          </div>
        )) || <p>No responses sent yet</p>}
      </div>
    </div>
  );
})
.withState('processing', async ({ state, model, log, view, on, send, getSubMachine }) => {
  on('processing', () => {
    console.log('Background script processing via RobotCopy sub-machine');
  });
  
  await log('Background script processing via RobotCopy sub-machine', { 
    receivedCount: model.receivedMessages?.length || 0,
    responseCount: model.responses?.length || 0
  });
  
  return view(
    <div className="background-script-processing">
      <h3>Background Script - RobotCopy Sub-Machine Processing</h3>
      <p>RobotCopy sub-machine is processing message and preparing response</p>
      
      <div className="processing-status">
        <div className="status-item">
          <span className="label">Received Messages:</span>
          <span className="value">{model.receivedMessages?.length || 0}</span>
        </div>
        <div className="status-item">
          <span className="label">Responses Sent:</span>
          <span className="value">{model.responses?.length || 0}</span>
        </div>
      </div>
      
      <button onClick={() => send({ type: 'SEND_RESPONSE' })}>
        Send Response via RobotCopy Sub-Machine
      </button>
    </div>
  );
});

// Main demo component
const RobotCopyProxyDemo: React.FC = () => {
  const [activeMachine, setActiveMachine] = useState<'content' | 'background'>('content');

  const contentScript = contentScriptWithRobotCopySubMachine.useViewStateMachine({
    messages: [],
    responses: [],
    backgroundResponses: [],
    popupResponses: [],
    apiResponses: [],
    currentAction: null,
    error: null,
    isConnected: false,
    connectionStatus: 'disconnected'
  });

  const backgroundScript = backgroundScriptWithRobotCopySubMachine.useViewStateMachine({
    receivedMessages: [],
    responses: [],
    connectionStatus: 'listening'
  });

  return (
    <div className="robotcopy-proxy-demo">
      <div className="demo-header">
        <h2>🤖 RobotCopy as Sub-Machine</h2>
        <p>RobotCopy sub-machine handles all communication while main machine focuses on business logic</p>
      </div>

      <div className="architecture-explanation">
        <h3>Architecture: RobotCopy as Sub-Machine</h3>
        <div className="explanation-content">
          <p>
            <strong>RobotCopy as a sub-machine</strong> handles all communication while the main machine 
            focuses on business logic. This creates a clean separation of concerns where the main machine 
            delegates communication to the RobotCopy sub-machine.
          </p>
          
          <div className="architecture-diagram">
            <pre>
{`
Main Machine (Business Logic):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   State Handler │───▶│  XState Action  │───▶│  Business Logic │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  RobotCopy      │───▶│  Async API      │───▶│  Communication  │
│  Sub-Machine    │    │   Proxy         │    │   Channels      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Background     │    │     Popup       │    │      API        │
│    Script       │    │   Window        │    │   Endpoint      │
└─────────────────┘    └─────────────────┘    └─────────────────┘

ViewStateMachine Configuration:
{
  machineId: 'content-script',
  subMachines: {
    'content-script-proxy': robotCopyInstance  // RobotCopy sub-machine
  },
  xstateConfig: { /* business logic config */ }
}
`}
            </pre>
          </div>
        </div>
      </div>

      <div className="machine-selector">
        <button 
          className={activeMachine === 'content' ? 'active' : ''}
          onClick={() => setActiveMachine('content')}
        >
          Content Script (RobotCopy Sub-Machine)
        </button>
        <button 
          className={activeMachine === 'background' ? 'active' : ''}
          onClick={() => setActiveMachine('background')}
        >
          Background Script (RobotCopy Sub-Machine)
        </button>
      </div>

      <div className="machine-display">
        {activeMachine === 'content' ? (
          <div className="content-script-display">
            <h3>Content Script with RobotCopy Sub-Machine</h3>
            <div className="machine-status">
              <p>State: <strong>{contentScript.state}</strong></p>
              <p>Connection Status: <strong>{contentScript.context.connectionStatus}</strong></p>
              <p>Messages Sent: <strong>{contentScript.context.messages.length}</strong></p>
              <p>Background Responses: <strong>{contentScript.context.backgroundResponses.length}</strong></p>
              <p>Popup Responses: <strong>{contentScript.context.popupResponses.length}</strong></p>
              <p>API Responses: <strong>{contentScript.context.apiResponses.length}</strong></p>
            </div>
            
            {/* Render the current view from the state machine */}
            {contentScript.viewStack.length > 0 && (
              <div className="state-machine-view">
                {contentScript.viewStack.map((view, index) => (
                  <div key={index} className="view-container">
                    {view}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="background-script-display">
            <h3>Background Script with RobotCopy Sub-Machine</h3>
            <div className="machine-status">
              <p>State: <strong>{backgroundScript.state}</strong></p>
              <p>Connection Status: <strong>{backgroundScript.context.connectionStatus}</strong></p>
              <p>Received Messages: <strong>{backgroundScript.context.receivedMessages.length}</strong></p>
              <p>Responses Sent: <strong>{backgroundScript.context.responses.length}</strong></p>
            </div>
            
            {/* Render the current view from the state machine */}
            {backgroundScript.viewStack.length > 0 && (
              <div className="state-machine-view">
                {backgroundScript.viewStack.map((view, index) => (
                  <div key={index} className="view-container">
                    {view}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="submachine-benefits">
        <h3>RobotCopy Sub-Machine Benefits</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h4>🎯 Separation of Concerns</h4>
            <p>Main machine focuses on business logic, sub-machine handles communication</p>
          </div>
          <div className="benefit-item">
            <h4>🔧 Modular Architecture</h4>
            <p>Easy to swap out communication layer without changing business logic</p>
          </div>
          <div className="benefit-item">
            <h4>🌐 Multi-Channel Support</h4>
            <p>Sub-machine handles multiple communication channels simultaneously</p>
          </div>
          <div className="benefit-item">
            <h4>📡 Auto-Discovery</h4>
            <p>Sub-machine automatically discovers and configures available channels</p>
          </div>
          <div className="benefit-item">
            <h4>🔄 Real-Time Communication</h4>
            <p>Asynchronous communication with automatic response handling</p>
          </div>
          <div className="benefit-item">
            <h4>🛡️ Type Safe Delegation</h4>
            <p>Main machine delegates to sub-machine with full type safety</p>
          </div>
        </div>
      </div>

      <div className="code-example">
        <h3>Code Example: RobotCopy Sub-Machine Configuration</h3>
        <div className="code-block">
          <pre>
{`// Create ViewStateMachine with RobotCopy sub-machine
const machine = createViewStateMachine({
  machineId: 'content-script',
  subMachines: {
    'content-script-proxy': createRobotCopySubMachine() // RobotCopy sub-machine
  },
  xstateConfig: {
    // Business logic config - communication delegated to sub-machine
    id: 'content-script',
    initial: 'idle',
    context: { /* business state context */ },
    states: {
      idle: {
        on: {
          SEND_TO_BACKGROUND: { target: 'idle', actions: 'sendToBackground' },
          SEND_TO_POPUP: { target: 'idle', actions: 'sendToPopup' },
          SEND_TO_API: { target: 'idle', actions: 'sendToApi' }
        }
      }
    },
    actions: {
      sendToBackground: (context, event) => {
        // Main machine delegates to RobotCopy sub-machine
        console.log('Delegating to RobotCopy sub-machine:', event.payload);
      }
    }
  }
})
.withState('idle', async ({ send, getSubMachine }) => {
  // Main machine delegates communication to sub-machine
  send({ type: 'SEND_TO_BACKGROUND', payload: {...} });
  
  // Access sub-machine if needed
  const robotCopySubMachine = getSubMachine('content-script-proxy');
});`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default RobotCopyProxyDemo; 