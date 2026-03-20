var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/core/Cave/tome/viewstatemachine/ViewStateMachine.tsx
import React, { useState, useEffect } from "react";
import { useMachine } from "@xstate/react";
import { createMachine, assign, interpret } from "xstate";
import { useContainerAdapter, parseContainerOverrideTag } from "container-cave-adapter";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
var ViewStateMachine = class _ViewStateMachine {
  constructor(config) {
    this.serverStateHandlers = /* @__PURE__ */ new Map();
    this.viewStack = [];
    this.logEntries = [];
    this.isTomeSynchronized = false;
    this.subMachines = /* @__PURE__ */ new Map();
    this.incomingMessageHandlers = /* @__PURE__ */ new Map();
    /** Per-state view storage config (merged with viewStorage when running that state's handler). */
    this.stateViewStorage = /* @__PURE__ */ new Map();
    this.renderKeyClearCount = 0;
    this.viewKeyListeners = [];
    this.stateHandlers = /* @__PURE__ */ new Map();
    this.machineId = config.machineId;
    this.configRenderKey = config.renderKey;
    this.tomeConfig = config.tomeConfig;
    this.db = config.db;
    this.viewStorage = config.viewStorage;
    const initialContext = {
      ...config.xstateConfig.context ?? {},
      ...config.db !== void 0 ? { db: config.db } : {}
    };
    let enhancedXstateConfig = { ...config.xstateConfig };
    if (config.tomeConfig?.modMetadata) {
      enhancedXstateConfig.states = {
        ...enhancedXstateConfig.states,
        modded: {
          on: {
            INITIALIZE: enhancedXstateConfig.initial || "idle",
            LOAD_MOD_COMPLETE: enhancedXstateConfig.initial || "idle",
            UNLOAD_MOD: enhancedXstateConfig.initial || "idle"
          }
        }
      };
      const states = enhancedXstateConfig.states || {};
      Object.keys(states).forEach((stateKey) => {
        if (!states[stateKey].on) {
          states[stateKey].on = {};
        }
        states[stateKey].on = {
          ...states[stateKey].on,
          LOAD_MOD: "modded"
        };
      });
    }
    const machineDefinition = createMachine({
      ...enhancedXstateConfig,
      context: initialContext,
      predictableActionArguments: true,
      on: {
        ...enhancedXstateConfig.on,
        // Add our custom events
        VIEW_ADDED: {
          actions: assign((context, event) => ({
            viewStack: [...context.viewStack || [], event.payload]
          }))
        },
        VIEW_CLEARED: {
          actions: assign({
            viewStack: []
          })
        },
        LOG_ADDED: {
          actions: assign((context, event) => ({
            logEntries: [...context.logEntries || [], event.payload]
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
            robotCopyMessages: [...context.robotCopyMessages || [], event.payload]
          }))
        }
      }
    });
    this.machineDefinition = machineDefinition;
    this.machine = interpret(machineDefinition);
    if (config.logStates) {
      Object.entries(config.logStates).forEach(([stateName, handler]) => {
        this.withState(stateName, handler);
      });
    }
    if (config.subMachines) {
      Object.entries(config.subMachines).forEach(([id, subConfig]) => {
        const subMachine = new _ViewStateMachine(subConfig);
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
    if (!this.robotCopy) return;
    this.robotCopy.onResponse("default", (response) => {
      const { type, payload } = response;
      const handler = this.incomingMessageHandlers.get(type);
      if (handler) {
        handler(payload);
      } else {
        console.log("No handler found for incoming RobotCopy message type:", type);
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
    if (this.robotCopy) {
      this.registerRobotCopyHandler(messageType, messageHandler);
    }
    return this;
  }
  withServerState(stateName, handler) {
    this.serverStateHandlers.set(stateName, handler);
    return this;
  }
  // Sub-machine support
  withSubMachine(machineId, config) {
    const subMachine = new _ViewStateMachine(config);
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
    const out = { result: void 0, results: [] };
    if (!this.db || !effectiveStorage) return out;
    const collectionName = effectiveStorage.collection ?? "views";
    const coll = this.db[collectionName] ?? (typeof this.db.get === "function" ? this.db.get(collectionName) : null);
    if (!coll) return out;
    try {
      if (effectiveStorage.find != null) {
        const spec = effectiveStorage.find;
        const selector = spec && typeof spec === "object" && "selector" in spec ? spec.selector : spec;
        const query = coll.find && typeof coll.find === "function" ? coll.find(selector) : null;
        out.results = query && typeof query.exec === "function" ? await query.exec() : [];
      }
      if (effectiveStorage.findOne != null) {
        const spec = effectiveStorage.findOne;
        const selector = spec && typeof spec === "object" && "selector" in spec ? spec.selector : spec;
        const query = coll.findOne && typeof coll.findOne === "function" ? coll.findOne(selector) : null;
        const one = query && typeof query.exec === "function" ? await query.exec() : null;
        out.result = one ?? void 0;
      }
    } catch (_e) {
      out.results = [];
      out.result = void 0;
    }
    return out;
  }
  /** Enforce schema on metadata: ensure required fields from schema exist; coerce types if possible. No-op if no schema. */
  applyLogMetadataSchema(metadata, schema) {
    if (!schema || typeof schema !== "object") return metadata;
    const out = { ...metadata };
    const props = schema.properties ?? schema;
    if (typeof props === "object") {
      for (const [key, desc] of Object.entries(props)) {
        if (out[key] === void 0 && desc.default !== void 0) out[key] = desc.default;
      }
    }
    return out;
  }
  // State context methods (sendFromHook: when using useViewStateMachine, use hook's send so one interpreter)
  createStateContext(state, model, sendFromHook, result, results = [], effectiveStorage) {
    const sendEvent = sendFromHook ?? ((event) => this.machine.send(event));
    const logCollection = effectiveStorage?.logCollection ?? "logEntries";
    const logMetadataSchema = effectiveStorage?.logMetadataSchema;
    return {
      state: state.value,
      model,
      transitions: state.history?.events || [],
      result,
      results: results ?? [],
      ...this.db !== void 0 ? { db: this.db } : {},
      log: async (message, metadata, config) => {
        const baseLogEntry = {
          id: Date.now().toString(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level: "INFO",
          message,
          metadata: metadata ?? {}
        };
        let metadataOut = baseLogEntry.metadata ?? {};
        if (logMetadataSchema) metadataOut = this.applyLogMetadataSchema(metadataOut, logMetadataSchema);
        const logEntry = {
          ...baseLogEntry,
          metadata: metadataOut,
          ...config
        };
        this.logEntries.push(logEntry);
        sendEvent({ type: "LOG_ADDED", payload: logEntry });
        console.log(`[${state.value}] ${message}`, metadata);
        if (this.db && logCollection) {
          try {
            const dbColl = this.db[logCollection] ?? (typeof this.db.get === "function" ? this.db.get(logCollection) : null);
            if (dbColl && typeof dbColl.insert === "function") await dbColl.insert(logEntry);
          } catch (_err) {
          }
        }
      },
      view: (component) => {
        if (!this.isTomeSynchronized && this.tomeConfig) {
          console.warn("Warning: view() called from Tome without synchronized ViewStateMachine. This may cause architectural issues.");
        }
        this.viewStack.push(component);
        sendEvent({ type: "VIEW_ADDED", payload: component });
        return component;
      },
      clear: () => {
        this.viewStack = [];
        sendEvent({ type: "VIEW_CLEARED" });
      },
      transition: (to) => {
        sendEvent({ type: "TRANSITION", payload: { to } });
      },
      send: (event) => {
        sendEvent(event);
      },
      on: (eventName, handler) => {
        this.machine.on(eventName, handler);
      },
      // Sub-machine methods
      subMachine: (machineId, config) => {
        const subMachine = new _ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return subMachine;
      },
      getSubMachine: (machineId) => {
        return this.subMachines.get(machineId);
      },
      // GraphQL methods
      graphql: {
        query: async (query, variables) => {
          console.log("GraphQL Query:", query, variables);
          return { data: { query: "mock-data" } };
        },
        mutation: async (mutation, variables) => {
          console.log("GraphQL Mutation:", mutation, variables);
          return { data: { mutation: "mock-result" } };
        },
        subscription: async (subscription, variables) => {
          console.log("GraphQL Subscription:", subscription, variables);
          return { data: { subscription: "mock-stream" } };
        }
      }
    };
  }
  // React hook for using the machine (pass machine definition; @xstate/react v5/v6 expects machine, not service)
  useViewStateMachine(initialModel) {
    const [state, send] = useMachine(this.machineDefinition);
    const [context, setContext] = useState(null);
    useEffect(() => {
      let cancelled = false;
      const stateKey = typeof state.value === "string" ? state.value : state.value?.toString?.() ?? String(state.value);
      const effectiveStorage = {
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
      return () => {
        cancelled = true;
      };
    }, [state.value]);
    const stableContext = context ?? this.createStateContext(state, initialModel, send, void 0, [], void 0);
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
    if (this.machine && typeof this.machine.on === "function") {
      this.machine.on(eventType, handler);
    }
  }
  // Direct send method for TomeConnector
  send(event) {
    if (this.machine && typeof this.machine.send === "function") {
      this.machine.send(event);
    } else {
      console.warn("Machine not started or send method not available");
    }
  }
  // Start the machine service
  start() {
    if (this.machine && typeof this.machine.start === "function") {
      this.machine.start();
    }
  }
  // Get current state
  getState() {
    if (this.machine && typeof this.machine.getSnapshot === "function") {
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
      if (i !== -1) this.viewKeyListeners.splice(i, 1);
    };
  }
  /** Subscribes to state snapshot updates (XState); returns unsubscribe. Used by evented mod loader etc. */
  subscribe(callback) {
    if (!this.machine || typeof this.machine.subscribe !== "function") {
      return () => {
      };
    }
    const sub = this.machine.subscribe(callback);
    return typeof sub?.unsubscribe === "function" ? sub.unsubscribe.bind(sub) : () => {
    };
  }
  notifyViewKeyListeners() {
    const key = this.getRenderKey();
    this.viewKeyListeners.forEach((cb) => cb(key));
  }
  /** Stops the machine service. */
  stop() {
    if (this.machine && typeof this.machine.stop === "function") {
      this.machine.stop();
    }
  }
  async executeServerState(stateName, model) {
    const handler = this.serverStateHandlers.get(stateName);
    if (handler) {
      const context = this.createServerStateContext(model);
      await handler(context);
      return context.renderedHtml || "";
    }
    return "";
  }
  createServerStateContext(model) {
    return {
      state: this.machine.initialState.value,
      model,
      transitions: [],
      log: async (message, metadata) => {
        const entry = {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          level: "INFO",
          message,
          metadata
        };
        this.logEntries.push(entry);
      },
      renderHtml: (html) => {
        return html;
      },
      clear: () => {
      },
      transition: (to) => {
      },
      send: (event) => {
      },
      on: (eventName, handler) => {
      },
      subMachine: (machineId, config) => {
        const subMachine = new _ViewStateMachine(config);
        this.subMachines.set(machineId, subMachine);
        return subMachine;
      },
      getSubMachine: (machineId) => {
        return this.subMachines.get(machineId);
      },
      graphql: {
        query: async (query, variables) => {
          return {};
        },
        mutation: async (mutation, variables) => {
          return {};
        },
        subscription: async (subscription, variables) => {
          return {};
        }
      },
      renderedHtml: ""
    };
  }
  // Compose with other ViewStateMachines
  compose(otherView) {
    otherView.stateHandlers.forEach((handler, stateName) => {
      this.stateHandlers.set(stateName, handler);
    });
    this.viewStack = [...this.viewStack, ...otherView.viewStack];
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
  /** Returns the inner view content (viewStack + subMachines) for container adapter wrapping. */
  getRenderContent(model) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      this.viewStack.map((view, index) => /* @__PURE__ */ jsx("div", { className: "view-container", children: view }, index)),
      Array.from(this.subMachines.entries()).map(([id, subMachine]) => /* @__PURE__ */ jsx("div", { className: "sub-machine-container", children: subMachine.render(model) }, id))
    ] });
  }
  // Render the composed view (delegates to ViewStateMachineRenderer when context available)
  render(model) {
    return /* @__PURE__ */ jsx(ViewStateMachineRenderer, { viewMachine: this, model });
  }
};
function ViewStateMachineRenderer({ viewMachine, model }) {
  const adapter = useContainerAdapter();
  const useOverride = adapter.incrementContainerOverride();
  const showHeader = adapter.claimHeaderInjection() && adapter.headerFragment;
  const showFooter = adapter.claimFooterInjection() && adapter.footerFragment;
  const containerTag = useOverride && adapter.containerOverrideTag ? parseContainerOverrideTag(adapter.containerOverrideTag) : "div";
  const viewContent = viewMachine.getRenderContent(model);
  const containerClassName = useOverride && adapter.containerOverrideClasses != null ? adapter.containerOverrideClasses : "composed-view";
  const isDev = typeof globalThis.process !== "undefined" && globalThis.process?.env?.NODE_ENV === "development";
  if (isDev && useOverride && adapter.containerOverrideClasses != null) {
    console.info(
      "[ContainerAdapter] Replaced container classes",
      { from: "composed-view", to: adapter.containerOverrideClasses, tomeId: adapter.tomeId }
    );
  }
  const containerProps = { className: containerClassName };
  const container = React.createElement(containerTag, containerProps, viewContent);
  const renderFragment = (frag) => {
    if (frag == null) return null;
    if (typeof frag === "string") {
      return /* @__PURE__ */ jsx("div", { className: "container-adapter-fragment", dangerouslySetInnerHTML: { __html: frag } });
    }
    return /* @__PURE__ */ jsx(Fragment, { children: frag });
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    showHeader && renderFragment(adapter.headerFragment),
    container,
    showFooter && renderFragment(adapter.footerFragment)
  ] });
}
var ProxyMachine = class {
  constructor(robotCopy) {
    this.robotCopy = robotCopy;
  }
  async send(event) {
    await this.robotCopy.sendMessage(event);
  }
};
var ProxyRobotCopyStateMachine = class extends ViewStateMachine {
  constructor(config) {
    super(config);
    this.proxyIncomingMessageHandlers = /* @__PURE__ */ new Map();
    this.proxyRobotCopy = config.robotCopy;
    this.proxyMachine = new ProxyMachine(this.proxyRobotCopy);
    if (config.incomingMessageHandlers) {
      Object.entries(config.incomingMessageHandlers).forEach(([eventType, handler]) => {
        this.proxyIncomingMessageHandlers.set(eventType, handler);
      });
    }
    this.setupIncomingMessageHandling();
  }
  setupIncomingMessageHandling() {
    this.proxyRobotCopy.onResponse("default", (response) => {
      const { type, payload } = response;
      const handler = this.proxyIncomingMessageHandlers.get(type);
      if (handler) {
        handler(payload);
      } else {
        console.log("No handler found for incoming message type:", type);
      }
    });
  }
  async send(event) {
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
    throw new Error("ProxyStateMachine does not support rendering");
  }
  useViewStateMachine(initialModel) {
    throw new Error("ProxyStateMachine does not support useViewStateMachine");
    return {};
  }
  compose(otherView) {
    throw new Error("ProxyStateMachine does not support compose");
  }
  synchronizeWithTome(tomeConfig) {
    throw new Error("ProxyStateMachine does not support synchronizeWithTome");
  }
  withState(stateName, handler, _config) {
    this.registerIncomingHandler(stateName, handler);
    return this;
  }
};
function createProxyRobotCopyStateMachine(config) {
  return new ProxyRobotCopyStateMachine(config);
}
function createViewStateMachine(config) {
  return new ViewStateMachine(config);
}

// src/core/tracing/Tracing.ts
var Tracing = class {
  constructor() {
    this.messageHistory = /* @__PURE__ */ new Map();
    this.traceMap = /* @__PURE__ */ new Map();
  }
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  generateSpanId() {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  trackMessage(messageId, traceId, spanId, metadata) {
    const message = {
      messageId,
      traceId,
      spanId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      backend: metadata.backend || "node",
      action: metadata.action || "unknown",
      data: metadata.data
    };
    this.messageHistory.set(messageId, message);
    if (!this.traceMap.has(traceId)) {
      this.traceMap.set(traceId, []);
    }
    this.traceMap.get(traceId).push(messageId);
    return message;
  }
  getMessage(messageId) {
    return this.messageHistory.get(messageId);
  }
  getTraceMessages(traceId) {
    const messageIds = this.traceMap.get(traceId) || [];
    return messageIds.map((id) => this.messageHistory.get(id)).filter(Boolean);
  }
  getFullTrace(traceId) {
    const messages = this.getTraceMessages(traceId);
    return {
      traceId,
      messages,
      startTime: messages[0]?.timestamp,
      endTime: messages[messages.length - 1]?.timestamp,
      backend: messages[0]?.backend
    };
  }
  getMessageHistory() {
    return Array.from(this.messageHistory.values());
  }
  getTraceIds() {
    return Array.from(this.traceMap.keys());
  }
  clearHistory() {
    this.messageHistory.clear();
    this.traceMap.clear();
  }
  // Create tracing headers for HTTP requests
  createTracingHeaders(traceId, spanId, messageId, enableDataDog = false) {
    const headers = {
      "x-trace-id": traceId,
      "x-span-id": spanId,
      "x-message-id": messageId
    };
    if (enableDataDog) {
      headers["x-datadog-trace-id"] = traceId;
      headers["x-datadog-parent-id"] = spanId;
      headers["x-datadog-sampling-priority"] = "1";
    }
    return headers;
  }
};
function createTracing() {
  return new Tracing();
}

// src/core/Cave/tome/TomeConnector.ts
var TomeConnector = class {
  constructor(robotCopy) {
    this.connections = /* @__PURE__ */ new Map();
    this.robotCopy = robotCopy;
  }
  // Connect two Tomes with bidirectional state and event flow
  connect(sourceTome, targetTome, config = {}) {
    const connectionId = `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection = {
      id: connectionId,
      sourceTome,
      targetTome,
      eventMapping: new Map(Object.entries(config.eventMapping || {})),
      stateMapping: new Map(Object.entries(config.stateMapping || {})),
      bidirectional: config.bidirectional ?? true,
      filters: config.filters,
      transformers: config.transformers
    };
    this.connections.set(connectionId, connection);
    this.setupConnection(connection);
    console.log(`Connected Tomes: ${sourceTome.constructor.name} <-> ${targetTome.constructor.name}`);
    return connectionId;
  }
  setupConnection(connection) {
    const { sourceTome, targetTome, eventMapping, stateMapping, bidirectional, filters, transformers } = connection;
    this.setupEventForwarding(sourceTome, targetTome, eventMapping, "forward", filters, transformers);
    if (bidirectional) {
      this.setupEventForwarding(targetTome, sourceTome, this.reverseMap(eventMapping), "backward", filters, transformers);
    }
    this.setupStateForwarding(sourceTome, targetTome, stateMapping, "forward", filters, transformers);
    if (bidirectional) {
      this.setupStateForwarding(targetTome, sourceTome, this.reverseMap(stateMapping), "backward", filters, transformers);
    }
  }
  setupEventForwarding(sourceTome, targetTome, eventMapping, direction, filters, transformers) {
    sourceTome.on("event", (event) => {
      if (filters?.events && !filters.events.includes(event.type)) {
        return;
      }
      let transformedEvent = event;
      if (transformers?.eventTransformer) {
        transformedEvent = transformers.eventTransformer(event, direction);
      }
      const mappedEventType = eventMapping.get(transformedEvent.type) || transformedEvent.type;
      targetTome.send({
        type: mappedEventType,
        ...transformedEvent,
        _forwarded: true,
        _direction: direction,
        _source: sourceTome.constructor.name
      });
    });
  }
  setupStateForwarding(sourceTome, targetTome, stateMapping, direction, filters, transformers) {
    sourceTome.on("stateChange", (newState, oldState) => {
      if (filters?.states) {
        const hasRelevantState = filters.states.some(
          (statePath) => this.getStateValue(newState, statePath) !== this.getStateValue(oldState, statePath)
        );
        if (!hasRelevantState) {
          return;
        }
      }
      let transformedState = newState;
      if (transformers?.stateTransformer) {
        transformedState = transformers.stateTransformer(newState, direction);
      }
      const stateUpdates = {};
      stateMapping.forEach((targetPath, sourcePath) => {
        const sourceValue = this.getStateValue(transformedState, sourcePath);
        if (sourceValue !== void 0) {
          stateUpdates[targetPath] = sourceValue;
        }
      });
      if (Object.keys(stateUpdates).length > 0) {
        targetTome.send({
          type: "SYNC_STATE",
          updates: stateUpdates,
          _forwarded: true,
          _direction: direction,
          _source: sourceTome.constructor.name
        });
      }
    });
  }
  getStateValue(state, path) {
    return path.split(".").reduce((obj, key) => obj?.[key], state);
  }
  reverseMap(map) {
    const reversed = /* @__PURE__ */ new Map();
    map.forEach((value, key) => {
      reversed.set(value, key);
    });
    return reversed;
  }
  // Disconnect Tomes
  disconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }
    this.connections.delete(connectionId);
    console.log(`Disconnected Tomes: ${connection.sourceTome.constructor.name} <-> ${connection.targetTome.constructor.name}`);
    return true;
  }
  // Get all connections
  getConnections() {
    return Array.from(this.connections.values());
  }
  // Get connections for a specific Tome
  getConnectionsForTome(tome) {
    return this.getConnections().filter(
      (conn) => conn.sourceTome === tome || conn.targetTome === tome
    );
  }
  // Create a network of connected Tomes
  createNetwork(tomes, config = {}) {
    const connectionIds = [];
    for (let i = 0; i < tomes.length - 1; i++) {
      const connectionId = this.connect(tomes[i], tomes[i + 1], config);
      connectionIds.push(connectionId);
    }
    if (tomes.length > 2) {
      const ringConnectionId = this.connect(tomes[tomes.length - 1], tomes[0], config);
      connectionIds.push(ringConnectionId);
    }
    return connectionIds;
  }
  // Create a hub-and-spoke network
  createHubNetwork(hubTome, spokeTomes, config = {}) {
    const connectionIds = [];
    spokeTomes.forEach((spokeTome) => {
      const connectionId = this.connect(hubTome, spokeTome, config);
      connectionIds.push(connectionId);
    });
    return connectionIds;
  }
  // Broadcast event to all connected Tomes
  broadcastEvent(event, sourceTome) {
    const connections = this.getConnectionsForTome(sourceTome);
    connections.forEach((connection) => {
      const targetTome = connection.targetTome === sourceTome ? connection.sourceTome : connection.targetTome;
      targetTome.send({
        ...event,
        _broadcasted: true,
        _source: sourceTome.constructor.name
      });
    });
  }
  // Get network topology
  getNetworkTopology() {
    const topology = {
      nodes: /* @__PURE__ */ new Set(),
      edges: []
    };
    this.getConnections().forEach((connection) => {
      topology.nodes.add(connection.sourceTome.constructor.name);
      topology.nodes.add(connection.targetTome.constructor.name);
      topology.edges.push({
        from: connection.sourceTome.constructor.name,
        to: connection.targetTome.constructor.name,
        bidirectional: connection.bidirectional,
        id: connection.id
      });
    });
    return {
      nodes: Array.from(topology.nodes),
      edges: topology.edges
    };
  }
  // Validate network for potential issues (Turing completeness risks)
  validateNetwork() {
    const warnings = [];
    const errors = [];
    const topology = this.getNetworkTopology();
    const visited = /* @__PURE__ */ new Set();
    const recursionStack = /* @__PURE__ */ new Set();
    const hasCycle = (node, parent) => {
      if (recursionStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }
      visited.add(node);
      recursionStack.add(node);
      const edges = topology.edges.filter(
        (edge) => edge.from === node || edge.bidirectional && edge.to === node
      );
      for (const edge of edges) {
        const nextNode = edge.from === node ? edge.to : edge.from;
        if (nextNode !== parent && hasCycle(nextNode, node)) {
          return true;
        }
      }
      recursionStack.delete(node);
      return false;
    };
    topology.nodes.forEach((node) => {
      if (hasCycle(node)) {
        errors.push(`Circular dependency detected involving node: ${node}`);
      }
    });
    const fanOutCounts = /* @__PURE__ */ new Map();
    topology.edges.forEach((edge) => {
      fanOutCounts.set(edge.from, (fanOutCounts.get(edge.from) || 0) + 1);
      if (edge.bidirectional) {
        fanOutCounts.set(edge.to, (fanOutCounts.get(edge.to) || 0) + 1);
      }
    });
    fanOutCounts.forEach((count, node) => {
      if (count > 10) {
        warnings.push(`High fan-out detected for node ${node}: ${count} connections`);
      }
    });
    const eventCounts = /* @__PURE__ */ new Map();
    this.getConnections().forEach((connection) => {
      connection.eventMapping.forEach((targetEvent, sourceEvent) => {
        const key = `${sourceEvent}->${targetEvent}`;
        eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
      });
    });
    eventCounts.forEach((count, eventPair) => {
      if (count > 5) {
        warnings.push(`Potential event amplification detected: ${eventPair} appears ${count} times`);
      }
    });
    return { warnings, errors };
  }
};
function createTomeConnector(robotCopy) {
  return new TomeConnector(robotCopy);
}

// src/core/messaging/MessageToken.ts
function getCrypto() {
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      const crypto2 = __require("crypto");
      return {
        hashSync(data) {
          return crypto2.createHash("sha256").update(data, "utf8").digest("hex");
        }
      };
    } catch {
    }
  }
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return {
      hashSync(_data) {
        throw new Error("MessageToken: sync hash not available in this environment; use generateTokenAsync");
      },
      async hashAsync(data) {
        const buf = new TextEncoder().encode(data);
        const digest = await crypto.subtle.digest("SHA-256", buf);
        return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    };
  }
  throw new Error("MessageToken: no crypto available (need Node crypto or Web Crypto API)");
}
var cryptoImpl = getCrypto();
function computeHash(salt, channelId, payloadSummary, secret) {
  const data = salt + channelId + payloadSummary + secret;
  return cryptoImpl.hashSync(data);
}
async function computeHashAsync(salt, channelId, payloadSummary, secret) {
  if (cryptoImpl.hashAsync) {
    const data = salt + channelId + payloadSummary + secret;
    return cryptoImpl.hashAsync(data);
  }
  return computeHash(salt, channelId, payloadSummary, secret);
}
function randomSalt() {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else if (typeof __require !== "undefined") {
    try {
      const nodeCrypto = __require("crypto");
      nodeCrypto.randomFillSync(bytes);
    } catch {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateToken(options) {
  const salt = randomSalt();
  const hash = computeHash(salt, options.channelId, options.payloadSummary, options.secret);
  const expiresAt = options.ttlMs != null ? Date.now() + options.ttlMs : void 0;
  return {
    salt,
    hash,
    originId: options.originId,
    caveId: options.caveId,
    tomeId: options.tomeId,
    expiresAt
  };
}
async function generateTokenAsync(options) {
  const salt = randomSalt();
  const hash = await computeHashAsync(salt, options.channelId, options.payloadSummary, options.secret);
  const expiresAt = options.ttlMs != null ? Date.now() + options.ttlMs : void 0;
  return {
    salt,
    hash,
    originId: options.originId,
    caveId: options.caveId,
    tomeId: options.tomeId,
    expiresAt
  };
}
function validateToken(options) {
  const { token, channelId, payloadSummary, secret, checkExpiry = true } = options;
  if (!token?.salt || !token?.hash) return false;
  if (checkExpiry && token.expiresAt != null && Date.now() > token.expiresAt) return false;
  const expected = computeHash(token.salt, channelId, payloadSummary, secret);
  return expected === token.hash;
}
function serializeToken(token) {
  const json = JSON.stringify(token);
  if (typeof Buffer !== "undefined") return Buffer.from(json, "utf8").toString("base64");
  return btoa(unescape(encodeURIComponent(json)));
}
function parseToken(serialized) {
  try {
    let json;
    if (typeof Buffer !== "undefined") {
      json = Buffer.from(serialized, "base64").toString("utf8");
    } else {
      json = decodeURIComponent(escape(atob(serialized)));
    }
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// src/core/resilience/CircuitBreaker.ts
var CircuitBreaker = class {
  constructor(options = {}) {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastOpenAt = 0;
    this.name = options.name ?? "default";
    this.threshold = options.threshold ?? 5;
    this.resetMs = options.resetMs ?? 3e4;
    this.monitor = options.monitor;
    this.useMonitorForThreshold = options.useMonitorForThreshold ?? false;
  }
  getState() {
    if (this.state === "open" && Date.now() - this.lastOpenAt >= this.resetMs) {
      this.state = "halfOpen";
      this.successCount = 0;
      this.failureCount = 0;
    }
    return this.state;
  }
  /** Record success (e.g. after a successful request). */
  recordSuccess() {
    if (this.monitor) this.monitor.trackCircuit(this.name, "closed");
    if (this.state === "halfOpen") {
      this.successCount++;
      if (this.successCount >= 1) {
        this.state = "closed";
        this.failureCount = 0;
      }
    } else if (this.state === "closed") {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }
  /** Record failure (e.g. after a failed request). */
  recordFailure() {
    if (this.state === "closed") {
      let overThreshold = false;
      if (this.useMonitorForThreshold && this.monitor) {
        const snap = this.monitor.getSnapshot();
        const rate = snap.requestCount > 0 ? snap.errorCount / snap.requestCount : 0;
        overThreshold = snap.errorCount >= this.threshold || rate >= this.threshold / 10;
      } else {
        this.failureCount++;
        overThreshold = this.failureCount >= this.threshold;
      }
      if (overThreshold) {
        this.state = "open";
        this.lastOpenAt = Date.now();
        if (this.monitor) this.monitor.trackCircuit(this.name, "open");
      }
    } else if (this.state === "halfOpen") {
      this.state = "open";
      this.lastOpenAt = Date.now();
      if (this.monitor) this.monitor.trackCircuit(this.name, "open");
    }
  }
  /** Returns true if the request is allowed (closed or halfOpen). */
  allowRequest() {
    const s = this.getState();
    if (s === "open") return false;
    if (s === "halfOpen" && this.monitor) this.monitor.trackCircuit(this.name, "halfOpen");
    return true;
  }
  /** Execute fn through the circuit; on throw or non-ok result, recordFailure; else recordSuccess. */
  async execute(fn) {
    if (!this.allowRequest()) {
      throw new Error(`CircuitBreaker ${this.name} is open`);
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (e) {
      this.recordFailure();
      throw e;
    }
  }
};
function createCircuitBreaker(options) {
  return new CircuitBreaker(options);
}

// src/core/resilience/ThrottlePolicy.ts
var ThrottlePolicy = class {
  constructor(options) {
    this.slots = [];
    this.config = options.config;
    this.monitor = options.monitor;
    this.windowMs = options.config.windowMs ?? 6e4;
  }
  /** Record one request (and optional bytes). Call this when a request is about to be processed or was processed. */
  record(bytesIn = 0, bytesOut = 0) {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.slots = this.slots.filter((s) => s.at >= cutoff);
    this.slots.push({ requests: 1, bytes: bytesIn + bytesOut, at: now });
  }
  /** Returns true if over limit (should throttle / 429). */
  isOverLimit() {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const inWindow = this.slots.filter((s) => s.at >= cutoff);
    const requests = inWindow.reduce((a, s) => a + s.requests, 0);
    const bytes = inWindow.reduce((a, s) => a + s.bytes, 0);
    if (this.config.maxRequestsPerMinute != null && requests >= this.config.maxRequestsPerMinute) return true;
    if (this.config.maxBytesPerMinute != null && bytes >= this.config.maxBytesPerMinute) return true;
    if (this.monitor) {
      const snap = this.monitor.getSnapshot();
      if (this.config.maxRequestsPerMinute != null && snap.requestCount >= this.config.maxRequestsPerMinute) return true;
      if (this.config.maxBytesPerMinute != null && snap.bytesIn + snap.bytesOut >= this.config.maxBytesPerMinute) return true;
    }
    return false;
  }
};
function createThrottlePolicy(options) {
  return new ThrottlePolicy(options);
}

// src/core/Cave/tome/viewstatemachine/robotcopy/RobotCopy.ts
var RobotCopy = class {
  constructor(config = {}) {
    this.unleashToggles = /* @__PURE__ */ new Map();
    this.circuitBreaker = null;
    this.throttlePolicy = null;
    // --- Location (local vs remote) for machines/tomes ---
    this.locationRegistry = /* @__PURE__ */ new Map();
    this.config = {
      unleashUrl: "http://localhost:4242/api",
      unleashClientKey: "default:development.unleash-insecure-api-token",
      unleashAppName: "log-view-machine",
      unleashEnvironment: "development",
      kotlinBackendUrl: "http://localhost:8080",
      nodeBackendUrl: "http://localhost:3001",
      enableTracing: true,
      enableDataDog: true,
      apiBasePath: "/api",
      ...config
    };
    this.tracing = createTracing();
    this.initializeUnleashToggles();
    if (this.config.circuitBreaker) {
      const cb = this.config.circuitBreaker;
      this.circuitBreaker = createCircuitBreaker({
        name: cb.name ?? "robotcopy",
        threshold: cb.threshold,
        resetMs: cb.resetMs,
        monitor: this.config.resourceMonitor
      });
    }
    if (this.config.throttle) {
      const t = this.config.throttle;
      this.throttlePolicy = "record" in t && "isOverLimit" in t ? t : createThrottlePolicy({ config: t, monitor: this.config.resourceMonitor });
    }
  }
  async initializeUnleashToggles() {
    if (this.config.initialToggles && Object.keys(this.config.initialToggles).length > 0) {
      for (const [name, value] of Object.entries(this.config.initialToggles)) {
        this.unleashToggles.set(name, value);
      }
    }
    this.unleashToggles.set("enable-tracing", true);
    this.unleashToggles.set("enable-datadog", true);
  }
  async isEnabled(toggleName, _context = {}) {
    return this.unleashToggles.get(toggleName) || false;
  }
  async getBackendUrl() {
    const toggleName = this.config.backendSelectorToggle;
    if (!toggleName) {
      return this.config.nodeBackendUrl;
    }
    const useKotlin = await this.isEnabled(toggleName);
    return useKotlin ? this.config.kotlinBackendUrl : this.config.nodeBackendUrl;
  }
  async getBackendType() {
    const toggleName = this.config.backendSelectorToggle;
    if (!toggleName) {
      return "node";
    }
    const useKotlin = await this.isEnabled(toggleName);
    return useKotlin ? "kotlin" : "node";
  }
  generateMessageId() {
    return this.tracing.generateMessageId();
  }
  generateTraceId() {
    return this.tracing.generateTraceId();
  }
  generateSpanId() {
    return this.tracing.generateSpanId();
  }
  trackMessage(messageId, traceId, spanId, metadata) {
    return this.tracing.trackMessage(messageId, traceId, spanId, metadata);
  }
  getMessage(messageId) {
    return this.tracing.getMessage(messageId);
  }
  getTraceMessages(traceId) {
    return this.tracing.getTraceMessages(traceId);
  }
  getFullTrace(traceId) {
    return this.tracing.getFullTrace(traceId);
  }
  async sendMessage(action, data = {}) {
    if (this.throttlePolicy?.isOverLimit()) {
      const err = new Error("Throttle limit exceeded; try again later");
      err.code = "THROTTLED";
      throw err;
    }
    if (this.circuitBreaker && !this.circuitBreaker.allowRequest()) {
      const err = new Error("Circuit breaker is open");
      err.code = "CIRCUIT_OPEN";
      throw err;
    }
    if (this.config.transport) {
      return this.config.transport.send(action, data);
    }
    const doOne = async () => {
      const messageId = this.generateMessageId();
      const traceId = this.generateTraceId();
      const spanId = this.generateSpanId();
      const backend = await this.getBackendType();
      const backendUrl = await this.getBackendUrl();
      this.trackMessage(messageId, traceId, spanId, { backend, action, data });
      const headers = {
        "Content-Type": "application/json",
        ...this.tracing.createTracingHeaders(traceId, spanId, messageId, await this.isEnabled("enable-datadog"))
      };
      const bodyPayload = { ...data, messageId, traceId, spanId };
      if (this.config.messageTokenProvider) {
        try {
          const token = await Promise.resolve(this.config.messageTokenProvider());
          if (token) {
            headers["X-Cave-Message-Token"] = serializeToken(token);
            bodyPayload._messageToken = token;
          }
        } catch (_) {
        }
      }
      const basePath = (this.config.apiBasePath ?? "/api").replace(/\/$/, "");
      const url = `${backendUrl}${basePath}/${action}`;
      const bodyStr = JSON.stringify(bodyPayload);
      const start = Date.now();
      const response = await fetch(url, { method: "POST", headers, body: bodyStr });
      const latencyMs = Date.now() - start;
      const bytesIn = bodyStr.length;
      const responseText = await response.text();
      const bytesOut = new TextEncoder().encode(responseText).length;
      if (this.config.resourceMonitor) {
        this.config.resourceMonitor.trackRequest({
          path: basePath + "/" + action,
          method: "POST",
          bytesIn,
          bytesOut,
          latencyMs,
          status: response.status
        });
      }
      if (this.throttlePolicy) this.throttlePolicy.record(bytesIn, bytesOut);
      if (!response.ok) {
        if (this.circuitBreaker) this.circuitBreaker.recordFailure();
        const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
        this.trackMessage(`${messageId}_error`, traceId, spanId, { backend, action: `${action}_error`, data: { error: err.message } });
        throw err;
      }
      if (this.circuitBreaker) this.circuitBreaker.recordSuccess();
      let result;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = {};
      }
      this.trackMessage(`${messageId}_response`, traceId, spanId, { backend, action: `${action}_response`, data: result });
      return result;
    };
    const maxRetries = this.config.retryPolicy?.maxRetries ?? 0;
    const initialDelayMs = this.config.retryPolicy?.initialDelayMs ?? 1e3;
    const maxDelayMs = this.config.retryPolicy?.maxDelayMs ?? 3e4;
    const multiplier = this.config.retryPolicy?.multiplier ?? 2;
    const jitter = this.config.retryPolicy?.jitter ?? true;
    const isRetryable = (e) => {
      const msg = e?.message ?? String(e);
      if (msg.includes("HTTP 5") || msg.includes("fetch")) return true;
      return false;
    };
    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(async () => {
        let lastErr2;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await doOne();
          } catch (e) {
            lastErr2 = e;
            if (attempt < maxRetries && isRetryable(e)) {
              let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
              if (jitter) delay *= 0.5 + Math.random() * 0.5;
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            throw e;
          }
        }
        throw lastErr2;
      });
    }
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await doOne();
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries && isRetryable(e)) {
          let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
          if (jitter) delay *= 0.5 + Math.random() * 0.5;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw e;
      }
    }
    throw lastErr;
  }
  async getTrace(traceId) {
    const backendUrl = await this.getBackendUrl();
    try {
      const response = await fetch(`${backendUrl}/api/trace/${traceId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to get trace ${traceId}:`, error);
      return this.getFullTrace(traceId);
    }
  }
  async getMessageFromBackend(messageId) {
    const backendUrl = await this.getBackendUrl();
    try {
      const response = await fetch(`${backendUrl}/api/message/${messageId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to get message ${messageId}:`, error);
      return this.getMessage(messageId);
    }
  }
  // Debugging and monitoring methods
  getMessageHistory() {
    return this.tracing.getMessageHistory();
  }
  getTraceIds() {
    return this.tracing.getTraceIds();
  }
  clearHistory() {
    this.tracing.clearHistory();
  }
  // Configuration methods
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
  getConfig() {
    return { ...this.config };
  }
  // Response handling
  onResponse(channel, _handler) {
    console.log(`Registered response handler for channel: ${channel}`);
  }
  // Machine registration for state machines
  registerMachine(name, machine, config = {}) {
    console.log(`Registering machine: ${name}`, { config });
    if (!this.machines) {
      this.machines = /* @__PURE__ */ new Map();
    }
    this.machines.set(name, { machine, config, registeredAt: (/* @__PURE__ */ new Date()).toISOString() });
    const loc = config.location;
    const client = config.remoteClient;
    if (loc !== void 0 || client !== void 0) {
      this.registerMachineLocation(name, { location: loc, remoteClient: client });
    }
  }
  // Get registered machines
  getRegisteredMachines() {
    return this.machines || /* @__PURE__ */ new Map();
  }
  // Get a specific registered machine
  getRegisteredMachine(name) {
    return this.machines?.get(name);
  }
  /**
   * Set or override location for a machine or tome.
   * When local is true, the runner activates local VSM; when false, sends via client (e.g. HTTP) instead.
   */
  setLocation(machineIdOrTomeId, opts) {
    this.locationRegistry.set(machineIdOrTomeId, { local: opts.local, client: opts.client });
  }
  /**
   * Get location for a machine or tome. Returns undefined if not set (caller may treat as local).
   */
  getLocation(machineIdOrTomeId) {
    return this.locationRegistry.get(machineIdOrTomeId);
  }
  /**
   * Register default location from TomeMachineConfig (location / remoteClient).
   * Converts location hint to local/remote; can be overridden later by setLocation.
   */
  registerMachineLocation(machineIdOrTomeId, defaultFromConfig) {
    if (!defaultFromConfig) return;
    const { location, remoteClient } = defaultFromConfig;
    const local = location === "remote" ? false : true;
    const client = remoteClient ?? (typeof location === "string" && location !== "local" && location !== "same-cave" ? location : void 0);
    if (!this.locationRegistry.has(machineIdOrTomeId)) {
      this.locationRegistry.set(machineIdOrTomeId, { local, client });
    }
  }
  /**
   * Answer whether the given machine/tome is local (run here) or remote (send via client).
   * Defaults to true (local) when no location is registered.
   */
  isLocal(machineIdOrTomeId) {
    const entry = this.locationRegistry.get(machineIdOrTomeId);
    return entry === void 0 ? true : entry.local;
  }
};
function createRobotCopy(config) {
  return new RobotCopy(config);
}

// src/core/adapters/ClientGenerator.ts
var ClientGenerator = class {
  constructor() {
    this.machines = /* @__PURE__ */ new Map();
    this.configs = /* @__PURE__ */ new Map();
  }
  // Register a machine for discovery
  registerMachine(machineId, machine, config) {
    this.machines.set(machineId, machine);
    if (config) {
      this.configs.set(machineId, config);
    }
  }
  // Discover all registered machines
  discover() {
    const discovery = {
      machines: /* @__PURE__ */ new Map(),
      states: /* @__PURE__ */ new Map(),
      events: /* @__PURE__ */ new Map(),
      actions: /* @__PURE__ */ new Map(),
      services: /* @__PURE__ */ new Map(),
      examples: [],
      documentation: ""
    };
    this.machines.forEach((machine, machineId) => {
      discovery.machines.set(machineId, machine);
      const config = this.configs.get(machineId);
      if (config) {
        this.analyzeMachine(machine, machineId, discovery);
        if (config.examples) {
          discovery.examples.push(...config.examples);
        }
      }
    });
    discovery.documentation = this.generateDocumentation(discovery);
    return discovery;
  }
  analyzeMachine(machine, machineId, discovery) {
    discovery.states.set(machineId, ["idle", "creating", "success", "error"]);
    discovery.events.set(machineId, ["ADD_INGREDIENT", "CREATE_BURGER", "CONTINUE"]);
    discovery.actions.set(machineId, ["addIngredient", "setLoading", "handleSuccess"]);
    discovery.services.set(machineId, ["createBurgerService"]);
  }
  generateDocumentation(discovery) {
    let doc = "# ViewStateMachine Discovery\n\n";
    discovery.machines.forEach((machine, machineId) => {
      const config = this.configs.get(machineId);
      doc += `## ${machineId}

`;
      if (config?.description) {
        doc += `${config.description}

`;
      }
      const states = discovery.states.get(machineId) || [];
      const events = discovery.events.get(machineId) || [];
      const actions = discovery.actions.get(machineId) || [];
      const services = discovery.services.get(machineId) || [];
      doc += `### States
`;
      states.forEach((state) => {
        doc += `- \`${state}\`
`;
      });
      doc += "\n";
      doc += `### Events
`;
      events.forEach((event) => {
        doc += `- \`${event}\`
`;
      });
      doc += "\n";
      doc += `### Actions
`;
      actions.forEach((action) => {
        doc += `- \`${action}\`
`;
      });
      doc += "\n";
      doc += `### Services
`;
      services.forEach((service) => {
        doc += `- \`${service}\`
`;
      });
      doc += "\n";
    });
    return doc;
  }
  // Generate client code for a specific language
  generateClientCode(language, machineId) {
    const discovery = this.discover();
    switch (language) {
      case "typescript":
        return this.generateTypeScriptClient(discovery, machineId);
      case "javascript":
        return this.generateJavaScriptClient(discovery, machineId);
      case "react":
        return this.generateReactClient(discovery, machineId);
      case "kotlin":
        return this.generateKotlinClient(discovery, machineId);
      case "java":
        return this.generateJavaClient(discovery, machineId);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
  generateTypeScriptClient(discovery, machineId) {
    let code = "// Generated TypeScript client\n\n";
    if (machineId) {
      const machine = discovery.machines.get(machineId);
      if (machine) {
        code += `import { ViewStateMachine } from './ViewStateMachine';

`;
        code += `export class ${machineId}Client {
`;
        code += `  private machine: ViewStateMachine<any>;

`;
        code += `  constructor() {
`;
        code += `    // Initialize machine
`;
        code += `  }

`;
        code += `  // Client methods would be generated here
`;
        code += `}
`;
      }
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `export class ${id}Client {
`;
        code += `  // Generated client for ${id}
`;
        code += `}

`;
      });
    }
    return code;
  }
  generateJavaScriptClient(discovery, machineId) {
    let code = "// Generated JavaScript client\n\n";
    if (machineId) {
      code += `class ${machineId}Client {
`;
      code += `  constructor() {
`;
      code += `    // Initialize client
`;
      code += `  }

`;
      code += `  // Client methods
`;
      code += `}

`;
      code += `module.exports = ${machineId}Client;
`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `class ${id}Client {
`;
        code += `  // Generated client for ${id}
`;
        code += `}

`;
      });
    }
    return code;
  }
  generateReactClient(discovery, machineId) {
    let code = "// Generated React client\n\n";
    code += `import React from 'react';
`;
    code += `import { useViewStateMachine } from './ViewStateMachine';

`;
    if (machineId) {
      code += `export const ${machineId}Component: React.FC = () => {
`;
      code += `  const { state, send, log, view, clear } = useViewStateMachine({
`;
      code += `    // Initial model
`;
      code += `  });

`;
      code += `  return (
`;
      code += `    <div>
`;
      code += `      {/* Generated UI */}
`;
      code += `    </div>
`;
      code += `  );
`;
      code += `};
`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `export const ${id}Component: React.FC = () => {
`;
        code += `  // Generated component for ${id}
`;
        code += `  return <div>${id} Component</div>;
`;
        code += `};

`;
      });
    }
    return code;
  }
  generateKotlinClient(discovery, machineId) {
    let code = "// Generated Kotlin client\n\n";
    if (machineId) {
      code += `class ${machineId}Client {
`;
      code += `  private val machine: ViewStateMachine<*>? = null

`;
      code += `  fun initialize() {
`;
      code += `    // Initialize machine
`;
      code += `  }

`;
      code += `  // Client methods
`;
      code += `}
`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `class ${id}Client {
`;
        code += `  // Generated client for ${id}
`;
        code += `}

`;
      });
    }
    return code;
  }
  generateJavaClient(discovery, machineId) {
    let code = "// Generated Java client\n\n";
    if (machineId) {
      code += `public class ${machineId}Client {
`;
      code += `  private ViewStateMachine machine;

`;
      code += `  public ${machineId}Client() {
`;
      code += `    // Initialize machine
`;
      code += `  }

`;
      code += `  // Client methods
`;
      code += `}
`;
    } else {
      discovery.machines.forEach((machine, id) => {
        code += `public class ${id}Client {
`;
        code += `  // Generated client for ${id}
`;
        code += `}

`;
      });
    }
    return code;
  }
  // Generate integration examples
  generateIntegrationExamples() {
    return [
      {
        name: "Basic Usage",
        description: "How to create and use a ViewStateMachine",
        language: "typescript",
        code: `
const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: { /* config */ }
})
.withState('idle', async ({ log, view }) => {
  await log('Entered idle state');
  return view(<div>Idle UI</div>);
});`
      },
      {
        name: "Sub-Machines",
        description: "How to compose sub-machines",
        language: "typescript",
        code: `
const parentMachine = createViewStateMachine({
  machineId: 'parent',
  xstateConfig: { /* config */ },
  subMachines: {
    child: { machineId: 'child', xstateConfig: { /* config */ } }
  }
})
.withSubMachine('child', childConfig);`
      },
      {
        name: "ClientGenerator Discovery",
        description: "How to use ClientGenerator for automated discovery",
        language: "typescript",
        code: `
const clientGenerator = new ClientGenerator();
clientGenerator.registerMachine('my-machine', machine, {
  description: 'My awesome machine',
  examples: [/* examples */]
});

const discovery = clientGenerator.discover();
const clientCode = clientGenerator.generateClientCode('typescript', 'my-machine');`
      }
    ];
  }
};
function createClientGenerator() {
  return new ClientGenerator();
}

