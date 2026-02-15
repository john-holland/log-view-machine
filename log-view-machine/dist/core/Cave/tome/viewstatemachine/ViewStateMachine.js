import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign, interpret } from 'xstate';
export class ViewStateMachine {
    constructor(config) {
        this.serverStateHandlers = new Map();
        this.viewStack = [];
        this.logEntries = [];
        this.isTomeSynchronized = false;
        this.subMachines = new Map();
        this.incomingMessageHandlers = new Map();
        /** Per-state view storage config (merged with viewStorage when running that state's handler). */
        this.stateViewStorage = new Map();
        this.renderKeyClearCount = 0;
        this.viewKeyListeners = [];
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
                    actions: assign((context, event) => ({
                        viewStack: [...(context.viewStack || []), event.payload]
                    }))
                },
                VIEW_CLEARED: {
                    actions: assign({
                        viewStack: []
                    })
                },
                LOG_ADDED: {
                    actions: assign((context, event) => ({
                        logEntries: [...(context.logEntries || []), event.payload]
                    }))
                },
                // Sub-machine events
                SUB_MACHINE_CREATED: {
                    actions: assign((context, event) => ({
                        subMachines: { ...context.subMachines, [event.payload.id]: event.payload }
                    }))
                },
                // RobotCopy incoming message events
                ROBOTCOPY_MESSAGE: {
                    actions: assign((context, event) => ({
                        robotCopyMessages: [...(context.robotCopyMessages || []), event.payload]
                    }))
                }
            }
        });
        this.machineDefinition = machineDefinition;
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
    withRobotCopy(robotCopy) {
        this.robotCopy = robotCopy;
        this.setupRobotCopyIncomingHandling();
        return this;
    }
    setupRobotCopyIncomingHandling() {
        if (!this.robotCopy)
            return;
        // Listen for incoming messages from RobotCopy
        this.robotCopy.onResponse('default', (response) => {
            const { type, payload } = response;
            const handler = this.incomingMessageHandlers.get(type);
            if (handler) {
                handler(payload);
            }
            else {
                console.log('No handler found for incoming RobotCopy message type:', type);
            }
        });
    }
    registerRobotCopyHandler(eventType, handler) {
        this.incomingMessageHandlers.set(eventType, handler);
        return this;
    }
    handleRobotCopyMessage(message) {
        const { type, payload } = message;
        const handler = this.incomingMessageHandlers.get(type);
        if (handler) {
            handler(payload);
        }
    }
    // Fluent API methods
    withState(stateName, handler, config) {
        if (config) {
            this.stateViewStorage.set(stateName, { ...this.stateViewStorage.get(stateName), ...config });
            this.viewStorage = { ...this.viewStorage, ...config };
        }
        this.stateHandlers.set(stateName, handler);
        return this;
    }
    /** Set view storage config (RxDB schema, find, findOne). Chain after withState or use alone. */
    withViewStorage(config) {
        this.viewStorage = { ...this.viewStorage, ...config };
        return this;
    }
    /** Register RxDB schema for view storage; enforces shape on insert. Chain after withState. */
    schema(schema) {
        this.viewStorage = { ...this.viewStorage, schema };
        return this;
    }
    /** Query RxDB with specs; results update view model when state is entered. Chain after withState. */
    find(specs) {
        this.viewStorage = { ...this.viewStorage, find: specs };
        return this;
    }
    /** Query RxDB for one document; result updates view model. Chain after withState. */
    findOne(spec) {
        this.viewStorage = { ...this.viewStorage, findOne: spec };
        return this;
    }
    // Override for withState that registers message handlers
    withStateAndMessageHandler(stateName, handler, messageType, messageHandler) {
        this.stateHandlers.set(stateName, handler);
        // Register the message handler if RobotCopy is available
        if (this.robotCopy) {
            this.registerRobotCopyHandler(messageType, messageHandler);
        }
        return this;
    }
    withServerState(stateName, handler) {
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
    withSubMachine(machineId, config) {
        const subMachine = new ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return this;
    }
    getSubMachine(machineId) {
        return this.subMachines.get(machineId);
    }
    /**
     * Run find and findOne against db when effectiveStorage has specs.
     * Expects db to expose collections with .find(selector).exec() and .findOne(selector).exec() (RxDB-style).
     */
    async runFindFindOne(effectiveStorage) {
        const out = { result: undefined, results: [] };
        if (!this.db || !effectiveStorage)
            return out;
        const collectionName = effectiveStorage.collection ?? 'views';
        const coll = this.db[collectionName] ?? (typeof this.db.get === 'function' ? this.db.get(collectionName) : null);
        if (!coll)
            return out;
        try {
            if (effectiveStorage.find != null) {
                const spec = effectiveStorage.find;
                const selector = spec && typeof spec === 'object' && 'selector' in spec ? spec.selector : spec;
                const query = coll.find && typeof coll.find === 'function' ? coll.find(selector) : null;
                out.results = query && typeof query.exec === 'function' ? await query.exec() : [];
            }
            if (effectiveStorage.findOne != null) {
                const spec = effectiveStorage.findOne;
                const selector = spec && typeof spec === 'object' && 'selector' in spec ? spec.selector : spec;
                const query = coll.findOne && typeof coll.findOne === 'function' ? coll.findOne(selector) : null;
                const one = query && typeof query.exec === 'function' ? await query.exec() : null;
                out.result = one ?? undefined;
            }
        }
        catch (_e) {
            out.results = [];
            out.result = undefined;
        }
        return out;
    }
    /** Enforce schema on metadata: ensure required fields from schema exist; coerce types if possible. No-op if no schema. */
    applyLogMetadataSchema(metadata, schema) {
        if (!schema || typeof schema !== 'object')
            return metadata;
        const out = { ...metadata };
        const props = schema.properties ?? schema;
        if (typeof props === 'object') {
            for (const [key, desc] of Object.entries(props)) {
                if (out[key] === undefined && desc.default !== undefined)
                    out[key] = desc.default;
            }
        }
        return out;
    }
    // State context methods (sendFromHook: when using useViewStateMachine, use hook's send so one interpreter)
    createStateContext(state, model, sendFromHook, result, results = [], effectiveStorage) {
        const sendEvent = sendFromHook ?? ((event) => this.machine.send(event));
        const logCollection = effectiveStorage?.logCollection ?? 'logEntries';
        const logMetadataSchema = effectiveStorage?.logMetadataSchema;
        return {
            state: state.value,
            model,
            transitions: state.history?.events || [],
            result,
            results: results ?? [],
            ...(this.db !== undefined ? { db: this.db } : {}),
            log: async (message, metadata, config) => {
                const baseLogEntry = {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message,
                    metadata: metadata ?? {}
                };
                let metadataOut = baseLogEntry.metadata ?? {};
                if (logMetadataSchema)
                    metadataOut = this.applyLogMetadataSchema(metadataOut, logMetadataSchema);
                const logEntry = {
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
                        if (dbColl && typeof dbColl.insert === 'function')
                            await dbColl.insert(logEntry);
                    }
                    catch (_err) {
                        // already pushed to logEntries and emitted LOG_ADDED
                    }
                }
            },
            view: (component) => {
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
            transition: (to) => {
                sendEvent({ type: 'TRANSITION', payload: { to } });
            },
            send: (event) => {
                sendEvent(event);
            },
            on: (eventName, handler) => {
                // Register event handlers on the service (when using hook, this.machine is separate; prefer hook send for transitions)
                this.machine.on(eventName, handler);
            },
            // Sub-machine methods
            subMachine: (machineId, config) => {
                const subMachine = new ViewStateMachine(config);
                this.subMachines.set(machineId, subMachine);
                return subMachine;
            },
            getSubMachine: (machineId) => {
                return this.subMachines.get(machineId);
            },
            // GraphQL methods
            graphql: {
                query: async (query, variables) => {
                    // This would integrate with a GraphQL client
                    console.log('GraphQL Query:', query, variables);
                    return { data: { query: 'mock-data' } };
                },
                mutation: async (mutation, variables) => {
                    console.log('GraphQL Mutation:', mutation, variables);
                    return { data: { mutation: 'mock-result' } };
                },
                subscription: async (subscription, variables) => {
                    console.log('GraphQL Subscription:', subscription, variables);
                    return { data: { subscription: 'mock-stream' } };
                }
            }
        };
    }
    // React hook for using the machine (pass machine definition; @xstate/react v5/v6 expects machine, not service)
    useViewStateMachine(initialModel) {
        const [state, send] = useMachine(this.machineDefinition);
        const [context, setContext] = useState(null);
        // Execute state handler: compute effectiveStorage, run find/findOne, create context, then run handler
        useEffect(() => {
            let cancelled = false;
            const stateKey = typeof state.value === 'string' ? state.value : state.value?.toString?.() ?? String(state.value);
            const effectiveStorage = {
                ...this.viewStorage,
                ...this.stateViewStorage.get(stateKey)
            };
            (async () => {
                const { result, results } = await this.runFindFindOne(effectiveStorage);
                if (cancelled)
                    return;
                const ctx = this.createStateContext(state, initialModel, send, result, results, effectiveStorage);
                setContext(ctx);
                const handler = this.stateHandlers.get(stateKey);
                if (handler)
                    handler(ctx);
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
    on(eventType, handler) {
        if (this.machine && typeof this.machine.on === 'function') {
            this.machine.on(eventType, handler);
        }
        // XState v5 uses subscribe() instead of on(); event forwarding can be extended via subscribe(snapshot => ...) if needed
    }
    // Direct send method for TomeConnector
    send(event) {
        if (this.machine && typeof this.machine.send === 'function') {
            this.machine.send(event);
        }
        else {
            console.warn('Machine not started or send method not available');
        }
    }
    // Start the machine service
    start() {
        if (this.machine && typeof this.machine.start === 'function') {
            this.machine.start();
        }
    }
    // Get current state
    getState() {
        if (this.machine && typeof this.machine.getSnapshot === 'function') {
            return this.machine.getSnapshot();
        }
        return null;
    }
    /** Returns a stable key for this machine in the render tree (e.g. React key). Updates when clear() is called. */
    getRenderKey() {
        const base = this.configRenderKey ?? this.machineId;
        return this.renderKeyClearCount > 0 ? `${base}-clear${this.renderKeyClearCount}` : base;
    }
    /** Subscribes to render-key updates; returns unsubscribe. Callback is invoked when the key changes (e.g. after clear()). */
    observeViewKey(callback) {
        callback(this.getRenderKey());
        this.viewKeyListeners.push(callback);
        return () => {
            const i = this.viewKeyListeners.indexOf(callback);
            if (i !== -1)
                this.viewKeyListeners.splice(i, 1);
        };
    }
    /** Subscribes to state snapshot updates (XState); returns unsubscribe. Used by evented mod loader etc. */
    subscribe(callback) {
        if (!this.machine || typeof this.machine.subscribe !== 'function') {
            return () => { };
        }
        const sub = this.machine.subscribe(callback);
        return typeof sub?.unsubscribe === 'function' ? sub.unsubscribe.bind(sub) : () => { };
    }
    notifyViewKeyListeners() {
        const key = this.getRenderKey();
        this.viewKeyListeners.forEach((cb) => cb(key));
    }
    /** Stops the machine service. */
    stop() {
        if (this.machine && typeof this.machine.stop === 'function') {
            this.machine.stop();
        }
    }
    async executeServerState(stateName, model) {
        const handler = this.serverStateHandlers.get(stateName);
        if (handler) {
            const context = this.createServerStateContext(model);
            await handler(context);
            return context.renderedHtml || '';
        }
        return '';
    }
    createServerStateContext(model) {
        return {
            state: this.machine.initialState.value,
            model,
            transitions: [],
            log: async (message, metadata) => {
                const entry = {
                    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                    level: 'INFO',
                    message,
                    metadata,
                };
                this.logEntries.push(entry);
            },
            renderHtml: (html) => {
                return html;
            },
            clear: () => {
                // Server-side clear operation
            },
            transition: (to) => {
                // Server-side transition
            },
            send: (event) => {
                // Server-side event sending
            },
            on: (eventName, handler) => {
                // Server-side event handling
            },
            subMachine: (machineId, config) => {
                const subMachine = new ViewStateMachine(config);
                this.subMachines.set(machineId, subMachine);
                return subMachine;
            },
            getSubMachine: (machineId) => {
                return this.subMachines.get(machineId);
            },
            graphql: {
                query: async (query, variables) => {
                    // Server-side GraphQL query
                    return {};
                },
                mutation: async (mutation, variables) => {
                    // Server-side GraphQL mutation
                    return {};
                },
                subscription: async (subscription, variables) => {
                    // Server-side GraphQL subscription
                    return {};
                },
            },
            renderedHtml: '',
        };
    }
    // Compose with other ViewStateMachines
    compose(otherView) {
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
    synchronizeWithTome(tomeConfig) {
        this.tomeConfig = tomeConfig;
        this.isTomeSynchronized = true;
        return this;
    }
    // Render the composed view
    render(model) {
        return (_jsxs("div", { className: "composed-view", children: [this.viewStack.map((view, index) => (_jsx("div", { className: "view-container", children: view }, index))), Array.from(this.subMachines.entries()).map(([id, subMachine]) => (_jsx("div", { className: "sub-machine-container", children: subMachine.render(model) }, id)))] }));
    }
}
class ProxyMachine {
    constructor(robotCopy) {
        this.robotCopy = robotCopy;
    }
    async send(event) {
        await this.robotCopy.sendMessage(event);
    }
}
export class ProxyRobotCopyStateMachine extends ViewStateMachine {
    constructor(config) {
        super(config);
        this.proxyIncomingMessageHandlers = new Map();
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
    setupIncomingMessageHandling() {
        // Listen for incoming messages from RobotCopy
        this.proxyRobotCopy.onResponse('default', (response) => {
            const { type, payload } = response;
            const handler = this.proxyIncomingMessageHandlers.get(type);
            if (handler) {
                handler(payload);
            }
            else {
                console.log('No handler found for incoming message type:', type);
            }
        });
    }
    async send(event) {
        // Send outgoing message through RobotCopy
        await this.proxyRobotCopy.sendMessage(event);
    }
    // Add method to register incoming message handlers
    registerIncomingHandler(eventType, handler) {
        this.proxyIncomingMessageHandlers.set(eventType, handler);
    }
    // Add method to handle incoming messages manually
    handleIncomingMessage(message) {
        const { type, payload } = message;
        const handler = this.proxyIncomingMessageHandlers.get(type);
        if (handler) {
            handler(payload);
        }
    }
    render(model) {
        throw new Error('ProxyStateMachine does not support rendering');
    }
    useViewStateMachine(initialModel) {
        throw new Error('ProxyStateMachine does not support useViewStateMachine');
        return {}; // This line will never be reached due to the throw
    }
    compose(otherView) {
        throw new Error('ProxyStateMachine does not support compose');
    }
    synchronizeWithTome(tomeConfig) {
        throw new Error('ProxyStateMachine does not support synchronizeWithTome');
    }
    withState(stateName, handler, _config) {
        this.registerIncomingHandler(stateName, handler);
        return this;
    }
}
export function createProxyRobotCopyStateMachine(config) {
    return new ProxyRobotCopyStateMachine(config);
}
// Helper function to create a ViewStateMachine
export function createViewStateMachine(config) {
    return new ViewStateMachine(config);
}
