import { createMachine, interpret, assign } from 'xstate';
import { useMachine } from '@xstate/react';
import React from 'react';

// Core interfaces from your existing system
export interface StateTransition {
  from: string;
  to: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  metadata: Record<string, unknown>;
  viewModel: Record<string, unknown>;
}

export interface ViewModel {
  currentState: string;
  transitions: StateTransition[];
  logEntries: LogEntry[];
  isStable: boolean;
  setStable: (stable: boolean) => void;
}

export interface StateMachineConfig<TConfig = any, TViewModel = any> {
  defaultConfig: TConfig;
  defaultViewModel: TViewModel;
  states: Record<string, Record<string, {}>>;
}

export interface StateMachineContext<TConfig = any, TViewModel = any> {
  machine: {
    config: TConfig;
  };
  viewModel: TViewModel & {
    setStable: (stable: boolean) => void;
  };
  transition: (to: string) => void;
  sendMessage: (type: string, payload?: any) => void;
}

export type StateHandlerFn<TConfig = any, TViewModel = any> = (context: StateMachineContext<TConfig, TViewModel>) => void;

export interface GraphQLOperation {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLStateContext<TConfig, TViewModel> extends StateMachineContext<TConfig, TViewModel> {
  graphql: {
    query: (operation: GraphQLOperation) => Promise<any>;
    mutate: (operation: GraphQLOperation) => Promise<any>;
    subscribe: (operation: GraphQLOperation, callback: (data: any) => void) => () => void;
  };
}

export interface GraphQLStateHandler<TConfig, TViewModel> {
  (context: GraphQLStateContext<TConfig, TViewModel>): void | Promise<void>;
}

// Tomes - Bound collections of nested state machines
export interface TomeConfig<TContext = any> {
  id: string;
  name: string;
  description?: string;
  machines: Record<string, MachineConfig<TContext>>;
  bindings: Record<string, string>; // machineId -> address mapping
  context: TContext;
  routing?: {
    stateToUrl: (state: string) => string;
    urlToState: (url: string) => string;
  };
  addressability?: {
    basePath: string;
    graphqlSubQueries?: boolean;
  };
}

export interface MachineConfig<TContext = any> {
  id: string;
  initial: string;
  context: TContext;
  states: Record<string, any>;
  services?: Record<string, any>;
  guards?: Record<string, any>;
  actions?: Record<string, any>;
}

// Type for ingredient selector context
export interface IngredientSelectorContext {
  selectedIngredients: string[];
  availableIngredients: string[];
}

// Type for burger creation context
export interface BurgerCreationContext {
  selectedIngredients: string[];
  isHungry: boolean;
  burgers: any[];
  register: any;
  loading: boolean;
  error: string | null;
  showAdmin: boolean;
  adminKey: string;
}

// XState-based Log View Machine
export class XStateLogViewMachine<TConfig = any, TViewModel = any> {
  private xstateService: any;
  private viewModel: TViewModel & ViewModel;
  private stateHandlers: Map<string, StateHandlerFn<TConfig, TViewModel>>;
  private methods: Map<string, StateHandlerFn<TConfig, TViewModel>>;
  private graphqlHandlers: Map<string, GraphQLStateHandler<TConfig, TViewModel>>;
  private tomeConfig?: TomeConfig<TConfig>;

  constructor(config: StateMachineConfig<TConfig, TViewModel>, tomeConfig?: TomeConfig<TConfig>) {
    this.stateHandlers = new Map();
    this.methods = new Map();
    this.graphqlHandlers = new Map();
    this.tomeConfig = tomeConfig;

    // Initialize view model
    this.viewModel = {
      ...config.defaultViewModel,
      currentState: 'INITIAL',
      transitions: [],
      logEntries: [],
      isStable: true,
      setStable: (stable: boolean) => {
        this.viewModel.isStable = stable;
      }
    };

    // Convert to XState machine
    const xstateConfig = this.convertToXStateConfig(config);
    const machine = createMachine(xstateConfig);
    this.xstateService = interpret(machine);

    // Set up event listeners
    this.xstateService.onTransition((state: any) => {
      this.viewModel.currentState = state.value;
      this.viewModel.isStable = !state.hasTag('processing');
      
      // Add transition to history
      if (state.history) {
        this.addTransition(state.history.value, state.value);
      }
    });

    this.xstateService.start();
  }

  private convertToXStateConfig(config: StateMachineConfig<TConfig, TViewModel>) {
    const states: Record<string, any> = {};
    
    // Convert state definitions
    Object.entries(config.states).forEach(([stateName, transitions]) => {
      states[stateName] = {
        on: Object.keys(transitions).reduce((acc, targetState) => {
          acc[`GO_TO_${targetState.toUpperCase()}`] = {
            target: targetState,
            actions: assign((context: any, event: any) => {
              // Call state handler if exists
              const handler = this.stateHandlers.get(targetState);
              if (handler) {
                handler({
                  machine: { config: context.config },
                  viewModel: context.viewModel,
                  transition: this.transition.bind(this),
                  sendMessage: this.sendMessage.bind(this)
                });
              }
              return context;
            })
          };
          return acc;
        }, {} as Record<string, any>)
      };
    });

    return {
      id: 'log-view-machine',
      initial: 'INITIAL',
      context: {
        config: config.defaultConfig,
        viewModel: this.viewModel
      },
      states
    };
  }

