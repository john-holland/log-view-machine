import { ViewStateMachine } from './ViewStateMachine';
import { BaseStateMachine } from './StateMachine';
import { ViewModel, StateTransition } from '../types/TastyFishBurger';
import * as React from 'react';
import * as mori from 'mori';

export interface ViewConfig {
    machineId: string;
    states: string[];
    render: (props: ViewProps) => React.ReactNode;
    machines?: {
        [key: string]: BaseStateMachine;
    };
    container?: (props: { children: React.ReactNode }) => React.ReactNode;
}

export interface ViewProps {
    model: any;
    state: string;
    states: { [key: string]: string };
    sendMessage: (message: any, machineId?: string) => void;
    transition: (to: string, machineId?: string) => void;
    machines: { [key: string]: BaseStateMachine };
    [key: string]: any; // Allow for dynamic methods
}

export class ViewMachine extends ViewStateMachine {
    public viewConfig: ViewConfig;
    private currentView: React.ReactNode | null = null;
    public machines: Map<string, BaseStateMachine>;
    public methods: Map<string, (props: ViewProps) => void>;
    private stateHandlers: Map<string, (props: ViewProps) => React.ReactNode>;

    constructor(config: ViewConfig, modelMachine: BaseStateMachine) {
        super({
            machineId: config.machineId,
            recognizedStates: config.states,
            renderDelay: 0
        });
        this.viewConfig = config;
        this.machines = new Map();
        this.methods = new Map();
        this.stateHandlers = new Map();
        
        // Set primary model machine
        this.machines.set('model', modelMachine);
        this.setSuperMachine(modelMachine);

        // Add additional machines
        if (config.machines) {
            Object.entries(config.machines).forEach(([id, machine]) => {
                this.machines.set(id, machine);
            });
        }
    }

    public withMethod(
        methodName: string,
        method: (props: ViewProps) => void
    ): ViewMachine {
        return new MethodEnhancedViewMachine(this, methodName, method);
    }

    public render(props: any): React.ReactNode {
        const viewModel = this.getViewModel();
        const states: { [key: string]: string } = {};
        
        // Collect states from all machines
        this.machines.forEach((machine, id) => {
            states[id] = machine.getViewModel().currentState;
        });

        const viewProps: ViewProps = {
            model: props,
            state: viewModel.currentState,
            states,
            sendMessage: (message, machineId = 'model') => {
                const targetMachine = this.machines.get(machineId);
                if (targetMachine && typeof (targetMachine as any).sendMessage === 'function') {
                    (targetMachine as any).sendMessage(message);
                }
            },
            transition: (to, machineId = 'model') => {
                const targetMachine = this.machines.get(machineId);
                if (targetMachine && typeof (targetMachine as any).sendMessage === 'function') {
                    (targetMachine as any).sendMessage({
                        type: 'TRANSITION',
                        payload: { to },
                        metadata: { source: 'view' }
                    });
                }
            },
            machines: Object.fromEntries(this.machines)
        };

        // Add methods to props
        this.methods.forEach((method, name) => {
            (viewProps as any)[name] = (args: any) => method(viewProps);
        });

        // Check for state-specific handler
        const stateHandler = this.stateHandlers.get(viewProps.state);
        const content = stateHandler ? stateHandler(viewProps) : this.viewConfig.render(viewProps);
        return this.viewConfig.container ? this.viewConfig.container({ children: content }) : content;
    }

    public addMachine(id: string, machine: BaseStateMachine): void {
        this.machines.set(id, machine);
        this.addLogEntry('INFO', `Machine added: ${id}`, { machineId: id });
    }

    public removeMachine(id: string): void {
        this.machines.delete(id);
        this.addLogEntry('INFO', `Machine removed: ${id}`, { machineId: id });
    }

    public getMachine(id: string): BaseStateMachine | undefined {
        return this.machines.get(id);
    }

    public compose(otherView: ViewMachine): ViewMachine {
        return new ComposedViewMachine(this, otherView);
    }

