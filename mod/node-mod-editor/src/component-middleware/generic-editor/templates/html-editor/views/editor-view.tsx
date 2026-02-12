import React from 'react';

/**
 * HTML Editor View Component
 * 
 * Renders the HTML editor interface with SunEditor integration.
 */

export const HTMLEditorView = ({ context, send }) => {
  const { state, content, isEditing, isLoading, error } = context;

  if (isLoading) {
    return (
      <div className="html-editor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading HTML editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="html-editor error">
        <div className="error-message">
          <p>Error loading HTML editor: {error}</p>
          <button onClick={() => send('RETRY')}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`html-editor ${state}`}>
      <div className="editor-header">
        <h3>HTML Editor</h3>
        <div className="editor-controls">
          <button 
            onClick={() => send('SAVE')}
            disabled={state === 'saving'}
          >
            {state === 'saving' ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={() => send('EDIT')}
            disabled={state === 'editing'}
          >
            {state === 'editing' ? 'Editing...' : 'Edit'}
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div id="sun-editor-wrapper">
          {/* SunEditor will be initialized here */}
        </div>
      </div>
    </div>
  );
};

export default HTMLEditorView; 