/**
 * JavaScript Editor Template
 * 
 * A standalone JavaScript editor component using Ace Editor with syntax highlighting.
 * This template can be used independently or as part of the generic editor.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');

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
          return context.view(
            <div className="javascript-editor">
              <div className="editor-header">
                <h3>JavaScript Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'EDIT' })}>Edit</button>
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                  <button onClick={() => context.send({ type: 'RUN_CODE' })}>Run</button>
                </div>
              </div>
              <div id="javascript-editor-ace" className="editor-content"></div>
            </div>
          );
        },
        loading: async (context) => {
          await context.log('Loading JavaScript content...');
          return context.view(
            <div className="javascript-editor loading">
              <div className="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div className="loading-spinner">Loading content...</div>
            </div>
          );
        },
        editing: async (context) => {
          await context.log('JavaScript editing in progress');
          return context.view(
            <div className="javascript-editor editing">
              <div className="editor-header">
                <h3>JavaScript Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                  <button onClick={() => context.send({ type: 'CANCEL' })}>Cancel</button>
                  <button onClick={() => context.send({ type: 'RUN_CODE' })}>Run</button>
                </div>
              </div>
              <div id="javascript-editor-ace" className="editor-content active"></div>
            </div>
          );
        },
        running: async (context) => {
          await context.log('Running JavaScript code...');
          return context.view(
            <div className="javascript-editor running">
              <div className="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div className="running-spinner">Running code...</div>
            </div>
          );
        },
        saving: async (context) => {
          await context.log('Saving JavaScript content...');
          return context.view(
            <div className="javascript-editor saving">
              <div className="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div className="saving-spinner">Saving...</div>
            </div>
          );
        },
        error: async (context) => {
          await context.log('JavaScript Editor error', { error: context.model.error });
          return context.view(
            <div className="javascript-editor error">
              <div className="editor-header">
                <h3>JavaScript Editor</h3>
              </div>
              <div className="error-message">
                <p>{context.model.error?.message || 'An error occurred'}</p>
                <button onClick={() => context.send({ type: 'RETRY' })}>Retry</button>
              </div>
            </div>
          );
        }
      }
    });
  }
};

module.exports = JavaScriptEditorTemplate; 