import React from 'react';

/**
 * JavaScript Editor View Component
 * 
 * Renders the JavaScript editor interface with Ace editor integration.
 */

export const JavaScriptEditorView = ({ context, send }) => {
  const { state, content, isEditing, isLoading, error } = context;

  if (isLoading) {
    return (
      <div className="javascript-editor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading JavaScript editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="javascript-editor error">
        <div className="error-message">
          <p>Error loading JavaScript editor: {error}</p>
          <button onClick={() => send('RETRY')}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`javascript-editor ${state}`}>
      <div className="editor-header">
        <h3>JavaScript Editor</h3>
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
          <button 
            onClick={() => send('RUN')}
            disabled={state === 'running'}
            className="run-button"
          >
            {state === 'running' ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        <div id="javascript-editor-ace">
          {/* Ace editor will be initialized here */}
        </div>
      </div>
    </div>
  );
};

export default JavaScriptEditorView; 