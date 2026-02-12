const { createViewStateMachine } = require('log-view-machine');

/**
 * TeleportHQ Configuration
 */
class TeleportHQConfig {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.TELEPORTHQ_API_KEY;
    this.projectId = options.projectId || process.env.TELEPORTHQ_PROJECT_ID;
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.enableRealTimeSync = options.enableRealTimeSync !== false;
    this.enableComponentStateSync = options.enableComponentStateSync !== false;
    this.baseUrl = options.baseUrl || 'https://api.teleporthq.io';
  }
}

/**
 * TeleportHQ Component
 */
class TeleportHQComponent {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.props = data.props || {};
    this.children = data.children || [];
    this.state = data.state || {};
    this.callbacks = data.callbacks || {};
  }

  toReactComponent() {
    return {
      id: this.id,
      name: this.name,
      props: this.props,
      children: this.children.map(child => child.toReactComponent()),
      state: this.state,
      callbacks: this.callbacks
    };
  }
}

/**
 * TeleportHQ Template
 */
class TeleportHQTemplate {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.components = (data.components || []).map(comp => new TeleportHQComponent(comp));
    this.variables = data.variables || {};
    this.stateSchema = data.stateSchema || {};
  }

  getComponentById(id) {
    return this.components.find(comp => comp.id === id);
  }

  getComponentsByType(type) {
    return this.components.filter(comp => comp.name === type);
  }
}

/**
 * TeleportHQ Adapter for Node.js
 */
class TeleportHQAdapter {
  constructor(config = {}) {
    this.config = new TeleportHQConfig(config);
    this.templates = new Map();
    this.viewStateMachines = new Map();
    this.connections = new Map();
  }

  /**
   * Load template from TeleportHQ API
   */
  async loadTemplate(templateId) {
    try {
      const response = await fetch(`${this.config.baseUrl}/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const templateData = await response.json();
      const template = new TeleportHQTemplate(templateData);
      this.templates.set(templateId, template);
      
      console.log(`Loaded TeleportHQ template: ${template.name} (${templateId})`);
      return template;
    } catch (error) {
      console.error('Error loading TeleportHQ template:', error);
      throw error;
    }
  }

  /**
   * Convert TeleportHQ template to ViewStateMachine config
   */
  createViewStateMachineFromTemplate(templateId, initialState = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found. Load it first with loadTemplate().`);
    }

    const config = this.convertTemplateToViewStateMachineConfig(template, initialState);
    const viewStateMachine = createViewStateMachine(config);
    
    this.viewStateMachines.set(templateId, viewStateMachine);
    return viewStateMachine;
  }

  /**
   * Convert template to ViewStateMachine configuration
   */
  convertTemplateToViewStateMachineConfig(template, initialState) {
    // Extract state variables from template
    const stateVariables = this.extractStateVariables(template);
    
    // Create XState config
    const xstateConfig = {
      id: `teleporthq-${template.id}`,
      initial: 'idle',
      context: {
        ...initialState,
        templateId: template.id,
        components: template.components.map(comp => comp.toReactComponent()),
        variables: template.variables,
      },
      states: {
        idle: {
          on: {
            // Dynamic events based on template callbacks
            ...this.createEventsFromCallbacks(template),
          },
        },
        loading: {
          on: {
            LOADED: 'idle',
            ERROR: 'error',
          },
        },
        error: {
          on: {
            RETRY: 'loading',
          },
        },
      },
    };

    // Create log states that render TeleportHQ components
    const logStates = {
      idle: async ({ state, model, log, view, transition }) => {
        await log('TeleportHQ template rendered', {
          templateId: model.templateId,
          componentCount: model.components.length,
        });

        const renderedComponents = this.renderTeleportHQComponents(
          model.components, 
          model.variables,
          transition
        );

        view(
          React.createElement('div', { className: 'teleporthq-template' },
            React.createElement('h3', null, `Template: ${template.name}`),
            ...renderedComponents
          )
        );
      },
    };

    return {
      machineId: `teleporthq-${template.id}`,
      xstateConfig,
      logStates,
    };
  }

  /**
   * Extract state variables from template
   */
  extractStateVariables(template) {
    const variables = {};
    
    // Extract variables from template
    if (template.variables) {
      Object.entries(template.variables).forEach(([key, value]) => {
        variables[key] = value;
      });
    }

    // Extract state from components
    template.components.forEach(component => {
      if (component.state) {
        Object.entries(component.state).forEach(([key, value]) => {
          variables[`${component.id}_${key}`] = value;
        });
      }
    });

    return variables;
  }

  /**
   * Create events from template callbacks
   */
  createEventsFromCallbacks(template) {
    const events = {};

    template.components.forEach(component => {
      if (component.callbacks) {
        Object.entries(component.callbacks).forEach(([callbackName, eventType]) => {
          events[eventType] = {
            target: 'idle',
            actions: `handle${callbackName.charAt(0).toUpperCase() + callbackName.slice(1)}`,
          };
        });
      }
    });

    return events;
  }

