export class Tracing {
    constructor() {
        this.messageHistory = new Map();
        this.traceMap = new Map();
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
export function createTracing() {
    return new Tracing();
}
