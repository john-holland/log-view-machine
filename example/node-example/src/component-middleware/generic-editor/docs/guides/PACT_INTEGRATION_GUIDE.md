# PACT Integration Guide for Editor UI Components

## Overview

This guide explains how the Generic Editor UI components are connected to PACT testing for RobotCopy functionality, providing **partial to full functionality** through a comprehensive state-to-test configuration mapping.

## 🎯 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Editor UI     │    │  State Manager   │    │  RobotCopy      │
│   Components    │◄──►│  + PACT Tests    │◄──►│  + PACT Client  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   UI States     │    │  Test Scenarios  │    │  API Contracts  │
│   (Tabs, etc.)  │    │  (PACT Tests)    │    │  (PACT Verify)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 State-to-Test Configuration Mapping

### Core Concept

By hooking up editor UI components to PACT for RobotCopy, we get:

1. **Partial Functionality**: Basic operations work with PACT contract verification
2. **Full Functionality**: Complete workflow with comprehensive testing
3. **Test Configuration Mapping**: State transitions mapped to test scenarios

### State Definitions

```javascript
const EDITOR_STATES = {
    IDLE: 'idle',           // No component loaded
    LOADING: 'loading',     // Loading component
    EDITING: 'editing',     // Component loaded, editing
    SAVING: 'saving',       // Saving component
    PREVIEWING: 'previewing', // Preview mode
    TESTING: 'testing',     // Running tests
    ERROR: 'error'          // Error state
};

const UI_COMPONENT_STATES = {
    // Tab States
    TAB_PREVIEW: 'preview',
    TAB_HTML: 'html',
    TAB_CSS: 'css',
    TAB_JS: 'js',
    TAB_XSTATE: 'xstate',
    
    // Panel States
    PANEL_LEFT_COLLAPSED: 'left-collapsed',
    PANEL_LEFT_EXPANDED: 'left-expanded',
    PANEL_RIGHT_COLLAPSED: 'right-collapsed',
    PANEL_RIGHT_EXPANDED: 'right-expanded',
    
    // Editor States
    EDITOR_READY: 'ready',
    EDITOR_DIRTY: 'dirty',
    EDITOR_SAVING: 'saving',
    EDITOR_ERROR: 'error',
    
    // Component States
    COMPONENT_LOADED: 'loaded',
    COMPONENT_MODIFIED: 'modified',
    COMPONENT_SAVED: 'saved',
    COMPONENT_PUBLISHED: 'published'
};
```

## 🧪 Test Configuration Mapping

### State-to-Test Mapping Structure

```javascript
const STATE_TEST_MAPPING = {
    [EDITOR_STATES.IDLE]: {
        description: 'Editor is idle, no component loaded',
        testScenarios: [
            {
                name: 'should_show_empty_state',
                pactInteraction: {
                    state: 'Editor is idle',
                    uponReceiving: 'a request to check editor state',
                    withRequest: {
                        method: 'GET',
                        path: '/api/editor/state'
                    },
                    willRespondWith: {
                        status: 200,
                        body: {
                            state: 'idle',
                            hasComponent: false,
                            message: 'No component loaded'
                        }
                    }
                },
                uiAssertions: [
                    'component-list should be empty',
                    'save-button should be disabled',
                    'preview should show placeholder'
                ]
            }
        ]
    }
    // ... more states
};
```

### UI Component Test Mapping

```javascript
const UI_COMPONENT_TEST_MAPPING = {
    [UI_COMPONENT_STATES.TAB_PREVIEW]: {
        testName: 'preview_tab_functionality',
        pactInteraction: {
            state: 'Preview tab is active',
            uponReceiving: 'a request to switch to preview tab',
            withRequest: {
                method: 'POST',
                path: '/api/editor/tabs',
                body: { activeTab: 'preview' }
            },
            willRespondWith: {
                status: 200,
                body: {
                    activeTab: 'preview',
                    content: 'preview-content',
                    isLive: true
                }
            }
        },
        uiAssertions: [
            'preview-tab should have active class',
            'preview-content should be visible',
            'other-tabs should not have active class',
            'preview-iframe should be rendered'
        ]
    }
    // ... more component states
};
```

