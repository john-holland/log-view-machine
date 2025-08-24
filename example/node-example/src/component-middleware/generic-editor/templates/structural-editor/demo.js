/**
 * Structural Editor Demo
 * 
 * This demonstrates how to use the Structural Editor template
 * for organizing root app components with visual hierarchy.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');

// Sample component structure data
const sampleComponentStructure = {
  root: {
    id: 'app-root',
    name: 'App Root',
    type: 'application',
    children: [
      {
        id: 'main-layout',
        name: 'Main Layout',
        type: 'layout',
        children: [
          {
            id: 'navigation',
            name: 'Navigation',
            type: 'navigation',
            children: [
              { id: 'nav-menu', name: 'Nav Menu', type: 'component' },
              { id: 'user-profile', name: 'User Profile', type: 'component' }
            ]
          },
          {
            id: 'content-area',
            name: 'Content Area',
            type: 'container',
            children: [
              { id: 'sidebar', name: 'Sidebar', type: 'component' },
              { id: 'main-content', name: 'Main Content', type: 'component' }
            ]
          }
        ]
      },
      {
        id: 'footer',
        name: 'Footer',
        type: 'component',
        children: []
      }
    ]
  }
};

// Create a structural editor instance
function createStructuralEditorDemo() {
  console.log('🏗️ Creating Structural Editor Demo...');
  
  const structuralEditor = createViewStateMachine({
    machineId: 'structural-editor-demo',
    xstateConfig: {
      id: 'structural-editor-demo',
      initial: 'ready',
      states: {
        ready: {
          on: {
            LOAD_STRUCTURE: 'editing'
          }
        },
        editing: {
          on: {
            ADD_COMPONENT: 'editing',
            REMOVE_COMPONENT: 'editing',
            REORDER_COMPONENTS: 'editing'
          }
        }
      }
    },
    logStates: {
      ready: async (context) => {
        await context.log('Structural Editor ready - click to load structure');
        return context.view(`
          <div class="structural-editor-demo">
            <h2>🏗️ Structural Editor Demo</h2>
            <p>This demonstrates the visual hierarchy editor for organizing root app components.</p>
            <button onclick="context.send({ type: 'LOAD_STRUCTURE' })">
              📂 Load Sample Structure
            </button>
            <div class="demo-info">
              <h3>Features:</h3>
              <ul>
                <li>🌳 Visual component hierarchy</li>
                <li>🔄 Drag & drop organization</li>
                <li>📊 Component relationship mapping</li>
                <li>💾 Structure persistence</li>
                <li>📤 Export to various formats</li>
              </ul>
            </div>
          </div>
        `);
      },
      editing: async (context) => {
        await context.log('Editing component structure');
        return context.view(`
          <div class="structural-editor-demo editing">
            <h2>🏗️ Structural Editor - Editing Mode</h2>
            <div class="component-hierarchy">
              <h3>Component Hierarchy:</h3>
              <pre>${JSON.stringify(sampleComponentStructure, null, 2)}</pre>
            </div>
            <div class="editor-actions">
              <button onclick="addComponent()">➕ Add Component</button>
              <button onclick="removeComponent()">➖ Remove Component</button>
              <button onclick="reorderComponents()">🔄 Reorder</button>
            </div>
            <div class="structure-visualization">
              <h3>Visual Representation:</h3>
              <div class="tree-view">
                ${renderComponentTree(sampleComponentStructure.root)}
              </div>
            </div>
          </div>
        `);
      }
    }
  });
  
  return structuralEditor;
}

// Helper function to render component tree
function renderComponentTree(component, depth = 0) {
  const indent = '  '.repeat(depth);
  const icon = getComponentIcon(component.type);
  
  let html = `
    <div class="tree-node" style="margin-left: ${depth * 20}px;">
      <span class="node-icon">${icon}</span>
      <span class="node-name">${component.name}</span>
      <span class="node-type">(${component.type})</span>
    </div>
  `;
  
  if (component.children && component.children.length > 0) {
    component.children.forEach(child => {
      html += renderComponentTree(child, depth + 1);
    });
  }
  
  return html;
}

// Helper function to get component icon
function getComponentIcon(type) {
  const icons = {
    'application': '🏠',
    'layout': '🎨',
    'container': '📦',
    'component': '🧩',
    'navigation': '🧭',
    'page': '📄',
    'widget': '🔧',
    'form': '📝',
    'modal': '🪟'
  };
  return icons[type] || '🧩';
}

// Demo actions
function addComponent() {
  console.log('➕ Adding new component...');
  // Implementation would integrate with the structural editor
}

function removeComponent() {
  console.log('➖ Removing component...');
  // Implementation would integrate with the structural editor
}

function reorderComponents() {
  console.log('🔄 Reordering components...');
  // Implementation would integrate with the structural editor
}

// Export the demo
module.exports = {
  createStructuralEditorDemo,
  sampleComponentStructure,
  renderComponentTree
};

console.log('🏗️ Structural Editor Demo loaded successfully!');
console.log('Use createStructuralEditorDemo() to create an instance');
