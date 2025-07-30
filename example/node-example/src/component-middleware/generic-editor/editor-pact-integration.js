// Editor PACT Integration
// Connects editor UI components to PACT test mapping for RobotCopy functionality

import { createGenericEditorRobotCopy } from './robotcopy-pact-config.js';
import { StateTestRunner, EDITOR_STATES, UI_COMPONENT_STATES } from './state-test-mapping.js';

// Editor State Manager
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
            console.log('🚀 Initializing Editor State Manager...');
            
            // Initialize RobotCopy
            this.robotCopy = createGenericEditorRobotCopy();
            await this.robotCopy.setup();
            
            // Initialize Test Runner
            this.testRunner = new StateTestRunner(this.robotCopy);
            
            this.isInitialized = true;
            console.log('✅ Editor State Manager initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Editor State Manager:', error);
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

    // Update UI based on state
    async updateUIForState(state, context) {
        console.log(`🎨 Updating UI for state: ${state}`);
        
        switch (state) {
            case EDITOR_STATES.IDLE:
                await this.updateUIForIdleState();
                break;
            case EDITOR_STATES.LOADING:
                await this.updateUIForLoadingState(context);
                break;
            case EDITOR_STATES.EDITING:
                await this.updateUIForEditingState(context);
                break;
            case EDITOR_STATES.SAVING:
                await this.updateUIForSavingState(context);
                break;
            case EDITOR_STATES.PREVIEWING:
                await this.updateUIForPreviewingState(context);
                break;
            case EDITOR_STATES.TESTING:
                await this.updateUIForTestingState(context);
                break;
            case EDITOR_STATES.ERROR:
                await this.updateUIForErrorState(context);
                break;
            default:
                console.warn(`Unknown state: ${state}`);
        }
    }

    // UI Update Methods for Each State
    async updateUIForIdleState() {
        // Disable save button
        const saveBtn = document.getElementById('save-component-btn');
        if (saveBtn) saveBtn.disabled = true;
        
        // Clear component list
        const componentList = document.getElementById('component-list');
        if (componentList) componentList.innerHTML = '<p>No components loaded</p>';
        
        // Show placeholder in preview
        const previewContent = document.getElementById('preview-content');
        if (previewContent) {
            previewContent.innerHTML = `
                <div class="preview-placeholder">
                    <h3>Component Preview</h3>
                    <p>No component loaded</p>
                </div>
            `;
        }
    }

    async updateUIForLoadingState(context) {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loading');
        if (loadingIndicator) loadingIndicator.style.display = 'flex';
        
        // Disable tabs during loading
        const tabs = document.querySelectorAll('.header-tab');
        tabs.forEach(tab => tab.disabled = true);
        
        // Show loading message
        const currentComponentInfo = document.getElementById('current-component-info');
        if (currentComponentInfo) {
            currentComponentInfo.innerHTML = '<p>Loading component...</p>';
        }
    }

    async updateUIForEditingState(context) {
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loading');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Enable tabs
        const tabs = document.querySelectorAll('.header-tab');
        tabs.forEach(tab => tab.disabled = false);
        
        // Enable save button
        const saveBtn = document.getElementById('save-component-btn');
        if (saveBtn) saveBtn.disabled = false;
        
        // Update component info
        if (context.component) {
            const currentComponentInfo = document.getElementById('current-component-info');
            if (currentComponentInfo) {
                currentComponentInfo.innerHTML = `
                    <p><strong>Name:</strong> ${context.component.name}</p>
                    <p><strong>ID:</strong> ${context.component.id}</p>
                    <p><strong>Status:</strong> Editing</p>
                `;
            }
        }
        
        // Update preview
        if (context.component) {
            await this.updatePreview(context.component);
        }
    }

    async updateUIForSavingState(context) {
        // Show saving indicator
        const saveBtn = document.getElementById('save-component-btn');
        if (saveBtn) {
            saveBtn.innerHTML = '💾 Saving...';
            saveBtn.disabled = true;
        }
        
        // Disable other actions
        const actionButtons = document.querySelectorAll('.btn:not(#save-component-btn)');
        actionButtons.forEach(btn => btn.disabled = true);
    }

    async updateUIForPreviewingState(context) {
        // Switch to preview tab
        await this.switchToTab('preview');
        
        // Update preview content
        if (context.component) {
            await this.updatePreview(context.component);
        }
    }

    async updateUIForTestingState(context) {
        // Show test results panel
        const testResultsPanel = document.createElement('div');
        testResultsPanel.id = 'test-results-panel';
        testResultsPanel.className = 'test-results-panel';
        testResultsPanel.innerHTML = `
            <h3>🧪 Test Results</h3>
            <div class="test-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <p class="test-status">Running tests...</p>
            </div>
        `;
        
        // Add to right panel
        const rightPanel = document.querySelector('.right-panel');
        if (rightPanel) {
            rightPanel.appendChild(testResultsPanel);
        }
    }

    async updateUIForErrorState(context) {
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h3>❌ Error</h3>
            <p>${context.error || 'An error occurred'}</p>
            <button onclick="window.editorStateManager.retryLastAction()">Retry</button>
        `;
        
        // Add to main area
        const mainEditor = document.querySelector('.main-editor');
        if (mainEditor) {
            mainEditor.appendChild(errorMessage);
        }
    }

    // Tab switching with PACT testing
    async switchToTab(tabName) {
        console.log(`📑 Switching to tab: ${tabName}`);
        
        // Run UI component tests for the tab
        const componentState = `TAB_${tabName.toUpperCase()}`;
        if (UI_COMPONENT_STATES[componentState]) {
            try {
                const testResult = await this.testRunner.runUIComponentTests(UI_COMPONENT_STATES[componentState]);
                console.log(`✅ Tab switch tests completed for ${tabName}`);
            } catch (error) {
                console.error(`❌ Tab switch tests failed for ${tabName}:`, error);
            }
        }
        
        // Perform the actual tab switch
        switchTab(tabName);
    }

    // Component operations with PACT testing
    async loadComponent(componentId) {
        console.log(`📖 Loading component: ${componentId}`);
        
        // Transition to loading state
        await this.transitionToState(EDITOR_STATES.LOADING, { componentId });
        
        try {
            // Load component via RobotCopy
            const component = await this.robotCopy.loadComponent(componentId);
            
            // Transition to editing state
            await this.transitionToState(EDITOR_STATES.EDITING, { component });
            
            return component;
        } catch (error) {
            console.error(`❌ Failed to load component: ${componentId}`, error);
            await this.transitionToState(EDITOR_STATES.ERROR, { error: error.message });
            throw error;
        }
    }

    async saveComponent(componentData) {
        console.log(`💾 Saving component: ${componentData.id}`);
        
        // Transition to saving state
        await this.transitionToState(EDITOR_STATES.SAVING, { component: componentData });
        
        try {
            // Save component via RobotCopy
            const result = await this.robotCopy.registerComponent(componentData);
            
            // Transition back to editing state
            await this.transitionToState(EDITOR_STATES.EDITING, { component: componentData });
            
            return result;
        } catch (error) {
            console.error(`❌ Failed to save component: ${componentData.id}`, error);
            await this.transitionToState(EDITOR_STATES.ERROR, { error: error.message });
            throw error;
        }
    }

    async generateClient(componentData) {
        console.log(`🔧 Generating client for component: ${componentData.id}`);
        
        try {
            // Generate client via RobotCopy
            const client = await this.robotCopy.generateClient(componentData);
            
            console.log('✅ Client generated successfully:', client);
            return client;
        } catch (error) {
            console.error(`❌ Failed to generate client: ${componentData.id}`, error);
            throw error;
        }
    }

    // Preview update
    async updatePreview(component) {
        console.log(`👁️ Updating preview for component: ${component.id}`);
        
        const previewContent = document.getElementById('preview-content');
        if (!previewContent || !component) return;

        const html = component.template || '';
        const css = component.styles || '';
        const js = component.script || '';

        const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Component Preview</title>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}</script>
            </body>
            </html>
        `;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Clear existing content
        previewContent.innerHTML = '';

        // Create iframe for preview
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '4px';

        previewContent.appendChild(iframe);

        // Clean up URL after iframe loads
        iframe.onload = () => {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
    }

    // Retry last action
    async retryLastAction() {
        if (this.stateHistory.length > 0) {
            const lastAction = this.stateHistory[this.stateHistory.length - 1];
            console.log(`🔄 Retrying last action: ${lastAction.from} -> ${lastAction.to}`);
            
            await this.transitionToState(lastAction.to, lastAction.context);
        }
    }

    // Get current state info
    getCurrentStateInfo() {
        return {
            currentState: this.currentState,
            stateHistory: this.stateHistory,
            isInitialized: this.isInitialized
        };
    }

    // Get test results summary
    getTestResultsSummary() {
        if (this.testRunner) {
            return this.testRunner.getTestResultsSummary();
        }
        return null;
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Editor State Manager...');
        
        if (this.robotCopy) {
            await this.robotCopy.cleanup();
        }
        
        this.isInitialized = false;
        console.log('✅ Editor State Manager cleaned up');
    }
}

