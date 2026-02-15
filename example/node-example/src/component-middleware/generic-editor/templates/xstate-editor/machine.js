/**
 * XState Editor XState Machine
 * 
 * State machine definition for the XState editor template.
 */

export const xstateEditorMachine = {
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
};

export const xstateEditorActions = {
  // Actions for state transitions
  onEdit: (context, event) => {
    console.log('XState Editor: Entering edit mode');
  },
  
  onVisualize: (context, event) => {
    console.log('XState Editor: Entering visualization mode');
  },
  
  onSave: (context, event) => {
    console.log('XState Editor: Saving content');
  },
  
  onCancel: (context, event) => {
    console.log('XState Editor: Canceling changes');
  },
  
  onContentChanged: (context, event) => {
    console.log('XState Editor: Content changed');
  },
  
  onLoadContent: (context, event) => {
    console.log('XState Editor: Loading content');
  },
  
  onContentLoaded: (context, event) => {
    console.log('XState Editor: Content loaded');
  },
  
  onLoadError: (context, event) => {
    console.log('XState Editor: Load error', event.error);
  },
  
  onSaveSuccess: (context, event) => {
    console.log('XState Editor: Save successful');
  },
  
  onSaveError: (context, event) => {
    console.log('XState Editor: Save error', event.error);
  },
  
  onRetry: (context, event) => {
    console.log('XState Editor: Retrying operation');
  },
  
  onZoomIn: (context, event) => {
    console.log('XState Editor: Zooming in');
  },
  
  onZoomOut: (context, event) => {
    console.log('XState Editor: Zooming out');
  },
  
  onPan: (context, event) => {
    console.log('XState Editor: Panning');
  },
  
  onShowSubstates: (context, event) => {
    console.log('XState Editor: Showing substates');
  }
};

export const xstateEditorGuards = {
  // Guards for conditional transitions
  canEdit: (context, event) => {
    return context.permissions?.canEdit !== false;
  },
  
  canSave: (context, event) => {
    return context.hasChanges && context.permissions?.canSave !== false;
  },
  
  canVisualize: (context, event) => {
    return context.content && context.content.length > 0;
  },
  
  hasValidStateMachine: (context, event) => {
    try {
      const machine = JSON.parse(context.content);
      return machine && machine.config && machine.config.states;
    } catch (e) {
      return false;
    }
  },
  
  hasSubstates: (context, event) => {
    try {
      const machine = JSON.parse(context.content);
      return machine && machine.config && machine.config.states;
    } catch (e) {
      return false;
    }
  }
};

export const xstateEditorServices = {
  // Services for async operations
  loadContent: async (context, event) => {
    console.log('XState Editor: Loading content from', event.source);
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      content: JSON.stringify({
        id: 'example-machine',
        initial: 'idle',
        states: {
          idle: { on: { START: 'active' } },
          active: { on: { STOP: 'idle' } }
        }
      }, null, 2)
    };
  },
  
  saveContent: async (context, event) => {
    console.log('XState Editor: Saving content to', event.destination);
    // Simulate async saving
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, timestamp: new Date().toISOString() };
  },
  
  validateStateMachine: async (context, event) => {
    console.log('XState Editor: Validating state machine');
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 200));
    return { valid: true, errors: [] };
  },
  
  generateVisualization: async (context, event) => {
    console.log('XState Editor: Generating visualization');
    // Simulate visualization generation
    await new Promise(resolve => setTimeout(resolve, 300));
    return { 
      visualization: '<div>Generated visualization</div>',
      substates: []
    };
  }
}; 