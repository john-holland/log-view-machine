import { MessageMetadata } from './Tracing';
export interface RobotCopyConfig {
    unleashUrl?: string;
    unleashClientKey?: string;
    unleashAppName?: string;
    unleashEnvironment?: string;
    apiPath?: string;
    traceApiPath?: string;
    messageApiPath?: string;
    kotlinBackendUrl?: string;
    nodeBackendUrl?: string;
    enableTracing?: boolean;
    enableDataDog?: boolean;
}
export declare class RobotCopy {
    private config;
    private tracing;
    private unleashToggles;
    private machines;
    constructor(config?: RobotCopyConfig);
    private initializeUnleashToggles;
    isEnabled(toggleName: string, _context?: any): Promise<boolean>;
    getBackendUrl(): Promise<string>;
    getBackendType(): Promise<'kotlin' | 'node'>;
    generateMessageId(): string;
    generateTraceId(): string;
    generateSpanId(): string;
    trackMessage(messageId: string, traceId: string, spanId: string, metadata: Partial<MessageMetadata>): MessageMetadata;
    getMessage(messageId: string): MessageMetadata | undefined;
    getTraceMessages(traceId: string): MessageMetadata[];
    getFullTrace(traceId: string): import("./Tracing").TraceInfo;
    sendMessage(action: string, data?: any): Promise<any>;
    getTrace(traceId: string): Promise<any>;
    getMessageFromBackend(messageId: string): Promise<any>;
    getMessageHistory(): MessageMetadata[];
    getTraceIds(): string[];
    clearHistory(): void;
    updateConfig(newConfig: Partial<RobotCopyConfig>): void;
    getConfig(): RobotCopyConfig;
    private responseHandlers;
    onResponse(channel: string, handler: (response: any) => void): void;
    triggerResponse(channel: string, response: any): void;
    removeResponseHandler(channel: string): void;
    registerMachine(name: string, machine: any, config?: any): void;
    getRegisteredMachines(): Map<string, any>;
    getRegisteredMachine(name: string): any;
}
export declare function createRobotCopy(config?: RobotCopyConfig): RobotCopy;
