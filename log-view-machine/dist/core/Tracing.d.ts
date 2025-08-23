export interface MessageMetadata {
    messageId: string;
    traceId: string;
    spanId: string;
    timestamp: string;
    backend: 'kotlin' | 'node';
    action: string;
    data?: any;
}
export interface TraceInfo {
    traceId: string;
    messages: MessageMetadata[];
    startTime?: string;
    endTime?: string;
    backend?: 'kotlin' | 'node';
}
export declare class Tracing {
    private messageHistory;
    private traceMap;
    generateMessageId(): string;
    generateTraceId(): string;
    generateSpanId(): string;
    trackMessage(messageId: string, traceId: string, spanId: string, metadata: Partial<MessageMetadata>): MessageMetadata;
    getMessage(messageId: string): MessageMetadata | undefined;
    getTraceMessages(traceId: string): MessageMetadata[];
    getFullTrace(traceId: string): TraceInfo;
    getMessageHistory(): MessageMetadata[];
    getTraceIds(): string[];
    clearHistory(): void;
    createTracingHeaders(traceId: string, spanId: string, messageId: string, enableDataDog?: boolean): Record<string, string>;
}
export declare function createTracing(): Tracing;
