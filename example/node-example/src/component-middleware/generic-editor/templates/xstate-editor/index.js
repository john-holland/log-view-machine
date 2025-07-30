/**
 * XState Editor Template
 * 
 * A standalone XState editor component with visualization and recursive substate support.
 * This template can be used independently or as part of the generic editor.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');

const XStateEditorTemplate = {
  id: 'xstate-editor',
  name: 'XState Editor',
  description: 'XState visualization and editor with recursive substate support',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'xstate-editor',
    xstateConfig: {
      id: 'xstate-editor',
      initial: 'ready',
      states: {
        ready: {
          on: {
            EDIT: 'editing',
            VISUALIZE: 'visualizing',
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
            VISUALIZE: 'visualizing',
            CANCEL: 'ready',
            CONTENT_CHANGED: 'editing'
          }
        },
        visualizing: {
          on: {
            EDIT: 'editing',
            SAVE: 'saving',
            ZOOM_IN: 'visualizing',
            ZOOM_OUT: 'visualizing',
            PAN: 'visualizing',
            SHOW_SUBSTATES: 'visualizing'
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
      machineId: 'xstate-editor',
      xstateConfig: {
        ...XStateEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        ready: async (context) => {
          await context.log('XState Editor ready');
          return context.view(
            <div className="xstate-editor">
              <div className="editor-header">
                <h3>XState Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'EDIT' })}>Edit</button>
                  <button onClick={() => context.send({ type: 'VISUALIZE' })}>Visualize</button>
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                </div>
              </div>
              <div id="xstate-visualization" className="editor-content"></div>
            </div>
          );
        },
        loading: async (context) => {
          await context.log('Loading XState content...');
          return context.view(
            <div className="xstate-editor loading">
              <div className="editor-header">
                <h3>XState Editor</h3>
              </div>
              <div className="loading-spinner">Loading content...</div>
            </div>
          );
        },
        editing: async (context) => {
          await context.log('XState editing in progress');
          return context.view(
            <div className="xstate-editor editing">
              <div className="editor-header">
                <h3>XState Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                  <button onClick={() => context.send({ type: 'VISUALIZE' })}>Visualize</button>
                  <button onClick={() => context.send({ type: 'CANCEL' })}>Cancel</button>
                </div>
              </div>
              <div id="xstate-editor-ace" className="editor-content active"></div>
            </div>
          );
        },
        visualizing: async (context) => {
          await context.log('XState visualization active');
          return context.view(
            <div className="xstate-editor visualizing">
              <div className="editor-header">
                <h3>XState Editor</h3>
                <div className="editor-controls">
                  <button onClick={() => context.send({ type: 'EDIT' })}>Edit</button>
                  <button onClick={() => context.send({ type: 'SAVE' })}>Save</button>
                  <button onClick={() => context.send({ type: 'SHOW_SUBSTATES' })}>Substates</button>
                </div>
              </div>
              <div id="xstate-visualization" className="editor-content active"></div>
              <div id="substate-machines" className="substate-container"></div>
            </div>
          );
        },
        saving: async (context) => {
          await context.log('Saving XState content...');
          return context.view(
            <div className="xstate-editor saving">
              <div className="editor-header">
                <h3>XState Editor</h3>
              </div>
              <div className="saving-spinner">Saving...</div>
            </div>
          );
        },
        error: async (context) => {
          await context.log('XState Editor error', { error: context.model.error });
          return context.view(
            <div className="xstate-editor error">
              <div className="editor-header">
                <h3>XState Editor</h3>
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

module.exports = XStateEditorTemplate; 