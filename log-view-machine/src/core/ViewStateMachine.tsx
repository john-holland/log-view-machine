import React from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign, interpret, AnyStateMachine } from 'xstate';
import { RobotCopy } from './RobotCopy';

// Types for the fluent API
export type StateContext<TModel = any> = {
  state: string;
  model: TModel;
  transitions: any[];
  log: (message: string, metadata?: any) => Promise<void>;
  view: (component: React.ReactNode) => React.ReactNode;
  clear: () => void;
  transition: (to: string) => void;
  send: (event: any) => void;
  on: (eventName: string, handler: () => void) => void;
  // Sub-machine support
  subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => ViewStateMachine<any>;
  getSubMachine: (machineId: string) => ViewStateMachine<any> | undefined;
  // GraphQL support
  graphql: {
    query: (query: string, variables?: any) => Promise<any>;
    mutation: (mutation: string, variables?: any) => Promise<any>;
    subscription: (subscription: string, variables?: any) => Promise<any>;
  };
};

export type StateHandler<TModel = any> = (context: StateContext<TModel>) => Promise<any>;

export type ViewStateMachineConfig<TModel = any> = {
  machineId: string;
  xstateConfig: any;
  logStates?: Record<string, StateHandler<TModel>>;
  tomeConfig?: any;
  subMachines?: Record<string, ViewStateMachineConfig<any>>;
};

export class ViewStateMachine<TModel = any> {
  private machine: any;
  private stateHandlers: Map<string, StateHandler<TModel>>;
  private viewStack: React.ReactNode[] = [];
  private logEntries: any[] = [];
  private tomeConfig?: any;
  private isTomeSynchronized: boolean = false;
  private subMachines: Map<string, ViewStateMachine<any>> = new Map();
  // Add RobotCopy support for incoming messages
  private robotCopy?: RobotCopy;
  private incomingMessageHandlers: Map<string, (message: any) => void> = new Map();

  constructor(config: ViewStateMachineConfig<TModel>) {
    this.stateHandlers = new Map();
    this.tomeConfig = config.tomeConfig;
    
    // Create the XState machine
    this.machine = createMachine({
      ...config.xstateConfig,
      on: {
        ...config.xstateConfig.on,
        // Add our custom events
        VIEW_ADDED: {
          actions: assign((context: any, event: any) => ({
            viewStack: [...(context.viewStack || []), event.payload]
          }))
        },
        VIEW_CLEARED: {
          actions: assign({
            viewStack: []
          })
        },
        LOG_ADDED: {
          actions: assign((context: any, event: any) => ({
            logEntries: [...(context.logEntries || []), event.payload]
          }))
        },
        // Sub-machine events
        SUB_MACHINE_CREATED: {
          actions: assign((context: any, event: any) => ({
            subMachines: { ...context.subMachines, [event.payload.id]: event.payload }
          }))
        },
        // RobotCopy incoming message events
        ROBOTCOPY_MESSAGE: {
          actions: assign((context: any, event: any) => ({
            robotCopyMessages: [...(context.robotCopyMessages || []), event.payload]
          }))
        }
      }
    });

    // Register log state handlers if provided
    if (config.logStates) {
      Object.entries(config.logStates).forEach(([stateName, handler]) => {
        this.withState(stateName, handler);
      });
    }

    // Initialize sub-machines
    if (config.subMachines) {
      Object.entries(config.subMachines).forEach(([id, subConfig]) => {
        const subMachine = new ViewStateMachine(subConfig);
        this.subMachines.set(id, subMachine);
      });
    }
  }

  // Add RobotCopy support methods
  withRobotCopy(robotCopy: RobotCopy): ViewStateMachine<TModel> {
    this.robotCopy = robotCopy;
    this.setupRobotCopyIncomingHandling();
    return this;
  }

  private setupRobotCopyIncomingHandling() {
    if (!this.robotCopy) return;
    
    // Listen for incoming messages from RobotCopy
    this.robotCopy.onResponse('default', (response: any) => {
      const { type, payload } = response;
      const handler = this.incomingMessageHandlers.get(type);
      if (handler) {
        handler(payload);
      } else {
        console.log('No handler found for incoming RobotCopy message type:', type);
      }
    });
  }

