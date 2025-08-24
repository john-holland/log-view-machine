/**
 * Structural Editor Template
 * 
 * A visual hierarchy editor for organizing root app components and their relationships.
 * This template provides a tree-like view of component architecture with drag-and-drop
 * organization capabilities.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');
const fs = require('fs');
const path = require('path');

const StructuralEditorTemplate = {
  id: 'structural-editor',
  name: 'Structural Editor',
  description: 'Visual hierarchy editor for organizing root app components',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'structural-editor',
    xstateConfig: {
      id: 'structural-editor',
      initial: 'ready',
      states: {
        ready: {
          on: {
            LOAD_STRUCTURE: 'loading',
            CREATE_COMPONENT: 'creating',
            EDIT_STRUCTURE: 'editing',
            EXPORT_STRUCTURE: 'exporting'
          }
        },
        loading: {
          on: {
            STRUCTURE_LOADED: 'editing',
            LOAD_ERROR: 'error'
          }
        },
        creating: {
          on: {
            COMPONENT_CREATED: 'editing',
            CREATION_CANCELLED: 'editing',
            CREATION_ERROR: 'error'
          }
        },
        editing: {
          on: {
            SAVE_STRUCTURE: 'saving',
            ADD_COMPONENT: 'editing',
            REMOVE_COMPONENT: 'editing',
            REORDER_COMPONENTS: 'editing',
            EXPORT_STRUCTURE: 'exporting',
            RESET_STRUCTURE: 'ready'
          }
        },
        saving: {
          on: {
            SAVE_SUCCESS: 'editing',
            SAVE_ERROR: 'error'
          }
        },
        exporting: {
          on: {
            EXPORT_SUCCESS: 'editing',
            EXPORT_ERROR: 'error'
          }
        },
        error: {
          on: {
            RETRY: 'ready',
            RESET: 'ready'
          }
        }
      }
    }
  },

  // Create the template instance
  create: (config = {}) => {
    return createViewStateMachine({
      machineId: 'structural-editor',
      xstateConfig: {
        ...StructuralEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        ready: async (context) => {
          await context.log('Structural Editor ready');
          const viewPath = path.join(__dirname, 'views', 'ready-view.html');
          const template = fs.readFileSync(viewPath, 'utf8');
          return context.view(template);
        },
        loading: async (context) => {
          await context.log('Loading component structure...');
          return context.view(
            `<div class="structural-editor loading">
              <div class="editor-header">
                <h3>Structural Editor</h3>
                <p>Loading component structure...</p>
              </div>
              <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Analyzing component hierarchy...</p>
              </div>
            </div>`
          );
        },
        creating: async (context) => {
          await context.log('Creating new component...');
          const viewPath = path.join(__dirname, 'views', 'creating-view.html');
          const template = fs.readFileSync(viewPath, 'utf8');
          return context.view(template);
        },
        editing: async (context) => {
          await context.log('Editing component structure');
          const viewPath = path.join(__dirname, 'views', 'editing-view.html');
          const template = fs.readFileSync(viewPath, 'utf8');
          return context.view(template);
        },
        saving: async (context) => {
          await context.log('Saving component structure...');
          return context.view(
            `<div class="structural-editor saving">
              <div class="editor-header">
                <h3>Structural Editor</h3>
              </div>
              <div class="saving-spinner">
                <div class="spinner"></div>
                <p>Saving component structure...</p>
              </div>
            </div>`
          );
        },
        exporting: async (context) => {
          await context.log('Exporting component structure...');
          return context.view(
            `<div class="structural-editor exporting">
              <div class="editor-header">
                <h3>Structural Editor</h3>
              </div>
              <div class="exporting-spinner">
                <div class="spinner"></div>
                <p>Generating structure export...</p>
              </div>
            </div>`
          );
        },
        error: async (context) => {
          await context.log('Structural Editor error', { error: context.model.error });
          const errorMessage = context.model.error?.message || 'An error occurred';
          return context.view(
            `<div class="structural-editor error">
              <div class="editor-header">
                <h3>Structural Editor</h3>
              </div>
              <div class="error-message">
                <p>${errorMessage}</p>
                <div class="error-actions">
                  <button onclick="context.send({ type: 'RETRY' })" class="btn btn-primary">Retry</button>
                  <button onclick="context.send({ type: 'RESET' })" class="btn btn-secondary">Reset</button>
                </div>
              </div>
            </div>`
          );
        }
      }
    });
  }
};

module.exports = StructuralEditorTemplate;
