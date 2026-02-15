/**
 * HTML Editor XState Machine
 * 
 * State machine definition for the HTML editor template.
 */

export const htmlEditorMachine = {
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
};

export const htmlEditorActions = {
  // Actions for state transitions
  onEdit: (context, event) => {
    console.log('HTML Editor: Entering edit mode');
  },
  
  onSave: (context, event) => {
    console.log('HTML Editor: Saving content');
  },
  
  onCancel: (context, event) => {
    console.log('HTML Editor: Canceling changes');
  },
  
  onContentChanged: (context, event) => {
    console.log('HTML Editor: Content changed');
  },
  
  onLoadContent: (context, event) => {
    console.log('HTML Editor: Loading content');
  },
  
  onContentLoaded: (context, event) => {
    console.log('HTML Editor: Content loaded');
  },
  
  onLoadError: (context, event) => {
    console.log('HTML Editor: Load error', event.error);
  },
  
  onSaveSuccess: (context, event) => {
    console.log('HTML Editor: Save successful');
  },
  
  onSaveError: (context, event) => {
    console.log('HTML Editor: Save error', event.error);
  },
  
  onRetry: (context, event) => {
    console.log('HTML Editor: Retrying operation');
  }
};

export const htmlEditorGuards = {
  // Guards for conditional transitions
  canEdit: (context, event) => {
    return context.permissions?.canEdit !== false;
  },
  
  canSave: (context, event) => {
    return context.hasChanges && context.permissions?.canSave !== false;
  },
  
  hasContent: (context, event) => {
    return context.content && context.content.length > 0;
  }
};

export const htmlEditorServices = {
  // Services for async operations
  loadContent: async (context, event) => {
    console.log('HTML Editor: Loading content from', event.source);
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { content: '<div>Loaded HTML content</div>' };
  },
  
  saveContent: async (context, event) => {
    console.log('HTML Editor: Saving content to', event.destination);
    // Simulate async saving
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true, timestamp: new Date().toISOString() };
  }
}; 