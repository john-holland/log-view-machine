import { SpanStatusCode } from '@opentelemetry/api';
export interface OpenTelemetryConfig {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    endpoint: string;
    enableMetrics?: boolean;
    enableLogs?: boolean;
    samplingRate?: number;
    enableStackTraces?: boolean;
    maxStackTraceDepth?: number;
}
export interface StackTraceInfo {
    message: string;
    stack: string;
    name: string;
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
    functionName?: string;
}
export interface ErrorContext {
    error: Error;
    stackTrace: StackTraceInfo;
    context?: Record<string, any>;
    timestamp: number;
}
export declare class OpenTelemetryManager {
    private config;
    private isInitialized;
    private errorRegistry;
    constructor(config: OpenTelemetryConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    generateTraceId(): string;
    generateSpanId(): string;
    extractStackTrace(error: Error): StackTraceInfo;
    captureError(error: Error, context?: Record<string, any>): string;
    getErrorContext(traceId: string): ErrorContext | undefined;
    startSpan(name: string, _options?: any): {
        name: string;
        traceId: string;
        spanId: string;
        attributes: Record<string, any>;
        status: {
            code: SpanStatusCode;
            message: string;
        };
        setAttributes: (attributes: Record<string, any>) => void;
        setStatus: (status: any) => void;
        recordException: (error: Error, attributes?: Record<string, any>) => void;
        end: () => void;
        spanContext: () => {
            traceId: string;
            spanId: string;
            traceFlags: number;
            isRemote: boolean;
        };
    };
    getCurrentTraceContext(): {
        traceId: string;
        spanId: string;
        traceFlags: number;
        isRemote: boolean;
    };
    createTraceContext(): {
        traceId: string;
        spanId: string;
        headers: {
            'X-Trace-ID': string;
            'X-Span-ID': string;
            traceparent: string;
        };
    };
    extractTraceContext(headers: Record<string, string>): {
        traceId: string;
        spanId: string;
    } | null;
    getErrorStats(): Record<string, any>;
    clearErrorRegistry(): void;
    getInitializationStatus(): boolean;
    getConfig(): OpenTelemetryConfig;
}
export declare const openTelemetryManager: OpenTelemetryManager;
