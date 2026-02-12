# SubView System Documentation

## 🎯 **Overview**

The SubView System is a comprehensive solution for managing multiple editor instances within the Generic Editor. Each subView has its own separate SunEditor instance, local `.tsx` file, and can be navigated independently.

## 🏗️ **Architecture**

### ✅ **Core Components**

1. **SubViewManager** - Manages subView lifecycle and state
2. **Separate SunEditor Instances** - Each subView has its own editor
3. **Local .tsx Files** - Automatic file generation and export
4. **Navigation System** - Dropdown and list-based navigation
5. **React Syntax Highlighting** - Enhanced editing experience

### ✅ **File Structure**

```
generic-editor/
├── templates/
│   └── generic-editor/
│       ├── subview-utility.js          # SubView management utility
│       ├── views/
│       │   ├── main-editor-view.tsx    # Main editor view
│       │   ├── editor-view.tsx         # Individual editor views
│       │   └── library-view.tsx        # Component library view
│       └── styles.css                  # SubView navigation styles
├── demo-subview.js                     # SubView system demo
└── SUBVIEW_SYSTEM.md                  # This documentation
```

## 🚀 **Key Features**

### ✅ **Separate SunEditor Instances**

Each subView has its own dedicated SunEditor instance:

```javascript
// Create separate SunEditor instance for each subView
createSunEditorInstance(subViewId) {
  const editorId = `sun-editor-${subViewId}`;
  
  const editor = SUNEDITOR.create(editorId, {
    height: '100%',
    width: '100%',
    plugins: ['react-syntax-highlight'],
    reactSyntaxHighlight: {
      enabled: true,
      theme: 'vs-dark',
      language: 'tsx'
    }
  });
}
```

### ✅ **Local .tsx File Generation**

Automatic generation of local `.tsx` files:

```javascript
generateTSXContent(subView) {
  return `import React from 'react';
import { createViewStateMachine } from '../../../../../log-view-machine/src/core/ViewStateMachine.js';

/**
 * ${subView.name} Component
 * 
 * Generated from Generic Editor subView
 * Created: ${subView.createdAt}
 * Last Modified: ${subView.lastModified}
 */

export const ${this.toPascalCase(subView.name)}Component = {
  id: '${subView.name.toLowerCase()}-component',
  name: '${subView.name}',
  description: 'Generated component from Generic Editor',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  create: (config = {}) => {
    return createViewStateMachine({
      id: '${subView.name.toLowerCase()}-machine',
      initial: 'ready',
      context: {
        ...config,
        componentName: '${subView.name}',
        lastModified: '${subView.lastModified}'
      },
      states: {
        ready: {
          on: {
            INIT: 'active'
          }
        },
        active: {
          on: {
            DESTROY: 'destroyed'
          }
        },
        destroyed: {
          type: 'final'
        }
      }
    });
  }
};

export default ${this.toPascalCase(subView.name)}Component;
`;
}
```

### ✅ **Navigation System**

Right-panel navigation with dropdown and list:

```html
<!-- SubView Navigation -->
<div class="subview-navigation">
  <div class="subview-header">
    <h3>SubViews</h3>
    <button class="add-subview-btn" title="Add New SubView">➕</button>
  </div>
  
  <div class="subview-selector">
    <select onchange="context.send({ type: 'SWITCH_SUBVIEW', subViewId: this.value })">
      <option value="">Select SubView</option>
      <!-- Dynamic options -->
    </select>
  </div>
  
  <div class="subview-list">
    <!-- Dynamic subView items -->
  </div>
</div>
```

## 🎨 **CSS Styling**

### ✅ **SubView Navigation Styles**

```css
/* SubView Navigation */
.subview-navigation {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.subview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.add-subview-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #667eea;
  border-radius: 4px;
  background: #667eea;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
}

.subview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.subview-item.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}
```

## 🔧 **API Reference**

### ✅ **SubViewManager Class**

```javascript
class SubViewManager {
  // Create a new subView
  createSubView(name, content = '', type = 'tsx')
  
  // Create separate SunEditor instance
  createSunEditorInstance(subViewId)
  
  // Switch to a subView
  switchToSubView(subViewId)
  
  // Update subView content
  updateSubViewContent(subViewId, content)
  
  // Get all subViews
  getAllSubViews()
  
  // Get active subView
  getActiveSubView()
  
  // Delete a subView
  deleteSubView(subViewId)
  
  // Export subView to .tsx file
  exportSubViewToFile(subViewId)
  
  // Import subView from .tsx file
  importSubViewFromFile(file)
  
  // Get navigation data
  getNavigationData()
}
```

### ✅ **SubView Object Structure**

