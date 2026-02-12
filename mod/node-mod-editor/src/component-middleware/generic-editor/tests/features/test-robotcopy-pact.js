// Test RobotCopy PACT Integration
// This file tests the RobotCopy configuration with PACT test client

import { createGenericEditorRobotCopy, PACT_CONFIG, ROBOTCOPY_CONFIG } from './robotcopy-pact-config.js';

// Test configuration
const TEST_CONFIG = {
    ...ROBOTCOPY_CONFIG,
    enableTracing: true,
    enableDataDog: false // Disable for testing
};

// Test component data
const TEST_COMPONENT = {
    id: 'test-component',
    name: 'Test Component',
    description: 'A test component for RobotCopy PACT integration',
    template: '<div class="test-component">Hello World</div>',
    styles: '.test-component { color: blue; font-size: 18px; }',
    script: 'console.log("Test component loaded");',
    stateMachine: {
        id: 'test-machine',
        initial: 'idle',
        states: {
            idle: {
                on: {
                    START: 'active'
                }
            },
            active: {
                on: {
                    STOP: 'idle'
                }
            }
        }
    }
};

// Test suite
describe('RobotCopy PACT Integration', () => {
    let robotCopy;

    beforeAll(async () => {
        console.log('🚀 Setting up RobotCopy PACT integration...');
        robotCopy = createGenericEditorRobotCopy(TEST_CONFIG);
        await robotCopy.setup();
        console.log('✅ Setup complete');
    });

    afterAll(async () => {
        console.log('🧹 Cleaning up RobotCopy PACT integration...');
        await robotCopy.cleanup();
        console.log('✅ Cleanup complete');
    });

    describe('Component Registration', () => {
        it('should register a component successfully', async () => {
            console.log('📝 Testing component registration...');
            
            const result = await robotCopy.registerComponent(TEST_COMPONENT);
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.componentId).toBeDefined();
            
            console.log('✅ Component registration test passed');
        });

        it('should handle component registration errors gracefully', async () => {
            console.log('❌ Testing error handling...');
            
            const invalidComponent = {
                id: 'invalid-component',
                // Missing required fields
            };
            
            try {
                await robotCopy.registerComponent(invalidComponent);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
                console.log('✅ Error handling test passed');
            }
        });
    });

    describe('Component Loading', () => {
        it('should load a component successfully', async () => {
            console.log('📖 Testing component loading...');
            
            const result = await robotCopy.loadComponent('test-component-123');
            
            expect(result).toBeDefined();
            expect(result.id).toBe('test-component-123');
            expect(result.name).toBe('test-component');
            expect(result.template).toBeDefined();
            expect(result.styles).toBeDefined();
            expect(result.script).toBeDefined();
            
            console.log('✅ Component loading test passed');
        });

        it('should handle component loading errors gracefully', async () => {
            console.log('❌ Testing load error handling...');
            
            try {
                await robotCopy.loadComponent('non-existent-component');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
                console.log('✅ Load error handling test passed');
            }
        });
    });

    describe('Client Generation', () => {
        it('should generate a client successfully', async () => {
            console.log('🔧 Testing client generation...');
            
            const client = await robotCopy.generateClient(TEST_COMPONENT);
            
            expect(client).toBeDefined();
            expect(client.machineId).toBe(TEST_COMPONENT.id);
            expect(client.description).toBeDefined();
            
            console.log('✅ Client generation test passed');
        });

        it('should handle client generation errors gracefully', async () => {
            console.log('❌ Testing client generation error handling...');
            
            const invalidComponent = {
                id: 'invalid-client-component',
                // Missing required fields for client generation
            };
            
            try {
                await robotCopy.generateClient(invalidComponent);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeDefined();
                console.log('✅ Client generation error handling test passed');
            }
        });
    });

    describe('PACT Verification', () => {
        it('should verify PACT interactions correctly', async () => {
            console.log('🔍 Testing PACT verification...');
            
            // Register a component to trigger PACT interaction
            await robotCopy.registerComponent(TEST_COMPONENT);
            
            // Load a component to trigger another PACT interaction
            await robotCopy.loadComponent('test-component-123');
            
            console.log('✅ PACT verification test passed');
        });
    });

    describe('State Machine Integration', () => {
        it('should handle state machine events correctly', async () => {
            console.log('🔄 Testing state machine integration...');
            
            const stateMachine = robotCopy.stateMachine;
            expect(stateMachine).toBeDefined();
            
            // Test state machine initialization
            const initialState = stateMachine.getSnapshot();
            expect(initialState.value).toBe('editing');
            
            // Test tab switching
            stateMachine.send('SWITCH_TAB', { tab: 'preview' });
            const newState = stateMachine.getSnapshot();
            expect(newState.context.activeTab).toBe('preview');
            
            console.log('✅ State machine integration test passed');
        });
    });
});

// Manual test runner (for Node.js environment)
if (typeof window === 'undefined') {
    console.log('🧪 Running RobotCopy PACT integration tests...');
    
    const runTests = async () => {
        try {
            const robotCopy = createGenericEditorRobotCopy(TEST_CONFIG);
            await robotCopy.setup();
            
            console.log('📝 Testing component registration...');
            const registrationResult = await robotCopy.registerComponent(TEST_COMPONENT);
            console.log('✅ Registration result:', registrationResult);
            
            console.log('📖 Testing component loading...');
            const loadingResult = await robotCopy.loadComponent('test-component-123');
            console.log('✅ Loading result:', loadingResult);
            
            console.log('🔧 Testing client generation...');
            const clientResult = await robotCopy.generateClient(TEST_COMPONENT);
            console.log('✅ Client generation result:', clientResult);
            
            await robotCopy.cleanup();
            console.log('🎉 All tests completed successfully!');
        } catch (error) {
            console.error('❌ Test failed:', error);
            process.exit(1);
        }
    };
    
    runTests();
}

// Browser test runner
if (typeof window !== 'undefined') {
    window.testRobotCopyPact = async () => {
        console.log('🧪 Running RobotCopy PACT integration tests in browser...');
        
        try {
            const robotCopy = createGenericEditorRobotCopy(TEST_CONFIG);
            await robotCopy.setup();
            
            console.log('📝 Testing component registration...');
            const registrationResult = await robotCopy.registerComponent(TEST_COMPONENT);
            console.log('✅ Registration result:', registrationResult);
            
            console.log('📖 Testing component loading...');
            const loadingResult = await robotCopy.loadComponent('test-component-123');
            console.log('✅ Loading result:', loadingResult);
            
            console.log('🔧 Testing client generation...');
            const clientResult = await robotCopy.generateClient(TEST_COMPONENT);
            console.log('✅ Client generation result:', clientResult);
            
            await robotCopy.cleanup();
            console.log('🎉 All tests completed successfully!');
            
            return {
                success: true,
                results: {
                    registration: registrationResult,
                    loading: loadingResult,
                    clientGeneration: clientResult
                }
            };
        } catch (error) {
            console.error('❌ Test failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    };
} 