// Global editor state manager instance
window.editorStateManager = new EditorStateManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Editor PACT Integration...');
    
    try {
        const initialized = await window.editorStateManager.initialize();
        if (initialized) {
            console.log('✅ Editor PACT Integration ready');
            
            // Set up event listeners for UI components
            setupUIEventListeners();
        } else {
            console.error('❌ Failed to initialize Editor PACT Integration');
        }
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
});

// Setup UI event listeners
function setupUIEventListeners() {
    // Tab switching
    document.querySelectorAll('.header-tab').forEach(tab => {
        tab.addEventListener('click', async (event) => {
            const tabName = event.target.textContent.toLowerCase().replace(/\s+/g, '');
            await window.editorStateManager.switchToTab(tabName);
        });
    });

    // Save button
    const saveBtn = document.getElementById('save-component-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const currentComponent = window.currentComponent;
            if (currentComponent) {
                await window.editorStateManager.saveComponent(currentComponent);
            }
        });
    }

    // Load component button
    const loadBtn = document.querySelector('button[onclick="loadComponent()"]');
    if (loadBtn) {
        loadBtn.addEventListener('click', async () => {
            const componentId = 'test-component-123'; // This would come from UI
            await window.editorStateManager.loadComponent(componentId);
        });
    }

    // View template selector
    const templateSelector = document.getElementById('view-template-selector');
    if (templateSelector) {
        templateSelector.addEventListener('change', async (event) => {
            const selectedValue = event.target.value;
            if (selectedValue) {
                await window.editorStateManager.switchToTab(selectedValue);
            }
        });
    }
}

// Export for use in other modules
export { EditorStateManager };

// Example usage:
/*
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
*/ 