## 🔧 RobotCopy PACT Integration

### Configuration

```javascript
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

const PACT_CONFIG = {
    consumer: 'GenericEditorConsumer',
    provider: 'GenericEditorProvider',
    logLevel: 'info',
    dir: './pacts',
    spec: 2
};
```

### PACT Test Client

```javascript
class PactTestClient {
    constructor(config = PACT_CONFIG) {
        this.config = config;
        this.interactions = [];
        this.provider = null;
    }

    setup() {
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
```

### Generic Editor RobotCopy

```javascript
class GenericEditorRobotCopy {
    constructor(config = ROBOTCOPY_CONFIG) {
        this.robotCopy = createRobotCopy(config);
        this.pactClient = new PactTestClient();
        this.stateMachine = createGenericEditorStateMachine();
        this.clientGenerator = createClientGenerator();
        
        this.setupPactInteractions();
    }

    async registerComponent(componentData) {
        try {
            const result = await this.robotCopy.sendMessage('saveComponent', componentData);
            await this.pactClient.verify();
            return result;
        } catch (error) {
            console.error('Error registering component:', error);
            throw error;
        }
    }

    async loadComponent(componentId) {
        try {
            const result = await this.robotCopy.sendMessage('loadComponent', { componentId });
            await this.pactClient.verify();
            return result;
        } catch (error) {
            console.error('Error loading component:', error);
            throw error;
        }
    }

    async generateClient(componentData) {
        try {
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
}
```

## 🎮 Editor State Manager

### State Management with PACT Testing

```javascript
class EditorStateManager {
    constructor() {
        this.currentState = EDITOR_STATES.IDLE;
        this.robotCopy = null;
        this.testRunner = null;
        this.stateHistory = [];
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize RobotCopy
            this.robotCopy = createGenericEditorRobotCopy();
            await this.robotCopy.setup();
            
            // Initialize Test Runner
            this.testRunner = new StateTestRunner(this.robotCopy);
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize Editor State Manager:', error);
            return false;
        }
    }

    // State transition with PACT testing
    async transitionToState(newState, context = {}) {
        if (!this.isInitialized) {
            throw new Error('Editor State Manager not initialized');
        }

        console.log(`🔄 Transitioning from ${this.currentState} to ${newState}`);
        
        // Record state transition
        this.stateHistory.push({
            from: this.currentState,
            to: newState,
            timestamp: new Date().toISOString(),
            context
        });

        // Run tests for the new state
        try {
            const testResults = await this.testRunner.runStateTests(newState);
            console.log(`✅ State transition tests completed for ${newState}`);
            
            // Update current state
            this.currentState = newState;
            
            // Update UI based on state
            await this.updateUIForState(newState, context);
            
            return {
                success: true,
                newState,
                testResults,
                context
            };
        } catch (error) {
            console.error(`❌ State transition failed for ${newState}:`, error);
            return {
                success: false,
                error: error.message,
                attemptedState: newState
            };
        }
    }
}
```

## 🧪 Test Runner Configuration

### State Test Runner

```javascript
class StateTestRunner {
    constructor(robotCopy) {
        this.robotCopy = robotCopy;
        this.currentState = EDITOR_STATES.IDLE;
        this.testResults = [];
    }

    // Run tests for a specific state
    async runStateTests(state) {
        const stateConfig = STATE_TEST_MAPPING[state];
        if (!stateConfig) {
            throw new Error(`No test configuration found for state: ${state}`);
        }

        console.log(`🧪 Running tests for state: ${state}`);
        console.log(`📝 Description: ${stateConfig.description}`);

        const results = [];
        for (const scenario of stateConfig.testScenarios) {
            try {
                const result = await this.runTestScenario(scenario);
                results.push(result);
            } catch (error) {
                console.error(`❌ Test scenario failed: ${scenario.name}`, error);
                results.push({
                    name: scenario.name,
                    success: false,
                    error: error.message
                });
            }
        }

        this.testResults.push({
            state,
            scenarios: results,
            timestamp: new Date().toISOString()
        });

        return results;
    }

    // Run a specific test scenario
    async runTestScenario(scenario) {
        console.log(`  🔍 Running scenario: ${scenario.name}`);

        // Setup PACT interaction
        if (scenario.pactInteraction) {
            await this.robotCopy.pactClient.addInteraction(scenario.pactInteraction);
        }

        // Execute the test
        const testResult = await this.executeTest(scenario);

        // Verify PACT interaction
        if (scenario.pactInteraction) {
            await this.robotCopy.pactClient.verify();
        }

        // Run UI assertions
        const uiResults = await this.runUIAssertions(scenario.uiAssertions);

        return {
            name: scenario.name,
            success: testResult.success && uiResults.every(r => r.success),
            testResult,
            uiResults,
            timestamp: new Date().toISOString()
        };
    }
}
```