    public withState(state: string, render: (props: ViewProps) => React.ReactNode): ViewMachine {
        this.stateHandlers.set(state, render);
        return this;
    }

    public withMachines(machines: { [key: string]: BaseStateMachine }): ViewMachine {
        return new MachineEnhancedViewMachine(this, machines);
    }
}

class ComposedViewMachine extends ViewMachine {
    private views: ViewMachine[];

    constructor(...views: ViewMachine[]) {
        const firstView = views[0];
        super({
            machineId: `${firstView.getMachineId()}-composed`,
            states: firstView.getRecognizedStates(),
            render: (props) => {
                return React.createElement('div', { className: 'composed-view' },
                    views.map((view, index) => 
                        React.createElement('div', 
                            { key: index, className: 'view-container' },
                            view.render(props)
                        )
                    )
                );
            }
        }, firstView.getSuperMachine()!);
        this.views = views;

        // Merge machines from all views
        views.forEach(view => {
            if (view instanceof ViewMachine) {
                view.machines.forEach((machine, id) => {
                    this.addMachine(`${view.getMachineId()}-${id}`, machine);
                });
            }
        });
    }
}

class StateSpecificViewMachine extends ViewMachine {
    private specificState: string;
    private specificRender: (props: ViewProps) => React.ReactNode;

    constructor(
        baseView: ViewMachine,
        state: string,
        render: (props: ViewProps) => React.ReactNode
    ) {
        super({
            machineId: `${baseView.getMachineId()}-${state}`,
            states: [state],
            render: (props) => {
                if (props.state === state) {
                    return render(props);
                }
                return null;
            }
        }, baseView.getSuperMachine()!);
        this.specificState = state;
        this.specificRender = render;

        // Copy machines from base view
        baseView.machines.forEach((machine, id) => {
            this.addMachine(id, machine);
        });
    }
}

class MachineEnhancedViewMachine extends ViewMachine {
    constructor(
        baseView: ViewMachine,
        additionalMachines: { [key: string]: BaseStateMachine }
    ) {
        super({
            machineId: `${baseView.getMachineId()}-enhanced`,
            states: baseView.getRecognizedStates(),
            render: baseView.viewConfig.render,
            machines: additionalMachines
        }, baseView.getSuperMachine()!);

        // Copy machines from base view
        baseView.machines.forEach((machine, id) => {
            this.addMachine(id, machine);
        });
    }
}

class MethodEnhancedViewMachine extends ViewMachine {
    constructor(
        baseView: ViewMachine,
        methodName: string,
        method: (props: ViewProps) => void
    ) {
        super({
            machineId: `${baseView.getMachineId()}-${methodName}`,
            states: baseView.getRecognizedStates(),
            render: baseView.viewConfig.render
        }, baseView.getSuperMachine()!);

        // Copy machines from base view
        baseView.machines.forEach((machine, id) => {
            this.addMachine(id, machine);
        });

        // Copy existing methods from base view
        baseView.methods.forEach((existingMethod, existingName) => {
            this.methods.set(existingName, existingMethod);
        });

        // Add the new method
        this.methods.set(methodName, method);
    }
}

// Example usage:
export type ViewFactory = ((modelMachine: BaseStateMachine) => ViewMachine) & {
    withState: (state: string, render: (props: ViewProps) => React.ReactNode) => ViewFactory;
};

export const createView = (config: ViewConfig): ViewFactory => {
    const view = ((modelMachine: BaseStateMachine) => new ViewMachine(config, modelMachine)) as ViewFactory;
    view.withState = (state: string, render: (props: ViewProps) => React.ReactNode) => {
        const base = (modelMachine: BaseStateMachine) => {
            const machine = new ViewMachine(config, modelMachine);
            return machine.withState(state, render);
        };
        // Recursively attach withState for further chaining
        (base as ViewFactory).withState = view.withState;
        return base as ViewFactory;
    };
    return view;
};

