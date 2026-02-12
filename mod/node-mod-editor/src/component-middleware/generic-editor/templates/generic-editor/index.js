/**
 * Generic Editor Template
 * 
 * A comprehensive editor that composes HTML, CSS, JavaScript, and XState editors.
 * This template uses the log-view-model and can be used as a standalone component.
 * Now includes subView support with separate SunEditor instances and cart component integration.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');
const { createSubViewManager } = require('./subview-utility.js');

// Import sub-templates
const HTMLEditorTemplate = require('../html-editor');
const CSSEditorTemplate = require('../css-editor');
const JavaScriptEditorTemplate = require('../javascript-editor');
const XStateEditorTemplate = require('../xstate-editor');
const ComponentLibraryTemplate = require('../component-library');
// Cart component removed - will be used only in preview with pact test framework
// const BurgerCartComponentTemplate = require('../burger-cart-component');

const GenericEditorTemplate = {
  id: 'generic-editor',
  name: 'Generic Editor',
  description: 'A comprehensive editor with HTML, CSS, JavaScript, XState visualization, and subView support',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'generic-editor',
    xstateConfig: {
      id: 'generic-editor',
      initial: 'idle',
      context: {
        currentTab: 'html',
        currentComponent: null,
        componentHistory: [],
        canvasTransform: { x: 0, y: 0, scale: 1 },
        isDragging: false,
        isZooming: false,
        developerMode: false,
        autoSave: true,
        lastSaved: null,
        unsavedChanges: false,
        error: null,
        subViewManager: null,
        componentLibrary: null,
        // cartComponent: null // Removed - cart components only in preview
      },
      states: {
        idle: {
          on: {
            LOAD_COMPONENT: 'loading',
            CREATE_NEW: 'editing',
            OPEN_LIBRARY: 'library'
          }
        },
        loading: {
          on: {
            COMPONENT_LOADED: 'editing',
            LOAD_ERROR: 'error'
          }
        },
        editing: {
          on: {
            SWITCH_TAB: 'editing',
            SAVE: 'saving',
            RESET: 'resetting',
            OPEN_LIBRARY: 'library',
            TOGGLE_DEVELOPER_MODE: 'editing',
            CANVAS_DRAG: 'editing',
            CANVAS_ZOOM: 'editing'
          }
        },
        library: {
          on: {
            COMPONENT_SELECTED: 'editing',
            LIBRARY_CLOSED: 'editing'
          }
        },
        saving: {
          on: {
            SAVE_SUCCESS: 'editing',
            SAVE_ERROR: 'error'
          }
        },
        resetting: {
          on: {
            RESET_COMPLETE: 'editing',
            RESET_ERROR: 'error'
          }
        },
        error: {
          on: {
            RETRY: 'idle',
            DISMISS_ERROR: 'editing'
          }
        }
      }
    }
  },

  // Create the template instance
  create: (config = {}) => {
    // Create sub-machines
    const htmlEditor = HTMLEditorTemplate.create();
    const cssEditor = CSSEditorTemplate.create();
    const javascriptEditor = JavaScriptEditorTemplate.create();
    const xstateEditor = XStateEditorTemplate.create();
    const componentLibrary = ComponentLibraryTemplate.create();
    // const cartComponent = BurgerCartComponentTemplate.create(); // Removed - cart components only in preview

    return createViewStateMachine({
      machineId: 'generic-editor',
      xstateConfig: {
        ...GenericEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        idle: async (context) => {
          await context.log('Generic Editor is idle');
          return context.view(`
            <div class="generic-editor-idle">
              <div class="idle-content">
                <div class="idle-icon">🛠️</div>
                <h2>Generic Editor</h2>
                <p>Ready to load or create components</p>
                <div class="idle-actions">
                  <button class="btn btn-primary" onclick="context.send({ type: 'CREATE_NEW' })">
                    🆕 Create New Component
                  </button>
                  <button class="btn btn-secondary" onclick="context.send({ type: 'OPEN_LIBRARY' })">
                    📚 Open Component Library
                  </button>
                </div>
              </div>
            </div>
          `);
        },
        
        loading: async (context) => {
          await context.log('Loading component...');
          return context.view(`
            <div class="generic-editor-loading">
              <div class="loading-content">
                <div class="loading-spinner">🔄</div>
                <h2>Loading Component</h2>
                <p>Please wait while we load your component...</p>
                <div class="loading-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: 75%"></div>
                  </div>
                  <span>75% Complete</span>
                </div>
              </div>
            </div>
          `);
        },
        
        editing: async (context) => {
          await context.log('Component loaded, ready for editing');
          
          // Get subView navigation data
          const subViewData = context.model.subViewManager?.getNavigationData() || {};
          
          return context.view(`
            <div class="generic-editor-editing">
              <div class="editor-header">
                <div class="header-left">
                  <h2>Editing: ${context.model.currentComponent?.name || 'Untitled Component'}</h2>
                  <div class="component-meta">
                    <span class="component-type">${context.model.currentComponent?.type || 'Component'}</span>
                    <span class="component-version">v${context.model.currentComponent?.version || '1.0.0'}</span>
                  </div>
                </div>
                
                <div class="header-center">
                  <div class="save-status">
                    ${context.model.unsavedChanges ? 
                      '<span class="unsaved-indicator">⚠️ Unsaved Changes</span>' : 
                      '<span class="saved-indicator">✓ Saved</span>'
                    }
                    ${context.model.lastSaved ? 
                      `<span class="last-saved">Last saved: ${new Date(context.model.lastSaved).toLocaleTimeString()}</span>` : 
                      ''
                    }
                  </div>
                </div>
                
                <div class="header-right">
                  <div class="editor-controls">
                    <button class="btn btn-primary" onclick="context.send({ type: 'SAVE' })">
                      💾 Save
                    </button>
                    <button class="btn btn-secondary" onclick="context.send({ type: 'RESET' })">
                      🔄 Reset
                    </button>
                    <button class="btn btn-info" onclick="context.send({ type: 'OPEN_LIBRARY' })">
                      📚 Library
                    </button>
                    <label class="developer-mode-toggle">
                      <input type="checkbox" ${context.model.developerMode ? 'checked' : ''} 
                             onchange="toggleDeveloperMode(this.checked)" />
                      <span>Developer Mode</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="editor-tabs">
                <button class="tab-button ${context.model.currentTab === 'html' ? 'active' : ''}" 
                        onclick="context.send({ type: 'SWITCH_TAB', tab: 'html' })">
                  📝 HTML
                </button>
                <button class="tab-button ${context.model.currentTab === 'css' ? 'active' : ''}" 
                        onclick="context.send({ type: 'SWITCH_TAB', tab: 'css' })">
                  🎨 CSS
                </button>
                <button class="tab-button ${context.model.currentTab === 'js' ? 'active' : ''}" 
                        onclick="context.send({ type: 'SWITCH_TAB', tab: 'js' })">
                  ⚡ JavaScript
                </button>
                <button class="tab-button ${context.model.currentTab === 'xstate' ? 'active' : ''}" 
                        onclick="context.send({ type: 'SWITCH_TAB', tab: 'xstate' })">
                  🔄 XState
                </button>
                <!-- Cart tab removed - cart components only in preview with pact test framework -->
              </div>
              
              <div class="editor-content">
                <div class="left-panel">
                  <div class="panel-grabber left" id="left-grabber"></div>
                  <div class="component-library-panel">
                    ${componentLibrary.render(context.model)}
                  </div>
                </div>
                
                <div class="main-editor">
                  <div class="canvas-container" id="canvas-container">
                    <div class="canvas-controls">
                      <button class="canvas-btn" onclick="resetCanvas()">🏠</button>
                      <button class="canvas-btn" onclick="zoomIn()">🔍+</button>
                      <button class="canvas-btn" onclick="zoomOut()">🔍-</button>
                      <span class="zoom-level">${Math.round(context.model.canvasTransform.scale * 100)}%</span>
                    </div>
                    
                    <div class="sun-editor-wrapper" id="sun-editor-wrapper" 
                         style="transform: translate(${context.model.canvasTransform.x}px, ${context.model.canvasTransform.y}px) scale(${context.model.canvasTransform.scale})">
                      
                      <!-- HTML Editor -->
                      <div class="editor-panel ${context.model.currentTab === 'html' ? 'active' : ''}" id="html-editor-panel">
                        ${htmlEditor.render(context.model)}
                      </div>
                      
                      <!-- CSS Editor -->
                      <div class="editor-panel ${context.model.currentTab === 'css' ? 'active' : ''}" id="css-editor-panel">
                        ${cssEditor.render(context.model)}
                      </div>
                      
                      <!-- JavaScript Editor -->
                      <div class="editor-panel ${context.model.currentTab === 'js' ? 'active' : ''}" id="js-editor-panel">
                        ${javascriptEditor.render(context.model)}
                      </div>
                      
                      <!-- XState Editor -->
                      <div class="editor-panel ${context.model.currentTab === 'xstate' ? 'active' : ''}" id="xstate-editor-panel">
                        ${xstateEditor.render(context.model)}
                      </div>
                      
                      <!-- Cart Component removed - cart components only in preview with pact test framework -->
                    </div>
                  </div>
                </div>
                
                <div class="right-panel">
                  <div class="panel-grabber right" id="right-grabber"></div>
                  <div class="component-properties-panel">
                    <h3>Component Properties</h3>
                    ${context.model.currentComponent ? `
                      <div class="property-group">
                        <label>Name:</label>
                        <input type="text" value="${context.model.currentComponent.name}" 
                               onchange="updateComponentProperty('name', this.value)" />
                      </div>
                      <div class="property-group">
                        <label>Type:</label>
                        <select onchange="updateComponentProperty('type', this.value)">
                          <option value="component" ${context.model.currentComponent.type === 'component' ? 'selected' : ''}>Component</option>
                          <option value="editor" ${context.model.currentComponent.type === 'editor' ? 'selected' : ''}>Editor</option>
                          <option value="template" ${context.model.currentComponent.type === 'template' ? 'selected' : ''}>Template</option>
                        </select>
                      </div>
                      <div class="property-group">
                        <label>Version:</label>
                        <input type="text" value="${context.model.currentComponent.version}" 
                               onchange="updateComponentProperty('version', this.value)" />
                      </div>
                      <div class="property-group">
                        <label>Description:</label>
                        <textarea onchange="updateComponentProperty('description', this.value)">${context.model.currentComponent.description || ''}</textarea>
                      </div>
                    ` : '<p>No component selected</p>'}
                    
                    ${context.model.developerMode ? `
                      <div class="developer-section">
                        <h4>Developer Tools</h4>
                        <button class="btn btn-sm btn-secondary" onclick="exportComponent()">Export</button>
                        <button class="btn btn-sm btn-secondary" onclick="importComponent()">Import</button>
                        <button class="btn btn-sm btn-secondary" onclick="debugComponent()">Debug</button>
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
              
              <div class="editor-footer">
                <div class="footer-left">
                  <span class="status-indicator">Ready</span>
                </div>
                <div class="footer-center">
                  <div class="breadcrumb">
                    ${context.model.currentComponent ? 
                      `${context.model.currentComponent.name} > ${context.model.currentTab.toUpperCase()}` : 
                      'No Component Selected'
                    }
                  </div>
                </div>
                <div class="footer-right">
                  <span class="auto-save-status">
                    ${context.model.autoSave ? 'Auto-save: ON' : 'Auto-save: OFF'}
                  </span>
                </div>
              </div>
            </div>
          `);
        },
        
        library: async (context) => {
          await context.log('Component library opened');
          return context.view(`
            <div class="generic-editor-library">
              <div class="library-header">
                <h2>📚 Component Library</h2>
                <button class="btn btn-secondary" onclick="context.send({ type: 'LIBRARY_CLOSED' })">
                  ✕ Close Library
                </button>
              </div>
              <div class="library-content">
                ${componentLibrary.render(context.model)}
              </div>
            </div>
          `);
        },
        
        saving: async (context) => {
          await context.log('Saving component...');
          return context.view(`
            <div class="generic-editor-saving">
              <div class="saving-content">
                <div class="saving-spinner">💾</div>
                <h2>Saving Component</h2>
                <p>Please wait while we save your changes...</p>
                <div class="saving-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: 90%"></div>
                  </div>
                  <span>90% Complete</span>
                </div>
              </div>
            </div>
          `);
        },
        
        resetting: async (context) => {
          await context.log('Resetting component...');
          return context.view(`
            <div class="generic-editor-resetting">
              <div class="resetting-content">
                <div class="resetting-spinner">🔄</div>
                <h2>Resetting Component</h2>
                <p>Please wait while we reset your component...</p>
                <div class="resetting-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width: 60%"></div>
                  </div>
                  <span>60% Complete</span>
                </div>
              </div>
            </div>
          `);
        },
        
        error: async (context) => {
          await context.log('Error occurred', { error: context.model.error });
          return context.view(`
            <div class="generic-editor-error">
              <div class="error-content">
                <div class="error-icon">❌</div>
                <h2>Error Occurred</h2>
                <p>${context.model.error?.message || 'An unexpected error occurred'}</p>
                <div class="error-details">
                  ${context.model.error?.stack ? `<pre>${context.model.error.stack}</pre>` : ''}
                </div>
                <div class="error-actions">
                  <button class="btn btn-primary" onclick="context.send({ type: 'RETRY' })">
                    🔄 Retry
                  </button>
                  <button class="btn btn-secondary" onclick="context.send({ type: 'DISMISS_ERROR' })">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          `);
        }
      }
    });
  }
};

module.exports = GenericEditorTemplate; 