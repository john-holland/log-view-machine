# Enhanced Generic Editor Features

## Overview

The Generic Editor has been enhanced with several new features to improve the development experience and provide better component management capabilities.

## 🎨 Canvas Layout Improvements

### Fixed Panel Positioning
- **Issue**: All editor panels were displaying on the same canvas without proper positioning
- **Solution**: Added absolute positioning with proper z-index management
- **Implementation**: 
  - Editor panels now use `position: absolute` with `top: 0` and `left: 0`
  - Added opacity transitions for smooth tab switching
  - Proper z-index management to prevent overlap issues

### Enhanced Visual Feedback
- **Smooth Transitions**: Added 0.3s opacity transitions for seamless tab switching
- **Proper Layering**: Each editor panel has its own layer with appropriate z-index
- **Responsive Design**: Panels adapt to container dimensions automatically

## 📱 Preview Tab (Default)

### New Preview Tab
- **Default Tab**: Preview tab is now the default active tab when the editor loads
- **Real-time Preview**: Shows live preview of the component being edited
- **Iframe Rendering**: Uses iframe to render the complete HTML with CSS and JavaScript
- **Auto-update**: Preview updates automatically when component content changes

### Preview Features
```javascript
// Preview content structure
<div class="editor-content" id="preview-editor">
    <div class="preview-content" id="preview-content">
        <div class="preview-placeholder">
            <h3>Component Preview</h3>
            <p>Preview your component here</p>
            <div id="preview-iframe-container">
                <!-- Preview iframe will be rendered here -->
            </div>
        </div>
    </div>
</div>
```

### Preview Update Function
```javascript
function updatePreview() {
    const previewContent = document.getElementById('preview-content');
    if (!previewContent || !currentComponent) return;

    const html = currentComponent.template || '';
    const css = currentComponent.styles || '';
    const js = currentComponent.script || '';

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

    // Clear existing content and create iframe
    previewContent.innerHTML = '';
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
```

## 🎨 View Template Controls

### Right Panel Controls
Added a new section in the right panel with view template management:

```html
<div class="panel-section">
    <h3>🎨 View Templates</h3>
    <div class="view-template-controls">
        <div class="view-template-selector">
            <select id="view-template-selector" onchange="switchViewTemplate()">
                <option value="">Select View Template</option>
                <option value="preview">Preview</option>
                <option value="html">HTML Editor</option>
                <option value="css">CSS Editor</option>
                <option value="js">JavaScript Editor</option>
                <option value="xstate">XState Editor</option>
            </select>
        </div>
        <div class="view-template-buttons">
            <button class="view-template-btn add" onclick="showAddViewTemplateModal()">Add</button>
            <button class="view-template-btn remove" onclick="removeViewTemplate()">Remove</button>
        </div>
    </div>
</div>
```

### Template Switching
- **Dropdown Selection**: Select from available view templates
- **Auto-pan**: Automatically switches to the selected template when dropdown changes
- **Add/Remove**: Add new templates or remove existing ones

### Add Template Modal
```html
<div class="view-template-modal" id="view-template-modal">
    <div class="view-template-modal-content">
        <div class="view-template-modal-header">
            <div class="view-template-modal-title">🎨 Add View Template</div>
            <button class="view-template-modal-close" onclick="hideViewTemplateModal()">&times;</button>
        </div>
        <div class="view-template-form">
            <div class="form-group">
                <label for="template-name">Template Name</label>
                <input type="text" id="template-name" placeholder="Enter template name" required>
            </div>
            <div class="form-group">
                <label for="template-type">Template Type</label>
                <select id="template-type" required>
                    <option value="">Select type</option>
                    <option value="html">HTML Editor</option>
                    <option value="css">CSS Editor</option>
                    <option value="js">JavaScript Editor</option>
                    <option value="xstate">XState Editor</option>
                    <option value="preview">Preview</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
            <div class="form-group">
                <label for="template-description">Description</label>
                <textarea id="template-description" placeholder="Enter template description"></textarea>
            </div>
            <div class="form-group">
                <label for="template-config">Configuration (JSON)</label>
                <textarea id="template-config" placeholder='{"key": "value"}'></textarea>
            </div>
        </div>
        <div class="view-template-modal-footer">
            <button class="modal-btn cancel" onclick="hideViewTemplateModal()">Cancel</button>
            <button class="modal-btn save" onclick="addViewTemplate()">Add Template</button>
        </div>
    </div>
</div>
```

### Template Management Functions
```javascript
// Switch to selected template
function switchViewTemplate() {
    const selector = document.getElementById('view-template-selector');
    const selectedValue = selector.value;
    
    if (selectedValue) {
        switchTab(selectedValue);
    }
}

// Add new template
function addViewTemplate() {
    const name = document.getElementById('template-name').value.trim();
    const type = document.getElementById('template-type').value;
    const description = document.getElementById('template-description').value.trim();
    const config = document.getElementById('template-config').value.trim();
    
    if (!name || !type) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const configObj = config ? JSON.parse(config) : {};
        
        // Add to selector
        const selector = document.getElementById('view-template-selector');
        const option = document.createElement('option');
        option.value = name.toLowerCase().replace(/\s+/g, '-');
        option.textContent = name;
        selector.appendChild(option);
        
        // Store template data
        if (!window.viewTemplates) {
            window.viewTemplates = [];
        }
        
        window.viewTemplates.push({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            type: type,
            description: description,
            config: configObj
        });
        
        hideViewTemplateModal();
    } catch (error) {
        alert('Invalid JSON configuration: ' + error.message);
    }
}

// Remove template
function removeViewTemplate() {
    const selector = document.getElementById('view-template-selector');
    const selectedValue = selector.value;
    
    if (!selectedValue) {
        alert('Please select a template to remove');
        return;
    }
    
    if (confirm(`Are you sure you want to remove the template "${selector.options[selector.selectedIndex].text}"?`)) {
        selector.remove(selector.selectedIndex);
        
        if (window.viewTemplates) {
            window.viewTemplates = window.viewTemplates.filter(template => template.id !== selectedValue);
        }
    }
}
```

