# Generic Editor - Refactored with Log View Model

## Overview

The Generic Editor has been completely refactored to use the **log-view-model** and implements a **hierarchical template structure** where each component is exported as a standalone template. This approach provides better modularity, reusability, and state management.

## 🏗️ Architecture

### Hierarchical Template Structure

```
generic-editor/
├── templates/
│   ├── index.js                    # Main template registry
│   ├── generic-editor/             # Main editor template
│   │   └── index.js
│   ├── html-editor/                # HTML editor template
│   │   └── index.js
│   ├── css-editor/                 # CSS editor template
│   │   └── index.js
│   ├── javascript-editor/          # JavaScript editor template
│   │   └── index.js
│   ├── xstate-editor/             # XState editor template
│   │   └── index.js
│   └── component-library/          # Component library template
│       └── index.js
├── index-new.js                    # Refactored main index
├── demo-refactored.js              # Demo script
└── README-REFACTORED.md           # This file
```

### Template Hierarchy

Each template is a **standalone component** that can be used independently or composed together:

1. **Generic Editor Template** - Main composer that integrates all other templates
2. **HTML Editor Template** - WYSIWYG HTML editor with SunEditor
3. **CSS Editor Template** - Ace editor for CSS with syntax highlighting
4. **JavaScript Editor Template** - Ace editor for JavaScript with syntax highlighting
5. **XState Editor Template** - XState visualization with recursive substate support
6. **Component Library Template** - Drag and drop component library

## 🚀 Key Features

### ✅ Log View Model Integration

- **State Management**: Each template uses XState for state management
- **Logging**: Built-in logging with context-aware messages
- **Event Handling**: Structured event system with type safety
- **Composition**: Templates can be composed and nested

### ✅ Hierarchical Template Structure

- **Standalone Templates**: Each component is a self-contained template
- **Independent Usage**: Templates can be used individually
- **Composition**: Templates can be composed into larger systems
- **Reusability**: Templates can be reused across different projects

### ✅ Advanced Features

- **Recursive XState Visualization**: Support for nested state machines
- **Improved Touch Analysis**: Better multi-touch gesture recognition
- **Panel Resizing**: Draggable grabbers for panel resizing
- **Drag & Drop**: Component library with drag and drop functionality
- **Save Status**: Real-time save status with diff visualization
- **localStorage Persistence**: Client-side persistence across page refreshes

## 📦 Template Structure

### Base Template Interface

Each template implements this interface:

```javascript
const TemplateName = {
  id: 'template-id',
  name: 'Template Name',
  description: 'Template description',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  config: {
    machineId: 'template-machine',
    xstateConfig: {
      // XState configuration
    }
  },
  
  create: (config = {}) => {
    return createViewStateMachine({
      // Template implementation
    });
  }
};
```

### State Machine Integration

Each template uses XState for state management:

```javascript
logStates: {
  ready: async (context) => {
    await context.log('Template ready');
    return context.view(
      <div className="template-component">
        {/* Template UI */}
      </div>
    );
  },
  editing: async (context) => {
    await context.log('Template editing');
    return context.view(
      <div className="template-component editing">
        {/* Editing UI */}
      </div>
    );
  }
}
```

## 🎯 Usage Examples

### Creating Individual Templates

```javascript
const { createTemplate } = require('./index-new');

// Create individual templates
const htmlEditor = createTemplate('html-editor');
const cssEditor = createTemplate('css-editor');
const jsEditor = createTemplate('javascript-editor');
const xstateEditor = createTemplate('xstate-editor');
const componentLibrary = createTemplate('component-library');
```

### Creating the Main Editor

```javascript
const { createGenericEditor } = require('./index-new');

// Create the main editor
const editor = createGenericEditor({
  enablePersistence: true,
  autoSaveInterval: 5000
});

const mainEditor = editor.createEditor();
```

### Sending Events

```javascript
// Send events to transition states
mainEditor.send({ type: 'LOAD_COMPONENT' });
mainEditor.send({ type: 'COMPONENT_LOADED' });
mainEditor.send({ type: 'OPEN_LIBRARY' });
```

### Rendering Templates

```javascript
// Render with a model
const model = {
  content: '<div>Sample content</div>',
  metadata: { author: 'User', created: new Date() }
};

const rendered = mainEditor.render(model);
```

## 🔧 Configuration

### Generic Editor Configuration

