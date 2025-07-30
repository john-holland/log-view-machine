/**
 * CSS Editor Template
 * 
 * A standalone CSS editor component using Ace Editor with syntax highlighting.
 * This template can be used independently or as part of the generic editor.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');

const CSSEditorTemplate = {
  id: 'css-editor',
  name: 'CSS Editor',
  description: 'Ace editor for CSS with syntax highlighting',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'css-editor',
    xstateConfig: {
      id: 'css-editor',
      initial: 'ready',
      states: {
        ready: {
          on: {
            EDIT: 'editing',
            SAVE: 'saving',
            LOAD_CONTENT: 'loading'
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
            CONTENT_CHANGED: 'editing'
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
      machineId: 'css-editor',
      xstateConfig: {
        ...CSSEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        ready: async (context) => {
          await context.log('CSS Editor ready');
          return context.view(
            <div className="css-editor">
              <div className="editor-header">
                <h3>CSS Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'EDIT' })}>Edit</button>
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                </div>
              </div>
              <div id="css-editor-ace" className="editor-content"></div>
            </div>
          );
        },
        loading: async (context) => {
          await context.log('Loading CSS content...');
          return context.view(
            <div className="css-editor loading">
              <div className="editor-header">
                <h3>CSS Editor</h3>
              </div>
              <div className="loading-spinner">Loading content...</div>
            </div>
          );
        },
        editing: async (context) => {
          await context.log('CSS editing in progress');
          return context.view(
            <div className="css-editor editing">
              <div className="editor-header">
                <h3>CSS Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                  <button onClick={() => context.send({ type: 'CANCEL' })}>Cancel</button>
                </div>
              </div>
              <div id="css-editor-ace" className="editor-content active"></div>
            </div>
          );
        },
        saving: async (context) => {
          await context.log('Saving CSS content...');
          return context.view(
            <div className="css-editor saving">
              <div className="editor-header">
                <h3>CSS Editor</h3>
              </div>
              <div className="saving-spinner">Saving...</div>
            </div>
          );
        },
        error: async (context) => {
          await context.log('CSS Editor error', { error: context.model.error });
          return context.view(
            <div className="css-editor error">
              <div className="editor-header">
                <h3>CSS Editor</h3>
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

module.exports = CSSEditorTemplate; 