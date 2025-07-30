# Component Middleware

A comprehensive middleware system for managing component integrations, state machines, and visual development tools. This module provides integrations with TeleportHQ, Jump Server UI, and a Generic Editor with dotCMS integration.

## Overview

The Component Middleware provides three main integrations:

1. **TeleportHQ Integration** - Template management and real-time collaboration
2. **Jump Server UI Integration** - Component libraries and design systems
3. **Generic Editor Integration** - dotCMS integration with XState visualizer and SunEditor

## Quick Start

### Installation

```bash
cd example/node-example/src/component-middleware
npm install
```

### Basic Usage

```javascript
const { createComponentMiddlewareManager } = require('./index.js');

const middleware = createComponentMiddlewareManager({
  teleportHQ: {
    apiKey: process.env.TELEPORTHQ_API_KEY,
    projectId: process.env.TELEPORTHQ_PROJECT_ID,
    enabled: true
  },
  jumpServerUI: {
    apiKey: process.env.JUMPSERVER_API_KEY,
    projectId: process.env.JUMPSERVER_PROJECT_ID,
    enabled: true
  },
  genericEditor: {
    dotCMSUrl: process.env.DOTCMS_URL,
    dotCMSApiKey: process.env.DOTCMS_API_KEY,
    enabled: true
  }
});

await middleware.initialize();
```

## Integrations

### 1. TeleportHQ Integration

TeleportHQ provides template management with real-time collaboration features.

#### Features
- Template loading and caching
- ViewStateMachine conversion
- Real-time collaboration
- Template versioning and publishing
- Advanced state management
- Performance optimization

#### Usage

```javascript
const teleportHQ = middleware.getTeleportHQ();

// Load template
await teleportHQ.loadTemplate('checkout-form');

// Create ViewStateMachine
const viewStateMachine = teleportHQ.createViewStateMachineFromTemplate('checkout-form', {
  formData: {},
  validationErrors: [],
  isSubmitting: false
});

// Connect templates
teleportHQ.connectTemplates('checkout-form', 'payment-form', {
  eventMapping: { 'SUBMIT_ORDER': 'PROCESS_PAYMENT' },
  stateMapping: { 'formData.total': 'paymentAmount' }
});
```

#### Demo

```javascript
const { runTeleportHQDemo } = require('./teleportHQ/demo.js');
await runTeleportHQDemo();
```

### 2. Jump Server UI Integration

Jump Server UI provides component libraries and design systems with advanced theming and styling.

#### Features
- Component library management
- Design system integration
- Advanced theming and styling
- Responsive design features
- Animation and accessibility
- Real-time collaboration

#### Usage

```javascript
const jumpServerUI = middleware.getJumpServerUI();

// Load component library
await jumpServerUI.loadComponentLibraries();

// Load design system
await jumpServerUI.loadDesignSystems();

// Create ViewStateMachine from template
const viewStateMachine = jumpServerUI.createViewStateMachineFromTemplate('checkout-form', {
  formData: {},
  validationErrors: [],
  isSubmitting: false
});

// Apply theme
const template = jumpServerUI.getTemplate('checkout-form');
template.applyTheme({
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#f59e0b'
});
```

#### Demo

```javascript
const { runJumpServerUIDemo } = require('./jumpServerUI/demo.js');
await runJumpServerUIDemo();
```

### 3. Generic Editor Integration

Generic Editor provides dotCMS integration with XState visualizer and SunEditor for comprehensive component management.

#### Features
- dotCMS component loading and management
- XState visualizer integration
- SunEditor for HTML/CSS editing
- Ace Editor for JSON configuration
- React DnD for workflow creation
- Versioning and review workflow
- Component template management

#### Usage

