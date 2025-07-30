/**
 * Generic Editor Templates Index
 * 
 * This module exports all generic editor templates in a hierarchical structure.
 * Each template is a self-contained component that can be used independently.
 */

import { createViewStateMachine } from '../../../../../../log-view-machine/src/core/ViewStateMachine.tsx';

// Base Generic Editor Template
const GenericEditorTemplate = {
  id: 'generic-editor',
  name: 'Generic Editor',
  description: 'A comprehensive editor with HTML, CSS, JavaScript, and XState visualization',
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
            CREATE_NEW: 'editing'
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
            SWITCH_TAB: 'editing'
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
    return createViewStateMachine({
      machineId: 'generic-editor',
      xstateConfig: {
        ...GenericEditorTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        idle: async (context) => {
          await context.log('Generic Editor is idle');
          return context.view(
            '<div class="generic-editor-idle"><h2>Generic Editor</h2><p>Ready to load or create components</p></div>'
          );
        },
        loading: async (context) => {
          await context.log('Loading component...');
          return context.view(
            '<div class="generic-editor-loading"><h2>Loading Component</h2><div class="loading-spinner">Loading...</div></div>'
          );
        },
        editing: async (context) => {
          await context.log('Component loaded, ready for editing');
          return context.view(
            '<div class="generic-editor-editing"><h2>Editing Component</h2><div class="editor-tabs"><button>HTML</button><button>CSS</button><button>JavaScript</button><button>XState</button></div><div class="editor-content"></div></div>'
          );
        },
        saving: async (context) => {
          await context.log('Saving component...');
          return context.view(
            '<div class="generic-editor-saving"><h2>Saving Component</h2><div class="saving-spinner">Saving...</div></div>'
          );
        },
        error: async (context) => {
          await context.log('Error occurred', { error: context.model.error });
          return context.view(
            '<div class="generic-editor-error"><h2>Error</h2><p>An error occurred</p><button>Retry</button></div>'
          );
        }
      }
    });
  }
};

// HTML Editor Template
const HTMLEditorTemplate = {
  id: 'html-editor',
  name: 'HTML Editor',
  description: 'WYSIWYG HTML editor with SunEditor integration',
  version: '1.0.0',
  dependencies: ['generic-editor'],
  
  config: {
    machineId: 'html-editor',
    xstateConfig: {
      id: 'html-editor',
      initial: 'ready',
      states: {
        ready: {
          on: {
            EDIT: 'editing',
            SAVE: 'saving'
          }
        },
        editing: {
          on: {
            SAVE: 'saving',
            CANCEL: 'ready'
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
        editing: async (context) => {
          await context.log('HTML editing in progress');
          return context.view(
            '<div class="html-editor editing"><div class="editor-header"><h3>HTML Editor</h3><div class="editor-controls"><button>Save</button><button>Cancel</button></div></div><div id="sun-editor-wrapper" class="editor-content active"></div></div>'
          );
        }
      }
    });
  }
};

// CSS Editor Template
const CSSEditorTemplate = {
  id: 'css-editor',
  name: 'CSS Editor',
  description: 'Ace editor for CSS with syntax highlighting',
  version: '1.0.0',
  dependencies: ['generic-editor'],
  
  config: {
    machineId: 'css-editor',
    xstateConfig: {
      id: 'css-editor',
      initial: 'ready',
      states: {
        ready: {
          on: {
            EDIT: 'editing',
            SAVE: 'saving'
          }
        },
        editing: {
          on: {
            SAVE: 'saving',
            CANCEL: 'ready'
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
            '<div class="css-editor"><div class="editor-header"><h3>CSS Editor</h3><div class="editor-controls"><button>Edit</button><button>Save</button></div></div><div id="css-editor-ace" class="editor-content"></div></div>'
          );
        },
        editing: async (context) => {
          await context.log('CSS editing in progress');
          return context.view(
            '<div class="css-editor editing"><div class="editor-header"><h3>CSS Editor</h3><div class="editor-controls"><button>Save</button><button>Cancel</button></div></div><div id="css-editor-ace" class="editor-content active"></div></div>'
          );
        }
      }
    });
  }
};

// JavaScript Editor Template
const JavaScriptEditorTemplate = {
  id: 'javascript-editor',
  name: 'JavaScript Editor',
  description: 'Ace editor for JavaScript with syntax highlighting',
  version: '1.0.0',
  dependencies: ['generic-editor'],
  
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
            RUN_CODE: 'running'
          }
        },
        editing: {
          on: {
            SAVE: 'saving',
            CANCEL: 'ready',
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
            '<div class="javascript-editor"><div class="editor-header"><h3>JavaScript Editor</h3><div class="editor-controls"><button>Edit</button><button>Save</button><button>Run</button></div></div><div id="javascript-editor-ace" class="editor-content"></div></div>'
          );
        },
        editing: async (context) => {
          await context.log('JavaScript editing in progress');
          return context.view(
            '<div class="javascript-editor editing"><div class="editor-header"><h3>JavaScript Editor</h3><div class="editor-controls"><button>Save</button><button>Cancel</button><button>Run</button></div></div><div id="javascript-editor-ace" class="editor-content active"></div></div>'
          );
        }
      }
    });
  }
};