// Development vs Production configuration for safeSubView
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Default safety configuration based on environment
const getDefaultSafetyConfig = () => ({
    errorBoundary: isDevelopment, // Always enable error boundaries in dev
    onError: isDevelopment ? (error: Error, props: any, context: string) => {
        console.group(`[safeSubView] Error in ${context}`);
        console.error('Error:', error);
        console.error('Props:', props);
        console.error('Stack:', error.stack);
        console.groupEnd();
    } : undefined,
    onRender: isDevelopment ? (props: any, startTime: number) => {
        console.log(`[safeSubView] Render started at ${new Date(startTime).toISOString()}`);
    } : undefined,
    onSuccess: isDevelopment ? (props: any, renderTime: number) => {
        console.log(`[safeSubView] Render completed in ${renderTime.toFixed(2)}ms`);
    } : undefined,
});

// Original simple subView function
export const subView = <T extends ViewProps = ViewProps>(
    render: (props: T) => React.ReactNode,
    options?: {
        errorBoundary?: boolean;
        fallback?: React.ReactNode;
        onError?: (error: Error, props: T) => void;
        validateProps?: (props: T) => boolean | string;
    }
) => (props: T) => {
    try {
        // Validate props if validator is provided
        if (options?.validateProps) {
            const validationResult = options.validateProps(props);
            if (validationResult !== true) {
                const errorMessage = typeof validationResult === 'string' ? validationResult : 'Invalid props';
                console.error(`[subView] Validation failed: ${errorMessage}`, props);
                if (options.onError) {
                    options.onError(new Error(errorMessage), props);
                }
                return options?.fallback || React.createElement('div', { className: 'error-boundary' }, 'Invalid props');
            }
        }

        // Check for required props
        if (!props || typeof props !== 'object') {
            const error = new Error('subView received invalid props');
            console.error('[subView] Invalid props received:', props);
            if (options?.onError) {
                options.onError(error, props);
            }
            return options?.fallback || React.createElement('div', { className: 'error-boundary' }, 'Invalid props');
        }

        // Render with error boundary if enabled
        if (options?.errorBoundary) {
            try {
                return render(props);
            } catch (renderError) {
                console.error('[subView] Render error:', renderError, props);
                if (options.onError) {
                    options.onError(renderError as Error, props);
                }
                return options?.fallback || React.createElement('div', { className: 'error-boundary' }, 'Render error occurred');
            }
        }

        // Normal render
        return render(props);
    } catch (error) {
        console.error('[subView] Unexpected error:', error, props);
        if (options?.onError) {
            options.onError(error as Error, props);
        }
        return options?.fallback || React.createElement('div', { className: 'error-boundary' }, 'Unexpected error');
    }
};

