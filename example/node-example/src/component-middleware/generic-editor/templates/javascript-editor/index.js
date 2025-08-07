/**
 * JavaScript Editor Template
 * 
 * A standalone JavaScript editor component using Ace Editor with syntax highlighting.
 * This template can be used independently or as part of the generic editor.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');
const fs = require('fs');
const path = require('path');

const JavaScriptEditorTemplate = {
  id: 'javascript-editor',
  name: 'JavaScript Editor',
  description: 'Ace editor for JavaScript with syntax highlighting',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'javascript-editor',
    xstateConfig: {
      id: 'javascript-editor',
      initial: 'ready',
      states: {
        ready: {
          on: {
            EDIT: 'editing',
            SAVE: 'saving',
            LOAD_CONTENT: 'loading',
            RUN_CODE: 'running'
          }
        },
        loading: {
          on: {
            CONTENT_LOADED: 'editing',
            LOAD_ERROR: 'error'
          }
        },
        editing: {
          on: {
            SAVE: 'saving',
            CANCEL: 'ready',
            CONTENT_CHANGED: 'editing',
            RUN_CODE: 'running'
          }
        },
        running: {
          on: {
            RUN_SUCCESS: 'ready',
            RUN_ERROR: 'error'
          }
        },
        saving: {
          on: {
            SAVE_SUCCESS: 'ready',
            SAVE_ERROR: 'error'
          }
        },
        error: {
          on: {
            RETRY: 'ready'
          }
        }
      }
    }
  },

  // Create the template instance
  create: (config = {}) => {
    return createViewStateMachine({
      machineId: 'javascript-editor',
      xstateConfig: {
        ...JavaScriptEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        ready: async (context) => {
          await context.log('JavaScript Editor ready');
          const viewPath = path.join(__dirname, 'views', 'ready-view.html');
          const template = fs.readFileSync(viewPath, 'utf8');
          return context.view(template);
        },
        loading: async (context) => {
          await context.log('Loading JavaScript content...');
          return context.view(
            `<div class="javascript-editor loading">
              <div class="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div class="loading-spinner">Loading content...</div>
            </div>`
          );
        },
        editing: async (context) => {
          await context.log('JavaScript editing in progress');
          const viewPath = path.join(__dirname, 'views', 'editing-view.html');
          const template = fs.readFileSync(viewPath, 'utf8');
          return context.view(template);
        },
        running: async (context) => {
          await context.log('Running JavaScript code...');
          return context.view(
            `<div class="javascript-editor running">
              <div class="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div class="running-spinner">Running code...</div>
            </div>`
          );
        },
        saving: async (context) => {
          await context.log('Saving JavaScript content...');
          return context.view(
            `<div class="javascript-editor saving">
              <div class="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div class="saving-spinner">Saving...</div>
            </div>`
          );
        },
        error: async (context) => {
          await context.log('JavaScript Editor error', { error: context.model.error });
          const errorMessage = context.model.error?.message || 'An error occurred';
          return context.view(
            `<div class="javascript-editor error">
              <div class="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div class="error-message">
                <p>${errorMessage}</p>
                <button onclick="context.send({ type: 'RETRY' })">Retry</button>
              </div>
            </div>`
          );
        }
      }
    });
  }
};

module.exports = JavaScriptEditorTemplate; 