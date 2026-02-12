/**
 * Generic Editor Template - Fixed Version
 * 
 * A comprehensive editor that composes HTML, CSS, JavaScript, and XState editors.
 * This template uses the log-view-model and can be used as a standalone component.
 * Fixed to properly handle HTML rendering without JSX syntax issues.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');
const { createSubViewManager } = require('./subview-utility.js');

// Import sub-templates
const HTMLEditorTemplate = require('../html-editor');
const CSSEditorTemplate = require('../css-editor');
const JavaScriptEditorTemplate = require('../javascript-editor');
const XStateEditorTemplate = require('../xstate-editor');
const ComponentLibraryTemplate = require('../component-library');

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
      states: {
        idle: {
          on: {
            LOAD_COMPONENT: 'loading',
            CREATE_NEW: 'editing',
            OPEN_LIBRARY: 'library',
            ADD_SUBVIEW: 'editing',
            SWITCH_SUBVIEW: 'editing',
            EDIT_SUBVIEW: 'editing',
            EXPORT_SUBVIEW: 'editing',
            DELETE_SUBVIEW: 'editing'
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
            SAVE: 'saving',
            RESET: 'resetting',
            SWITCH_TAB: 'editing',
            OPEN_LIBRARY: 'library',
            ADD_SUBVIEW: 'editing',
            SWITCH_SUBVIEW: 'editing',
            EDIT_SUBVIEW: 'editing',
            EXPORT_SUBVIEW: 'editing',
            DELETE_SUBVIEW: 'editing',
            ZOOM_IN: 'editing',
            ZOOM_OUT: 'editing',
            RESET_ZOOM: 'editing'
          }
        },
        library: {
          on: {
            COMPONENT_SELECTED: 'editing',
            LIBRARY_CLOSE: 'editing'
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
            RETRY: 'idle'
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
    const jsEditor = JavaScriptEditorTemplate.create();
    const xstateEditor = XStateEditorTemplate.create();
    const componentLibrary = ComponentLibraryTemplate.create();
    
    // Create subView manager
    const subViewManager = createSubViewManager();

    return createViewStateMachine({
      machineId: 'generic-editor',
      xstateConfig: {
        ...GenericEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      context: {
        activeTab: 'html',
        subViews: [],
        activeSubView: null,
        canvasTransform: { x: 0, y: 0, scale: 1 },
        zoomLevel: 1,
        gestureType: 'Pan',
        subViewManager,
        ...config.context
      },
      logStates: {
        idle: async (context) => {
          await context.log('Generic Editor is idle');
          return context.view(
            `<div class="generic-editor-idle">
              <div class="editor-header">
                <h2>Generic Editor</h2>
                <div class="editor-controls">
                  <button onclick="context.send({ type: 'LOAD_COMPONENT' })">Load Component</button>
                  <button onclick="context.send({ type: 'CREATE_NEW' })">Create New</button>
                  <button onclick="context.send({ type: 'OPEN_LIBRARY' })">Component Library</button>
                </div>
              </div>
              <div class="editor-content">
                <p>Ready to load or create components</p>
                <div class="welcome-message">
                  <h3>Welcome to Generic Editor</h3>
                  <p>Choose an option to get started:</p>
                  <ul>
                    <li>Load Component - Open an existing component</li>
                    <li>Create New - Start with a blank component</li>
                    <li>Component Library - Browse available components</li>
                  </ul>
                </div>
              </div>
            </div>`
          );
        },
        loading: async (context) => {
          await context.log('Loading component...');
          return context.view(
            `<div class="generic-editor-loading">
              <div class="editor-header">
                <h2>Loading Component</h2>
              </div>
              <div class="loading-spinner">Loading...</div>
            </div>`
          );
        },
        editing: async (context) => {
          await context.log('Component loaded, ready for editing');
          
          // Get subView navigation data
          const subViewData = context.model.subViewManager.getNavigationData();
          
          return context.view(
            `<div class="generic-editor-editing">
              <div class="editor-header">
                <h2>Editing Component</h2>
                <div class="editor-controls">
                  <button onclick="context.send({ type: 'SAVE' })">Save</button>
                  <button onclick="context.send({ type: 'RESET' })">Reset</button>
                  <button onclick="context.send({ type: 'OPEN_LIBRARY' })">Library</button>
                </div>
              </div>
              <div class="editor-tabs">
                <button onclick="context.send({ type: 'SWITCH_TAB', tab: 'html' })">HTML</button>
                <button onclick="context.send({ type: 'SWITCH_TAB', tab: 'css' })">CSS</button>
                <button onclick="context.send({ type: 'SWITCH_TAB', tab: 'js' })">JavaScript</button>
                <button onclick="context.send({ type: 'SWITCH_TAB', tab: 'xstate' })">XState</button>
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
                    <div class="sun-editor-wrapper" id="sun-editor-wrapper" style="transform: translate(${context.model.canvasTransform.x}px, ${context.model.canvasTransform.y}px) scale(${context.model.canvasTransform.scale})">
                      <!-- HTML Editor -->
                      <div class="editor-panel" id="html-editor-panel">
                        ${htmlEditor.render(context.model)}
                      </div>
                      
                      <!-- CSS Editor -->
                      <div class="editor-panel" id="css-editor-panel" style="display: none;">
                        ${cssEditor.render(context.model)}
                      </div>
                      
                      <!-- JavaScript Editor -->
                      <div class="editor-panel" id="js-editor-panel" style="display: none;">
                        ${jsEditor.render(context.model)}
                      </div>
                      
                      <!-- XState Editor -->
                      <div class="editor-panel" id="xstate-editor-panel" style="display: none;">
                        ${xstateEditor.render(context.model)}
                      </div>
                    </div>
                    
                    <div class="canvas-controls">
                      <button class="canvas-btn" onclick="context.send({ type: 'ZOOM_IN' })" title="Zoom In">+</button>
                      <button class="canvas-btn" onclick="context.send({ type: 'ZOOM_OUT' })" title="Zoom Out">-</button>
                      <button class="canvas-btn" onclick="context.send({ type: 'RESET_ZOOM' })" title="Reset Zoom">↺</button>
                    </div>
                    
                    <div class="zoom-level">${Math.round(context.model.zoomLevel * 100)}%</div>
                    <div class="gesture-indicator" id="gesture-indicator">Gesture: ${context.model.gestureType || 'Pan'}</div>
                  </div>
                </div>
                <div class="right-panel">
                  <div class="panel-grabber right" id="right-grabber"></div>
                  
                  <!-- SubView Navigation -->
                  <div class="subview-navigation">
                    <div class="subview-header">
                      <h3>SubViews</h3>
                      <button onclick="context.send({ type: 'ADD_SUBVIEW' })" class="add-subview-btn" title="Add New SubView">➕</button>
                    </div>
                    
                    <div class="subview-selector">
                      <select onchange="context.send({ type: 'SWITCH_SUBVIEW', subViewId: this.value })">
                        <option value="">Select SubView</option>
                        ${subViewData.map(subView => `
                          <option value="${subView.id}" ${subView.isActive ? 'selected' : ''}>
                            ${subView.name}
                          </option>
                        `).join('')}
                      </select>
                    </div>
                    
                    <div class="subview-list">
                      ${subViewData.map(subView => `
                        <div class="subview-item ${subView.isActive ? 'active' : ''}">
                          <div class="subview-info">
                            <span class="subview-name">${subView.name}</span>
                            <span class="subview-file">${subView.fileName}</span>
                          </div>
                          <div class="subview-actions">
                            <button onclick="context.send({ type: 'EDIT_SUBVIEW', subViewId: '${subView.id}' })" title="Edit">✏️</button>
                            <button onclick="context.send({ type: 'EXPORT_SUBVIEW', subViewId: '${subView.id}' })" title="Export">📤</button>
                            <button onclick="context.send({ type: 'DELETE_SUBVIEW', subViewId: '${subView.id}' })" title="Delete" class="delete-btn">🗑️</button>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  
                  <div class="preview-panel">
                    <h3>Preview</h3>
                    <div id="preview-content">
                      <!-- Preview content will be rendered here -->
                    </div>
                  </div>
                </div>
              </div>
            </div>`
          );
        },
        library: async (context) => {
          await context.log('Component library open');
          return context.view(
            `<div class="generic-editor-library">
              <div class="editor-header">
                <h2>Component Library</h2>
                <div class="editor-controls">
                  <button onclick="context.send({ type: 'LIBRARY_CLOSE' })">Close</button>
                </div>
              </div>
              <div class="library-content">
                ${componentLibrary.render(context.model)}
              </div>
            </div>`
          );
        },
        saving: async (context) => {
          await context.log('Saving component...');
          return context.view(
            `<div class="generic-editor-saving">
              <div class="editor-header">
                <h2>Saving Component</h2>
              </div>
              <div class="saving-spinner">Saving...</div>
            </div>`
          );
        },
        error: async (context) => {
          await context.log('Error occurred', { error: context.model.error });
          return context.view(
            `<div class="generic-editor-error">
              <div class="editor-header">
                <h2>Error</h2>
              </div>
              <div class="error-message">
                <p>${context.model.error?.message || 'An error occurred'}</p>
                <button onclick="context.send({ type: 'RETRY' })">Retry</button>
              </div>
            </div>`
          );
        }
      }
    });
  }
};

module.exports = GenericEditorTemplate; 