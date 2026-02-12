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
            FILTER: 'filtering',
            LOAD_COMPONENTS: 'loading'
          }
        },
        loading: {
          on: {
            COMPONENTS_LOADED: 'ready',
            LOAD_ERROR: 'error'
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

  // Available components
  components: [
    {
      id: 'burger-cart-component',
      name: 'Burger Cart Component',
      description: 'Interactive burger cart with ingredient builder and cart management',
      category: 'E-commerce',
      type: 'component',
      icon: '🍔',
      template: 'burger-cart-component',
      tags: ['cart', 'ecommerce', 'burger', 'checkout', 'payment']
    },
    {
      id: 'html-editor',
      name: 'HTML Editor',
      description: 'Rich text editor for HTML content',
      category: 'Editor',
      type: 'editor',
      icon: '📝',
      template: 'html-editor',
      tags: ['html', 'editor', 'text', 'content']
    },
    {
      id: 'css-editor',
      name: 'CSS Editor',
      description: 'Code editor for CSS styling',
      category: 'Editor',
      type: 'editor',
      icon: '🎨',
      template: 'css-editor',
      tags: ['css', 'editor', 'styling', 'design']
    },
    {
      id: 'javascript-editor',
      name: 'JavaScript Editor',
      description: 'Code editor for JavaScript functionality',
      category: 'Editor',
      type: 'editor',
      icon: '⚡',
      template: 'javascript-editor',
      tags: ['javascript', 'editor', 'code', 'functionality']
    },
    {
      id: 'xstate-editor',
      name: 'XState Editor',
      description: 'State machine editor with visualization',
      category: 'Editor',
      type: 'editor',
      icon: '🔄',
      template: 'xstate-editor',
      tags: ['xstate', 'state-machine', 'editor', 'visualization']
    },
    {
      id: 'generic-editor',
      name: 'Generic Editor',
      description: 'Comprehensive editor with multiple tabs and features',
      category: 'Editor',
      type: 'editor',
      icon: '🛠️',
      template: 'generic-editor',
      tags: ['editor', 'comprehensive', 'multi-tab', 'development']
    }
  ],

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
          
          const components = context.model.components || ComponentLibraryTemplate.components;
          const filteredComponents = context.model.filteredComponents || components;
          
          return context.view(`
            <div class="component-library">
              <div class="library-header">
                <h3>📚 Component Library</h3>
                <div class="library-controls">
                  <button class="btn btn-sm btn-primary" onclick="context.send({ type: 'SEARCH' })">
                    🔍 Search
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="context.send({ type: 'FILTER' })">
                    🎯 Filter
                  </button>
                </div>
              </div>
              
              <div class="search-bar">
                <input type="text" id="component-search" placeholder="Search components..." 
                       oninput="searchComponents(this.value)" />
              </div>
              
              <div class="component-list">
                ${filteredComponents.map(component => `
                  <div class="component-item" data-component-id="${component.id}">
                    <div class="component-icon">${component.icon}</div>
                    <div class="component-info">
                      <h4 class="component-name">${component.name}</h4>
                      <p class="component-description">${component.description}</p>
                      <div class="component-meta">
                        <span class="component-category">${component.category}</span>
                        <span class="component-type">${component.type}</span>
                      </div>
                      <div class="component-tags">
                        ${component.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                      </div>
                    </div>
                    <div class="component-actions">
                      <button class="btn btn-sm btn-primary" onclick="selectComponent('${component.id}')">
                        Select
                      </button>
                      <button class="btn btn-sm btn-secondary" onclick="previewComponent('${component.id}')">
                        Preview
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="library-footer">
                <p>${filteredComponents.length} components available</p>
              </div>
            </div>
          `);
        },
        
        loading: async (context) => {
          await context.log('Loading components...');
          return context.view(`
            <div class="component-library loading">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="loading-content">
                <div class="loading-spinner">🔄</div>
                <p>Loading components...</p>
              </div>
            </div>
          `);
        },
        
        searching: async (context) => {
          await context.log('Searching components...');
          return context.view(`
            <div class="component-library searching">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="search-bar">
                <input type="text" id="search-input" placeholder="Searching..." 
                       value="${context.model.searchQuery || ''}" />
                <button class="btn btn-sm btn-secondary" onclick="context.send({ type: 'SEARCH_CANCEL' })">
                  Cancel
                </button>
              </div>
              <div class="search-results">
                <div class="loading-spinner">🔍</div>
                <p>Searching for "${context.model.searchQuery || ''}"...</p>
              </div>
            </div>
          `);
        },
        
        filtering: async (context) => {
          await context.log('Filtering components...');
          return context.view(`
            <div class="component-library filtering">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="filter-controls">
                <select id="category-filter" onchange="applyFilter()">
                  <option value="">All Categories</option>
                  <option value="Editor">Editor</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="UI">UI</option>
                  <option value="Form">Form</option>
                </select>
                
                <select id="type-filter" onchange="applyFilter()">
                  <option value="">All Types</option>
                  <option value="component">Component</option>
                  <option value="editor">Editor</option>
                  <option value="template">Template</option>
                </select>
                
                <button class="btn btn-sm btn-primary" onclick="context.send({ type: 'FILTER_RESULTS' })">
                  Apply
                </button>
                <button class="btn btn-sm btn-secondary" onclick="context.send({ type: 'FILTER_CLEAR' })">
                  Clear
                </button>
              </div>
              <div class="component-list">
                ${(context.model.filteredComponents || ComponentLibraryTemplate.components).map(component => `
                  <div class="component-item" data-component-id="${component.id}">
                    <div class="component-icon">${component.icon}</div>
                    <div class="component-info">
                      <h4 class="component-name">${component.name}</h4>
                      <p class="component-description">${component.description}</p>
                      <div class="component-meta">
                        <span class="component-category">${component.category}</span>
                        <span class="component-type">${component.type}</span>
                      </div>
                    </div>
                    <div class="component-actions">
                      <button class="btn btn-sm btn-primary" onclick="selectComponent('${component.id}')">
                        Select
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `);
        },
        
        selecting: async (context) => {
          await context.log('Selecting component...');
          return context.view(`
            <div class="component-library selecting">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="selection-mode">
                <p>🎯 Click on a component to select it</p>
                <button class="btn btn-sm btn-secondary" onclick="context.send({ type: 'SELECT_CANCEL' })">
                  Cancel Selection
                </button>
              </div>
              <div class="component-list">
                ${(context.model.components || ComponentLibraryTemplate.components).map(component => `
                  <div class="component-item selectable" data-component-id="${component.id}" 
                       onclick="selectComponent('${component.id}')">
                    <div class="component-icon">${component.icon}</div>
                    <div class="component-info">
                      <h4 class="component-name">${component.name}</h4>
                      <p class="component-description">${component.description}</p>
                      <div class="component-meta">
                        <span class="component-category">${component.category}</span>
                        <span class="component-type">${component.type}</span>
                      </div>
                    </div>
                    <div class="selection-indicator">✓</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `);
        },
        
        dragging: async (context) => {
          await context.log('Dragging component...');
          return context.view(`
            <div class="component-library dragging">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="drag-indicator">
                <p>🎯 Drag component to target area</p>
                <div class="drag-preview">
                  ${context.model.draggedComponent ? `
                    <div class="component-icon">${context.model.draggedComponent.icon}</div>
                    <span>${context.model.draggedComponent.name}</span>
                  ` : 'No component selected'}
                </div>
              </div>
              <div class="component-list">
                ${(context.model.components || ComponentLibraryTemplate.components).map(component => `
                  <div class="component-item draggable" data-component-id="${component.id}" 
                       draggable="true" ondragstart="startDrag(event, '${component.id}')">
                    <div class="component-icon">${component.icon}</div>
                    <div class="component-info">
                      <h4 class="component-name">${component.name}</h4>
                      <p class="component-description">${component.description}</p>
                    </div>
                    <div class="drag-handle">⋮⋮</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `);
        },
        
        dropping: async (context) => {
          await context.log('Dropping component...');
          return context.view(`
            <div class="component-library dropping">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="drop-indicator">
                <div class="drop-spinner">🔄</div>
                <p>Processing drop...</p>
                <p>Dropping: ${context.model.draggedComponent?.name || 'Unknown component'}</p>
              </div>
            </div>
          `);
        },
        
        error: async (context) => {
          await context.log('Component Library error', { error: context.model.error });
          return context.view(`
            <div class="component-library error">
              <div class="library-header">
                <h3>📚 Component Library</h3>
              </div>
              <div class="error-message">
                <div class="error-icon">❌</div>
                <h4>Error Loading Components</h4>
                <p>${context.model.error?.message || 'An error occurred while loading components'}</p>
                <button class="btn btn-primary" onclick="context.send({ type: 'RETRY' })">
                  🔄 Retry
                </button>
              </div>
            </div>
          `);
        }
      }
    });
  }
};

module.exports = ComponentLibraryTemplate; 