  registerRobotCopyHandler(eventType: string, handler: (message: any) => void): ViewStateMachine<TModel> {
    this.incomingMessageHandlers.set(eventType, handler);
    return this;
  }

  handleRobotCopyMessage(message: any): void {
    const { type, payload } = message;
    const handler = this.incomingMessageHandlers.get(type);
    if (handler) {
      handler(payload);
    }
  }

  // Fluent API methods
  withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel> {
    this.stateHandlers.set(stateName, handler);
    return this;
  }

  // Override for withState that registers message handlers
  withStateAndMessageHandler(
    stateName: string, 
    handler: StateHandler<TModel>, 
    messageType: string, 
    messageHandler: (message: any) => void
  ): ViewStateMachine<TModel> {
    this.stateHandlers.set(stateName, handler);
    
    // Register the message handler if RobotCopy is available
    if (this.robotCopy) {
      this.registerRobotCopyHandler(messageType, messageHandler);
    }
    
    return this;
  }

  withServerState(stateName: string, handler: (context: ServerStateContext<TModel>) => void): ViewStateMachine<TModel> {
    // This method is not directly implemented in the original class,
    // but the new_code suggests it should be added.
    // For now, we'll just add a placeholder.
    // In a real scenario, this would involve adding a new state handler type
    // or modifying the existing ones to support server-side rendering.
    // Since the new_code only provided the type, we'll just add a placeholder.
    // This will likely cause a type error until the actual implementation is added.
    // @ts-ignore // This is a placeholder, not a direct implementation
    this.serverStateHandlers.set(stateName, handler);
    return this;
  }

  // Sub-machine support
  withSubMachine(machineId: string, config: ViewStateMachineConfig<any>): ViewStateMachine<TModel> {
    const subMachine = new ViewStateMachine(config);
    this.subMachines.set(machineId, subMachine);
    return this;
  }

  getSubMachine(machineId: string): ViewStateMachine<any> | undefined {
    return this.subMachines.get(machineId);
  }

