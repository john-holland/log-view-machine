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

// Example React component wrapper
export const withViewMachine = (viewMachine: ViewMachine) => {
    return (WrappedComponent: React.ComponentType<any>) => {
        return (props: any) => {
            return viewMachine.render(props);
        };
    };
}; 