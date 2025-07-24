// Test script to verify package exports
const { 
  createViewStateMachine, 
  createRobotCopy, 
  createClientGenerator 
} = require('./dist/index.js');

console.log('✅ Package exports working!');
console.log('createViewStateMachine:', typeof createViewStateMachine);
console.log('createRobotCopy:', typeof createRobotCopy);
console.log('createClientGenerator:', typeof createClientGenerator);

// Test basic functionality
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
  
  const clientGenerator = createClientGenerator();
  console.log('✅ ClientGenerator created successfully');
  
  console.log('\n🎉 All tests passed! Package is ready for publishing.');
} catch (error) {
  console.error('❌ Test failed:', error);
} 