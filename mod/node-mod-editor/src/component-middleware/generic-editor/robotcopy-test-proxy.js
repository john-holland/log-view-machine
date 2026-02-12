// RobotCopy Test Proxy
// Connects editor UI components to RobotCopy functionality through a test proxy pattern

import { createRobotCopy } from '../../../../log-view-machine/src/core/RobotCopy';
import { createViewStateMachine } from '../../../../log-view-machine/src/core/ViewStateMachine';
import { createClientGenerator } from '../../../../log-view-machine/src/core/ClientGenerator';

// Test Proxy Configuration
const TEST_PROXY_CONFIG = {
    robotCopy: {
        unleashUrl: 'http://localhost:4242/api',
        unleashClientKey: 'default:development.unleash-insecure-api-token',
        unleashAppName: 'generic-editor-frontend',
        unleashEnvironment: 'development',
        kotlinBackendUrl: 'http://localhost:8080',
        nodeBackendUrl: 'http://localhost:3001',
        enableTracing: true,
        enableDataDog: true
    },
    pact: {
        consumer: 'GenericEditorConsumer',
        provider: 'GenericEditorProvider',
        logLevel: 'info',
        dir: './pacts',
        spec: 2
    },
    proxy: {
        enableTestMode: true,
        enableMockResponses: true,
        enableStateTracking: true,
        enablePerformanceMonitoring: true
    }
};

// Test Proxy State Machine
const createTestProxyStateMachine = () => {
    return createViewStateMachine({
        machineId: 'robotcopy-test-proxy',
        xstateConfig: {
            id: 'robotcopy-test-proxy',
            initial: 'ready',
            context: {
                currentComponent: null,
                testResults: [],
                performanceMetrics: {},
                stateHistory: []
            },
            states: {
                ready: {
                    on: {
                        LOAD_COMPONENT: {
                            target: 'loading',
                            actions: ['trackStateTransition']
                        },
                        SAVE_COMPONENT: {
                            target: 'saving',
                            actions: ['trackStateTransition']
                        },
                        GENERATE_CLIENT: {
                            target: 'generating',
                            actions: ['trackStateTransition']
                        },
                        RUN_TESTS: {
                            target: 'testing',
                            actions: ['trackStateTransition']
                        }
                    }
                },
                loading: {
                    on: {
                        LOAD_SUCCESS: {
                            target: 'ready',
                            actions: ['updateComponent', 'trackPerformance']
                        },
                        LOAD_ERROR: {
                            target: 'error',
                            actions: ['handleError']
                        }
                    }
                },
                saving: {
                    on: {
                        SAVE_SUCCESS: {
                            target: 'ready',
                            actions: ['updateComponent', 'trackPerformance']
                        },
                        SAVE_ERROR: {
                            target: 'error',
                            actions: ['handleError']
                        }
                    }
                },
                generating: {
                    on: {
                        GENERATE_SUCCESS: {
                            target: 'ready',
                            actions: ['updateClient', 'trackPerformance']
                        },
                        GENERATE_ERROR: {
                            target: 'error',
                            actions: ['handleError']
                        }
                    }
                },
                testing: {
                    on: {
                        TEST_SUCCESS: {
                            target: 'ready',
                            actions: ['updateTestResults', 'trackPerformance']
                        },
                        TEST_ERROR: {
                            target: 'error',
                            actions: ['handleError']
                        }
                    }
                },
                error: {
                    on: {
                        RETRY: {
                            target: 'ready',
                            actions: ['clearError']
                        },
                        RESET: {
                            target: 'ready',
                            actions: ['resetState']
                        }
                    }
                }
            }
        }
    });
};

