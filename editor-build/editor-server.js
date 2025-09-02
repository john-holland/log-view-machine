import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SpanStatusCode } from '@opentelemetry/api';

class Tracing {
    constructor() {
        Object.defineProperty(this, "messageHistory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "traceMap", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
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
            timestamp: new Date().toISOString(),
            backend: metadata.backend || 'node',
            action: metadata.action || 'unknown',
            data: metadata.data,
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
        return messageIds.map(id => this.messageHistory.get(id)).filter(Boolean);
    }
    getFullTrace(traceId) {
        const messages = this.getTraceMessages(traceId);
        return {
            traceId,
            messages,
            startTime: messages[0]?.timestamp,
            endTime: messages[messages.length - 1]?.timestamp,
            backend: messages[0]?.backend,
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
            'x-trace-id': traceId,
            'x-span-id': spanId,
            'x-message-id': messageId,
        };
        if (enableDataDog) {
            headers['x-datadog-trace-id'] = traceId;
            headers['x-datadog-parent-id'] = spanId;
            headers['x-datadog-sampling-priority'] = '1';
        }
        return headers;
    }
}
function createTracing() {
    return new Tracing();
}

// ViewStateMachine import removed as it's not used
class RobotCopy {
    constructor(config = {}) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tracing", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "unleashToggles", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "machines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.config = {
            unleashUrl: 'http://localhost:4242/api',
            unleashClientKey: 'default:development.unleash-insecure-api-token',
            unleashAppName: 'fish-burger-frontend',
            unleashEnvironment: 'development',
            kotlinBackendUrl: 'http://localhost:8080',
            nodeBackendUrl: 'http://localhost:3001',
            enableTracing: true,
            enableDataDog: true,
            ...config,
        };
        this.tracing = createTracing();
        this.initializeUnleashToggles();
    }
    async initializeUnleashToggles() {
        // Simulate Unleash toggle initialization
        // In real implementation, this would fetch from Unleash API
        this.unleashToggles.set('fish-burger-kotlin-backend', false);
        this.unleashToggles.set('fish-burger-node-backend', true);
        this.unleashToggles.set('enable-tracing', true);
        this.unleashToggles.set('enable-datadog', true);
    }
    async isEnabled(toggleName, _context = {}) {
        return this.unleashToggles.get(toggleName) || false;
    }
    async getBackendUrl() {
        const useKotlin = await this.isEnabled('fish-burger-kotlin-backend');
        return useKotlin ? this.config.kotlinBackendUrl : this.config.nodeBackendUrl;
    }
    async getBackendType() {
        const useKotlin = await this.isEnabled('fish-burger-kotlin-backend');
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
        const messageId = this.generateMessageId();
        const traceId = this.generateTraceId();
        const spanId = this.generateSpanId();
        const backend = await this.getBackendType();
        const backendUrl = await this.getBackendUrl();
        // Track the message
        this.trackMessage(messageId, traceId, spanId, {
            backend,
            action,
            data,
        });
        // Prepare headers for tracing
        const headers = {
            'Content-Type': 'application/json',
            ...this.tracing.createTracingHeaders(traceId, spanId, messageId, await this.isEnabled('enable-datadog')),
        };
        try {
            const response = await fetch(`${backendUrl}/api/fish-burger/${action}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...data,
                    messageId,
                    traceId,
                    spanId,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const result = await response.json();
            // Track the response
            this.trackMessage(`${messageId}_response`, traceId, spanId, {
                backend,
                action: `${action}_response`,
                data: result,
            });
            return result;
        }
        catch (error) {
            // Track the error
            this.trackMessage(`${messageId}_error`, traceId, spanId, {
                backend,
                action: `${action}_error`,
                data: { error: error instanceof Error ? error.message : String(error) },
            });
            throw error;
        }
    }
    async startCooking(orderId, ingredients) {
        return this.sendMessage('start', { orderId, ingredients });
    }
    async updateProgress(orderId, cookingTime, temperature) {
        return this.sendMessage('progress', { orderId, cookingTime, temperature });
    }
    async completeCooking(orderId) {
        return this.sendMessage('complete', { orderId });
    }
    // Integration with ViewStateMachine
    integrateWithViewStateMachine(viewStateMachine) {
        // Register message handlers for ViewStateMachine
        viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message) => {
            return this.startCooking(message.orderId, message.ingredients);
        });
        viewStateMachine.registerRobotCopyHandler('UPDATE_PROGRESS', async (message) => {
            return this.updateProgress(message.orderId, message.cookingTime, message.temperature);
        });
        viewStateMachine.registerRobotCopyHandler('COMPLETE_COOKING', async (message) => {
            return this.completeCooking(message.orderId);
        });
        return this;
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
        // For now, we'll just store the handler for future use
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
    }
    // Get registered machines
    getRegisteredMachines() {
        return this.machines || new Map();
    }
    // Get a specific registered machine
    getRegisteredMachine(name) {
        return this.machines?.get(name);
    }
}

class OpenTelemetryManager {
    constructor(config) {
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isInitialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "errorRegistry", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.config = {
            enableMetrics: true,
            enableLogs: true,
            samplingRate: 1.0,
            enableStackTraces: true,
            maxStackTraceDepth: 10,
            ...config
        };
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            console.log('🔧 Initializing OpenTelemetry...');
            console.log(`  📡 Service: ${this.config.serviceName}`);
            console.log(`  🌍 Environment: ${this.config.environment}`);
            console.log(`  🔗 Endpoint: ${this.config.endpoint}`);
            console.log(`  🔍 Stack Traces: ${this.config.enableStackTraces ? 'Enabled' : 'Disabled'}`);
            // For now, we'll use a simplified approach without the full SDK
            // This will still provide trace ID generation and basic functionality
            this.isInitialized = true;
            console.log('✅ OpenTelemetry initialized successfully (simplified mode)');
        }
        catch (error) {
            console.error('❌ Failed to initialize OpenTelemetry:', error);
            throw error;
        }
    }
    async shutdown() {
        if (!this.isInitialized)
            return;
        try {
            console.log('🔄 Shutting down OpenTelemetry...');
            this.isInitialized = false;
            console.log('✅ OpenTelemetry shutdown complete');
        }
        catch (error) {
            console.error('❌ Error during OpenTelemetry shutdown:', error);
        }
    }
    // Generate a new trace ID using a simple approach
    generateTraceId() {
        // Generate a random 32-character hex string for trace ID
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    // Generate a new span ID using a simple approach
    generateSpanId() {
        // Generate a random 16-character hex string for span ID
        return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    // Extract stack trace information from an Error object
    extractStackTrace(error) {
        if (!this.config.enableStackTraces) {
            return {
                message: error.message,
                stack: '',
                name: error.name
            };
        }
        const stackLines = error.stack?.split('\n') || [];
        const stackTrace = {
            message: error.message,
            stack: error.stack || '',
            name: error.name
        };
        // Parse stack trace lines to extract file and line information
        if (stackLines.length > 1) {
            // Skip the first line (error message) and parse the stack
            for (let i = 1; i < Math.min(stackLines.length, this.config.maxStackTraceDepth + 1); i++) {
                const line = stackLines[i].trim();
                if (line.startsWith('at ')) {
                    // Parse: "at FunctionName (fileName:lineNumber:columnNumber)"
                    const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
                    if (match) {
                        stackTrace.functionName = match[1];
                        stackTrace.fileName = match[2];
                        stackTrace.lineNumber = parseInt(match[3]);
                        stackTrace.columnNumber = parseInt(match[4]);
                        break; // Get the first meaningful stack frame
                    }
                }
            }
        }
        return stackTrace;
    }
    // Capture error context with stack trace
    captureError(error, context) {
        if (!this.config.enableStackTraces) {
            return this.generateTraceId();
        }
        const traceId = this.generateTraceId();
        const stackTrace = this.extractStackTrace(error);
        const errorContext = {
            error,
            stackTrace,
            context,
            timestamp: Date.now()
        };
        this.errorRegistry.set(traceId, errorContext);
        console.log(`🔍 Error captured with trace ID: ${traceId}`);
        console.log(`  📍 File: ${stackTrace.fileName}:${stackTrace.lineNumber}`);
        console.log(`  🔧 Function: ${stackTrace.functionName}`);
        console.log(`  💬 Message: ${stackTrace.message}`);
        return traceId;
    }
    // Get error context by trace ID
    getErrorContext(traceId) {
        return this.errorRegistry.get(traceId);
    }
    // Start a new span with enhanced error handling
    startSpan(name, options) {
        // Create a simple span object for now
        const spanId = this.generateSpanId();
        const traceId = this.generateTraceId();
        // Create a proper span object with its own state
        const span = {
            name,
            traceId,
            spanId,
            attributes: {},
            status: { code: SpanStatusCode.OK, message: '' },
            setAttributes: (attributes) => {
                // Store attributes on the span object
                Object.assign(span.attributes, attributes);
            },
            setStatus: (status) => {
                // Store status on the span object
                span.status = status;
            },
            recordException: (error, attributes) => {
                // Capture error with stack trace
                const errorTraceId = this.captureError(error, attributes);
                // Set error attributes on the span
                span.setAttributes({
                    'error': true,
                    'error.message': error.message,
                    'error.type': error.name,
                    'error.stack_trace_id': errorTraceId,
                    'error.timestamp': new Date().toISOString()
                });
                // Also set any additional attributes passed in
                if (attributes) {
                    span.setAttributes(attributes);
                }
                // Set span status to error
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                console.log(`🚨 Exception recorded in span: ${name} (${traceId}:${spanId})`);
                console.log(`  🔍 Error trace ID: ${errorTraceId}`);
            },
            end: () => {
                // End the span
                console.log(`🔍 Span ended: ${name} (${traceId}:${spanId})`);
                console.log(`  📊 Final attributes:`, span.attributes);
                console.log(`  📊 Final status:`, span.status);
            },
            spanContext: () => ({
                traceId,
                spanId,
                traceFlags: 1,
                isRemote: false
            })
        };
        return span;
    }
    // Get current trace context
    getCurrentTraceContext() {
        // For now, return a generated context
        return {
            traceId: this.generateTraceId(),
            spanId: this.generateSpanId(),
            traceFlags: 1,
            isRemote: false,
        };
    }
    // Create a trace context for HTTP requests
    createTraceContext() {
        const traceId = this.generateTraceId();
        const spanId = this.generateSpanId();
        return {
            traceId,
            spanId,
            headers: {
                'X-Trace-ID': traceId,
                'X-Span-ID': spanId,
                'traceparent': `00-${traceId}-${spanId}-01`,
            }
        };
    }
    // Extract trace context from HTTP headers
    extractTraceContext(headers) {
        const traceId = headers['x-trace-id'] || headers['X-Trace-ID'];
        const spanId = headers['x-span-id'] || headers['X-Span-ID'];
        const traceparent = headers['traceparent'];
        if (traceId && spanId) {
            return { traceId, spanId };
        }
        if (traceparent) {
            // Parse W3C traceparent header: 00-<trace-id>-<span-id>-<trace-flags>
            const parts = traceparent.split('-');
            if (parts.length === 4) {
                return { traceId: parts[1], spanId: parts[2] };
            }
        }
        return null;
    }
    // Get error statistics
    getErrorStats() {
        if (!this.config.enableStackTraces) {
            return { enabled: false };
        }
        const errors = Array.from(this.errorRegistry.values());
        const errorTypes = new Map();
        const fileErrors = new Map();
        errors.forEach(errorContext => {
            // Count error types
            const errorType = errorContext.error.name;
            errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);
            // Count errors by file
            if (errorContext.stackTrace.fileName) {
                fileErrors.set(errorContext.stackTrace.fileName, (fileErrors.get(errorContext.stackTrace.fileName) || 0) + 1);
            }
        });
        return {
            enabled: true,
            totalErrors: errors.length,
            errorTypes: Object.fromEntries(errorTypes),
            fileErrors: Object.fromEntries(fileErrors),
            recentErrors: errors
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 5)
                .map(ec => ({
                message: ec.error.message,
                type: ec.error.name,
                file: ec.stackTrace.fileName,
                line: ec.stackTrace.lineNumber,
                timestamp: new Date(ec.timestamp).toISOString()
            }))
        };
    }
    // Clear error registry (useful for testing or cleanup)
    clearErrorRegistry() {
        this.errorRegistry.clear();
        console.log('🧹 Error registry cleared');
    }
    getInitializationStatus() {
        return this.isInitialized;
    }
    getConfig() {
        return { ...this.config };
    }
}
// Create and export a singleton instance
const openTelemetryManager = new OpenTelemetryManager({
    serviceName: 'tome-connector-editor',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318',
    enableMetrics: true,
    enableLogs: true,
    enableStackTraces: true,
    maxStackTraceDepth: 10,
});
// Initialize OpenTelemetry when this module is imported
if (process.env.NODE_ENV !== 'test') {
    openTelemetryManager.initialize().catch(console.error);
}

// Editor-specific configuration
const EDITOR_CONFIG = {
    port: process.env.EDITOR_PORT || 3003,
    enableCors: true,
    enableSecurity: true
};
// Initialize RobotCopy with editor-specific features
const robotCopy = new RobotCopy({
    unleashUrl: process.env.UNLEASH_URL || 'http://localhost:4242/api',
    unleashAppName: process.env.UNLEASH_APP_NAME || 'tome-connector-editor',
    unleashEnvironment: process.env.UNLEASH_ENVIRONMENT || 'development'
});
// Create Express app
const app = express();
// OpenTelemetry middleware for trace context propagation
app.use((req, res, next) => {
    // Extract trace context from incoming request
    const traceContext = openTelemetryManager.extractTraceContext(req.headers);
    if (traceContext) {
        // If trace context exists, use it
        req.traceId = traceContext.traceId;
        req.spanId = traceContext.spanId;
    }
    else {
        // Generate new trace context for this request
        const newContext = openTelemetryManager.createTraceContext();
        req.traceId = newContext.traceId;
        req.spanId = newContext.spanId;
    }
    // Add trace headers to response
    res.set('X-Trace-ID', req.traceId);
    res.set('X-Span-ID', req.spanId);
    next();
});
// Security middleware
{
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "ws:", "wss:"],
                // Block extension scripts and service workers
                workerSrc: ["'none'"],
                childSrc: ["'self'"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                // Prevent extension manifest injection
                manifestSrc: ["'none'"],
                // Allow inline styles and scripts for editor functionality
                styleSrcAttr: ["'unsafe-inline'"],
                scriptSrcAttr: ["'unsafe-inline'"]
            }
        },
        // Additional security headers
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));
}
// CORS middleware
{
    app.use(cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
}
// Extension isolation middleware
app.use((req, res, next) => {
    // Block extension-related requests
    if (req.path.includes('manifest.json') ||
        req.path.includes('background.js') ||
        req.path.includes('content.js') ||
        req.path.includes('service-worker') ||
        req.path.includes('chrome-extension') ||
        req.path.includes('shadowContent.js') ||
        req.path.includes('log-view-machine')) {
        return res.status(404).json({ error: 'Extension resources not available' });
    }
    // Add headers to prevent extension interference
    res.set({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
        // Additional headers to block extension loading
        'X-Content-Security-Policy': "default-src 'self'; worker-src 'none'; manifest-src 'none';",
        'X-WebKit-CSP': "default-src 'self'; worker-src 'none'; manifest-src 'none';"
    });
    next();
});
// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'tome-connector-editor',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// Editor-specific API endpoints
app.get('/api/editor/status', (req, res) => {
    res.json({
        status: 'ready',
        service: 'tome-connector-editor',
        robotCopy: {
            unleashUrl: robotCopy['config'].unleashUrl,
            unleashAppName: robotCopy['config'].unleashAppName,
            unleashEnvironment: robotCopy['config'].unleashEnvironment
        }
    });
});
// Pact-related endpoints (using actual RobotCopy methods)
app.get('/api/pact/features', async (req, res) => {
    try {
        // Get available feature toggles
        const features = {
            'fish-burger-kotlin-backend': await robotCopy.isEnabled('fish-burger-kotlin-backend'),
            'fish-burger-node-backend': await robotCopy.isEnabled('fish-burger-node-backend'),
            'enable-tracing': await robotCopy.isEnabled('enable-tracing'),
            'enable-datadog': await robotCopy.isEnabled('enable-datadog')
        };
        res.json({ features });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve feature toggles' });
    }
});
app.get('/api/pact/backend', async (req, res) => {
    try {
        const backendType = await robotCopy.getBackendType();
        const backendUrl = await robotCopy.getBackendUrl();
        res.json({
            backendType,
            backendUrl,
            features: {
                'fish-burger-kotlin-backend': await robotCopy.isEnabled('fish-burger-kotlin-backend'),
                'fish-burger-node-backend': await robotCopy.isEnabled('fish-burger-node-backend')
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve backend information' });
    }
});
// Tracing endpoints
app.get('/api/tracing/status', (req, res) => {
    const currentContext = openTelemetryManager.getCurrentTraceContext();
    res.json({
        tracing: {
            enabled: openTelemetryManager.getInitializationStatus(),
            opentelemetry: true,
            currentTrace: currentContext,
            service: {
                name: 'tome-connector-editor',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            },
            endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318'
        }
    });
});
app.post('/api/tracing/message', async (req, res) => {
    try {
        const { action, data } = req.body;
        if (!action) {
            return res.status(400).json({ error: 'action parameter is required' });
        }
        // Start a span for this message
        const span = openTelemetryManager.startSpan(`tracing.message.${action}`);
        try {
            const result = await robotCopy.sendMessage(action, data);
            // Add attributes to span
            span.setAttributes({
                'action': action,
                'success': true,
                'traceId': req.traceId,
                'spanId': req.spanId
            });
            span.setStatus({ code: SpanStatusCode.OK });
            res.json({ success: true, result, traceId: req.traceId, spanId: req.spanId });
        }
        catch (error) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            throw error;
        }
        finally {
            span.end();
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message', traceId: req.traceId, spanId: req.spanId });
    }
});
app.get('/api/tracing/message/:messageId', (req, res) => {
    try {
        const { messageId } = req.params;
        const message = robotCopy.getMessage(messageId);
        if (message) {
            res.json({
                message,
                traceId: req.traceId,
                spanId: req.spanId
            });
        }
        else {
            res.status(404).json({
                error: 'Message not found',
                traceId: req.traceId,
                spanId: req.spanId
            });
        }
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve message',
            traceId: req.traceId,
            spanId: req.spanId
        });
    }
});
app.get('/api/tracing/trace/:traceId', (req, res) => {
    try {
        const { traceId } = req.params;
        const messages = robotCopy.getTraceMessages(traceId);
        const fullTrace = robotCopy.getFullTrace(traceId);
        res.json({
            traceId,
            messageCount: messages.length,
            messages,
            fullTrace,
            currentTrace: {
                traceId: req.traceId,
                spanId: req.spanId
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to retrieve trace',
            traceId: req.traceId,
            spanId: req.spanId
        });
    }
});
// Generate new IDs using OpenTelemetry
app.get('/api/tracing/generate', (req, res) => {
    try {
        const messageId = robotCopy.generateMessageId();
        const traceId = openTelemetryManager.generateTraceId();
        const spanId = openTelemetryManager.generateSpanId();
        res.json({
            messageId,
            traceId,
            spanId,
            currentTrace: {
                traceId: req.traceId,
                spanId: req.spanId
            }
        });
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to generate IDs',
            traceId: req.traceId,
            spanId: req.spanId
        });
    }
});
// Main studio interface
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tome Connector Studio</title>
        <!-- Extension isolation meta tags -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'none'; child-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'none'; style-src-attr 'unsafe-inline'; script-src-attr 'unsafe-inline';">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <meta name="format-detection" content="telephone=no">
        <meta name="robots" content="noindex, nofollow">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
            .hero { text-align: center; margin-bottom: 60px; }
            .hero h1 { color: white; margin-bottom: 20px; font-size: 3.5rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            .hero p { color: rgba(255,255,255,0.9); font-size: 1.3rem; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
            .hero-button { display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 50px; font-size: 1.2rem; font-weight: 600; transition: all 0.3s; box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
            .hero-button:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(0,0,0,0.4); }
            .main-content { background: white; border-radius: 20px; padding: 50px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .nav { margin: 30px 0; text-align: center; }
            .nav a { display: inline-block; margin: 10px 15px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; transition: all 0.2s; }
            .nav a:hover { background: #1d4ed8; transform: translateY(-2px); }
            .endpoint { background: #f8fafc; padding: 20px; margin: 15px 0; border-radius: 12px; border-left: 4px solid #2563eb; }
            .endpoint h3 { margin: 0 0 15px 0; color: #1e293b; }
            .endpoint p { margin: 8px 0; color: #475569; }
            .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
            .feature-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; }
            .feature-card h3 { margin: 0 0 15px 0; font-size: 1.4rem; }
            .feature-card p { margin: 0; opacity: 0.9; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Hero Section -->
            <div class="hero">
                <h1>🌊 Tome Connector Studio</h1>
                <p>A powerful studio for building and managing Tome Connector components, state machines, and integrations.</p>
                <a href="/wave-reader" class="hero-button">🚀 Open Wave Reader Editor</a>
            </div>
            
            <!-- Main Content -->
            <div class="main-content">
                <!-- Feature Grid -->
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>🎨 Component Editor</h3>
                        <p>Full-featured editor for Wave Reader components with live preview and file management</p>
                    </div>
                    <div class="feature-card">
                        <h3>⚙️ State Machines</h3>
                        <p>Visual state machine editor and management for complex component behaviors</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔍 Tracing & Monitoring</h3>
                        <p>Advanced tracing and monitoring capabilities for debugging and performance analysis</p>
                    </div>
                </div>
                
                <!-- Navigation -->
                <div class="nav">
                    <a href="/wave-reader">🎨 Wave Reader Editor</a>
                    <a href="/health">📊 Health Check</a>
                    <a href="/api/editor/status">🎛️ Editor Status</a>
                    <a href="/api/pact/features">⚙️ Pact Features</a>
                </div>
                
                <!-- Available Endpoints -->
                <h2>Available Endpoints</h2>
                <div class="endpoint">
                    <h3>🎨 Wave Reader Editor</h3>
                    <p><strong>GET /wave-reader</strong> - Main editor interface for Wave Reader components</p>
                </div>
                <div class="endpoint">
                    <h3>📊 Health & Status</h3>
                    <p><strong>GET /health</strong> - Server health check</p>
                    <p><strong>GET /api/editor/status</strong> - Editor status and configuration</p>
                </div>
                <div class="endpoint">
                    <h3>⚙️ Pact Features</h3>
                    <p><strong>GET /api/pact/features</strong> - Available Pact features</p>
                    <p><strong>GET /api/pact/backend</strong> - Pact backend status</p>
                </div>
                <div class="endpoint">
                    <h3>🔍 Tracing & Monitoring</h3>
                    <p><strong>GET /api/tracing/status</strong> - Tracing system status</p>
                    <p><strong>POST /api/tracing/message</strong> - Send tracing message</p>
                    <p><strong>GET /api/tracing/message/:messageId</strong> - Get specific message</p>
                    <p><strong>GET /api/tracing/trace/:traceId</strong> - Get trace details</p>
                    <p><strong>GET /api/tracing/generate</strong> - Generate new IDs</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});
// Wave Reader Editor Interface
app.get('/wave-reader', (req, res) => {
    const workingDir = process.env.WORKING_DIRECTORY || 'Current Directory';
    const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wave Reader Editor - Tome Connector Studio</title>
        <!-- Extension isolation meta tags -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'none'; child-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'none'; style-src-attr 'unsafe-inline'; script-src-attr 'unsafe-inline';">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <meta name="format-detection" content="telephone=no">
        <meta name="robots" content="noindex, nofollow">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8fafc; }
            .header { background: white; padding: 20px; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header h1 { margin: 0; color: #2563eb; }
            .header p { margin: 5px 0 0 0; color: #64748b; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .nav { margin: 20px 0; }
            .nav a { display: inline-block; margin: 0 15px 15px 0; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; transition: background 0.2s; }
            .nav a:hover { background: #1d4ed8; }
            .content { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .project-info { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .project-info h3 { margin: 0 0 15px 0; color: #1e293b; }
            .project-info p { margin: 5px 0; color: #475569; }
            .editor-section { margin: 30px 0; }
            .editor-section h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .component-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
            .component-card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; position: relative; }
            .component-card:hover { background: #f1f5f9; border-color: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
            .component-card.clicked { background: #dbeafe; border-color: #2563eb; }
            .component-card h4 { margin: 0 0 10px 0; color: #1e293b; }
            .component-card p { margin: 5px 0; color: #64748b; font-size: 14px; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status.active { background: #dcfce7; color: #166534; }
            .status.inactive { background: #fef2f2; color: #991b1b; }
            .component-actions { margin-top: 15px; display: flex; gap: 10px; }
            .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; }
            .btn-primary { background: #2563eb; color: white; }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-secondary { background: #64748b; color: white; }
            .btn-secondary:hover { background: #475569; }
            .btn-success { background: #059669; color: white; }
            .btn-success:hover { background: #047857; }
            .component-editor { background: white; border: 2px solid #e2e8f0; border-radius: 12px; margin-top: 30px; padding: 30px; display: none; }
            .component-editor.active { display: block; }
            .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }
            .editor-header h3 { margin: 0; color: #1e293b; }
            .close-btn { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
            .close-btn:hover { background: #dc2626; }
            .editor-content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .editor-panel { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .editor-panel h4 { margin: 0 0 15px 0; color: #1e293b; }
            .code-editor { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; line-height: 1.5; min-height: 200px; white-space: pre-wrap; }
            .file-tree { background: #f1f5f9; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .file-item { padding: 8px 12px; margin: 4px 0; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
            .file-item:hover { background: #e2e8f0; }
            .file-item.active { background: #dbeafe; color: #1e40af; }
            .loading { display: none; text-align: center; padding: 40px; color: #64748b; }
            .loading.active { display: block; }
            .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #2563eb; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="container">
                <h1>🎨 Wave Reader Editor</h1>
                <p>Tome Connector Studio - Component Middleware Editor</p>
            </div>
        </div>
        
        <div class="container">
            <div class="nav">
                <a href="/">🏠 Studio Home</a>
                <a href="/health">📊 Health</a>
                <a href="/api/editor/status">🎛️ Status</a>
                <a href="/api/pact/features">⚙️ Pact Features</a>
            </div>
            
            <div class="content">
                <div class="project-info">
                    <h3>📁 Project Information</h3>
                    <p><strong>Working Directory:</strong> ${workingDir}</p>
                    <p><strong>Studio Version:</strong> 1.2.0</p>
                    <p><strong>Status:</strong> <span class="status active">Active</span></p>
                </div>
                
                <div class="editor-section">
                    <h3>🔧 Component Middleware</h3>
                    <p>Click on any component card to open it in the editor. Manage and configure Wave Reader component middleware components.</p>
                    
                    <div class="component-list">
                        <div class="component-card" data-component="error-boundary">
                            <h4>🎯 Error Boundary</h4>
                            <p>Error handling and boundary management for components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="error-boundary">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="error-boundary">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="go-button">
                            <h4>🔘 Go Button</h4>
                            <p>Navigation and action button components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="go-button">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="go-button">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="selector-hierarchy">
                            <h4>📋 Selector Hierarchy</h4>
                            <p>Component selection and hierarchy management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="selector-hierarchy">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="selector-hierarchy">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="settings">
                            <h4>⚙️ Settings</h4>
                            <p>Configuration and settings management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="settings">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="settings">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="wave-tabs">
                            <h4>📊 Wave Tabs</h4>
                            <p>Tab-based navigation and content management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="wave-tabs">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="wave-tabs">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="scan-for-input">
                            <h4>🔍 Scan for Input</h4>
                            <p>Input detection and scanning functionality</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="scan-for-input">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="scan-for-input">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="selector-input">
                            <h4>⌨️ Selector Input</h4>
                            <p>Input selection and management tools</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="selector-input">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="selector-input">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="wave-reader">
                            <h4>🌊 Wave Reader</h4>
                            <p>Core Wave Reader functionality and components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="wave-reader">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="wave-reader">View Files</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Component Editor Panel -->
                <div class="component-editor" id="componentEditor">
                    <div class="editor-header">
                        <h3 id="editorTitle">Component Editor</h3>
                        <button class="close-btn" id="closeEditorBtn">✕ Close</button>
                    </div>
                    <div class="editor-content">
                        <div class="editor-panel">
                            <h4>📁 File Structure</h4>
                            <div class="file-tree" id="fileTree">
                                <!-- File items will be dynamically populated -->
                            </div>
                        </div>
                        <div class="editor-panel">
                            <h4>💻 Code Editor</h4>
                            <div class="code-editor" id="codeEditor" contenteditable="true">
<!-- HTML Component code will be loaded here -->
<!-- Click on a file in the file tree to view its contents -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="editor-section">
                    <h3>🚀 Quick Actions</h3>
                    <p>Common actions and shortcuts for development.</p>
                    <div class="nav">
                        <a href="/api/editor/status">📊 Check Status</a>
                        <a href="/api/pact/features">⚙️ View Features</a>
                        <a href="/api/tracing/status">🔍 Tracing Status</a>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Component data (in a real app, this would come from the server)
            const componentData = {
                'error-boundary': {
                    name: 'Error Boundary',
                    description: 'Error handling and boundary management for components',
                    files: {
                        'component.tsx': '// Error Boundary Component - React component for error handling',
                        'index.ts': 'export { ErrorBoundary } from "./component";',
                        'types.ts': 'export interface ErrorInfo { componentStack: string; }',
                        'utils.ts': 'export const logError = (error, errorInfo) => console.error("Error logged:", error, errorInfo);'
                    }
                },
                'go-button': {
                    name: 'Go Button',
                    description: 'Navigation and action button components',
                    files: {
                        'component.html': '<!DOCTYPE html><html><head><title>Go Button</title></head><body><button class="go-button">Go</button></body></html>',
                        'component.css': '.go-button { padding: 0.5rem 1rem; border-radius: 0.25rem; }',
                        'component.js': 'function handleClick() { console.log("Button clicked"); }'
                    }
                },
                'selector-hierarchy': {
                    name: 'Selector Hierarchy',
                    description: 'Component selection and hierarchy management',
                    files: {
                        'component.html': '<!DOCTYPE html><html><head><title>Selector</title></head><body><div class="selector">Selector Component</div></body></html>',
                        'component.css': '.selector { font-family: Arial, sans-serif; }',
                        'component.js': 'function initSelector() { console.log("Selector initialized"); }'
                    }
                },
                'settings': {
                    name: 'Settings',
                    description: 'Configuration and settings management',
                    files: {
                        'component.tsx': '// Settings Component - Configuration management',
                        'index.ts': 'export { Settings } from "./component";',
                        'types.ts': 'export interface Setting { key: string; value: any; }',
                        'utils.ts': 'export const validateSetting = (setting, value) => true;'
                    }
                },
                'wave-tabs': {
                    name: 'Wave Tabs',
                    description: 'Tab-based navigation and content management',
                    files: {
                        'component.tsx': '// Wave Tabs Component - Tab navigation',
                        'index.ts': 'export { WaveTabs } from "./component";',
                        'types.ts': 'export interface Tab { id: string; label: string; }',
                        'utils.ts': 'export const createTab = (id, label) => ({ id, label });'
                    }
                },
                'scan-for-input': {
                    name: 'Scan for Input',
                    description: 'Input detection and scanning functionality',
                    files: {
                        'component.tsx': '// Scan for Input Component - Input detection',
                        'index.ts': 'export { ScanForInput } from "./component";',
                        'types.ts': 'export interface ScanResult { id: string; type: string; }',
                        'utils.ts': 'export const validateInput = (input) => input.offsetWidth > 0;'
                    }
                },
                'selector-input': {
                    name: 'Selector Input',
                    description: 'Input selection and management tools',
                    files: {
                        'component.tsx': '// Selector Input Component - Input selection',
                        'index.ts': 'export { SelectorInput } from "./component";',
                        'types.ts': 'export interface SelectorSuggestion { value: string; label: string; }',
                        'utils.ts': 'export const parseSelector = (selector) => ({ tag: "div", id: null, classes: [] });'
                    }
                },
                'wave-reader': {
                    name: 'Wave Reader',
                    description: 'Core Wave Reader functionality and components',
                    files: {
                        'component.tsx': '// Wave Reader Component - Core functionality',
                        'index.ts': 'export { WaveReader } from "./component";',
                        'types.ts': 'export interface ReadingConfig { speed: number; autoStart: boolean; }',
                        'utils.ts': 'export const calculateReadingTime = (text, speed) => Math.ceil(text.split(" ").length / (60000 / speed));'
                    }
                }
            };

            // State variables
            let currentComponent = null;
            let currentFile = 'component.html';

            // Event handlers
            function openComponent(componentId) {
                console.log('🎯 Opening component:', componentId);
                currentComponent = componentId;
                const component = componentData[componentId];
                
                if (component) {
                    console.log('📁 Component found:', component);
                    
                    // Update UI
                    const editorTitle = document.getElementById('editorTitle');
                    const componentEditor = document.getElementById('componentEditor');
                    
                    if (editorTitle && componentEditor) {
                        editorTitle.textContent = \`\${component.name} Editor\`;
                        console.log('📝 Editor title updated to:', component.name);
                        
                        componentEditor.classList.add('active');
                        console.log('✅ Editor UI updated - active class added');
                        
                        // Debug: Check if the class was actually added
                        console.log('🔍 Editor classes after update:', componentEditor.className);
                        console.log('🔍 Editor display style:', window.getComputedStyle(componentEditor).display);
                        
                        // Populate file tree with actual component files
                        const fileTree = document.getElementById('fileTree');
                        if (fileTree) {
                            fileTree.innerHTML = '';
                            const availableFiles = Object.keys(component.files);
                            
                            availableFiles.forEach((filename, index) => {
                                const fileItem = document.createElement('div');
                                fileItem.className = 'file-item';
                                fileItem.setAttribute('data-file', filename);
                                fileItem.textContent = filename;
                                
                                // Make first file active by default
                                if (index === 0) {
                                    fileItem.classList.add('active');
                                }
                                
                                // Add click handler
                                fileItem.addEventListener('click', function() {
                                    const clickedFilename = this.getAttribute('data-file');
                                    loadFile(clickedFilename);
                                });
                                
                                fileTree.appendChild(fileItem);
                            });
                            
                            // Load first file
                            if (availableFiles.length > 0) {
                                loadFile(availableFiles[0]);
                            }
                        }
                        
                        // Update component cards
                        document.querySelectorAll('.component-card').forEach(card => {
                            card.classList.remove('clicked');
                        });
                        const clickedCard = document.querySelector(\`[data-component="\${componentId}"]\`);
                        if (clickedCard) {
                            clickedCard.classList.add('clicked');
                        }
                    } else {
                        console.error('❌ Required DOM elements not found:', { editorTitle, componentEditor });
                        console.log('🔍 DOM state check:');
                        console.log('  - document.getElementById("editorTitle"):', document.getElementById('editorTitle'));
                        console.log('  - document.getElementById("componentEditor"):', document.getElementById('componentEditor'));
                        console.log('  - document.readyState:', document.readyState);
                    }
                } else {
                    console.error('❌ Component not found:', componentId);
                }
            }

            function closeComponent() {
                document.getElementById('componentEditor').classList.remove('active');
                document.querySelectorAll('.component-card').forEach(card => {
                    card.classList.remove('clicked');
                });
                currentComponent = null;
            }

            function loadFile(filename) {
                if (!currentComponent) return;
                
                currentFile = filename;
                const component = componentData[currentComponent];
                const fileContent = component.files[filename];
                
                if (fileContent) {
                    // For HTML files, we'll display them in a preview format
                    if (filename.endsWith('.html')) {
                        // Create a preview container
                        const codeEditor = document.getElementById('codeEditor');
                        if (codeEditor) {
                            codeEditor.innerHTML = '<div style="padding: 20px; background: #f8f9fa; border-radius: 8px;"><h3>HTML Preview</h3><p>This is an HTML component file. You can view it in a browser or edit the HTML content.</p><div style="background: white; border: 1px solid #ddd; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; overflow-x: auto;">' + fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div></div>';
                        }
                    } else {
                        // For other file types, display as text
                        const codeEditor = document.getElementById('codeEditor');
                        if (codeEditor) {
                            codeEditor.textContent = fileContent;
                        }
                    }
                    
                    // Update file tree - safely handle missing elements
                    document.querySelectorAll('.file-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    const targetFileItem = document.querySelector(\`[data-file="\${filename}"]\`);
                    if (targetFileItem) {
                        targetFileItem.classList.add('active');
                    } else {
                        console.warn(\`⚠️ File item not found for: \${filename}\`);
                    }
                }
            }

            function viewFiles(componentId) {
                console.log('📂 Viewing files for component:', componentId);
                const component = componentData[componentId];
                
                if (component) {
                    const fileList = Object.keys(component.files).join(', ');
                    const message = \`📁 Files for \${component.name}:\n\n\${fileList}\n\nClick "Open Editor" to view and edit these files.\`;
                    alert(message);
                } else {
                    alert('❌ Component not found: ' + componentId);
                }
            }

            // Initialize event listeners when DOM is loaded
            document.addEventListener('DOMContentLoaded', function() {
                // Button click handlers
                document.addEventListener('click', function(e) {
                    const target = e.target;
                    
                    if (target.matches('[data-action="open-editor"]')) {
                        const componentId = target.getAttribute('data-component');
                        openComponent(componentId);
                    } else if (target.matches('[data-action="view-files"]')) {
                        const componentId = target.getAttribute('data-component');
                        viewFiles(componentId);
                    }
                });

                // Close editor button
                document.getElementById('closeEditorBtn').addEventListener('click', closeComponent);

                // File tree is now populated dynamically in openComponent function

                console.log('🎨 Wave Reader Editor initialized successfully!');
            });
        </script>
    </body>
    </html>
  `;
    // Process the template to remove JSX and handle variables
    // Temporarily disable template processing to debug the structure
    // const processedTemplate = TemplateProcessor.renderComponentTemplate(template, 'Wave Reader');
    // res.send(processedTemplate);
    // Send the raw template for now to debug the structure
    res.send(template);
});
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Editor server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        availableEndpoints: [
            'GET /health',
            'GET /api/editor/status',
            'GET /api/pact/features',
            'GET /api/pact/backend',
            'GET /api/tracing/status',
            'POST /api/tracing/message',
            'GET /api/tracing/message/:messageId',
            'GET /api/tracing/trace/:traceId',
            'GET /api/tracing/generate'
        ]
    });
});
// Start server
async function startServer() {
    try {
        // Start listening
        app.listen(EDITOR_CONFIG.port, () => {
            console.log(`🚀 TomeConnector Editor Server running on port ${EDITOR_CONFIG.port}`);
            console.log(`🔍 Health check at http://localhost:${EDITOR_CONFIG.port}/health`);
            console.log(`🎛️  Editor status at http://localhost:${EDITOR_CONFIG.port}/api/editor/status`);
            console.log(`⚙️  Pact features at http://localhost:${EDITOR_CONFIG.port}/api/pact/features`);
            console.log(`🔍 Tracing at http://localhost:${EDITOR_CONFIG.port}/api/tracing/status`);
        });
    }
    catch (error) {
        console.error('Failed to start editor server:', error);
        process.exit(1);
    }
}
// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}

export { app, robotCopy, startServer };
//# sourceMappingURL=editor-server.js.map