```javascript
const subView = {
  id: 'subview-1234567890',
  name: 'ComponentName',
  fileName: 'ComponentName.tsx',
  type: 'tsx',
  content: '// Component content...',
  createdAt: '2024-01-01T00:00:00.000Z',
  lastModified: '2024-01-01T00:00:00.000Z',
  isActive: false
};
```

## 🎯 **Usage Examples**

### ✅ **Basic SubView Creation**

```javascript
import { createSubViewManager } from './subview-utility.js';

const subViewManager = createSubViewManager();

// Create a new subView
const subView = subViewManager.createSubView('MyComponent', '// Component content', 'tsx');

// Switch to the subView
subViewManager.switchToSubView(subView.id);

// Update content
subViewManager.updateSubViewContent(subView.id, '// Updated content');
```

### ✅ **Integration with Generic Editor**

```javascript
import { GenericEditorTemplate } from './templates/generic-editor/index.js';

const genericEditor = GenericEditorTemplate.create({
  context: {
    subViewManager: createSubViewManager(),
    activeTab: 'html',
    canvasTransform: { x: 0, y: 0, scale: 1 },
    zoomLevel: 1,
    gestureType: 'Pan'
  }
});
```

### ✅ **Export and Import**

```javascript
// Export subView to .tsx file
const exportedFileName = subViewManager.exportSubViewToFile(subViewId);

// Import subView from file
const fileInput = document.getElementById('file-input');
const file = fileInput.files[0];
const importedSubView = await subViewManager.importSubViewFromFile(file);
```

## 🎨 **React Syntax Highlighting**

### ✅ **SunEditor Configuration**

```javascript
const editor = SUNEDITOR.create(editorId, {
  height: '100%',
  width: '100%',
  buttonList: [
    ['undo', 'redo'],
    ['font', 'fontSize', 'formatBlock'],
    ['bold', 'underline', 'italic', 'strike'],
    ['fontColor', 'hiliteColor'],
    ['removeFormat'],
    ['outdent', 'indent'],
    ['align', 'verticalAlign', 'horizontalRule', 'list'],
    ['table', 'link', 'image', 'video'],
    ['fullScreen', 'showBlocks', 'codeView'],
    ['preview', 'print']
  ],
  plugins: [
    'react-syntax-highlight'
  ],
  reactSyntaxHighlight: {
    enabled: true,
    theme: 'vs-dark',
    language: 'tsx'
  },
  callbacks: {
    onChange: (contents, isChanged) => {
      this.updateSubViewContent(subViewId, contents);
    }
  }
});
```

## 🚀 **Demo Script**

### ✅ **Running the Demo**

```bash
node demo-subview.js
```

The demo demonstrates:
- ✅ Creating multiple subViews
- ✅ Switching between subViews
- ✅ Exporting to .tsx files
- ✅ Deleting subViews
- ✅ Integration with Generic Editor
- ✅ React syntax highlighting

## 🎯 **Benefits**

### ✅ **Modularity**

- Each subView is completely independent
- Separate SunEditor instances prevent conflicts
- Easy to manage multiple components

### ✅ **Productivity**

- Quick navigation between subViews
- Automatic .tsx file generation
- React syntax highlighting for better editing

### ✅ **Build System Friendly**

- Local .tsx files can be processed independently
- Easy integration with build tools
- Tree-shaking compatible

### ✅ **Developer Experience**

- Intuitive navigation interface
- Visual feedback for active subViews
- Export/import functionality

## 🔮 **Future Enhancements**

### ✅ **Planned Features**

1. **Real-time Collaboration** - Multiple users editing different subViews
2. **Version Control** - Git integration for subView files
3. **Template System** - Pre-built subView templates
4. **Advanced Syntax Highlighting** - More language support
5. **Auto-save** - Automatic saving of subView changes
6. **Search and Replace** - Global search across all subViews
7. **Dependency Management** - Automatic import/export handling
8. **Testing Integration** - Built-in testing for subViews

### ✅ **Performance Optimizations**

1. **Lazy Loading** - Load subViews on demand
2. **Memory Management** - Efficient cleanup of unused editors
3. **Caching** - Cache frequently accessed subViews
4. **Compression** - Compress subView content for storage

## 🎉 **Conclusion**

The SubView System provides a powerful, modular approach to managing multiple editor instances within the Generic Editor. With separate SunEditor instances, local .tsx file generation, and intuitive navigation, it offers an excellent developer experience for building complex applications.

Key advantages:
- ✅ **Separation of Concerns** - Each subView is independent
- ✅ **Enhanced Productivity** - Quick navigation and editing
- ✅ **Build System Integration** - Easy to integrate with modern build tools
- ✅ **Developer Experience** - Intuitive interface and React syntax highlighting
- ✅ **Scalability** - Easy to add new subViews and features 