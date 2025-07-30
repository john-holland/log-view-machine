import React, { useState, useEffect } from 'react';
import { createViewStateMachine, createRobotCopy, createProxyRobotCopyStateMachine } from 'log-view-machine';

// Test the createProxyRobotCopyStateMachine functionality
const RobotCopyProxyDemo: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const runTests = async () => {
      const results: string[] = [];
      
      try {
        // Test 1: Create RobotCopy instance
        results.push('✅ Creating RobotCopy instance...');
        const robotCopy = createRobotCopy();
        
        // Test 2: Configure RobotCopy
        results.push('✅ Configuring RobotCopy...');
        const testMachine = createViewStateMachine({
          machineId: 'test-machine',
          xstateConfig: {
            id: 'test-machine',
            initial: 'idle',
            context: { messages: [] },
            states: { idle: {} }
          }
        });
        
        robotCopy.registerMachine('test-proxy', testMachine, {
          machineId: 'test-proxy',
          description: 'Test proxy machine',
          messageBrokers: [
            {
              type: 'chrome-message',
              config: {
                extensionId: 'test-extension',
                messageType: 'test-message',
                responseTimeout: 5000
              }
            }
          ],
          autoDiscovery: true,
          clientSpecification: {
            supportedLanguages: ['typescript'],
            autoGenerateClients: true,
            includeExamples: true,
            includeDocumentation: true
          }
        });
        
        // Test 3: Create ProxyRobotCopyStateMachine
        results.push('✅ Creating ProxyRobotCopyStateMachine...');
        const proxyMachine = createProxyRobotCopyStateMachine({
          machineId: 'test-proxy-machine',
          robotCopy: robotCopy,
          xstateConfig: {
            id: 'test-proxy-machine',
            initial: 'ready',
            context: {
              messages: [],
              responses: []
            },
            states: {
              ready: {
                on: {
                  SEND_MESSAGE: {
                    target: 'ready',
                    actions: 'sendMessage'
                  }
                }
              }
            },
            actions: {
              sendMessage: (context: any, event: any) => {
                console.log('Proxy machine sending message:', event.payload);
                return {
                  messages: [...context.messages, { ...event.payload, timestamp: Date.now() }]
                };
              }
            }
          },
          incomingMessageHandlers: {
            'TEST_RESPONSE': (message: any) => {
              console.log('Received test response:', message);
              results.push('✅ Received incoming message: ' + JSON.stringify(message));
            }
          }
        });
        
        // Test 4: Test outgoing message
        results.push('✅ Testing outgoing message...');
        await proxyMachine.send({
          type: 'SEND_MESSAGE',
          payload: { message: 'Hello from proxy machine!' }
        });
        
        // Test 5: Test incoming message handler
        results.push('✅ Testing incoming message handler...');
        proxyMachine.handleIncomingMessage({
          type: 'TEST_RESPONSE',
          payload: { response: 'Hello back from API!' }
        });
        
        // Test 6: Test regular ViewStateMachine with RobotCopy
        results.push('✅ Testing regular ViewStateMachine with RobotCopy...');
        const regularMachine = createViewStateMachine({
          machineId: 'test-regular-machine',
          xstateConfig: {
            id: 'test-regular-machine',
            initial: 'idle',
            context: { messages: [] },
            states: { idle: {} }
          }
        })
        .withRobotCopy(robotCopy)
        .registerRobotCopyHandler('INCOMING_MESSAGE', (message: any) => {
          console.log('Regular machine received message:', message);
          results.push('✅ Regular machine received message: ' + JSON.stringify(message));
        });
        
        // Test 7: Test incoming message on regular machine
        results.push('✅ Testing incoming message on regular machine...');
        regularMachine.handleRobotCopyMessage({
          type: 'INCOMING_MESSAGE',
          payload: { message: 'Hello from API to regular machine!' }
        });
        
        // Test 8: Test withStateAndMessageHandler functionality
        results.push('✅ Testing withStateAndMessageHandler...');
        const machineWithMessageHandler = createViewStateMachine({
          machineId: 'test-with-message-handler',
          xstateConfig: {
            id: 'test-with-message-handler',
            initial: 'idle',
            context: { messages: [] },
            states: { idle: {} }
          }
        })
        .withRobotCopy(robotCopy)
        .withStateAndMessageHandler(
          'idle',
          async ({ log, view }) => {
            await log('State idle with message handler registered');
            return view(React.createElement('div', null, 'Idle state with message handler'));
          },
          'STATE_MESSAGE',
          (message) => {
            console.log('withStateAndMessageHandler received message:', message);
            results.push('✅ withStateAndMessageHandler received message: ' + JSON.stringify(message));
          }
        );
        
        // Test the message handler registration
        machineWithMessageHandler.handleRobotCopyMessage({
          type: 'STATE_MESSAGE',
          payload: { message: 'Hello from withStateAndMessageHandler!' }
        });
        
        results.push('🎉 All tests passed!');
        
      } catch (error) {
        results.push('❌ Test failed: ' + error);
      }
      
      setTestResults(results);
    };
    
    runTests();
  }, []);

  return (
    <div className="robotcopy-proxy-demo">
      <div className="demo-header">
        <h2>🤖 RobotCopy Proxy Test</h2>
        <p>Testing createProxyRobotCopyStateMachine functionality</p>
      </div>

      <div className="test-results">
        <h3>Test Results</h3>
        <div className="results-list">
          {testResults.map((result, index) => (
            <div key={index} className="result-item">
              {result}
            </div>
          ))}
        </div>
      </div>

      <div className="architecture-explanation">
        <h3>Architecture: RobotCopy Proxy Pattern</h3>
        <div className="explanation-content">
          <p>
            <strong>createProxyRobotCopyStateMachine</strong> creates a ViewStateMachine that acts as a direct proxy to RobotCopy, 
            enabling seamless communication with the API layer while maintaining the ViewStateMachine interface.
          </p>
          
          <div className="architecture-diagram">
            <pre>
{`
Outgoing Messages:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ ViewStateMachine│───▶│ ProxyRobotCopy  │───▶│   API Layer     │
│                 │    │ StateMachine    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Incoming Messages:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer     │───▶│ ProxyRobotCopy  │───▶│ ViewStateMachine│
│                 │    │ StateMachine    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Regular ViewStateMachine with RobotCopy:
┌─────────────────┐    ┌─────────────────┐
│ ViewStateMachine│◄──►│   RobotCopy     │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
`}
            </pre>
          </div>
        </div>
      </div>

      <div className="code-example">
        <h3>Code Example: Using createProxyRobotCopyStateMachine</h3>
        <div className="code-block">
          <pre>
{`// Create a proxy machine that communicates with API layer
const proxyMachine = createProxyRobotCopyStateMachine({
  machineId: 'api-proxy',
  robotCopy: robotCopyInstance,
  xstateConfig: {
    id: 'api-proxy',
    initial: 'ready',
    context: { messages: [] },
    states: {
      ready: {
        on: {
          SEND_TO_API: {
            target: 'ready',
            actions: 'sendToApi'
          }
        }
      }
    },
    actions: {
      sendToApi: (context, event) => {
        console.log('Sending to API:', event.payload);
      }
    }
  },
  incomingMessageHandlers: {
    'API_RESPONSE': (message) => {
      console.log('Received API response:', message);
    }
  }
});

// Send message through proxy
await proxyMachine.send({
  type: 'SEND_TO_API',
  payload: { data: 'Hello API!' }
});

// Handle incoming message
proxyMachine.handleIncomingMessage({
  type: 'API_RESPONSE',
  payload: { response: 'Hello back!' }
});

// Using withStateAndMessageHandler for automatic message registration
const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: {
    id: 'my-machine',
    initial: 'idle',
    context: { messages: [] },
    states: { idle: {} }
  }
})
.withRobotCopy(robotCopy)
.withStateAndMessageHandler(
  'idle',
  async ({ log, view }) => {
    await log('State idle with message handler registered');
    return view(<div>Idle state with message handler</div>);
  },
  'STATE_MESSAGE',
  (message) => {
    console.log('Received state message:', message);
  }
);

// The message handler is automatically registered when the state is defined
machine.handleRobotCopyMessage({
  type: 'STATE_MESSAGE',
  payload: { message: 'Hello from state!' }
});`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default RobotCopyProxyDemo; 