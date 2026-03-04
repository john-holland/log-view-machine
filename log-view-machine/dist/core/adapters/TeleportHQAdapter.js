import React from 'react';
import { ViewStateMachine } from '../Cave/tome/viewstatemachine/ViewStateMachine';
export class TeleportHQAdapter {
    constructor(config) {
        this.templates = new Map();
        this.viewStateMachines = new Map();
        this.config = config;
    }
    // Load template from TeleportHQ API
    async loadTemplate(templateId) {
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
        }
        catch (error) {
            console.error('Error loading TeleportHQ template:', error);
            throw error;
        }
    }
    // Convert TeleportHQ template to React components with ViewStateMachine integration
    createViewStateMachineFromTemplate(templateId, initialState = {}) {
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
            idle: async ({ state, model, log, view, transition }) => {
                await log('TeleportHQ template rendered', {
                    templateId: model.templateId,
                    componentCount: model.components.length,
                });
                const renderedComponents = this.renderTeleportHQComponents(model.components, model.variables, transition);
                view(React.createElement('div', { className: 'teleporthq-template' }, React.createElement('h3', null, `Template: ${template.name}`), ...renderedComponents));
            },
        };
        return {
            machineId: `teleporthq-${template.id}`,
            xstateConfig,
            logStates,
        };
    }
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
    renderTeleportHQComponents(components, variables, transition) {
        return components.map(component => {
            // Convert TeleportHQ component to React component
            const Component = this.createReactComponentFromTeleportHQ(component, variables, transition);
            return React.createElement(Component, { key: component.id });
        });
    }
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
                    }, component.children?.map(child => this.createReactComponentFromTeleportHQ(child, variables, transition)(props)));
                default:
                    return React.createElement('div', {
                        className: `teleporthq-${component.name.toLowerCase()}`
                    }, componentProps.children || componentProps.text);
            }
        };
        return Component;
    }
    // Sync ViewStateMachine state with TeleportHQ
    syncWithTeleportHQ(viewStateMachine, templateId) {
        // Set up real-time sync if enabled
        if (this.config.enableRealTimeSync) {
            this.setupRealTimeSync(viewStateMachine, templateId);
        }
    }
    setupRealTimeSync(viewStateMachine, templateId) {
        // This would set up WebSocket or polling to sync state changes
        // back to TeleportHQ for real-time collaboration
        console.log(`Setting up real-time sync for template ${templateId}`);
    }
    // Export ViewStateMachine state to TeleportHQ
    async exportToTeleportHQ(templateId, state) {
        try {
            await fetch(`https://api.teleporthq.io/templates/${templateId}/state`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ state }),
            });
        }
        catch (error) {
            console.error('Error exporting state to TeleportHQ:', error);
        }
    }
    // Get all loaded templates
    getLoadedTemplates() {
        return Array.from(this.templates.keys());
    }
    // Get ViewStateMachine for template
    getViewStateMachine(templateId) {
        return this.viewStateMachines.get(templateId);
    }
}
export function createTeleportHQAdapter(config) {
    return new TeleportHQAdapter(config);
}
