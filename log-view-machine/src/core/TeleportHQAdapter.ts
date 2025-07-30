import React from 'react';
import { ViewStateMachine } from './ViewStateMachine';
import { RobotCopy } from './RobotCopy';

export interface TeleportHQConfig {
  apiKey: string;
  projectId: string;
  environment: 'development' | 'staging' | 'production';
  enableRealTimeSync?: boolean;
  enableComponentStateSync?: boolean;
}

export interface TeleportHQComponent {
  id: string;
  name: string;
  props: Record<string, any>;
  children?: TeleportHQComponent[];
  state?: any;
  callbacks?: Record<string, string>; // callback name -> event type mapping
}

export interface TeleportHQTemplate {
  id: string;
  name: string;
  components: TeleportHQComponent[];
  variables: Record<string, any>;
  stateSchema?: any;
}

export class TeleportHQAdapter {
  private config: TeleportHQConfig;
  private templates: Map<string, TeleportHQTemplate> = new Map();
  private viewStateMachines: Map<string, ViewStateMachine<any>> = new Map();
  private robotCopy?: RobotCopy;

  constructor(config: TeleportHQConfig) {
    this.config = config;
  }

  // Load template from TeleportHQ API
  async loadTemplate(templateId: string): Promise<TeleportHQTemplate> {
    try {
      const response = await fetch(`https://api.teleporthq.io/templates/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }

      const template = await response.json();
      this.templates.set(templateId, template);
      return template;
    } catch (error) {
      console.error('Error loading TeleportHQ template:', error);
      throw error;
    }
  }

  // Convert TeleportHQ template to React components with ViewStateMachine integration
  createViewStateMachineFromTemplate(
    templateId: string, 
    initialState: any = {}
  ): ViewStateMachine<any> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found. Load it first with loadTemplate().`);
    }

    // Create ViewStateMachine config from template
    const config = this.convertTemplateToViewStateMachineConfig(template, initialState);
    const viewStateMachine = new ViewStateMachine(config);
    
    this.viewStateMachines.set(templateId, viewStateMachine);
    return viewStateMachine;
  }

  private convertTemplateToViewStateMachineConfig(
    template: TeleportHQTemplate, 
    initialState: any
  ) {
    // Extract state variables from template
    const stateVariables = this.extractStateVariables(template);
    
    // Create XState config
    const xstateConfig = {
      id: `teleporthq-${template.id}`,
      initial: 'idle',
      context: {
        ...initialState,
        templateId: template.id,
        components: template.components,
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
        idle: async ({ state, model, log, view, transition }: any) => {
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

  private extractStateVariables(template: TeleportHQTemplate): Record<string, any> {
    const variables: Record<string, any> = {};
    
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

  private createEventsFromCallbacks(template: TeleportHQTemplate): Record<string, any> {
    const events: Record<string, any> = {};

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

  private renderTeleportHQComponents(
    components: TeleportHQComponent[], 
    variables: Record<string, any>,
    transition: (event: string, data?: any) => void
  ): React.ReactNode[] {
    return components.map(component => {
      // Convert TeleportHQ component to React component
      const Component = this.createReactComponentFromTeleportHQ(component, variables, transition);
      return React.createElement(Component, { key: component.id });
    });
  }

  private createReactComponentFromTeleportHQ(
    component: TeleportHQComponent,
    variables: Record<string, any>,
    transition: (event: string, data?: any) => void
  ): React.ComponentType<any> {
    const Component = (props: any) => {
      const componentProps = {
        ...component.props,
        ...variables,
        ...props,
      };

      // Handle callbacks
      const callbackProps: Record<string, any> = {};
      if (component.callbacks) {
        Object.entries(component.callbacks).forEach(([callbackName, eventType]) => {
          callbackProps[callbackName] = (data?: any) => {
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

  // Sync ViewStateMachine state with TeleportHQ
  syncWithTeleportHQ(viewStateMachine: ViewStateMachine<any>, templateId: string): void {
    // Set up real-time sync if enabled
    if (this.config.enableRealTimeSync) {
      this.setupRealTimeSync(viewStateMachine, templateId);
    }
  }

  private setupRealTimeSync(viewStateMachine: ViewStateMachine<any>, templateId: string): void {
    // This would set up WebSocket or polling to sync state changes
    // back to TeleportHQ for real-time collaboration
    console.log(`Setting up real-time sync for template ${templateId}`);
  }

  // Export ViewStateMachine state to TeleportHQ
  async exportToTeleportHQ(templateId: string, state: any): Promise<void> {
    try {
      await fetch(`https://api.teleporthq.io/templates/${templateId}/state`, {
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

  // Get all loaded templates
  getLoadedTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  // Get ViewStateMachine for template
  getViewStateMachine(templateId: string): ViewStateMachine<any> | undefined {
    return this.viewStateMachines.get(templateId);
  }
}

export function createTeleportHQAdapter(config: TeleportHQConfig): TeleportHQAdapter {
  return new TeleportHQAdapter(config);
} 