import React from 'react';

/**
 * CSS Editor View Component
 * 
 * Renders the CSS editor interface with Ace editor integration.
 */

export const CSSEditorView = ({ context, send }) => {
  const { state, content, isEditing, isLoading, error } = context;

  if (isLoading) {
    return (
      <div className="css-editor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading CSS editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="css-editor error">
        <div className="error-message">
          <p>Error loading CSS editor: {error}</p>
          <button onClick={() => send('RETRY')}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`css-editor ${state}`}>
      <div className="editor-header">
        <h3>CSS Editor</h3>
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
        <div id="css-editor-ace">
          {/* Ace editor will be initialized here */}
        </div>
      </div>
    </div>
  );
};

export default CSSEditorView; 