  public withState(state: string, handler: StateHandlerFn<TConfig, TViewModel>): XStateLogViewMachine<TConfig, TViewModel> {
    this.stateHandlers.set(state, handler);
    return this;
  }

  public withMethod(name: string, handler: StateHandlerFn<TConfig, TViewModel>): XStateLogViewMachine<TConfig, TViewModel> {
    this.methods.set(name, handler);
    
    // Add to XState machine
    this.xstateService.send({
      type: 'ADD_METHOD',
      payload: { name, handler }
    });
    
    return this;
  }

  public withGraphQLState(
    state: string,
    operation: 'query' | 'mutation' | 'subscription',
    handler: GraphQLStateHandler<TConfig, TViewModel>
  ): XStateLogViewMachine<TConfig, TViewModel> {
    this.graphqlHandlers.set(state, handler);
    return this;
  }

  public async sendMessage(type: string, payload?: any) {
    if (type === 'LOG') {
      const { level, message, metadata, viewModel } = payload;
      this.addLogEntry(level, message, metadata, viewModel);
    } else {
      // Store payload in viewModel for method access
      if (payload !== undefined && this.viewModel.hasOwnProperty('lastPayload')) {
        (this.viewModel as any).lastPayload = payload;
      }
      
      // Call methods defined with withMethod
      const method = this.methods.get(type);
      if (method) {
        await method({
          machine: { config: (this.xstateService.getSnapshot().context as any).config },
          viewModel: this.viewModel,
          transition: this.transition.bind(this),
          sendMessage: this.sendMessage.bind(this)
        });
      }

      // Send to XState
      this.xstateService.send({ type, payload });
    }
  }

  public transition(to: string) {
    this.xstateService.send({ type: `GO_TO_${to.toUpperCase()}` });
  }

  public getViewModel(): TViewModel & ViewModel {
    return {
      ...this.viewModel,
      currentState: this.viewModel.currentState,
      transitions: this.viewModel.transitions,
      logEntries: this.viewModel.logEntries,
      isStable: this.viewModel.isStable,
      setStable: this.viewModel.setStable
    };
  }

  private addTransition(from: string, to: string) {
    const transition: StateTransition = {
      from,
      to,
      timestamp: new Date().toISOString()
    };
    this.viewModel.transitions.push(transition);
  }

  private addLogEntry(level: 'INFO' | 'WARNING' | 'ERROR', message: string, metadata: Record<string, unknown> = {}, viewModel?: Record<string, unknown>) {
    const entry: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      viewModel: viewModel || {}
    };
    this.viewModel.logEntries.push(entry);
  }

  // Tomes support
  public getTomeConfig(): TomeConfig<TConfig> | undefined {
    return this.tomeConfig;
  }

  public setTomeConfig(tomeConfig: TomeConfig<TConfig>) {
    this.tomeConfig = tomeConfig;
  }
}

// Tomes Manager - Manages collections of bound state machines
export class TomesManager {
  private tomes: Map<string, TomeConfig> = new Map();
  private machines: Map<string, XStateLogViewMachine> = new Map();

  public registerTome(tomeConfig: TomeConfig) {
    this.tomes.set(tomeConfig.id, tomeConfig);
    
    // Create machines for this tome
    Object.entries(tomeConfig.machines).forEach(([machineId, machineConfig]) => {
      const address = tomeConfig.bindings[machineId];
      if (address) {
        const machine = new XStateLogViewMachine({
          defaultConfig: tomeConfig.context,
          defaultViewModel: machineConfig.context,
          states: machineConfig.states
        }, tomeConfig);
        
        this.machines.set(address, machine);
      }
    });
  }

  public getMachine(address: string): XStateLogViewMachine | undefined {
    return this.machines.get(address);
  }

  public sendMessage(address: string, type: string, payload?: any) {
    const machine = this.machines.get(address);
    if (machine) {
      machine.sendMessage(type, payload);
    }
  }

  public getTome(id: string): TomeConfig | undefined {
    return this.tomes.get(id);
  }
}

// React hooks for XState integration
export function useLogViewMachine<TConfig, TViewModel>(
  machine: XStateLogViewMachine<TConfig, TViewModel>
) {
  const [state, send] = useMachine(machine['xstateService'].machine);
  
  return {
    state: state.context.viewModel,
    send: (type: string, payload?: any) => {
      machine.sendMessage(type, payload);
    },
    transition: (to: string) => {
      machine.transition(to);
    }
  };
}

// Factory function to maintain compatibility
export function createStateMachine<TConfig = any, TViewModel = any>(
  config: StateMachineConfig<TConfig, TViewModel>
): XStateLogViewMachine<TConfig, TViewModel> {
  return new XStateLogViewMachine(config);
}

// Tomes factory
export function createTome<TContext = any>(config: TomeConfig<TContext>): TomesManager {
  const manager = new TomesManager();
  manager.registerTome(config);
  return manager;
} 