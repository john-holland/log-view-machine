/**
 * Component Library Template
 * 
 * A standalone component library with drag and drop functionality and search capabilities.
 * This template can be used independently or as part of the generic editor.
 */

const { createViewStateMachine } = require('../../../../../log-view-machine/src/core/ViewStateMachine');

const ComponentLibraryTemplate = {
  id: 'component-library',
  name: 'Component Library',
  description: 'Drag and drop component library with search functionality',
  version: '1.0.0',
  dependencies: ['log-view-machine'],
  
  // Template configuration
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
            DRAG_START: 'dragging',
            FILTER: 'filtering'
          }
        },
        searching: {
          on: {
            SEARCH_RESULTS: 'ready',
            SEARCH_ERROR: 'error',
            SEARCH_CANCEL: 'ready'
          }
        },
        filtering: {
          on: {
            FILTER_RESULTS: 'ready',
            FILTER_CLEAR: 'ready'
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

  // Create the template instance
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
            <div className="component-library">
              <div className="library-header">
                <h3>Component Library</h3>
                <div className="library-controls">
                  <button onClick={() => context.send({ type: 'SEARCH' })}>Search</button>
                  <button onClick={() => context.send({ type: 'FILTER' })}>Filter</button>
                </div>
              </div>
              <div className="search-bar">
                <input type="text" placeholder="Search components..." />
              </div>
              <div className="component-list">
                {/* Component list will be populated here */}
              </div>
            </div>
          );
        },
        searching: async (context) => {
          await context.log('Searching components...');
          return context.view(
            <div className="component-library searching">
              <div className="library-header">
                <h3>Component Library</h3>
              </div>
              <div className="search-bar">
                <input type="text" placeholder="Searching..." />
                <button onClick={() => context.send({ type: 'SEARCH_CANCEL' })}>Cancel</button>
              </div>
              <div className="search-results">
                <div className="loading-spinner">Searching...</div>
              </div>
            </div>
          );
        },
        filtering: async (context) => {
          await context.log('Filtering components...');
          return context.view(
            <div className="component-library filtering">
              <div className="library-header">
                <h3>Component Library</h3>
              </div>
              <div className="filter-controls">
                <select>
                  <option>All Categories</option>
                  <option>HTML</option>
                  <option>CSS</option>
                  <option>JavaScript</option>
                  <option>XState</option>
                </select>
                <button onClick={() => context.send({ type: 'FILTER_RESULTS' })}>Apply</button>
                <button onClick={() => context.send({ type: 'FILTER_CLEAR' })}>Clear</button>
              </div>
              <div className="component-list">
                {/* Filtered component list */}
              </div>
            </div>
          );
        },
        selecting: async (context) => {
          await context.log('Selecting component...');
          return context.view(
            <div className="component-library selecting">
              <div className="library-header">
                <h3>Component Library</h3>
              </div>
              <div className="selection-mode">
                <p>Click on a component to select it</p>
                <button onClick={() => context.send({ type: 'SELECT_CANCEL' })}>Cancel</button>
              </div>
              <div className="component-list">
                {/* Selectable component list */}
              </div>
            </div>
          );
        },
        dragging: async (context) => {
          await context.log('Dragging component...');
          return context.view(
            <div className="component-library dragging">
              <div className="library-header">
                <h3>Component Library</h3>
              </div>
              <div className="drag-indicator">
                <p>Drag component to target area</p>
              </div>
              <div className="component-list">
                {/* Draggable component list */}
              </div>
            </div>
          );
        },
        dropping: async (context) => {
          await context.log('Dropping component...');
          return context.view(
            <div className="component-library dropping">
              <div className="library-header">
                <h3>Component Library</h3>
              </div>
              <div className="drop-indicator">
                <p>Processing drop...</p>
              </div>
            </div>
          );
        },
        error: async (context) => {
          await context.log('Component Library error', { error: context.model.error });
          return context.view(
            <div className="component-library error">
              <div className="library-header">
                <h3>Component Library</h3>
              </div>
              <div className="error-message">
                <p>{context.model.error?.message || 'An error occurred'}</p>
                <button onClick={() => context.send({ type: 'RETRY' })}>Retry</button>
              </div>
            </div>
          );
        }
      }
    });
  }
};

module.exports = ComponentLibraryTemplate; 