// src/core/adapters/TeleportHQAdapter.ts
import React2 from "react";
var TeleportHQAdapter = class {
  constructor(config) {
    this.templates = /* @__PURE__ */ new Map();
    this.viewStateMachines = /* @__PURE__ */ new Map();
    this.config = config;
  }
  // Load template from TeleportHQ API
  async loadTemplate(templateId) {
    try {
      const response = await fetch(`https://api.teleporthq.io/templates/${templateId}`, {
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.statusText}`);
      }
      const template = await response.json();
      this.templates.set(templateId, template);
      return template;
    } catch (error) {
      console.error("Error loading TeleportHQ template:", error);
      throw error;
    }
  }
  // Convert TeleportHQ template to React components with ViewStateMachine integration
  createViewStateMachineFromTemplate(templateId, initialState = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found. Load it first with loadTemplate().`);
    }
    const config = this.convertTemplateToViewStateMachineConfig(template, initialState);
    const viewStateMachine = new ViewStateMachine(config);
    this.viewStateMachines.set(templateId, viewStateMachine);
    return viewStateMachine;
  }
  convertTemplateToViewStateMachineConfig(template, initialState) {
    const stateVariables = this.extractStateVariables(template);
    const xstateConfig = {
      id: `teleporthq-${template.id}`,
      initial: "idle",
      context: {
        ...initialState,
        templateId: template.id,
        components: template.components,
        variables: template.variables
      },
      states: {
        idle: {
          on: {
            // Dynamic events based on template callbacks
            ...this.createEventsFromCallbacks(template)
          }
        },
        loading: {
          on: {
            LOADED: "idle",
            ERROR: "error"
          }
        },
        error: {
          on: {
            RETRY: "loading"
          }
        }
      }
    };
    const logStates = {
      idle: async ({ state, model, log, view, transition }) => {
        await log("TeleportHQ template rendered", {
          templateId: model.templateId,
          componentCount: model.components.length
        });
        const renderedComponents = this.renderTeleportHQComponents(
          model.components,
          model.variables,
          transition
        );
        view(
          React2.createElement(
            "div",
            { className: "teleporthq-template" },
            React2.createElement("h3", null, `Template: ${template.name}`),
            ...renderedComponents
          )
        );
      }
    };
    return {
      machineId: `teleporthq-${template.id}`,
      xstateConfig,
      logStates
    };
  }
  extractStateVariables(template) {
    const variables = {};
    if (template.variables) {
      Object.entries(template.variables).forEach(([key, value]) => {
        variables[key] = value;
      });
    }
    template.components.forEach((component) => {
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
    template.components.forEach((component) => {
      if (component.callbacks) {
        Object.entries(component.callbacks).forEach(([callbackName, eventType]) => {
          events[eventType] = {
            target: "idle",
            actions: `handle${callbackName.charAt(0).toUpperCase() + callbackName.slice(1)}`
          };
        });
      }
    });
    return events;
  }
  renderTeleportHQComponents(components, variables, transition) {
    return components.map((component) => {
      const Component2 = this.createReactComponentFromTeleportHQ(component, variables, transition);
      return React2.createElement(Component2, { key: component.id });
    });
  }
  createReactComponentFromTeleportHQ(component, variables, transition) {
    const Component2 = (props) => {
      const componentProps = {
        ...component.props,
        ...variables,
        ...props
      };
      const callbackProps = {};
      if (component.callbacks) {
        Object.entries(component.callbacks).forEach(([callbackName, eventType]) => {
          callbackProps[callbackName] = (data) => {
            transition(eventType, data);
          };
        });
      }
      switch (component.name) {
        case "Button":
          return React2.createElement("button", {
            ...componentProps,
            ...callbackProps,
            className: "teleporthq-button"
          }, componentProps.children || componentProps.text);
        case "Input":
          return React2.createElement("input", {
            ...componentProps,
            className: "teleporthq-input"
          });
        case "Container":
          return React2.createElement("div", {
            ...componentProps,
            className: "teleporthq-container"
          }, component.children?.map(
            (child) => this.createReactComponentFromTeleportHQ(child, variables, transition)(props)
          ));
        default:
          return React2.createElement("div", {
            className: `teleporthq-${component.name.toLowerCase()}`
          }, componentProps.children || componentProps.text);
      }
    };
    return Component2;
  }
  // Sync ViewStateMachine state with TeleportHQ
  syncWithTeleportHQ(viewStateMachine, templateId) {
    if (this.config.enableRealTimeSync) {
      this.setupRealTimeSync(viewStateMachine, templateId);
    }
  }
  setupRealTimeSync(viewStateMachine, templateId) {
    console.log(`Setting up real-time sync for template ${templateId}`);
  }
  // Export ViewStateMachine state to TeleportHQ
  async exportToTeleportHQ(templateId, state) {
    try {
      await fetch(`https://api.teleporthq.io/templates/${templateId}/state`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ state })
      });
    } catch (error) {
      console.error("Error exporting state to TeleportHQ:", error);
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
};
function createTeleportHQAdapter(config) {
  return new TeleportHQAdapter(config);
}

// src/core/adapters/index.ts
import {
  ContainerAdapterProvider,
  useContainerAdapter as useContainerAdapter2,
  parseContainerOverrideTag as parseContainerOverrideTag2,
  ContainerAdapterContext,
  useContainerAdapterFragmentsFromApi,
  CONTAINER_ADAPTER_DESCRIPTOR
} from "container-cave-adapter";
var ADAPTER_DESCRIPTORS = [
  {
    id: "client-generator",
    name: "ClientGenerator",
    type: "typescript",
    features: ["discovery", "documentation", "examples"]
  },
  {
    id: "teleport-hq",
    name: "TeleportHQAdapter",
    type: "typescript",
    features: ["template_loading", "component_mapping", "state_sync"]
  },
  {
    id: "container-cave-adapter",
    name: "Container Cave Adapter",
    type: "typescript",
    features: ["header_tracking", "footer_tracking", "container_override", "composed_view_override"],
    usedIn: ["log-view-machine", "StructuralTomeConnector"]
  }
];

// src/core/Cave/tome/TomeManager.ts
import express from "express";
var TomeManager = class {
  constructor(app, options) {
    this.tomes = /* @__PURE__ */ new Map();
    this.app = app;
    this.middlewareRegistry = options?.middlewareRegistry ?? {};
  }
  /**
   * Register a new Tome with the manager
   */
  async registerTome(config) {
    console.log(`\u{1F4DA} Registering Tome: ${config.id}`);
    const machines = /* @__PURE__ */ new Map();
    for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
      const machine = createViewStateMachine({
        machineId: machineConfig.id,
        xstateConfig: machineConfig.xstateConfig,
        context: {
          ...config.context,
          ...machineConfig.context
        }
      });
      machines.set(machineKey, machine);
      console.log(`  \u{1F916} Created machine: ${machineConfig.name} (${machineConfig.id})`);
    }
    let isCaveSynchronized = false;
    const viewKeyListeners = [];
    function getRenderKey() {
      const base = config.renderKey ?? config.id;
      const machineKeys = [];
      machines.forEach((m, key) => {
        if (m && typeof m.getRenderKey === "function") {
          machineKeys.push(m.getRenderKey());
        } else {
          machineKeys.push(key);
        }
      });
      if (machineKeys.length === 0) return base;
      return `${base}:${machineKeys.join(",")}`;
    }
    const tomeInstance = {
      id: config.id,
      config,
      machines,
      context: config.context || {},
      get isCaveSynchronized() {
        return isCaveSynchronized;
      },
      getRenderKey,
      observeViewKey(callback) {
        callback(getRenderKey());
        viewKeyListeners.push(callback);
        return () => {
          const i = viewKeyListeners.indexOf(callback);
          if (i !== -1) viewKeyListeners.splice(i, 1);
        };
      },
      synchronizeWithCave(_cave) {
        isCaveSynchronized = true;
      },
      async start() {
        console.log(`\u{1F680} Starting Tome: ${this.id}`);
        for (const [key, machine] of this.machines) {
          await machine.start();
        }
      },
      async stop() {
        console.log(`\u{1F6D1} Stopping Tome: ${this.id}`);
        for (const [key, machine] of this.machines) {
          await machine.stop();
        }
      },
      getMachine(id) {
        return this.machines.get(id);
      },
      async sendMessage(machineId, event, data) {
        const machine = this.getMachine(machineId);
        if (!machine) {
          throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
        }
        return await machine.send(event, data);
      },
      getState(machineId) {
        const machine = this.getMachine(machineId);
        if (!machine) {
          throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
        }
        return machine.getState();
      },
      updateContext(updates) {
        this.context = { ...this.context, ...updates };
        for (const [key, machine] of this.machines) {
          machine.updateContext(updates);
        }
      }
    };
    if (config.routing) {
      await this.setupTomeRouting(tomeInstance);
    }
    this.tomes.set(config.id, tomeInstance);
    console.log(`\u2705 Tome registered: ${config.id}`);
    return tomeInstance;
  }
  /**
   * Setup routing for a tome
   */
  async setupTomeRouting(tome) {
    const { config } = tome;
    const { routing } = config;
    if (!routing) return;
    console.log(`\u{1F6E3}\uFE0F Setting up routing for Tome: ${config.id}`);
    const router = express.Router();
    if (routing.middleware) {
      for (const name of routing.middleware) {
        const handler = this.middlewareRegistry[name];
        if (handler) {
          router.use(handler);
          console.log(`  \u{1F527} Applied middleware: ${name}`);
        } else {
          console.log(`  \u{1F527} Middleware "${name}" not in registry (add to TomeManagerOptions.middlewareRegistry to apply)`);
        }
      }
    }
    if (routing.routes) {
      for (const [machineKey, routeConfig] of Object.entries(routing.routes)) {
        const machine = tome.getMachine(machineKey);
        if (!machine) {
          console.warn(`\u26A0\uFE0F Machine ${machineKey} not found for routing`);
          continue;
        }
        const method = routeConfig.method || "POST";
        const path = routeConfig.path;
        console.log(`  \u{1F6E3}\uFE0F Route: ${method} ${routing.basePath}${path} -> ${machineKey}`);
        router[method.toLowerCase()](path, async (req, res) => {
          try {
            const { event, data } = req.body;
            if (!event) {
              return res.status(400).json({
                error: "Event is required",
                tome: config.id,
                machine: machineKey
              });
            }
            let transformedData = data;
            if (routeConfig.transformers?.input) {
              transformedData = routeConfig.transformers.input(data, "forward");
            }
            const result = await tome.sendMessage(machineKey, event, transformedData);
            let response = result;
            if (routeConfig.transformers?.output) {
              response = routeConfig.transformers.output(result, "forward");
            }
            res.json({
              success: true,
              tome: config.id,
              machine: machineKey,
              event,
              result: response,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          } catch (error) {
            console.error(`\u274C Error in tome route ${config.id}:${machineKey}:`, error);
            res.status(500).json({
              success: false,
              error: error.message,
              tome: config.id,
              machine: machineKey,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
          }
        });
      }
    }
    const mountPath = routing.basePath || `/api/${config.id}`;
    this.app.use(mountPath, router);
    tome.router = router;
    console.log(`\u2705 Routing setup complete for Tome: ${config.id} at ${mountPath}`);
  }
  /**
   * Unregister a Tome
   */
  async unregisterTome(id) {
    const tome = this.tomes.get(id);
    if (!tome) {
      throw new Error(`Tome ${id} not found`);
    }
    console.log(`\u{1F5D1}\uFE0F Unregistering Tome: ${id}`);
    await tome.stop();
    this.tomes.delete(id);
    console.log(`\u2705 Tome unregistered: ${id}`);
  }
  /**
   * Get a Tome by ID
   */
  getTome(id) {
    return this.tomes.get(id);
  }
  /**
   * Start a Tome
   */
  async startTome(id) {
    const tome = this.getTome(id);
    if (!tome) {
      throw new Error(`Tome ${id} not found`);
    }
    await tome.start();
  }
  /**
   * Stop a Tome
   */
  async stopTome(id) {
    const tome = this.getTome(id);
    if (!tome) {
      throw new Error(`Tome ${id} not found`);
    }
    await tome.stop();
  }
  /**
   * List all registered Tome IDs
   */
  listTomes() {
    return Array.from(this.tomes.keys());
  }
  /**
   * Get status of all tomes
   */
  getTomeStatus() {
    const status = [];
    for (const [id, tome] of this.tomes) {
      const machineStatus = {};
      for (const [machineKey, machine] of tome.machines) {
        machineStatus[machineKey] = {
          state: machine.getState(),
          context: machine.getContext()
        };
      }
      status.push({
        id,
        name: tome.config.name,
        description: tome.config.description,
        version: tome.config.version,
        machines: machineStatus,
        context: tome.context
      });
    }
    return status;
  }
  /**
   * Send message to a specific machine in a tome
   */
  async sendTomeMessage(tomeId, machineId, event, data) {
    const tome = this.getTome(tomeId);
    if (!tome) {
      throw new Error(`Tome ${tomeId} not found`);
    }
    return await tome.sendMessage(machineId, event, data);
  }
  /**
   * Get state of a specific machine in a tome
   */
  getTomeMachineState(tomeId, machineId) {
    const tome = this.getTome(tomeId);
    if (!tome) {
      throw new Error(`Tome ${tomeId} not found`);
    }
    return tome.getState(machineId);
  }
  /**
   * Update context for a tome
   */
  updateTomeContext(tomeId, updates) {
    const tome = this.getTome(tomeId);
    if (!tome) {
      throw new Error(`Tome ${tomeId} not found`);
    }
    tome.updateContext(updates);
  }
};
function createTomeManager(app, options) {
  return new TomeManager(app, options);
}

// src/core/Cave/tome/createTome.ts
function createTome(config) {
  const machines = /* @__PURE__ */ new Map();
  for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
    const machine = createViewStateMachine({
      machineId: machineConfig.id,
      xstateConfig: machineConfig.xstateConfig,
      context: {
        ...config.context || {},
        ...machineConfig.context || {}
      },
      ...machineConfig.logStates && { logStates: machineConfig.logStates }
    });
    machines.set(machineKey, machine);
  }
  let isCaveSynchronized = false;
  let context = { ...config.context || {} };
  const viewKeyListeners = [];
  function getRenderKey() {
    const base = config.renderKey ?? config.id;
    const machineKeys = [];
    machines.forEach((m, key) => {
      if (m && typeof m.getRenderKey === "function") {
        machineKeys.push(m.getRenderKey());
      } else {
        machineKeys.push(key);
      }
    });
    if (machineKeys.length === 0) return base;
    return `${base}:${machineKeys.join(",")}`;
  }
  const tomeInstance = {
    id: config.id,
    config,
    machines,
    get context() {
      return context;
    },
    set context(value) {
      context = value;
    },
    get isCaveSynchronized() {
      return isCaveSynchronized;
    },
    getRenderKey,
    observeViewKey(callback) {
      callback(getRenderKey());
      viewKeyListeners.push(callback);
      return () => {
        const i = viewKeyListeners.indexOf(callback);
        if (i !== -1) viewKeyListeners.splice(i, 1);
      };
    },
    synchronizeWithCave(_cave) {
      isCaveSynchronized = true;
    },
    async start() {
      for (const [, machine] of machines) {
        if (machine && typeof machine.start === "function") {
          await machine.start();
        }
      }
    },
    async stop() {
      for (const [, machine] of machines) {
        if (machine && typeof machine.stop === "function") {
          await machine.stop();
        }
      }
    },
    getMachine(id) {
      return machines.get(id);
    },
    async sendMessage(machineId, event, data) {
      const machine = machines.get(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
      }
      const eventObj = typeof event === "string" ? { type: event, ...data || {} } : event;
      if (typeof machine.send === "function") {
        machine.send(eventObj);
      }
      if (typeof machine.getState === "function") {
        return machine.getState();
      }
      return void 0;
    },
    getState(machineId) {
      const machine = machines.get(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
      }
      return typeof machine.getState === "function" ? machine.getState() : null;
    },
    updateContext(updates) {
      context = { ...context, ...updates };
    }
  };
  return tomeInstance;
}

// src/core/Cave/tome/TomeConfig.ts
function getEnv(name) {
  try {
    return typeof globalThis.process !== "undefined" && globalThis.process.env ? globalThis.process.env[name] : void 0;
  } catch {
    return void 0;
  }
}
function createTomeConfig(config) {
  return {
    id: config.id || "default-tome",
    name: config.name || "Default Tome",
    description: config.description || "A configured tome with routing support",
    version: config.version || "1.0.0",
    renderKey: config.renderKey,
    machines: config.machines || {},
    routing: {
      basePath: config.routing?.basePath || "/api",
      routes: config.routing?.routes || {},
      middleware: config.routing?.middleware || [],
      cors: config.routing?.cors ?? true,
      rateLimit: config.routing?.rateLimit || {
        windowMs: 15 * 60 * 1e3,
        // 15 minutes
        max: 100
        // limit each IP to 100 requests per windowMs
      },
      authentication: config.routing?.authentication || {
        required: false
      }
    },
    context: config.context || {},
    dependencies: config.dependencies || [],
    plugins: config.plugins || [],
    graphql: {
      enabled: config.graphql?.enabled ?? true,
      schema: config.graphql?.schema,
      resolvers: config.graphql?.resolvers || {},
      subscriptions: config.graphql?.subscriptions ?? true
    },
    logging: {
      level: config.logging?.level || "info",
      format: config.logging?.format || "json",
      transports: config.logging?.transports || ["console"]
    },
    persistence: {
      enabled: config.persistence?.enabled ?? false,
      type: config.persistence?.type || "memory",
      config: config.persistence?.config || {}
    },
    monitoring: {
      enabled: config.monitoring?.enabled ?? true,
      metrics: config.monitoring?.metrics || ["requests", "errors", "performance"],
      tracing: config.monitoring?.tracing ?? true,
      healthChecks: config.monitoring?.healthChecks || ["/health"]
    },
    isModableTome: config.isModableTome,
    modMetadata: config.modMetadata,
    permission: config.permission,
    containerAdapter: config.containerAdapter
  };
}
var FishBurgerTomeConfig = createTomeConfig({
  id: "fish-burger-tome",
  name: "Fish Burger System",
  description: "Complete fish burger ordering and cooking system",
  version: "1.0.0",
  machines: {
    orderMachine: {
      id: "order-machine",
      name: "Order Management",
      description: "Handles order creation and management",
      xstateConfig: {
        id: "order-machine",
        initial: "idle",
        states: {
          idle: {
            on: { CREATE_ORDER: "processing" }
          },
          processing: {
            on: { COMPLETE_ORDER: "completed" }
          },
          completed: {
            on: { RESET: "idle" }
          }
        }
      }
    },
    cookingMachine: {
      id: "cooking-machine",
      name: "Cooking System",
      description: "Manages the cooking process",
      xstateConfig: {
        id: "cooking-machine",
        initial: "idle",
        states: {
          idle: {
            on: { START_COOKING: "cooking" }
          },
          cooking: {
            on: { COMPLETE_COOKING: "completed" }
          },
          completed: {
            on: { RESET: "idle" }
          }
        }
      }
    }
  },
  routing: {
    basePath: "/api/fish-burger",
    routes: {
      orderMachine: {
        path: "/orders",
        method: "POST"
      },
      cookingMachine: {
        path: "/cooking",
        method: "POST"
      }
    }
  },
  context: {
    baseUrl: "http://localhost:3000",
    adminKey: getEnv("ADMIN_KEY") || "admin123"
  }
});
var EditorTomeConfig = createTomeConfig({
  id: "editor-tome",
  name: "Component Editor System",
  description: "Visual component editor with real-time preview",
  version: "1.0.0",
  machines: {
    editorMachine: {
      id: "editor-machine",
      name: "Component Editor",
      description: "Main editor interface",
      xstateConfig: {
        id: "editor-machine",
        initial: "idle",
        states: {
          idle: {
            on: { LOAD_COMPONENT: "editing" }
          },
          editing: {
            on: { SAVE: "saving" }
          },
          saving: {
            on: { SAVE_SUCCESS: "editing" }
          }
        }
      }
    },
    previewMachine: {
      id: "preview-machine",
      name: "Preview System",
      description: "Real-time component preview",
      xstateConfig: {
        id: "preview-machine",
        initial: "idle",
        states: {
          idle: {
            on: { UPDATE_PREVIEW: "updating" }
          },
          updating: {
            on: { PREVIEW_READY: "ready" }
          },
          ready: {
            on: { UPDATE_PREVIEW: "updating" }
          }
        }
      }
    }
  },
  routing: {
    basePath: "/api/editor",
    routes: {
      editorMachine: {
        path: "/components",
        method: "POST"
      },
      previewMachine: {
        path: "/preview",
        method: "POST"
      }
    }
  },
  context: {
    editorType: "generic",
    previewMode: "iframe"
  },
  persistence: {
    enabled: true,
    adapter: "duckdb",
    config: {}
  }
});
var LibraryTomeConfig = createTomeConfig({
  id: "library-tome",
  name: "Component Library",
  description: "Component library state and discovery",
  version: "1.0.0",
  machines: {
    libraryMachine: {
      id: "library-machine",
      name: "Library",
      description: "Library state",
      xstateConfig: {
        id: "library-machine",
        initial: "idle",
        states: {
          idle: { on: { OPEN: "browsing" } },
          browsing: { on: { SELECT: "idle", CLOSE: "idle" } }
        }
      }
    }
  },
  routing: {
    basePath: "/api/editor/library",
    routes: {
      libraryMachine: { path: "/", method: "POST" }
    }
  }
});
var CartTomeConfig = createTomeConfig({
  id: "cart-tome",
  name: "Cart",
  description: "Cart state and checkout",
  version: "1.0.0",
  machines: {
    cartMachine: {
      id: "cart-machine",
      name: "Cart",
      description: "Cart state",
      xstateConfig: {
        id: "cart-machine",
        initial: "idle",
        states: {
          idle: { on: { ADD: "active" } },
          active: { on: { CHECKOUT: "idle", CLEAR: "idle" } }
        }
      }
    }
  },
  routing: {
    basePath: "/api/editor/cart",
    routes: {
      cartMachine: { path: "/", method: "POST" }
    }
  }
});
var DonationTomeConfig = createTomeConfig({
  id: "donation-tome",
  name: "Donation",
  description: "Mod author donation and sticky coins",
  version: "1.0.0",
  machines: {
    donationMachine: {
      id: "donation-machine",
      name: "Donation",
      description: "Donation / wallet state",
      xstateConfig: {
        id: "donation-machine",
        initial: "idle",
        states: {
          idle: { on: { CONNECT_WALLET: "connected" } },
          connected: { on: { DONATE: "idle", DISCONNECT: "idle" } }
        }
      }
    }
  },
  routing: {
    basePath: "/api/editor/donation",
    routes: {
      donationMachine: { path: "/", method: "POST" }
    }
  }
});

// src/core/structural/StructuralSystem.tsx
import React3 from "react";
import { assign as assign2 } from "xstate";
var StructuralSystem = class {
  constructor(config) {
    this.machines = /* @__PURE__ */ new Map();
    this.componentCache = /* @__PURE__ */ new Map();
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
      const machineConfig = {
        machineId: tomeConfig.machineId,
        xstateConfig: {
          id: tomeConfig.machineId,
          initial: "idle",
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
          if (found) return found;
        }
      }
      return null;
    };
    return findRouteRecursive(this.config.RoutingConfig.routes, path);
  }
  // Get navigation breadcrumbs for a path
  getBreadcrumbs(path) {
    const breadcrumbs = [];
    const pathParts = path.split("/").filter(Boolean);
    let currentPath = "";
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
  validate() {
    const errors = [];
    for (const [componentName, mapping] of Object.entries(this.config.ComponentTomeMapping)) {
      if (!this.config.TomeConfig.tomes[`${componentName}-tome`]) {
        errors.push(`Component ${componentName} has no corresponding tome configuration`);
      }
    }
    for (const route of this.config.RoutingConfig.routes) {
      if (route.component && !this.config.ComponentTomeMapping[route.component]) {
        errors.push(`Route ${route.path} references unknown component: ${route.component}`);
      }
    }
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
        actions: assign2((context, event2) => ({
          lastEvent: event2.type,
          lastEventPayload: event2.payload
        }))
      };
    }
    return events;
  }
};
function useStructuralSystem(config) {
  const [system] = React3.useState(() => new StructuralSystem(config));
  React3.useEffect(() => {
    const validation = system.validate();
    if (!validation.isValid) {
      console.warn("Structural system validation errors:", validation.errors);
    }
  }, [system]);
  return system;
}
function createStructuralSystem(config) {
  return new StructuralSystem(config);
}

// src/core/structural/StructuralRouter.tsx
import { useState as useState2, useEffect as useEffect2, createContext, useContext } from "react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var RouterContext = createContext(null);
function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a StructuralRouter");
  }
  return context;
}
var StructuralRouter = ({
  config,
  initialRoute = "/",
  onRouteChange,
  children
}) => {
  const [currentRoute, setCurrentRoute] = useState2(initialRoute);
  const [routeHistory, setRouteHistory] = useState2([initialRoute]);
  const [structuralSystem] = useState2(() => new StructuralSystem(config));
  const navigate = (path) => {
    const route = structuralSystem.findRoute(path);
    if (route) {
      setCurrentRoute(path);
      setRouteHistory((prev) => [...prev, path]);
      onRouteChange?.(path);
    } else {
      console.warn(`Route not found: ${path}`);
    }
  };
  const goBack = () => {
    if (routeHistory.length > 1) {
      const newHistory = routeHistory.slice(0, -1);
      const previousRoute = newHistory[newHistory.length - 1];
      setCurrentRoute(previousRoute);
      setRouteHistory(newHistory);
      onRouteChange?.(previousRoute);
    }
  };
  const breadcrumbs = structuralSystem.getBreadcrumbs(currentRoute);
  const contextValue = {
    currentRoute,
    navigate,
    goBack,
    breadcrumbs,
    structuralSystem
  };
  useEffect2(() => {
    const route = structuralSystem.findRoute(initialRoute);
    if (!route) {
      console.warn(`Initial route not found: ${initialRoute}`);
      const defaultRoute = config.RoutingConfig.routes.find((r) => r.component)?.path;
      if (defaultRoute && defaultRoute !== initialRoute) {
        setCurrentRoute(defaultRoute);
        setRouteHistory([defaultRoute]);
        onRouteChange?.(defaultRoute);
      }
    }
  }, [initialRoute, structuralSystem, config.RoutingConfig.routes, onRouteChange]);
  return /* @__PURE__ */ jsx2(RouterContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsxs2("div", { className: "structural-router", children: [
    /* @__PURE__ */ jsx2(RouterHeader, {}),
    /* @__PURE__ */ jsxs2("div", { className: "router-content", children: [
      /* @__PURE__ */ jsx2(RouterSidebar, {}),
      /* @__PURE__ */ jsx2(RouterMain, { children })
    ] })
  ] }) });
};
var RouterHeader = () => {
  const { currentRoute, breadcrumbs, goBack } = useRouter();
  return /* @__PURE__ */ jsxs2("header", { className: "router-header", children: [
    /* @__PURE__ */ jsxs2("div", { className: "header-content", children: [
      /* @__PURE__ */ jsx2("h1", { className: "router-title", children: "Log View Machine" }),
      /* @__PURE__ */ jsx2("nav", { className: "breadcrumb-nav", children: breadcrumbs.map((item, index) => /* @__PURE__ */ jsxs2("span", { className: "breadcrumb-item", children: [
        index > 0 && /* @__PURE__ */ jsx2("span", { className: "breadcrumb-separator", children: "/" }),
        /* @__PURE__ */ jsx2("span", { className: "breadcrumb-label", children: item.label })
      ] }, item.id)) })
    ] }),
    /* @__PURE__ */ jsx2(
      "button",
      {
        className: "back-button",
        onClick: goBack,
        disabled: breadcrumbs.length <= 1,
        children: "\u2190 Back"
      }
    )
  ] });
};
var RouterSidebar = () => {
  const { structuralSystem, navigate, currentRoute } = useRouter();
  const config = structuralSystem.getRoutingConfig();
  const renderNavigationItems = (items) => {
    return items.map((item) => /* @__PURE__ */ jsxs2("div", { className: "nav-item", children: [
      /* @__PURE__ */ jsxs2(
        "button",
        {
          className: `nav-button ${currentRoute === item.path ? "active" : ""}`,
          onClick: () => navigate(item.path),
          children: [
            item.icon && /* @__PURE__ */ jsx2("span", { className: "nav-icon", children: item.icon }),
            /* @__PURE__ */ jsx2("span", { className: "nav-label", children: item.label })
          ]
        }
      ),
      item.children && /* @__PURE__ */ jsx2("div", { className: "nav-children", children: renderNavigationItems(item.children) })
    ] }, item.id));
  };
  return /* @__PURE__ */ jsxs2("aside", { className: "router-sidebar", children: [
    /* @__PURE__ */ jsxs2("nav", { className: "primary-navigation", children: [
      /* @__PURE__ */ jsx2("h3", { className: "nav-section-title", children: "Primary" }),
      renderNavigationItems(config.navigation.primary)
    ] }),
    config.navigation.secondary && /* @__PURE__ */ jsxs2("nav", { className: "secondary-navigation", children: [
      /* @__PURE__ */ jsx2("h3", { className: "nav-section-title", children: "Secondary" }),
      renderNavigationItems(config.navigation.secondary)
    ] })
  ] });
};
var RouterMain = ({ children }) => {
  return /* @__PURE__ */ jsx2("main", { className: "router-main", children });
};
var Route = ({ path, component: Component2, fallback: Fallback }) => {
  const { currentRoute, structuralSystem } = useRouter();
  if (currentRoute === path) {
    return /* @__PURE__ */ jsx2(Component2, {});
  }
  if (Fallback) {
    return /* @__PURE__ */ jsx2(Fallback, {});
  }
  return null;
};
var RouteFallback = () => {
  const { currentRoute } = useRouter();
  return /* @__PURE__ */ jsxs2("div", { className: "route-fallback", children: [
    /* @__PURE__ */ jsx2("h2", { children: "Route Not Found" }),
    /* @__PURE__ */ jsxs2("p", { children: [
      'The route "',
      currentRoute,
      '" could not be found.'
    ] })
  ] });
};