// RobotCopy Test Proxy Class
class RobotCopyTestProxy {
    constructor(config = TEST_PROXY_CONFIG) {
        this.config = config;
        this.robotCopy = null;
        this.stateMachine = null;
        this.clientGenerator = null;
        this.pactClient = null;
        this.testResults = [];
        this.performanceMetrics = {};
        this.isInitialized = false;
        
        this.setupPactInteractions();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing RobotCopy Test Proxy...');
            
            // Initialize RobotCopy
            this.robotCopy = createRobotCopy(this.config.robotCopy);
            
            // Initialize State Machine
            this.stateMachine = createTestProxyStateMachine();
            
            // Initialize Client Generator
            this.clientGenerator = createClientGenerator();
            
            // Initialize PACT Client
            this.pactClient = new PactTestClient(this.config.pact);
            await this.pactClient.setup();
            
            this.isInitialized = true;
            console.log('✅ RobotCopy Test Proxy initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize RobotCopy Test Proxy:', error);
            return false;
        }
    }

    // Setup PACT interactions for test proxy
    setupPactInteractions() {
        // Component loading interaction
        this.pactInteractions = {
            loadComponent: {
                state: 'Component exists',
                uponReceiving: 'a request to load component via test proxy',
                withRequest: {
                    method: 'GET',
                    path: '/api/components/test-component-123',
                    headers: {
                        'X-Test-Proxy': 'true',
                        'X-Proxy-Mode': 'test'
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Test-Proxy-Response': 'true'
                    },
                    body: {
                        id: 'test-component-123',
                        name: 'Test Component',
                        template: '<div>Test content</div>',
                        styles: 'div { color: red; }',
                        script: 'console.log("test");',
                        stateMachine: {
                            id: 'test-machine',
                            initial: 'idle',
                            states: { idle: {} }
                        },
                        testProxy: {
                            loadedAt: new Date().toISOString(),
                            proxyMode: 'test',
                            performanceMetrics: {
                                loadTime: 150,
                                memoryUsage: '2.5MB'
                            }
                        }
                    }
                }
            },

            saveComponent: {
                state: 'Component is being saved',
                uponReceiving: 'a request to save component via test proxy',
                withRequest: {
                    method: 'POST',
                    path: '/api/components',
                    headers: {
                        'X-Test-Proxy': 'true',
                        'X-Proxy-Mode': 'test'
                    },
                    body: {
                        name: 'test-component',
                        template: '<div>Test</div>',
                        styles: 'div { color: red; }',
                        script: 'console.log("test");',
                        testProxy: {
                            savedAt: new Date().toISOString(),
                            proxyMode: 'test'
                        }
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Test-Proxy-Response': 'true'
                    },
                    body: {
                        success: true,
                        componentId: 'test-component-123',
                        message: 'Component saved via test proxy',
                        testProxy: {
                            savedAt: new Date().toISOString(),
                            proxyMode: 'test',
                            performanceMetrics: {
                                saveTime: 200,
                                memoryUsage: '2.8MB'
                            }
                        }
                    }
                }
            },

            generateClient: {
                state: 'Component exists for client generation',
                uponReceiving: 'a request to generate client via test proxy',
                withRequest: {
                    method: 'POST',
                    path: '/api/components/test-component-123/client',
                    headers: {
                        'X-Test-Proxy': 'true',
                        'X-Proxy-Mode': 'test'
                    },
                    body: {
                        machineId: 'test-component-123',
                        description: 'Test component',
                        testProxy: {
                            generatedAt: new Date().toISOString(),
                            proxyMode: 'test'
                        }
                    }
                },
                willRespondWith: {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Test-Proxy-Response': 'true'
                    },
                    body: {
                        machineId: 'test-component-123',
                        description: 'Generated client for test component',
                        clientCode: '// Generated client code...',
                        testProxy: {
                            generatedAt: new Date().toISOString(),
                            proxyMode: 'test',
                            performanceMetrics: {
                                generationTime: 300,
                                memoryUsage: '3.1MB'
                            }
                        }
                    }
                }
            }
        };
    }

    // Load component through test proxy
    async loadComponent(componentId, options = {}) {
        if (!this.isInitialized) {
            throw new Error('RobotCopy Test Proxy not initialized');
        }

        const startTime = performance.now();
        
        try {
            // Transition to loading state
            this.stateMachine.send('LOAD_COMPONENT', { componentId });
            
            // Setup PACT interaction
            await this.pactClient.addInteraction(this.pactInteractions.loadComponent);
            
            // Load component via RobotCopy
            const result = await this.robotCopy.sendMessage('loadComponent', { 
                componentId,
                testProxy: {
                    mode: 'test',
                    timestamp: new Date().toISOString(),
                    options
                }
            });
            
            // Verify PACT interaction
            await this.pactClient.verify();
            
            // Track performance
            const loadTime = performance.now() - startTime;
            this.trackPerformance('loadComponent', loadTime);
            
            // Transition to success state
            this.stateMachine.send('LOAD_SUCCESS', { component: result });
            
            // Add test proxy metadata
            result.testProxy = {
                loadedAt: new Date().toISOString(),
                proxyMode: 'test',
                performanceMetrics: {
                    loadTime: Math.round(loadTime),
                    memoryUsage: this.getMemoryUsage()
                }
            };
            
            this.testResults.push({
                operation: 'loadComponent',
                componentId,
                success: true,
                duration: loadTime,
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            // Transition to error state
            this.stateMachine.send('LOAD_ERROR', { error: error.message });
            
            this.testResults.push({
                operation: 'loadComponent',
                componentId,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    // Save component through test proxy
    async saveComponent(componentData, options = {}) {
        if (!this.isInitialized) {
            throw new Error('RobotCopy Test Proxy not initialized');
        }

        const startTime = performance.now();
        
        try {
            // Transition to saving state
            this.stateMachine.send('SAVE_COMPONENT', { component: componentData });
            
            // Setup PACT interaction
            await this.pactClient.addInteraction(this.pactInteractions.saveComponent);
            
            // Save component via RobotCopy
            const result = await this.robotCopy.sendMessage('saveComponent', {
                ...componentData,
                testProxy: {
                    mode: 'test',
                    timestamp: new Date().toISOString(),
                    options
                }
            });
            
            // Verify PACT interaction
            await this.pactClient.verify();
            
            // Track performance
            const saveTime = performance.now() - startTime;
            this.trackPerformance('saveComponent', saveTime);
            
            // Transition to success state
            this.stateMachine.send('SAVE_SUCCESS', { component: componentData });
            
            // Add test proxy metadata
            result.testProxy = {
                savedAt: new Date().toISOString(),
                proxyMode: 'test',
                performanceMetrics: {
                    saveTime: Math.round(saveTime),
                    memoryUsage: this.getMemoryUsage()
                }
            };
            
            this.testResults.push({
                operation: 'saveComponent',
                componentId: componentData.id,
                success: true,
                duration: saveTime,
                timestamp: new Date().toISOString()
            });
            
            return result;
        } catch (error) {
            // Transition to error state
            this.stateMachine.send('SAVE_ERROR', { error: error.message });
            
            this.testResults.push({
                operation: 'saveComponent',
                componentId: componentData.id,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    // Generate client through test proxy
    async generateClient(componentData, options = {}) {
        if (!this.isInitialized) {
            throw new Error('RobotCopy Test Proxy not initialized');
        }

        const startTime = performance.now();
        
        try {
            // Transition to generating state
            this.stateMachine.send('GENERATE_CLIENT', { component: componentData });
            
            // Setup PACT interaction
            await this.pactClient.addInteraction(this.pactInteractions.generateClient);
            
            // Generate client via RobotCopy
            const clientSpec = {
                machineId: componentData.id,
                description: componentData.description || 'Generated component',
                messageBrokers: [
                    {
                        type: 'http-api',
                        config: {
                            baseUrl: 'http://localhost:3001/api',
                            headers: { 'Content-Type': 'application/json' },
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
                },
                testProxy: {
                    mode: 'test',
                    timestamp: new Date().toISOString(),
                    options
                }
            };

            const client = await this.clientGenerator.generateClient(clientSpec);
            
            // Verify PACT interaction
            await this.pactClient.verify();
            
            // Track performance
            const generationTime = performance.now() - startTime;
            this.trackPerformance('generateClient', generationTime);
            
            // Transition to success state
            this.stateMachine.send('GENERATE_SUCCESS', { client });
            
            // Add test proxy metadata
            client.testProxy = {
                generatedAt: new Date().toISOString(),
                proxyMode: 'test',
                performanceMetrics: {
                    generationTime: Math.round(generationTime),
                    memoryUsage: this.getMemoryUsage()
                }
            };
            
            this.testResults.push({
                operation: 'generateClient',
                componentId: componentData.id,
                success: true,
                duration: generationTime,
                timestamp: new Date().toISOString()
            });
            
            return client;
        } catch (error) {
            // Transition to error state
            this.stateMachine.send('GENERATE_ERROR', { error: error.message });
            
            this.testResults.push({
                operation: 'generateClient',
                componentId: componentData.id,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    // Run tests through test proxy
    async runTests(componentData, testConfig = {}) {
        if (!this.isInitialized) {
            throw new Error('RobotCopy Test Proxy not initialized');
        }

        const startTime = performance.now();
        
        try {
            // Transition to testing state
            this.stateMachine.send('RUN_TESTS', { component: componentData });
            
            // Run tests via RobotCopy
            const testResult = await this.robotCopy.sendMessage('runTests', {
                componentId: componentData.id,
                testConfig: {
                    framework: 'jest',
                    timeout: 5000,
                    ...testConfig
                },
                testProxy: {
                    mode: 'test',
                    timestamp: new Date().toISOString()
                }
            });
            
            // Track performance
            const testTime = performance.now() - startTime;
            this.trackPerformance('runTests', testTime);
            
            // Transition to success state
            this.stateMachine.send('TEST_SUCCESS', { testResult });
            
            this.testResults.push({
                operation: 'runTests',
                componentId: componentData.id,
                success: true,
                duration: testTime,
                testResult,
                timestamp: new Date().toISOString()
            });
            
            return testResult;
        } catch (error) {
            // Transition to error state
            this.stateMachine.send('TEST_ERROR', { error: error.message });
            
            this.testResults.push({
                operation: 'runTests',
                componentId: componentData.id,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            throw error;
        }
    }

    // Performance tracking
    trackPerformance(operation, duration) {
        if (!this.performanceMetrics[operation]) {
            this.performanceMetrics[operation] = [];
        }
        
        this.performanceMetrics[operation].push({
            duration,
            timestamp: new Date().toISOString(),
            memoryUsage: this.getMemoryUsage()
        });
    }

    // Get memory usage (simulated)
    getMemoryUsage() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`;
        }
        return 'Unknown';
    }

    // Get test results
    getTestResults() {
        return {
            results: this.testResults,
            performanceMetrics: this.performanceMetrics,
            stateMachine: this.stateMachine.getSnapshot(),
            summary: {
                totalOperations: this.testResults.length,
                successfulOperations: this.testResults.filter(r => r.success).length,
                failedOperations: this.testResults.filter(r => !r.success).length,
                averagePerformance: this.calculateAveragePerformance()
            }
        };
    }

    // Calculate average performance
    calculateAveragePerformance() {
        const averages = {};
        
        Object.keys(this.performanceMetrics).forEach(operation => {
            const metrics = this.performanceMetrics[operation];
            if (metrics.length > 0) {
                const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0);
                averages[operation] = totalDuration / metrics.length;
            }
        });
        
        return averages;
    }

    // Reset test proxy
    async reset() {
        this.testResults = [];
        this.performanceMetrics = {};
        this.stateMachine.send('RESET');
        
        console.log('🔄 RobotCopy Test Proxy reset');
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up RobotCopy Test Proxy...');
        
        if (this.pactClient) {
            await this.pactClient.finalize();
        }
        
        this.isInitialized = false;
        console.log('✅ RobotCopy Test Proxy cleaned up');
    }
}

// PACT Test Client for Test Proxy
class PactTestClient {
    constructor(config) {
        this.config = config;
        this.interactions = [];
        this.provider = null;
    }

    setup() {
        // Initialize PACT provider
        this.provider = new Pact({
            consumer: this.config.consumer,
            provider: this.config.provider,
            log: path.resolve(process.cwd(), 'logs', 'pact.log'),
            logLevel: this.config.logLevel,
            dir: path.resolve(process.cwd(), this.config.dir),
            spec: this.config.spec
        });

        return this.provider.setup();
    }

    addInteraction(interaction) {
        this.interactions.push(interaction);
        return this.provider.addInteraction(interaction);
    }

    verify() {
        return this.provider.verify();
    }

    finalize() {
        return this.provider.finalize();
    }
}

// Export the test proxy
export { RobotCopyTestProxy, TEST_PROXY_CONFIG };

// Example usage:
/*
const testProxy = new RobotCopyTestProxy();
await testProxy.initialize();

// Load component through test proxy
const component = await testProxy.loadComponent('test-component-123');

// Save component through test proxy
await testProxy.saveComponent(component);

// Generate client through test proxy
const client = await testProxy.generateClient(component);

// Run tests through test proxy
const testResult = await testProxy.runTests(component);

// Get test results
const results = testProxy.getTestResults();
console.log('Test Proxy Results:', results);

// Cleanup
await testProxy.cleanup();
*/ 