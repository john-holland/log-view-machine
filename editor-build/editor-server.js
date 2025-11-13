import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SpanStatusCode } from '@opentelemetry/api';
import React from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign, interpret } from 'xstate';
import require$$0 from 'buffer';
import require$$3 from 'stream';
import require$$5 from 'util';
import require$$1 from 'crypto';
import fs from 'fs';
import path from 'path';

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
        // Response handling
        Object.defineProperty(this, "responseHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        this.config = {
            unleashUrl: 'http://localhost:4242/api',
            unleashClientKey: 'default:development.unleash-insecure-api-token',
            unleashAppName: 'fish-burger-frontend',
            unleashEnvironment: 'development',
            apiPath: '/api/',
            traceApiPath: '/api/trace/',
            messageApiPath: '/api/message/',
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
        const apiPath = this.config.apiPath;
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
            const response = await fetch(`${backendUrl}${apiPath}${action}`, {
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
    // Fish Burger example methods have been moved to:
    // example/node-example/src/fish-burger-robotcopy-extensions.js
    // This keeps the core RobotCopy class clean and app-agnostic
    async getTrace(traceId) {
        const backendUrl = await this.getBackendUrl();
        const traceApiPath = this.config.traceApiPath;
        try {
            const response = await fetch(`${backendUrl}${traceApiPath}${traceId}`);
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
        const messageApiPath = this.config.messageApiPath;
        try {
            const response = await fetch(`${backendUrl}${messageApiPath}${messageId}`);
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
    onResponse(channel, handler) {
        // Store the handler for the specified channel
        this.responseHandlers.set(channel, handler);
        console.log(`Registered response handler for channel: ${channel}`);
    }
    // Method to trigger response handlers (for testing or manual triggering)
    triggerResponse(channel, response) {
        const handler = this.responseHandlers.get(channel);
        if (handler) {
            console.log(`Triggering response handler for channel: ${channel}`, response);
            handler(response);
        }
        else {
            console.warn(`No response handler found for channel: ${channel}`);
        }
    }
    // Method to remove response handlers
    removeResponseHandler(channel) {
        this.responseHandlers.delete(channel);
        console.log(`Removed response handler for channel: ${channel}`);
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
    startSpan(name, _options) {
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

/**
 * ViewStack
 *
 * Manages a stack of React components for stateless rendering.
 * Supports clearing and composing views for the Tome architecture.
 */
class ViewStack {
    constructor() {
        Object.defineProperty(this, "stack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "currentView", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ''
        });
        Object.defineProperty(this, "lastViewCleared", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    /**
     * Append a new view to the stack
     */
    append(key, component) {
        this.stack.push({
            key,
            component,
            timestamp: Date.now()
        });
        this.currentView = key;
    }
    /**
     * Clear the entire view stack
     * Resets to empty state and updates lastViewCleared timestamp
     */
    clear() {
        this.stack = [];
        this.currentView = '';
        this.lastViewCleared = Date.now();
    }
    /**
     * Compose all views in the stack into a single React fragment
     */
    compose() {
        if (this.stack.length === 0) {
            return null;
        }
        if (this.stack.length === 1) {
            return this.stack[0].component;
        }
        // Compose multiple views with unique keys
        return React.createElement(React.Fragment, null, ...this.stack.map((entry, index) => React.createElement(React.Fragment, { key: `${entry.key}-${entry.timestamp}-${index}` }, entry.component)));
    }
    /**
     * Get the current view key
     */
    getCurrentView() {
        return this.currentView;
    }
    /**
     * Get the timestamp of the last view clear operation
     */
    getLastViewCleared() {
        return this.lastViewCleared;
    }
    /**
     * Get the number of views in the stack
     */
    getStackSize() {
        return this.stack.length;
    }
    /**
     * Check if the stack is empty
     */
    isEmpty() {
        return this.stack.length === 0;
    }
    /**
     * Get a copy of the current stack (for debugging)
     */
    getStack() {
        return [...this.stack];
    }
}

/**
 * MachineRouter
 *
 * Handles routing messages between machines using path-based addressing
 */
class MachineRouter {
    constructor() {
        Object.defineProperty(this, "machines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Router for managing hierarchical machine communication
    }
    /**
     * Register a machine with a path
     */
    register(path, machine) {
        this.machines.set(path, machine);
    }
    /**
     * Unregister a machine
     */
    unregister(path) {
        this.machines.delete(path);
    }
    /**
     * Resolve a path to a machine (absolute paths only)
     * For relative paths, use resolveRelative() with a context machine
     */
    resolve(path) {
        return this.machines.get(path) || null;
    }
    /**
     * Resolve hierarchical paths like "Parent.Child.GrandChild"
     */
    resolveHierarchical(path) {
        const parts = path.split('.');
        let current = this.machines.get(parts[0]);
        for (let i = 1; i < parts.length && current; i++) {
            // Try to get sub-machine
            if (current.subMachines && current.subMachines.get) {
                current = current.subMachines.get(parts[i]);
            }
            else if (current.router && current.router.machines) {
                current = current.router.machines.get(parts[i]);
            }
            else {
                return null;
            }
        }
        return current;
    }
    /**
     * Resolve relative paths from a context machine
     * Supports: '.', '..', './', '../', '../../', etc.
     */
    resolveRelative(path, contextMachine) {
        // Handle absolute paths (no . or ..)
        if (!path.startsWith('.')) {
            return this.resolveHierarchical(path);
        }
        // Handle current machine reference (.)
        if (path === '.') {
            return contextMachine;
        }
        // Handle parent machine reference (..)
        if (path === '..') {
            return contextMachine.parentMachine || null;
        }
        // Handle relative child (./ prefix)
        if (path.startsWith('./')) {
            const subPath = path.substring(2);
            return this.navigateFromMachine(contextMachine, subPath);
        }
        // Handle relative parent (../ prefix)
        if (path.startsWith('../')) {
            const parent = contextMachine.parentMachine;
            if (!parent) {
                throw new Error(`No parent machine found for relative path: ${path}`);
            }
            const remainingPath = path.substring(3);
            if (!remainingPath) {
                return parent;
            }
            return this.navigateFromMachine(parent, remainingPath);
        }
        return null;
    }
    /**
     * Navigate from a specific machine following a path
     * Supports '/', '.', and '..' as path separators
     */
    navigateFromMachine(machine, path) {
        if (!path)
            return machine;
        const parts = path.split('/');
        let current = machine;
        for (const part of parts) {
            if (!part || part === '.') {
                continue; // Empty or stay at current
            }
            else if (part === '..') {
                current = current.parentMachine;
                if (!current)
                    return null;
            }
            else {
                // Navigate to sub-machine
                if (current.subMachines && current.subMachines.get) {
                    current = current.subMachines.get(part);
                }
                else if (current.router && current.router.machines) {
                    current = current.router.machines.get(part);
                }
                else {
                    return null;
                }
                if (!current)
                    return null;
            }
        }
        return current;
    }
    /**
     * Send a message to a machine at the specified path
     */
    send(path, event, data) {
        const machine = this.resolve(path);
        if (!machine) {
            console.warn(`🌊 TomeBase: Cannot resolve path "${path}"`);
            return Promise.resolve({ success: false, error: `Path not found: ${path}` });
        }
        // If machine has a send method, use it
        if (machine.send && typeof machine.send === 'function') {
            try {
                const result = machine.send({ type: event, ...data });
                return Promise.resolve(result);
            }
            catch (error) {
                console.error(`🌊 TomeBase: Error sending to "${path}":`, error);
                return Promise.resolve({ success: false, error });
            }
        }
        console.warn(`🌊 TomeBase: Machine at "${path}" has no send method`);
        return Promise.resolve({ success: false, error: 'No send method' });
    }
}
/**
 * TomeBase
 *
 * Base class for all Tome modules with observable pattern and view stack integration
 */
class TomeBase {
    constructor() {
        Object.defineProperty(this, "viewStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "viewKeyObservers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "currentViewKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "router", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "machine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "childTomes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.viewStack = new ViewStack();
        this.viewKeyObservers = new Set();
        this.currentViewKey = 'initial';
        this.router = new MachineRouter();
        this.machine = null;
        this.childTomes = new Map();
    }
    /**
     * Get the current view key
     */
    getViewKey() {
        return this.currentViewKey;
    }
    /**
     * Observe view key changes
     * Returns an unsubscribe function
     */
    observeViewKey(callback) {
        this.viewKeyObservers.add(callback);
        // Immediately call with current value
        callback(this.currentViewKey);
        // Return unsubscribe function
        return () => {
            this.viewKeyObservers.delete(callback);
        };
    }
    /**
     * Update the view key and notify observers
     */
    updateViewKey(newKey) {
        if (this.currentViewKey !== newKey) {
            this.currentViewKey = newKey;
            this.notifyViewKeyObservers();
        }
    }
    /**
     * Notify all view key observers
     */
    notifyViewKeyObservers() {
        this.viewKeyObservers.forEach(observer => {
            try {
                observer(this.currentViewKey);
            }
            catch (error) {
                console.error('🌊 TomeBase: Error in view key observer:', error);
            }
        });
    }
    /**
     * Clear the view stack
     */
    clear() {
        this.viewStack.clear();
        this.updateViewKey(`cleared-${Date.now()}`);
    }
    /**
     * Append a view to the stack
     */
    appendView(key, component) {
        this.viewStack.append(key, component);
        this.updateViewKey(key);
    }
    /**
     * Render the composed view from the view stack
     * Note: For ViewStateMachines, rendering is handled by the view() function in withState
     * This method returns the composed view stack for display
     */
    render() {
        // If we have a machine with a render method, use it
        if (this.machine && typeof this.machine.render === 'function') {
            return this.machine.render();
        }
        // Otherwise compose from view stack
        return this.viewStack.compose();
    }
    /**
     * Register a child tome
     */
    registerChild(path, tome) {
        this.childTomes.set(path, tome);
        this.router.register(path, tome);
        // Note: Parent-child relationships are handled via machine.parentMachine property
    }
    /**
     * Unregister a child tome
     */
    unregisterChild(path) {
        this.childTomes.delete(path);
        this.router.unregister(path);
    }
    /**
     * Send a message using hierarchical routing
     */
    send(path, event, data) {
        return this.router.send(path, event, data);
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.viewKeyObservers.clear();
        this.viewStack.clear();
        this.childTomes.forEach(child => child.cleanup());
        this.childTomes.clear();
    }
    /**
     * Get debug information about the tome
     */
    getDebugInfo() {
        return {
            currentViewKey: this.currentViewKey,
            viewStackSize: this.viewStack.getStackSize(),
            observerCount: this.viewKeyObservers.size,
            childTomes: Array.from(this.childTomes.keys()),
            lastViewCleared: this.viewStack.getLastViewCleared()
        };
    }
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var jsxRuntime = {exports: {}};

var reactJsxRuntime_production_min = {};

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production_min;

function requireReactJsxRuntime_production_min () {
	if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
	hasRequiredReactJsxRuntime_production_min = 1;
var f=React,k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p={key:!0,ref:!0,__self:!0,__source:!0};
	function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m.call(a,b)&&!p.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a)void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}reactJsxRuntime_production_min.Fragment=l;reactJsxRuntime_production_min.jsx=q;reactJsxRuntime_production_min.jsxs=q;
	return reactJsxRuntime_production_min;
}

var reactJsxRuntime_development = {};

/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_development;

function requireReactJsxRuntime_development () {
	if (hasRequiredReactJsxRuntime_development) return reactJsxRuntime_development;
	hasRequiredReactJsxRuntime_development = 1;

	if (process.env.NODE_ENV !== "production") {
	  (function() {

	var React$1 = React;

	// ATTENTION
	// When adding new symbols to this file,
	// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
	// The Symbol used to tag the ReactElement-like types.
	var REACT_ELEMENT_TYPE = Symbol.for('react.element');
	var REACT_PORTAL_TYPE = Symbol.for('react.portal');
	var REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
	var REACT_STRICT_MODE_TYPE = Symbol.for('react.strict_mode');
	var REACT_PROFILER_TYPE = Symbol.for('react.profiler');
	var REACT_PROVIDER_TYPE = Symbol.for('react.provider');
	var REACT_CONTEXT_TYPE = Symbol.for('react.context');
	var REACT_FORWARD_REF_TYPE = Symbol.for('react.forward_ref');
	var REACT_SUSPENSE_TYPE = Symbol.for('react.suspense');
	var REACT_SUSPENSE_LIST_TYPE = Symbol.for('react.suspense_list');
	var REACT_MEMO_TYPE = Symbol.for('react.memo');
	var REACT_LAZY_TYPE = Symbol.for('react.lazy');
	var REACT_OFFSCREEN_TYPE = Symbol.for('react.offscreen');
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	var FAUX_ITERATOR_SYMBOL = '@@iterator';
	function getIteratorFn(maybeIterable) {
	  if (maybeIterable === null || typeof maybeIterable !== 'object') {
	    return null;
	  }

	  var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];

	  if (typeof maybeIterator === 'function') {
	    return maybeIterator;
	  }

	  return null;
	}

	var ReactSharedInternals = React$1.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

	function error(format) {
	  {
	    {
	      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
	        args[_key2 - 1] = arguments[_key2];
	      }

	      printWarning('error', format, args);
	    }
	  }
	}

	function printWarning(level, format, args) {
	  // When changing this logic, you might want to also
	  // update consoleWithStackDev.www.js as well.
	  {
	    var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
	    var stack = ReactDebugCurrentFrame.getStackAddendum();

	    if (stack !== '') {
	      format += '%s';
	      args = args.concat([stack]);
	    } // eslint-disable-next-line react-internal/safe-string-coercion


	    var argsWithFormat = args.map(function (item) {
	      return String(item);
	    }); // Careful: RN currently depends on this prefix

	    argsWithFormat.unshift('Warning: ' + format); // We intentionally don't use spread (or .apply) directly because it
	    // breaks IE9: https://github.com/facebook/react/issues/13610
	    // eslint-disable-next-line react-internal/no-production-logging

	    Function.prototype.apply.call(console[level], console, argsWithFormat);
	  }
	}

	// -----------------------------------------------------------------------------

	var enableScopeAPI = false; // Experimental Create Event Handle API.
	var enableCacheElement = false;
	var enableTransitionTracing = false; // No known bugs, but needs performance testing

	var enableLegacyHidden = false; // Enables unstable_avoidThisFallback feature in Fiber
	// stuff. Intended to enable React core members to more easily debug scheduling
	// issues in DEV builds.

	var enableDebugTracing = false; // Track which Fiber(s) schedule render work.

	var REACT_MODULE_REFERENCE;

	{
	  REACT_MODULE_REFERENCE = Symbol.for('react.module.reference');
	}

	function isValidElementType(type) {
	  if (typeof type === 'string' || typeof type === 'function') {
	    return true;
	  } // Note: typeof might be other than 'symbol' or 'number' (e.g. if it's a polyfill).


	  if (type === REACT_FRAGMENT_TYPE || type === REACT_PROFILER_TYPE || enableDebugTracing  || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || enableLegacyHidden  || type === REACT_OFFSCREEN_TYPE || enableScopeAPI  || enableCacheElement  || enableTransitionTracing ) {
	    return true;
	  }

	  if (typeof type === 'object' && type !== null) {
	    if (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || // This needs to include all possible module reference object
	    // types supported by any Flight configuration anywhere since
	    // we don't know which Flight build this will end up being used
	    // with.
	    type.$$typeof === REACT_MODULE_REFERENCE || type.getModuleId !== undefined) {
	      return true;
	    }
	  }

	  return false;
	}

	function getWrappedName(outerType, innerType, wrapperName) {
	  var displayName = outerType.displayName;

	  if (displayName) {
	    return displayName;
	  }

	  var functionName = innerType.displayName || innerType.name || '';
	  return functionName !== '' ? wrapperName + "(" + functionName + ")" : wrapperName;
	} // Keep in sync with react-reconciler/getComponentNameFromFiber


	function getContextName(type) {
	  return type.displayName || 'Context';
	} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.


	function getComponentNameFromType(type) {
	  if (type == null) {
	    // Host root, text node or just invalid type.
	    return null;
	  }

	  {
	    if (typeof type.tag === 'number') {
	      error('Received an unexpected object in getComponentNameFromType(). ' + 'This is likely a bug in React. Please file an issue.');
	    }
	  }

	  if (typeof type === 'function') {
	    return type.displayName || type.name || null;
	  }

	  if (typeof type === 'string') {
	    return type;
	  }

	  switch (type) {
	    case REACT_FRAGMENT_TYPE:
	      return 'Fragment';

	    case REACT_PORTAL_TYPE:
	      return 'Portal';

	    case REACT_PROFILER_TYPE:
	      return 'Profiler';

	    case REACT_STRICT_MODE_TYPE:
	      return 'StrictMode';

	    case REACT_SUSPENSE_TYPE:
	      return 'Suspense';

	    case REACT_SUSPENSE_LIST_TYPE:
	      return 'SuspenseList';

	  }

	  if (typeof type === 'object') {
	    switch (type.$$typeof) {
	      case REACT_CONTEXT_TYPE:
	        var context = type;
	        return getContextName(context) + '.Consumer';

	      case REACT_PROVIDER_TYPE:
	        var provider = type;
	        return getContextName(provider._context) + '.Provider';

	      case REACT_FORWARD_REF_TYPE:
	        return getWrappedName(type, type.render, 'ForwardRef');

	      case REACT_MEMO_TYPE:
	        var outerName = type.displayName || null;

	        if (outerName !== null) {
	          return outerName;
	        }

	        return getComponentNameFromType(type.type) || 'Memo';

	      case REACT_LAZY_TYPE:
	        {
	          var lazyComponent = type;
	          var payload = lazyComponent._payload;
	          var init = lazyComponent._init;

	          try {
	            return getComponentNameFromType(init(payload));
	          } catch (x) {
	            return null;
	          }
	        }

	      // eslint-disable-next-line no-fallthrough
	    }
	  }

	  return null;
	}

	var assign = Object.assign;

	// Helpers to patch console.logs to avoid logging during side-effect free
	// replaying on render function. This currently only patches the object
	// lazily which won't cover if the log function was extracted eagerly.
	// We could also eagerly patch the method.
	var disabledDepth = 0;
	var prevLog;
	var prevInfo;
	var prevWarn;
	var prevError;
	var prevGroup;
	var prevGroupCollapsed;
	var prevGroupEnd;

	function disabledLog() {}

	disabledLog.__reactDisabledLog = true;
	function disableLogs() {
	  {
	    if (disabledDepth === 0) {
	      /* eslint-disable react-internal/no-production-logging */
	      prevLog = console.log;
	      prevInfo = console.info;
	      prevWarn = console.warn;
	      prevError = console.error;
	      prevGroup = console.group;
	      prevGroupCollapsed = console.groupCollapsed;
	      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

	      var props = {
	        configurable: true,
	        enumerable: true,
	        value: disabledLog,
	        writable: true
	      }; // $FlowFixMe Flow thinks console is immutable.

	      Object.defineProperties(console, {
	        info: props,
	        log: props,
	        warn: props,
	        error: props,
	        group: props,
	        groupCollapsed: props,
	        groupEnd: props
	      });
	      /* eslint-enable react-internal/no-production-logging */
	    }

	    disabledDepth++;
	  }
	}
	function reenableLogs() {
	  {
	    disabledDepth--;

	    if (disabledDepth === 0) {
	      /* eslint-disable react-internal/no-production-logging */
	      var props = {
	        configurable: true,
	        enumerable: true,
	        writable: true
	      }; // $FlowFixMe Flow thinks console is immutable.

	      Object.defineProperties(console, {
	        log: assign({}, props, {
	          value: prevLog
	        }),
	        info: assign({}, props, {
	          value: prevInfo
	        }),
	        warn: assign({}, props, {
	          value: prevWarn
	        }),
	        error: assign({}, props, {
	          value: prevError
	        }),
	        group: assign({}, props, {
	          value: prevGroup
	        }),
	        groupCollapsed: assign({}, props, {
	          value: prevGroupCollapsed
	        }),
	        groupEnd: assign({}, props, {
	          value: prevGroupEnd
	        })
	      });
	      /* eslint-enable react-internal/no-production-logging */
	    }

	    if (disabledDepth < 0) {
	      error('disabledDepth fell below zero. ' + 'This is a bug in React. Please file an issue.');
	    }
	  }
	}

	var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
	var prefix;
	function describeBuiltInComponentFrame(name, source, ownerFn) {
	  {
	    if (prefix === undefined) {
	      // Extract the VM specific prefix used by each line.
	      try {
	        throw Error();
	      } catch (x) {
	        var match = x.stack.trim().match(/\n( *(at )?)/);
	        prefix = match && match[1] || '';
	      }
	    } // We use the prefix to ensure our stacks line up with native stack frames.


	    return '\n' + prefix + name;
	  }
	}
	var reentry = false;
	var componentFrameCache;

	{
	  var PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
	  componentFrameCache = new PossiblyWeakMap();
	}

	function describeNativeComponentFrame(fn, construct) {
	  // If something asked for a stack inside a fake render, it should get ignored.
	  if ( !fn || reentry) {
	    return '';
	  }

	  {
	    var frame = componentFrameCache.get(fn);

	    if (frame !== undefined) {
	      return frame;
	    }
	  }

	  var control;
	  reentry = true;
	  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

	  Error.prepareStackTrace = undefined;
	  var previousDispatcher;

	  {
	    previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function
	    // for warnings.

	    ReactCurrentDispatcher.current = null;
	    disableLogs();
	  }

	  try {
	    // This should throw.
	    if (construct) {
	      // Something should be setting the props in the constructor.
	      var Fake = function () {
	        throw Error();
	      }; // $FlowFixMe


	      Object.defineProperty(Fake.prototype, 'props', {
	        set: function () {
	          // We use a throwing setter instead of frozen or non-writable props
	          // because that won't throw in a non-strict mode function.
	          throw Error();
	        }
	      });

	      if (typeof Reflect === 'object' && Reflect.construct) {
	        // We construct a different control for this case to include any extra
	        // frames added by the construct call.
	        try {
	          Reflect.construct(Fake, []);
	        } catch (x) {
	          control = x;
	        }

	        Reflect.construct(fn, [], Fake);
	      } else {
	        try {
	          Fake.call();
	        } catch (x) {
	          control = x;
	        }

	        fn.call(Fake.prototype);
	      }
	    } else {
	      try {
	        throw Error();
	      } catch (x) {
	        control = x;
	      }

	      fn();
	    }
	  } catch (sample) {
	    // This is inlined manually because closure doesn't do it for us.
	    if (sample && control && typeof sample.stack === 'string') {
	      // This extracts the first frame from the sample that isn't also in the control.
	      // Skipping one frame that we assume is the frame that calls the two.
	      var sampleLines = sample.stack.split('\n');
	      var controlLines = control.stack.split('\n');
	      var s = sampleLines.length - 1;
	      var c = controlLines.length - 1;

	      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
	        // We expect at least one stack frame to be shared.
	        // Typically this will be the root most one. However, stack frames may be
	        // cut off due to maximum stack limits. In this case, one maybe cut off
	        // earlier than the other. We assume that the sample is longer or the same
	        // and there for cut off earlier. So we should find the root most frame in
	        // the sample somewhere in the control.
	        c--;
	      }

	      for (; s >= 1 && c >= 0; s--, c--) {
	        // Next we find the first one that isn't the same which should be the
	        // frame that called our sample function and the control.
	        if (sampleLines[s] !== controlLines[c]) {
	          // In V8, the first line is describing the message but other VMs don't.
	          // If we're about to return the first line, and the control is also on the same
	          // line, that's a pretty good indicator that our sample threw at same line as
	          // the control. I.e. before we entered the sample frame. So we ignore this result.
	          // This can happen if you passed a class to function component, or non-function.
	          if (s !== 1 || c !== 1) {
	            do {
	              s--;
	              c--; // We may still have similar intermediate frames from the construct call.
	              // The next one that isn't the same should be our match though.

	              if (c < 0 || sampleLines[s] !== controlLines[c]) {
	                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
	                var _frame = '\n' + sampleLines[s].replace(' at new ', ' at '); // If our component frame is labeled "<anonymous>"
	                // but we have a user-provided "displayName"
	                // splice it in to make the stack more readable.


	                if (fn.displayName && _frame.includes('<anonymous>')) {
	                  _frame = _frame.replace('<anonymous>', fn.displayName);
	                }

	                {
	                  if (typeof fn === 'function') {
	                    componentFrameCache.set(fn, _frame);
	                  }
	                } // Return the line we found.


	                return _frame;
	              }
	            } while (s >= 1 && c >= 0);
	          }

	          break;
	        }
	      }
	    }
	  } finally {
	    reentry = false;

	    {
	      ReactCurrentDispatcher.current = previousDispatcher;
	      reenableLogs();
	    }

	    Error.prepareStackTrace = previousPrepareStackTrace;
	  } // Fallback to just using the name if we couldn't make it throw.


	  var name = fn ? fn.displayName || fn.name : '';
	  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : '';

	  {
	    if (typeof fn === 'function') {
	      componentFrameCache.set(fn, syntheticFrame);
	    }
	  }

	  return syntheticFrame;
	}
	function describeFunctionComponentFrame(fn, source, ownerFn) {
	  {
	    return describeNativeComponentFrame(fn, false);
	  }
	}

	function shouldConstruct(Component) {
	  var prototype = Component.prototype;
	  return !!(prototype && prototype.isReactComponent);
	}

	function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {

	  if (type == null) {
	    return '';
	  }

	  if (typeof type === 'function') {
	    {
	      return describeNativeComponentFrame(type, shouldConstruct(type));
	    }
	  }

	  if (typeof type === 'string') {
	    return describeBuiltInComponentFrame(type);
	  }

	  switch (type) {
	    case REACT_SUSPENSE_TYPE:
	      return describeBuiltInComponentFrame('Suspense');

	    case REACT_SUSPENSE_LIST_TYPE:
	      return describeBuiltInComponentFrame('SuspenseList');
	  }

	  if (typeof type === 'object') {
	    switch (type.$$typeof) {
	      case REACT_FORWARD_REF_TYPE:
	        return describeFunctionComponentFrame(type.render);

	      case REACT_MEMO_TYPE:
	        // Memo may contain any component type so we recursively resolve it.
	        return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);

	      case REACT_LAZY_TYPE:
	        {
	          var lazyComponent = type;
	          var payload = lazyComponent._payload;
	          var init = lazyComponent._init;

	          try {
	            // Lazy may contain any component type so we recursively resolve it.
	            return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
	          } catch (x) {}
	        }
	    }
	  }

	  return '';
	}

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	var loggedTypeFailures = {};
	var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

	function setCurrentlyValidatingElement(element) {
	  {
	    if (element) {
	      var owner = element._owner;
	      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
	      ReactDebugCurrentFrame.setExtraStackFrame(stack);
	    } else {
	      ReactDebugCurrentFrame.setExtraStackFrame(null);
	    }
	  }
	}

	function checkPropTypes(typeSpecs, values, location, componentName, element) {
	  {
	    // $FlowFixMe This is okay but Flow doesn't know it.
	    var has = Function.call.bind(hasOwnProperty);

	    for (var typeSpecName in typeSpecs) {
	      if (has(typeSpecs, typeSpecName)) {
	        var error$1 = void 0; // Prop type validation may throw. In case they do, we don't want to
	        // fail the render phase where it didn't fail before. So we log it.
	        // After these have been cleaned up, we'll let them throw.

	        try {
	          // This is intentionally an invariant that gets caught. It's the same
	          // behavior as without this statement except with a better message.
	          if (typeof typeSpecs[typeSpecName] !== 'function') {
	            // eslint-disable-next-line react-internal/prod-error-codes
	            var err = Error((componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' + 'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' + 'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.');
	            err.name = 'Invariant Violation';
	            throw err;
	          }

	          error$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED');
	        } catch (ex) {
	          error$1 = ex;
	        }

	        if (error$1 && !(error$1 instanceof Error)) {
	          setCurrentlyValidatingElement(element);

	          error('%s: type specification of %s' + ' `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error$1);

	          setCurrentlyValidatingElement(null);
	        }

	        if (error$1 instanceof Error && !(error$1.message in loggedTypeFailures)) {
	          // Only monitor this failure once because there tends to be a lot of the
	          // same error.
	          loggedTypeFailures[error$1.message] = true;
	          setCurrentlyValidatingElement(element);

	          error('Failed %s type: %s', location, error$1.message);

	          setCurrentlyValidatingElement(null);
	        }
	      }
	    }
	  }
	}

	var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

	function isArray(a) {
	  return isArrayImpl(a);
	}

	/*
	 * The `'' + value` pattern (used in in perf-sensitive code) throws for Symbol
	 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
	 *
	 * The functions in this module will throw an easier-to-understand,
	 * easier-to-debug exception with a clear errors message message explaining the
	 * problem. (Instead of a confusing exception thrown inside the implementation
	 * of the `value` object).
	 */
	// $FlowFixMe only called in DEV, so void return is not possible.
	function typeName(value) {
	  {
	    // toStringTag is needed for namespaced types like Temporal.Instant
	    var hasToStringTag = typeof Symbol === 'function' && Symbol.toStringTag;
	    var type = hasToStringTag && value[Symbol.toStringTag] || value.constructor.name || 'Object';
	    return type;
	  }
	} // $FlowFixMe only called in DEV, so void return is not possible.


	function willCoercionThrow(value) {
	  {
	    try {
	      testStringCoercion(value);
	      return false;
	    } catch (e) {
	      return true;
	    }
	  }
	}

	function testStringCoercion(value) {
	  // If you ended up here by following an exception call stack, here's what's
	  // happened: you supplied an object or symbol value to React (as a prop, key,
	  // DOM attribute, CSS property, string ref, etc.) and when React tried to
	  // coerce it to a string using `'' + value`, an exception was thrown.
	  //
	  // The most common types that will cause this exception are `Symbol` instances
	  // and Temporal objects like `Temporal.Instant`. But any object that has a
	  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
	  // exception. (Library authors do this to prevent users from using built-in
	  // numeric operators like `+` or comparison operators like `>=` because custom
	  // methods are needed to perform accurate arithmetic or comparison.)
	  //
	  // To fix the problem, coerce this object or symbol value to a string before
	  // passing it to React. The most reliable way is usually `String(value)`.
	  //
	  // To find which value is throwing, check the browser or debugger console.
	  // Before this exception was thrown, there should be `console.error` output
	  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
	  // problem and how that type was used: key, atrribute, input value prop, etc.
	  // In most cases, this console output also shows the component and its
	  // ancestor components where the exception happened.
	  //
	  // eslint-disable-next-line react-internal/safe-string-coercion
	  return '' + value;
	}
	function checkKeyStringCoercion(value) {
	  {
	    if (willCoercionThrow(value)) {
	      error('The provided key is an unsupported type %s.' + ' This value must be coerced to a string before before using it here.', typeName(value));

	      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
	    }
	  }
	}

	var ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;
	var RESERVED_PROPS = {
	  key: true,
	  ref: true,
	  __self: true,
	  __source: true
	};
	var specialPropKeyWarningShown;
	var specialPropRefWarningShown;
	var didWarnAboutStringRefs;

	{
	  didWarnAboutStringRefs = {};
	}

	function hasValidRef(config) {
	  {
	    if (hasOwnProperty.call(config, 'ref')) {
	      var getter = Object.getOwnPropertyDescriptor(config, 'ref').get;

	      if (getter && getter.isReactWarning) {
	        return false;
	      }
	    }
	  }

	  return config.ref !== undefined;
	}

	function hasValidKey(config) {
	  {
	    if (hasOwnProperty.call(config, 'key')) {
	      var getter = Object.getOwnPropertyDescriptor(config, 'key').get;

	      if (getter && getter.isReactWarning) {
	        return false;
	      }
	    }
	  }

	  return config.key !== undefined;
	}

	function warnIfStringRefCannotBeAutoConverted(config, self) {
	  {
	    if (typeof config.ref === 'string' && ReactCurrentOwner.current && self && ReactCurrentOwner.current.stateNode !== self) {
	      var componentName = getComponentNameFromType(ReactCurrentOwner.current.type);

	      if (!didWarnAboutStringRefs[componentName]) {
	        error('Component "%s" contains the string ref "%s". ' + 'Support for string refs will be removed in a future major release. ' + 'This case cannot be automatically converted to an arrow function. ' + 'We ask you to manually fix this case by using useRef() or createRef() instead. ' + 'Learn more about using refs safely here: ' + 'https://reactjs.org/link/strict-mode-string-ref', getComponentNameFromType(ReactCurrentOwner.current.type), config.ref);

	        didWarnAboutStringRefs[componentName] = true;
	      }
	    }
	  }
	}

	function defineKeyPropWarningGetter(props, displayName) {
	  {
	    var warnAboutAccessingKey = function () {
	      if (!specialPropKeyWarningShown) {
	        specialPropKeyWarningShown = true;

	        error('%s: `key` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
	      }
	    };

	    warnAboutAccessingKey.isReactWarning = true;
	    Object.defineProperty(props, 'key', {
	      get: warnAboutAccessingKey,
	      configurable: true
	    });
	  }
	}

	function defineRefPropWarningGetter(props, displayName) {
	  {
	    var warnAboutAccessingRef = function () {
	      if (!specialPropRefWarningShown) {
	        specialPropRefWarningShown = true;

	        error('%s: `ref` is not a prop. Trying to access it will result ' + 'in `undefined` being returned. If you need to access the same ' + 'value within the child component, you should pass it as a different ' + 'prop. (https://reactjs.org/link/special-props)', displayName);
	      }
	    };

	    warnAboutAccessingRef.isReactWarning = true;
	    Object.defineProperty(props, 'ref', {
	      get: warnAboutAccessingRef,
	      configurable: true
	    });
	  }
	}
	/**
	 * Factory method to create a new React element. This no longer adheres to
	 * the class pattern, so do not use new to call it. Also, instanceof check
	 * will not work. Instead test $$typeof field against Symbol.for('react.element') to check
	 * if something is a React Element.
	 *
	 * @param {*} type
	 * @param {*} props
	 * @param {*} key
	 * @param {string|object} ref
	 * @param {*} owner
	 * @param {*} self A *temporary* helper to detect places where `this` is
	 * different from the `owner` when React.createElement is called, so that we
	 * can warn. We want to get rid of owner and replace string `ref`s with arrow
	 * functions, and as long as `this` and owner are the same, there will be no
	 * change in behavior.
	 * @param {*} source An annotation object (added by a transpiler or otherwise)
	 * indicating filename, line number, and/or other information.
	 * @internal
	 */


	var ReactElement = function (type, key, ref, self, source, owner, props) {
	  var element = {
	    // This tag allows us to uniquely identify this as a React Element
	    $$typeof: REACT_ELEMENT_TYPE,
	    // Built-in properties that belong on the element
	    type: type,
	    key: key,
	    ref: ref,
	    props: props,
	    // Record the component responsible for creating this element.
	    _owner: owner
	  };

	  {
	    // The validation flag is currently mutative. We put it on
	    // an external backing store so that we can freeze the whole object.
	    // This can be replaced with a WeakMap once they are implemented in
	    // commonly used development environments.
	    element._store = {}; // To make comparing ReactElements easier for testing purposes, we make
	    // the validation flag non-enumerable (where possible, which should
	    // include every environment we run tests in), so the test framework
	    // ignores it.

	    Object.defineProperty(element._store, 'validated', {
	      configurable: false,
	      enumerable: false,
	      writable: true,
	      value: false
	    }); // self and source are DEV only properties.

	    Object.defineProperty(element, '_self', {
	      configurable: false,
	      enumerable: false,
	      writable: false,
	      value: self
	    }); // Two elements created in two different places should be considered
	    // equal for testing purposes and therefore we hide it from enumeration.

	    Object.defineProperty(element, '_source', {
	      configurable: false,
	      enumerable: false,
	      writable: false,
	      value: source
	    });

	    if (Object.freeze) {
	      Object.freeze(element.props);
	      Object.freeze(element);
	    }
	  }

	  return element;
	};
	/**
	 * https://github.com/reactjs/rfcs/pull/107
	 * @param {*} type
	 * @param {object} props
	 * @param {string} key
	 */

	function jsxDEV(type, config, maybeKey, source, self) {
	  {
	    var propName; // Reserved names are extracted

	    var props = {};
	    var key = null;
	    var ref = null; // Currently, key can be spread in as a prop. This causes a potential
	    // issue if key is also explicitly declared (ie. <div {...props} key="Hi" />
	    // or <div key="Hi" {...props} /> ). We want to deprecate key spread,
	    // but as an intermediary step, we will use jsxDEV for everything except
	    // <div {...props} key="Hi" />, because we aren't currently able to tell if
	    // key is explicitly declared to be undefined or not.

	    if (maybeKey !== undefined) {
	      {
	        checkKeyStringCoercion(maybeKey);
	      }

	      key = '' + maybeKey;
	    }

	    if (hasValidKey(config)) {
	      {
	        checkKeyStringCoercion(config.key);
	      }

	      key = '' + config.key;
	    }

	    if (hasValidRef(config)) {
	      ref = config.ref;
	      warnIfStringRefCannotBeAutoConverted(config, self);
	    } // Remaining properties are added to a new props object


	    for (propName in config) {
	      if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
	        props[propName] = config[propName];
	      }
	    } // Resolve default props


	    if (type && type.defaultProps) {
	      var defaultProps = type.defaultProps;

	      for (propName in defaultProps) {
	        if (props[propName] === undefined) {
	          props[propName] = defaultProps[propName];
	        }
	      }
	    }

	    if (key || ref) {
	      var displayName = typeof type === 'function' ? type.displayName || type.name || 'Unknown' : type;

	      if (key) {
	        defineKeyPropWarningGetter(props, displayName);
	      }

	      if (ref) {
	        defineRefPropWarningGetter(props, displayName);
	      }
	    }

	    return ReactElement(type, key, ref, self, source, ReactCurrentOwner.current, props);
	  }
	}

	var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner;
	var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;

	function setCurrentlyValidatingElement$1(element) {
	  {
	    if (element) {
	      var owner = element._owner;
	      var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
	      ReactDebugCurrentFrame$1.setExtraStackFrame(stack);
	    } else {
	      ReactDebugCurrentFrame$1.setExtraStackFrame(null);
	    }
	  }
	}

	var propTypesMisspellWarningShown;

	{
	  propTypesMisspellWarningShown = false;
	}
	/**
	 * Verifies the object is a ReactElement.
	 * See https://reactjs.org/docs/react-api.html#isvalidelement
	 * @param {?object} object
	 * @return {boolean} True if `object` is a ReactElement.
	 * @final
	 */


	function isValidElement(object) {
	  {
	    return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
	  }
	}

	function getDeclarationErrorAddendum() {
	  {
	    if (ReactCurrentOwner$1.current) {
	      var name = getComponentNameFromType(ReactCurrentOwner$1.current.type);

	      if (name) {
	        return '\n\nCheck the render method of `' + name + '`.';
	      }
	    }

	    return '';
	  }
	}

	function getSourceInfoErrorAddendum(source) {
	  {
	    if (source !== undefined) {
	      var fileName = source.fileName.replace(/^.*[\\\/]/, '');
	      var lineNumber = source.lineNumber;
	      return '\n\nCheck your code at ' + fileName + ':' + lineNumber + '.';
	    }

	    return '';
	  }
	}
	/**
	 * Warn if there's no key explicitly set on dynamic arrays of children or
	 * object keys are not valid. This allows us to keep track of children between
	 * updates.
	 */


	var ownerHasKeyUseWarning = {};

	function getCurrentComponentErrorInfo(parentType) {
	  {
	    var info = getDeclarationErrorAddendum();

	    if (!info) {
	      var parentName = typeof parentType === 'string' ? parentType : parentType.displayName || parentType.name;

	      if (parentName) {
	        info = "\n\nCheck the top-level render call using <" + parentName + ">.";
	      }
	    }

	    return info;
	  }
	}
	/**
	 * Warn if the element doesn't have an explicit key assigned to it.
	 * This element is in an array. The array could grow and shrink or be
	 * reordered. All children that haven't already been validated are required to
	 * have a "key" property assigned to it. Error statuses are cached so a warning
	 * will only be shown once.
	 *
	 * @internal
	 * @param {ReactElement} element Element that requires a key.
	 * @param {*} parentType element's parent's type.
	 */


	function validateExplicitKey(element, parentType) {
	  {
	    if (!element._store || element._store.validated || element.key != null) {
	      return;
	    }

	    element._store.validated = true;
	    var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);

	    if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
	      return;
	    }

	    ownerHasKeyUseWarning[currentComponentErrorInfo] = true; // Usually the current owner is the offender, but if it accepts children as a
	    // property, it may be the creator of the child that's responsible for
	    // assigning it a key.

	    var childOwner = '';

	    if (element && element._owner && element._owner !== ReactCurrentOwner$1.current) {
	      // Give the component that originally created this child.
	      childOwner = " It was passed a child from " + getComponentNameFromType(element._owner.type) + ".";
	    }

	    setCurrentlyValidatingElement$1(element);

	    error('Each child in a list should have a unique "key" prop.' + '%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);

	    setCurrentlyValidatingElement$1(null);
	  }
	}
	/**
	 * Ensure that every element either is passed in a static location, in an
	 * array with an explicit keys property defined, or in an object literal
	 * with valid key property.
	 *
	 * @internal
	 * @param {ReactNode} node Statically passed child of any type.
	 * @param {*} parentType node's parent's type.
	 */


	function validateChildKeys(node, parentType) {
	  {
	    if (typeof node !== 'object') {
	      return;
	    }

	    if (isArray(node)) {
	      for (var i = 0; i < node.length; i++) {
	        var child = node[i];

	        if (isValidElement(child)) {
	          validateExplicitKey(child, parentType);
	        }
	      }
	    } else if (isValidElement(node)) {
	      // This element was passed in a valid location.
	      if (node._store) {
	        node._store.validated = true;
	      }
	    } else if (node) {
	      var iteratorFn = getIteratorFn(node);

	      if (typeof iteratorFn === 'function') {
	        // Entry iterators used to provide implicit keys,
	        // but now we print a separate warning for them later.
	        if (iteratorFn !== node.entries) {
	          var iterator = iteratorFn.call(node);
	          var step;

	          while (!(step = iterator.next()).done) {
	            if (isValidElement(step.value)) {
	              validateExplicitKey(step.value, parentType);
	            }
	          }
	        }
	      }
	    }
	  }
	}
	/**
	 * Given an element, validate that its props follow the propTypes definition,
	 * provided by the type.
	 *
	 * @param {ReactElement} element
	 */


	function validatePropTypes(element) {
	  {
	    var type = element.type;

	    if (type === null || type === undefined || typeof type === 'string') {
	      return;
	    }

	    var propTypes;

	    if (typeof type === 'function') {
	      propTypes = type.propTypes;
	    } else if (typeof type === 'object' && (type.$$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
	    // Inner props are checked in the reconciler.
	    type.$$typeof === REACT_MEMO_TYPE)) {
	      propTypes = type.propTypes;
	    } else {
	      return;
	    }

	    if (propTypes) {
	      // Intentionally inside to avoid triggering lazy initializers:
	      var name = getComponentNameFromType(type);
	      checkPropTypes(propTypes, element.props, 'prop', name, element);
	    } else if (type.PropTypes !== undefined && !propTypesMisspellWarningShown) {
	      propTypesMisspellWarningShown = true; // Intentionally inside to avoid triggering lazy initializers:

	      var _name = getComponentNameFromType(type);

	      error('Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?', _name || 'Unknown');
	    }

	    if (typeof type.getDefaultProps === 'function' && !type.getDefaultProps.isReactClassApproved) {
	      error('getDefaultProps is only used on classic React.createClass ' + 'definitions. Use a static property named `defaultProps` instead.');
	    }
	  }
	}
	/**
	 * Given a fragment, validate that it can only be provided with fragment props
	 * @param {ReactElement} fragment
	 */


	function validateFragmentProps(fragment) {
	  {
	    var keys = Object.keys(fragment.props);

	    for (var i = 0; i < keys.length; i++) {
	      var key = keys[i];

	      if (key !== 'children' && key !== 'key') {
	        setCurrentlyValidatingElement$1(fragment);

	        error('Invalid prop `%s` supplied to `React.Fragment`. ' + 'React.Fragment can only have `key` and `children` props.', key);

	        setCurrentlyValidatingElement$1(null);
	        break;
	      }
	    }

	    if (fragment.ref !== null) {
	      setCurrentlyValidatingElement$1(fragment);

	      error('Invalid attribute `ref` supplied to `React.Fragment`.');

	      setCurrentlyValidatingElement$1(null);
	    }
	  }
	}

	var didWarnAboutKeySpread = {};
	function jsxWithValidation(type, props, key, isStaticChildren, source, self) {
	  {
	    var validType = isValidElementType(type); // We warn in this case but don't throw. We expect the element creation to
	    // succeed and there will likely be errors in render.

	    if (!validType) {
	      var info = '';

	      if (type === undefined || typeof type === 'object' && type !== null && Object.keys(type).length === 0) {
	        info += ' You likely forgot to export your component from the file ' + "it's defined in, or you might have mixed up default and named imports.";
	      }

	      var sourceInfo = getSourceInfoErrorAddendum(source);

	      if (sourceInfo) {
	        info += sourceInfo;
	      } else {
	        info += getDeclarationErrorAddendum();
	      }

	      var typeString;

	      if (type === null) {
	        typeString = 'null';
	      } else if (isArray(type)) {
	        typeString = 'array';
	      } else if (type !== undefined && type.$$typeof === REACT_ELEMENT_TYPE) {
	        typeString = "<" + (getComponentNameFromType(type.type) || 'Unknown') + " />";
	        info = ' Did you accidentally export a JSX literal instead of a component?';
	      } else {
	        typeString = typeof type;
	      }

	      error('React.jsx: type is invalid -- expected a string (for ' + 'built-in components) or a class/function (for composite ' + 'components) but got: %s.%s', typeString, info);
	    }

	    var element = jsxDEV(type, props, key, source, self); // The result can be nullish if a mock or a custom function is used.
	    // TODO: Drop this when these are no longer allowed as the type argument.

	    if (element == null) {
	      return element;
	    } // Skip key warning if the type isn't valid since our key validation logic
	    // doesn't expect a non-string/function type and can throw confusing errors.
	    // We don't want exception behavior to differ between dev and prod.
	    // (Rendering will throw with a helpful message and as soon as the type is
	    // fixed, the key warnings will appear.)


	    if (validType) {
	      var children = props.children;

	      if (children !== undefined) {
	        if (isStaticChildren) {
	          if (isArray(children)) {
	            for (var i = 0; i < children.length; i++) {
	              validateChildKeys(children[i], type);
	            }

	            if (Object.freeze) {
	              Object.freeze(children);
	            }
	          } else {
	            error('React.jsx: Static children should always be an array. ' + 'You are likely explicitly calling React.jsxs or React.jsxDEV. ' + 'Use the Babel transform instead.');
	          }
	        } else {
	          validateChildKeys(children, type);
	        }
	      }
	    }

	    {
	      if (hasOwnProperty.call(props, 'key')) {
	        var componentName = getComponentNameFromType(type);
	        var keys = Object.keys(props).filter(function (k) {
	          return k !== 'key';
	        });
	        var beforeExample = keys.length > 0 ? '{key: someKey, ' + keys.join(': ..., ') + ': ...}' : '{key: someKey}';

	        if (!didWarnAboutKeySpread[componentName + beforeExample]) {
	          var afterExample = keys.length > 0 ? '{' + keys.join(': ..., ') + ': ...}' : '{}';

	          error('A props object containing a "key" prop is being spread into JSX:\n' + '  let props = %s;\n' + '  <%s {...props} />\n' + 'React keys must be passed directly to JSX without using spread:\n' + '  let props = %s;\n' + '  <%s key={someKey} {...props} />', beforeExample, componentName, afterExample, componentName);

	          didWarnAboutKeySpread[componentName + beforeExample] = true;
	        }
	      }
	    }

	    if (type === REACT_FRAGMENT_TYPE) {
	      validateFragmentProps(element);
	    } else {
	      validatePropTypes(element);
	    }

	    return element;
	  }
	} // These two functions exist to still get child warnings in dev
	// even with the prod transform. This means that jsxDEV is purely
	// opt-in behavior for better messages but that we won't stop
	// giving you warnings if you use production apis.

	function jsxWithValidationStatic(type, props, key) {
	  {
	    return jsxWithValidation(type, props, key, true);
	  }
	}
	function jsxWithValidationDynamic(type, props, key) {
	  {
	    return jsxWithValidation(type, props, key, false);
	  }
	}

	var jsx =  jsxWithValidationDynamic ; // we may want to special case jsxs internally to take advantage of static children.
	// for now we can ship identical prod functions

	var jsxs =  jsxWithValidationStatic ;

	reactJsxRuntime_development.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_development.jsx = jsx;
	reactJsxRuntime_development.jsxs = jsxs;
	  })();
	}
	return reactJsxRuntime_development;
}

if (process.env.NODE_ENV === 'production') {
  jsxRuntime.exports = requireReactJsxRuntime_production_min();
} else {
  jsxRuntime.exports = requireReactJsxRuntime_development();
}

var jsxRuntimeExports = jsxRuntime.exports;

class ViewStateMachine {
    constructor(config) {
        Object.defineProperty(this, "machine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stateHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "serverStateHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "viewStack", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "logEntries", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "tomeConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isTomeSynchronized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "subMachines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Add RobotCopy support for incoming messages
        Object.defineProperty(this, "robotCopy", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "incomingMessageHandlers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        // Router support for inter-machine communication
        Object.defineProperty(this, "router", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "machineId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "routedSend", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "parentMachine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        }); // Reference to parent machine for relative routing
        this.stateHandlers = new Map();
        this.tomeConfig = config.tomeConfig;
        this.machineId = config.machineId;
        // Set router if provided
        if (config.router) {
            this.setRouter(config.router);
        }
        // Create the XState machine
        const machineDefinition = createMachine({
            ...config.xstateConfig,
            predictableActionArguments: config.predictableActionArguments ?? true, // Default to true, but allow override
            on: {
                ...config.xstateConfig.on,
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
        }, {
            // Pass actions from config to options so XState can properly resolve them
            actions: config.xstateConfig.actions || {},
            // Wrap services to provide meta parameter with routedSend
            services: this.wrapServices(config.xstateConfig.services || {})
        });
        // Interpret the machine to create a service with send method
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
    /**
     * Register a state handler for the specified state
     * @param stateName - The name of the state to handle
     * @param handler - Function that handles the state logic
     * @returns This ViewStateMachine instance for method chaining
     *
     * @example
     * ```typescript
     * machine.withState('idle', async ({ state, model, log, view, transition }) => {
     *   await log('Entered idle state');
     *   view(<div>Idle UI</div>);
     * });
     * ```
     */
    withState(stateName, handler) {
        this.stateHandlers.set(stateName, handler);
        return this;
    }
    /**
     * Execute state handler with proper context
     * @param stateName - The name of the state to execute
     * @param context - The state context
     */
    async executeStateHandler(stateName, context) {
        const handler = this.stateHandlers.get(stateName);
        if (handler) {
            try {
                await handler(context);
            }
            catch (error) {
                console.error(`Error executing state handler for ${stateName}:`, error);
            }
        }
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
    // Add missing method for StructuralTomeConnector compatibility
    subscribe(callback) {
        // Subscribe to state changes - the service must be started first
        if (this.machine && typeof this.machine.subscribe === 'function') {
            return this.machine.subscribe(callback);
        }
        else {
            // Fallback: create a simple subscription that calls the callback with current state
            const currentState = this.getState();
            callback(currentState);
            return () => { }; // Return empty unsubscribe function
        }
    }
    // State context methods
    createStateContext(state, model) {
        return {
            state: state.value,
            model,
            transitions: state.history?.events || [],
            log: async (message, metadata) => {
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
            view: (component) => {
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
            transition: (to) => {
                this.machine.send({ type: 'TRANSITION', payload: { to } });
            },
            send: (event) => {
                this.machine.send(event);
            },
            on: (eventName, handler) => {
                // Register event handlers for state activations
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
    // React hook for using the machine
    useViewStateMachine(initialModel) {
        const [state, send] = useMachine(this.machine);
        const context = this.createStateContext(state, initialModel);
        // Execute state handler if exists
        React.useEffect(() => {
            this.executeStateHandler(state.value, context);
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
    /**
     * Set the router for inter-machine communication
     * Creates a routedSend function for services to use
     */
    setRouter(router) {
        this.router = router;
        if (router) {
            this.routedSend = this.createRoutedSendForContext();
        }
    }
    /**
     * Create a routed send function that supports relative paths
     * This function is passed to services via the meta parameter
     */
    createRoutedSendForContext() {
        return async (target, event, payload) => {
            if (!this.router) {
                throw new Error('Router not available for this machine');
            }
            // Try relative resolution first (supports ., .., ./, ../)
            let machine = this.router.resolveRelative(target, this);
            // Fallback to absolute resolution
            if (!machine) {
                machine = this.router.resolve(target);
            }
            if (!machine) {
                throw new Error(`Machine ${target} not found via router`);
            }
            // Send the event to the resolved machine
            return machine.send ? machine.send(event, payload) : { success: false, error: 'No send method' };
        };
    }
    /**
     * Wrap services to provide meta parameter with routedSend and other utilities
     */
    wrapServices(services) {
        const wrappedServices = {};
        for (const [serviceName, serviceImpl] of Object.entries(services)) {
            wrappedServices[serviceName] = async (context, event) => {
                const meta = {
                    routedSend: this.routedSend,
                    machineId: this.machineId,
                    router: this.router,
                    machine: this // Reference to current machine for relative routing
                };
                // Call original service with meta as third parameter
                return serviceImpl(context, event, meta);
            };
        }
        return wrappedServices;
    }
    // Event subscription methods for TomeConnector
    on(eventType, handler) {
        if (this.machine && typeof this.machine.on === 'function') {
            this.machine.on(eventType, handler);
        }
        else {
            console.warn('Machine not started or on method not available');
        }
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
        return Promise.resolve();
    }
    // Get current state
    getState() {
        if (this.machine && typeof this.machine.getSnapshot === 'function') {
            return this.machine.getSnapshot();
        }
        return null;
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
            transition: (_to) => {
                // Server-side transition
            },
            send: (_event) => {
                // Server-side event sending
            },
            on: (_eventName, _handler) => {
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
                query: async (_query, _variables) => {
                    // Server-side GraphQL query
                    return {};
                },
                mutation: async (_mutation, _variables) => {
                    // Server-side GraphQL mutation
                    return {};
                },
                subscription: async (_subscription, _variables) => {
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
        return (jsxRuntimeExports.jsxs("div", { className: "composed-view", children: [this.viewStack.map((view, index) => (jsxRuntimeExports.jsx("div", { className: "view-container", children: view }, index))), Array.from(this.subMachines.entries()).map(([id, subMachine]) => (jsxRuntimeExports.jsx("div", { className: "sub-machine-container", children: subMachine.render(model) }, id)))] }));
    }
}
function createViewStateMachine(config, predictableActionArguments) {
    const fullConfig = {
        ...config,
        ...(predictableActionArguments !== undefined && { predictableActionArguments })
    };
    return new ViewStateMachine(fullConfig);
}

/**
 * StorageService
 *
 * Handles component persistence and retrieval
 * Can be extended to support different storage backends
 */
class StorageService {
    constructor() {
        Object.defineProperty(this, "components", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "storageKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'tome-editor-components'
        });
        this.loadFromLocalStorage();
    }
    /**
     * Load components from localStorage
     */
    loadFromLocalStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const data = window.localStorage.getItem(this.storageKey);
                if (data) {
                    const parsed = JSON.parse(data);
                    this.components = new Map(Object.entries(parsed));
                    console.log('💾 StorageService: Loaded', this.components.size, 'components from localStorage');
                }
            }
        }
        catch (error) {
            console.error('💾 StorageService: Failed to load from localStorage', error);
        }
    }
    /**
     * Save components to localStorage
     */
    saveToLocalStorage() {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                const data = Object.fromEntries(this.components);
                window.localStorage.setItem(this.storageKey, JSON.stringify(data));
                console.log('💾 StorageService: Saved', this.components.size, 'components to localStorage');
            }
        }
        catch (error) {
            console.error('💾 StorageService: Failed to save to localStorage', error);
        }
    }
    /**
     * Get all components
     */
    async listComponents() {
        return Array.from(this.components.values());
    }
    /**
     * Get a component by ID
     */
    async getComponent(id) {
        const component = this.components.get(id);
        if (!component) {
            console.warn('💾 StorageService: Component not found:', id);
            return null;
        }
        return component;
    }
    /**
     * Save a component
     */
    async saveComponent(component) {
        const now = Date.now();
        const existing = this.components.get(component.id);
        const savedComponent = {
            ...component,
            metadata: {
                ...component.metadata,
                created: existing?.metadata.created || now,
                modified: now
            }
        };
        this.components.set(component.id, savedComponent);
        this.saveToLocalStorage();
        console.log('💾 StorageService: Saved component:', savedComponent.id);
        return savedComponent;
    }
    /**
     * Delete a component
     */
    async deleteComponent(id) {
        const existed = this.components.has(id);
        this.components.delete(id);
        if (existed) {
            this.saveToLocalStorage();
            console.log('💾 StorageService: Deleted component:', id);
        }
        else {
            console.warn('💾 StorageService: Component to delete not found:', id);
        }
        return existed;
    }
    /**
     * Create a new component with default values
     */
    async createComponent(name, type = 'generic') {
        const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const component = {
            id,
            name,
            type,
            content: '',
            metadata: {
                created: Date.now(),
                modified: Date.now()
            }
        };
        return this.saveComponent(component);
    }
    /**
     * Check if a component exists
     */
    async exists(id) {
        return this.components.has(id);
    }
    /**
     * Clear all components (useful for testing)
     */
    async clearAll() {
        this.components.clear();
        this.saveToLocalStorage();
        console.log('💾 StorageService: Cleared all components');
    }
    /**
     * Get storage statistics
     */
    async getStats() {
        const components = Array.from(this.components.values());
        const totalSize = JSON.stringify(components).length;
        return {
            count: components.length,
            totalSize
        };
    }
}
// Export singleton instance
const storageService = new StorageService();

/**
 * EditorMachine
 *
 * Manages component editing lifecycle with CRUD operations
 * Uses invoke services for async operations and routed send for coordination
 */
const createEditorMachine = (router) => {
    return createViewStateMachine({
        machineId: 'editor-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                currentComponent: null,
                components: [],
                isDirty: false,
                lastSaved: null,
                error: null,
                componentId: null
            },
            states: {
                idle: {
                    on: {
                        LOAD_COMPONENT: { target: 'loading' },
                        CREATE_NEW: { target: 'editing', actions: ['createNewComponent'] },
                        LIST_COMPONENTS: { target: 'listing' }
                    }
                },
                listing: {
                    invoke: {
                        src: 'listComponentsService',
                        onDone: { target: 'idle', actions: ['setComponentList'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                loading: {
                    invoke: {
                        src: 'loadComponentService',
                        onDone: { target: 'editing', actions: ['setComponent'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                editing: {
                    on: {
                        SAVE: { target: 'saving' },
                        PREVIEW: { target: 'previewing' },
                        CANCEL: { target: 'idle', actions: ['clearComponent'] },
                        COMPONENT_CHANGE: { actions: ['markDirty'] },
                        DELETE: { target: 'deleting' }
                    }
                },
                saving: {
                    invoke: {
                        src: 'saveComponentService',
                        onDone: { target: 'editing', actions: ['markSaved'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                deleting: {
                    invoke: {
                        src: 'deleteComponentService',
                        onDone: { target: 'idle', actions: ['clearComponent'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                previewing: {
                    invoke: {
                        src: 'previewComponentService',
                        onDone: { target: 'editing' },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'editing' },
                        RESET: { target: 'idle', actions: ['resetEditor'] }
                    }
                }
            },
            services: {
                listComponentsService: async (context, event, meta) => {
                    console.log('📝 EditorMachine: Listing components...');
                    // Fetch from storage service
                    const components = await storageService.listComponents();
                    return { components };
                },
                loadComponentService: async (context, event, meta) => {
                    console.log('📝 EditorMachine: Loading component:', event.componentId);
                    // Load from storage service
                    const component = await storageService.getComponent(event.componentId);
                    if (!component) {
                        throw new Error(`Component not found: ${event.componentId}`);
                    }
                    return component;
                },
                saveComponentService: async (context, event, meta) => {
                    console.log('📝 EditorMachine: Saving component:', context.currentComponent);
                    // Save to storage service
                    const saved = await storageService.saveComponent(context.currentComponent);
                    // Notify preview machine about save
                    if (meta.routedSend) {
                        try {
                            await meta.routedSend('../PreviewMachine', 'COMPONENT_SAVED', {
                                component: saved
                            });
                            console.log('📝 EditorMachine: Notified PreviewMachine of save');
                        }
                        catch (error) {
                            console.warn('📝 EditorMachine: Could not notify PreviewMachine:', error.message);
                        }
                    }
                    // Notify health machine of operation
                    if (meta.routedSend) {
                        try {
                            await meta.routedSend('../HealthMachine', 'OPERATION_COMPLETE', {
                                operation: 'save',
                                componentId: saved.id,
                                timestamp: Date.now()
                            });
                        }
                        catch (error) {
                            console.warn('📝 EditorMachine: Could not notify HealthMachine:', error.message);
                        }
                    }
                    return saved;
                },
                deleteComponentService: async (context, event, meta) => {
                    console.log('📝 EditorMachine: Deleting component:', context.componentId);
                    // Delete from storage
                    const deleted = await storageService.deleteComponent(context.componentId);
                    if (!deleted) {
                        throw new Error(`Failed to delete component: ${context.componentId}`);
                    }
                    // Notify preview to clear
                    if (meta.routedSend) {
                        await meta.routedSend('../PreviewMachine', 'CLEAR');
                    }
                    return { success: true, id: context.componentId };
                },
                previewComponentService: async (context, event, meta) => {
                    console.log('📝 EditorMachine: Requesting preview:', context.currentComponent);
                    // Send to preview machine using routed send
                    if (meta.routedSend) {
                        const response = await meta.routedSend('../PreviewMachine', 'RENDER_PREVIEW', {
                            component: context.currentComponent
                        });
                        console.log('📝 EditorMachine: Preview response:', response);
                        return response;
                    }
                    throw new Error('Preview machine not available');
                }
            },
            actions: {
                createNewComponent: (context) => {
                    console.log('📝 EditorMachine: Creating new component');
                    context.currentComponent = {
                        id: `new-${Date.now()}`,
                        name: 'New Component',
                        type: 'generic',
                        content: '',
                        metadata: {
                            created: Date.now(),
                            modified: Date.now()
                        }
                    };
                    context.isDirty = true;
                },
                setComponent: (context, event) => {
                    console.log('📝 EditorMachine: Setting component:', event.data);
                    context.currentComponent = event.data;
                    context.componentId = event.data?.id;
                    context.isDirty = false;
                },
                setComponentList: (context, event) => {
                    console.log('📝 EditorMachine: Setting component list');
                    context.components = event.data?.components || [];
                },
                markDirty: (context) => {
                    console.log('📝 EditorMachine: Marking dirty');
                    context.isDirty = true;
                },
                markSaved: (context, event) => {
                    console.log('📝 EditorMachine: Marking saved');
                    context.currentComponent = event.data;
                    context.isDirty = false;
                    context.lastSaved = Date.now();
                },
                clearComponent: (context) => {
                    console.log('📝 EditorMachine: Clearing component');
                    context.currentComponent = null;
                    context.componentId = null;
                    context.isDirty = false;
                },
                setError: (context, event) => {
                    console.error('📝 EditorMachine: Error occurred:', event.data);
                    context.error = event.data;
                },
                resetEditor: (context) => {
                    console.log('📝 EditorMachine: Resetting editor');
                    context.currentComponent = null;
                    context.componentId = null;
                    context.isDirty = false;
                    context.error = null;
                }
            }
        }
    });
};

/**
 * PreviewMachine
 *
 * Manages real-time component preview rendering
 * Coordinates with EditorMachine and TemplateMachine via routed send
 */
const createPreviewMachine = (router) => {
    return createViewStateMachine({
        machineId: 'preview-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                previewData: null,
                componentData: null,
                isRendering: false,
                error: null,
                lastRendered: null
            },
            states: {
                idle: {
                    on: {
                        RENDER_PREVIEW: { target: 'rendering' },
                        COMPONENT_SAVED: { target: 'rendering', actions: ['updateComponentData'] }
                    }
                },
                rendering: {
                    invoke: {
                        src: 'renderPreviewService',
                        onDone: { target: 'ready', actions: ['setPreviewData'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                ready: {
                    on: {
                        RENDER_PREVIEW: { target: 'rendering' },
                        UPDATE_PREVIEW: { target: 'rendering' },
                        COMPONENT_SAVED: { target: 'rendering', actions: ['updateComponentData'] },
                        CLEAR: { target: 'idle', actions: ['clearPreview'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'rendering' },
                        RESET: { target: 'idle', actions: ['resetPreview'] }
                    }
                }
            },
            services: {
                renderPreviewService: async (context, event, meta) => {
                    console.log('👁️ PreviewMachine: Rendering preview...');
                    const componentToRender = event.component || context.componentData;
                    // Send to template machine for processing
                    if (meta.routedSend && componentToRender) {
                        try {
                            const response = await meta.routedSend('../TemplateMachine', 'PROCESS_TEMPLATE', {
                                template: componentToRender.content || '',
                                variables: componentToRender.metadata || {}
                            });
                            console.log('👁️ PreviewMachine: Template processed:', response);
                            return {
                                rendered: response.processed || response,
                                component: componentToRender,
                                timestamp: Date.now()
                            };
                        }
                        catch (error) {
                            console.warn('👁️ PreviewMachine: Template processing failed, using raw content:', error.message);
                        }
                    }
                    // Fallback: return component as-is
                    return {
                        rendered: componentToRender?.content || '<div>No preview available</div>',
                        component: componentToRender,
                        timestamp: Date.now()
                    };
                }
            },
            actions: {
                updateComponentData: (context, event) => {
                    console.log('👁️ PreviewMachine: Updating component data');
                    context.componentData = event.component;
                },
                setPreviewData: (context, event) => {
                    console.log('👁️ PreviewMachine: Setting preview data');
                    context.previewData = event.data;
                    context.lastRendered = Date.now();
                },
                clearPreview: (context) => {
                    console.log('👁️ PreviewMachine: Clearing preview');
                    context.previewData = null;
                    context.componentData = null;
                },
                setError: (context, event) => {
                    console.error('👁️ PreviewMachine: Error occurred:', event.data);
                    context.error = event.data;
                },
                resetPreview: (context) => {
                    console.log('👁️ PreviewMachine: Resetting preview');
                    context.previewData = null;
                    context.componentData = null;
                    context.error = null;
                }
            }
        }
    });
};

/**
 * TemplateMachine
 *
 * Handles template processing and validation
 * Provides template utilities for the editor system
 */
const createTemplateMachine = (router) => {
    return createViewStateMachine({
        machineId: 'template-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                currentTemplate: null,
                processedResult: null,
                validationErrors: [],
                error: null
            },
            states: {
                idle: {
                    on: {
                        PROCESS_TEMPLATE: { target: 'processing' }
                    }
                },
                processing: {
                    invoke: {
                        src: 'processTemplateService',
                        onDone: { target: 'validating', actions: ['setProcessedResult'] },
                        onError: { target: 'error', actions: ['setError'] }
                    }
                },
                validating: {
                    invoke: {
                        src: 'validateTemplateService',
                        onDone: { target: 'idle', actions: ['clearValidationErrors'] },
                        onError: { target: 'idle', actions: ['setValidationErrors'] }
                    }
                },
                error: {
                    on: {
                        RETRY: { target: 'processing' },
                        RESET: { target: 'idle', actions: ['resetTemplate'] }
                    }
                }
            },
            services: {
                processTemplateService: async (context, event, meta) => {
                    console.log('🔧 TemplateMachine: Processing template...');
                    const template = event.template || context.currentTemplate;
                    const variables = event.variables || {};
                    // Simple template processing (replace {{variable}} with values)
                    let processed = template;
                    Object.entries(variables).forEach(([key, value]) => {
                        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                        processed = processed.replace(pattern, String(value));
                    });
                    // Remove any JSX-specific syntax for preview
                    processed = processed.replace(/<[^>]*\s+value=\{.*?\}[^>]*>/g, (match) => {
                        return match.replace(/\s+value=\{.*?\}/g, '');
                    });
                    return {
                        processed,
                        template,
                        variables,
                        timestamp: Date.now()
                    };
                },
                validateTemplateService: async (context, event, meta) => {
                    console.log('🔧 TemplateMachine: Validating template...');
                    const processed = context.processedResult?.processed;
                    // Basic validation - check for unclosed tags, etc.
                    const errors = [];
                    if (!processed) {
                        errors.push({ type: 'empty', message: 'No content to validate' });
                    }
                    if (errors.length > 0) {
                        throw new Error('Validation failed');
                    }
                    return { valid: true, errors: [] };
                }
            },
            actions: {
                setProcessedResult: (context, event) => {
                    console.log('🔧 TemplateMachine: Setting processed result');
                    context.processedResult = event.data;
                    context.currentTemplate = event.data?.template;
                },
                clearValidationErrors: (context) => {
                    context.validationErrors = [];
                },
                setValidationErrors: (context, event) => {
                    console.warn('🔧 TemplateMachine: Validation errors:', event.data);
                    context.validationErrors = event.data?.errors || [];
                },
                setError: (context, event) => {
                    console.error('🔧 TemplateMachine: Error occurred:', event.data);
                    context.error = event.data;
                },
                resetTemplate: (context) => {
                    console.log('🔧 TemplateMachine: Resetting template');
                    context.currentTemplate = null;
                    context.processedResult = null;
                    context.validationErrors = [];
                    context.error = null;
                }
            }
        }
    });
};

/**
 * HealthMachine
 *
 * Monitors editor system health and performance metrics
 * Tracks operations and provides health status
 */
const createHealthMachine = (router) => {
    return createViewStateMachine({
        machineId: 'health-machine',
        router: router,
        predictableActionArguments: false,
        xstateConfig: {
            initial: 'idle',
            context: {
                metrics: {
                    requestCount: 0,
                    errorCount: 0,
                    saveCount: 0,
                    previewCount: 0,
                    avgResponseTime: 0,
                    uptime: 0,
                    lastOperation: null
                },
                status: 'unknown',
                startTime: null,
                error: null
            },
            states: {
                idle: {
                    on: {
                        START_MONITORING: { target: 'monitoring', actions: ['startMonitoring'] }
                    }
                },
                monitoring: {
                    on: {
                        OPERATION_COMPLETE: { actions: ['recordOperation'] },
                        OPERATION_FAILED: { actions: ['recordError'] },
                        CHECK_HEALTH: { target: 'checking' },
                        STOP_MONITORING: { target: 'idle', actions: ['stopMonitoring'] }
                    }
                },
                checking: {
                    invoke: {
                        src: 'checkHealthService',
                        onDone: { target: 'monitoring', actions: ['updateStatus'] },
                        onError: { target: 'monitoring', actions: ['markUnhealthy'] }
                    }
                }
            },
            services: {
                checkHealthService: async (context, event, meta) => {
                    console.log('🏥 HealthMachine: Checking health...');
                    const metrics = context.metrics;
                    // Determine health status based on metrics
                    let status = 'healthy';
                    const errorRate = metrics.requestCount > 0
                        ? metrics.errorCount / metrics.requestCount
                        : 0;
                    if (errorRate > 0.5) {
                        status = 'unhealthy';
                    }
                    else if (errorRate > 0.2) {
                        status = 'degraded';
                    }
                    // Calculate uptime
                    const uptime = context.startTime
                        ? Date.now() - context.startTime
                        : 0;
                    return {
                        status,
                        metrics: {
                            ...metrics,
                            uptime,
                            errorRate: errorRate * 100,
                            healthCheckTime: Date.now()
                        }
                    };
                }
            },
            actions: {
                startMonitoring: (context) => {
                    console.log('🏥 HealthMachine: Starting monitoring');
                    context.startTime = Date.now();
                    context.status = 'healthy';
                },
                stopMonitoring: (context) => {
                    console.log('🏥 HealthMachine: Stopping monitoring');
                    context.startTime = null;
                },
                recordOperation: (context, event) => {
                    console.log('🏥 HealthMachine: Recording operation:', event.operation);
                    context.metrics.requestCount++;
                    context.metrics.lastOperation = event.operation;
                    if (event.operation === 'save') {
                        context.metrics.saveCount++;
                    }
                    else if (event.operation === 'preview') {
                        context.metrics.previewCount++;
                    }
                },
                recordError: (context, event) => {
                    console.error('🏥 HealthMachine: Recording error:', event.error);
                    context.metrics.errorCount++;
                },
                updateStatus: (context, event) => {
                    console.log('🏥 HealthMachine: Updating status:', event.data.status);
                    context.status = event.data.status;
                    context.metrics = event.data.metrics;
                },
                markUnhealthy: (context, event) => {
                    console.error('🏥 HealthMachine: Marking unhealthy:', event.data);
                    context.status = 'unhealthy';
                    context.error = event.data;
                }
            }
        }
    });
};

/**
 * EditorTome
 *
 * Main orchestrator for the GenericEditor system
 * Coordinates editor, preview, template, and health machines
 * Uses routed send for inter-machine communication
 */
class EditorTome extends TomeBase {
    constructor() {
        super();
        Object.defineProperty(this, "editorMachine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "previewMachine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "templateMachine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "healthMachine", {
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
        this.currentViewKey = 'loading';
    }
    /**
     * Initialize the tome and all its machines
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('📚 EditorTome: Already initialized');
            return;
        }
        console.log('📚 EditorTome: Initializing editor system...');
        try {
            // Create all machines with router
            this.editorMachine = createEditorMachine(this.router);
            this.previewMachine = createPreviewMachine(this.router);
            this.templateMachine = createTemplateMachine(this.router);
            this.healthMachine = createHealthMachine(this.router);
            // Register machines with router
            this.router.register('EditorMachine', this.editorMachine);
            this.router.register('PreviewMachine', this.previewMachine);
            this.router.register('TemplateMachine', this.templateMachine);
            this.router.register('HealthMachine', this.healthMachine);
            // Set up parent-child relationships for relative routing
            this.editorMachine.parentMachine = this;
            this.previewMachine.parentMachine = this;
            this.templateMachine.parentMachine = this;
            this.healthMachine.parentMachine = this;
            // Start all machines
            await Promise.all([
                this.editorMachine.start(),
                this.previewMachine.start(),
                this.templateMachine.start(),
                this.healthMachine.start()
            ]);
            // Initialize health monitoring
            this.healthMachine.send('START_MONITORING');
            this.isInitialized = true;
            this.updateViewKey('initialized');
            console.log('📚 EditorTome: Initialization complete');
        }
        catch (error) {
            console.error('📚 EditorTome: Initialization failed', error);
            this.updateViewKey('error');
            throw error;
        }
    }
    /**
     * Send an event to a specific machine
     */
    async send(machineName, event, payload) {
        const machine = this.router.resolve(machineName);
        if (!machine) {
            throw new Error(`Machine ${machineName} not found`);
        }
        return new Promise((resolve, reject) => {
            try {
                machine.send({ type: event, ...payload });
                // For now, resolve immediately
                // TODO: Implement proper promise-based event handling
                resolve({ success: true, machine: machineName, event });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Get the current state of a machine
     */
    getMachineState(machineName) {
        const machine = this.router.resolve(machineName);
        if (!machine) {
            return null;
        }
        return machine.getState?.() || null;
    }
    /**
     * Get the current context of a machine
     */
    getMachineContext(machineName) {
        const machine = this.router.resolve(machineName);
        if (!machine) {
            return null;
        }
        const state = machine.getState?.();
        return state?.context || null;
    }
    /**
     * Subscribe to machine state changes
     */
    subscribeMachine(machineName, callback) {
        const machine = this.router.resolve(machineName);
        if (!machine || !machine.subscribe) {
            console.warn(`📚 EditorTome: Cannot subscribe to ${machineName} - machine not found or no subscribe method`);
            return () => { };
        }
        return machine.subscribe(callback);
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('📚 EditorTome: Cleaning up...');
        if (this.editorMachine) {
            this.editorMachine.stop?.();
        }
        if (this.previewMachine) {
            this.previewMachine.stop?.();
        }
        if (this.templateMachine) {
            this.templateMachine.stop?.();
        }
        if (this.healthMachine) {
            this.healthMachine.stop?.();
        }
        super.cleanup();
        this.isInitialized = false;
    }
}
// Export singleton instance for convenience
const editorTome = new EditorTome();

var jws$3 = {};

var safeBuffer = {exports: {}};

/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

(function (module, exports) {
	/* eslint-disable node/no-deprecated-api */
	var buffer = require$$0;
	var Buffer = buffer.Buffer;

	// alternative to using Object.keys for old browsers
	function copyProps (src, dst) {
	  for (var key in src) {
	    dst[key] = src[key];
	  }
	}
	if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
	  module.exports = buffer;
	} else {
	  // Copy properties from require('buffer')
	  copyProps(buffer, exports);
	  exports.Buffer = SafeBuffer;
	}

	function SafeBuffer (arg, encodingOrOffset, length) {
	  return Buffer(arg, encodingOrOffset, length)
	}

	SafeBuffer.prototype = Object.create(Buffer.prototype);

	// Copy static methods from Buffer
	copyProps(Buffer, SafeBuffer);

	SafeBuffer.from = function (arg, encodingOrOffset, length) {
	  if (typeof arg === 'number') {
	    throw new TypeError('Argument must not be a number')
	  }
	  return Buffer(arg, encodingOrOffset, length)
	};

	SafeBuffer.alloc = function (size, fill, encoding) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  var buf = Buffer(size);
	  if (fill !== undefined) {
	    if (typeof encoding === 'string') {
	      buf.fill(fill, encoding);
	    } else {
	      buf.fill(fill);
	    }
	  } else {
	    buf.fill(0);
	  }
	  return buf
	};

	SafeBuffer.allocUnsafe = function (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  return Buffer(size)
	};

	SafeBuffer.allocUnsafeSlow = function (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('Argument must be a number')
	  }
	  return buffer.SlowBuffer(size)
	}; 
} (safeBuffer, safeBuffer.exports));

var safeBufferExports = safeBuffer.exports;

/*global module, process*/

var Buffer$6 = safeBufferExports.Buffer;
var Stream$2 = require$$3;
var util$3 = require$$5;

function DataStream$2(data) {
  this.buffer = null;
  this.writable = true;
  this.readable = true;

  // No input
  if (!data) {
    this.buffer = Buffer$6.alloc(0);
    return this;
  }

  // Stream
  if (typeof data.pipe === 'function') {
    this.buffer = Buffer$6.alloc(0);
    data.pipe(this);
    return this;
  }

  // Buffer or String
  // or Object (assumedly a passworded key)
  if (data.length || typeof data === 'object') {
    this.buffer = data;
    this.writable = false;
    process.nextTick(function () {
      this.emit('end', data);
      this.readable = false;
      this.emit('close');
    }.bind(this));
    return this;
  }

  throw new TypeError('Unexpected data type ('+ typeof data + ')');
}
util$3.inherits(DataStream$2, Stream$2);

DataStream$2.prototype.write = function write(data) {
  this.buffer = Buffer$6.concat([this.buffer, Buffer$6.from(data)]);
  this.emit('data', data);
};

DataStream$2.prototype.end = function end(data) {
  if (data)
    this.write(data);
  this.emit('end', data);
  this.emit('close');
  this.writable = false;
  this.readable = false;
};

var dataStream = DataStream$2;

function getParamSize(keySize) {
	var result = ((keySize / 8) | 0) + (keySize % 8 === 0 ? 0 : 1);
	return result;
}

var paramBytesForAlg = {
	ES256: getParamSize(256),
	ES384: getParamSize(384),
	ES512: getParamSize(521)
};

function getParamBytesForAlg$1(alg) {
	var paramBytes = paramBytesForAlg[alg];
	if (paramBytes) {
		return paramBytes;
	}

	throw new Error('Unknown algorithm "' + alg + '"');
}

var paramBytesForAlg_1 = getParamBytesForAlg$1;

var Buffer$5 = safeBufferExports.Buffer;

var getParamBytesForAlg = paramBytesForAlg_1;

var MAX_OCTET = 0x80,
	CLASS_UNIVERSAL = 0,
	PRIMITIVE_BIT = 0x20,
	TAG_SEQ = 0x10,
	TAG_INT = 0x02,
	ENCODED_TAG_SEQ = (TAG_SEQ | PRIMITIVE_BIT) | (CLASS_UNIVERSAL << 6),
	ENCODED_TAG_INT = TAG_INT | (CLASS_UNIVERSAL << 6);

function base64Url(base64) {
	return base64
		.replace(/=/g, '')
		.replace(/\+/g, '-')
		.replace(/\//g, '_');
}

function signatureAsBuffer(signature) {
	if (Buffer$5.isBuffer(signature)) {
		return signature;
	} else if ('string' === typeof signature) {
		return Buffer$5.from(signature, 'base64');
	}

	throw new TypeError('ECDSA signature must be a Base64 string or a Buffer');
}

function derToJose(signature, alg) {
	signature = signatureAsBuffer(signature);
	var paramBytes = getParamBytesForAlg(alg);

	// the DER encoded param should at most be the param size, plus a padding
	// zero, since due to being a signed integer
	var maxEncodedParamLength = paramBytes + 1;

	var inputLength = signature.length;

	var offset = 0;
	if (signature[offset++] !== ENCODED_TAG_SEQ) {
		throw new Error('Could not find expected "seq"');
	}

	var seqLength = signature[offset++];
	if (seqLength === (MAX_OCTET | 1)) {
		seqLength = signature[offset++];
	}

	if (inputLength - offset < seqLength) {
		throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
	}

	if (signature[offset++] !== ENCODED_TAG_INT) {
		throw new Error('Could not find expected "int" for "r"');
	}

	var rLength = signature[offset++];

	if (inputLength - offset - 2 < rLength) {
		throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
	}

	if (maxEncodedParamLength < rLength) {
		throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
	}

	var rOffset = offset;
	offset += rLength;

	if (signature[offset++] !== ENCODED_TAG_INT) {
		throw new Error('Could not find expected "int" for "s"');
	}

	var sLength = signature[offset++];

	if (inputLength - offset !== sLength) {
		throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
	}

	if (maxEncodedParamLength < sLength) {
		throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
	}

	var sOffset = offset;
	offset += sLength;

	if (offset !== inputLength) {
		throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
	}

	var rPadding = paramBytes - rLength,
		sPadding = paramBytes - sLength;

	var dst = Buffer$5.allocUnsafe(rPadding + rLength + sPadding + sLength);

	for (offset = 0; offset < rPadding; ++offset) {
		dst[offset] = 0;
	}
	signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);

	offset = paramBytes;

	for (var o = offset; offset < o + sPadding; ++offset) {
		dst[offset] = 0;
	}
	signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);

	dst = dst.toString('base64');
	dst = base64Url(dst);

	return dst;
}

function countPadding(buf, start, stop) {
	var padding = 0;
	while (start + padding < stop && buf[start + padding] === 0) {
		++padding;
	}

	var needsSign = buf[start + padding] >= MAX_OCTET;
	if (needsSign) {
		--padding;
	}

	return padding;
}

function joseToDer(signature, alg) {
	signature = signatureAsBuffer(signature);
	var paramBytes = getParamBytesForAlg(alg);

	var signatureBytes = signature.length;
	if (signatureBytes !== paramBytes * 2) {
		throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
	}

	var rPadding = countPadding(signature, 0, paramBytes);
	var sPadding = countPadding(signature, paramBytes, signature.length);
	var rLength = paramBytes - rPadding;
	var sLength = paramBytes - sPadding;

	var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;

	var shortLength = rsBytes < MAX_OCTET;

	var dst = Buffer$5.allocUnsafe((shortLength ? 2 : 3) + rsBytes);

	var offset = 0;
	dst[offset++] = ENCODED_TAG_SEQ;
	if (shortLength) {
		// Bit 8 has value "0"
		// bits 7-1 give the length.
		dst[offset++] = rsBytes;
	} else {
		// Bit 8 of first octet has value "1"
		// bits 7-1 give the number of additional length octets.
		dst[offset++] = MAX_OCTET	| 1;
		// length, base 256
		dst[offset++] = rsBytes & 0xff;
	}
	dst[offset++] = ENCODED_TAG_INT;
	dst[offset++] = rLength;
	if (rPadding < 0) {
		dst[offset++] = 0;
		offset += signature.copy(dst, offset, 0, paramBytes);
	} else {
		offset += signature.copy(dst, offset, rPadding, paramBytes);
	}
	dst[offset++] = ENCODED_TAG_INT;
	dst[offset++] = sLength;
	if (sPadding < 0) {
		dst[offset++] = 0;
		signature.copy(dst, offset, paramBytes);
	} else {
		signature.copy(dst, offset, paramBytes + sPadding);
	}

	return dst;
}

var ecdsaSigFormatter = {
	derToJose: derToJose,
	joseToDer: joseToDer
};

/*jshint node:true */

var bufferEqualConstantTime;
var hasRequiredBufferEqualConstantTime;

function requireBufferEqualConstantTime () {
	if (hasRequiredBufferEqualConstantTime) return bufferEqualConstantTime;
	hasRequiredBufferEqualConstantTime = 1;
	var Buffer = require$$0.Buffer; // browserify
	var SlowBuffer = require$$0.SlowBuffer;

	bufferEqualConstantTime = bufferEq;

	function bufferEq(a, b) {

	  // shortcutting on type is necessary for correctness
	  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
	    return false;
	  }

	  // buffer sizes should be well-known information, so despite this
	  // shortcutting, it doesn't leak any information about the *contents* of the
	  // buffers.
	  if (a.length !== b.length) {
	    return false;
	  }

	  var c = 0;
	  for (var i = 0; i < a.length; i++) {
	    /*jshint bitwise:false */
	    c |= a[i] ^ b[i]; // XOR
	  }
	  return c === 0;
	}

	bufferEq.install = function() {
	  Buffer.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
	    return bufferEq(this, that);
	  };
	};

	var origBufEqual = Buffer.prototype.equal;
	var origSlowBufEqual = SlowBuffer.prototype.equal;
	bufferEq.restore = function() {
	  Buffer.prototype.equal = origBufEqual;
	  SlowBuffer.prototype.equal = origSlowBufEqual;
	};
	return bufferEqualConstantTime;
}

var Buffer$4 = safeBufferExports.Buffer;
var crypto = require$$1;
var formatEcdsa = ecdsaSigFormatter;
var util$2 = require$$5;

var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
var MSG_INVALID_SECRET = 'secret must be a string or buffer';
var MSG_INVALID_VERIFIER_KEY = 'key must be a string or a buffer';
var MSG_INVALID_SIGNER_KEY = 'key must be a string, a buffer or an object';

var supportsKeyObjects = typeof crypto.createPublicKey === 'function';
if (supportsKeyObjects) {
  MSG_INVALID_VERIFIER_KEY += ' or a KeyObject';
  MSG_INVALID_SECRET += 'or a KeyObject';
}

function checkIsPublicKey(key) {
  if (Buffer$4.isBuffer(key)) {
    return;
  }

  if (typeof key === 'string') {
    return;
  }

  if (!supportsKeyObjects) {
    throw typeError(MSG_INVALID_VERIFIER_KEY);
  }

  if (typeof key !== 'object') {
    throw typeError(MSG_INVALID_VERIFIER_KEY);
  }

  if (typeof key.type !== 'string') {
    throw typeError(MSG_INVALID_VERIFIER_KEY);
  }

  if (typeof key.asymmetricKeyType !== 'string') {
    throw typeError(MSG_INVALID_VERIFIER_KEY);
  }

  if (typeof key.export !== 'function') {
    throw typeError(MSG_INVALID_VERIFIER_KEY);
  }
}
function checkIsPrivateKey(key) {
  if (Buffer$4.isBuffer(key)) {
    return;
  }

  if (typeof key === 'string') {
    return;
  }

  if (typeof key === 'object') {
    return;
  }

  throw typeError(MSG_INVALID_SIGNER_KEY);
}
function checkIsSecretKey(key) {
  if (Buffer$4.isBuffer(key)) {
    return;
  }

  if (typeof key === 'string') {
    return key;
  }

  if (!supportsKeyObjects) {
    throw typeError(MSG_INVALID_SECRET);
  }

  if (typeof key !== 'object') {
    throw typeError(MSG_INVALID_SECRET);
  }

  if (key.type !== 'secret') {
    throw typeError(MSG_INVALID_SECRET);
  }

  if (typeof key.export !== 'function') {
    throw typeError(MSG_INVALID_SECRET);
  }
}

function fromBase64(base64) {
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function toBase64(base64url) {
  base64url = base64url.toString();

  var padding = 4 - base64url.length % 4;
  if (padding !== 4) {
    for (var i = 0; i < padding; ++i) {
      base64url += '=';
    }
  }

  return base64url
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
}

function typeError(template) {
  var args = [].slice.call(arguments, 1);
  var errMsg = util$2.format.bind(util$2, template).apply(null, args);
  return new TypeError(errMsg);
}

function bufferOrString(obj) {
  return Buffer$4.isBuffer(obj) || typeof obj === 'string';
}

function normalizeInput(thing) {
  if (!bufferOrString(thing))
    thing = JSON.stringify(thing);
  return thing;
}

function createHmacSigner(bits) {
  return function sign(thing, secret) {
    checkIsSecretKey(secret);
    thing = normalizeInput(thing);
    var hmac = crypto.createHmac('sha' + bits, secret);
    var sig = (hmac.update(thing), hmac.digest('base64'));
    return fromBase64(sig);
  }
}

var bufferEqual;
var timingSafeEqual = 'timingSafeEqual' in crypto ? function timingSafeEqual(a, b) {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  return crypto.timingSafeEqual(a, b)
} : function timingSafeEqual(a, b) {
  if (!bufferEqual) {
    bufferEqual = requireBufferEqualConstantTime();
  }

  return bufferEqual(a, b)
};

function createHmacVerifier(bits) {
  return function verify(thing, signature, secret) {
    var computedSig = createHmacSigner(bits)(thing, secret);
    return timingSafeEqual(Buffer$4.from(signature), Buffer$4.from(computedSig));
  }
}

function createKeySigner(bits) {
 return function sign(thing, privateKey) {
    checkIsPrivateKey(privateKey);
    thing = normalizeInput(thing);
    // Even though we are specifying "RSA" here, this works with ECDSA
    // keys as well.
    var signer = crypto.createSign('RSA-SHA' + bits);
    var sig = (signer.update(thing), signer.sign(privateKey, 'base64'));
    return fromBase64(sig);
  }
}

function createKeyVerifier(bits) {
  return function verify(thing, signature, publicKey) {
    checkIsPublicKey(publicKey);
    thing = normalizeInput(thing);
    signature = toBase64(signature);
    var verifier = crypto.createVerify('RSA-SHA' + bits);
    verifier.update(thing);
    return verifier.verify(publicKey, signature, 'base64');
  }
}

function createPSSKeySigner(bits) {
  return function sign(thing, privateKey) {
    checkIsPrivateKey(privateKey);
    thing = normalizeInput(thing);
    var signer = crypto.createSign('RSA-SHA' + bits);
    var sig = (signer.update(thing), signer.sign({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
    }, 'base64'));
    return fromBase64(sig);
  }
}

function createPSSKeyVerifier(bits) {
  return function verify(thing, signature, publicKey) {
    checkIsPublicKey(publicKey);
    thing = normalizeInput(thing);
    signature = toBase64(signature);
    var verifier = crypto.createVerify('RSA-SHA' + bits);
    verifier.update(thing);
    return verifier.verify({
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
    }, signature, 'base64');
  }
}

function createECDSASigner(bits) {
  var inner = createKeySigner(bits);
  return function sign() {
    var signature = inner.apply(null, arguments);
    signature = formatEcdsa.derToJose(signature, 'ES' + bits);
    return signature;
  };
}

function createECDSAVerifer(bits) {
  var inner = createKeyVerifier(bits);
  return function verify(thing, signature, publicKey) {
    signature = formatEcdsa.joseToDer(signature, 'ES' + bits).toString('base64');
    var result = inner(thing, signature, publicKey);
    return result;
  };
}

function createNoneSigner() {
  return function sign() {
    return '';
  }
}

function createNoneVerifier() {
  return function verify(thing, signature) {
    return signature === '';
  }
}

var jwa$2 = function jwa(algorithm) {
  var signerFactories = {
    hs: createHmacSigner,
    rs: createKeySigner,
    ps: createPSSKeySigner,
    es: createECDSASigner,
    none: createNoneSigner,
  };
  var verifierFactories = {
    hs: createHmacVerifier,
    rs: createKeyVerifier,
    ps: createPSSKeyVerifier,
    es: createECDSAVerifer,
    none: createNoneVerifier,
  };
  var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/i);
  if (!match)
    throw typeError(MSG_INVALID_ALGORITHM, algorithm);
  var algo = (match[1] || match[3]).toLowerCase();
  var bits = match[2];

  return {
    sign: signerFactories[algo](bits),
    verify: verifierFactories[algo](bits),
  }
};

/*global module*/

var Buffer$3 = require$$0.Buffer;

var tostring = function toString(obj) {
  if (typeof obj === 'string')
    return obj;
  if (typeof obj === 'number' || Buffer$3.isBuffer(obj))
    return obj.toString();
  return JSON.stringify(obj);
};

/*global module*/

var Buffer$2 = safeBufferExports.Buffer;
var DataStream$1 = dataStream;
var jwa$1 = jwa$2;
var Stream$1 = require$$3;
var toString$1 = tostring;
var util$1 = require$$5;

function base64url(string, encoding) {
  return Buffer$2
    .from(string, encoding)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function jwsSecuredInput(header, payload, encoding) {
  encoding = encoding || 'utf8';
  var encodedHeader = base64url(toString$1(header), 'binary');
  var encodedPayload = base64url(toString$1(payload), encoding);
  return util$1.format('%s.%s', encodedHeader, encodedPayload);
}

function jwsSign(opts) {
  var header = opts.header;
  var payload = opts.payload;
  var secretOrKey = opts.secret || opts.privateKey;
  var encoding = opts.encoding;
  var algo = jwa$1(header.alg);
  var securedInput = jwsSecuredInput(header, payload, encoding);
  var signature = algo.sign(securedInput, secretOrKey);
  return util$1.format('%s.%s', securedInput, signature);
}

function SignStream$1(opts) {
  var secret = opts.secret||opts.privateKey||opts.key;
  var secretStream = new DataStream$1(secret);
  this.readable = true;
  this.header = opts.header;
  this.encoding = opts.encoding;
  this.secret = this.privateKey = this.key = secretStream;
  this.payload = new DataStream$1(opts.payload);
  this.secret.once('close', function () {
    if (!this.payload.writable && this.readable)
      this.sign();
  }.bind(this));

  this.payload.once('close', function () {
    if (!this.secret.writable && this.readable)
      this.sign();
  }.bind(this));
}
util$1.inherits(SignStream$1, Stream$1);

SignStream$1.prototype.sign = function sign() {
  try {
    var signature = jwsSign({
      header: this.header,
      payload: this.payload.buffer,
      secret: this.secret.buffer,
      encoding: this.encoding
    });
    this.emit('done', signature);
    this.emit('data', signature);
    this.emit('end');
    this.readable = false;
    return signature;
  } catch (e) {
    this.readable = false;
    this.emit('error', e);
    this.emit('close');
  }
};

SignStream$1.sign = jwsSign;

var signStream = SignStream$1;

/*global module*/

var Buffer$1 = safeBufferExports.Buffer;
var DataStream = dataStream;
var jwa = jwa$2;
var Stream = require$$3;
var toString = tostring;
var util = require$$5;
var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;

function isObject$3(thing) {
  return Object.prototype.toString.call(thing) === '[object Object]';
}

function safeJsonParse(thing) {
  if (isObject$3(thing))
    return thing;
  try { return JSON.parse(thing); }
  catch (e) { return undefined; }
}

function headerFromJWS(jwsSig) {
  var encodedHeader = jwsSig.split('.', 1)[0];
  return safeJsonParse(Buffer$1.from(encodedHeader, 'base64').toString('binary'));
}

function securedInputFromJWS(jwsSig) {
  return jwsSig.split('.', 2).join('.');
}

function signatureFromJWS(jwsSig) {
  return jwsSig.split('.')[2];
}

function payloadFromJWS(jwsSig, encoding) {
  encoding = encoding || 'utf8';
  var payload = jwsSig.split('.')[1];
  return Buffer$1.from(payload, 'base64').toString(encoding);
}

function isValidJws(string) {
  return JWS_REGEX.test(string) && !!headerFromJWS(string);
}

function jwsVerify(jwsSig, algorithm, secretOrKey) {
  if (!algorithm) {
    var err = new Error("Missing algorithm parameter for jws.verify");
    err.code = "MISSING_ALGORITHM";
    throw err;
  }
  jwsSig = toString(jwsSig);
  var signature = signatureFromJWS(jwsSig);
  var securedInput = securedInputFromJWS(jwsSig);
  var algo = jwa(algorithm);
  return algo.verify(securedInput, signature, secretOrKey);
}

function jwsDecode(jwsSig, opts) {
  opts = opts || {};
  jwsSig = toString(jwsSig);

  if (!isValidJws(jwsSig))
    return null;

  var header = headerFromJWS(jwsSig);

  if (!header)
    return null;

  var payload = payloadFromJWS(jwsSig);
  if (header.typ === 'JWT' || opts.json)
    payload = JSON.parse(payload, opts.encoding);

  return {
    header: header,
    payload: payload,
    signature: signatureFromJWS(jwsSig)
  };
}

function VerifyStream$1(opts) {
  opts = opts || {};
  var secretOrKey = opts.secret||opts.publicKey||opts.key;
  var secretStream = new DataStream(secretOrKey);
  this.readable = true;
  this.algorithm = opts.algorithm;
  this.encoding = opts.encoding;
  this.secret = this.publicKey = this.key = secretStream;
  this.signature = new DataStream(opts.signature);
  this.secret.once('close', function () {
    if (!this.signature.writable && this.readable)
      this.verify();
  }.bind(this));

  this.signature.once('close', function () {
    if (!this.secret.writable && this.readable)
      this.verify();
  }.bind(this));
}
util.inherits(VerifyStream$1, Stream);
VerifyStream$1.prototype.verify = function verify() {
  try {
    var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
    var obj = jwsDecode(this.signature.buffer, this.encoding);
    this.emit('done', valid, obj);
    this.emit('data', valid);
    this.emit('end');
    this.readable = false;
    return valid;
  } catch (e) {
    this.readable = false;
    this.emit('error', e);
    this.emit('close');
  }
};

VerifyStream$1.decode = jwsDecode;
VerifyStream$1.isValid = isValidJws;
VerifyStream$1.verify = jwsVerify;

var verifyStream = VerifyStream$1;

/*global exports*/

var SignStream = signStream;
var VerifyStream = verifyStream;

var ALGORITHMS = [
  'HS256', 'HS384', 'HS512',
  'RS256', 'RS384', 'RS512',
  'PS256', 'PS384', 'PS512',
  'ES256', 'ES384', 'ES512'
];

jws$3.ALGORITHMS = ALGORITHMS;
jws$3.sign = SignStream.sign;
jws$3.verify = VerifyStream.verify;
jws$3.decode = VerifyStream.decode;
jws$3.isValid = VerifyStream.isValid;
jws$3.createSign = function createSign(opts) {
  return new SignStream(opts);
};
jws$3.createVerify = function createVerify(opts) {
  return new VerifyStream(opts);
};

var jws$2 = jws$3;

var decode$1 = function (jwt, options) {
  options = options || {};
  var decoded = jws$2.decode(jwt, options);
  if (!decoded) { return null; }
  var payload = decoded.payload;

  //try parse the payload
  if(typeof payload === 'string') {
    try {
      var obj = JSON.parse(payload);
      if(obj !== null && typeof obj === 'object') {
        payload = obj;
      }
    } catch (e) { }
  }

  //return header if `complete` option is enabled.  header includes claims
  //such as `kid` and `alg` used to select the key within a JWKS needed to
  //verify the signature
  if (options.complete === true) {
    return {
      header: decoded.header,
      payload: payload,
      signature: decoded.signature
    };
  }
  return payload;
};

var JsonWebTokenError$3 = function (message, error) {
  Error.call(this, message);
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  }
  this.name = 'JsonWebTokenError';
  this.message = message;
  if (error) this.inner = error;
};

JsonWebTokenError$3.prototype = Object.create(Error.prototype);
JsonWebTokenError$3.prototype.constructor = JsonWebTokenError$3;

var JsonWebTokenError_1 = JsonWebTokenError$3;

var JsonWebTokenError$2 = JsonWebTokenError_1;

var NotBeforeError$1 = function (message, date) {
  JsonWebTokenError$2.call(this, message);
  this.name = 'NotBeforeError';
  this.date = date;
};

NotBeforeError$1.prototype = Object.create(JsonWebTokenError$2.prototype);

NotBeforeError$1.prototype.constructor = NotBeforeError$1;

var NotBeforeError_1 = NotBeforeError$1;

var JsonWebTokenError$1 = JsonWebTokenError_1;

var TokenExpiredError$1 = function (message, expiredAt) {
  JsonWebTokenError$1.call(this, message);
  this.name = 'TokenExpiredError';
  this.expiredAt = expiredAt;
};

TokenExpiredError$1.prototype = Object.create(JsonWebTokenError$1.prototype);

TokenExpiredError$1.prototype.constructor = TokenExpiredError$1;

var TokenExpiredError_1 = TokenExpiredError$1;

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

var ms$1 = function (val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse$7(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse$7(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (msAbs >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (msAbs >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (msAbs >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  var msAbs = Math.abs(ms);
  if (msAbs >= d) {
    return plural(ms, msAbs, d, 'day');
  }
  if (msAbs >= h) {
    return plural(ms, msAbs, h, 'hour');
  }
  if (msAbs >= m) {
    return plural(ms, msAbs, m, 'minute');
  }
  if (msAbs >= s) {
    return plural(ms, msAbs, s, 'second');
  }
  return ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
}

var ms = ms$1;

var timespan$2 = function (time, iat) {
  var timestamp = iat || Math.floor(Date.now() / 1000);

  if (typeof time === 'string') {
    var milliseconds = ms(time);
    if (typeof milliseconds === 'undefined') {
      return;
    }
    return Math.floor(timestamp + milliseconds / 1000);
  } else if (typeof time === 'number') {
    return timestamp + time;
  } else {
    return;
  }

};

var re$2 = {exports: {}};

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
const SEMVER_SPEC_VERSION = '2.0.0';

const MAX_LENGTH$1 = 256;
const MAX_SAFE_INTEGER$2 = Number.MAX_SAFE_INTEGER ||
/* istanbul ignore next */ 9007199254740991;

// Max safe segment length for coercion.
const MAX_SAFE_COMPONENT_LENGTH = 16;

// Max safe length for a build identifier. The max length minus 6 characters for
// the shortest version with a build 0.0.0+BUILD.
const MAX_SAFE_BUILD_LENGTH = MAX_LENGTH$1 - 6;

const RELEASE_TYPES = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease',
];

var constants$1 = {
  MAX_LENGTH: MAX_LENGTH$1,
  MAX_SAFE_COMPONENT_LENGTH,
  MAX_SAFE_BUILD_LENGTH,
  MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$2,
  RELEASE_TYPES,
  SEMVER_SPEC_VERSION,
  FLAG_INCLUDE_PRERELEASE: 0b001,
  FLAG_LOOSE: 0b010,
};

const debug$1 = (
  typeof process === 'object' &&
  process.env &&
  process.env.NODE_DEBUG &&
  /\bsemver\b/i.test(process.env.NODE_DEBUG)
) ? (...args) => console.error('SEMVER', ...args)
  : () => {};

var debug_1 = debug$1;

(function (module, exports) {

	const {
	  MAX_SAFE_COMPONENT_LENGTH,
	  MAX_SAFE_BUILD_LENGTH,
	  MAX_LENGTH,
	} = constants$1;
	const debug = debug_1;
	exports = module.exports = {};

	// The actual regexps go on exports.re
	const re = exports.re = [];
	const safeRe = exports.safeRe = [];
	const src = exports.src = [];
	const safeSrc = exports.safeSrc = [];
	const t = exports.t = {};
	let R = 0;

	const LETTERDASHNUMBER = '[a-zA-Z0-9-]';

	// Replace some greedy regex tokens to prevent regex dos issues. These regex are
	// used internally via the safeRe object since all inputs in this library get
	// normalized first to trim and collapse all extra whitespace. The original
	// regexes are exported for userland consumption and lower level usage. A
	// future breaking change could export the safer regex only with a note that
	// all input should have extra whitespace removed.
	const safeRegexReplacements = [
	  ['\\s', 1],
	  ['\\d', MAX_LENGTH],
	  [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH],
	];

	const makeSafeRegex = (value) => {
	  for (const [token, max] of safeRegexReplacements) {
	    value = value
	      .split(`${token}*`).join(`${token}{0,${max}}`)
	      .split(`${token}+`).join(`${token}{1,${max}}`);
	  }
	  return value
	};

	const createToken = (name, value, isGlobal) => {
	  const safe = makeSafeRegex(value);
	  const index = R++;
	  debug(name, index, value);
	  t[name] = index;
	  src[index] = value;
	  safeSrc[index] = safe;
	  re[index] = new RegExp(value, isGlobal ? 'g' : undefined);
	  safeRe[index] = new RegExp(safe, isGlobal ? 'g' : undefined);
	};

	// The following Regular Expressions can be used for tokenizing,
	// validating, and parsing SemVer version strings.

	// ## Numeric Identifier
	// A single `0`, or a non-zero digit followed by zero or more digits.

	createToken('NUMERICIDENTIFIER', '0|[1-9]\\d*');
	createToken('NUMERICIDENTIFIERLOOSE', '\\d+');

	// ## Non-numeric Identifier
	// Zero or more digits, followed by a letter or hyphen, and then zero or
	// more letters, digits, or hyphens.

	createToken('NONNUMERICIDENTIFIER', `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);

	// ## Main Version
	// Three dot-separated numeric identifiers.

	createToken('MAINVERSION', `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})\\.` +
	                   `(${src[t.NUMERICIDENTIFIER]})`);

	createToken('MAINVERSIONLOOSE', `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.` +
	                        `(${src[t.NUMERICIDENTIFIERLOOSE]})`);

	// ## Pre-release Version Identifier
	// A numeric identifier, or a non-numeric identifier.
	// Non-numberic identifiers include numberic identifiers but can be longer.
	// Therefore non-numberic identifiers must go first.

	createToken('PRERELEASEIDENTIFIER', `(?:${src[t.NONNUMERICIDENTIFIER]
	}|${src[t.NUMERICIDENTIFIER]})`);

	createToken('PRERELEASEIDENTIFIERLOOSE', `(?:${src[t.NONNUMERICIDENTIFIER]
	}|${src[t.NUMERICIDENTIFIERLOOSE]})`);

	// ## Pre-release Version
	// Hyphen, followed by one or more dot-separated pre-release version
	// identifiers.

	createToken('PRERELEASE', `(?:-(${src[t.PRERELEASEIDENTIFIER]
	}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);

	createToken('PRERELEASELOOSE', `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]
	}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);

	// ## Build Metadata Identifier
	// Any combination of digits, letters, or hyphens.

	createToken('BUILDIDENTIFIER', `${LETTERDASHNUMBER}+`);

	// ## Build Metadata
	// Plus sign, followed by one or more period-separated build metadata
	// identifiers.

	createToken('BUILD', `(?:\\+(${src[t.BUILDIDENTIFIER]
	}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);

	// ## Full Version String
	// A main version, followed optionally by a pre-release version and
	// build metadata.

	// Note that the only major, minor, patch, and pre-release sections of
	// the version string are capturing groups.  The build metadata is not a
	// capturing group, because it should not ever be used in version
	// comparison.

	createToken('FULLPLAIN', `v?${src[t.MAINVERSION]
	}${src[t.PRERELEASE]}?${
	  src[t.BUILD]}?`);

	createToken('FULL', `^${src[t.FULLPLAIN]}$`);

	// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
	// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
	// common in the npm registry.
	createToken('LOOSEPLAIN', `[v=\\s]*${src[t.MAINVERSIONLOOSE]
	}${src[t.PRERELEASELOOSE]}?${
	  src[t.BUILD]}?`);

	createToken('LOOSE', `^${src[t.LOOSEPLAIN]}$`);

	createToken('GTLT', '((?:<|>)?=?)');

	// Something like "2.*" or "1.2.x".
	// Note that "x.x" is a valid xRange identifer, meaning "any version"
	// Only the first item is strictly required.
	createToken('XRANGEIDENTIFIERLOOSE', `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken('XRANGEIDENTIFIER', `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);

	createToken('XRANGEPLAIN', `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:\\.(${src[t.XRANGEIDENTIFIER]})` +
	                   `(?:${src[t.PRERELEASE]})?${
	                     src[t.BUILD]}?` +
	                   `)?)?`);

	createToken('XRANGEPLAINLOOSE', `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})` +
	                        `(?:${src[t.PRERELEASELOOSE]})?${
	                          src[t.BUILD]}?` +
	                        `)?)?`);

	createToken('XRANGE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken('XRANGELOOSE', `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);

	// Coercion.
	// Extract anything that could conceivably be a part of a valid semver
	createToken('COERCEPLAIN', `${'(^|[^\\d])' +
	              '(\\d{1,'}${MAX_SAFE_COMPONENT_LENGTH}})` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?` +
	              `(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken('COERCE', `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken('COERCEFULL', src[t.COERCEPLAIN] +
	              `(?:${src[t.PRERELEASE]})?` +
	              `(?:${src[t.BUILD]})?` +
	              `(?:$|[^\\d])`);
	createToken('COERCERTL', src[t.COERCE], true);
	createToken('COERCERTLFULL', src[t.COERCEFULL], true);

	// Tilde ranges.
	// Meaning is "reasonably at or greater than"
	createToken('LONETILDE', '(?:~>?)');

	createToken('TILDETRIM', `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = '$1~';

	createToken('TILDE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken('TILDELOOSE', `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);

	// Caret ranges.
	// Meaning is "at least and backwards compatible with"
	createToken('LONECARET', '(?:\\^)');

	createToken('CARETTRIM', `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = '$1^';

	createToken('CARET', `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken('CARETLOOSE', `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);

	// A simple gt/lt/eq thing, or just "" to indicate "any version"
	createToken('COMPARATORLOOSE', `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken('COMPARATOR', `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);

	// An expression to strip any whitespace between the gtlt and the thing
	// it modifies, so that `> 1.2.3` ==> `>1.2.3`
	createToken('COMPARATORTRIM', `(\\s*)${src[t.GTLT]
	}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = '$1$2$3';

	// Something like `1.2.3 - 1.2.4`
	// Note that these all use the loose form, because they'll be
	// checked against either the strict or loose comparator form
	// later.
	createToken('HYPHENRANGE', `^\\s*(${src[t.XRANGEPLAIN]})` +
	                   `\\s+-\\s+` +
	                   `(${src[t.XRANGEPLAIN]})` +
	                   `\\s*$`);

	createToken('HYPHENRANGELOOSE', `^\\s*(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s+-\\s+` +
	                        `(${src[t.XRANGEPLAINLOOSE]})` +
	                        `\\s*$`);

	// Star ranges basically just allow anything at all.
	createToken('STAR', '(<|>)?=?\\s*\\*');
	// >=0.0.0 is like a star
	createToken('GTE0', '^\\s*>=\\s*0\\.0\\.0\\s*$');
	createToken('GTE0PRE', '^\\s*>=\\s*0\\.0\\.0-0\\s*$'); 
} (re$2, re$2.exports));

var reExports = re$2.exports;

// parse out just the options we care about
const looseOption = Object.freeze({ loose: true });
const emptyOpts = Object.freeze({ });
const parseOptions$1 = options => {
  if (!options) {
    return emptyOpts
  }

  if (typeof options !== 'object') {
    return looseOption
  }

  return options
};
var parseOptions_1 = parseOptions$1;

const numeric = /^[0-9]+$/;
const compareIdentifiers$1 = (a, b) => {
  const anum = numeric.test(a);
  const bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return a === b ? 0
    : (anum && !bnum) ? -1
    : (bnum && !anum) ? 1
    : a < b ? -1
    : 1
};

const rcompareIdentifiers = (a, b) => compareIdentifiers$1(b, a);

var identifiers$1 = {
  compareIdentifiers: compareIdentifiers$1,
  rcompareIdentifiers,
};

const debug = debug_1;
const { MAX_LENGTH, MAX_SAFE_INTEGER: MAX_SAFE_INTEGER$1 } = constants$1;
const { safeRe: re$1, t: t$1 } = reExports;

const parseOptions = parseOptions_1;
const { compareIdentifiers } = identifiers$1;
let SemVer$d = class SemVer {
  constructor (version, options) {
    options = parseOptions(options);

    if (version instanceof SemVer) {
      if (version.loose === !!options.loose &&
        version.includePrerelease === !!options.includePrerelease) {
        return version
      } else {
        version = version.version;
      }
    } else if (typeof version !== 'string') {
      throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`)
    }

    if (version.length > MAX_LENGTH) {
      throw new TypeError(
        `version is longer than ${MAX_LENGTH} characters`
      )
    }

    debug('SemVer', version, options);
    this.options = options;
    this.loose = !!options.loose;
    // this isn't actually relevant for versions, but keep it so that we
    // don't run into trouble passing this.options around.
    this.includePrerelease = !!options.includePrerelease;

    const m = version.trim().match(options.loose ? re$1[t$1.LOOSE] : re$1[t$1.FULL]);

    if (!m) {
      throw new TypeError(`Invalid Version: ${version}`)
    }

    this.raw = version;

    // these are actually numbers
    this.major = +m[1];
    this.minor = +m[2];
    this.patch = +m[3];

    if (this.major > MAX_SAFE_INTEGER$1 || this.major < 0) {
      throw new TypeError('Invalid major version')
    }

    if (this.minor > MAX_SAFE_INTEGER$1 || this.minor < 0) {
      throw new TypeError('Invalid minor version')
    }

    if (this.patch > MAX_SAFE_INTEGER$1 || this.patch < 0) {
      throw new TypeError('Invalid patch version')
    }

    // numberify any prerelease numeric ids
    if (!m[4]) {
      this.prerelease = [];
    } else {
      this.prerelease = m[4].split('.').map((id) => {
        if (/^[0-9]+$/.test(id)) {
          const num = +id;
          if (num >= 0 && num < MAX_SAFE_INTEGER$1) {
            return num
          }
        }
        return id
      });
    }

    this.build = m[5] ? m[5].split('.') : [];
    this.format();
  }

  format () {
    this.version = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease.length) {
      this.version += `-${this.prerelease.join('.')}`;
    }
    return this.version
  }

  toString () {
    return this.version
  }

  compare (other) {
    debug('SemVer.compare', this.version, this.options, other);
    if (!(other instanceof SemVer)) {
      if (typeof other === 'string' && other === this.version) {
        return 0
      }
      other = new SemVer(other, this.options);
    }

    if (other.version === this.version) {
      return 0
    }

    return this.compareMain(other) || this.comparePre(other)
  }

  compareMain (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    return (
      compareIdentifiers(this.major, other.major) ||
      compareIdentifiers(this.minor, other.minor) ||
      compareIdentifiers(this.patch, other.patch)
    )
  }

  comparePre (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    // NOT having a prerelease is > having one
    if (this.prerelease.length && !other.prerelease.length) {
      return -1
    } else if (!this.prerelease.length && other.prerelease.length) {
      return 1
    } else if (!this.prerelease.length && !other.prerelease.length) {
      return 0
    }

    let i = 0;
    do {
      const a = this.prerelease[i];
      const b = other.prerelease[i];
      debug('prerelease compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  compareBuild (other) {
    if (!(other instanceof SemVer)) {
      other = new SemVer(other, this.options);
    }

    let i = 0;
    do {
      const a = this.build[i];
      const b = other.build[i];
      debug('build compare', i, a, b);
      if (a === undefined && b === undefined) {
        return 0
      } else if (b === undefined) {
        return 1
      } else if (a === undefined) {
        return -1
      } else if (a === b) {
        continue
      } else {
        return compareIdentifiers(a, b)
      }
    } while (++i)
  }

  // preminor will bump the version up to the next minor release, and immediately
  // down to pre-release. premajor and prepatch work the same way.
  inc (release, identifier, identifierBase) {
    if (release.startsWith('pre')) {
      if (!identifier && identifierBase === false) {
        throw new Error('invalid increment argument: identifier is empty')
      }
      // Avoid an invalid semver results
      if (identifier) {
        const match = `-${identifier}`.match(this.options.loose ? re$1[t$1.PRERELEASELOOSE] : re$1[t$1.PRERELEASE]);
        if (!match || match[1] !== identifier) {
          throw new Error(`invalid identifier: ${identifier}`)
        }
      }
    }

    switch (release) {
      case 'premajor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor = 0;
        this.major++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'preminor':
        this.prerelease.length = 0;
        this.patch = 0;
        this.minor++;
        this.inc('pre', identifier, identifierBase);
        break
      case 'prepatch':
        // If this is already a prerelease, it will bump to the next version
        // drop any prereleases that might already exist, since they are not
        // relevant at this point.
        this.prerelease.length = 0;
        this.inc('patch', identifier, identifierBase);
        this.inc('pre', identifier, identifierBase);
        break
      // If the input is a non-prerelease version, this acts the same as
      // prepatch.
      case 'prerelease':
        if (this.prerelease.length === 0) {
          this.inc('patch', identifier, identifierBase);
        }
        this.inc('pre', identifier, identifierBase);
        break
      case 'release':
        if (this.prerelease.length === 0) {
          throw new Error(`version ${this.raw} is not a prerelease`)
        }
        this.prerelease.length = 0;
        break

      case 'major':
        // If this is a pre-major version, bump up to the same major version.
        // Otherwise increment major.
        // 1.0.0-5 bumps to 1.0.0
        // 1.1.0 bumps to 2.0.0
        if (
          this.minor !== 0 ||
          this.patch !== 0 ||
          this.prerelease.length === 0
        ) {
          this.major++;
        }
        this.minor = 0;
        this.patch = 0;
        this.prerelease = [];
        break
      case 'minor':
        // If this is a pre-minor version, bump up to the same minor version.
        // Otherwise increment minor.
        // 1.2.0-5 bumps to 1.2.0
        // 1.2.1 bumps to 1.3.0
        if (this.patch !== 0 || this.prerelease.length === 0) {
          this.minor++;
        }
        this.patch = 0;
        this.prerelease = [];
        break
      case 'patch':
        // If this is not a pre-release version, it will increment the patch.
        // If it is a pre-release it will bump up to the same patch version.
        // 1.2.0-5 patches to 1.2.0
        // 1.2.0 patches to 1.2.1
        if (this.prerelease.length === 0) {
          this.patch++;
        }
        this.prerelease = [];
        break
      // This probably shouldn't be used publicly.
      // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
      case 'pre': {
        const base = Number(identifierBase) ? 1 : 0;

        if (this.prerelease.length === 0) {
          this.prerelease = [base];
        } else {
          let i = this.prerelease.length;
          while (--i >= 0) {
            if (typeof this.prerelease[i] === 'number') {
              this.prerelease[i]++;
              i = -2;
            }
          }
          if (i === -1) {
            // didn't increment anything
            if (identifier === this.prerelease.join('.') && identifierBase === false) {
              throw new Error('invalid increment argument: identifier already exists')
            }
            this.prerelease.push(base);
          }
        }
        if (identifier) {
          // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
          // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
          let prerelease = [identifier, base];
          if (identifierBase === false) {
            prerelease = [identifier];
          }
          if (compareIdentifiers(this.prerelease[0], identifier) === 0) {
            if (isNaN(this.prerelease[1])) {
              this.prerelease = prerelease;
            }
          } else {
            this.prerelease = prerelease;
          }
        }
        break
      }
      default:
        throw new Error(`invalid increment argument: ${release}`)
    }
    this.raw = this.format();
    if (this.build.length) {
      this.raw += `+${this.build.join('.')}`;
    }
    return this
  }
};

var semver$4 = SemVer$d;

const SemVer$c = semver$4;
const parse$6 = (version, options, throwErrors = false) => {
  if (version instanceof SemVer$c) {
    return version
  }
  try {
    return new SemVer$c(version, options)
  } catch (er) {
    if (!throwErrors) {
      return null
    }
    throw er
  }
};

var parse_1 = parse$6;

const parse$5 = parse_1;
const valid$2 = (version, options) => {
  const v = parse$5(version, options);
  return v ? v.version : null
};
var valid_1 = valid$2;

const parse$4 = parse_1;
const clean$1 = (version, options) => {
  const s = parse$4(version.trim().replace(/^[=v]+/, ''), options);
  return s ? s.version : null
};
var clean_1 = clean$1;

const SemVer$b = semver$4;

const inc$1 = (version, release, options, identifier, identifierBase) => {
  if (typeof (options) === 'string') {
    identifierBase = identifier;
    identifier = options;
    options = undefined;
  }

  try {
    return new SemVer$b(
      version instanceof SemVer$b ? version.version : version,
      options
    ).inc(release, identifier, identifierBase).version
  } catch (er) {
    return null
  }
};
var inc_1 = inc$1;

const parse$3 = parse_1;

const diff$1 = (version1, version2) => {
  const v1 = parse$3(version1, null, true);
  const v2 = parse$3(version2, null, true);
  const comparison = v1.compare(v2);

  if (comparison === 0) {
    return null
  }

  const v1Higher = comparison > 0;
  const highVersion = v1Higher ? v1 : v2;
  const lowVersion = v1Higher ? v2 : v1;
  const highHasPre = !!highVersion.prerelease.length;
  const lowHasPre = !!lowVersion.prerelease.length;

  if (lowHasPre && !highHasPre) {
    // Going from prerelease -> no prerelease requires some special casing

    // If the low version has only a major, then it will always be a major
    // Some examples:
    // 1.0.0-1 -> 1.0.0
    // 1.0.0-1 -> 1.1.1
    // 1.0.0-1 -> 2.0.0
    if (!lowVersion.patch && !lowVersion.minor) {
      return 'major'
    }

    // If the main part has no difference
    if (lowVersion.compareMain(highVersion) === 0) {
      if (lowVersion.minor && !lowVersion.patch) {
        return 'minor'
      }
      return 'patch'
    }
  }

  // add the `pre` prefix if we are going to a prerelease version
  const prefix = highHasPre ? 'pre' : '';

  if (v1.major !== v2.major) {
    return prefix + 'major'
  }

  if (v1.minor !== v2.minor) {
    return prefix + 'minor'
  }

  if (v1.patch !== v2.patch) {
    return prefix + 'patch'
  }

  // high and low are preleases
  return 'prerelease'
};

var diff_1 = diff$1;

const SemVer$a = semver$4;
const major$1 = (a, loose) => new SemVer$a(a, loose).major;
var major_1 = major$1;

const SemVer$9 = semver$4;
const minor$1 = (a, loose) => new SemVer$9(a, loose).minor;
var minor_1 = minor$1;

const SemVer$8 = semver$4;
const patch$1 = (a, loose) => new SemVer$8(a, loose).patch;
var patch_1 = patch$1;

const parse$2 = parse_1;
const prerelease$1 = (version, options) => {
  const parsed = parse$2(version, options);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null
};
var prerelease_1 = prerelease$1;

const SemVer$7 = semver$4;
const compare$b = (a, b, loose) =>
  new SemVer$7(a, loose).compare(new SemVer$7(b, loose));

var compare_1 = compare$b;

const compare$a = compare_1;
const rcompare$1 = (a, b, loose) => compare$a(b, a, loose);
var rcompare_1 = rcompare$1;

const compare$9 = compare_1;
const compareLoose$1 = (a, b) => compare$9(a, b, true);
var compareLoose_1 = compareLoose$1;

const SemVer$6 = semver$4;
const compareBuild$3 = (a, b, loose) => {
  const versionA = new SemVer$6(a, loose);
  const versionB = new SemVer$6(b, loose);
  return versionA.compare(versionB) || versionA.compareBuild(versionB)
};
var compareBuild_1 = compareBuild$3;

const compareBuild$2 = compareBuild_1;
const sort$1 = (list, loose) => list.sort((a, b) => compareBuild$2(a, b, loose));
var sort_1 = sort$1;

const compareBuild$1 = compareBuild_1;
const rsort$1 = (list, loose) => list.sort((a, b) => compareBuild$1(b, a, loose));
var rsort_1 = rsort$1;

const compare$8 = compare_1;
const gt$4 = (a, b, loose) => compare$8(a, b, loose) > 0;
var gt_1 = gt$4;

const compare$7 = compare_1;
const lt$3 = (a, b, loose) => compare$7(a, b, loose) < 0;
var lt_1 = lt$3;

const compare$6 = compare_1;
const eq$2 = (a, b, loose) => compare$6(a, b, loose) === 0;
var eq_1 = eq$2;

const compare$5 = compare_1;
const neq$2 = (a, b, loose) => compare$5(a, b, loose) !== 0;
var neq_1 = neq$2;

const compare$4 = compare_1;
const gte$3 = (a, b, loose) => compare$4(a, b, loose) >= 0;
var gte_1 = gte$3;

const compare$3 = compare_1;
const lte$3 = (a, b, loose) => compare$3(a, b, loose) <= 0;
var lte_1 = lte$3;

const eq$1 = eq_1;
const neq$1 = neq_1;
const gt$3 = gt_1;
const gte$2 = gte_1;
const lt$2 = lt_1;
const lte$2 = lte_1;

const cmp$1 = (a, op, b, loose) => {
  switch (op) {
    case '===':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a === b

    case '!==':
      if (typeof a === 'object') {
        a = a.version;
      }
      if (typeof b === 'object') {
        b = b.version;
      }
      return a !== b

    case '':
    case '=':
    case '==':
      return eq$1(a, b, loose)

    case '!=':
      return neq$1(a, b, loose)

    case '>':
      return gt$3(a, b, loose)

    case '>=':
      return gte$2(a, b, loose)

    case '<':
      return lt$2(a, b, loose)

    case '<=':
      return lte$2(a, b, loose)

    default:
      throw new TypeError(`Invalid operator: ${op}`)
  }
};
var cmp_1 = cmp$1;

const SemVer$5 = semver$4;
const parse$1 = parse_1;
const { safeRe: re, t } = reExports;

const coerce$1 = (version, options) => {
  if (version instanceof SemVer$5) {
    return version
  }

  if (typeof version === 'number') {
    version = String(version);
  }

  if (typeof version !== 'string') {
    return null
  }

  options = options || {};

  let match = null;
  if (!options.rtl) {
    match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
  } else {
    // Find the right-most coercible string that does not share
    // a terminus with a more left-ward coercible string.
    // Eg, '1.2.3.4' wants to coerce '2.3.4', not '3.4' or '4'
    // With includePrerelease option set, '1.2.3.4-rc' wants to coerce '2.3.4-rc', not '2.3.4'
    //
    // Walk through the string checking with a /g regexp
    // Manually set the index so as to pick up overlapping matches.
    // Stop when we get a match that ends at the string end, since no
    // coercible string can be more right-ward without the same terminus.
    const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
    let next;
    while ((next = coerceRtlRegex.exec(version)) &&
        (!match || match.index + match[0].length !== version.length)
    ) {
      if (!match ||
            next.index + next[0].length !== match.index + match[0].length) {
        match = next;
      }
      coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
    }
    // leave it in a clean state
    coerceRtlRegex.lastIndex = -1;
  }

  if (match === null) {
    return null
  }

  const major = match[2];
  const minor = match[3] || '0';
  const patch = match[4] || '0';
  const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : '';
  const build = options.includePrerelease && match[6] ? `+${match[6]}` : '';

  return parse$1(`${major}.${minor}.${patch}${prerelease}${build}`, options)
};
var coerce_1 = coerce$1;

class LRUCache {
  constructor () {
    this.max = 1000;
    this.map = new Map();
  }

  get (key) {
    const value = this.map.get(key);
    if (value === undefined) {
      return undefined
    } else {
      // Remove the key from the map and add it to the end
      this.map.delete(key);
      this.map.set(key, value);
      return value
    }
  }

  delete (key) {
    return this.map.delete(key)
  }

  set (key, value) {
    const deleted = this.delete(key);

    if (!deleted && value !== undefined) {
      // If cache is full, delete the least recently used item
      if (this.map.size >= this.max) {
        const firstKey = this.map.keys().next().value;
        this.delete(firstKey);
      }

      this.map.set(key, value);
    }

    return this
  }
}

var lrucache = LRUCache;

var range;
var hasRequiredRange;

function requireRange () {
	if (hasRequiredRange) return range;
	hasRequiredRange = 1;

	const SPACE_CHARACTERS = /\s+/g;

	// hoisted class for cyclic dependency
	class Range {
	  constructor (range, options) {
	    options = parseOptions(options);

	    if (range instanceof Range) {
	      if (
	        range.loose === !!options.loose &&
	        range.includePrerelease === !!options.includePrerelease
	      ) {
	        return range
	      } else {
	        return new Range(range.raw, options)
	      }
	    }

	    if (range instanceof Comparator) {
	      // just put it in the set and return
	      this.raw = range.value;
	      this.set = [[range]];
	      this.formatted = undefined;
	      return this
	    }

	    this.options = options;
	    this.loose = !!options.loose;
	    this.includePrerelease = !!options.includePrerelease;

	    // First reduce all whitespace as much as possible so we do not have to rely
	    // on potentially slow regexes like \s*. This is then stored and used for
	    // future error messages as well.
	    this.raw = range.trim().replace(SPACE_CHARACTERS, ' ');

	    // First, split on ||
	    this.set = this.raw
	      .split('||')
	      // map the range to a 2d array of comparators
	      .map(r => this.parseRange(r.trim()))
	      // throw out any comparator lists that are empty
	      // this generally means that it was not a valid range, which is allowed
	      // in loose mode, but will still throw if the WHOLE range is invalid.
	      .filter(c => c.length);

	    if (!this.set.length) {
	      throw new TypeError(`Invalid SemVer Range: ${this.raw}`)
	    }

	    // if we have any that are not the null set, throw out null sets.
	    if (this.set.length > 1) {
	      // keep the first one, in case they're all null sets
	      const first = this.set[0];
	      this.set = this.set.filter(c => !isNullSet(c[0]));
	      if (this.set.length === 0) {
	        this.set = [first];
	      } else if (this.set.length > 1) {
	        // if we have any that are *, then the range is just *
	        for (const c of this.set) {
	          if (c.length === 1 && isAny(c[0])) {
	            this.set = [c];
	            break
	          }
	        }
	      }
	    }

	    this.formatted = undefined;
	  }

	  get range () {
	    if (this.formatted === undefined) {
	      this.formatted = '';
	      for (let i = 0; i < this.set.length; i++) {
	        if (i > 0) {
	          this.formatted += '||';
	        }
	        const comps = this.set[i];
	        for (let k = 0; k < comps.length; k++) {
	          if (k > 0) {
	            this.formatted += ' ';
	          }
	          this.formatted += comps[k].toString().trim();
	        }
	      }
	    }
	    return this.formatted
	  }

	  format () {
	    return this.range
	  }

	  toString () {
	    return this.range
	  }

	  parseRange (range) {
	    // memoize range parsing for performance.
	    // this is a very hot path, and fully deterministic.
	    const memoOpts =
	      (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) |
	      (this.options.loose && FLAG_LOOSE);
	    const memoKey = memoOpts + ':' + range;
	    const cached = cache.get(memoKey);
	    if (cached) {
	      return cached
	    }

	    const loose = this.options.loose;
	    // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
	    const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
	    range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
	    debug('hyphen replace', range);

	    // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
	    range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
	    debug('comparator trim', range);

	    // `~ 1.2.3` => `~1.2.3`
	    range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
	    debug('tilde trim', range);

	    // `^ 1.2.3` => `^1.2.3`
	    range = range.replace(re[t.CARETTRIM], caretTrimReplace);
	    debug('caret trim', range);

	    // At this point, the range is completely trimmed and
	    // ready to be split into comparators.

	    let rangeList = range
	      .split(' ')
	      .map(comp => parseComparator(comp, this.options))
	      .join(' ')
	      .split(/\s+/)
	      // >=0.0.0 is equivalent to *
	      .map(comp => replaceGTE0(comp, this.options));

	    if (loose) {
	      // in loose mode, throw out any that are not valid comparators
	      rangeList = rangeList.filter(comp => {
	        debug('loose invalid filter', comp, this.options);
	        return !!comp.match(re[t.COMPARATORLOOSE])
	      });
	    }
	    debug('range list', rangeList);

	    // if any comparators are the null set, then replace with JUST null set
	    // if more than one comparator, remove any * comparators
	    // also, don't include the same comparator more than once
	    const rangeMap = new Map();
	    const comparators = rangeList.map(comp => new Comparator(comp, this.options));
	    for (const comp of comparators) {
	      if (isNullSet(comp)) {
	        return [comp]
	      }
	      rangeMap.set(comp.value, comp);
	    }
	    if (rangeMap.size > 1 && rangeMap.has('')) {
	      rangeMap.delete('');
	    }

	    const result = [...rangeMap.values()];
	    cache.set(memoKey, result);
	    return result
	  }

	  intersects (range, options) {
	    if (!(range instanceof Range)) {
	      throw new TypeError('a Range is required')
	    }

	    return this.set.some((thisComparators) => {
	      return (
	        isSatisfiable(thisComparators, options) &&
	        range.set.some((rangeComparators) => {
	          return (
	            isSatisfiable(rangeComparators, options) &&
	            thisComparators.every((thisComparator) => {
	              return rangeComparators.every((rangeComparator) => {
	                return thisComparator.intersects(rangeComparator, options)
	              })
	            })
	          )
	        })
	      )
	    })
	  }

	  // if ANY of the sets match ALL of its comparators, then pass
	  test (version) {
	    if (!version) {
	      return false
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    for (let i = 0; i < this.set.length; i++) {
	      if (testSet(this.set[i], version, this.options)) {
	        return true
	      }
	    }
	    return false
	  }
	}

	range = Range;

	const LRU = lrucache;
	const cache = new LRU();

	const parseOptions = parseOptions_1;
	const Comparator = requireComparator();
	const debug = debug_1;
	const SemVer = semver$4;
	const {
	  safeRe: re,
	  t,
	  comparatorTrimReplace,
	  tildeTrimReplace,
	  caretTrimReplace,
	} = reExports;
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = constants$1;

	const isNullSet = c => c.value === '<0.0.0-0';
	const isAny = c => c.value === '';

	// take a set of comparators and determine whether there
	// exists a version which can satisfy it
	const isSatisfiable = (comparators, options) => {
	  let result = true;
	  const remainingComparators = comparators.slice();
	  let testComparator = remainingComparators.pop();

	  while (result && remainingComparators.length) {
	    result = remainingComparators.every((otherComparator) => {
	      return testComparator.intersects(otherComparator, options)
	    });

	    testComparator = remainingComparators.pop();
	  }

	  return result
	};

	// comprised of xranges, tildes, stars, and gtlt's at this point.
	// already replaced the hyphen ranges
	// turn into a set of JUST comparators.
	const parseComparator = (comp, options) => {
	  debug('comp', comp, options);
	  comp = replaceCarets(comp, options);
	  debug('caret', comp);
	  comp = replaceTildes(comp, options);
	  debug('tildes', comp);
	  comp = replaceXRanges(comp, options);
	  debug('xrange', comp);
	  comp = replaceStars(comp, options);
	  debug('stars', comp);
	  return comp
	};

	const isX = id => !id || id.toLowerCase() === 'x' || id === '*';

	// ~, ~> --> * (any, kinda silly)
	// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0-0
	// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0-0
	// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0-0
	// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0-0
	// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0-0
	// ~0.0.1 --> >=0.0.1 <0.1.0-0
	const replaceTildes = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceTilde(c, options))
	    .join(' ')
	};

	const replaceTilde = (comp, options) => {
	  const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('tilde', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      // ~1.2 == >=1.2.0 <1.3.0-0
	      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
	    } else if (pr) {
	      debug('replaceTilde pr', pr);
	      ret = `>=${M}.${m}.${p}-${pr
	      } <${M}.${+m + 1}.0-0`;
	    } else {
	      // ~1.2.3 == >=1.2.3 <1.3.0-0
	      ret = `>=${M}.${m}.${p
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('tilde return', ret);
	    return ret
	  })
	};

	// ^ --> * (any, kinda silly)
	// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0-0
	// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0-0
	// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0-0
	// ^1.2.3 --> >=1.2.3 <2.0.0-0
	// ^1.2.0 --> >=1.2.0 <2.0.0-0
	// ^0.0.1 --> >=0.0.1 <0.0.2-0
	// ^0.1.0 --> >=0.1.0 <0.2.0-0
	const replaceCarets = (comp, options) => {
	  return comp
	    .trim()
	    .split(/\s+/)
	    .map((c) => replaceCaret(c, options))
	    .join(' ')
	};

	const replaceCaret = (comp, options) => {
	  debug('caret', comp, options);
	  const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
	  const z = options.includePrerelease ? '-0' : '';
	  return comp.replace(r, (_, M, m, p, pr) => {
	    debug('caret', comp, _, M, m, p, pr);
	    let ret;

	    if (isX(M)) {
	      ret = '';
	    } else if (isX(m)) {
	      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
	    } else if (isX(p)) {
	      if (M === '0') {
	        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
	      } else {
	        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
	      }
	    } else if (pr) {
	      debug('replaceCaret pr', pr);
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p}-${pr
	          } <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p}-${pr
	        } <${+M + 1}.0.0-0`;
	      }
	    } else {
	      debug('no pr');
	      if (M === '0') {
	        if (m === '0') {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${m}.${+p + 1}-0`;
	        } else {
	          ret = `>=${M}.${m}.${p
	          }${z} <${M}.${+m + 1}.0-0`;
	        }
	      } else {
	        ret = `>=${M}.${m}.${p
	        } <${+M + 1}.0.0-0`;
	      }
	    }

	    debug('caret return', ret);
	    return ret
	  })
	};

	const replaceXRanges = (comp, options) => {
	  debug('replaceXRanges', comp, options);
	  return comp
	    .split(/\s+/)
	    .map((c) => replaceXRange(c, options))
	    .join(' ')
	};

	const replaceXRange = (comp, options) => {
	  comp = comp.trim();
	  const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
	  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
	    debug('xRange', comp, ret, gtlt, M, m, p, pr);
	    const xM = isX(M);
	    const xm = xM || isX(m);
	    const xp = xm || isX(p);
	    const anyX = xp;

	    if (gtlt === '=' && anyX) {
	      gtlt = '';
	    }

	    // if we're including prereleases in the match, then we need
	    // to fix this to -0, the lowest possible prerelease value
	    pr = options.includePrerelease ? '-0' : '';

	    if (xM) {
	      if (gtlt === '>' || gtlt === '<') {
	        // nothing is allowed
	        ret = '<0.0.0-0';
	      } else {
	        // nothing is forbidden
	        ret = '*';
	      }
	    } else if (gtlt && anyX) {
	      // we know patch is an x, because we have any x at all.
	      // replace X with 0
	      if (xm) {
	        m = 0;
	      }
	      p = 0;

	      if (gtlt === '>') {
	        // >1 => >=2.0.0
	        // >1.2 => >=1.3.0
	        gtlt = '>=';
	        if (xm) {
	          M = +M + 1;
	          m = 0;
	          p = 0;
	        } else {
	          m = +m + 1;
	          p = 0;
	        }
	      } else if (gtlt === '<=') {
	        // <=0.7.x is actually <0.8.0, since any 0.7.x should
	        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
	        gtlt = '<';
	        if (xm) {
	          M = +M + 1;
	        } else {
	          m = +m + 1;
	        }
	      }

	      if (gtlt === '<') {
	        pr = '-0';
	      }

	      ret = `${gtlt + M}.${m}.${p}${pr}`;
	    } else if (xm) {
	      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
	    } else if (xp) {
	      ret = `>=${M}.${m}.0${pr
	      } <${M}.${+m + 1}.0-0`;
	    }

	    debug('xRange return', ret);

	    return ret
	  })
	};

	// Because * is AND-ed with everything else in the comparator,
	// and '' means "any version", just remove the *s entirely.
	const replaceStars = (comp, options) => {
	  debug('replaceStars', comp, options);
	  // Looseness is ignored here.  star is always as loose as it gets!
	  return comp
	    .trim()
	    .replace(re[t.STAR], '')
	};

	const replaceGTE0 = (comp, options) => {
	  debug('replaceGTE0', comp, options);
	  return comp
	    .trim()
	    .replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], '')
	};

	// This function is passed to string.replace(re[t.HYPHENRANGE])
	// M, m, patch, prerelease, build
	// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
	// 1.2.3 - 3.4 => >=1.2.0 <3.5.0-0 Any 3.4.x will do
	// 1.2 - 3.4 => >=1.2.0 <3.5.0-0
	// TODO build?
	const hyphenReplace = incPr => ($0,
	  from, fM, fm, fp, fpr, fb,
	  to, tM, tm, tp, tpr) => {
	  if (isX(fM)) {
	    from = '';
	  } else if (isX(fm)) {
	    from = `>=${fM}.0.0${incPr ? '-0' : ''}`;
	  } else if (isX(fp)) {
	    from = `>=${fM}.${fm}.0${incPr ? '-0' : ''}`;
	  } else if (fpr) {
	    from = `>=${from}`;
	  } else {
	    from = `>=${from}${incPr ? '-0' : ''}`;
	  }

	  if (isX(tM)) {
	    to = '';
	  } else if (isX(tm)) {
	    to = `<${+tM + 1}.0.0-0`;
	  } else if (isX(tp)) {
	    to = `<${tM}.${+tm + 1}.0-0`;
	  } else if (tpr) {
	    to = `<=${tM}.${tm}.${tp}-${tpr}`;
	  } else if (incPr) {
	    to = `<${tM}.${tm}.${+tp + 1}-0`;
	  } else {
	    to = `<=${to}`;
	  }

	  return `${from} ${to}`.trim()
	};

	const testSet = (set, version, options) => {
	  for (let i = 0; i < set.length; i++) {
	    if (!set[i].test(version)) {
	      return false
	    }
	  }

	  if (version.prerelease.length && !options.includePrerelease) {
	    // Find the set of versions that are allowed to have prereleases
	    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
	    // That should allow `1.2.3-pr.2` to pass.
	    // However, `1.2.4-alpha.notready` should NOT be allowed,
	    // even though it's within the range set by the comparators.
	    for (let i = 0; i < set.length; i++) {
	      debug(set[i].semver);
	      if (set[i].semver === Comparator.ANY) {
	        continue
	      }

	      if (set[i].semver.prerelease.length > 0) {
	        const allowed = set[i].semver;
	        if (allowed.major === version.major &&
	            allowed.minor === version.minor &&
	            allowed.patch === version.patch) {
	          return true
	        }
	      }
	    }

	    // Version has a -pre, but it's not one of the ones we like.
	    return false
	  }

	  return true
	};
	return range;
}

var comparator;
var hasRequiredComparator;

function requireComparator () {
	if (hasRequiredComparator) return comparator;
	hasRequiredComparator = 1;

	const ANY = Symbol('SemVer ANY');
	// hoisted class for cyclic dependency
	class Comparator {
	  static get ANY () {
	    return ANY
	  }

	  constructor (comp, options) {
	    options = parseOptions(options);

	    if (comp instanceof Comparator) {
	      if (comp.loose === !!options.loose) {
	        return comp
	      } else {
	        comp = comp.value;
	      }
	    }

	    comp = comp.trim().split(/\s+/).join(' ');
	    debug('comparator', comp, options);
	    this.options = options;
	    this.loose = !!options.loose;
	    this.parse(comp);

	    if (this.semver === ANY) {
	      this.value = '';
	    } else {
	      this.value = this.operator + this.semver.version;
	    }

	    debug('comp', this);
	  }

	  parse (comp) {
	    const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
	    const m = comp.match(r);

	    if (!m) {
	      throw new TypeError(`Invalid comparator: ${comp}`)
	    }

	    this.operator = m[1] !== undefined ? m[1] : '';
	    if (this.operator === '=') {
	      this.operator = '';
	    }

	    // if it literally is just '>' or '' then allow anything.
	    if (!m[2]) {
	      this.semver = ANY;
	    } else {
	      this.semver = new SemVer(m[2], this.options.loose);
	    }
	  }

	  toString () {
	    return this.value
	  }

	  test (version) {
	    debug('Comparator.test', version, this.options.loose);

	    if (this.semver === ANY || version === ANY) {
	      return true
	    }

	    if (typeof version === 'string') {
	      try {
	        version = new SemVer(version, this.options);
	      } catch (er) {
	        return false
	      }
	    }

	    return cmp(version, this.operator, this.semver, this.options)
	  }

	  intersects (comp, options) {
	    if (!(comp instanceof Comparator)) {
	      throw new TypeError('a Comparator is required')
	    }

	    if (this.operator === '') {
	      if (this.value === '') {
	        return true
	      }
	      return new Range(comp.value, options).test(this.value)
	    } else if (comp.operator === '') {
	      if (comp.value === '') {
	        return true
	      }
	      return new Range(this.value, options).test(comp.semver)
	    }

	    options = parseOptions(options);

	    // Special cases where nothing can possibly be lower
	    if (options.includePrerelease &&
	      (this.value === '<0.0.0-0' || comp.value === '<0.0.0-0')) {
	      return false
	    }
	    if (!options.includePrerelease &&
	      (this.value.startsWith('<0.0.0') || comp.value.startsWith('<0.0.0'))) {
	      return false
	    }

	    // Same direction increasing (> or >=)
	    if (this.operator.startsWith('>') && comp.operator.startsWith('>')) {
	      return true
	    }
	    // Same direction decreasing (< or <=)
	    if (this.operator.startsWith('<') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // same SemVer and both sides are inclusive (<= or >=)
	    if (
	      (this.semver.version === comp.semver.version) &&
	      this.operator.includes('=') && comp.operator.includes('=')) {
	      return true
	    }
	    // opposite directions less than
	    if (cmp(this.semver, '<', comp.semver, options) &&
	      this.operator.startsWith('>') && comp.operator.startsWith('<')) {
	      return true
	    }
	    // opposite directions greater than
	    if (cmp(this.semver, '>', comp.semver, options) &&
	      this.operator.startsWith('<') && comp.operator.startsWith('>')) {
	      return true
	    }
	    return false
	  }
	}

	comparator = Comparator;

	const parseOptions = parseOptions_1;
	const { safeRe: re, t } = reExports;
	const cmp = cmp_1;
	const debug = debug_1;
	const SemVer = semver$4;
	const Range = requireRange();
	return comparator;
}

const Range$9 = requireRange();
const satisfies$4 = (version, range, options) => {
  try {
    range = new Range$9(range, options);
  } catch (er) {
    return false
  }
  return range.test(version)
};
var satisfies_1 = satisfies$4;

const Range$8 = requireRange();

// Mostly just for testing and legacy API reasons
const toComparators$1 = (range, options) =>
  new Range$8(range, options).set
    .map(comp => comp.map(c => c.value).join(' ').trim().split(' '));

var toComparators_1 = toComparators$1;

const SemVer$4 = semver$4;
const Range$7 = requireRange();

const maxSatisfying$1 = (versions, range, options) => {
  let max = null;
  let maxSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$7(range, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!max || maxSV.compare(v) === -1) {
        // compare(max, v, true)
        max = v;
        maxSV = new SemVer$4(max, options);
      }
    }
  });
  return max
};
var maxSatisfying_1 = maxSatisfying$1;

const SemVer$3 = semver$4;
const Range$6 = requireRange();
const minSatisfying$1 = (versions, range, options) => {
  let min = null;
  let minSV = null;
  let rangeObj = null;
  try {
    rangeObj = new Range$6(range, options);
  } catch (er) {
    return null
  }
  versions.forEach((v) => {
    if (rangeObj.test(v)) {
      // satisfies(v, range, options)
      if (!min || minSV.compare(v) === 1) {
        // compare(min, v, true)
        min = v;
        minSV = new SemVer$3(min, options);
      }
    }
  });
  return min
};
var minSatisfying_1 = minSatisfying$1;

const SemVer$2 = semver$4;
const Range$5 = requireRange();
const gt$2 = gt_1;

const minVersion$1 = (range, loose) => {
  range = new Range$5(range, loose);

  let minver = new SemVer$2('0.0.0');
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer$2('0.0.0-0');
  if (range.test(minver)) {
    return minver
  }

  minver = null;
  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i];

    let setMin = null;
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer$2(comparator.semver.version);
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++;
          } else {
            compver.prerelease.push(0);
          }
          compver.raw = compver.format();
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt$2(compver, setMin)) {
            setMin = compver;
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    });
    if (setMin && (!minver || gt$2(minver, setMin))) {
      minver = setMin;
    }
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
};
var minVersion_1 = minVersion$1;

const Range$4 = requireRange();
const validRange$1 = (range, options) => {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range$4(range, options).range || '*'
  } catch (er) {
    return null
  }
};
var valid$1 = validRange$1;

const SemVer$1 = semver$4;
const Comparator$2 = requireComparator();
const { ANY: ANY$1 } = Comparator$2;
const Range$3 = requireRange();
const satisfies$3 = satisfies_1;
const gt$1 = gt_1;
const lt$1 = lt_1;
const lte$1 = lte_1;
const gte$1 = gte_1;

const outside$3 = (version, range, hilo, options) => {
  version = new SemVer$1(version, options);
  range = new Range$3(range, options);

  let gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt$1;
      ltefn = lte$1;
      ltfn = lt$1;
      comp = '>';
      ecomp = '>=';
      break
    case '<':
      gtfn = lt$1;
      ltefn = gte$1;
      ltfn = gt$1;
      comp = '<';
      ecomp = '<=';
      break
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"')
  }

  // If it satisfies the range it is not outside
  if (satisfies$3(version, range, options)) {
    return false
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i];

    let high = null;
    let low = null;

    comparators.forEach((comparator) => {
      if (comparator.semver === ANY$1) {
        comparator = new Comparator$2('>=0.0.0');
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, options)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, options)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false
    }
  }
  return true
};

var outside_1 = outside$3;

// Determine if version is greater than all the versions possible in the range.
const outside$2 = outside_1;
const gtr$1 = (version, range, options) => outside$2(version, range, '>', options);
var gtr_1 = gtr$1;

const outside$1 = outside_1;
// Determine if version is less than all the versions possible in the range
const ltr$1 = (version, range, options) => outside$1(version, range, '<', options);
var ltr_1 = ltr$1;

const Range$2 = requireRange();
const intersects$1 = (r1, r2, options) => {
  r1 = new Range$2(r1, options);
  r2 = new Range$2(r2, options);
  return r1.intersects(r2, options)
};
var intersects_1 = intersects$1;

// given a set of versions and a range, create a "simplified" range
// that includes the same versions that the original range does
// If the original range is shorter than the simplified one, return that.
const satisfies$2 = satisfies_1;
const compare$2 = compare_1;
var simplify = (versions, range, options) => {
  const set = [];
  let first = null;
  let prev = null;
  const v = versions.sort((a, b) => compare$2(a, b, options));
  for (const version of v) {
    const included = satisfies$2(version, range, options);
    if (included) {
      prev = version;
      if (!first) {
        first = version;
      }
    } else {
      if (prev) {
        set.push([first, prev]);
      }
      prev = null;
      first = null;
    }
  }
  if (first) {
    set.push([first, null]);
  }

  const ranges = [];
  for (const [min, max] of set) {
    if (min === max) {
      ranges.push(min);
    } else if (!max && min === v[0]) {
      ranges.push('*');
    } else if (!max) {
      ranges.push(`>=${min}`);
    } else if (min === v[0]) {
      ranges.push(`<=${max}`);
    } else {
      ranges.push(`${min} - ${max}`);
    }
  }
  const simplified = ranges.join(' || ');
  const original = typeof range.raw === 'string' ? range.raw : String(range);
  return simplified.length < original.length ? simplified : range
};

const Range$1 = requireRange();
const Comparator$1 = requireComparator();
const { ANY } = Comparator$1;
const satisfies$1 = satisfies_1;
const compare$1 = compare_1;

// Complex range `r1 || r2 || ...` is a subset of `R1 || R2 || ...` iff:
// - Every simple range `r1, r2, ...` is a null set, OR
// - Every simple range `r1, r2, ...` which is not a null set is a subset of
//   some `R1, R2, ...`
//
// Simple range `c1 c2 ...` is a subset of simple range `C1 C2 ...` iff:
// - If c is only the ANY comparator
//   - If C is only the ANY comparator, return true
//   - Else if in prerelease mode, return false
//   - else replace c with `[>=0.0.0]`
// - If C is only the ANY comparator
//   - if in prerelease mode, return true
//   - else replace C with `[>=0.0.0]`
// - Let EQ be the set of = comparators in c
// - If EQ is more than one, return true (null set)
// - Let GT be the highest > or >= comparator in c
// - Let LT be the lowest < or <= comparator in c
// - If GT and LT, and GT.semver > LT.semver, return true (null set)
// - If any C is a = range, and GT or LT are set, return false
// - If EQ
//   - If GT, and EQ does not satisfy GT, return true (null set)
//   - If LT, and EQ does not satisfy LT, return true (null set)
//   - If EQ satisfies every C, return true
//   - Else return false
// - If GT
//   - If GT.semver is lower than any > or >= comp in C, return false
//   - If GT is >=, and GT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the GT.semver tuple, return false
// - If LT
//   - If LT.semver is greater than any < or <= comp in C, return false
//   - If LT is <=, and LT.semver does not satisfy every C, return false
//   - If GT.semver has a prerelease, and not in prerelease mode
//     - If no C has a prerelease and the LT.semver tuple, return false
// - Else return true

const subset$1 = (sub, dom, options = {}) => {
  if (sub === dom) {
    return true
  }

  sub = new Range$1(sub, options);
  dom = new Range$1(dom, options);
  let sawNonNull = false;

  OUTER: for (const simpleSub of sub.set) {
    for (const simpleDom of dom.set) {
      const isSub = simpleSubset(simpleSub, simpleDom, options);
      sawNonNull = sawNonNull || isSub !== null;
      if (isSub) {
        continue OUTER
      }
    }
    // the null set is a subset of everything, but null simple ranges in
    // a complex range should be ignored.  so if we saw a non-null range,
    // then we know this isn't a subset, but if EVERY simple range was null,
    // then it is a subset.
    if (sawNonNull) {
      return false
    }
  }
  return true
};

const minimumVersionWithPreRelease = [new Comparator$1('>=0.0.0-0')];
const minimumVersion = [new Comparator$1('>=0.0.0')];

const simpleSubset = (sub, dom, options) => {
  if (sub === dom) {
    return true
  }

  if (sub.length === 1 && sub[0].semver === ANY) {
    if (dom.length === 1 && dom[0].semver === ANY) {
      return true
    } else if (options.includePrerelease) {
      sub = minimumVersionWithPreRelease;
    } else {
      sub = minimumVersion;
    }
  }

  if (dom.length === 1 && dom[0].semver === ANY) {
    if (options.includePrerelease) {
      return true
    } else {
      dom = minimumVersion;
    }
  }

  const eqSet = new Set();
  let gt, lt;
  for (const c of sub) {
    if (c.operator === '>' || c.operator === '>=') {
      gt = higherGT(gt, c, options);
    } else if (c.operator === '<' || c.operator === '<=') {
      lt = lowerLT(lt, c, options);
    } else {
      eqSet.add(c.semver);
    }
  }

  if (eqSet.size > 1) {
    return null
  }

  let gtltComp;
  if (gt && lt) {
    gtltComp = compare$1(gt.semver, lt.semver, options);
    if (gtltComp > 0) {
      return null
    } else if (gtltComp === 0 && (gt.operator !== '>=' || lt.operator !== '<=')) {
      return null
    }
  }

  // will iterate one or zero times
  for (const eq of eqSet) {
    if (gt && !satisfies$1(eq, String(gt), options)) {
      return null
    }

    if (lt && !satisfies$1(eq, String(lt), options)) {
      return null
    }

    for (const c of dom) {
      if (!satisfies$1(eq, String(c), options)) {
        return false
      }
    }

    return true
  }

  let higher, lower;
  let hasDomLT, hasDomGT;
  // if the subset has a prerelease, we need a comparator in the superset
  // with the same tuple and a prerelease, or it's not a subset
  let needDomLTPre = lt &&
    !options.includePrerelease &&
    lt.semver.prerelease.length ? lt.semver : false;
  let needDomGTPre = gt &&
    !options.includePrerelease &&
    gt.semver.prerelease.length ? gt.semver : false;
  // exception: <1.2.3-0 is the same as <1.2.3
  if (needDomLTPre && needDomLTPre.prerelease.length === 1 &&
      lt.operator === '<' && needDomLTPre.prerelease[0] === 0) {
    needDomLTPre = false;
  }

  for (const c of dom) {
    hasDomGT = hasDomGT || c.operator === '>' || c.operator === '>=';
    hasDomLT = hasDomLT || c.operator === '<' || c.operator === '<=';
    if (gt) {
      if (needDomGTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomGTPre.major &&
            c.semver.minor === needDomGTPre.minor &&
            c.semver.patch === needDomGTPre.patch) {
          needDomGTPre = false;
        }
      }
      if (c.operator === '>' || c.operator === '>=') {
        higher = higherGT(gt, c, options);
        if (higher === c && higher !== gt) {
          return false
        }
      } else if (gt.operator === '>=' && !satisfies$1(gt.semver, String(c), options)) {
        return false
      }
    }
    if (lt) {
      if (needDomLTPre) {
        if (c.semver.prerelease && c.semver.prerelease.length &&
            c.semver.major === needDomLTPre.major &&
            c.semver.minor === needDomLTPre.minor &&
            c.semver.patch === needDomLTPre.patch) {
          needDomLTPre = false;
        }
      }
      if (c.operator === '<' || c.operator === '<=') {
        lower = lowerLT(lt, c, options);
        if (lower === c && lower !== lt) {
          return false
        }
      } else if (lt.operator === '<=' && !satisfies$1(lt.semver, String(c), options)) {
        return false
      }
    }
    if (!c.operator && (lt || gt) && gtltComp !== 0) {
      return false
    }
  }

  // if there was a < or >, and nothing in the dom, then must be false
  // UNLESS it was limited by another range in the other direction.
  // Eg, >1.0.0 <1.0.1 is still a subset of <2.0.0
  if (gt && hasDomLT && !lt && gtltComp !== 0) {
    return false
  }

  if (lt && hasDomGT && !gt && gtltComp !== 0) {
    return false
  }

  // we needed a prerelease range in a specific tuple, but didn't get one
  // then this isn't a subset.  eg >=1.2.3-pre is not a subset of >=1.0.0,
  // because it includes prereleases in the 1.2.3 tuple
  if (needDomGTPre || needDomLTPre) {
    return false
  }

  return true
};

// >=1.2.3 is lower than >1.2.3
const higherGT = (a, b, options) => {
  if (!a) {
    return b
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp > 0 ? a
    : comp < 0 ? b
    : b.operator === '>' && a.operator === '>=' ? b
    : a
};

// <=1.2.3 is higher than <1.2.3
const lowerLT = (a, b, options) => {
  if (!a) {
    return b
  }
  const comp = compare$1(a.semver, b.semver, options);
  return comp < 0 ? a
    : comp > 0 ? b
    : b.operator === '<' && a.operator === '<=' ? b
    : a
};

var subset_1 = subset$1;

// just pre-load all the stuff that index.js lazily exports
const internalRe = reExports;
const constants = constants$1;
const SemVer = semver$4;
const identifiers = identifiers$1;
const parse = parse_1;
const valid = valid_1;
const clean = clean_1;
const inc = inc_1;
const diff = diff_1;
const major = major_1;
const minor = minor_1;
const patch = patch_1;
const prerelease = prerelease_1;
const compare = compare_1;
const rcompare = rcompare_1;
const compareLoose = compareLoose_1;
const compareBuild = compareBuild_1;
const sort = sort_1;
const rsort = rsort_1;
const gt = gt_1;
const lt = lt_1;
const eq = eq_1;
const neq = neq_1;
const gte = gte_1;
const lte = lte_1;
const cmp = cmp_1;
const coerce = coerce_1;
const Comparator = requireComparator();
const Range = requireRange();
const satisfies = satisfies_1;
const toComparators = toComparators_1;
const maxSatisfying = maxSatisfying_1;
const minSatisfying = minSatisfying_1;
const minVersion = minVersion_1;
const validRange = valid$1;
const outside = outside_1;
const gtr = gtr_1;
const ltr = ltr_1;
const intersects = intersects_1;
const simplifyRange = simplify;
const subset = subset_1;
var semver$3 = {
  parse,
  valid,
  clean,
  inc,
  diff,
  major,
  minor,
  patch,
  prerelease,
  compare,
  rcompare,
  compareLoose,
  compareBuild,
  sort,
  rsort,
  gt,
  lt,
  eq,
  neq,
  gte,
  lte,
  cmp,
  coerce,
  Comparator,
  Range,
  satisfies,
  toComparators,
  maxSatisfying,
  minSatisfying,
  minVersion,
  validRange,
  outside,
  gtr,
  ltr,
  intersects,
  simplifyRange,
  subset,
  SemVer,
  re: internalRe.re,
  src: internalRe.src,
  tokens: internalRe.t,
  SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
  RELEASE_TYPES: constants.RELEASE_TYPES,
  compareIdentifiers: identifiers.compareIdentifiers,
  rcompareIdentifiers: identifiers.rcompareIdentifiers,
};

const semver$2 = semver$3;

var asymmetricKeyDetailsSupported = semver$2.satisfies(process.version, '>=15.7.0');

const semver$1 = semver$3;

var rsaPssKeyDetailsSupported = semver$1.satisfies(process.version, '>=16.9.0');

const ASYMMETRIC_KEY_DETAILS_SUPPORTED = asymmetricKeyDetailsSupported;
const RSA_PSS_KEY_DETAILS_SUPPORTED = rsaPssKeyDetailsSupported;

const allowedAlgorithmsForKeys = {
  'ec': ['ES256', 'ES384', 'ES512'],
  'rsa': ['RS256', 'PS256', 'RS384', 'PS384', 'RS512', 'PS512'],
  'rsa-pss': ['PS256', 'PS384', 'PS512']
};

const allowedCurves = {
  ES256: 'prime256v1',
  ES384: 'secp384r1',
  ES512: 'secp521r1',
};

var validateAsymmetricKey$2 = function(algorithm, key) {
  if (!algorithm || !key) return;

  const keyType = key.asymmetricKeyType;
  if (!keyType) return;

  const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];

  if (!allowedAlgorithms) {
    throw new Error(`Unknown key type "${keyType}".`);
  }

  if (!allowedAlgorithms.includes(algorithm)) {
    throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(', ')}.`)
  }

  /*
   * Ignore the next block from test coverage because it gets executed
   * conditionally depending on the Node version. Not ignoring it would
   * prevent us from reaching the target % of coverage for versions of
   * Node under 15.7.0.
   */
  /* istanbul ignore next */
  if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
    switch (keyType) {
    case 'ec':
      const keyCurve = key.asymmetricKeyDetails.namedCurve;
      const allowedCurve = allowedCurves[algorithm];

      if (keyCurve !== allowedCurve) {
        throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
      }
      break;

    case 'rsa-pss':
      if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
        const length = parseInt(algorithm.slice(-3), 10);
        const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = key.asymmetricKeyDetails;

        if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
          throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
        }

        if (saltLength !== undefined && saltLength > length >> 3) {
          throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`)
        }
      }
      break;
    }
  }
};

var semver = semver$3;

var psSupported = semver.satisfies(process.version, '^6.12.0 || >=8.0.0');

const JsonWebTokenError = JsonWebTokenError_1;
const NotBeforeError = NotBeforeError_1;
const TokenExpiredError = TokenExpiredError_1;
const decode = decode$1;
const timespan$1 = timespan$2;
const validateAsymmetricKey$1 = validateAsymmetricKey$2;
const PS_SUPPORTED$1 = psSupported;
const jws$1 = jws$3;
const {KeyObject: KeyObject$1, createSecretKey: createSecretKey$1, createPublicKey} = require$$1;

const PUB_KEY_ALGS = ['RS256', 'RS384', 'RS512'];
const EC_KEY_ALGS = ['ES256', 'ES384', 'ES512'];
const RSA_KEY_ALGS = ['RS256', 'RS384', 'RS512'];
const HS_ALGS = ['HS256', 'HS384', 'HS512'];

if (PS_SUPPORTED$1) {
  PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, 'PS256', 'PS384', 'PS512');
  RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, 'PS256', 'PS384', 'PS512');
}

var verify = function (jwtString, secretOrPublicKey, options, callback) {
  if ((typeof options === 'function') && !callback) {
    callback = options;
    options = {};
  }

  if (!options) {
    options = {};
  }

  //clone this object since we are going to mutate it.
  options = Object.assign({}, options);

  let done;

  if (callback) {
    done = callback;
  } else {
    done = function(err, data) {
      if (err) throw err;
      return data;
    };
  }

  if (options.clockTimestamp && typeof options.clockTimestamp !== 'number') {
    return done(new JsonWebTokenError('clockTimestamp must be a number'));
  }

  if (options.nonce !== undefined && (typeof options.nonce !== 'string' || options.nonce.trim() === '')) {
    return done(new JsonWebTokenError('nonce must be a non-empty string'));
  }

  if (options.allowInvalidAsymmetricKeyTypes !== undefined && typeof options.allowInvalidAsymmetricKeyTypes !== 'boolean') {
    return done(new JsonWebTokenError('allowInvalidAsymmetricKeyTypes must be a boolean'));
  }

  const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1000);

  if (!jwtString){
    return done(new JsonWebTokenError('jwt must be provided'));
  }

  if (typeof jwtString !== 'string') {
    return done(new JsonWebTokenError('jwt must be a string'));
  }

  const parts = jwtString.split('.');

  if (parts.length !== 3){
    return done(new JsonWebTokenError('jwt malformed'));
  }

  let decodedToken;

  try {
    decodedToken = decode(jwtString, { complete: true });
  } catch(err) {
    return done(err);
  }

  if (!decodedToken) {
    return done(new JsonWebTokenError('invalid token'));
  }

  const header = decodedToken.header;
  let getSecret;

  if(typeof secretOrPublicKey === 'function') {
    if(!callback) {
      return done(new JsonWebTokenError('verify must be called asynchronous if secret or public key is provided as a callback'));
    }

    getSecret = secretOrPublicKey;
  }
  else {
    getSecret = function(header, secretCallback) {
      return secretCallback(null, secretOrPublicKey);
    };
  }

  return getSecret(header, function(err, secretOrPublicKey) {
    if(err) {
      return done(new JsonWebTokenError('error in secret or public key callback: ' + err.message));
    }

    const hasSignature = parts[2].trim() !== '';

    if (!hasSignature && secretOrPublicKey){
      return done(new JsonWebTokenError('jwt signature is required'));
    }

    if (hasSignature && !secretOrPublicKey) {
      return done(new JsonWebTokenError('secret or public key must be provided'));
    }

    if (!hasSignature && !options.algorithms) {
      return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
    }

    if (secretOrPublicKey != null && !(secretOrPublicKey instanceof KeyObject$1)) {
      try {
        secretOrPublicKey = createPublicKey(secretOrPublicKey);
      } catch (_) {
        try {
          secretOrPublicKey = createSecretKey$1(typeof secretOrPublicKey === 'string' ? Buffer.from(secretOrPublicKey) : secretOrPublicKey);
        } catch (_) {
          return done(new JsonWebTokenError('secretOrPublicKey is not valid key material'))
        }
      }
    }

    if (!options.algorithms) {
      if (secretOrPublicKey.type === 'secret') {
        options.algorithms = HS_ALGS;
      } else if (['rsa', 'rsa-pss'].includes(secretOrPublicKey.asymmetricKeyType)) {
        options.algorithms = RSA_KEY_ALGS;
      } else if (secretOrPublicKey.asymmetricKeyType === 'ec') {
        options.algorithms = EC_KEY_ALGS;
      } else {
        options.algorithms = PUB_KEY_ALGS;
      }
    }

    if (options.algorithms.indexOf(decodedToken.header.alg) === -1) {
      return done(new JsonWebTokenError('invalid algorithm'));
    }

    if (header.alg.startsWith('HS') && secretOrPublicKey.type !== 'secret') {
      return done(new JsonWebTokenError((`secretOrPublicKey must be a symmetric key when using ${header.alg}`)))
    } else if (/^(?:RS|PS|ES)/.test(header.alg) && secretOrPublicKey.type !== 'public') {
      return done(new JsonWebTokenError((`secretOrPublicKey must be an asymmetric key when using ${header.alg}`)))
    }

    if (!options.allowInvalidAsymmetricKeyTypes) {
      try {
        validateAsymmetricKey$1(header.alg, secretOrPublicKey);
      } catch (e) {
        return done(e);
      }
    }

    let valid;

    try {
      valid = jws$1.verify(jwtString, decodedToken.header.alg, secretOrPublicKey);
    } catch (e) {
      return done(e);
    }

    if (!valid) {
      return done(new JsonWebTokenError('invalid signature'));
    }

    const payload = decodedToken.payload;

    if (typeof payload.nbf !== 'undefined' && !options.ignoreNotBefore) {
      if (typeof payload.nbf !== 'number') {
        return done(new JsonWebTokenError('invalid nbf value'));
      }
      if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
        return done(new NotBeforeError('jwt not active', new Date(payload.nbf * 1000)));
      }
    }

    if (typeof payload.exp !== 'undefined' && !options.ignoreExpiration) {
      if (typeof payload.exp !== 'number') {
        return done(new JsonWebTokenError('invalid exp value'));
      }
      if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
        return done(new TokenExpiredError('jwt expired', new Date(payload.exp * 1000)));
      }
    }

    if (options.audience) {
      const audiences = Array.isArray(options.audience) ? options.audience : [options.audience];
      const target = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

      const match = target.some(function (targetAudience) {
        return audiences.some(function (audience) {
          return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
        });
      });

      if (!match) {
        return done(new JsonWebTokenError('jwt audience invalid. expected: ' + audiences.join(' or ')));
      }
    }

    if (options.issuer) {
      const invalid_issuer =
              (typeof options.issuer === 'string' && payload.iss !== options.issuer) ||
              (Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1);

      if (invalid_issuer) {
        return done(new JsonWebTokenError('jwt issuer invalid. expected: ' + options.issuer));
      }
    }

    if (options.subject) {
      if (payload.sub !== options.subject) {
        return done(new JsonWebTokenError('jwt subject invalid. expected: ' + options.subject));
      }
    }

    if (options.jwtid) {
      if (payload.jti !== options.jwtid) {
        return done(new JsonWebTokenError('jwt jwtid invalid. expected: ' + options.jwtid));
      }
    }

    if (options.nonce) {
      if (payload.nonce !== options.nonce) {
        return done(new JsonWebTokenError('jwt nonce invalid. expected: ' + options.nonce));
      }
    }

    if (options.maxAge) {
      if (typeof payload.iat !== 'number') {
        return done(new JsonWebTokenError('iat required when maxAge is specified'));
      }

      const maxAgeTimestamp = timespan$1(options.maxAge, payload.iat);
      if (typeof maxAgeTimestamp === 'undefined') {
        return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
      }
      if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
        return done(new TokenExpiredError('maxAge exceeded', new Date(maxAgeTimestamp * 1000)));
      }
    }

    if (options.complete === true) {
      const signature = decodedToken.signature;

      return done(null, {
        header: header,
        payload: payload,
        signature: signature
      });
    }

    return done(null, payload);
  });
};

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY$2 = 1 / 0,
    MAX_SAFE_INTEGER = 9007199254740991,
    MAX_INTEGER$2 = 1.7976931348623157e+308,
    NAN$2 = 0 / 0;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    stringTag$1 = '[object String]',
    symbolTag$2 = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim$2 = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex$2 = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary$2 = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal$2 = /^0o[0-7]+$/i;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/** Built-in method references without a dependency on `root`. */
var freeParseInt$2 = parseInt;

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex(array, baseIsNaN, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * The base implementation of `_.values` and `_.valuesIn` which creates an
 * array of `object` property values corresponding to the property names
 * of `props`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array} props The property names to get values for.
 * @returns {Object} Returns the array of property values.
 */
function baseValues(object, props) {
  return arrayMap(props, function(key) {
    return object[key];
  });
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg$1(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$6.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$6 = objectProto$6.toString;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$6.propertyIsEnumerable;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg$1(Object.keys, Object),
    nativeMax = Math.max;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  // Safari 9 makes `arguments.length` enumerable in strict mode.
  var result = (isArray$1(value) || isArguments(value))
    ? baseTimes(value.length, String)
    : [];

  var length = result.length,
      skipIndexes = !!length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$1.call(value, key)) &&
        !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$1.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$6;

  return value === proto;
}

/**
 * Checks if `value` is in `collection`. If `collection` is a string, it's
 * checked for a substring of `value`, otherwise
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * is used for equality comparisons. If `fromIndex` is negative, it's used as
 * the offset from the end of `collection`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Collection
 * @param {Array|Object|string} collection The collection to inspect.
 * @param {*} value The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.reduce`.
 * @returns {boolean} Returns `true` if `value` is found, else `false`.
 * @example
 *
 * _.includes([1, 2, 3], 1);
 * // => true
 *
 * _.includes([1, 2, 3], 1, 2);
 * // => false
 *
 * _.includes({ 'a': 1, 'b': 2 }, 1);
 * // => true
 *
 * _.includes('abcd', 'bc');
 * // => true
 */
function includes$1(collection, value, fromIndex, guard) {
  collection = isArrayLike(collection) ? collection : values(collection);
  fromIndex = (fromIndex && !guard) ? toInteger$2(fromIndex) : 0;

  var length = collection.length;
  if (fromIndex < 0) {
    fromIndex = nativeMax(length + fromIndex, 0);
  }
  return isString$2(collection)
    ? (fromIndex <= length && collection.indexOf(value, fromIndex) > -1)
    : (!!length && baseIndexOf(collection, value, fromIndex) > -1);
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty$1.call(value, 'callee') &&
    (!propertyIsEnumerable.call(value, 'callee') || objectToString$6.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$1 = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike$6(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$2(value) ? objectToString$6.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$2(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$6(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a string, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString$2(value) {
  return typeof value == 'string' ||
    (!isArray$1(value) && isObjectLike$6(value) && objectToString$6.call(value) == stringTag$1);
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol$2(value) {
  return typeof value == 'symbol' ||
    (isObjectLike$6(value) && objectToString$6.call(value) == symbolTag$2);
}

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite$2(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber$2(value);
  if (value === INFINITY$2 || value === -INFINITY$2) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER$2;
  }
  return value === value ? value : 0;
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger$2(value) {
  var result = toFinite$2(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber$2(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol$2(value)) {
    return NAN$2;
  }
  if (isObject$2(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject$2(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim$2, '');
  var isBinary = reIsBinary$2.test(value);
  return (isBinary || reIsOctal$2.test(value))
    ? freeParseInt$2(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex$2.test(value) ? NAN$2 : +value);
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

/**
 * Creates an array of the own enumerable string keyed property values of `object`.
 *
 * **Note:** Non-object values are coerced to objects.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property values.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.values(new Foo);
 * // => [1, 2] (iteration order is not guaranteed)
 *
 * _.values('hi');
 * // => ['h', 'i']
 */
function values(object) {
  return object ? baseValues(object, keys(object)) : [];
}

var lodash_includes = includes$1;

/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var boolTag = '[object Boolean]';

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$5 = objectProto$5.toString;

/**
 * Checks if `value` is classified as a boolean primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isBoolean(false);
 * // => true
 *
 * _.isBoolean(null);
 * // => false
 */
function isBoolean$1(value) {
  return value === true || value === false ||
    (isObjectLike$5(value) && objectToString$5.call(value) == boolTag);
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$5(value) {
  return !!value && typeof value == 'object';
}

var lodash_isboolean = isBoolean$1;

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY$1 = 1 / 0,
    MAX_INTEGER$1 = 1.7976931348623157e+308,
    NAN$1 = 0 / 0;

/** `Object#toString` result references. */
var symbolTag$1 = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim$1 = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex$1 = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary$1 = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal$1 = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt$1 = parseInt;

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$4 = objectProto$4.toString;

/**
 * Checks if `value` is an integer.
 *
 * **Note:** This method is based on
 * [`Number.isInteger`](https://mdn.io/Number/isInteger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an integer, else `false`.
 * @example
 *
 * _.isInteger(3);
 * // => true
 *
 * _.isInteger(Number.MIN_VALUE);
 * // => false
 *
 * _.isInteger(Infinity);
 * // => false
 *
 * _.isInteger('3');
 * // => false
 */
function isInteger$1(value) {
  return typeof value == 'number' && value == toInteger$1(value);
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$1(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$4(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol$1(value) {
  return typeof value == 'symbol' ||
    (isObjectLike$4(value) && objectToString$4.call(value) == symbolTag$1);
}

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite$1(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber$1(value);
  if (value === INFINITY$1 || value === -INFINITY$1) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER$1;
  }
  return value === value ? value : 0;
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger$1(value) {
  var result = toFinite$1(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber$1(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol$1(value)) {
    return NAN$1;
  }
  if (isObject$1(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject$1(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim$1, '');
  var isBinary = reIsBinary$1.test(value);
  return (isBinary || reIsOctal$1.test(value))
    ? freeParseInt$1(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex$1.test(value) ? NAN$1 : +value);
}

var lodash_isinteger = isInteger$1;

/**
 * lodash 3.0.3 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var numberTag = '[object Number]';

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$3 = objectProto$3.toString;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$3(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Number` primitive or object.
 *
 * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified
 * as numbers, use the `_.isFinite` method.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isNumber(3);
 * // => true
 *
 * _.isNumber(Number.MIN_VALUE);
 * // => true
 *
 * _.isNumber(Infinity);
 * // => true
 *
 * _.isNumber('3');
 * // => false
 */
function isNumber$1(value) {
  return typeof value == 'number' ||
    (isObjectLike$3(value) && objectToString$3.call(value) == numberTag);
}

var lodash_isnumber = isNumber$1;

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** `Object#toString` result references. */
var objectTag = '[object Object]';

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto$2 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto$2.hasOwnProperty;

/** Used to infer the `Object` constructor. */
var objectCtorString = funcToString.call(Object);

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$2 = objectProto$2.toString;

/** Built-in value references. */
var getPrototype = overArg(Object.getPrototypeOf, Object);

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$2(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is a plain object, that is, an object created by the
 * `Object` constructor or one with a `[[Prototype]]` of `null`.
 *
 * @static
 * @memberOf _
 * @since 0.8.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * _.isPlainObject(new Foo);
 * // => false
 *
 * _.isPlainObject([1, 2, 3]);
 * // => false
 *
 * _.isPlainObject({ 'x': 0, 'y': 0 });
 * // => true
 *
 * _.isPlainObject(Object.create(null));
 * // => true
 */
function isPlainObject$1(value) {
  if (!isObjectLike$2(value) ||
      objectToString$2.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (typeof Ctor == 'function' &&
    Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString);
}

var lodash_isplainobject = isPlainObject$1;

/**
 * lodash 4.0.1 (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright 2012-2016 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <https://lodash.com/license>
 */

/** `Object#toString` result references. */
var stringTag = '[object String]';

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$1 = objectProto$1.toString;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$1(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `String` primitive or object.
 *
 * @static
 * @memberOf _
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.
 * @example
 *
 * _.isString('abc');
 * // => true
 *
 * _.isString(1);
 * // => false
 */
function isString$1(value) {
  return typeof value == 'string' ||
    (!isArray(value) && isObjectLike$1(value) && objectToString$1.call(value) == stringTag);
}

var lodash_isstring = isString$1;

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0,
    MAX_INTEGER = 1.7976931348623157e+308,
    NAN = 0 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/**
 * Creates a function that invokes `func`, with the `this` binding and arguments
 * of the created function, while it's called less than `n` times. Subsequent
 * calls to the created function return the result of the last `func` invocation.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Function
 * @param {number} n The number of calls at which `func` is no longer invoked.
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * jQuery(element).on('click', _.before(5, addContactToList));
 * // => Allows adding up to 4 contacts to the list.
 */
function before(n, func) {
  var result;
  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  n = toInteger(n);
  return function() {
    if (--n > 0) {
      result = func.apply(this, arguments);
    }
    if (n <= 1) {
      func = undefined;
    }
    return result;
  };
}

/**
 * Creates a function that is restricted to invoking `func` once. Repeat calls
 * to the function return the value of the first invocation. The `func` is
 * invoked with the `this` binding and arguments of the created function.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new restricted function.
 * @example
 *
 * var initialize = _.once(createApplication);
 * initialize();
 * initialize();
 * // => `createApplication` is invoked once
 */
function once$1(func) {
  return before(2, func);
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a finite number.
 *
 * @static
 * @memberOf _
 * @since 4.12.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted number.
 * @example
 *
 * _.toFinite(3.2);
 * // => 3.2
 *
 * _.toFinite(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toFinite(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toFinite('3.2');
 * // => 3.2
 */
function toFinite(value) {
  if (!value) {
    return value === 0 ? value : 0;
  }
  value = toNumber(value);
  if (value === INFINITY || value === -INFINITY) {
    var sign = (value < 0 ? -1 : 1);
    return sign * MAX_INTEGER;
  }
  return value === value ? value : 0;
}

/**
 * Converts `value` to an integer.
 *
 * **Note:** This method is loosely based on
 * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {number} Returns the converted integer.
 * @example
 *
 * _.toInteger(3.2);
 * // => 3
 *
 * _.toInteger(Number.MIN_VALUE);
 * // => 0
 *
 * _.toInteger(Infinity);
 * // => 1.7976931348623157e+308
 *
 * _.toInteger('3.2');
 * // => 3
 */
function toInteger(value) {
  var result = toFinite(value),
      remainder = result % 1;

  return result === result ? (remainder ? result - remainder : result) : 0;
}

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

var lodash_once = once$1;

const timespan = timespan$2;
const PS_SUPPORTED = psSupported;
const validateAsymmetricKey = validateAsymmetricKey$2;
const jws = jws$3;
const includes = lodash_includes;
const isBoolean = lodash_isboolean;
const isInteger = lodash_isinteger;
const isNumber = lodash_isnumber;
const isPlainObject = lodash_isplainobject;
const isString = lodash_isstring;
const once = lodash_once;
const { KeyObject, createSecretKey, createPrivateKey } = require$$1;

const SUPPORTED_ALGS = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'HS256', 'HS384', 'HS512', 'none'];
if (PS_SUPPORTED) {
  SUPPORTED_ALGS.splice(3, 0, 'PS256', 'PS384', 'PS512');
}

const sign_options_schema = {
  expiresIn: { isValid: function(value) { return isInteger(value) || (isString(value) && value); }, message: '"expiresIn" should be a number of seconds or string representing a timespan' },
  notBefore: { isValid: function(value) { return isInteger(value) || (isString(value) && value); }, message: '"notBefore" should be a number of seconds or string representing a timespan' },
  audience: { isValid: function(value) { return isString(value) || Array.isArray(value); }, message: '"audience" must be a string or array' },
  algorithm: { isValid: includes.bind(null, SUPPORTED_ALGS), message: '"algorithm" must be a valid string enum value' },
  header: { isValid: isPlainObject, message: '"header" must be an object' },
  encoding: { isValid: isString, message: '"encoding" must be a string' },
  issuer: { isValid: isString, message: '"issuer" must be a string' },
  subject: { isValid: isString, message: '"subject" must be a string' },
  jwtid: { isValid: isString, message: '"jwtid" must be a string' },
  noTimestamp: { isValid: isBoolean, message: '"noTimestamp" must be a boolean' },
  keyid: { isValid: isString, message: '"keyid" must be a string' },
  mutatePayload: { isValid: isBoolean, message: '"mutatePayload" must be a boolean' },
  allowInsecureKeySizes: { isValid: isBoolean, message: '"allowInsecureKeySizes" must be a boolean'},
  allowInvalidAsymmetricKeyTypes: { isValid: isBoolean, message: '"allowInvalidAsymmetricKeyTypes" must be a boolean'}
};

const registered_claims_schema = {
  iat: { isValid: isNumber, message: '"iat" should be a number of seconds' },
  exp: { isValid: isNumber, message: '"exp" should be a number of seconds' },
  nbf: { isValid: isNumber, message: '"nbf" should be a number of seconds' }
};

function validate(schema, allowUnknown, object, parameterName) {
  if (!isPlainObject(object)) {
    throw new Error('Expected "' + parameterName + '" to be a plain object.');
  }
  Object.keys(object)
    .forEach(function(key) {
      const validator = schema[key];
      if (!validator) {
        if (!allowUnknown) {
          throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
        }
        return;
      }
      if (!validator.isValid(object[key])) {
        throw new Error(validator.message);
      }
    });
}

function validateOptions(options) {
  return validate(sign_options_schema, false, options, 'options');
}

function validatePayload(payload) {
  return validate(registered_claims_schema, true, payload, 'payload');
}

const options_to_payload = {
  'audience': 'aud',
  'issuer': 'iss',
  'subject': 'sub',
  'jwtid': 'jti'
};

const options_for_objects = [
  'expiresIn',
  'notBefore',
  'noTimestamp',
  'audience',
  'issuer',
  'subject',
  'jwtid',
];

var sign = function (payload, secretOrPrivateKey, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  } else {
    options = options || {};
  }

  const isObjectPayload = typeof payload === 'object' &&
                        !Buffer.isBuffer(payload);

  const header = Object.assign({
    alg: options.algorithm || 'HS256',
    typ: isObjectPayload ? 'JWT' : undefined,
    kid: options.keyid
  }, options.header);

  function failure(err) {
    if (callback) {
      return callback(err);
    }
    throw err;
  }

  if (!secretOrPrivateKey && options.algorithm !== 'none') {
    return failure(new Error('secretOrPrivateKey must have a value'));
  }

  if (secretOrPrivateKey != null && !(secretOrPrivateKey instanceof KeyObject)) {
    try {
      secretOrPrivateKey = createPrivateKey(secretOrPrivateKey);
    } catch (_) {
      try {
        secretOrPrivateKey = createSecretKey(typeof secretOrPrivateKey === 'string' ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
      } catch (_) {
        return failure(new Error('secretOrPrivateKey is not valid key material'));
      }
    }
  }

  if (header.alg.startsWith('HS') && secretOrPrivateKey.type !== 'secret') {
    return failure(new Error((`secretOrPrivateKey must be a symmetric key when using ${header.alg}`)))
  } else if (/^(?:RS|PS|ES)/.test(header.alg)) {
    if (secretOrPrivateKey.type !== 'private') {
      return failure(new Error((`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`)))
    }
    if (!options.allowInsecureKeySizes &&
      !header.alg.startsWith('ES') &&
      secretOrPrivateKey.asymmetricKeyDetails !== undefined && //KeyObject.asymmetricKeyDetails is supported in Node 15+
      secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
      return failure(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
    }
  }

  if (typeof payload === 'undefined') {
    return failure(new Error('payload is required'));
  } else if (isObjectPayload) {
    try {
      validatePayload(payload);
    }
    catch (error) {
      return failure(error);
    }
    if (!options.mutatePayload) {
      payload = Object.assign({},payload);
    }
  } else {
    const invalid_options = options_for_objects.filter(function (opt) {
      return typeof options[opt] !== 'undefined';
    });

    if (invalid_options.length > 0) {
      return failure(new Error('invalid ' + invalid_options.join(',') + ' option for ' + (typeof payload ) + ' payload'));
    }
  }

  if (typeof payload.exp !== 'undefined' && typeof options.expiresIn !== 'undefined') {
    return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
  }

  if (typeof payload.nbf !== 'undefined' && typeof options.notBefore !== 'undefined') {
    return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
  }

  try {
    validateOptions(options);
  }
  catch (error) {
    return failure(error);
  }

  if (!options.allowInvalidAsymmetricKeyTypes) {
    try {
      validateAsymmetricKey(header.alg, secretOrPrivateKey);
    } catch (error) {
      return failure(error);
    }
  }

  const timestamp = payload.iat || Math.floor(Date.now() / 1000);

  if (options.noTimestamp) {
    delete payload.iat;
  } else if (isObjectPayload) {
    payload.iat = timestamp;
  }

  if (typeof options.notBefore !== 'undefined') {
    try {
      payload.nbf = timespan(options.notBefore, timestamp);
    }
    catch (err) {
      return failure(err);
    }
    if (typeof payload.nbf === 'undefined') {
      return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
    }
  }

  if (typeof options.expiresIn !== 'undefined' && typeof payload === 'object') {
    try {
      payload.exp = timespan(options.expiresIn, timestamp);
    }
    catch (err) {
      return failure(err);
    }
    if (typeof payload.exp === 'undefined') {
      return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
    }
  }

  Object.keys(options_to_payload).forEach(function (key) {
    const claim = options_to_payload[key];
    if (typeof options[key] !== 'undefined') {
      if (typeof payload[claim] !== 'undefined') {
        return failure(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
      }
      payload[claim] = options[key];
    }
  });

  const encoding = options.encoding || 'utf8';

  if (typeof callback === 'function') {
    callback = callback && once(callback);

    jws.createSign({
      header: header,
      privateKey: secretOrPrivateKey,
      payload: payload,
      encoding: encoding
    }).once('error', callback)
      .once('done', function (signature) {
        // TODO: Remove in favor of the modulus length check before signing once node 15+ is the minimum supported version
        if(!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
          return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`))
        }
        callback(null, signature);
      });
  } else {
    let signature = jws.sign({header: header, payload: payload, secret: secretOrPrivateKey, encoding: encoding});
    // TODO: Remove in favor of the modulus length check before signing once node 15+ is the minimum supported version
    if(!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
      throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`)
    }
    return signature
  }
};

var jsonwebtoken = {
  decode: decode$1,
  verify: verify,
  sign: sign,
  JsonWebTokenError: JsonWebTokenError_1,
  NotBeforeError: NotBeforeError_1,
  TokenExpiredError: TokenExpiredError_1,
};

var jwt = /*@__PURE__*/getDefaultExportFromCjs(jsonwebtoken);

/**
 * Authentication Service
 *
 * Handles Google OAuth2 authentication and JWT token management
 * Supports both web app and Chrome extension authentication
 */
class AuthService {
    constructor(config) {
        Object.defineProperty(this, "jwtSecret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "googleClientId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "googleClientSecret", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.jwtSecret = config.jwtSecret;
        this.googleClientId = config.googleClientId;
        this.googleClientSecret = config.googleClientSecret;
    }
    /**
     * Verify Google OAuth2 token
     */
    async verifyGoogleToken(idToken) {
        // TODO: Implement Google token verification
        // Use google-auth-library
        console.log('🔐 AuthService: Verifying Google token');
        // Mock for now
        return {
            email: 'user@example.com',
            sub: 'google-id-123',
            name: 'Test User'
        };
    }
    /**
     * Create JWT token for user session
     */
    createJWT(user, expiresIn = '7d') {
        const payload = {
            userId: user.id,
            email: user.email,
            userType: user.userType,
            premiumStatus: user.premiumStatus
        };
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn,
            issuer: 'wave-reader',
            subject: user.id.toString()
        });
    }
    /**
     * Verify JWT token
     */
    verifyJWT(token) {
        try {
            return jwt.verify(token, this.jwtSecret);
        }
        catch (error) {
            console.error('🔐 AuthService: JWT verification failed', error);
            return null;
        }
    }
    /**
     * Authenticate with Google OAuth2 (web app)
     */
    async authenticateWithGoogle(idToken) {
        try {
            const googleUser = await this.verifyGoogleToken(idToken);
            // TODO: Look up or create user in database
            const user = {
                id: 1,
                email: googleUser.email,
                googleId: googleUser.sub,
                premiumStatus: false,
                userType: 'free',
                tokenBalance: 0
            };
            const token = this.createJWT(user);
            const decoded = this.verifyJWT(token);
            return {
                token,
                expiresAt: decoded.exp * 1000,
                user
            };
        }
        catch (error) {
            console.error('🔐 AuthService: Google authentication failed', error);
            return null;
        }
    }
    /**
     * Authenticate with Chrome Identity API (extension)
     */
    async authenticateWithChromeIdentity() {
        // This will be called from the extension context
        console.log('🔐 AuthService: Chrome Identity authentication');
        // Mock for now - will integrate with Chrome Identity API
        return null;
    }
    /**
     * Refresh authentication token
     */
    async refreshToken(oldToken) {
        const decoded = this.verifyJWT(oldToken);
        if (!decoded) {
            return null;
        }
        // TODO: Look up user from database
        const user = {
            id: decoded.userId,
            email: decoded.email,
            googleId: '',
            premiumStatus: decoded.premiumStatus,
            userType: decoded.userType,
            tokenBalance: 0
        };
        const newToken = this.createJWT(user);
        const newDecoded = this.verifyJWT(newToken);
        return {
            token: newToken,
            expiresAt: newDecoded.exp * 1000,
            user
        };
    }
    /**
     * Developer mode: Switch user type (session only, not persisted)
     */
    switchUserType(token, newUserType) {
        const decoded = this.verifyJWT(token);
        if (!decoded) {
            throw new Error('Invalid token');
        }
        const payload = {
            ...decoded,
            userType: newUserType,
            devModeSwitch: true // Flag to indicate this is a dev mode switch
        };
        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: '7d',
            issuer: 'wave-reader',
            subject: decoded.sub
        });
    }
}
// Export singleton (will be initialized in server startup)
let authServiceInstance = null;
function initializeAuthService(config) {
    authServiceInstance = new AuthService(config);
    return authServiceInstance;
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
// Initialize AuthService
const authService = initializeAuthService({
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
});
// Load component whitelist
let componentWhitelist = { components: [] };
try {
    const whitelistPath = path.join(process.cwd(), 'src/config/component-whitelist.json');
    if (fs.existsSync(whitelistPath)) {
        componentWhitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf-8'));
        console.log(`📋 Loaded component whitelist: ${componentWhitelist.components.length} components`);
    }
}
catch (error) {
    console.warn('📋 Could not load component whitelist, using empty list');
}
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
// Favicon endpoint - palette emoji 🎨
app.get('/favicon.ico', (req, res) => {
    // SVG favicon with palette emoji
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y="80" font-size="80">🎨</text>
    </svg>
  `;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
});
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
        },
        tome: {
            enabled: true,
            machines: ['EditorMachine', 'PreviewMachine', 'TemplateMachine', 'HealthMachine']
        }
    });
});
// Tome-based Editor API endpoints
/**
 * List all components
 */
app.get('/api/tome/components', async (req, res) => {
    try {
        await editorTome.send('EditorMachine', 'LIST_COMPONENTS');
        // Get the components from the machine context
        const context = editorTome.getMachineContext('EditorMachine');
        res.json({
            success: true,
            components: context?.components || []
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Load a specific component
 */
app.get('/api/tome/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
        // Wait a bit for the state transition
        await new Promise(resolve => setTimeout(resolve, 100));
        const context = editorTome.getMachineContext('EditorMachine');
        const state = editorTome.getMachineState('EditorMachine');
        if (state?.value === 'error') {
            res.status(404).json({
                success: false,
                error: context?.error || 'Component not found'
            });
        }
        else {
            res.json({
                success: true,
                component: context?.currentComponent,
                state: state?.value
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Create a new component
 */
app.post('/api/tome/components', async (req, res) => {
    try {
        await editorTome.send('EditorMachine', 'CREATE_NEW');
        // Wait for state transition
        await new Promise(resolve => setTimeout(resolve, 100));
        const context = editorTome.getMachineContext('EditorMachine');
        res.json({
            success: true,
            component: context?.currentComponent
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Save the current component
 */
app.put('/api/tome/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const component = req.body;
        // First load the component if not already loaded
        const context = editorTome.getMachineContext('EditorMachine');
        if (context?.currentComponent?.id !== id) {
            await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Update the component content in the machine context
        const currentContext = editorTome.getMachineContext('EditorMachine');
        if (currentContext) {
            currentContext.currentComponent = component;
        }
        // Trigger save
        await editorTome.send('EditorMachine', 'SAVE');
        // Wait for save to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        const updatedContext = editorTome.getMachineContext('EditorMachine');
        res.json({
            success: true,
            component: updatedContext?.currentComponent
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Delete a component
 */
app.delete('/api/tome/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Load the component first
        await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
        await new Promise(resolve => setTimeout(resolve, 100));
        // Delete it
        await editorTome.send('EditorMachine', 'DELETE');
        await new Promise(resolve => setTimeout(resolve, 100));
        res.json({
            success: true,
            message: 'Component deleted'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Preview a component
 */
app.post('/api/tome/components/:id/preview', async (req, res) => {
    try {
        const { id } = req.params;
        // Load component if needed
        const context = editorTome.getMachineContext('EditorMachine');
        if (context?.currentComponent?.id !== id) {
            await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Request preview
        await editorTome.send('EditorMachine', 'PREVIEW');
        // Wait for preview to render
        await new Promise(resolve => setTimeout(resolve, 200));
        const previewContext = editorTome.getMachineContext('PreviewMachine');
        res.json({
            success: true,
            preview: previewContext?.previewData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
/**
 * Get editor machine state
 */
app.get('/api/tome/state', (req, res) => {
    try {
        const editorState = editorTome.getMachineState('EditorMachine');
        const previewState = editorTome.getMachineState('PreviewMachine');
        const healthState = editorTome.getMachineState('HealthMachine');
        res.json({
            success: true,
            states: {
                editor: editorState?.value,
                preview: previewState?.value,
                health: healthState?.value
            },
            contexts: {
                editor: editorTome.getMachineContext('EditorMachine'),
                preview: editorTome.getMachineContext('PreviewMachine'),
                health: editorTome.getMachineContext('HealthMachine')
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Authentication API endpoints
/**
 * Google OAuth2 login
 */
app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ error: 'idToken required' });
        }
        const authToken = await authService.authenticateWithGoogle(idToken);
        if (!authToken) {
            return res.status(401).json({ error: 'Authentication failed' });
        }
        res.json({
            success: true,
            token: authToken.token,
            expiresAt: authToken.expiresAt,
            user: authToken.user
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Refresh auth token
 */
app.post('/api/auth/refresh', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'token required' });
        }
        const newAuthToken = await authService.refreshToken(token);
        if (!newAuthToken) {
            return res.status(401).json({ error: 'Token refresh failed' });
        }
        res.json({
            success: true,
            token: newAuthToken.token,
            expiresAt: newAuthToken.expiresAt,
            user: newAuthToken.user
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Developer mode: Switch user type
 */
app.post('/api/auth/dev/switch-user-type', async (req, res) => {
    try {
        // Check if developer mode is enabled
        const isDeveloperMode = await robotCopy.isEnabled('developer-mode');
        if (!isDeveloperMode) {
            return res.status(403).json({ error: 'Developer mode not enabled' });
        }
        const { token, userType } = req.body;
        if (!token || !userType) {
            return res.status(400).json({ error: 'token and userType required' });
        }
        const newToken = authService.switchUserType(token, userType);
        res.json({
            success: true,
            token: newToken,
            message: `Switched to ${userType} mode (dev only, not persisted)`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Component Whitelist API
/**
 * Get component whitelist
 */
app.get('/api/mods/whitelist', (req, res) => {
    res.json({
        success: true,
        version: componentWhitelist.version,
        components: componentWhitelist.components,
        moddingRules: componentWhitelist.modding_rules
    });
});
/**
 * Check if component is moddable
 */
app.get('/api/mods/whitelist/:componentName', (req, res) => {
    const { componentName } = req.params;
    const component = componentWhitelist.components.find((c) => c.name === componentName);
    if (!component) {
        return res.status(404).json({
            success: false,
            isModdable: false,
            message: 'Component not in whitelist'
        });
    }
    res.json({
        success: true,
        isModdable: component.isModdable,
        component
    });
});
// Donation API endpoints
/**
 * Process a donation
 */
app.post('/api/donate', async (req, res) => {
    try {
        const { portfolio, amount, userId } = req.body;
        if (!portfolio || !amount) {
            return res.status(400).json({ error: 'portfolio and amount required' });
        }
        const validPortfolios = ['developer', 'w3c_wai', 'aspca', 'audubon'];
        if (!validPortfolios.includes(portfolio)) {
            return res.status(400).json({ error: 'Invalid portfolio' });
        }
        // Calculate tokens (only for developer donations)
        const tokensGranted = portfolio === 'developer' ? Math.floor(amount) : 0;
        console.log(`💰 Processing donation: $${amount} to ${portfolio}, tokens: ${tokensGranted}`);
        // TODO: Process actual payment via Solana/PayPal/TheGivingBlock
        // TODO: Grant tokens to user if developer donation
        // TODO: Record in charity_donations table
        res.json({
            success: true,
            portfolio,
            amount,
            tokensGranted,
            message: tokensGranted > 0
                ? `Thank you! ${tokensGranted} tokens granted`
                : 'Thank you for supporting charity!'
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Process batch donations (all portfolios at once)
 */
app.post('/api/donate/batch', async (req, res) => {
    try {
        const { donations, userId } = req.body;
        if (!donations || !Array.isArray(donations)) {
            return res.status(400).json({ error: 'donations array required' });
        }
        const results = [];
        let totalTokens = 0;
        for (const donation of donations) {
            const { portfolio, amount } = donation;
            const tokensGranted = portfolio === 'developer' ? Math.floor(amount) : 0;
            totalTokens += tokensGranted;
            results.push({
                portfolio,
                amount,
                tokensGranted
            });
            console.log(`💰 Batch donation: $${amount} to ${portfolio}`);
        }
        // TODO: Process all payments
        // TODO: Grant total tokens to user
        res.json({
            success: true,
            donations: results,
            totalTokens,
            message: `Thank you for donating! ${totalTokens} tokens granted`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * Get donation statistics
 */
app.get('/api/donate/stats', (req, res) => {
    // TODO: Query charity_donations table for real stats
    res.json({
        success: true,
        stats: {
            developer: { total: 0, count: 0 },
            w3c_wai: { total: 0, count: 0 },
            aspca: { total: 0, count: 0 },
            audubon: { total: 0, count: 0 }
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
// ===== NEW PREMIUM MODDING PLATFORM API ENDPOINTS =====
// PII Scanner API
app.post('/api/pii/scan', async (req, res) => {
    try {
        const { content, filename } = req.body;
        const piiScanner = initializePIIScanner();
        const result = piiScanner.scanContent(content, filename);
        res.json({
            success: true,
            result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Mod Review API
app.get('/api/mods/review/queue', async (req, res) => {
    try {
        const modReviewService = initializeModReviewService();
        const queue = await modReviewService.getReviewQueue();
        res.json({
            success: true,
            queue
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.post('/api/mods/review/action', async (req, res) => {
    try {
        const { submissionId, action, reviewerId, notes, piiOverride } = req.body;
        const modReviewService = initializeModReviewService();
        const result = await modReviewService.processReviewAction({
            submissionId,
            action,
            reviewerId,
            notes,
            piiOverride
        });
        res.json({
            success: true,
            result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Token Ledger API
app.get('/api/tokens/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const tokenLedger = initializeTokenLedgerService();
        const balance = await tokenLedger.getBalance(userId);
        res.json({
            success: true,
            balance
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.post('/api/tokens/grant', async (req, res) => {
    try {
        const { userId, amount, source, reason } = req.body;
        const tokenLedger = initializeTokenLedgerService();
        const transaction = await tokenLedger.grantTokens(userId, amount, source, reason);
        res.json({
            success: true,
            transaction
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.get('/api/tokens/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, type } = req.query;
        const tokenLedger = initializeTokenLedgerService();
        const history = await tokenLedger.getTransactionHistory(userId, parseInt(limit), type);
        res.json({
            success: true,
            history
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Mod Install API
app.post('/api/mods/install', async (req, res) => {
    try {
        const { userId, modId, authorId, tokenAmount } = req.body;
        const tokenLedger = initializeTokenLedgerService();
        const result = await tokenLedger.processModInstall(userId, modId, authorId, tokenAmount);
        res.json({
            success: true,
            result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.post('/api/mods/uninstall', async (req, res) => {
    try {
        const { userId, modId } = req.body;
        const tokenLedger = initializeTokenLedgerService();
        const result = await tokenLedger.processModUninstall(userId, modId);
        res.json({
            success: true,
            result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Solana Integration API
app.get('/api/solana/status', async (req, res) => {
    try {
        const solanaService = initializeSolanaService({
            network: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            programId: 'mock-program-id',
            tokenMint: 'mock-token-mint'
        });
        const status = await solanaService.getNetworkStatus();
        res.json({
            success: true,
            status
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.post('/api/solana/connect', async (req, res) => {
    try {
        const solanaService = initializeSolanaService({
            network: 'devnet',
            rpcUrl: 'https://api.devnet.solana.com',
            programId: 'mock-program-id',
            tokenMint: 'mock-token-mint'
        });
        const connection = await solanaService.connectWallet();
        res.json({
            success: true,
            connection
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Admin API
app.get('/api/admin/users', async (req, res) => {
    try {
        // Mock user data for now
        const users = [
            {
                id: 'user1',
                name: 'John Doe',
                email: 'john@example.com',
                tokens: 150,
                status: 'premium',
                joinedAt: '2024-01-15'
            },
            {
                id: 'user2',
                name: 'Jane Smith',
                email: 'jane@example.com',
                tokens: 75,
                status: 'free',
                joinedAt: '2024-01-16'
            }
        ];
        res.json({
            success: true,
            users
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
app.post('/api/admin/tokens/grant', async (req, res) => {
    try {
        const { email, amount, reason, notes } = req.body;
        const tokenLedger = initializeTokenLedgerService();
        // In a real implementation, you'd look up the user by email
        const userId = `user-${Date.now()}`;
        const transaction = await tokenLedger.grantTokens(userId, amount, 'admin_grant', reason);
        res.json({
            success: true,
            transaction,
            message: `Granted ${amount} tokens to ${email}`
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
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
// Premium Editor Route
app.get('/editor/premium', (req, res) => {
    const premiumEditorPath = path.join(process.cwd(), 'static/premium-editor.html');
    if (fs.existsSync(premiumEditorPath)) {
        res.sendFile(premiumEditorPath);
    }
    else {
        res.status(404).send('Premium editor not found');
    }
});
// Donation Page Route
app.get('/donate', (req, res) => {
    const donatePath = path.join(process.cwd(), 'static/donate.html');
    if (fs.existsSync(donatePath)) {
        res.sendFile(donatePath);
    }
    else {
        res.status(404).send('Donation page not found');
    }
});
// Mod Marketplace Route
app.get('/marketplace', (req, res) => {
    const marketplacePath = path.join(process.cwd(), 'static/marketplace.html');
    if (fs.existsSync(marketplacePath)) {
        res.sendFile(marketplacePath);
    }
    else {
        res.status(404).send('Marketplace not found');
    }
});
// Admin Panel Route
app.get('/admin', (req, res) => {
    const adminPath = path.join(process.cwd(), 'static/admin.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    }
    else {
        res.status(404).send('Admin panel not found');
    }
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
            function openEditor(componentId) {
                console.log('🎨 Opening WYSIWYG editor for component:', componentId);
                currentComponent = componentId;
                const component = componentData[componentId];
                
                if (component) {
                    console.log('📁 Component found:', component);
                    
                    // Create a new WYSIWYG editor window/modal
                    const wysiwygContainer = document.createElement('div');
                    wysiwygContainer.id = 'wysiwygEditor';
                    wysiwygContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
                    
                    const wysiwygContent = document.createElement('div');
                    wysiwygContent.style.cssText = 'background: white; border-radius: 12px; padding: 30px; max-width: 1200px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';
                    
                    wysiwygContent.innerHTML = 
                        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">' +
                            '<h2 style="margin: 0; color: #1e293b;">🎨 WYSIWYG Editor - ' + component.name + '</h2>' +
                            '<button id="closeWysiwyg" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">✕ Close</button>' +
                        '</div>' +
                        '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">' +
                            '<h3 style="margin: 0 0 10px 0; color: #475569;">Component Properties</h3>' +
                            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">' +
                                '<div>' +
                                    '<label style="display: block; margin-bottom: 5px; font-weight: 500; color: #64748b;">Component Name</label>' +
                                    '<input type="text" value="' + component.name + '" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">' +
                                '</div>' +
                                '<div>' +
                                    '<label style="display: block; margin-bottom: 5px; font-weight: 500; color: #64748b;">Type</label>' +
                                    '<select id="componentType-' + componentId + '" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">' +
                                        '<option value="react">React Component</option>' +
                                        '<option value="html">HTML Template</option>' +
                                        '<option value="vue">Vue Component</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; min-height: 300px;">' +
                            '<h3 style="margin: 0 0 15px 0; color: #475569;">Visual Preview</h3>' +
                            '<div id="wysiwygPreview-' + componentId + '" style="background: white; padding: 20px; border-radius: 4px; border: 2px solid #cbd5e1; min-height: 250px;">' +
                                '<!-- Component preview will be rendered here -->' +
                            '</div>' +
                        '</div>' +
                        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">' +
                            '<div>' +
                                '<h3 style="margin: 0 0 10px 0; color: #475569;">Component Files</h3>' +
                                '<ul style="list-style: none; padding: 0; margin: 0; margin-bottom: 15px;">' +
                                    Object.keys(component.files).map(file => 
                                        '<li style="padding: 8px 12px; background: #f8fafc; margin-bottom: 5px; border-radius: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background=\'#e2e8f0\'" onmouseout="this.style.background=\'#f8fafc\'">' +
                                            '📄 ' + file +
                                        '</li>'
                                    ).join('') +
                                '</ul>' +
                                '<button id="openPremiumBtn-' + componentId + '" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 10px;">' +
                                    '✨ Open in Premium Editor' +
                                '</button>' +
                            '</div>' +
                            '<div>' +
                                '<h3 style="margin: 0 0 10px 0; color: #475569;">Actions</h3>' +
                                '<button id="saveBtn-' + componentId + '" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 10px; font-size: 14px; font-weight: 500;">' +
                                    '💾 Save Component' +
                                '</button>' +
                                '<button id="previewBtn-' + componentId + '" style="width: 100%; padding: 12px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 10px; font-size: 14px; font-weight: 500;">' +
                                    '👁️ Preview in Browser' +
                                '</button>' +
                                '<button id="exportBtn-' + componentId + '" style="width: 100%; padding: 12px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">' +
                                    '📤 Export Component' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                    
                    wysiwygContainer.appendChild(wysiwygContent);
                    document.body.appendChild(wysiwygContainer);
                    
                    // Render the component preview
                    const previewContainer = document.getElementById('wysiwygPreview-' + componentId);
                    if (previewContainer) {
                        // Get all file contents as preview
                        const filesHtml = Object.entries(component.files).map(function([filename, content]) {
                            // For HTML files, render them
                            if (filename.endsWith('.html')) {
                                return '<div style="margin-bottom: 20px;">' +
                                    '<h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">📄 ' + filename + '</h4>' +
                                    '<div style="background: #f8fafc; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0;">' +
                                        content +
                                    '</div>' +
                                '</div>';
                            }
                            // For other files, show as code preview
                            return '<div style="margin-bottom: 20px;">' +
                                '<h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">📄 ' + filename + '</h4>' +
                                '<pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; line-height: 1.5;">' + 
                                    content.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                                '</pre>' +
                            '</div>';
                        }).join('');
                        
                        previewContainer.innerHTML = filesHtml || '<p style="color: #94a3b8; text-align: center; padding: 40px;">No preview available</p>';
                    }
                    
                    // Close button handler
                    document.getElementById('closeWysiwyg').addEventListener('click', function() {
                        document.body.removeChild(wysiwygContainer);
                    });
                    
                    // Close on background click
                    wysiwygContainer.addEventListener('click', function(e) {
                        if (e.target === wysiwygContainer) {
                            document.body.removeChild(wysiwygContainer);
                        }
                    });
                    
                    // Preview in Browser button handler
                    document.getElementById('previewBtn-' + componentId).addEventListener('click', function() {
                        console.log('👁️ Opening preview in new window for:', componentId);
                        
                        // Create a preview HTML document with all component files
                        const cssFiles = Object.entries(component.files)
                            .filter(function([name]) { return name.endsWith('.css'); })
                            .map(function([_, content]) { return content; })
                            .join('\\n');
                            
                        const htmlFiles = Object.entries(component.files)
                            .filter(function([name]) { return name.endsWith('.html'); })
                            .map(function([_, content]) { return content; })
                            .join('\\n');
                            
                        const jsFiles = Object.entries(component.files)
                            .filter(function([name]) { return name.endsWith('.js'); })
                            .map(function([_, content]) { return content; })
                            .join('\\n');
                        
                        const previewHtml = 
                            '<!DOCTYPE html>' +
                            '<html lang="en">' +
                            '<head>' +
                                '<meta charset="UTF-8">' +
                                '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
                                '<title>Preview - ' + component.name + '</title>' +
                                '<style>' +
                                    'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }' +
                                    '.component-preview { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }' +
                                    cssFiles +
                                '</style>' +
                            '</head>' +
                            '<body>' +
                                '<h1>Component Preview: ' + component.name + '</h1>' +
                                '<div class="component-preview">' +
                                    htmlFiles +
                                '</div>' +
                                '<script>' +
                                    jsFiles +
                                '</script>' +
                            '</body>' +
                            '</html>';
                        
                        // Open in new window
                        const previewWindow = window.open('', '_blank', 'width=800,height=600');
                        previewWindow.document.write(previewHtml);
                        previewWindow.document.close();
                    });
                    
                    // Save button handler
                    document.getElementById('saveBtn-' + componentId).addEventListener('click', function() {
                        alert('💾 Save functionality coming soon! Will integrate with EditorTome.');
                    });
                    
                    // Export button handler
                    document.getElementById('exportBtn-' + componentId).addEventListener('click', function() {
                        alert('📤 Export functionality coming soon!');
                    });
                    
                    // Open in Premium Editor button handler
                    document.getElementById('openPremiumBtn-' + componentId).addEventListener('click', function() {
                        console.log('✨ Opening in Premium Editor:', componentId);
                        window.open('/editor/premium?component=' + componentId, '_blank', 'width=1400,height=900');
                    });
                    } else {
                    alert('❌ Component not found: ' + componentId);
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
                currentComponent = componentId;
                const component = componentData[componentId];
                
                if (component) {
                    console.log('📁 Component found:', component);
                    
                    // Update UI
                    const editorTitle = document.getElementById('editorTitle');
                    const componentEditor = document.getElementById('componentEditor');
                    
                    if (editorTitle && componentEditor) {
                        editorTitle.textContent = \`\${component.name} Files\`;
                        console.log('📝 Editor title updated to:', component.name);
                        
                        componentEditor.classList.add('active');
                        console.log('✅ Editor UI updated - active class added');
                        
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
                        
                        // Scroll to the component editor
                        setTimeout(() => {
                            componentEditor.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        }, 100);
                    } else {
                        console.error('❌ Required DOM elements not found:', { editorTitle, componentEditor });
                    }
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
                        openEditor(componentId);
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
        // Initialize EditorTome before starting server
        console.log('📚 Initializing EditorTome...');
        await editorTome.initialize();
        console.log('📚 EditorTome initialized successfully');
        // Start listening
        app.listen(EDITOR_CONFIG.port, () => {
            console.log(`🚀 TomeConnector Editor Server running on port ${EDITOR_CONFIG.port}`);
            console.log(`🔍 Health check at http://localhost:${EDITOR_CONFIG.port}/health`);
            console.log(`🎛️  Editor status at http://localhost:${EDITOR_CONFIG.port}/api/editor/status`);
            console.log(`⚙️  Pact features at http://localhost:${EDITOR_CONFIG.port}/api/pact/features`);
            console.log(`🔍 Tracing at http://localhost:${EDITOR_CONFIG.port}/api/tracing/status`);
            console.log(`📚 Tome API at http://localhost:${EDITOR_CONFIG.port}/api/tome/components`);
            console.log(`📊 Tome state at http://localhost:${EDITOR_CONFIG.port}/api/tome/state`);
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