  /**
   * Render TeleportHQ components
   */
  renderTeleportHQComponents(components, variables, transition) {
    return components.map(component => {
      const Component = this.createReactComponentFromTeleportHQ(component, variables, transition);
      return React.createElement(Component, { key: component.id });
    });
  }

  /**
   * Create React component from TeleportHQ component
   */
  createReactComponentFromTeleportHQ(component, variables, transition) {
    const Component = (props) => {
      const componentProps = {
        ...component.props,
        ...variables,
        ...props,
      };

      // Handle callbacks
      const callbackProps = {};
      if (component.callbacks) {
        Object.entries(component.callbacks).forEach(([callbackName, eventType]) => {
          callbackProps[callbackName] = (data) => {
            transition(eventType, data);
          };
        });
      }

      // Render component based on type
      switch (component.name) {
        case 'Button':
          return React.createElement('button', {
            ...componentProps,
            ...callbackProps,
            className: 'teleporthq-button'
          }, componentProps.children || componentProps.text);
        
        case 'Input':
          return React.createElement('input', {
            ...componentProps,
            className: 'teleporthq-input'
          });
        
        case 'Container':
          return React.createElement('div', {
            ...componentProps,
            className: 'teleporthq-container'
          }, component.children?.map(child => 
            this.createReactComponentFromTeleportHQ(child, variables, transition)(props)
          ));
        
        default:
          return React.createElement('div', {
            className: `teleporthq-${component.name.toLowerCase()}`
          }, componentProps.children || componentProps.text);
      }
    };
    
    return Component;
  }

  /**
   * Sync ViewStateMachine state with TeleportHQ
   */
  syncWithTeleportHQ(viewStateMachine, templateId) {
    if (this.config.enableRealTimeSync) {
      this.setupRealTimeSync(viewStateMachine, templateId);
    }
  }

  /**
   * Setup real-time sync
   */
  setupRealTimeSync(viewStateMachine, templateId) {
    console.log(`Setting up real-time sync for template ${templateId}`);
    // This would set up WebSocket or polling to sync state changes
    // back to TeleportHQ for real-time collaboration
  }

  /**
   * Export ViewStateMachine state to TeleportHQ
   */
  async exportToTeleportHQ(templateId, state) {
    try {
      await fetch(`${this.config.baseUrl}/templates/${templateId}/state`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state }),
      });
    } catch (error) {
      console.error('Error exporting state to TeleportHQ:', error);
    }
  }

  /**
   * Get all loaded templates
   */
  getLoadedTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Get ViewStateMachine for template
   */
  getViewStateMachine(templateId) {
    return this.viewStateMachines.get(templateId);
  }

  /**
   * Create a connection between templates
   */
  connectTemplates(sourceTemplateId, targetTemplateId, config = {}) {
    const sourceMachine = this.getViewStateMachine(sourceTemplateId);
    const targetMachine = this.getViewStateMachine(targetTemplateId);
    
    if (!sourceMachine || !targetMachine) {
      throw new Error('Both source and target templates must be loaded and converted to ViewStateMachines');
    }

    const connectionId = `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Setup event forwarding
    if (config.eventMapping) {
      Object.entries(config.eventMapping).forEach(([sourceEvent, targetEvent]) => {
        sourceMachine.on('event', (event) => {
          if (event.type === sourceEvent) {
            targetMachine.send({
              type: targetEvent,
              ...event,
              _forwarded: true,
              _source: sourceTemplateId,
            });
          }
        });
      });
    }

    // Setup state forwarding
    if (config.stateMapping) {
      sourceMachine.on('stateChange', (newState, oldState) => {
        const stateUpdates = {};
        Object.entries(config.stateMapping).forEach(([sourcePath, targetPath]) => {
          const sourceValue = this.getStateValue(newState, sourcePath);
          if (sourceValue !== undefined) {
            stateUpdates[targetPath] = sourceValue;
          }
        });

        if (Object.keys(stateUpdates).length > 0) {
          targetMachine.send({
            type: 'SYNC_STATE',
            updates: stateUpdates,
            _forwarded: true,
            _source: sourceTemplateId,
          });
        }
      });
    }

    this.connections.set(connectionId, {
      sourceTemplateId,
      targetTemplateId,
      config
    });

    console.log(`Connected templates: ${sourceTemplateId} <-> ${targetTemplateId}`);
    return connectionId;
  }

  /**
   * Get state value by path
   */
  getStateValue(state, path) {
    return path.split('.').reduce((obj, key) => obj?.[key], state);
  }

  /**
   * Disconnect templates
   */
  disconnectTemplates(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      this.connections.delete(connectionId);
      console.log(`Disconnected templates: ${connection.sourceTemplateId} <-> ${connection.targetTemplateId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all connections
   */
  getConnections() {
    return Array.from(this.connections.entries());
  }
}

/**
 * Create TeleportHQ adapter
 */
function createTeleportHQAdapter(config = {}) {
  return new TeleportHQAdapter(config);
}

module.exports = {
  TeleportHQAdapter,
  TeleportHQConfig,
  TeleportHQComponent,
  TeleportHQTemplate,
  createTeleportHQAdapter,
}; 