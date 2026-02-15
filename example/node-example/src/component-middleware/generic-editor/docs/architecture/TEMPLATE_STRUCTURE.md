# Generic Editor Template Structure

## 🏗️ **Complete Template Architecture**

Each template directory is now **self-contained** with its own CSS definitions and XState machines, making it easier for build systems to process them independently.

## 📁 **Template Directory Structure**

```
generic-editor/
├── templates/
│   ├── index.js                    # Main template registry
│   ├── generic-editor/             # Main editor template
│   │   ├── index.js               # Template implementation
│   │   ├── styles.css             # CSS definitions
│   │   └── machine.js             # XState machine definition
│   ├── html-editor/               # HTML editor template
│   │   ├── index.js               # Template implementation
│   │   ├── styles.css             # CSS definitions
│   │   └── machine.js             # XState machine definition
│   ├── css-editor/                # CSS editor template
│   │   ├── index.js               # Template implementation
│   │   ├── styles.css             # CSS definitions
│   │   └── machine.js             # XState machine definition
│   ├── javascript-editor/         # JavaScript editor template
│   │   ├── index.js               # Template implementation
│   │   ├── styles.css             # CSS definitions
│   │   └── machine.js             # XState machine definition
│   ├── xstate-editor/             # XState editor template
│   │   ├── index.js               # Template implementation
│   │   ├── styles.css             # CSS definitions
│   │   └── machine.js             # XState machine definition
│   └── component-library/         # Component library template
│       ├── index.js               # Template implementation
│       ├── styles.css             # CSS definitions
│       └── machine.js             # XState machine definition
├── index-new.js                   # Refactored main index
├── demo-refactored.js             # Demo script
└── README-REFACTORED.md          # Comprehensive documentation
```

## 🎨 **CSS Definitions**

### ✅ **Separate CSS Files**

Each template now has its own `styles.css` file containing:

- **Component-specific styles**: Tailored to each editor type
- **State-based styling**: Different styles for ready, editing, loading, etc.
- **Responsive design**: Mobile-friendly layouts
- **Theme consistency**: Unified color scheme and typography

### 📋 **CSS Files Created**

1. **`templates/generic-editor/styles.css`** - Main editor styles
2. **`templates/html-editor/styles.css`** - HTML editor styles
3. **`templates/css-editor/styles.css`** - CSS editor styles
4. **`templates/javascript-editor/styles.css`** - JavaScript editor styles
5. **`templates/xstate-editor/styles.css`** - XState editor styles
6. **`templates/component-library/styles.css`** - Component library styles

### 🎯 **CSS Features**

- **Modular Design**: Each template's styles are isolated
- **Build System Friendly**: Easy to process independently
- **State Management**: CSS classes for different states
- **Responsive**: Mobile-first design approach
- **Accessibility**: Proper contrast and focus states

## 🤖 **XState Machine Definitions**

### ✅ **Separate Machine Files**

Each template now has its own `machine.js` file containing:

- **State machine definition**: Complete XState configuration
- **Actions**: Functions for state transitions
- **Guards**: Conditional logic for transitions
- **Services**: Async operations and side effects

### 📋 **Machine Files Created**

1. **`templates/html-editor/machine.js`** - HTML editor state machine
2. **`templates/xstate-editor/machine.js`** - XState editor state machine
3. **Additional machines**: CSS, JavaScript, and Component Library machines

### 🎯 **Machine Features**

- **State Management**: Clear state transitions
- **Event Handling**: Structured event system
- **Async Operations**: Services for loading/saving
- **Error Handling**: Proper error states and recovery
- **Validation**: Guards for conditional transitions

## 🔧 **Build System Benefits**

### ✅ **Independent Processing**

Each template can be processed independently:

```javascript
// Process individual templates
import './templates/html-editor/styles.css';
import './templates/html-editor/machine.js';
import './templates/html-editor/index.js';
```

### ✅ **Tree Shaking**

Build systems can eliminate unused code:

```javascript
// Only import what you need
import { HTMLEditorTemplate } from './templates/html-editor/index.js';
```

### ✅ **Lazy Loading**

Templates can be loaded on demand:

```javascript
// Lazy load templates
const loadTemplate = async (templateId) => {
  const template = await import(`./templates/${templateId}/index.js`);
  return template.default;
};
```

## 📦 **Template Interface**

### ✅ **Standardized Structure**

Each template follows this structure:

```javascript
const TemplateName = {
  id: 'template-id',
  name: 'Template Name',
  description: 'Template description',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template implementation
  create: (config = {}) => {
    return createViewStateMachine({
      // XState configuration
    });
  }
};
```

### ✅ **CSS Integration**

CSS is automatically included:

```javascript
// CSS is loaded with the template
import './styles.css';
```

### ✅ **Machine Integration**

XState machines are integrated:

```javascript
// Machine is imported with the template
import { templateMachine } from './machine.js';
```

## 🚀 **Usage Examples**

### ✅ **Individual Template Usage**

```javascript
import { createTemplate } from './index-new.js';

// Create individual templates with their own CSS and machines
const htmlEditor = createTemplate('html-editor');
const cssEditor = createTemplate('css-editor');
const jsEditor = createTemplate('javascript-editor');
```

### ✅ **CSS Loading**

```javascript
// CSS is automatically loaded with each template
import './templates/html-editor/styles.css';
import './templates/css-editor/styles.css';
```

### ✅ **Machine Loading**

```javascript
// XState machines are automatically loaded
import { htmlEditorMachine } from './templates/html-editor/machine.js';
import { xstateEditorMachine } from './templates/xstate-editor/machine.js';
```

## 🎯 **Benefits for Build Systems**

### ✅ **Modularity**

- Each template is completely self-contained
- CSS and machines are co-located with templates
- Easy to process independently

### ✅ **Performance**

- Tree shaking can eliminate unused code
- Lazy loading reduces initial bundle size
- CSS can be processed in parallel

### ✅ **Maintainability**

- Clear separation of concerns
- Easy to find and modify specific templates
- Consistent structure across all templates

### ✅ **Scalability**

- Easy to add new templates
- Build systems can process templates in parallel
- Independent versioning of templates

## 🔮 **Future Enhancements**

### ✅ **Planned Features**

1. **CSS-in-JS**: Convert to CSS-in-JS for better integration
2. **Theme System**: Centralized theme management
3. **CSS Modules**: Scoped CSS for better isolation
4. **PostCSS Processing**: Advanced CSS transformations
5. **CSS Custom Properties**: Dynamic theming support

### ✅ **Build System Integration**

1. **Webpack**: Optimized for webpack processing
2. **Rollup**: Tree-shaking friendly
3. **Vite**: Fast development builds
4. **Parcel**: Zero-config builds
5. **ESBuild**: Ultra-fast builds

## 🎉 **Conclusion**

The template structure is now **completely self-contained** with:

- ✅ **Separate CSS files** for each template
- ✅ **Separate XState machine files** for each template
- ✅ **Build system friendly** architecture
- ✅ **Independent processing** capabilities
- ✅ **Easy maintenance** and scalability

Each template directory contains everything needed to function independently, making it perfect for modern build systems and modular architectures. 