import React from 'react';

/**
 * Main Generic Editor View Component
 * 
 * Renders the main editor interface with subView navigation and management.
 */

export const MainEditorView = ({ context, send }) => {
  const { 
    state, 
    activeTab, 
    subViews, 
    activeSubView, 
    isLoading, 
    error,
    canvasTransform,
    zoomLevel,
    gestureType
  } = context;

  if (isLoading) {
    return (
      <div className="generic-editor loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Generic Editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="generic-editor error">
        <div className="error-message">
          <p>Error loading Generic Editor: {error}</p>
          <button onClick={() => send('RETRY')}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`generic-editor ${state}`}>
      <div className="editor-header">
        <h2>Generic Editor</h2>
        <div className="editor-controls">
          <button 
            onClick={() => send('SAVE')}
            disabled={state === 'saving'}
          >
            {state === 'saving' ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={() => send('EXPORT')}
          >
            Export
          </button>
          <button 
            onClick={() => send('IMPORT')}
          >
            Import
          </button>
        </div>
      </div>
      
      <div className="editor-tabs">
        <button 
          className={activeTab === 'html' ? 'active' : ''}
          onClick={() => send('SWITCH_TAB', { tab: 'html' })}
        >
          HTML
        </button>
        <button 
          className={activeTab === 'css' ? 'active' : ''}
          onClick={() => send('SWITCH_TAB', { tab: 'css' })}
        >
          CSS
        </button>
        <button 
          className={activeTab === 'javascript' ? 'active' : ''}
          onClick={() => send('SWITCH_TAB', { tab: 'javascript' })}
        >
          JavaScript
        </button>
        <button 
          className={activeTab === 'xstate' ? 'active' : ''}
          onClick={() => send('SWITCH_TAB', { tab: 'xstate' })}
        >
          XState
        </button>
      </div>
      
      <div className="editor-content">
        <div className="left-panel">
          <div className="panel-grabber left" id="left-grabber"></div>
          <div className="component-library-panel">
            {/* Component Library will be rendered here */}
          </div>
        </div>
        
        <div className="main-editor">
          <div className="canvas-container" id="canvas-container">
            <div 
              className="sun-editor-wrapper" 
              id="sun-editor-wrapper"
              style={{
                transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`
              }}
            >
              {/* Active editor panel will be rendered here */}
            </div>
            
            <div className="canvas-controls">
              <button 
                className="canvas-btn"
                onClick={() => send('ZOOM_IN')}
                title="Zoom In"
              >
                +
              </button>
              <button 
                className="canvas-btn"
                onClick={() => send('ZOOM_OUT')}
                title="Zoom Out"
              >
                -
              </button>
              <button 
                className="canvas-btn"
                onClick={() => send('RESET_ZOOM')}
                title="Reset Zoom"
              >
                ↺
              </button>
            </div>
            
            <div className="zoom-level">
              {Math.round(zoomLevel * 100)}%
            </div>
            
            <div className="gesture-indicator" id="gesture-indicator">
              Gesture: {gestureType || 'Pan'}
            </div>
          </div>
        </div>
        
        <div className="right-panel">
          <div className="panel-grabber right" id="right-grabber"></div>
          
          {/* SubView Navigation */}
          <div className="subview-navigation">
            <div className="subview-header">
              <h3>SubViews</h3>
              <button 
                onClick={() => send('ADD_SUBVIEW')}
                className="add-subview-btn"
                title="Add New SubView"
              >
                ➕
              </button>
            </div>
            
            <div className="subview-selector">
              <select
                value={activeSubView || ''}
                onChange={(e) => send('SWITCH_SUBVIEW', { subViewId: e.target.value })}
              >
                <option value="">Select SubView</option>
                {subViews && subViews.map((subView) => (
                  <option key={subView.id} value={subView.id}>
                    {subView.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="subview-list">
              {subViews && subViews.map((subView) => (
                <div 
                  key={subView.id}
                  className={`subview-item ${subView.isActive ? 'active' : ''}`}
                >
                  <div className="subview-info">
                    <span className="subview-name">{subView.name}</span>
                    <span className="subview-file">{subView.fileName}</span>
                  </div>
                  <div className="subview-actions">
                    <button 
                      onClick={() => send('EDIT_SUBVIEW', { subViewId: subView.id })}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => send('EXPORT_SUBVIEW', { subViewId: subView.id })}
                      title="Export"
                    >
                      📤
                    </button>
                    <button 
                      onClick={() => send('DELETE_SUBVIEW', { subViewId: subView.id })}
                      title="Delete"
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Preview Panel */}
          <div className="preview-panel">
            <h3>Preview</h3>
            <div id="preview-content">
              {/* Preview content will be rendered here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainEditorView; 