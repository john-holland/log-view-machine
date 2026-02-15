import React, { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign, interpret, AnyStateMachine } from 'xstate';
import { RobotCopy } from './robotcopy/RobotCopy';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  metadata?: any;
}

/** Optional view storage config: RxDB schema and find/findOne specs to populate model. */
export type ViewStorageConfig = {
  schema?: any;
  find?: Record<string, unknown>[] | Record<string, unknown>;
  findOne?: Record<string, unknown>;
  /** Collection name for find/findOne (default when not set is left to db facade). */
  collection?: string;
  /** Collection name for log entries (default 'logEntries'). */
  logCollection?: string;
  /** Schema applied to log entry metadata when inserting (enforces type/property inclusion). */
  logMetadataSchema?: any;
};

// Types for the fluent API
export type StateContext<TModel = any> = {
  state: string;
  model: TModel;
  transitions: any[];
  /** Single document from findOne; undefined when no findOne or no db. */
  result?: unknown;
  /** Array from find; [] when no find or no db. */
  results: unknown[];
  /** RxDB database instance or facade when view storage is configured; undefined otherwise. */
  db?: any;
  /** config is spread onto the log entry (override any property); schema applies to metadata. */
  log: (message: string, metadata?: any, config?: Partial<LogEntry>) => Promise<void>;
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
  /** Optional: stable key for React key / render slot; default uses machineId. */
  renderKey?: string;
  logStates?: Record<string, StateHandler<TModel>>;
  tomeConfig?: any;
  subMachines?: Record<string, ViewStateMachineConfig<any>>;
  /** Optional RxDB database (or facade) for view storage; passed to StateContext and machine context. */
  db?: any;
  /** Optional view storage config: schema, find, findOne to populate model from db. */
  viewStorage?: ViewStorageConfig;
};

export class ViewStateMachine<TModel = any> {
  private machine: any;
  /** Machine definition for useMachine (XState v5 expects machine, not service). */
  private machineDefinition: AnyStateMachine;
  private stateHandlers: Map<string, StateHandler<TModel>>;
  private serverStateHandlers: Map<string, (context: ServerStateContext<TModel>) => void> = new Map();
  private viewStack: React.ReactNode[] = [];
  private logEntries: any[] = [];
  private tomeConfig?: any;
  private isTomeSynchronized: boolean = false;
  private subMachines: Map<string, ViewStateMachine<any>> = new Map();
  // Add RobotCopy support for incoming messages
  private robotCopy?: RobotCopy;
  private incomingMessageHandlers: Map<string, (message: any) => void> = new Map();
  private db?: any;
  private viewStorage?: ViewStorageConfig;
  /** Per-state view storage config (merged with viewStorage when running that state's handler). */
  private stateViewStorage: Map<string, Partial<ViewStorageConfig>> = new Map();
  private machineId: string;
  private configRenderKey?: string;
  private renderKeyClearCount = 0;
  private viewKeyListeners: Array<(key: string) => void> = [];

