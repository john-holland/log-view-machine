import React from 'react';

/**
 * XState Editor View Component
 * 
 * Renders the XState editor interface with visualization and substate support.
 */

export const XStateEditorView = ({ context, send }) => {
  const { state, content, isEditing, isLoading, error, visualization, substates } = context;

  if (isLoading) {
    return (
      <div className="xstate-editor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading XState editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="xstate-editor error">
        <div className="error-message">
          <p>Error loading XState editor: {error}</p>
          <button onClick={() => send('RETRY')}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`xstate-editor ${state}`}>
      <div className="editor-header">
        <h3>XState Editor</h3>
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
            onClick={() => send('VISUALIZE')}
            disabled={state === 'visualizing'}
          >
            {state === 'visualizing' ? 'Visualizing...' : 'Visualize'}
          </button>
          <button 
            onClick={() => send('SHOW_SUBSTATES')}
            className="substate-btn"
          >
            🔽 Substates
          </button>
        </div>
      </div>
      
      <div className="editor-content">
        {state === 'visualizing' ? (
          <div id="xstate-visualization">
            <div className="state-machine-diagram">
              {visualization && (
                <div dangerouslySetInnerHTML={{ __html: visualization }} />
              )}
            </div>
            
            {substates && substates.length > 0 && (
              <div className="substate-machines">
                <h4>Substate Machines</h4>
                <div className="substate-container">
                  {substates.map((substate, index) => (
                    <div key={index} className="substate-machine">
                      <div className="substate-header">
                        <span className="substate-name">{substate.name}</span>
                        <div className="substate-zoom">
                          <button 
                            className="substate-zoom-btn"
                            onClick={() => send('ZOOM_IN', { index })}
                          >
                            +
                          </button>
                          <button 
                            className="substate-zoom-btn"
                            onClick={() => send('ZOOM_OUT', { index })}
                          >
                            -
                          </button>
                          <button 
                            className="substate-zoom-btn"
                            onClick={() => send('RESET_ZOOM', { index })}
                          >
                            ↺
                          </button>
                        </div>
                      </div>
                      <div className="substate-canvas">
                        <div dangerouslySetInnerHTML={{ __html: substate.diagram }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div id="xstate-editor-ace">
            {/* Ace editor will be initialized here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default XStateEditorView; 