import { createTracing } from '../../../../tracing/Tracing';
import { serializeToken } from '../../../../messaging/MessageToken';
import { createCircuitBreaker } from '../../../../resilience/CircuitBreaker';
import { createThrottlePolicy } from '../../../../resilience/ThrottlePolicy';
export class RobotCopy {
    constructor(config = {}) {
        this.unleashToggles = new Map();
        this.circuitBreaker = null;
        this.throttlePolicy = null;
        // --- Location (local vs remote) for machines/tomes ---
        this.locationRegistry = new Map();
        this.config = {
            unleashUrl: 'http://localhost:4242/api',
            unleashClientKey: 'default:development.unleash-insecure-api-token',
            unleashAppName: 'log-view-machine',
            unleashEnvironment: 'development',
            kotlinBackendUrl: 'http://localhost:8080',
            nodeBackendUrl: 'http://localhost:3001',
            enableTracing: true,
            enableDataDog: true,
            apiBasePath: '/api',
            ...config,
        };
        this.tracing = createTracing();
        this.initializeUnleashToggles();
        if (this.config.circuitBreaker) {
            const cb = this.config.circuitBreaker;
            this.circuitBreaker = createCircuitBreaker({
                name: cb.name ?? 'robotcopy',
                threshold: cb.threshold,
                resetMs: cb.resetMs,
                monitor: this.config.resourceMonitor,
            });
        }
        if (this.config.throttle) {
            const t = this.config.throttle;
            this.throttlePolicy = 'record' in t && 'isOverLimit' in t
                ? t
                : createThrottlePolicy({ config: t, monitor: this.config.resourceMonitor });
        }
    }
    async initializeUnleashToggles() {
        // Apply optional initial toggles from config; otherwise only generic toggles
        if (this.config.initialToggles && Object.keys(this.config.initialToggles).length > 0) {
            for (const [name, value] of Object.entries(this.config.initialToggles)) {
                this.unleashToggles.set(name, value);
            }
        }
        this.unleashToggles.set('enable-tracing', true);
        this.unleashToggles.set('enable-datadog', true);
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
            return 'node';
        }
        const useKotlin = await this.isEnabled(toggleName);
        return useKotlin ? 'kotlin' : 'node';
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
            const err = new Error('Throttle limit exceeded; try again later');
            err.code = 'THROTTLED';
            throw err;
        }
        if (this.circuitBreaker && !this.circuitBreaker.allowRequest()) {
            const err = new Error('Circuit breaker is open');
            err.code = 'CIRCUIT_OPEN';
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
                'Content-Type': 'application/json',
                ...this.tracing.createTracingHeaders(traceId, spanId, messageId, await this.isEnabled('enable-datadog')),
            };
            const bodyPayload = { ...data, messageId, traceId, spanId };
            if (this.config.messageTokenProvider) {
                try {
                    const token = await Promise.resolve(this.config.messageTokenProvider());
                    if (token) {
                        headers['X-Cave-Message-Token'] = serializeToken(token);
                        bodyPayload._messageToken = token;
                    }
                }
                catch (_) { }
            }
            const basePath = (this.config.apiBasePath ?? '/api').replace(/\/$/, '');
            const url = `${backendUrl}${basePath}/${action}`;
            const bodyStr = JSON.stringify(bodyPayload);
            const start = Date.now();
            const response = await fetch(url, { method: 'POST', headers, body: bodyStr });
            const latencyMs = Date.now() - start;
            const bytesIn = bodyStr.length;
            const responseText = await response.text();
            const bytesOut = new TextEncoder().encode(responseText).length;
            if (this.config.resourceMonitor) {
                this.config.resourceMonitor.trackRequest({
                    path: basePath + '/' + action,
                    method: 'POST',
                    bytesIn,
                    bytesOut,
                    latencyMs,
                    status: response.status,
                });
            }
            if (this.throttlePolicy)
                this.throttlePolicy.record(bytesIn, bytesOut);
            if (!response.ok) {
                if (this.circuitBreaker)
                    this.circuitBreaker.recordFailure();
                const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
                this.trackMessage(`${messageId}_error`, traceId, spanId, { backend, action: `${action}_error`, data: { error: err.message } });
                throw err;
            }
            if (this.circuitBreaker)
                this.circuitBreaker.recordSuccess();
            let result;
            try {
                result = responseText ? JSON.parse(responseText) : {};
            }
            catch {
                result = {};
            }
            this.trackMessage(`${messageId}_response`, traceId, spanId, { backend, action: `${action}_response`, data: result });
            return result;
        };
        const maxRetries = this.config.retryPolicy?.maxRetries ?? 0;
        const initialDelayMs = this.config.retryPolicy?.initialDelayMs ?? 1000;
        const maxDelayMs = this.config.retryPolicy?.maxDelayMs ?? 30000;
        const multiplier = this.config.retryPolicy?.multiplier ?? 2;
        const jitter = this.config.retryPolicy?.jitter ?? true;
        const isRetryable = (e) => {
            const msg = e?.message ?? String(e);
            if (msg.includes('HTTP 5') || msg.includes('fetch'))
                return true;
            return false;
        };
        if (this.circuitBreaker) {
            return this.circuitBreaker.execute(async () => {
                let lastErr;
                for (let attempt = 0; attempt <= maxRetries; attempt++) {
                    try {
                        return await doOne();
                    }
                    catch (e) {
                        lastErr = e;
                        if (attempt < maxRetries && isRetryable(e)) {
                            let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
                            if (jitter)
                                delay *= 0.5 + Math.random() * 0.5;
                            await new Promise((r) => setTimeout(r, delay));
                            continue;
                        }
                        throw e;
                    }
                }
                throw lastErr;
            });
        }
        let lastErr;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await doOne();
            }
            catch (e) {
                lastErr = e;
                if (attempt < maxRetries && isRetryable(e)) {
                    let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
                    if (jitter)
                        delay *= 0.5 + Math.random() * 0.5;
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        // This would be implemented to handle incoming responses
        // For now, we're just store the handler for future use
        console.log(`Registered response handler for channel: ${channel}`);
    }
    // Machine registration for state machines
    registerMachine(name, machine, config = {}) {
        console.log(`Registering machine: ${name}`, { config });
        // Store the machine registration for future use
        // This could be used for machine discovery, monitoring, etc.
        if (!this.machines) {
            this.machines = new Map();
        }
        this.machines.set(name, { machine, config, registeredAt: new Date().toISOString() });
        // Apply default location from config (TomeMachineConfig.location / remoteClient)
        const loc = config.location;
        const client = config.remoteClient;
        if (loc !== undefined || client !== undefined) {
            this.registerMachineLocation(name, { location: loc, remoteClient: client });
        }
    }
    // Get registered machines
    getRegisteredMachines() {
        return this.machines || new Map();
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
        if (!defaultFromConfig)
            return;
        const { location, remoteClient } = defaultFromConfig;
        const local = location === 'remote' ? false : true;
        const client = remoteClient ?? (typeof location === 'string' && location !== 'local' && location !== 'same-cave' ? location : undefined);
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
        return entry === undefined ? true : entry.local;
    }
}
export function createRobotCopy(config) {
    return new RobotCopy(config);
}