  // State context methods
  private createStateContext(state: any, model: TModel): StateContext<TModel> {
    return {
      state: state.value,
      model,
      transitions: state.history?.events || [],
      log: async (message: string, metadata?: any) => {
        const logEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message,
          metadata: metadata || {}
        };
        this.logEntries.push(logEntry);
        this.machine.send({ type: 'LOG_ADDED', payload: logEntry });
        console.log(`[${state.value}] ${message}`, metadata);
      },
      view: (component: React.ReactNode) => {
        if (!this.isTomeSynchronized && this.tomeConfig) {
          console.warn('Warning: view() called from Tome without synchronized ViewStateMachine. This may cause architectural issues.');
        }
        this.viewStack.push(component);
        this.machine.send({ type: 'VIEW_ADDED', payload: component });
        return component;
      },
      clear: () => {
        this.viewStack = [];
        this.machine.send({ type: 'VIEW_CLEARED' });
      },
      transition: (to: string) => {
        this.machine.send({ type: 'TRANSITION', payload: { to } });
      },
      send: (event: any) => {
        this.machine.send(event);
      },
      on: (eventName: string, handler: () => void) => {
        // Register event handlers for state activations
        this.machine.on(eventName, handler);
      },
      // Sub-machine methods
      subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => {
        const subMachine = new ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return subMachine;
      },
      getSubMachine: (machineId: string) => {
        return this.subMachines.get(machineId);
      },
      // GraphQL methods
      graphql: {
        query: async (query: string, variables?: any) => {
          // This would integrate with a GraphQL client
          console.log('GraphQL Query:', query, variables);
          return { data: { query: 'mock-data' } };
        },
        mutation: async (mutation: string, variables?: any) => {
          console.log('GraphQL Mutation:', mutation, variables);
          return { data: { mutation: 'mock-result' } };
        },
        subscription: async (subscription: string, variables?: any) => {
          console.log('GraphQL Subscription:', subscription, variables);
          return { data: { subscription: 'mock-stream' } };
        }
      }
    };
  }

  // React hook for using the machine
  useViewStateMachine(initialModel: TModel) {
    const [state, send] = useMachine(this.machine);
    
    const context = this.createStateContext(state, initialModel);
    
    // Execute state handler if exists
    React.useEffect(() => {
      const handler = this.stateHandlers.get(state.value);
      if (handler) {
        handler(context);
      }
    }, [state.value]);

    return {
      state: state.value,
      context: state.context,
      send,
      logEntries: this.logEntries,
      viewStack: this.viewStack,
      subMachines: this.subMachines,
      // Expose fluent API methods
      log: context.log,
      view: context.view,
      clear: context.clear,
      transition: context.transition,
      subMachine: context.subMachine,
      getSubMachine: context.getSubMachine
    };
  }

  async executeServerState(stateName: string, model: TModel): Promise<string> {
    const handler = this.serverStateHandlers.get(stateName);
    if (handler) {
      const context = this.createServerStateContext(model);
      await handler(context);
      return context.renderedHtml || '';
    }
    return '';
  }

  private createServerStateContext(model: TModel): ServerStateContext<TModel> {
    return {
      state: this.machine.initialState.value,
      model,
      transitions: [],
      log: async (message: string, metadata?: any) => {
        const entry: LogEntry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message,
          metadata,
        };
        this.logEntries.push(entry);
      },
      renderHtml: (html: string) => {
        return html;
      },
      clear: () => {
        // Server-side clear operation
      },
      transition: (to: string) => {
        // Server-side transition
      },
      send: (event: any) => {
        // Server-side event sending
      },
      on: (eventName: string, handler: () => void) => {
        // Server-side event handling
      },
      subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => {
        const subMachine = new ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return subMachine;
      },
      getSubMachine: (machineId: string) => {
        return this.subMachines.get(machineId);
      },
      graphql: {
        query: async (query: string, variables?: any) => {
          // Server-side GraphQL query
          return {};
        },
        mutation: async (mutation: string, variables?: any) => {
          // Server-side GraphQL mutation
          return {};
        },
        subscription: async (subscription: string, variables?: any) => {
          // Server-side GraphQL subscription
          return {};
        },
      },
      renderedHtml: '',
    };
  }

  // Compose with other ViewStateMachines
  compose(otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel> {
    // Merge state handlers
    otherView.stateHandlers.forEach((handler, stateName) => {
      this.stateHandlers.set(stateName, handler);
    });
    
    // Merge view stacks
    this.viewStack = [...this.viewStack, ...otherView.viewStack];
    
    // Merge sub-machines
    otherView.subMachines.forEach((subMachine, id) => {
      this.subMachines.set(id, subMachine);
    });
    
    return this;
  }

  // Synchronize with Tome
  synchronizeWithTome(tomeConfig: any): ViewStateMachine<TModel> {
    this.tomeConfig = tomeConfig;
    this.isTomeSynchronized = true;
    return this;
  }

  // Render the composed view
  render(model: TModel): React.ReactNode {
    return (
      <div className="composed-view">
        {this.viewStack.map((view, index) => (
          <div key={index} className="view-container">
            {view}
          </div>
        ))}
        {/* Render sub-machines
        todo: should we add a UI order for subMachines to specifically order? */}
        {Array.from(this.subMachines.entries()).map(([id, subMachine]) => (
          <div key={id} className="sub-machine-container">
            {subMachine.render(model)}
          </div>
        ))}
      </div>
    );
  }
}

export type ServerStateContext<TModel = any> = {
  state: string;
  model: TModel;
  transitions: any[];
  log: (message: string, metadata?: any) => Promise<void>;
  renderHtml: (html: string) => string;
  clear: () => void;
  transition: (to: string) => void;
  send: (event: any) => void;
  on: (eventName: string, handler: () => void) => void;
  // Sub-machine support
  subMachine: (machineId: string, config: ViewStateMachineConfig<any>) => ViewStateMachine<any>;
  getSubMachine: (machineId: string) => ViewStateMachine<any> | undefined;
  // GraphQL support
  graphql: {
    query: (query: string, variables?: any) => Promise<any>;
    mutation: (mutation: string, variables?: any) => Promise<any>;
    subscription: (subscription: string, variables?: any) => Promise<any>;
  };
  // Server-specific
  renderedHtml: string;
};

