# 🏗️ Structural Editor Template

A visual hierarchy editor for organizing root app components with drag-and-drop capabilities, component relationship mapping, and structure persistence.

## 🎯 **Purpose**

The Structural Editor provides a visual interface for organizing and managing the component architecture of applications. It allows developers and architects to:

- **Visualize** component hierarchies in multiple view modes
- **Organize** components with drag-and-drop functionality
- **Map** relationships between components
- **Export** structures to various formats
- **Persist** component architectures

## ✨ **Key Features**

### **🌳 Multiple View Modes**
- **Tree View**: Hierarchical tree representation
- **Grid View**: Grid-based layout visualization
- **Flow View**: Flowchart-style representation
- **Mind Map**: Mind mapping visualization

### **🔄 Interactive Organization**
- Drag & drop component reordering
- Add/remove components
- Component type categorization
- Parent-child relationship management

### **📊 Component Management**
- Component type definitions (Component, Container, Layout, Page, etc.)
- Props and state configuration
- Lifecycle hook selection
- Styling approach configuration
- Responsive design options

### **💾 Persistence & Export**
- Save component structures
- Export to JSON, XML, or custom formats
- Template creation and reuse
- Version control integration

## 🏗️ **Architecture**

### **State Machine States**
```
ready → loading → editing → saving/exporting
  ↓        ↓        ↓         ↓
  ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### **Component Types**
- **🧩 Component**: Basic UI components
- **📦 Container**: Component wrappers
- **🎨 Layout**: Layout components
- **📄 Page**: Page-level components
- **🔧 Widget**: Reusable widgets
- **📝 Form**: Form components
- **🪟 Modal**: Modal/dialog components
- **🧭 Navigation**: Navigation components

## 🚀 **Usage**

### **Basic Setup**
```javascript
const { createViewStateMachine } = require('log-view-machine');
const StructuralEditorTemplate = require('./templates/structural-editor');

// Create structural editor instance
const structuralEditor = StructuralEditorTemplate.create({
  xstateConfig: {
    // Custom configuration
  }
});
```

### **Loading Structure**
```javascript
// Send event to load existing structure
structuralEditor.send({ type: 'LOAD_STRUCTURE' });
```

### **Adding Components**
```javascript
// Add new component
structuralEditor.send({ 
  type: 'ADD_COMPONENT', 
  payload: { 
    name: 'UserProfile',
    type: 'component',
    parent: 'main-layout'
  }
});
```

### **Saving Structure**
```javascript
// Save current structure
structuralEditor.send({ type: 'SAVE_STRUCTURE' });
```

## 📁 **File Structure**

```
structural-editor/
├── index.js              # Main template definition
├── views/                # View templates
│   ├── ready-view.html   # Initial state view
│   ├── editing-view.html # Main editing interface
│   └── creating-view.html # Component creation form
├── styles.css            # CSS styles
├── demo.js               # Usage demonstration
└── README.md             # This file
```

## 🎨 **View Templates**

### **Ready View**
- Welcome message and feature overview
- Action buttons for loading/creating structures
- Recent structures list

### **Editing View**
- Three-panel layout:
  - **Component Tree**: Hierarchical component view
  - **Component Details**: Selected component information
  - **Visual Preview**: Component preview canvas
- Toolbar with component management tools
- Status bar with structure information

### **Creating View**
- Comprehensive component creation form
- Component type selection
- Props and state configuration
- Styling and responsive options
- Real-time preview generation

## 🔧 **Configuration Options**

### **View Mode Settings**
- Tree view depth limits
- Grid view columns/rows
- Flow view layout algorithms
- Mind map node spacing

### **Component Validation**
- Required field validation
- Component naming conventions
- Relationship validation
- Circular dependency detection

### **Export Formats**
- JSON structure export
- XML documentation
- PlantUML diagrams
- Mermaid flowcharts
- Custom format templates

## 📱 **Responsive Design**

The Structural Editor is fully responsive and works on:
- **Desktop**: Full three-panel layout
- **Tablet**: Adaptive panel sizing
- **Mobile**: Stacked panel layout

## 🔌 **Integration Points**

### **With TomeConnector**
- Component state management
- Message tracing
- Distributed component updates

### **With ViewStateMachine**
- State machine integration
- Component lifecycle management
- Event-driven updates

### **With RobotCopy**
- Message broker integration
- Component communication
- Event propagation

## 🧪 **Testing**

### **Demo Usage**
```javascript
const { createStructuralEditorDemo } = require('./demo');

// Create and run demo
const demo = createStructuralEditorDemo();
demo.render();

// Interact with demo
demo.send({ type: 'LOAD_STRUCTURE' });
```

### **Test Scenarios**
- Component creation and deletion
- Drag and drop operations
- Structure validation
- Export functionality
- Responsive behavior

## 🚧 **Future Enhancements**

### **Planned Features**
- **Real-time Collaboration**: Multi-user editing
- **Component Templates**: Pre-built component patterns
- **Integration APIs**: Third-party tool integration
- **Advanced Visualization**: 3D component views
- **Performance Monitoring**: Component performance metrics

### **Plugin System**
- Custom view modes
- Component type extensions
- Export format plugins
- Validation rule plugins

## 📚 **Examples**

### **Sample Component Structure**
```json
{
  "root": {
    "id": "app-root",
    "name": "App Root",
    "type": "application",
    "children": [
      {
        "id": "main-layout",
        "name": "Main Layout",
        "type": "layout",
        "children": [
          {
            "id": "navigation",
            "name": "Navigation",
            "type": "navigation"
          },
          {
            "id": "content-area",
            "name": "Content Area",
            "type": "container"
          }
        ]
      }
    ]
  }
}
```

## 🤝 **Contributing**

To contribute to the Structural Editor:

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** your changes
4. **Test** thoroughly
5. **Submit** a pull request

## 📄 **License**

This template is part of the TomeConnector project and follows the same licensing terms.

---

*Built with ❤️ for the TomeConnector community*
