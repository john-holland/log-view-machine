// RobotCopy Configuration with PACT Test Client Integration
// This file configures RobotCopy instances with PACT test client for the generic editor

import { createRobotCopy } from '../../../../log-view-machine/src/core/RobotCopy';
import { createViewStateMachine } from '../../../../log-view-machine/src/core/ViewStateMachine';
import { createClientGenerator } from '../../../../log-view-machine/src/core/ClientGenerator';

// PACT Test Client Configuration
const PACT_CONFIG = {
    consumer: 'GenericEditorConsumer',
    provider: 'GenericEditorProvider',
    logLevel: 'info',
    dir: './pacts',
    spec: 2
};

// RobotCopy Configuration for Generic Editor
const ROBOTCOPY_CONFIG = {
    unleashUrl: 'http://localhost:4242/api',
    unleashClientKey: 'default:development.unleash-insecure-api-token',
    unleashAppName: 'generic-editor-frontend',
    unleashEnvironment: 'development',
    kotlinBackendUrl: 'http://localhost:8080',
    nodeBackendUrl: 'http://localhost:3001',
    enableTracing: true,
    enableDataDog: true
};

// PACT Test Client Setup
class PactTestClient {
    constructor(config = PACT_CONFIG) {
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

    cleanup() {
        this.interactions = [];
    }
}

// Generic Editor State Machine Configuration
const createGenericEditorStateMachine = () => {
    return createViewStateMachine({
        machineId: 'generic-editor',
        xstateConfig: {
            id: 'generic-editor',
            initial: 'editing',
            context: {
                currentComponent: null,
                activeTab: 'preview',
                viewTemplates: [],
                robotCopy: null,
                pactClient: null
            },
            states: {
                editing: {
                    on: {
                        SWITCH_TAB: {
                            actions: ['switchTab', 'updatePreview']
                        },
                        ADD_VIEW_TEMPLATE: {
                            actions: ['addViewTemplate']
                        },
                        REMOVE_VIEW_TEMPLATE: {
                            actions: ['removeViewTemplate']
                        },
                        SAVE_COMPONENT: {
                            target: 'saving'
                        },
                        LOAD_COMPONENT: {
                            actions: ['loadComponent']
                        }
                    }
                },
                saving: {
                    on: {
                        SAVE_SUCCESS: {
                            target: 'editing',
                            actions: ['showSuccessMessage']
                        },
                        SAVE_ERROR: {
                            target: 'editing',
                            actions: ['showErrorMessage']
                        }
                    }
                }
            }
        }
    });
};

// RobotCopy Integration with PACT
class GenericEditorRobotCopy {
    constructor(config = ROBOTCOPY_CONFIG) {
        this.robotCopy = createRobotCopy(config);
        this.pactClient = new PactTestClient();
        this.stateMachine = createGenericEditorStateMachine();
        this.clientGenerator = createClientGenerator();
        
        this.setupPactInteractions();
    }

    async setupPactInteractions() {
        // Setup PACT interactions for component operations
        await this.pactClient.addInteraction({
            state: 'Component exists',
            uponReceiving: 'a request to save component',
            withRequest: {
                method: 'POST',
                path: '/api/components',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    name: 'test-component',
                    template: '<div>Test</div>',
                    styles: 'body { color: red; }',
                    script: 'console.log("test");'
                }
            },
            willRespondWith: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    success: true,
                    componentId: 'test-component-123',
                    message: 'Component saved successfully'
                }
            }
        });

        await this.pactClient.addInteraction({
            state: 'Component exists',
            uponReceiving: 'a request to load component',
            withRequest: {
                method: 'GET',
                path: '/api/components/test-component-123'
            },
            willRespondWith: {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: {
                    id: 'test-component-123',
                    name: 'test-component',
                    template: '<div>Test</div>',
                    styles: 'body { color: red; }',
                    script: 'console.log("test");',
                    stateMachine: {
                        id: 'test-machine',
                        initial: 'idle',
                        states: { idle: {} }
                    }
                }
            }
        });
    }

    async registerComponent(componentData) {
        try {
            // Use RobotCopy to send component data
            const result = await this.robotCopy.sendMessage('saveComponent', componentData);
            
            // Verify PACT interaction
            await this.pactClient.verify();
            
            return result;
        } catch (error) {
            console.error('Error registering component:', error);
            throw error;
        }
    }

    async loadComponent(componentId) {
        try {
            // Use RobotCopy to load component
            const result = await this.robotCopy.sendMessage('loadComponent', { componentId });
            
            // Verify PACT interaction
            await this.pactClient.verify();
            
            return result;
        } catch (error) {
            console.error('Error loading component:', error);
            throw error;
        }
    }

    async generateClient(componentData) {
        try {
            // Generate client using RobotCopy
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
                }
            };

            const client = await this.clientGenerator.generateClient(clientSpec);
            return client;
        } catch (error) {
            console.error('Error generating client:', error);
            throw error;
        }
    }

    async setup() {
        try {
            await this.pactClient.setup();
            console.log('✅ RobotCopy with PACT setup complete');
        } catch (error) {
            console.error('❌ Error setting up RobotCopy with PACT:', error);
            throw error;
        }
    }

    async cleanup() {
        try {
            await this.pactClient.finalize();
            this.pactClient.cleanup();
            console.log('✅ RobotCopy with PACT cleanup complete');
        } catch (error) {
            console.error('❌ Error cleaning up RobotCopy with PACT:', error);
            throw error;
        }
    }
}

// Export the configured RobotCopy instance
export const createGenericEditorRobotCopy = (config = ROBOTCOPY_CONFIG) => {
    return new GenericEditorRobotCopy(config);
};

// Export PACT configuration for testing
export { PACT_CONFIG, ROBOTCOPY_CONFIG, PactTestClient };

// Example usage:
/*
const robotCopy = createGenericEditorRobotCopy();

// Setup
await robotCopy.setup();

// Register a component
const componentData = {
    id: 'my-component',
    name: 'My Component',
    template: '<div>Hello World</div>',
    styles: 'div { color: blue; }',
    script: 'console.log("Hello");'
};

await robotCopy.registerComponent(componentData);

// Generate client
const client = await robotCopy.generateClient(componentData);

// Cleanup
await robotCopy.cleanup();
*/ 