```javascript
const config = {
  enablePersistence: true,           // Enable localStorage persistence
  enableFishBurgerIntegration: true, // Enable Fish Burger integration
  autoSaveInterval: 5000,           // Auto-save interval in ms
  // ... other options
};
```

### Template Configuration

```javascript
const templateConfig = {
  xstateConfig: {
    // Override XState configuration
  },
  logStates: {
    // Override state handlers
  }
};
```

## 🧪 Testing

### Running the Demo

```bash
# Run the refactored demo
node demo-refactored.js
```

### Demo Features

The demo showcases:

1. **Basic Template Creation** - Creating individual templates
2. **Main Editor Composition** - Composing templates into main editor
3. **State Machine Events** - Testing state transitions
4. **Template Rendering** - Rendering templates with models
5. **Fish Burger Integration** - Integration with Fish Burger demo

## 📊 Template Metadata

Each template provides metadata:

```javascript
{
  id: 'template-id',
  name: 'Template Name',
  description: 'Template description',
  version: '1.0.0',
  dependencies: ['log-view-machine']
}
```

## 🔄 Migration from Old Structure

### Before (Old Structure)

```javascript
// Old monolithic approach
const GenericEditor = require('./index');
const editor = new GenericEditor(config);
```

### After (New Structure)

```javascript
// New modular approach
const { createGenericEditor, createTemplate } = require('./index-new');

// Create individual templates
const htmlEditor = createTemplate('html-editor');
const cssEditor = createTemplate('css-editor');

// Create main editor
const editor = createGenericEditor(config);
const mainEditor = editor.createEditor();
```

## 🎨 Advanced Features

### Recursive XState Visualization

The XState editor supports recursive substate visualization:

```javascript
// Find substate machines
const substates = findSubstateMachines(stateMachine);

// Generate visualizations
const visualizations = generateSubstateVisualizations(substates);
```

### Improved Touch Analysis

Enhanced multi-touch gesture recognition:

```javascript
// Vector analysis with lead time and debouncing
const currentVector = calculateVector(touch1, touch2);
const gestureType = detectGestureType(currentVector, previousVector);
```

### Panel Resizing

Draggable grabbers for panel resizing:

```javascript
// Initialize grabbers
initializeGrabbers();

// Handle drag events
function doDrag(e) {
  // Resize panels based on drag position
}
```

## 🚀 Benefits of Refactoring

### ✅ Modularity

- Each component is a standalone template
- Templates can be used independently
- Easy to add new templates

### ✅ Reusability

- Templates can be reused across projects
- Consistent interface across templates
- Standardized state management

### ✅ Maintainability

- Clear separation of concerns
- Easy to test individual components
- Simplified debugging

### ✅ Extensibility

- Easy to add new templates
- Flexible composition system
- Plugin-like architecture

## 🔮 Future Enhancements

### Planned Features

1. **Plugin System** - Allow third-party templates
2. **Template Marketplace** - Share and discover templates
3. **Advanced Composition** - More complex template compositions
4. **Performance Optimization** - Lazy loading of templates
5. **TypeScript Support** - Full TypeScript integration

### Integration Opportunities

1. **TeleportHQ Integration** - Template sharing with TeleportHQ
2. **Jump Server UI Integration** - Real-time collaboration
3. **BoundaryHQ Integration** - Security and compliance
4. **Fish Burger Integration** - State machine orchestration

## 📝 API Reference

### Main Classes

- `GenericEditor` - Main editor class
- `GenericEditorConfig` - Configuration class

### Factory Functions

- `createGenericEditor(config)` - Create main editor
- `createTemplate(templateId, config)` - Create template instance

### Demo Functions

- `runGenericEditorDemo()` - Run full demo
- `integrateWithFishBurger(config)` - Fish Burger integration

### Templates

- `GenericEditorTemplate` - Main editor template
- `HTMLEditorTemplate` - HTML editor template
- `CSSEditorTemplate` - CSS editor template
- `JavaScriptEditorTemplate` - JavaScript editor template
- `XStateEditorTemplate` - XState editor template
- `ComponentLibraryTemplate` - Component library template

## 🎉 Conclusion

The refactored Generic Editor provides a **modern, modular, and extensible** architecture that leverages the **log-view-model** for state management and implements a **hierarchical template structure** for maximum reusability and maintainability.

Each component is now a **standalone template** that can be used independently or composed into larger systems, making the Generic Editor a truly **enterprise-grade** component system. 