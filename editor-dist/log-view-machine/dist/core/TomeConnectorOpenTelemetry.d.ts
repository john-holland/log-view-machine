import { TomeConnectorProxy } from './TomeConnectorProxy';
export interface OpenTelemetryConfig {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    endpoint: string;
    headers?: Record<string, string>;
    enableMetrics?: boolean;
    enableLogs?: boolean;
    samplingRate?: number;
    maxExportBatchSize?: number;
    maxQueueSize?: number;
    exportTimeoutMillis?: number;
}
export interface SpanContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    traceFlags?: number;
    isRemote?: boolean;
}
export interface TelemetryAttributes {
    [key: string]: string | number | boolean | undefined;
}
export declare class TomeConnectorOpenTelemetry {
    private proxy;
    private robotCopy;
    private config;
    private tracer;
    private meter;
    private logger;
    private isInitialized;
    private attributes;
    private status;
    private events;
    private startTime;
    private endTime;
    private duration;
    constructor(proxy: TomeConnectorProxy, config: OpenTelemetryConfig);
    initialize(): Promise<void>;
    private initializeOpenTelemetrySDK;
    private setupInstrumentation;
    startSpan(name: string, attributes?: TelemetryAttributes, parentContext?: SpanContext): any;
    private createMockSpan;
    createCounter(name: string, description?: string): any;
    createHistogram(name: string, description?: string): any;
    createGauge(name: string, description?: string): any;
    private createMockCounter;
    private createMockHistogram;
    private createMockGauge;
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, attributes?: TelemetryAttributes): void;
    instrumentProxyRequest(request: any): any;
    instrumentProxyResponse(response: any, span: any, duration: number): void;
    private getOperationFromPath;
    getTelemetryMetrics(): Promise<any>;
    shutdown(): Promise<void>;
    isTelemetryInitialized(): boolean;
    getConfig(): OpenTelemetryConfig;
}
export declare function createTomeConnectorOpenTelemetry(proxy: TomeConnectorProxy, config: OpenTelemetryConfig): TomeConnectorOpenTelemetry;
