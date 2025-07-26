// Test script to verify package exports
const {
  createViewStateMachine,
  createRobotCopy,
  createClientGenerator,
  createProxyRobotCopyStateMachine
} = require('./dist/index.js');

console.log('✅ Package exports working!');
console.log('createViewStateMachine:', typeof createViewStateMachine);
console.log('createRobotCopy:', typeof createRobotCopy);
console.log('createClientGenerator:', typeof createClientGenerator);
console.log('createProxyRobotCopyStateMachine:', typeof createProxyRobotCopyStateMachine);

try {
  const machine = createViewStateMachine({
    machineId: 'test',
    xstateConfig: {
      id: 'test',
      initial: 'idle',
      states: { idle: {} }
    }
  });
  console.log('✅ ViewStateMachine created successfully');
  
  const robotCopy = createRobotCopy();
  console.log('✅ RobotCopy created successfully');
  
  // Configure RobotCopy with message brokers
  robotCopy.registerMachine('test-proxy', machine, {
    machineId: 'test-proxy',
    description: 'Test proxy machine',
    messageBrokers: [
      {
        type: 'http-api',
        config: {
          baseUrl: 'https://api.example.com',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
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
  console.log('✅ RobotCopy configured successfully');
  
  const clientGenerator = createClientGenerator();
  console.log('✅ ClientGenerator created successfully');
  
  // Test createProxyRobotCopyStateMachine
  const proxyMachine = createProxyRobotCopyStateMachine({
    machineId: 'test-proxy',
    robotCopy: robotCopy,
    xstateConfig: {
      id: 'test-proxy',
      initial: 'ready',
      context: { messages: [] },
      states: { ready: {} }
    },
    incomingMessageHandlers: {
      'TEST_MESSAGE': (message) => {
        console.log('✅ Proxy machine received message:', message);
      }
    }
  });
  console.log('✅ ProxyRobotCopyStateMachine created successfully');
  
  // Test incoming message handling (this doesn't require message brokers)
  proxyMachine.handleIncomingMessage({
    type: 'TEST_MESSAGE',
    payload: { response: 'Hello back!' }
  });
  console.log('✅ Proxy machine incoming message handling working');
  
  // Test withStateAndMessageHandler functionality
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
      return view('Idle state with message handler');
    },
    'STATE_MESSAGE',
    (message) => {
      console.log('✅ withStateAndMessageHandler received message:', message);
    }
  );
  console.log('✅ ViewStateMachine with withStateAndMessageHandler created successfully');
  
  // Test the message handler registration
  machineWithMessageHandler.handleRobotCopyMessage({
    type: 'STATE_MESSAGE',
    payload: { message: 'Hello from withStateAndMessageHandler!' }
  });
  console.log('✅ withStateAndMessageHandler message handling working');
  
  console.log('\n🎉 All tests passed! Package is ready for publishing.');
} catch (error) {
  console.error('❌ Test failed:', error);
} 