// XState Editor Template
const XStateEditorTemplate = {
  id: 'xstate-editor',
  name: 'XState Editor',
  description: 'XState visualization and editor with recursive substate support',
  version: '1.0.0',
  dependencies: ['generic-editor'],
  
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
            SAVE: 'saving'
          }
        },
        editing: {
          on: {
            SAVE: 'saving',
            VISUALIZE: 'visualizing',
            CANCEL: 'ready'
          }
        },
        visualizing: {
          on: {
            EDIT: 'editing',
            SAVE: 'saving',
            ZOOM_IN: 'visualizing',
            ZOOM_OUT: 'visualizing',
            PAN: 'visualizing'
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
            '<div class="xstate-editor"><div class="editor-header"><h3>XState Editor</h3><div class="editor-controls"><button>Edit</button><button>Visualize</button><button>Save</button></div></div><div id="xstate-visualization" class="editor-content"></div></div>'
          );
        },
        editing: async (context) => {
          await context.log('XState editing in progress');
          return context.view(
            '<div class="xstate-editor editing"><div class="editor-header"><h3>XState Editor</h3><div class="editor-controls"><button>Save</button><button>Visualize</button><button>Cancel</button></div></div><div id="xstate-editor-ace" class="editor-content active"></div></div>'
          );
        },
        visualizing: async (context) => {
          await context.log('XState visualization active');
          return context.view(
            '<div class="xstate-editor visualizing"><div class="editor-header"><h3>XState Editor</h3><div class="editor-controls"><button>Edit</button><button>Save</button><button>Substates</button></div></div><div id="xstate-visualization" class="editor-content active"></div><div id="substate-machines" class="substate-container"></div></div>'
          );
        }
      }
    });
  }
};

// Component Library Template
const ComponentLibraryTemplate = {
  id: 'component-library',
  name: 'Component Library',
  description: 'Drag and drop component library with search functionality',
  version: '1.0.0',
  dependencies: ['generic-editor'],
  
  config: {
    machineId: 'component-library',
    xstateConfig: {
      id: 'component-library',
      initial: 'ready',
      states: {
        ready: {
          on: {
            SEARCH: 'searching',
            SELECT: 'selecting',
            DRAG_START: 'dragging'
          }
        },
        searching: {
          on: {
            SEARCH_RESULTS: 'ready',
            SEARCH_ERROR: 'error'
          }
        },
        selecting: {
          on: {
            SELECT_COMPLETE: 'ready',
            SELECT_CANCEL: 'ready'
          }
        },
        dragging: {
          on: {
            DRAG_END: 'ready',
            DROP: 'dropping'
          }
        },
        dropping: {
          on: {
            DROP_SUCCESS: 'ready',
            DROP_ERROR: 'error'
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

  create: (config = {}) => {
    return createViewStateMachine({
      machineId: 'component-library',
      xstateConfig: {
        ...ComponentLibraryTemplate.config.xstateConfig,
        ...config.xstateConfig
      },
      logStates: {
        ready: async (context) => {
          await context.log('Component Library ready');
          return context.view(
            '<div class="component-library"><div class="library-header"><h3>Component Library</h3><div class="library-controls"><button>Search</button><button>Filter</button></div></div><div class="search-bar"><input type="text" placeholder="Search components..." /></div><div class="component-list"></div></div>'
          );
        },
        searching: async (context) => {
          await context.log('Searching components...');
          return context.view(
            '<div class="component-library searching"><div class="library-header"><h3>Component Library</h3></div><div class="search-bar"><input type="text" placeholder="Searching..." /><button>Cancel</button></div><div class="search-results"><div class="loading-spinner">Searching...</div></div></div>'
          );
        }
      }
    });
  }
};

// Export all templates
export {
  GenericEditorTemplate,
  HTMLEditorTemplate,
  CSSEditorTemplate,
  JavaScriptEditorTemplate,
  XStateEditorTemplate,
  ComponentLibraryTemplate
};

// Template registry
export const templates = {
  'generic-editor': GenericEditorTemplate,
  'html-editor': HTMLEditorTemplate,
  'css-editor': CSSEditorTemplate,
  'javascript-editor': JavaScriptEditorTemplate,
  'xstate-editor': XStateEditorTemplate,
  'component-library': ComponentLibraryTemplate
};

// Helper function to create template instances
export function createTemplate(templateId, config = {}) {
  const templates = {
    'generic-editor': GenericEditorTemplate,
    'html-editor': HTMLEditorTemplate,
    'css-editor': CSSEditorTemplate,
    'javascript-editor': JavaScriptEditorTemplate,
    'xstate-editor': XStateEditorTemplate,
    'component-library': ComponentLibraryTemplate
  };
  
  const template = templates[templateId];
  if (!template) {
    throw new Error(`Template '${templateId}' not found`);
  }
  return template.create(config);
}

// Get all available templates
export function getAvailableTemplates() {
  return Object.keys({
    'generic-editor': GenericEditorTemplate,
    'html-editor': HTMLEditorTemplate,
    'css-editor': CSSEditorTemplate,
    'javascript-editor': JavaScriptEditorTemplate,
    'xstate-editor': XStateEditorTemplate,
    'component-library': ComponentLibraryTemplate
  });
} 