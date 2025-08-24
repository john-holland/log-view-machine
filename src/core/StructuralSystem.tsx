import React from 'react';
import { assign } from 'xstate';
import { ViewStateMachine, ViewStateMachineConfig } from './ViewStateMachine';

// Core structural types
export interface AppStructureNode {
  id: string;
  name: string;
  type: 'application' | 'navigation' | 'main-content' | 'control' | 'input' | 'configuration' | 'information' | 'service-layer' | 'communication' | 'content-layer' | 'content-script' | 'content-control';
  component?: string;
  tome?: string;
  routing?: {
    path: string;
    children?: AppStructureNode[];
  };
  children?: AppStructureNode[];
}

export interface ComponentTomeMapping {
  [componentName: string]: {
    componentPath: string;
    tomePath: string;
    templatePath: string;
  };
}

export interface RouteConfig {
  path: string;
  component?: string;
  redirect?: string;
  children?: RouteConfig[];
}

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  children?: NavigationItem[];
}

export interface RoutingConfig {
  routes: RouteConfig[];
  navigation: {
    primary: NavigationItem[];
    secondary?: NavigationItem[];
  };
}

export interface TomeDefinition {
  machineId: string;
  description: string;
  states: string[];
  events: string[];
}

export interface TomeConfig {
  tomes: Record<string, TomeDefinition>;
  machineStates?: Record<string, Record<string, any>>;
}

export interface AppStructureConfig {
  AppStructure: AppStructureNode;
  ComponentTomeMapping: ComponentTomeMapping;
  RoutingConfig: RoutingConfig;
  TomeConfig: TomeConfig;
}

// Structural system class
export class StructuralSystem {
  private config: AppStructureConfig;
  private machines: Map<string, ViewStateMachine<any>> = new Map();
  private componentCache: Map<string, any> = new Map();

  constructor(config: AppStructureConfig) {
    this.config = config;
  }

  // Get the complete application structure
  getAppStructure(): AppStructureNode {
    return this.config.AppStructure;
  }

  // Get component-tome mapping
  getComponentTomeMapping(): ComponentTomeMapping {
    return this.config.ComponentTomeMapping;
  }

  // Get routing configuration
  getRoutingConfig(): RoutingConfig {
    return this.config.RoutingConfig;
  }

  // Get tome configuration
  getTomeConfig(): TomeConfig {
    return this.config.TomeConfig;
  }

  // Create a machine for a specific component
  createMachine(componentName: string, initialModel?: any): ViewStateMachine<any> | null {
    const mapping = this.config.ComponentTomeMapping[componentName];
    const tomeConfig = this.config.TomeConfig.tomes[`${componentName}-tome`];

    if (!mapping || !tomeConfig) {
      console.warn(`No configuration found for component: ${componentName}`);
      return null;
    }

    try {
      // Create machine configuration
      const machineConfig: ViewStateMachineConfig<any> = {
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
    } catch (error) {
      console.error(`Failed to create machine for ${componentName}:`, error);
      return null;
    }
  }

  // Get an existing machine
  getMachine(componentName: string): ViewStateMachine<any> | undefined {
    return this.machines.get(componentName);
  }

  // Get all machines
  getAllMachines(): Map<string, ViewStateMachine<any>> {
    return this.machines;
  }

  // Find route by path
  findRoute(path: string): RouteConfig | null {
    const findRouteRecursive = (routes: RouteConfig[], targetPath: string): RouteConfig | null => {
      for (const route of routes) {
        if (route.path === targetPath) {
          return route;
        }
        if (route.children) {
          const found = findRouteRecursive(route.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findRouteRecursive(this.config.RoutingConfig.routes, path);
  }

  // Get navigation breadcrumbs for a path
  getBreadcrumbs(path: string): NavigationItem[] {
    const breadcrumbs: NavigationItem[] = [];
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
  findNavigationItem(path: string): NavigationItem | null {
    const findInNavigation = (items: NavigationItem[], targetPath: string): NavigationItem | null => {
      for (const item of items) {
        if (item.path === targetPath) {
          return item;
        }
        if (item.children) {
          const found = findInNavigation(item.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const primary = findInNavigation(this.config.RoutingConfig.navigation.primary, path);
    if (primary) return primary;

    if (this.config.RoutingConfig.navigation.secondary) {
      return findInNavigation(this.config.RoutingConfig.navigation.secondary, path);
    }

    return null;
  }

  // Validate the structural configuration
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

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
    const validateNavigation = (items: NavigationItem[]) => {
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
  private createStatesFromTome(tomeConfig: TomeDefinition): any {
    const states: any = {};
    
    for (const state of tomeConfig.states) {
      states[state] = {
        on: {}
      };
    }

    return states;
  }

  // Create XState events from tome configuration
  private createEventsFromTome(tomeConfig: TomeDefinition): any {
    const events: any = {};
    
    for (const event of tomeConfig.events) {
      events[event] = {
        actions: assign((context: any, event: any) => ({
          lastEvent: event.type,
          lastEventPayload: event.payload
        }))
      };
    }

    return events;
  }
}

// React hook for using the structural system
export function useStructuralSystem(config: AppStructureConfig) {
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
export function createStructuralSystem(config: AppStructureConfig): StructuralSystem {
  return new StructuralSystem(config);
}

// Export types
export type {
  AppStructureNode,
  ComponentTomeMapping,
  RouteConfig,
  NavigationItem,
  RoutingConfig,
  TomeDefinition,
  TomeConfig,
  AppStructureConfig
};