## 🎯 Functionality Levels

### Partial Functionality

**What works:**
- Basic state transitions with PACT verification
- UI component state management
- Tab switching with test validation
- Component loading/saving with contract testing
- Error handling with PACT verification

**Example:**
```javascript
// Basic component loading with PACT testing
const stateManager = new EditorStateManager();
await stateManager.initialize();

// Load component (triggers PACT verification)
const component = await stateManager.loadComponent('test-component-123');

// Switch to preview (triggers UI component tests)
await stateManager.switchToTab('preview');
```

### Full Functionality

**What works:**
- Complete workflow with comprehensive testing
- All editor states with PACT verification
- UI component tests for all interactions
- Client generation with RobotCopy
- Error handling and retry mechanisms
- Test result reporting and analytics

**Example:**
```javascript
// Full integration demo
const demo = new IntegrationTestDemo();
await demo.initialize();
await demo.runFullDemo();
const results = demo.getDemoResults();

console.log('Demo Results:', results);
// {
//   testResults: [...],
//   summary: { totalTests: 25, passedTests: 23, successRate: 92 },
//   stateInfo: { currentState: 'editing', stateHistory: [...] }
// }
```

## 🔄 State Transition Flow

### Complete State Flow

```
1. IDLE → LOADING → EDITING → SAVING → EDITING
2. EDITING → PREVIEWING → EDITING
3. EDITING → TESTING → EDITING
4. Any State → ERROR → Retry → Previous State
```

### UI Component Flow

```
Tab Switch: HTML → CSS → JS → XState → Preview
Panel State: Collapsed → Expanded → Collapsed
Editor State: Ready → Dirty → Saving → Ready
Component State: Loaded → Modified → Saved → Published
```

## 🧪 Test Scenarios

### State Test Scenarios

1. **Idle State**
   - Empty component list
   - Disabled save button
   - Placeholder preview

2. **Loading State**
   - Loading indicator visible
   - Disabled tabs
   - Loading message

3. **Editing State**
   - All editors enabled
   - Auto-updating preview
   - Enabled save button
   - Functional tabs

4. **Saving State**
   - Loading save button
   - Disabled other actions
   - Progress indicator

5. **Previewing State**
   - Active preview tab
   - Live preview iframe
   - Accessible other tabs

6. **Testing State**
   - Test results panel
   - Coverage report
   - Test status display

7. **Error State**
   - Error message display
   - Retry button
   - Error details
   - Fallback state

### UI Component Test Scenarios

1. **Tab Functionality**
   - Tab switching
   - Active class management
   - Content visibility
   - Editor initialization

2. **Panel Management**
   - Panel collapse/expand
   - Resize functionality
   - State persistence

3. **Editor Integration**
   - Editor initialization
   - Content synchronization
   - Auto-save functionality

## 📊 Test Results and Analytics

### Test Summary Structure

```javascript
{
    totalTests: 25,
    passedTests: 23,
    failedTests: 2,
    successRate: 92.0,
    results: [
        {
            state: 'editing',
            scenarios: [
                {
                    name: 'should_allow_component_editing',
                    success: true,
                    testResult: { ... },
                    uiResults: [ ... ]
                }
            ],
            timestamp: '2024-01-01T00:00:00.000Z'
        }
    ]
}
```