```javascript
const genericEditor = middleware.getGenericEditor();

// Load components from dotCMS
await genericEditor.loadComponents();

// Load state machines from dotCMS
await genericEditor.loadStateMachines();

// Create ViewStateMachine
const viewStateMachine = genericEditor.createViewStateMachine(
  'checkout-form',
  'checkout-state-machine',
  { formData: {}, validationErrors: [] }
);

// Create component editor
const componentEditor = await genericEditor.createComponentEditor('checkout-form');

// Create state machine editor
const stateMachineEditor = await genericEditor.createStateMachineEditor('checkout-state-machine');

// Create workflow editor
const workflowEditor = await genericEditor.createWorkflowEditor();
```

#### Demo

```javascript
const { runGenericEditorDemo } = require('./generic-editor/demo.js');
await runGenericEditorDemo();
```

## Configuration

### Environment Variables

```bash
# TeleportHQ
TELEPORTHQ_API_KEY=your-api-key
TELEPORTHQ_PROJECT_ID=your-project-id
TELEPORTHQ_PORT=3001

# Jump Server UI
JUMPSERVER_API_KEY=your-api-key
JUMPSERVER_PROJECT_ID=your-project-id

# Generic Editor / dotCMS
DOTCMS_URL=http://localhost:8080
DOTCMS_API_KEY=your-api-key
DOTCMS_WORKSPACE=default
```

### Configuration Options

```javascript
const config = {
  teleportHQ: {
    apiKey: process.env.TELEPORTHQ_API_KEY,
    projectId: process.env.TELEPORTHQ_PROJECT_ID,
    environment: process.env.NODE_ENV,
    enableRealTimeSync: true,
    enableComponentStateSync: true,
    enableCollaboration: true,
    enableVersioning: true,
    enabled: true
  },
  jumpServerUI: {
    apiKey: process.env.JUMPSERVER_API_KEY,
    projectId: process.env.JUMPSERVER_PROJECT_ID,
    environment: process.env.NODE_ENV,
    enableRealTimeSync: true,
    enableComponentStateSync: true,
    enableDesignSystemSync: true,
    enableComponentLibrarySync: true,
    enabled: true
  },
  genericEditor: {
    dotCMSUrl: process.env.DOTCMS_URL,
    dotCMSApiKey: process.env.DOTCMS_API_KEY,
    dotCMSWorkspace: process.env.DOTCMS_WORKSPACE,
    enableXStateVisualizer: true,
    enableSunEditor: true,
    enableAceEditor: true,
    enableReactDnD: true,
    enableVersioning: true,
    enableReviewWorkflow: true,
    enabled: true
  }
};
```

## API Reference

### ComponentMiddlewareManager

#### Methods

- `initialize()` - Initialize all middleware
- `getTeleportHQ()` - Get TeleportHQ template manager
- `getJumpServerUI()` - Get Jump Server UI adapter
- `getGenericEditor()` - Get Generic Editor
- `registerMiddleware(name, middleware)` - Register custom middleware
- `getMiddleware(name)` - Get registered middleware
- `getAllMiddleware()` - Get all registered middleware
- `getStatus()` - Get middleware status

### TeleportHQ Integration

#### Classes

- `TeleportHQAdapter` - Main adapter class
- `TeleportHQConfig` - Configuration class
- `TeleportHQComponent` - Component class
- `TeleportHQTemplate` - Template class

#### Methods

- `loadTemplate(templateId, options)` - Load template
- `createViewStateMachineFromTemplate(templateId, initialState)` - Create ViewStateMachine
- `connectTemplates(sourceTemplateId, targetTemplateId, config)` - Connect templates
- `syncWithTeleportHQ(viewStateMachine, templateId)` - Sync with TeleportHQ
- `exportToTeleportHQ(templateId, state)` - Export to TeleportHQ

### Jump Server UI Integration

#### Classes

- `JumpServerUIAdapter` - Main adapter class
- `JumpServerUIConfig` - Configuration class
- `JumpServerUIComponent` - Component class
- `JumpServerUITemplate` - Template class

#### Methods

