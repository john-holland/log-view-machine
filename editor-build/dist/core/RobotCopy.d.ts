import { MessageMetadata } from './Tracing';
export interface RobotCopyConfig {
    unleashUrl?: string;
    unleashClientKey?: string;
    unleashAppName?: string;
    unleashEnvironment?: string;
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
    startCooking(orderId: string, ingredients: string[]): Promise<any>;
    updateProgress(orderId: string, cookingTime: number, temperature: number): Promise<any>;
    completeCooking(orderId: string): Promise<any>;
    integrateWithViewStateMachine(viewStateMachine: any): RobotCopy;
    getTrace(traceId: string): Promise<any>;
    getMessageFromBackend(messageId: string): Promise<any>;
    getMessageHistory(): MessageMetadata[];
    getTraceIds(): string[];
    clearHistory(): void;
    updateConfig(newConfig: Partial<RobotCopyConfig>): void;
    getConfig(): RobotCopyConfig;
    onResponse(channel: string, _handler: (response: any) => void): void;
    registerMachine(name: string, machine: any, config?: any): void;
    getRegisteredMachines(): Map<string, any>;
    getRegisteredMachine(name: string): any;
}
export declare function createRobotCopy(config?: RobotCopyConfig): RobotCopy;
