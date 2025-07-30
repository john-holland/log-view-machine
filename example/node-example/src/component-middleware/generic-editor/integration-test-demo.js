// Integration Test Demo
// Demonstrates how editor UI components connect to PACT testing for RobotCopy functionality

import { EditorStateManager } from './editor-pact-integration.js';
import { EDITOR_STATES, UI_COMPONENT_STATES } from './state-test-mapping.js';

// Demo Configuration
const DEMO_CONFIG = {
    testComponent: {
        id: 'demo-component-123',
        name: 'Demo Component',
        description: 'A demo component for integration testing',
        template: `
            <div class="demo-component">
                <h1>Hello from Demo Component</h1>
                <p>This is a test component for RobotCopy PACT integration</p>
                <button onclick="alert('Button clicked!')">Click Me</button>
            </div>
        `,
        styles: `
            .demo-component {
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                text-align: center;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .demo-component h1 {
                margin: 0 0 16px 0;
                font-size: 24px;
            }
            .demo-component p {
                margin: 0 0 20px 0;
                opacity: 0.9;
            }
            .demo-component button {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            .demo-component button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }
        `,
        script: `
            console.log('Demo component loaded');
            
            // Add some interactive functionality
            document.addEventListener('DOMContentLoaded', function() {
                const button = document.querySelector('.demo-component button');
                if (button) {
                    button.addEventListener('click', function() {
                        console.log('Demo button clicked!');
                        this.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            this.style.transform = '';
                        }, 150);
                    });
                }
            });
        `,
        stateMachine: {
            id: 'demo-machine',
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
    }
};

// Integration Test Demo Class
class IntegrationTestDemo {
    constructor() {
        this.stateManager = null;
        this.testResults = [];
        this.demoStep = 0;
        this.isRunning = false;
    }

    async initialize() {
        console.log('🚀 Initializing Integration Test Demo...');
        
        try {
            this.stateManager = new EditorStateManager();
            const initialized = await this.stateManager.initialize();
            
            if (initialized) {
                console.log('✅ Integration Test Demo initialized successfully');
                return true;
            } else {
                console.error('❌ Failed to initialize Integration Test Demo');
                return false;
            }
        } catch (error) {
            console.error('❌ Error during demo initialization:', error);
            return false;
        }
    }

    // Run the full integration demo
    async runFullDemo() {
        if (this.isRunning) {
            console.warn('⚠️ Demo is already running');
            return;
        }

        this.isRunning = true;
        this.demoStep = 0;
        this.testResults = [];

        console.log('🎬 Starting Integration Test Demo...');
        console.log('📋 This demo will test all editor states and UI components');

        try {
            // Step 1: Test idle state
            await this.demoStep1_IdleState();
            
            // Step 2: Test loading state
            await this.demoStep2_LoadingState();
            
            // Step 3: Test editing state
            await this.demoStep3_EditingState();
            
            // Step 4: Test preview functionality
            await this.demoStep4_PreviewFunctionality();
            
            // Step 5: Test tab switching
            await this.demoStep5_TabSwitching();
            
            // Step 6: Test saving functionality
            await this.demoStep6_SavingFunctionality();
            
            // Step 7: Test client generation
            await this.demoStep7_ClientGeneration();
            
            // Step 8: Test error handling
            await this.demoStep8_ErrorHandling();
            
            // Step 9: Generate final report
            await this.demoStep9_FinalReport();
            
            console.log('🎉 Integration Test Demo completed successfully!');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Step 1: Test idle state
    async demoStep1_IdleState() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Idle State`);
        
        const result = await this.stateManager.transitionToState(EDITOR_STATES.IDLE);
        
        this.testResults.push({
            step: this.demoStep,
            name: 'Idle State Test',
            success: result.success,
            state: EDITOR_STATES.IDLE,
            testResults: result.testResults
        });

        console.log(`✅ Idle state test completed: ${result.success ? 'PASSED' : 'FAILED'}`);
        
        // Wait a moment to show the UI state
        await this.delay(2000);
    }

    // Step 2: Test loading state
    async demoStep2_LoadingState() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Loading State`);
        
        const result = await this.stateManager.transitionToState(EDITOR_STATES.LOADING, {
            componentId: DEMO_CONFIG.testComponent.id
        });
        
        this.testResults.push({
            step: this.demoStep,
            name: 'Loading State Test',
            success: result.success,
            state: EDITOR_STATES.LOADING,
            testResults: result.testResults
        });

        console.log(`✅ Loading state test completed: ${result.success ? 'PASSED' : 'FAILED'}`);
        
        // Wait a moment to show the loading state
        await this.delay(2000);
    }

    // Step 3: Test editing state
    async demoStep3_EditingState() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Editing State`);
        
        const result = await this.stateManager.transitionToState(EDITOR_STATES.EDITING, {
            component: DEMO_CONFIG.testComponent
        });
        
        this.testResults.push({
            step: this.demoStep,
            name: 'Editing State Test',
            success: result.success,
            state: EDITOR_STATES.EDITING,
            testResults: result.testResults
        });

        console.log(`✅ Editing state test completed: ${result.success ? 'PASSED' : 'FAILED'}`);
        
        // Wait a moment to show the editing state
        await this.delay(2000);
    }

    // Step 4: Test preview functionality
    async demoStep4_PreviewFunctionality() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Preview Functionality`);
        
        const result = await this.stateManager.transitionToState(EDITOR_STATES.PREVIEWING, {
            component: DEMO_CONFIG.testComponent
        });
        
        this.testResults.push({
            step: this.demoStep,
            name: 'Preview Functionality Test',
            success: result.success,
            state: EDITOR_STATES.PREVIEWING,
            testResults: result.testResults
        });

        console.log(`✅ Preview functionality test completed: ${result.success ? 'PASSED' : 'FAILED'}`);
        
        // Wait a moment to show the preview
        await this.delay(3000);
    }

    // Step 5: Test tab switching
    async demoStep5_TabSwitching() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Tab Switching`);
        
        const tabs = ['preview', 'html', 'css', 'js', 'xstate'];
        const tabResults = [];

        for (const tab of tabs) {
            console.log(`  🔄 Switching to ${tab} tab...`);
            
            try {
                const result = await this.stateManager.switchToTab(tab);
                tabResults.push({
                    tab,
                    success: true
                });
                
                // Wait a moment to show the tab
                await this.delay(1000);
                
            } catch (error) {
                console.error(`  ❌ Failed to switch to ${tab} tab:`, error);
                tabResults.push({
                    tab,
                    success: false,
                    error: error.message
                });
            }
        }

        this.testResults.push({
            step: this.demoStep,
            name: 'Tab Switching Test',
            success: tabResults.every(r => r.success),
            tabResults
        });

        console.log(`✅ Tab switching test completed`);
    }

    // Step 6: Test saving functionality
    async demoStep6_SavingFunctionality() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Saving Functionality`);
        
        try {
            const result = await this.stateManager.saveComponent(DEMO_CONFIG.testComponent);
            
            this.testResults.push({
                step: this.demoStep,
                name: 'Saving Functionality Test',
                success: true,
                result
            });

            console.log(`✅ Saving functionality test completed: PASSED`);
            
        } catch (error) {
            console.error(`❌ Saving functionality test failed:`, error);
            
            this.testResults.push({
                step: this.demoStep,
                name: 'Saving Functionality Test',
                success: false,
                error: error.message
            });
        }
    }

    // Step 7: Test client generation
    async demoStep7_ClientGeneration() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Client Generation`);
        
        try {
            const client = await this.stateManager.generateClient(DEMO_CONFIG.testComponent);
            
            this.testResults.push({
                step: this.demoStep,
                name: 'Client Generation Test',
                success: true,
                client
            });

            console.log(`✅ Client generation test completed: PASSED`);
            console.log(`🔧 Generated client for: ${client.machineId}`);
            
        } catch (error) {
            console.error(`❌ Client generation test failed:`, error);
            
            this.testResults.push({
                step: this.demoStep,
                name: 'Client Generation Test',
                success: false,
                error: error.message
            });
        }
    }

    // Step 8: Test error handling
    async demoStep8_ErrorHandling() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Testing Error Handling`);
        
        try {
            // Try to load a non-existent component to trigger error
            await this.stateManager.loadComponent('non-existent-component');
            
            this.testResults.push({
                step: this.demoStep,
                name: 'Error Handling Test',
                success: false,
                message: 'Expected error was not triggered'
            });
            
        } catch (error) {
            // This is expected - test the error state
            const result = await this.stateManager.transitionToState(EDITOR_STATES.ERROR, {
                error: error.message
            });
            
            this.testResults.push({
                step: this.demoStep,
                name: 'Error Handling Test',
                success: result.success,
                error: error.message
            });

            console.log(`✅ Error handling test completed: ${result.success ? 'PASSED' : 'FAILED'}`);
            
            // Wait a moment to show the error state
            await this.delay(2000);
        }
    }

    // Step 9: Generate final report
    async demoStep9_FinalReport() {
        this.demoStep++;
        console.log(`\n📋 Step ${this.demoStep}: Generating Final Report`);
        
        const summary = this.stateManager.getTestResultsSummary();
        const passedTests = this.testResults.filter(r => r.success).length;
        const totalTests = this.testResults.length;
        const successRate = (passedTests / totalTests) * 100;

        console.log('\n📊 INTEGRATION TEST DEMO RESULTS');
        console.log('=====================================');
        console.log(`Total Steps: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${successRate.toFixed(1)}%`);
        
        if (summary) {
            console.log(`\n🧪 PACT Test Results:`);
            console.log(`  Total Tests: ${summary.totalTests}`);
            console.log(`  Passed: ${summary.passedTests}`);
            console.log(`  Failed: ${summary.failedTests}`);
            console.log(`  Success Rate: ${summary.successRate.toFixed(1)}%`);
        }

        console.log('\n📋 Detailed Results:');
        this.testResults.forEach((result, index) => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${index + 1}. ${result.name}: ${status}`);
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
        });

        this.testResults.push({
            step: this.demoStep,
            name: 'Final Report',
            success: successRate >= 80,
            summary: {
                totalTests,
                passedTests,
                failedTests: totalTests - passedTests,
                successRate
            }
        });
    }

    // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get demo results
    getDemoResults() {
        return {
            testResults: this.testResults,
            summary: this.stateManager.getTestResultsSummary(),
            stateInfo: this.stateManager.getCurrentStateInfo()
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Integration Test Demo...');
        
        if (this.stateManager) {
            await this.stateManager.cleanup();
        }
        
        console.log('✅ Integration Test Demo cleaned up');
    }
}

// Browser integration
if (typeof window !== 'undefined') {
    window.IntegrationTestDemo = IntegrationTestDemo;
    window.runIntegrationDemo = async () => {
        const demo = new IntegrationTestDemo();
        await demo.initialize();
        await demo.runFullDemo();
        return demo.getDemoResults();
    };
}

// Node.js integration
if (typeof window === 'undefined') {
    const demo = new IntegrationTestDemo();
    
    demo.initialize().then(async (initialized) => {
        if (initialized) {
            await demo.runFullDemo();
            const results = demo.getDemoResults();
            console.log('\n🎯 Demo Results:', JSON.stringify(results, null, 2));
            await demo.cleanup();
        }
    }).catch(error => {
        console.error('❌ Demo failed:', error);
    });
}

// Export for use in other modules
export { IntegrationTestDemo, DEMO_CONFIG };

// Example usage:
/*
// Browser
const demo = new IntegrationTestDemo();
await demo.initialize();
await demo.runFullDemo();
const results = demo.getDemoResults();
console.log('Demo Results:', results);
await demo.cleanup();

// Or use the global function
const results = await window.runIntegrationDemo();
console.log('Demo Results:', results);
*/ 