// src/core/structural/StructuralTomeConnector.tsx
import { useEffect as useEffect3, useState as useState3, useRef, useMemo } from "react";
import { ContainerAdapterProvider as ContainerAdapterProvider2 } from "container-cave-adapter";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var StructuralTomeConnector = ({
  componentName,
  structuralSystem,
  initialModel = {},
  onStateChange,
  onLogEntry,
  onMachineCreated,
  children
}) => {
  const [state, setState] = useState3({
    machine: null,
    currentState: "idle",
    model: initialModel,
    logEntries: [],
    isLoading: true,
    error: null
  });
  const machineRef = useRef(null);
  const logEntriesRef = useRef([]);
  const tomeConfig = useMemo(() => {
    return structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
  }, [componentName, structuralSystem]);
  const componentMapping = useMemo(() => {
    return structuralSystem.getComponentTomeMapping()[componentName];
  }, [componentName, structuralSystem]);
  useEffect3(() => {
    const initializeTome = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        if (!tomeConfig) {
          throw new Error(`No tome configuration found for component: ${componentName}`);
        }
        if (!componentMapping) {
          throw new Error(`No component mapping found for: ${componentName}`);
        }
        let machine = structuralSystem.getMachine(componentName);
        if (!machine) {
          machine = structuralSystem.createMachine(componentName, initialModel);
          if (!machine) {
            throw new Error(`Failed to create machine for component: ${componentName}`);
          }
        }
        machineRef.current = machine;
        onMachineCreated?.(machine);
        const unsubscribe = machine.subscribe((state2) => {
          const currentState = state2.value || "idle";
          const model = state2.context?.model || initialModel;
          setState((prev) => ({
            ...prev,
            currentState,
            model,
            isLoading: false
          }));
          onStateChange?.(currentState, model);
        });
        machine.on("LOG_ADDED", async (entry) => {
          const newEntry = {
            id: Date.now().toString(),
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            level: "info",
            message: entry.message,
            metadata: entry.metadata
          };
          setState((prev) => ({
            ...prev,
            logEntries: [...prev.logEntries, newEntry]
          }));
          logEntriesRef.current = [...logEntriesRef.current, newEntry];
          onLogEntry?.(newEntry);
        });
        await machine.start();
        setState((prev) => ({
          ...prev,
          machine,
          isLoading: false
        }));
        return unsubscribe;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
        console.error(`Failed to initialize tome for ${componentName}:`, error);
      }
    };
    initializeTome();
  }, [componentName, structuralSystem, initialModel, onStateChange, onLogEntry, onMachineCreated]);
  const sendEvent = (event) => {
    if (machineRef.current) {
      machineRef.current.send(event);
    }
  };
  const updateModel = (updates) => {
    if (machineRef.current) {
      const currentModel = machineRef.current.getState()?.context?.model || {};
      const newModel = { ...currentModel, ...updates };
      machineRef.current.send({
        type: "MODEL_UPDATE",
        payload: { model: newModel }
      });
    }
  };
  const contextValue = {
    machine: state.machine,
    currentState: state.currentState,
    model: state.model,
    logEntries: state.logEntries,
    isLoading: state.isLoading,
    error: state.error,
    sendEvent,
    updateModel,
    componentName,
    tomeConfig,
    componentMapping
  };
  const containerAdapter = tomeConfig?.containerAdapter;
  if (typeof children === "function") {
    const content = children(contextValue);
    if (containerAdapter) {
      return /* @__PURE__ */ jsx3(
        ContainerAdapterProvider2,
        {
          tomeId: `${componentName}-tome`,
          containerOverrideTag: containerAdapter.containerOverrideTag,
          containerOverrideClasses: containerAdapter.containerOverrideClasses,
          containerOverrideLimit: containerAdapter.containerOverrideLimit,
          headerFragment: containerAdapter.headerFragment,
          footerFragment: containerAdapter.footerFragment,
          children: content
        }
      );
    }
    return /* @__PURE__ */ jsx3(Fragment2, { children: content });
  }
  const layout = /* @__PURE__ */ jsxs3("div", { className: "structural-tome-connector", children: [
    /* @__PURE__ */ jsx3(TomeHeader, { context: contextValue }),
    /* @__PURE__ */ jsx3(TomeContent, { context: contextValue, children }),
    /* @__PURE__ */ jsx3(TomeFooter, { context: contextValue })
  ] });
  if (containerAdapter) {
    return /* @__PURE__ */ jsx3(
      ContainerAdapterProvider2,
      {
        tomeId: `${componentName}-tome`,
        containerOverrideTag: containerAdapter.containerOverrideTag,
        containerOverrideClasses: containerAdapter.containerOverrideClasses,
        containerOverrideLimit: containerAdapter.containerOverrideLimit,
        headerFragment: containerAdapter.headerFragment,
        footerFragment: containerAdapter.footerFragment,
        children: layout
      }
    );
  }
  return layout;
};
var TomeHeader = ({ context }) => {
  const { componentName, currentState, tomeConfig, error } = context;
  return /* @__PURE__ */ jsxs3("header", { className: "tome-header", children: [
    /* @__PURE__ */ jsxs3("div", { className: "tome-info", children: [
      /* @__PURE__ */ jsx3("h3", { className: "tome-title", children: componentName }),
      tomeConfig && /* @__PURE__ */ jsx3("p", { className: "tome-description", children: tomeConfig.description })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "tome-status", children: [
      /* @__PURE__ */ jsx3("span", { className: `state-indicator state-${currentState}`, children: currentState }),
      error && /* @__PURE__ */ jsx3("span", { className: "error-indicator", title: error, children: "\u26A0\uFE0F" })
    ] })
  ] });
};
var TomeContent = ({ context, children }) => {
  const { isLoading, error } = context;
  if (isLoading) {
    return /* @__PURE__ */ jsx3("div", { className: "tome-content loading", children: /* @__PURE__ */ jsx3("div", { className: "loading-spinner", children: "Loading..." }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx3("div", { className: "tome-content error", children: /* @__PURE__ */ jsxs3("div", { className: "error-message", children: [
      /* @__PURE__ */ jsx3("h4", { children: "Error" }),
      /* @__PURE__ */ jsx3("p", { children: error })
    ] }) });
  }
  return /* @__PURE__ */ jsx3("div", { className: "tome-content", children });
};
var TomeFooter = ({ context }) => {
  const { logEntries, tomeConfig } = context;
  if (!tomeConfig || logEntries.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx3("footer", { className: "tome-footer", children: /* @__PURE__ */ jsxs3("details", { className: "tome-logs", children: [
    /* @__PURE__ */ jsxs3("summary", { children: [
      "Logs (",
      logEntries.length,
      ")"
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "log-entries", children: logEntries.slice(-5).map((entry) => /* @__PURE__ */ jsxs3("div", { className: `log-entry log-${entry.level}`, children: [
      /* @__PURE__ */ jsx3("span", { className: "log-timestamp", children: new Date(entry.timestamp).toLocaleTimeString() }),
      /* @__PURE__ */ jsx3("span", { className: "log-message", children: entry.message }),
      entry.metadata && /* @__PURE__ */ jsx3("span", { className: "log-metadata", children: JSON.stringify(entry.metadata) })
    ] }, entry.id)) })
  ] }) });
};
function useStructuralTomeConnector(componentName, structuralSystem) {
  const [context, setContext] = useState3({
    machine: null,
    currentState: "idle",
    model: {},
    logEntries: [],
    isLoading: true,
    error: null,
    sendEvent: () => {
    },
    updateModel: () => {
    },
    componentName,
    tomeConfig: null,
    componentMapping: null
  });
  useEffect3(() => {
    const tomeConfig = structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
    const componentMapping = structuralSystem.getComponentTomeMapping()[componentName];
    setContext((prev) => ({
      ...prev,
      tomeConfig,
      componentMapping
    }));
  }, [componentName, structuralSystem]);
  return context;
}

// src/core/structural/DefaultStructuralConfig.ts
var DefaultStructuralConfig = {
  // Root application structure
  AppStructure: {
    id: "log-view-machine-app",
    name: "Log View Machine Application",
    type: "application",
    routing: {
      base: "/",
      defaultRoute: "/dashboard"
    }
  },
  // Component to Tome mapping
  ComponentTomeMapping: {
    "dashboard": {
      componentPath: "src/components/Dashboard.tsx",
      tomePath: "src/component-middleware/dashboard/DashboardTomes.tsx",
      templatePath: "src/component-middleware/dashboard/templates/dashboard-component/"
    },
    "log-viewer": {
      componentPath: "src/components/LogViewer.tsx",
      tomePath: "src/component-middleware/log-viewer/LogViewerTomes.tsx",
      templatePath: "src/component-middleware/log-viewer/templates/log-viewer-component/"
    },
    "state-machine": {
      componentPath: "src/components/StateMachine.tsx",
      tomePath: "src/component-middleware/state-machine/StateMachineTomes.tsx",
      templatePath: "src/component-middleware/state-machine/templates/state-machine-component/"
    },
    "tome-manager": {
      componentPath: "src/components/TomeManager.tsx",
      tomePath: "src/component-middleware/tome-manager/TomeManagerTomes.tsx",
      templatePath: "src/component-middleware/tome-manager/templates/tome-manager-component/"
    },
    "settings": {
      componentPath: "src/components/Settings.tsx",
      tomePath: "src/component-middleware/settings/SettingsTomes.tsx",
      templatePath: "src/component-middleware/settings/templates/settings-component/"
    }
  },
  // Routing configuration
  RoutingConfig: {
    routes: [
      {
        path: "/",
        redirect: "/dashboard"
      },
      {
        path: "/dashboard",
        component: "dashboard"
      },
      {
        path: "/log-viewer",
        component: "log-viewer"
      },
      {
        path: "/state-machine",
        component: "state-machine"
      },
      {
        path: "/tome-manager",
        component: "tome-manager"
      },
      {
        path: "/settings",
        component: "settings"
      }
    ],
    navigation: {
      primary: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/dashboard",
          icon: "\u{1F4CA}"
        },
        {
          id: "log-viewer",
          label: "Log Viewer",
          path: "/log-viewer",
          icon: "\u{1F4CB}"
        },
        {
          id: "state-machine",
          label: "State Machine",
          path: "/state-machine",
          icon: "\u2699\uFE0F"
        },
        {
          id: "tome-manager",
          label: "Tome Manager",
          path: "/tome-manager",
          icon: "\u{1F4DA}"
        }
      ],
      secondary: [
        {
          id: "settings",
          label: "Settings",
          path: "/settings",
          icon: "\u2699\uFE0F"
        }
      ]
    }
  },
  // Tome configuration
  TomeConfig: {
    tomes: {
      "dashboard-tome": {
        machineId: "dashboard",
        description: "Main dashboard with overview and navigation",
        states: ["idle", "loading", "loaded", "error"],
        events: ["LOAD", "REFRESH", "ERROR", "CLEAR"]
      },
      "log-viewer-tome": {
        machineId: "log-viewer",
        description: "Log viewing and analysis functionality",
        states: ["idle", "loading", "viewing", "filtering", "exporting", "error"],
        events: ["LOAD_LOGS", "FILTER", "EXPORT", "CLEAR", "ERROR"]
      },
      "state-machine-tome": {
        machineId: "state-machine",
        description: "State machine visualization and management",
        states: ["idle", "loading", "visualizing", "editing", "saving", "error"],
        events: ["LOAD_MACHINE", "VISUALIZE", "EDIT", "SAVE", "ERROR"]
      },
      "tome-manager-tome": {
        machineId: "tome-manager",
        description: "Tome lifecycle and configuration management",
        states: ["idle", "loading", "managing", "creating", "editing", "deleting", "error"],
        events: ["LOAD_TOMES", "CREATE", "EDIT", "DELETE", "SAVE", "ERROR"]
      },
      "settings-tome": {
        machineId: "settings",
        description: "Application settings and configuration",
        states: ["idle", "loading", "editing", "saving", "resetting", "error"],
        events: ["LOAD_SETTINGS", "EDIT", "SAVE", "RESET", "ERROR"]
      }
    },
    machineStates: {
      "dashboard": {
        idle: {
          description: "Dashboard is ready for interaction",
          actions: ["initialize", "setupEventListeners"]
        },
        loading: {
          description: "Loading dashboard data",
          actions: ["fetchData", "showLoadingState"]
        },
        loaded: {
          description: "Dashboard data is loaded and ready",
          actions: ["renderDashboard", "setupInteractions"]
        },
        error: {
          description: "Error occurred while loading dashboard",
          actions: ["showError", "provideRetryOption"]
        }
      },
      "log-viewer": {
        idle: {
          description: "Log viewer is ready",
          actions: ["initialize", "setupLogSources"]
        },
        loading: {
          description: "Loading log data",
          actions: ["fetchLogs", "parseLogs", "showProgress"]
        },
        viewing: {
          description: "Displaying logs for viewing",
          actions: ["renderLogs", "setupFilters", "enableSearch"]
        },
        filtering: {
          description: "Applying filters to logs",
          actions: ["applyFilters", "updateView", "showFilterCount"]
        }
      }
    }
  }
};
function createStructuralConfig(overrides = {}) {
  return {
    ...DefaultStructuralConfig,
    ...overrides,
    ComponentTomeMapping: {
      ...DefaultStructuralConfig.ComponentTomeMapping,
      ...overrides.ComponentTomeMapping
    },
    RoutingConfig: {
      ...DefaultStructuralConfig.RoutingConfig,
      ...overrides.RoutingConfig,
      routes: [
        ...overrides.RoutingConfig?.routes || DefaultStructuralConfig.RoutingConfig.routes
      ],
      navigation: {
        ...DefaultStructuralConfig.RoutingConfig.navigation,
        ...overrides.RoutingConfig?.navigation,
        primary: [
          ...overrides.RoutingConfig?.navigation?.primary || DefaultStructuralConfig.RoutingConfig.navigation.primary
        ],
        secondary: [
          ...overrides.RoutingConfig?.navigation?.secondary || DefaultStructuralConfig.RoutingConfig.navigation.secondary || []
        ]
      }
    },
    TomeConfig: {
      ...DefaultStructuralConfig.TomeConfig,
      ...overrides.TomeConfig,
      tomes: {
        ...DefaultStructuralConfig.TomeConfig.tomes,
        ...overrides.TomeConfig?.tomes
      },
      machineStates: {
        ...DefaultStructuralConfig.TomeConfig.machineStates,
        ...overrides.TomeConfig?.machineStates
      }
    }
  };
}

// src/core/Cave/CaveRobit.ts
var DEFAULT_TRANSPORT = { type: "in-app" };
function matchesValue(value, pattern) {
  if (pattern === void 0) return true;
  if (typeof pattern === "string") {
    if (pattern === "*") return true;
    try {
      return new RegExp(pattern).test(value);
    } catch {
      return value === pattern;
    }
  }
  return pattern.test(value);
}
function resolveRoute(routes, fromCave, toTome, path) {
  for (const route of routes) {
    const fromMatch = matchesValue(fromCave, route.fromCave);
    const toMatch = matchesValue(toTome, route.toTome);
    let pathMatch = true;
    if (route.pathPattern) {
      try {
        pathMatch = new RegExp(route.pathPattern).test(path ?? "");
      } catch {
        pathMatch = false;
      }
    }
    if (fromMatch && toMatch && pathMatch) {
      return route.transport;
    }
  }
  return void 0;
}
function createCaveRobit(config = {}) {
  const configRoutes = [...config.routes ?? []];
  const runtimeRoutes = [];
  const defaultTransport = config.defaultTransport ?? DEFAULT_TRANSPORT;
  function findTransport(fromCave, toTome, path) {
    const result = resolveRoute(configRoutes, fromCave, toTome, path);
    if (result) return result;
    for (const route of runtimeRoutes) {
      const fromMatch = matchesValue(fromCave, route.fromCave);
      const toMatch = matchesValue(toTome, route.toTome);
      if (fromMatch && toMatch) return route.transport;
    }
    return void 0;
  }
  let caveRobit = {
    getTransportForTarget(fromCave, toTome, path) {
      const result = findTransport(fromCave, toTome, path ?? "");
      return result ?? defaultTransport;
    },
    registerRoute(fromCave, toTome, descriptor) {
      runtimeRoutes.push({ fromCave, toTome, transport: descriptor });
    }
  };
  for (const adapter of config.adapters ?? []) {
    caveRobit = adapter(caveRobit, config);
  }
  return caveRobit;
}
function createCaveRobitWithFallback(caveRobit, options) {
  const { fallbackTransport } = options;
  return {
    getTransportForTarget(fromCave, toTome, path) {
      try {
        const result = caveRobit.getTransportForTarget(fromCave, toTome, path);
        if (result && typeof result.then === "function") {
          return result.catch(() => fallbackTransport);
        }
        return result ?? fallbackTransport;
      } catch {
        return fallbackTransport;
      }
    },
    registerRoute: caveRobit.registerRoute && ((fromCave, toTome, descriptor) => {
      caveRobit.registerRoute(fromCave, toTome, descriptor);
    })
  };
}

// src/core/Cave/Cave.ts
function createChildCaves(spelunk, options) {
  const childCaves = {};
  if (spelunk.childCaves) {
    for (const [key, childSpelunk] of Object.entries(spelunk.childCaves)) {
      childCaves[key] = Cave(key, childSpelunk, options);
    }
  }
  return childCaves;
}
function resolveCaveRobit(caveRobit) {
  if (!caveRobit) return void 0;
  if (typeof caveRobit.getTransportForTarget === "function") {
    return caveRobit;
  }
  return createCaveRobit(caveRobit);
}
function Cave(name, caveDescent, options) {
  const config = { name, spelunk: caveDescent, ...options };
  let isInitialized = false;
  const caveRobit = resolveCaveRobit(options?.caveRobit ?? config.caveRobit);
  const childCavesRef = createChildCaves(caveDescent, options);
  const viewKeyListeners = [];
  function getRenderKey() {
    return caveDescent.renderKey ?? name;
  }
  const instance = {
    get name() {
      return name;
    },
    get isInitialized() {
      return isInitialized;
    },
    get childCaves() {
      return childCavesRef;
    },
    getConfig() {
      return { ...config };
    },
    getRoutedConfig(path) {
      const trimmed = path.replace(/^\.\/?|\/$/g, "") || ".";
      if (trimmed === "." || trimmed === "") {
        return config;
      }
      const parts = trimmed.split("/").filter(Boolean);
      let current = caveDescent;
      for (const part of parts) {
        const next = current.childCaves?.[part];
        if (!next) {
          return config;
        }
        current = next;
      }
      return current;
    },
    getRenderTarget(path) {
      const routed = instance.getRoutedConfig(path);
      const spelunk = "spelunk" in routed ? routed.spelunk : routed;
      return {
        route: spelunk.route,
        container: spelunk.container,
        tomes: spelunk.tomes,
        tomeId: spelunk.tomeId
      };
    },
    getTransportForTarget(fromCave, path) {
      if (!caveRobit) {
        return { type: "in-app" };
      }
      const target = instance.getRenderTarget(path);
      const toTome = target.tomeId ?? "";
      return caveRobit.getTransportForTarget(fromCave, toTome, path);
    },
    getRenderKey,
    observeViewKey(callback) {
      callback(getRenderKey());
      viewKeyListeners.push(callback);
      return () => {
        const i = viewKeyListeners.indexOf(callback);
        if (i !== -1) viewKeyListeners.splice(i, 1);
      };
    },
    async initialize() {
      if (isInitialized) {
        return instance;
      }
      for (const child of Object.values(childCavesRef)) {
        await child.initialize();
      }
      isInitialized = true;
      return instance;
    }
  };
  return instance;
}
function createCave(name, spelunk, options) {
  return Cave(name, spelunk, options);
}

// src/core/Cave/integrateCaveRobitWithRobotCopy.ts
function createCaveRobitTransport(options) {
  const {
    cave,
    caveRobit,
    fromCave = cave.name,
    getToTome = (_, data) => data.toTome ?? data.tomeId ?? "",
    getPath = () => "",
    httpTransport
  } = options;
  const configCaveRobit = cave.getConfig?.().caveRobit;
  const resolver = caveRobit ?? (configCaveRobit && typeof configCaveRobit.getTransportForTarget === "function" ? configCaveRobit : configCaveRobit ? createCaveRobit(configCaveRobit) : void 0);
  if (!resolver && !cave.getTransportForTarget) {
    throw new Error("integrateCaveRobitWithRobotCopy: cave must have caveRobit or getTransportForTarget");
  }
  return {
    async send(action, data = {}) {
      const toTome = getToTome(action, data);
      const path = getPath(action, data);
      let descriptor;
      const effectivePath = path || "/";
      if (cave.getTransportForTarget && effectivePath) {
        const result = cave.getTransportForTarget(fromCave, effectivePath);
        descriptor = result && typeof result.then === "function" ? await result : result;
      } else if (resolver) {
        const result = resolver.getTransportForTarget(fromCave, toTome, effectivePath);
        descriptor = result && typeof result.then === "function" ? await result : result;
      } else {
        descriptor = { type: "in-app" };
      }
      if (descriptor.type === "http") {
        if (httpTransport) {
          return httpTransport.send(action, data);
        }
        const baseUrl = descriptor.config?.baseUrl ?? descriptor.config?.url ?? "";
        if (!baseUrl) {
          throw new Error("CaveRobit transport http requires baseUrl or url in config");
        }
        const apiPath = descriptor.config?.apiBasePath ?? "/api";
        const url = `${baseUrl.replace(/\/$/, "")}${apiPath}/${action}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json().catch(() => ({}));
      }
      if (descriptor.type === "in-app") {
        return {};
      }
      throw new Error(
        `CaveRobit transport type "${descriptor.type}" not implemented; use http or in-app, or provide custom transport`
      );
    }
  };
}
function createRobotCopyConfigWithCaveRobit(cave, baseConfig = {}) {
  const { httpTransport, ...rest } = baseConfig;
  const transport = createCaveRobitTransport({
    cave,
    fromCave: cave.name,
    getToTome: (_, data) => data.toTome ?? data.tomeId ?? "",
    getPath: (_, data) => data.path ?? "/",
    httpTransport
  });
  return {
    ...rest,
    transport
  };
}

// src/core/serverAdapter/createCaveServer.ts
function createDefaultAppShellRegistry() {
  const map = /* @__PURE__ */ new Map();
  return {
    register(name, descriptor) {
      map.set(name, { ...descriptor, name });
    },
    get(name) {
      return map.get(name);
    }
  };
}
async function createCaveServer(config) {
  const { cave, tomeConfigs, variables = {}, sections = {}, plugins, robotCopy, resourceMonitor, metricsReporter } = config;
  await cave.initialize();
  const tomeManagerRef = { current: null };
  const appShellRegistry = createDefaultAppShellRegistry();
  const appShellRegistryRef = { current: appShellRegistry };
  const context = {
    cave,
    tomeConfigs,
    variables: { ...variables },
    sections: { ...sections },
    robotCopy,
    resourceMonitor,
    metricsReporter,
    tomeManagerRef,
    appShellRegistryRef
  };
  for (const plugin of plugins) {
    await plugin.apply(context);
  }
}

// src/core/hooks/useCaveTomeVSM.tsx
import { useState as useState4, useEffect as useEffect4, useRef as useRef2 } from "react";
function useCave(cave) {
  const [renderKey, setRenderKey] = useState4(() => cave ? cave.getRenderKey() : "");
  const caveRef = useRef2(cave);
  useEffect4(() => {
    caveRef.current = cave;
    if (!cave) {
      setRenderKey("");
      return void 0;
    }
    setRenderKey(cave.getRenderKey());
    const unsubscribe = cave.observeViewKey(setRenderKey);
    return () => {
      unsubscribe();
    };
  }, [cave]);
  return [cave, renderKey];
}
function useTome(tome, options) {
  const [renderKey, setRenderKey] = useState4(() => tome ? tome.getRenderKey() : "");
  const tomeRef = useRef2(tome);
  const unregisterRef = useRef2(options?.unregister);
  useEffect4(() => {
    unregisterRef.current = options?.unregister;
  }, [options?.unregister]);
  useEffect4(() => {
    tomeRef.current = tome;
    if (!tome) {
      setRenderKey("");
      return void 0;
    }
    setRenderKey(tome.getRenderKey());
    const unsubscribe = tome.observeViewKey(setRenderKey);
    return () => {
      unsubscribe();
      if (typeof tomeRef.current?.stop === "function") {
        tomeRef.current.stop();
      }
      if (typeof unregisterRef.current === "function") {
        unregisterRef.current();
      }
    };
  }, [tome]);
  return [tome, renderKey];
}
function useViewStateMachineInstance(machine, options) {
  const [renderKey, setRenderKey] = useState4(
    () => machine && typeof machine.getRenderKey === "function" ? machine.getRenderKey() : ""
  );
  const machineRef = useRef2(machine);
  const unregisterRef = useRef2(options?.unregister);
  useEffect4(() => {
    unregisterRef.current = options?.unregister;
  }, [options?.unregister]);
  useEffect4(() => {
    machineRef.current = machine;
    if (!machine) {
      setRenderKey("");
      return void 0;
    }
    if (typeof machine.getRenderKey === "function") {
      setRenderKey(machine.getRenderKey());
    }
    const unsubscribe = typeof machine.observeViewKey === "function" ? machine.observeViewKey(setRenderKey) : () => {
    };
    return () => {
      unsubscribe();
      if (machineRef.current && typeof machineRef.current.stop === "function") {
        machineRef.current.stop();
      }
      if (typeof unregisterRef.current === "function") {
        unregisterRef.current();
      }
    };
  }, [machine]);
  return [machine, renderKey];
}

// src/core/storage/DuckDBStorage.ts
var DuckDBStorageStub = class {
  constructor() {
    this.store = /* @__PURE__ */ new Map();
  }
  async query(sql, _params) {
    const match = sql.trim().toUpperCase().match(/SELECT\s+.*\s+FROM\s+(\w+)/i);
    if (match) {
      const table = match[1];
      return this.store.get(table) ?? [];
    }
    return [];
  }
  async insert(table, row) {
    const rows = this.store.get(table) ?? [];
    rows.push(row);
    this.store.set(table, rows);
  }
  async close() {
    this.store.clear();
  }
};
async function createDuckDBStorage(_options) {
  try {
    return new DuckDBStorageStub();
  } catch {
    return new DuckDBStorageStub();
  }
}
function createDuckDBStorageSync(_options) {
  return new DuckDBStorageStub();
}

// src/core/sanitize/scriptInjectionPrevention.ts
var ENTITY_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;"
};
var REVERSE_ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&#x27;": "'",
  "&#96;": "`",
  "&#x60;": "`"
};
var ENTITY_REGEX = /&(?:amp|lt|gt|quot|#39|#x27|#96|#x60);/g;
function escapeText(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"'`]/g, (c) => ENTITY_MAP[c] ?? c);
}
function unescapeText(str) {
  if (typeof str !== "string") return "";
  return str.replace(ENTITY_REGEX, (match) => REVERSE_ENTITY_MAP[match] ?? match);
}
var DEFAULT_ALLOWED_TAGS = [
  "a",
  "b",
  "br",
  "em",
  "i",
  "p",
  "span",
  "strong",
  "u",
  "ul",
  "ol",
  "li",
  "div",
  "section",
  "article",
  "header",
  "footer",
  "nav",
  "main"
];
var DEFAULT_ALLOWED_ATTRIBUTES = {
  a: ["href", "title", "target"],
  span: ["class"],
  div: ["class"],
  p: ["class"],
  section: ["class"],
  article: ["class"],
  header: ["class"],
  footer: ["class"],
  nav: ["class"],
  main: ["class"]
};
function stripScriptsAndHandlers(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "").replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "").replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
}
function parseHtml(html, options) {
  const stripScripts = options?.stripScripts !== false;
  const allowedTags = new Set((options?.allowedTags ?? DEFAULT_ALLOWED_TAGS).map((t) => t.toLowerCase()));
  const allowedAttributes = options?.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES;
  const errors = [];
  let input = typeof html === "string" ? html : "";
  if (stripScripts) {
    input = stripScriptsAndHandlers(input);
  }
  const isBrowser = typeof document !== "undefined" && typeof DOMParser !== "undefined";
  if (isBrowser) {
    try {
      const doc = new DOMParser().parseFromString(input, "text/html");
      const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return escapeText(node.textContent ?? "");
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return "";
        const el = node;
        const tag = el.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
          return Array.from(el.childNodes).map(walk).join("");
        }
        const attrs = allowedAttributes[tag];
        let attrStr = "";
        if (attrs?.length) {
          for (const name of attrs) {
            const val = el.getAttribute(name);
            if (val != null) attrStr += ` ${name}="${escapeText(val)}"`;
          }
        }
        const inner = Array.from(el.childNodes).map(walk).join("");
        if (["br", "hr", "img", "input"].includes(tag)) {
          return `<${tag}${attrStr}>`;
        }
        return `<${tag}${attrStr}>${inner}</${tag}>`;
      };
      const body = doc.body ?? doc.documentElement;
      const safe2 = body ? Array.from(body.childNodes).map(walk).join("") : escapeText(input);
      return { safe: safe2, errors: errors.length ? errors : void 0 };
    } catch (e) {
      errors.push(String(e));
      return { safe: escapeText(input), errors };
    }
  }
  const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let safe = input;
  let match;
  const seenTags = /* @__PURE__ */ new Set();
  while ((match = tagRegex.exec(input)) !== null) {
    const full = match[0];
    const tag = match[1].toLowerCase();
    seenTags.add(tag);
    if (!allowedTags.has(tag)) {
      safe = safe.replace(full, "");
    }
  }
  safe = safe.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, "");
  return { safe, errors: errors.length ? errors : void 0 };
}

// src/core/messaging/CaveMessagingTransport.ts
function createInMemoryTransport(options) {
  const { contextType, tabId } = options;
  let peer = options.peer ?? null;
  const handlers = [];
  const transport = {
    contextType,
    tabId,
    send(target, message) {
      const normalized = {
        ...message,
        source: message.source ?? contextType,
        target: message.target ?? target
      };
      if (peer && "__invokeHandler" in peer) {
        return Promise.resolve(peer.__invokeHandler(normalized, { id: contextType, tabId }));
      }
      return Promise.resolve({});
    },
    onMessage(handler) {
      handlers.push(handler);
      return () => {
        const i = handlers.indexOf(handler);
        if (i >= 0) handlers.splice(i, 1);
      };
    }
  };
  const peerRef = transport;
  peerRef.__invokeHandler = (message, sender) => {
    if (handlers.length === 0) return {};
    const h = handlers[handlers.length - 1];
    return h(message, sender);
  };
  peerRef.__setPeer = (p) => {
    peer = p;
  };
  if (options.peer && "__setPeer" in options.peer) {
    options.peer.__setPeer(transport);
    peer = options.peer;
  }
  return transport;
}
function wireInMemoryTransportPair(a, b) {
  if ("__setPeer" in a) a.__setPeer(b);
  if ("__setPeer" in b) b.__setPeer(a);
}

// src/core/monitoring/DefaultResourceMonitor.ts
var DEFAULT_WINDOW_MS = 6e4;
var DefaultResourceMonitor = class {
  constructor(options) {
    this.requestCount = 0;
    this.errorCount = 0;
    this.bytesIn = 0;
    this.bytesOut = 0;
    this.latencySamples = [];
    this.circuitState = {};
    this.dimensions = {};
    this.windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxSamples = options?.maxSamples ?? 1e3;
    this.dimensions = options?.dimensions ?? {};
  }
  trackRequest(meta) {
    this.requestCount++;
    if (meta.status != null && meta.status >= 400) this.errorCount++;
    if (meta.bytesIn != null) this.bytesIn += meta.bytesIn;
    if (meta.bytesOut != null) this.bytesOut += meta.bytesOut;
    if (meta.latencyMs != null) {
      const now = Date.now();
      this.latencySamples.push({ ms: meta.latencyMs, at: now });
      if (this.latencySamples.length > this.maxSamples) {
        this.latencySamples.shift();
      }
    }
  }
  trackCircuit(name, state) {
    this.circuitState[name] = state;
  }
  getSnapshot() {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const recent = this.latencySamples.filter((s) => s.at >= cutoff);
    let p50;
    let p95;
    let p99;
    let avg;
    if (recent.length > 0) {
      const sorted = recent.map((s) => s.ms).sort((a, b) => a - b);
      p50 = sorted[Math.floor(sorted.length * 0.5)] ?? sorted[0];
      p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
      p99 = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1];
      avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    }
    const circuitNames = Object.keys(this.circuitState);
    const circuitState = circuitNames.length === 1 ? this.circuitState[circuitNames[0]] : circuitNames.length > 1 ? this.circuitState["default"] ?? this.circuitState[circuitNames[0]] : void 0;
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      bytesIn: this.bytesIn,
      bytesOut: this.bytesOut,
      latencyMs: p50 != null ? { p50, p95, p99, avg } : void 0,
      circuitState,
      timestamp: now,
      dimensions: { ...this.dimensions }
    };
  }
  getSnapshots() {
    return [this.getSnapshot()];
  }
};
function createDefaultResourceMonitor(options) {
  return new DefaultResourceMonitor(options);
}

// src/core/monitoring/MetricsReporter.ts
function createMetricsReporter(getSnapshot, options) {
  const reportTo = options?.reportTo ?? (() => {
  });
  let intervalId = null;
  async function report(snapshot) {
    await Promise.resolve(reportTo(snapshot));
  }
  return {
    report(snapshot) {
      return report(snapshot);
    },
    start() {
      if (options?.intervalMs != null && options.intervalMs > 0 && intervalId == null) {
        intervalId = setInterval(() => {
          report(getSnapshot()).catch(() => {
          });
        }, options.intervalMs);
      }
    },
    stop() {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
}

// src/components/ErrorBoundary.tsx
import { Component } from "react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var ErrorBoundary = class extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.props.onError?.(error, errorInfo);
  }
  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return /* @__PURE__ */ jsxs4("div", { className: "editor-error-boundary", role: "alert", children: [
        /* @__PURE__ */ jsx4("p", { children: "Something went wrong." }),
        /* @__PURE__ */ jsx4("pre", { children: this.state.error.message })
      ] });
    }
    return this.props.children;
  }
};

