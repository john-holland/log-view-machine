/**
 * HTML Editor Template
 * 
 * A standalone HTML editor component using SunEditor with WYSIWYG capabilities.
 * This template can be used independently or as part of the generic editor.
 */

import { createViewStateMachine } from '../../../../../../log-view-machine/src/core/ViewStateMachine.tsx';

const HTMLEditorTemplate = {
  id: 'html-editor',
  name: 'HTML Editor',
  description: 'WYSIWYG HTML editor with SunEditor integration',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
  config: {
    machineId: 'html-editor',
    xstateConfig: {
      id: 'html-editor',
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
      machineId: 'html-editor',
      xstateConfig: {
        ...HTMLEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        ready: async (context) => {
          await context.log('HTML Editor ready');
          return context.view(
            '<div class="html-editor"><div class="editor-header"><h3>HTML Editor</h3><div class="editor-controls"><button>Edit</button><button>Save</button></div></div><div id="sun-editor-wrapper" class="editor-content"></div></div>'
          );
        },
        loading: async (context) => {
          await context.log('Loading HTML content...');
          return context.view(
            '<div class="html-editor loading"><div class="editor-header"><h3>HTML Editor</h3></div><div class="loading-spinner">Loading content...</div></div>'
          );
        },
        editing: async (context) => {
          await context.log('HTML editing in progress');
          return context.view(
            '<div class="html-editor editing"><div class="editor-header"><h3>HTML Editor</h3><div class="editor-controls"><button>Save</button><button>Cancel</button></div></div><div id="sun-editor-wrapper" class="editor-content active"></div></div>'
          );
        },
        saving: async (context) => {
          await context.log('Saving HTML content...');
          return context.view(
            '<div class="html-editor saving"><div class="editor-header"><h3>HTML Editor</h3></div><div class="saving-spinner">Saving...</div></div>'
          );
        },
        error: async (context) => {
          await context.log('HTML Editor error', { error: context.model.error });
          return context.view(
            '<div class="html-editor error"><div class="editor-header"><h3>HTML Editor</h3></div><div class="error-message"><p>An error occurred</p><button>Retry</button></div></div>'
          );
        }
      }
    });
  }
};

export { HTMLEditorTemplate }; 