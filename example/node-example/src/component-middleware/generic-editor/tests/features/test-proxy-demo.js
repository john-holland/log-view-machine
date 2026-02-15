// RobotCopy Test Proxy Demo
// Demonstrates how the test proxy connects editor UI components to RobotCopy functionality

import { RobotCopyTestProxy, TEST_PROXY_CONFIG } from './robotcopy-test-proxy.js';

// Demo Configuration
const DEMO_CONFIG = {
    testComponent: {
        id: 'test-proxy-component-123',
        name: 'Test Proxy Component',
        description: 'A component for testing the RobotCopy test proxy',
        template: `
            <div class="test-proxy-component">
                <h2>Test Proxy Component</h2>
                <p>This component is loaded through the RobotCopy test proxy</p>
                <div class="proxy-info">
                    <h3>Proxy Information</h3>
                    <p><strong>Mode:</strong> <span id="proxy-mode">test</span></p>
                    <p><strong>Loaded At:</strong> <span id="loaded-at">-</span></p>
                    <p><strong>Performance:</strong> <span id="performance">-</span></p>
                </div>
                <button onclick="testProxyAction()">Test Action</button>
            </div>
        `,
        styles: `
            .test-proxy-component {
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .test-proxy-component h2 {
                margin: 0 0 16px 0;
                font-size: 24px;
            }
            .test-proxy-component p {
                margin: 0 0 12px 0;
                opacity: 0.9;
            }
            .proxy-info {
                background: rgba(255, 255, 255, 0.1);
                padding: 16px;
                border-radius: 6px;
                margin: 16px 0;
            }
            .proxy-info h3 {
                margin: 0 0 12px 0;
                font-size: 18px;
            }
            .proxy-info p {
                margin: 0 0 8px 0;
                font-size: 14px;
            }
            .test-proxy-component button {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            .test-proxy-component button:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-1px);
            }
        `,
        script: `
            console.log('Test Proxy Component loaded');
            
            // Update proxy information
            function updateProxyInfo() {
                const proxyMode = document.getElementById('proxy-mode');
                const loadedAt = document.getElementById('loaded-at');
                const performance = document.getElementById('performance');
                
                if (proxyMode) proxyMode.textContent = 'test';
                if (loadedAt) loadedAt.textContent = new Date().toLocaleString();
                if (performance) performance.textContent = 'Optimized';
            }
            
            // Test action function
            window.testProxyAction = function() {
                console.log('Test proxy action triggered');
                alert('Test proxy action executed successfully!');
            };
            
            // Initialize when DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                updateProxyInfo();
                console.log('Test Proxy Component initialized');
            });
        `,
        stateMachine: {
            id: 'test-proxy-machine',
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

// Test Proxy Demo Class
class TestProxyDemo {
    constructor() {
        this.testProxy = null;
        this.demoResults = [];
        this.isRunning = false;
    }

    async initialize() {
        console.log('🚀 Initializing RobotCopy Test Proxy Demo...');
        
        try {
            this.testProxy = new RobotCopyTestProxy();
            const initialized = await this.testProxy.initialize();
            
            if (initialized) {
                console.log('✅ Test Proxy Demo initialized successfully');
                return true;
            } else {
                console.error('❌ Failed to initialize Test Proxy Demo');
                return false;
            }
        } catch (error) {
            console.error('❌ Error during demo initialization:', error);
            return false;
        }
    }

    // Run the full test proxy demo
    async runFullDemo() {
        if (this.isRunning) {
            console.warn('⚠️ Demo is already running');
            return;
        }

        this.isRunning = true;
        this.demoResults = [];

        console.log('🎬 Starting RobotCopy Test Proxy Demo...');
        console.log('📋 This demo will test all proxy operations with PACT verification');

        try {
            // Step 1: Test component loading through proxy
            await this.demoStep1_LoadComponent();
            
            // Step 2: Test component saving through proxy
            await this.demoStep2_SaveComponent();
            
            // Step 3: Test client generation through proxy
            await this.demoStep3_GenerateClient();
            
            // Step 4: Test running tests through proxy
            await this.demoStep4_RunTests();
            
            // Step 5: Test performance monitoring
            await this.demoStep5_PerformanceMonitoring();
            
            // Step 6: Test error handling
            await this.demoStep6_ErrorHandling();
            
            // Step 7: Generate final report
            await this.demoStep7_FinalReport();
            
            console.log('🎉 Test Proxy Demo completed successfully!');
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Step 1: Test component loading through proxy
    async demoStep1_LoadComponent() {
        console.log('\n📋 Step 1: Testing Component Loading Through Proxy');
        
        try {
            const component = await this.testProxy.loadComponent(DEMO_CONFIG.testComponent.id, {
                enablePerformanceTracking: true,
                enablePactVerification: true
            });
            
            this.demoResults.push({
                step: 1,
                name: 'Component Loading Through Proxy',
                success: true,
                operation: 'loadComponent',
                componentId: component.id,
                proxyMetadata: component.testProxy,
                duration: component.testProxy?.performanceMetrics?.loadTime || 0
            });

            console.log(`✅ Component loaded through proxy: ${component.name}`);
            console.log(`📊 Proxy metadata:`, component.testProxy);
            
        } catch (error) {
            console.error(`❌ Component loading failed:`, error);
            
            this.demoResults.push({
                step: 1,
                name: 'Component Loading Through Proxy',
                success: false,
                operation: 'loadComponent',
                error: error.message
            });
        }
    }

    // Step 2: Test component saving through proxy
    async demoStep2_SaveComponent() {
        console.log('\n📋 Step 2: Testing Component Saving Through Proxy');
        
        try {
            const result = await this.testProxy.saveComponent(DEMO_CONFIG.testComponent, {
                enablePerformanceTracking: true,
                enablePactVerification: true
            });
            
            this.demoResults.push({
                step: 2,
                name: 'Component Saving Through Proxy',
                success: true,
                operation: 'saveComponent',
                componentId: DEMO_CONFIG.testComponent.id,
                proxyMetadata: result.testProxy,
                duration: result.testProxy?.performanceMetrics?.saveTime || 0
            });

            console.log(`✅ Component saved through proxy: ${result.componentId}`);
            console.log(`📊 Proxy metadata:`, result.testProxy);
            
        } catch (error) {
            console.error(`❌ Component saving failed:`, error);
            
            this.demoResults.push({
                step: 2,
                name: 'Component Saving Through Proxy',
                success: false,
                operation: 'saveComponent',
                error: error.message
            });
        }
    }

    // Step 3: Test client generation through proxy
    async demoStep3_GenerateClient() {
        console.log('\n📋 Step 3: Testing Client Generation Through Proxy');
        
        try {
            const client = await this.testProxy.generateClient(DEMO_CONFIG.testComponent, {
                enablePerformanceTracking: true,
                enablePactVerification: true
            });
            
            this.demoResults.push({
                step: 3,
                name: 'Client Generation Through Proxy',
                success: true,
                operation: 'generateClient',
                componentId: DEMO_CONFIG.testComponent.id,
                proxyMetadata: client.testProxy,
                duration: client.testProxy?.performanceMetrics?.generationTime || 0
            });

            console.log(`✅ Client generated through proxy: ${client.machineId}`);
            console.log(`📊 Proxy metadata:`, client.testProxy);
            
        } catch (error) {
            console.error(`❌ Client generation failed:`, error);
            
            this.demoResults.push({
                step: 3,
                name: 'Client Generation Through Proxy',
                success: false,
                operation: 'generateClient',
                error: error.message
            });
        }
    }

    // Step 4: Test running tests through proxy
    async demoStep4_RunTests() {
        console.log('\n📋 Step 4: Testing Test Execution Through Proxy');
        
        try {
            const testResult = await this.testProxy.runTests(DEMO_CONFIG.testComponent, {
                framework: 'jest',
                timeout: 5000,
                enablePerformanceTracking: true,
                enablePactVerification: true
            });
            
            this.demoResults.push({
                step: 4,
                name: 'Test Execution Through Proxy',
                success: true,
                operation: 'runTests',
                componentId: DEMO_CONFIG.testComponent.id,
                testResult,
                duration: testResult.duration || 0
            });

            console.log(`✅ Tests executed through proxy`);
            console.log(`📊 Test result:`, testResult);
            
        } catch (error) {
            console.error(`❌ Test execution failed:`, error);
            
            this.demoResults.push({
                step: 4,
                name: 'Test Execution Through Proxy',
                success: false,
                operation: 'runTests',
                error: error.message
            });
        }
    }

    // Step 5: Test performance monitoring
    async demoStep5_PerformanceMonitoring() {
        console.log('\n📋 Step 5: Testing Performance Monitoring');
        
        try {
            const performanceMetrics = this.testProxy.performanceMetrics;
            const averagePerformance = this.testProxy.calculateAveragePerformance();
            
            this.demoResults.push({
                step: 5,
                name: 'Performance Monitoring',
                success: true,
                performanceMetrics,
                averagePerformance
            });

            console.log(`✅ Performance monitoring active`);
            console.log(`📊 Performance metrics:`, performanceMetrics);
            console.log(`📊 Average performance:`, averagePerformance);
            
        } catch (error) {
            console.error(`❌ Performance monitoring failed:`, error);
            
            this.demoResults.push({
                step: 5,
                name: 'Performance Monitoring',
                success: false,
                error: error.message
            });
        }
    }

    // Step 6: Test error handling
    async demoStep6_ErrorHandling() {
        console.log('\n📋 Step 6: Testing Error Handling');
        
        try {
            // Try to load a non-existent component to trigger error
            await this.testProxy.loadComponent('non-existent-component');
            
            this.demoResults.push({
                step: 6,
                name: 'Error Handling',
                success: false,
                message: 'Expected error was not triggered'
            });
            
        } catch (error) {
            // This is expected - test the error handling
            console.log(`✅ Error handling working correctly: ${error.message}`);
            
            this.demoResults.push({
                step: 6,
                name: 'Error Handling',
                success: true,
                error: error.message
            });
        }
    }

    // Step 7: Generate final report
    async demoStep7_FinalReport() {
        console.log('\n📋 Step 7: Generating Final Report');
        
        const testResults = this.testProxy.getTestResults();
        const passedTests = this.demoResults.filter(r => r.success).length;
        const totalTests = this.demoResults.length;
        const successRate = (passedTests / totalTests) * 100;

        console.log('\n📊 ROBOTCOPY TEST PROXY DEMO RESULTS');
        console.log('==========================================');
        console.log(`Total Steps: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${successRate.toFixed(1)}%`);
        
        console.log('\n🧪 Test Proxy Results:');
        console.log(`  Total Operations: ${testResults.summary.totalOperations}`);
        console.log(`  Successful Operations: ${testResults.summary.successfulOperations}`);
        console.log(`  Failed Operations: ${testResults.summary.failedOperations}`);
        console.log(`  Average Performance:`, testResults.summary.averagePerformance);

        console.log('\n📋 Detailed Results:');
        this.demoResults.forEach((result, index) => {
            const status = result.success ? '✅ PASS' : '❌ FAIL';
            console.log(`  ${index + 1}. ${result.name}: ${status}`);
            if (result.error) {
                console.log(`     Error: ${result.error}`);
            }
            if (result.duration) {
                console.log(`     Duration: ${Math.round(result.duration)}ms`);
            }
        });

        this.demoResults.push({
            step: 7,
            name: 'Final Report',
            success: successRate >= 80,
            summary: {
                totalTests,
                passedTests,
                failedTests: totalTests - passedTests,
                successRate
            },
            testProxyResults: testResults
        });
    }

    // Get demo results
    getDemoResults() {
        return {
            demoResults: this.demoResults,
            testProxyResults: this.testProxy?.getTestResults(),
            summary: {
                totalSteps: this.demoResults.length,
                passedSteps: this.demoResults.filter(r => r.success).length,
                failedSteps: this.demoResults.filter(r => !r.success).length,
                successRate: this.demoResults.length > 0 ? 
                    (this.demoResults.filter(r => r.success).length / this.demoResults.length) * 100 : 0
            }
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Test Proxy Demo...');
        
        if (this.testProxy) {
            await this.testProxy.cleanup();
        }
        
        console.log('✅ Test Proxy Demo cleaned up');
    }
}

// Browser integration
if (typeof window !== 'undefined') {
    window.TestProxyDemo = TestProxyDemo;
    window.runTestProxyDemo = async () => {
        const demo = new TestProxyDemo();
        await demo.initialize();
        await demo.runFullDemo();
        return demo.getDemoResults();
    };
}

// Node.js integration
if (typeof window === 'undefined') {
    const demo = new TestProxyDemo();
    
    demo.initialize().then(async (initialized) => {
        if (initialized) {
            await demo.runFullDemo();
            const results = demo.getDemoResults();
            console.log('\n🎯 Test Proxy Demo Results:', JSON.stringify(results, null, 2));
            await demo.cleanup();
        }
    }).catch(error => {
        console.error('❌ Test Proxy Demo failed:', error);
    });
}

// Export for use in other modules
export { TestProxyDemo, DEMO_CONFIG };

// Example usage:
/*
// Browser
const demo = new TestProxyDemo();
await demo.initialize();
await demo.runFullDemo();
const results = demo.getDemoResults();
console.log('Test Proxy Demo Results:', results);
await demo.cleanup();

// Or use the global function
const results = await window.runTestProxyDemo();
console.log('Test Proxy Demo Results:', results);
*/ 