class ProxyMachine {
  private robotCopy: RobotCopy;
  
  constructor(robotCopy: RobotCopy) {
    this.robotCopy = robotCopy;
  }

  async send(event: any) {
    await this.robotCopy.sendMessage(event);
  }
}

export type ProxyRobotCopyStateViewStateMachineConfig<TModel = any> = ViewStateMachineConfig<TModel> & {
  robotCopy: RobotCopy;
  // Support for incoming message handling
  incomingMessageHandlers?: Record<string, (message: any) => void>;
};

export class ProxyRobotCopyStateMachine<TModel = any> extends ViewStateMachine<TModel> {
  private proxyRobotCopy: RobotCopy;
  private proxyMachine: ProxyMachine;
  private proxyIncomingMessageHandlers: Map<string, (message: any) => void> = new Map();
  
  constructor(config: ProxyRobotCopyStateViewStateMachineConfig<TModel>) {
    super(config);
    this.proxyRobotCopy = config.robotCopy;
    this.proxyMachine = new ProxyMachine(this.proxyRobotCopy);
    
    // Set up incoming message handlers
    if (config.incomingMessageHandlers) {
      Object.entries(config.incomingMessageHandlers).forEach(([eventType, handler]) => {
        this.proxyIncomingMessageHandlers.set(eventType, handler);
      });
    }
    
    // Set up RobotCopy to handle incoming messages
    this.setupIncomingMessageHandling();
  }

  private setupIncomingMessageHandling() {
    // Listen for incoming messages from RobotCopy
    this.proxyRobotCopy.onResponse('default', (response: any) => {
      const { type, payload } = response;
      const handler = this.proxyIncomingMessageHandlers.get(type);
      if (handler) {
        handler(payload);
      } else {
        console.log('No handler found for incoming message type:', type);
      }
    });
  }

  async send(event: any) {
    // Send outgoing message through RobotCopy
    await this.proxyRobotCopy.sendMessage(event);
  }

  // Add method to register incoming message handlers
  registerIncomingHandler(eventType: string, handler: (message: any) => void) {
    this.proxyIncomingMessageHandlers.set(eventType, handler);
  }

  // Add method to handle incoming messages manually
  handleIncomingMessage(message: any) {
    const { type, payload } = message;
    const handler = this.proxyIncomingMessageHandlers.get(type);
    if (handler) {
      handler(payload);
    }
  }

  render(model: TModel): React.ReactNode {
    throw new Error('ProxyStateMachine does not support rendering');
  }

  useViewStateMachine(initialModel: TModel) {
    throw new Error('ProxyStateMachine does not support useViewStateMachine');
    return {} as any; // This line will never be reached due to the throw
  }

  compose(otherView: ViewStateMachine<TModel>): ViewStateMachine<TModel> {
    throw new Error('ProxyStateMachine does not support compose');
  }

  synchronizeWithTome(tomeConfig: any): ViewStateMachine<TModel> {
    throw new Error('ProxyStateMachine does not support synchronizeWithTome');
  }

  withState(stateName: string, handler: StateHandler<TModel>): ViewStateMachine<TModel> {
    this.registerIncomingHandler(stateName, handler);
    return this;
  }
}

export function createProxyRobotCopyStateMachine<TModel = any>(
  config: ProxyRobotCopyStateViewStateMachineConfig<TModel>
): ProxyRobotCopyStateMachine<TModel> {
  return new ProxyRobotCopyStateMachine(config);
}

// Helper function to create a ViewStateMachine
export function createViewStateMachine<TModel = any>(
  config: ViewStateMachineConfig<TModel>
): ViewStateMachine<TModel> {
  return new ViewStateMachine(config);
} 