- `loadComponentLibraries()` - Load component libraries
- `loadDesignSystems()` - Load design systems
- `loadTemplate(templateId, options)` - Load template
- `createViewStateMachineFromTemplate(templateId, initialState)` - Create ViewStateMachine
- `connectTemplates(sourceTemplateId, targetTemplateId, config)` - Connect templates
- `exportToJumpServer(templateId, state)` - Export to Jump Server

### Generic Editor Integration

#### Classes

- `GenericEditor` - Main editor class
- `GenericEditorConfig` - Configuration class
- `DotCMSComponentTemplate` - Component template class
- `XStateConfiguration` - XState configuration class

#### Methods

- `loadComponents()` - Load components from dotCMS
- `loadStateMachines()` - Load state machines from dotCMS
- `createViewStateMachine(componentId, stateMachineId, initialState)` - Create ViewStateMachine
- `createComponentEditor(componentId)` - Create component editor
- `createStateMachineEditor(stateMachineId)` - Create state machine editor
- `createWorkflowEditor()` - Create workflow editor

## Fish Burger Integration

All three integrations support Fish Burger backend integration:

```javascript
// TeleportHQ
const { integrateWithFishBurger } = require('./teleportHQ/demo.js');
const fishBurgerIntegration = await integrateWithFishBurger(teleportHQ);

// Jump Server UI
const { integrateWithFishBurger } = require('./jumpServerUI/demo.js');
const fishBurgerIntegration = await integrateWithFishBurger(jumpServerUI);

// Generic Editor
const { integrateWithFishBurger } = require('./generic-editor/demo.js');
const fishBurgerIntegration = await integrateWithFishBurger(genericEditor);
```

## Demos

### Run All Demos

```javascript
const { 
  runTeleportHQDemo, 
  runJumpServerUIDemo, 
  runGenericEditorDemo 
} = require('./index.js');

// Run TeleportHQ demo
await runTeleportHQDemo();

// Run Jump Server UI demo
await runJumpServerUIDemo();

// Run Generic Editor demo
await runGenericEditorDemo();
```

### Individual Demo Features

#### TeleportHQ Demo
- Basic template management
- Advanced state management
- Template connections and workflows
- Real-time collaboration
- Template versioning and publishing
- Integration with Fish Burger
- Performance and caching
- Advanced validation and error handling

#### Jump Server UI Demo
- Component libraries and design systems
- Advanced template management
- Theming and styling
- Responsive design and animations
- Accessibility and performance
- Real-time collaboration
- Integration with Fish Burger
- Advanced features

#### Generic Editor Demo
- dotCMS integration
- Component template management
- XState visualizer integration
- SunEditor integration
- Ace Editor integration
- React DnD workflow creation
- Versioning and review workflow
- Integration with Fish Burger

## Architecture

```
Component Middleware
├── TeleportHQ Integration
│   ├── Template Management
│   ├── ViewStateMachine Conversion
│   ├── Real-time Collaboration
│   └── Versioning & Publishing
├── Jump Server UI Integration
│   ├── Component Libraries
│   ├── Design Systems
│   ├── Theming & Styling
│   └── Responsive Design
└── Generic Editor Integration
    ├── dotCMS Integration
    ├── XState Visualizer
    ├── SunEditor
    ├── Ace Editor
    └── React DnD
```

## Development

### Adding New Integrations

1. Create integration directory
2. Implement adapter class
3. Add configuration class
4. Create demo functions
5. Update ComponentMiddlewareManager
6. Update exports in index.js

### Testing

```bash
# Run all tests
npm test

# Run specific integration tests
npm test -- --grep "TeleportHQ"
npm test -- --grep "Jump Server UI"
npm test -- --grep "Generic Editor"
```

## Contributing

When adding new features:

1. Update the demo to showcase new features
2. Add comprehensive error handling
3. Include validation for new functionality
4. Update documentation
5. Add tests for new features

## License

This component middleware is part of the log-view-machine project and follows the same license terms. 