### Integration Demo Results

```javascript
{
    testResults: [
        {
            step: 1,
            name: 'Idle State Test',
            success: true,
            state: 'idle',
            testResults: [ ... ]
        },
        // ... more test results
    ],
    summary: {
        totalTests: 25,
        passedTests: 23,
        failedTests: 2,
        successRate: 92.0
    },
    stateInfo: {
        currentState: 'editing',
        stateHistory: [ ... ],
        isInitialized: true
    }
}
```

## 🚀 Usage Examples

### Basic Usage

```javascript
// Initialize
const stateManager = new EditorStateManager();
await stateManager.initialize();

// Load a component
const component = await stateManager.loadComponent('test-component-123');

// Save a component
await stateManager.saveComponent(component);

// Switch to preview
await stateManager.switchToTab('preview');

// Generate client
const client = await stateManager.generateClient(component);

// Get test results
const summary = stateManager.getTestResultsSummary();
console.log('Test Summary:', summary);

// Cleanup
await stateManager.cleanup();
```

### Advanced Usage

```javascript
// Run full integration demo
const demo = new IntegrationTestDemo();
await demo.initialize();
await demo.runFullDemo();
const results = demo.getDemoResults();

// Access detailed results
console.log('Test Results:', results.testResults);
console.log('PACT Summary:', results.summary);
console.log('State Info:', results.stateInfo);

// Cleanup
await demo.cleanup();
```

### Browser Integration

```javascript
// Global function for browser
const results = await window.runIntegrationDemo();
console.log('Demo Results:', results);

// Or use the class directly
const demo = new IntegrationTestDemo();
await demo.initialize();
await demo.runFullDemo();
const results = demo.getDemoResults();
```

## 📁 File Structure

```
generic-editor/
├── index.html                           # Main editor with enhanced features
├── robotcopy-pact-config.js             # RobotCopy PACT configuration
├── state-test-mapping.js                # State-to-test configuration mapping
├── editor-pact-integration.js           # Editor state manager with PACT
├── integration-test-demo.js             # Full integration demo
├── test-robotcopy-pact.js              # RobotCopy PACT test suite
├── ENHANCED_FEATURES.md                # Enhanced features documentation
└── PACT_INTEGRATION_GUIDE.md           # This guide
```

## 🎯 Benefits

### Partial Functionality Benefits
- **Contract Testing**: Ensures API compatibility
- **State Management**: Proper state transitions
- **Error Handling**: Graceful error management
- **UI Validation**: Basic UI component testing

### Full Functionality Benefits
- **Comprehensive Testing**: All states and components tested
- **Client Generation**: Automatic client code generation
- **Analytics**: Detailed test result reporting
- **Integration**: Complete workflow integration
- **Reliability**: Robust error handling and retry mechanisms

## 🔮 Future Enhancements

### Planned Features
- **Real-time Testing**: Live PACT verification during development
- **Visual Test Results**: UI for viewing test results
- **Custom Test Scenarios**: User-defined test configurations
- **Performance Testing**: Load testing with PACT
- **Integration Testing**: End-to-end workflow testing

### Technical Improvements
- **Parallel Testing**: Concurrent test execution
- **Test Caching**: Cached test results for performance
- **Test Prioritization**: Priority-based test execution
- **Test Reporting**: Advanced reporting and analytics
- **Test Automation**: Automated test execution

## 🎉 Conclusion

By connecting editor UI components to PACT testing for RobotCopy, we achieve:

1. **Partial to Full Functionality**: From basic operations to complete workflows
2. **Comprehensive Testing**: All states and components tested with PACT
3. **Reliable Integration**: Contract-based API testing ensures compatibility
4. **State Management**: Proper state transitions with test validation
5. **Client Generation**: Automatic client code generation for components
6. **Error Handling**: Robust error handling with retry mechanisms
7. **Analytics**: Detailed test result reporting and analytics

This architecture provides a solid foundation for building reliable, testable, and maintainable editor applications with comprehensive PACT integration. 