## 🤖 RobotCopy PACT Integration

### Configuration
Created a comprehensive RobotCopy configuration with PACT test client integration:

```javascript
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

// PACT Test Client Configuration
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

### Generic Editor RobotCopy Class
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

### PACT Interactions
```javascript
async setupPactInteractions() {
    // Save component interaction
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

    // Load component interaction
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
```

## 🧪 Testing

### Test Configuration
```javascript
const TEST_CONFIG = {
    ...ROBOTCOPY_CONFIG,
    enableTracing: true,
    enableDataDog: false // Disable for testing
};

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
```

### Test Suite
```javascript
describe('RobotCopy PACT Integration', () => {
    let robotCopy;

    beforeAll(async () => {
        robotCopy = createGenericEditorRobotCopy(TEST_CONFIG);
        await robotCopy.setup();
    });

    afterAll(async () => {
        await robotCopy.cleanup();
    });

    describe('Component Registration', () => {
        it('should register a component successfully', async () => {
            const result = await robotCopy.registerComponent(TEST_COMPONENT);
            expect(result.success).toBe(true);
            expect(result.componentId).toBeDefined();
        });
    });

    describe('Component Loading', () => {
        it('should load a component successfully', async () => {
            const result = await robotCopy.loadComponent('test-component-123');
            expect(result.id).toBe('test-component-123');
            expect(result.name).toBe('test-component');
        });
    });

    describe('Client Generation', () => {
        it('should generate a client successfully', async () => {
            const client = await robotCopy.generateClient(TEST_COMPONENT);
            expect(client.machineId).toBe(TEST_COMPONENT.id);
            expect(client.description).toBeDefined();
        });
    });
});
```

## 🚀 Usage Examples

### Basic Usage
```javascript
// Create RobotCopy instance
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
```

### Browser Testing
```javascript
// Run tests in browser
window.testRobotCopyPact = async () => {
    try {
        const robotCopy = createGenericEditorRobotCopy(TEST_CONFIG);
        await robotCopy.setup();
        
        const registrationResult = await robotCopy.registerComponent(TEST_COMPONENT);
        const loadingResult = await robotCopy.loadComponent('test-component-123');
        const clientResult = await robotCopy.generateClient(TEST_COMPONENT);
        
        await robotCopy.cleanup();
        
        return {
            success: true,
            results: {
                registration: registrationResult,
                loading: loadingResult,
                clientGeneration: clientResult
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
};
```

## 📁 File Structure

```
generic-editor/
├── index.html                    # Main editor file with enhanced features
├── robotcopy-pact-config.js      # RobotCopy PACT integration
├── test-robotcopy-pact.js        # Test suite for RobotCopy PACT
├── ENHANCED_FEATURES.md         # This documentation
└── ...
```

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=development
PORT=3000
ROBOTCOPY_ENABLED=true
PACT_ENABLED=true
```

### RobotCopy Configuration
```javascript
const config = {
    unleashUrl: 'http://localhost:4242/api',
    unleashClientKey: 'default:development.unleash-insecure-api-token',
    unleashAppName: 'generic-editor-frontend',
    unleashEnvironment: 'development',
    kotlinBackendUrl: 'http://localhost:8080',
    nodeBackendUrl: 'http://localhost:3001',
    enableTracing: true,
    enableDataDog: true
};
```

## 🎯 Benefits

### Canvas Layout Improvements
- **Better Performance**: Proper positioning reduces layout thrashing
- **Smooth Transitions**: Opacity transitions provide better UX
- **Responsive Design**: Panels adapt to container changes

### Preview Tab
- **Real-time Feedback**: See changes immediately
- **Complete Rendering**: Full HTML/CSS/JS preview
- **Default Experience**: Preview-first workflow

### View Template Controls
- **Flexible Management**: Add/remove templates dynamically
- **Easy Navigation**: Dropdown for quick template switching
- **Custom Configuration**: JSON-based template configuration

### RobotCopy PACT Integration
- **Contract Testing**: Ensures API compatibility
- **Client Generation**: Automatic client code generation
- **State Management**: Integrated state machine support
- **Tracing**: Full request/response tracing

## 🔮 Future Enhancements

### Planned Features
- **Template Persistence**: Save templates to localStorage/database
- **Template Sharing**: Share templates between users
- **Advanced Preview**: Live editing in preview mode
- **Component Library**: Integration with component library
- **Version Control**: Git integration for templates
- **Collaboration**: Real-time collaboration features

### Technical Improvements
- **Performance**: Optimize canvas rendering
- **Accessibility**: Improve keyboard navigation
- **Mobile Support**: Responsive design improvements
- **Offline Support**: Service worker integration
- **PWA Features**: Progressive web app capabilities 