// src/components/EditorWrapper.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var EditorWrapper = ({
  title,
  description,
  children,
  componentId,
  onError,
  router,
  hideHeader = false
}) => {
  return /* @__PURE__ */ jsx5(ErrorBoundary, { onError, children: /* @__PURE__ */ jsxs5("div", { className: "editor-wrapper", "data-component-id": componentId, children: [
    !hideHeader && /* @__PURE__ */ jsxs5("header", { className: "editor-wrapper-header", children: [
      /* @__PURE__ */ jsx5("h2", { className: "editor-wrapper-title", children: title }),
      /* @__PURE__ */ jsx5("p", { className: "editor-wrapper-description", children: description }),
      /* @__PURE__ */ jsxs5("p", { className: "editor-wrapper-meta", children: [
        "Tome Architecture",
        componentId && ` | Component: ${componentId}`,
        router && " | Router: Available"
      ] })
    ] }),
    /* @__PURE__ */ jsx5("main", { className: "editor-wrapper-content", children }),
    /* @__PURE__ */ jsxs5("footer", { className: "editor-wrapper-footer", children: [
      "Tome Architecture Enabled",
      router && " | Router: Available"
    ] })
  ] }) });
};
var EditorWrapper_default = EditorWrapper;
export {
  ADAPTER_DESCRIPTORS,
  CONTAINER_ADAPTER_DESCRIPTOR,
  CartTomeConfig,
  Cave,
  CircuitBreaker,
  ClientGenerator,
  ContainerAdapterContext,
  ContainerAdapterProvider,
  DefaultResourceMonitor,
  DefaultStructuralConfig,
  DonationTomeConfig,
  DuckDBStorageStub,
  EditorTomeConfig,
  EditorWrapper_default as EditorWrapper,
  ErrorBoundary,
  FishBurgerTomeConfig,
  LibraryTomeConfig,
  RobotCopy,
  Route,
  RouteFallback,
  StructuralRouter,
  StructuralSystem,
  StructuralTomeConnector,
  TeleportHQAdapter,
  ThrottlePolicy,
  TomeConnector,
  TomeManager,
  Tracing,
  ViewStateMachine,
  createCave,
  createCaveRobit,
  createCaveRobitTransport,
  createCaveRobitWithFallback,
  createCaveServer,
  createCircuitBreaker,
  createClientGenerator,
  createDefaultResourceMonitor,
  createDuckDBStorage,
  createDuckDBStorageSync,
  createInMemoryTransport,
  createMetricsReporter,
  createProxyRobotCopyStateMachine,
  createRobotCopy,
  createRobotCopyConfigWithCaveRobit,
  createStructuralConfig,
  createStructuralSystem,
  createTeleportHQAdapter,
  createThrottlePolicy,
  createTome,
  createTomeConfig,
  createTomeConnector,
  createTomeManager,
  createTracing,
  createViewStateMachine,
  escapeText,
  generateToken,
  generateTokenAsync,
  parseContainerOverrideTag2 as parseContainerOverrideTag,
  parseHtml,
  parseToken,
  serializeToken,
  unescapeText,
  useCave,
  useContainerAdapter2 as useContainerAdapter,
  useContainerAdapterFragmentsFromApi,
  useRouter,
  useStructuralSystem,
  useStructuralTomeConnector,
  useTome,
  useViewStateMachineInstance,
  validateToken,
  wireInMemoryTransportPair
};
//# sourceMappingURL=index.esm.js.map
