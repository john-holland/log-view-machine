import React from 'react';

/**
 * Component Library View Component
 * 
 * Renders the component library interface with search, filtering, and drag-drop.
 */

export const ComponentLibraryView = ({ context, send }) => {
  const { 
    state, 
    components, 
    searchQuery, 
    selectedCategory, 
    isLoading, 
    error,
    dragState,
    selectedComponents 
  } = context;

  if (isLoading) {
    return (
      <div className="component-library loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading component library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="component-library error">
        <div className="error-message">
          <p>Error loading component library: {error}</p>
          <button onClick={() => send('RETRY')}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`component-library ${state}`}>
      <div className="library-header">
        <h3>Component Library</h3>
        <div className="library-controls">
          <button 
            onClick={() => send('REFRESH')}
            disabled={state === 'loading'}
          >
            Refresh
          </button>
          <button 
            onClick={() => send('IMPORT')}
          >
            Import
          </button>
        </div>
      </div>
      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery || ''}
          onChange={(e) => send('SEARCH', { query: e.target.value })}
        />
      </div>
      
      <div className="filter-controls">
        <select
          value={selectedCategory || 'all'}
          onChange={(e) => send('FILTER', { category: e.target.value })}
        >
          <option value="all">All Categories</option>
          <option value="ui">UI Components</option>
          <option value="layout">Layout Components</option>
          <option value="form">Form Components</option>
          <option value="data">Data Components</option>
        </select>
        <button onClick={() => send('CLEAR_FILTERS')}>
          Clear
        </button>
      </div>
      
      {state === 'selecting' && (
        <div className="selection-mode">
          <p>Select components to add to your project</p>
          <button onClick={() => send('CANCEL_SELECTION')}>
            Cancel
          </button>
        </div>
      )}
      
      {state === 'dragging' && (
        <div className="drag-indicator">
          <p>Drag components to the editor</p>
        </div>
      )}
      
      {state === 'dropping' && (
        <div className="drop-indicator">
          <p>Drop components here</p>
        </div>
      )}
      
      <div className="component-list">
        {components && components.map((component) => (
          <div 
            key={component.id}
            className={`component-item ${dragState === component.id ? 'dragging' : ''}`}
            draggable={state === 'dragging'}
            onDragStart={(e) => send('DRAG_START', { componentId: component.id })}
            onDragEnd={() => send('DRAG_END')}
            onClick={() => send('SELECT_COMPONENT', { componentId: component.id })}
          >
            <div className="component-icon">
              {component.icon || '📦'}
            </div>
            <div className="component-info">
              <div className="component-name">{component.name}</div>
              <div className="component-description">{component.description}</div>
            </div>
            <div className="component-actions">
              <button onClick={(e) => {
                e.stopPropagation();
                send('PREVIEW_COMPONENT', { componentId: component.id });
              }}>
                👁️
              </button>
              <button onClick={(e) => {
                e.stopPropagation();
                send('ADD_COMPONENT', { componentId: component.id });
              }}>
                ➕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentLibraryView; 