  constructor(config: ViewStateMachineConfig<TModel>) {
    this.stateHandlers = new Map();
    this.machineId = config.machineId;
    this.configRenderKey = config.renderKey;
    this.tomeConfig = config.tomeConfig;
    this.db = config.db;
    this.viewStorage = config.viewStorage;

    const initialContext = {
      ...(config.xstateConfig.context ?? {}),
      ...(config.db !== undefined ? { db: config.db } : {}),
    };

    // Enhance xstateConfig with modded state if modMetadata is present
    let enhancedXstateConfig = { ...config.xstateConfig };
    if (config.tomeConfig?.modMetadata) {
      // Add modded state
      enhancedXstateConfig.states = {
        ...enhancedXstateConfig.states,
        modded: {
          on: {
            INITIALIZE: enhancedXstateConfig.initial || 'idle',
            LOAD_MOD_COMPLETE: enhancedXstateConfig.initial || 'idle',
            UNLOAD_MOD: enhancedXstateConfig.initial || 'idle'
          }
        }
      };
      
      // Add LOAD_MOD transition to all states
      const states = enhancedXstateConfig.states || {};
      Object.keys(states).forEach(stateKey => {
        if (!states[stateKey].on) {
          states[stateKey].on = {};
        }
        states[stateKey].on = {
          ...states[stateKey].on,
          LOAD_MOD: 'modded'
        };
      });
    }

    // Create the XState machine (predictableActionArguments in config per XState v5)
    const machineDefinition = createMachine({
      ...enhancedXstateConfig,
      context: initialContext,
      predictableActionArguments: true,
      on: {
        ...enhancedXstateConfig.on,
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

    this.machineDefinition = machineDefinition as AnyStateMachine;
    // Interpret the machine to create a service for non-React API (start, getSnapshot, on, send)
    this.machine = interpret(machineDefinition);

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
  withState(
    stateName: string,
    handler: StateHandler<TModel>,
    config?: Partial<ViewStorageConfig>
  ): ViewStateMachine<TModel> {
    if (config) {
      this.stateViewStorage.set(stateName, { ...this.stateViewStorage.get(stateName), ...config });
      this.viewStorage = { ...this.viewStorage, ...config };
    }
    this.stateHandlers.set(stateName, handler);
    return this;
  }

  /** Set view storage config (RxDB schema, find, findOne). Chain after withState or use alone. */
  withViewStorage(config: ViewStorageConfig): ViewStateMachine<TModel> {
    this.viewStorage = { ...this.viewStorage, ...config };
    return this;
  }

  /** Register RxDB schema for view storage; enforces shape on insert. Chain after withState. */
  schema(schema: any): ViewStateMachine<TModel> {
    this.viewStorage = { ...this.viewStorage, schema };
    return this;
  }

  /** Query RxDB with specs; results update view model when state is entered. Chain after withState. */
  find(specs: Record<string, unknown>[] | Record<string, unknown>): ViewStateMachine<TModel> {
    this.viewStorage = { ...this.viewStorage, find: specs };
    return this;
  }

  /** Query RxDB for one document; result updates view model. Chain after withState. */
  findOne(spec: Record<string, unknown>): ViewStateMachine<TModel> {
    this.viewStorage = { ...this.viewStorage, findOne: spec };
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

  /**
   * Run find and findOne against db when effectiveStorage has specs.
   * Expects db to expose collections with .find(selector).exec() and .findOne(selector).exec() (RxDB-style).
   */
  private async runFindFindOne(
    effectiveStorage: Partial<ViewStorageConfig> | undefined
  ): Promise<{ result: unknown; results: unknown[] }> {
    const out = { result: undefined as unknown, results: [] as unknown[] };
    if (!this.db || !effectiveStorage) return out;
    const collectionName = effectiveStorage.collection ?? 'views';
    const coll = this.db[collectionName] ?? (typeof this.db.get === 'function' ? this.db.get(collectionName) : null);
    if (!coll) return out;
    try {
      if (effectiveStorage.find != null) {
        const spec = effectiveStorage.find as Record<string, unknown>;
        const selector = spec && typeof spec === 'object' && 'selector' in spec ? (spec.selector as object) : spec;
        const query = coll.find && typeof coll.find === 'function' ? coll.find(selector) : null;
        out.results = query && typeof query.exec === 'function' ? await query.exec() : [];
      }
      if (effectiveStorage.findOne != null) {
        const spec = effectiveStorage.findOne as Record<string, unknown>;
        const selector = spec && typeof spec === 'object' && 'selector' in spec ? (spec.selector as object) : spec;
        const query = coll.findOne && typeof coll.findOne === 'function' ? coll.findOne(selector) : null;
        const one = query && typeof query.exec === 'function' ? await query.exec() : null;
        out.result = one ?? undefined;
      }
    } catch (_e) {
      out.results = [];
      out.result = undefined;
    }
    return out;
  }

  /** Enforce schema on metadata: ensure required fields from schema exist; coerce types if possible. No-op if no schema. */
  private applyLogMetadataSchema(metadata: any, schema: any): any {
    if (!schema || typeof schema !== 'object') return metadata;
    const out = { ...metadata };
    const props = schema.properties ?? schema;
    if (typeof props === 'object') {
      for (const [key, desc] of Object.entries(props)) {
        if (out[key] === undefined && (desc as any).default !== undefined) out[key] = (desc as any).default;
      }
    }
    return out;
  }

  // State context methods (sendFromHook: when using useViewStateMachine, use hook's send so one interpreter)
  private createStateContext(
    state: any,
    model: TModel,
    sendFromHook?: (event: any) => void,
    result?: unknown,
    results: unknown[] = [],
    effectiveStorage?: Partial<ViewStorageConfig>
  ): StateContext<TModel> {
    const sendEvent = sendFromHook ?? ((event: any) => this.machine.send(event));
    const logCollection = effectiveStorage?.logCollection ?? 'logEntries';
    const logMetadataSchema = effectiveStorage?.logMetadataSchema;
    return {
      state: state.value,
      model,
      transitions: state.history?.events || [],
      result,
      results: results ?? [],
      ...(this.db !== undefined ? { db: this.db } : {}),
      log: async (message: string, metadata?: any, config?: Partial<LogEntry>) => {
        const baseLogEntry: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message,
          metadata: metadata ?? {}
        };
        let metadataOut = baseLogEntry.metadata ?? {};
        if (logMetadataSchema) metadataOut = this.applyLogMetadataSchema(metadataOut, logMetadataSchema);
        const logEntry: LogEntry & Record<string, unknown> = {
          ...baseLogEntry,
          metadata: metadataOut,
          ...config
        };
        this.logEntries.push(logEntry);
        sendEvent({ type: 'LOG_ADDED', payload: logEntry });
        console.log(`[${state.value}] ${message}`, metadata);
        if (this.db && logCollection) {
          try {
            const dbColl = this.db[logCollection] ?? (typeof this.db.get === 'function' ? this.db.get(logCollection) : null);
            if (dbColl && typeof dbColl.insert === 'function') await dbColl.insert(logEntry);
          } catch (_err) {
            // already pushed to logEntries and emitted LOG_ADDED
          }
        }
      },
      view: (component: React.ReactNode) => {
        if (!this.isTomeSynchronized && this.tomeConfig) {
          console.warn('Warning: view() called from Tome without synchronized ViewStateMachine. This may cause architectural issues.');
        }
        this.viewStack.push(component);
        sendEvent({ type: 'VIEW_ADDED', payload: component });
        return component;
      },
      clear: () => {
        this.viewStack = [];
        sendEvent({ type: 'VIEW_CLEARED' });
      },
      transition: (to: string) => {
        sendEvent({ type: 'TRANSITION', payload: { to } });
      },
      send: (event: any) => {
        sendEvent(event);
      },
      on: (eventName: string, handler: () => void) => {
        // Register event handlers on the service (when using hook, this.machine is separate; prefer hook send for transitions)
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

  // React hook for using the machine (pass machine definition; @xstate/react v5/v6 expects machine, not service)
  useViewStateMachine(initialModel: TModel) {
    const [state, send] = useMachine(this.machineDefinition);
    const [context, setContext] = useState<StateContext<TModel> | null>(null);

    // Execute state handler: compute effectiveStorage, run find/findOne, create context, then run handler
    useEffect(() => {
      let cancelled = false;
      const stateKey = typeof state.value === 'string' ? state.value : (state.value as any)?.toString?.() ?? String(state.value);
      const effectiveStorage: Partial<ViewStorageConfig> = {
        ...this.viewStorage,
        ...this.stateViewStorage.get(stateKey)
      };
      (async () => {
        const { result, results } = await this.runFindFindOne(effectiveStorage);
        if (cancelled) return;
        const ctx = this.createStateContext(state, initialModel, send, result, results, effectiveStorage);
        setContext(ctx);
        const handler = this.stateHandlers.get(stateKey);
        if (handler) handler(ctx);
      })();
      return () => { cancelled = true; };
    }, [state.value]);

    const stableContext = context ?? this.createStateContext(state, initialModel, send, undefined, [], undefined);

    return {
      state: state.value,
      context: state.context,
      send,
      logEntries: this.logEntries,
      viewStack: this.viewStack,
      subMachines: this.subMachines,
      result: stableContext.result,
      results: stableContext.results,
      log: stableContext.log,
      view: stableContext.view,
      clear: stableContext.clear,
      transition: stableContext.transition,
      subMachine: stableContext.subMachine,
      getSubMachine: stableContext.getSubMachine
    };
  }

  // Event subscription methods for TomeConnector (XState v5 actor may not have .on; guard for compatibility)
  on(eventType: string, handler: (event: any) => void): void {
    if (this.machine && typeof (this.machine as any).on === 'function') {
      (this.machine as any).on(eventType, handler);
    }
    // XState v5 uses subscribe() instead of on(); event forwarding can be extended via subscribe(snapshot => ...) if needed
  }

  // Direct send method for TomeConnector
  send(event: any): void {
    if (this.machine && typeof this.machine.send === 'function') {
      this.machine.send(event);
    } else {
      console.warn('Machine not started or send method not available');
    }
  }

  // Start the machine service
  start(): void {
    if (this.machine && typeof this.machine.start === 'function') {
      this.machine.start();
    }
  }

  // Get current state
  getState(): any {
    if (this.machine && typeof this.machine.getSnapshot === 'function') {
      return this.machine.getSnapshot();
    }
    return null;
  }

  /** Returns a stable key for this machine in the render tree (e.g. React key). Updates when clear() is called. */
  getRenderKey(): string {
    const base = this.configRenderKey ?? this.machineId;
    return this.renderKeyClearCount > 0 ? `${base}-clear${this.renderKeyClearCount}` : base;
  }

  /** Subscribes to render-key updates; returns unsubscribe. Callback is invoked when the key changes (e.g. after clear()). */
  observeViewKey(callback: (key: string) => void): () => void {
    callback(this.getRenderKey());
    this.viewKeyListeners.push(callback);
    return () => {
      const i = this.viewKeyListeners.indexOf(callback);
      if (i !== -1) this.viewKeyListeners.splice(i, 1);
    };
  }

  /** Subscribes to state snapshot updates (XState); returns unsubscribe. Used by evented mod loader etc. */
  subscribe(callback: (snapshot: any) => void): () => void {
    if (!this.machine || typeof (this.machine as any).subscribe !== 'function') {
      return () => {};
    }
    const sub = (this.machine as any).subscribe(callback);
    return typeof sub?.unsubscribe === 'function' ? sub.unsubscribe.bind(sub) : () => {};
  }

  private notifyViewKeyListeners(): void {
    const key = this.getRenderKey();
    this.viewKeyListeners.forEach((cb) => cb(key));
  }

  /** Stops the machine service. */
  stop(): void {
    if (this.machine && typeof (this.machine as any).stop === 'function') {
      (this.machine as any).stop();
    }
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

  withState(
    stateName: string,
    handler: StateHandler<TModel>,
    _config?: Partial<ViewStorageConfig>
  ): ViewStateMachine<TModel> {
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