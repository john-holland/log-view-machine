import React from 'react';
import { assign } from 'xstate';
import { ViewStateMachine } from '../Cave/tome/viewstatemachine/ViewStateMachine';
// Structural system class
export class StructuralSystem {
    constructor(config) {
        this.machines = new Map();
        this.componentCache = new Map();
        this.config = config;
    }
    // Get the complete application structure
    getAppStructure() {
        return this.config.AppStructure;
    }
    // Get component-tome mapping
    getComponentTomeMapping() {
        return this.config.ComponentTomeMapping;
    }
    // Get routing configuration
    getRoutingConfig() {
        return this.config.RoutingConfig;
    }
    // Get tome configuration
    getTomeConfig() {
        return this.config.TomeConfig;
    }
    // Create a machine for a specific component
    createMachine(componentName, initialModel) {
        const mapping = this.config.ComponentTomeMapping[componentName];
        const tomeConfig = this.config.TomeConfig.tomes[`${componentName}-tome`];
        if (!mapping || !tomeConfig) {
            console.warn(`No configuration found for component: ${componentName}`);
            return null;
        }
        try {
            // Create machine configuration
            const machineConfig = {
                machineId: tomeConfig.machineId,
                xstateConfig: {
                    id: tomeConfig.machineId,
                    initial: 'idle',
                    context: {
                        model: initialModel || {},
                        componentName,
                        tomePath: mapping.tomePath,
                        templatePath: mapping.templatePath
                    },
                    states: this.createStatesFromTome(tomeConfig),
                    on: this.createEventsFromTome(tomeConfig)
                },
                tomeConfig: {
                    ...tomeConfig,
                    componentMapping: mapping
                }
            };
            const machine = new ViewStateMachine(machineConfig);
            this.machines.set(componentName, machine);
            return machine;
        }
        catch (error) {
            console.error(`Failed to create machine for ${componentName}:`, error);
            return null;
        }
    }
    // Get an existing machine
    getMachine(componentName) {
        return this.machines.get(componentName);
    }
    // Get all machines
    getAllMachines() {
        return this.machines;
    }
    // Find route by path
    findRoute(path) {
        const findRouteRecursive = (routes, targetPath) => {
            for (const route of routes) {
                if (route.path === targetPath) {
                    return route;
                }
                if (route.children) {
                    const found = findRouteRecursive(route.children, targetPath);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        return findRouteRecursive(this.config.RoutingConfig.routes, path);
    }
    // Get navigation breadcrumbs for a path
    getBreadcrumbs(path) {
        const breadcrumbs = [];
        const pathParts = path.split('/').filter(Boolean);
        let currentPath = '';
        for (const part of pathParts) {
            currentPath += `/${part}`;
            const route = this.findRoute(currentPath);
            if (route && route.component) {
                const navItem = this.findNavigationItem(currentPath);
                if (navItem) {
                    breadcrumbs.push(navItem);
                }
            }
        }
        return breadcrumbs;
    }
    // Find navigation item by path
    findNavigationItem(path) {
        const findInNavigation = (items, targetPath) => {
            for (const item of items) {
                if (item.path === targetPath) {
                    return item;
                }
                if (item.children) {
                    const found = findInNavigation(item.children, targetPath);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        const primary = findInNavigation(this.config.RoutingConfig.navigation.primary, path);
        if (primary)
            return primary;
        if (this.config.RoutingConfig.navigation.secondary) {
            return findInNavigation(this.config.RoutingConfig.navigation.secondary, path);
        }
        return null;
    }
    // Validate the structural configuration
    validate() {
        const errors = [];
        // Validate component-tome mappings
        for (const [componentName, mapping] of Object.entries(this.config.ComponentTomeMapping)) {
            if (!this.config.TomeConfig.tomes[`${componentName}-tome`]) {
                errors.push(`Component ${componentName} has no corresponding tome configuration`);
            }
        }
        // Validate routing
        for (const route of this.config.RoutingConfig.routes) {
            if (route.component && !this.config.ComponentTomeMapping[route.component]) {
                errors.push(`Route ${route.path} references unknown component: ${route.component}`);
            }
        }
        // Validate navigation
        const validateNavigation = (items) => {
            for (const item of items) {
                if (!this.findRoute(item.path)) {
                    errors.push(`Navigation item ${item.id} references unknown route: ${item.path}`);
                }
                if (item.children) {
                    validateNavigation(item.children);
                }
            }
        };
        validateNavigation(this.config.RoutingConfig.navigation.primary);
        if (this.config.RoutingConfig.navigation.secondary) {
            validateNavigation(this.config.RoutingConfig.navigation.secondary);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    // Create XState states from tome configuration
    createStatesFromTome(tomeConfig) {
        const states = {};
        for (const state of tomeConfig.states) {
            states[state] = {
                on: {}
            };
        }
        return states;
    }
    // Create XState events from tome configuration
    createEventsFromTome(tomeConfig) {
        const events = {};
        for (const event of tomeConfig.events) {
            events[event] = {
                actions: assign((context, event) => ({
                    lastEvent: event.type,
                    lastEventPayload: event.payload
                }))
            };
        }
        return events;
    }
}
// React hook for using the structural system
export function useStructuralSystem(config) {
    const [system] = React.useState(() => new StructuralSystem(config));
    React.useEffect(() => {
        const validation = system.validate();
        if (!validation.isValid) {
            console.warn('Structural system validation errors:', validation.errors);
        }
    }, [system]);
    return system;
}
// Utility function to create a structural system
export function createStructuralSystem(config) {
    return new StructuralSystem(config);
}