// Enhanced subView with safety reporting
export const safeSubView = <T extends ViewProps = ViewProps>(
    render: (props: T) => React.ReactNode,
    safetyConfig?: {
        name?: string;
        requiredProps?: (keyof T)[];
        requiredMethods?: string[];
        errorBoundary?: boolean;
        fallback?: React.ReactNode;
        onError?: (error: Error, props: T, context: string) => void;
        onRender?: (props: T, startTime: number) => void;
        onSuccess?: (props: T, renderTime: number) => void;
        forceProduction?: boolean; // Override to force production mode
        forceDevelopment?: boolean; // Override to force development mode
    }
) => (props: T) => {
    // Determine if we should use development or production mode
    const useDevelopment = safetyConfig?.forceDevelopment || 
        (!safetyConfig?.forceProduction && isDevelopment);
    
    const startTime = useDevelopment ? performance.now() : 0;
    const viewName = safetyConfig?.name || 'unnamed-subview';

    // In production mode without overrides, just render directly
    if (!useDevelopment && !safetyConfig?.errorBoundary && !safetyConfig?.requiredProps && !safetyConfig?.requiredMethods) {
        return render(props);
    }

    try {
        // Validate required props
        if (safetyConfig?.requiredProps) {
            for (const prop of safetyConfig.requiredProps) {
                if (!(prop in props)) {
                    const error = new Error(`Missing required prop: ${String(prop)}`);
                    if (useDevelopment) {
                        console.error(`[${viewName}] Missing required prop:`, prop, props);
                    }
                    if (safetyConfig.onError) {
                        safetyConfig.onError(error, props, 'missing-prop');
                    }
                    return safetyConfig?.fallback || React.createElement('div', { className: 'error-boundary' }, `Missing required prop: ${String(prop)}`);
                }
            }
        }

        // Validate required methods
        if (safetyConfig?.requiredMethods) {
            for (const method of safetyConfig.requiredMethods) {
                if (!props[method] || typeof props[method] !== 'function') {
                    const error = new Error(`Missing required method: ${method}`);
                    if (useDevelopment) {
                        console.error(`[${viewName}] Missing required method:`, method, props);
                    }
                    if (safetyConfig.onError) {
                        safetyConfig.onError(error, props, 'missing-method');
                    }
                    return safetyConfig?.fallback || React.createElement('div', { className: 'error-boundary' }, `Missing required method: ${method}`);
                }
            }
        }

        // Call onRender callback
        if (safetyConfig?.onRender && useDevelopment) {
            safetyConfig.onRender(props, startTime);
        }

        // Render with error boundary if enabled
        let result: React.ReactNode;
        if (safetyConfig?.errorBoundary || useDevelopment) {
            try {
                result = render(props);
            } catch (renderError) {
                const error = renderError as Error;
                if (useDevelopment) {
                    console.error(`[${viewName}] Render error:`, error, props);
                }
                if (safetyConfig.onError) {
                    safetyConfig.onError(error, props, 'render-error');
                }
                return safetyConfig?.fallback || React.createElement('div', { className: 'error-boundary' }, `Render error: ${error.message}`);
            }
        } else {
            result = render(props);
        }

        // Call onSuccess callback
        if (safetyConfig?.onSuccess && useDevelopment) {
            const renderTime = performance.now() - startTime;
            safetyConfig.onSuccess(props, renderTime);
        }

        return result;
    } catch (error) {
        const errorObj = error as Error;
        if (useDevelopment) {
            console.error(`[${viewName}] Unexpected error:`, errorObj, props);
        }
        if (safetyConfig?.onError) {
            safetyConfig.onError(errorObj, props, 'unexpected-error');
        }
        return safetyConfig?.fallback || React.createElement('div', { className: 'error-boundary' }, `Unexpected error: ${errorObj.message}`);
    }
};

// Convenience function for development-only safeSubView
export const devSubView = <T extends ViewProps = ViewProps>(
    render: (props: T) => React.ReactNode,
    name?: string
) => safeSubView(render, {
    name,
    errorBoundary: true,
    onError: (error, props, context) => {
        console.group(`[devSubView:${name || 'unnamed'}] Error in ${context}`);
        console.error('Error:', error);
        console.error('Props:', props);
        console.error('Stack:', error.stack);
        console.groupEnd();
    },
    onRender: (props, startTime) => {
        console.log(`[devSubView:${name || 'unnamed'}] Render started`);
    },
    onSuccess: (props, renderTime) => {
        console.log(`[devSubView:${name || 'unnamed'}] Render completed in ${renderTime.toFixed(2)}ms`);
    },
    forceDevelopment: true
});

// Convenience function for production-optimized safeSubView
export const prodSubView = <T extends ViewProps = ViewProps>(
    render: (props: T) => React.ReactNode,
    safetyConfig?: {
        requiredProps?: (keyof T)[];
        requiredMethods?: string[];
        fallback?: React.ReactNode;
    }
) => safeSubView(render, {
    ...safetyConfig,
    forceProduction: true,
    errorBoundary: false, // Disable error boundaries in production for performance
    onError: undefined, // Disable error logging in production
    onRender: undefined, // Disable render logging in production
    onSuccess: undefined // Disable success logging in production
});

// Example React component wrapper
export const withViewMachine = (viewMachine: ViewMachine) => {
    return (WrappedComponent: React.ComponentType<any>) => {
        return (props: any) => {
            return viewMachine.render(props);
        };
    };
}; 