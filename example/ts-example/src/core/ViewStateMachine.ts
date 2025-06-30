import { ViewModel, StateTransition, LogEntry } from '../types/TastyFishBurger';
import * as mori from 'mori';

export interface ViewStateConfig {
    machineId: string;
    states: string[];
    render: (props: ViewProps) => JSX.Element;
    container?: (props: { children: JSX.Element }) => JSX.Element;
}

export interface ViewProps {
    state: string;
    model: any;
    sendMessage: (message: any) => void;
    transition: (state: string) => void;
}

export class ViewMachine {
    private machineId: string;
    private states: string[];
    private defaultRender: (props: ViewProps) => JSX.Element;
    private container?: (props: { children: JSX.Element }) => JSX.Element;
    private stateRenderers: Map<string, (props: ViewProps) => JSX.Element> = new Map();
    private methodHandlers: Map<string, (props: ViewProps) => void> = new Map();

    constructor(config: ViewStateConfig, private stateMachine: any) {
        this.machineId = config.machineId;
        this.states = config.states;
        this.defaultRender = config.render;
        this.container = config.container;
    }

    withState(state: string, renderer: (props: ViewProps) => JSX.Element): ViewMachine {
        this.stateRenderers.set(state, renderer);
        return this;
    }

    withMethod(methodName: string, handler: (props: ViewProps) => void): ViewMachine {
        this.methodHandlers.set(methodName, handler);
        return this;
    }

    compose(otherView: ViewMachine): ViewMachine {
        // Merge state renderers and method handlers
        otherView.stateRenderers.forEach((renderer, state) => {
            this.stateRenderers.set(state, renderer);
        });
        otherView.methodHandlers.forEach((handler, method) => {
            this.methodHandlers.set(method, handler);
        });
        return this;
    }

    render(props: any): JSX.Element {
        const currentState = this.stateMachine.getViewModel()?.currentState || 'initial';
        const renderer = this.stateRenderers.get(currentState);
        
        if (renderer) {
            const viewProps: ViewProps = {
                state: currentState,
                model: props,
                sendMessage: (message: any) => this.stateMachine.sendMessage(message),
                transition: (state: string) => this.stateMachine.transition(state)
            };
            
            const rendered = renderer(viewProps);
            
            if (this.container) {
                return this.container({ children: rendered });
            }
            
            return rendered;
        }
        
        return this.defaultRender(props);
    }

    getMachineId(): string {
        return this.machineId;
    }
}

// Types for ViewStateMachine
export interface ViewStateMachineConfig<TConfig, TViewModel> {
  machineId: string;
  states: Record<string, Record<string, {}>>;
  defaultViewModel: TViewModel;
  defaultConfig: TConfig;
}

export interface ViewStateMachineContext<TConfig, TViewModel> {
  viewModel: TViewModel;
  config: TConfig;
  currentState: string;
  sendMessage: (message: string, payload?: any) => Promise<void>;
  transition: (state: string) => void;
}

export interface ViewStateMachineView<TConfig, TViewModel> {
  render: (context: ViewStateMachineContext<TConfig, TViewModel>) => any;
  withState: <TState extends string>(
    state: TState,
    renderer: (context: ViewStateMachineContext<TConfig, TViewModel>) => any
  ) => ViewStateMachineView<TConfig, TViewModel>;
  withMethod: (
    methodName: string,
    handler: (context: ViewStateMachineContext<TConfig, TViewModel>) => void
  ) => ViewStateMachineView<TConfig, TViewModel>;
}

// Create a ViewStateMachine factory
export function createViewStateMachine<TConfig, TViewModel>(
  config: ViewStateMachineConfig<TConfig, TViewModel>
): ViewStateMachineView<TConfig, TViewModel> {
  const stateRenderers = new Map<string, (context: ViewStateMachineContext<TConfig, TViewModel>) => any>();
  const methodHandlers = new Map<string, (context: ViewStateMachineContext<TConfig, TViewModel>) => void>();

  const view: ViewStateMachineView<TConfig, TViewModel> = {
    render: (context: ViewStateMachineContext<TConfig, TViewModel>) => {
      const renderer = stateRenderers.get(context.currentState);
      if (renderer) {
        return renderer(context);
      }
      
      // Default render for unknown states
      return { type: 'div', props: { className: 'view-state-machine-default' }, children: `State: ${context.currentState}` };
    },

    withState: (state, renderer) => {
      stateRenderers.set(state, renderer);
      return view;
    },

    withMethod: (methodName, handler) => {
      methodHandlers.set(methodName, handler);
      return view;
    }
  };

  return view;
}

// Helper function to create a ViewStateMachine from a regular StateMachine
export function createViewFromStateMachine<TConfig, TViewModel>(
  stateMachine: any,
  config: ViewStateMachineConfig<TConfig, TViewModel>
): ViewStateMachineView<TConfig, TViewModel> {
  const view = createViewStateMachine(config);

  // Add default state renderers
  Object.keys(config.states).forEach(state => {
    view.withState(state, (context) => {
      return { 
        type: 'div', 
        props: { 
          className: `view-state-${state}`,
          'data-state': state
        }, 
        children: `View for state: ${state}` 
      };
    });
  });

  return view;
} 