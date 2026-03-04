import { MessageMetadata } from '../../../../tracing/Tracing';
import { type MessageTokenPayload } from '../../../../messaging/MessageToken';
import type { ResourceMonitor } from '../../../../monitoring/types';
import { type ThrottlePolicy } from '../../../../resilience/ThrottlePolicy';
/** Backoff config for retries (exponential backoff, optional jitter). */
export interface BackoffConfig {
    initialDelayMs?: number;
    maxDelayMs?: number;
    multiplier?: number;
    maxRetries?: number;
    jitter?: boolean;
}
export interface RobotCopyConfig {
    unleashUrl?: string;
    unleashClientKey?: string;
    unleashAppName?: string;
    unleashEnvironment?: string;
    kotlinBackendUrl?: string;
    nodeBackendUrl?: string;
    enableTracing?: boolean;
    enableDataDog?: boolean;
    /** Toggle name that when enabled means use Kotlin backend; when disabled use Node. If omitted, getBackendUrl uses nodeBackendUrl. */
    backendSelectorToggle?: string;
    /** Path prefix for sendMessage (e.g. '/api/fish-burger'). Default '/api'. */
    apiBasePath?: string;
    /** Optional initial toggle map; merged into toggles so the library does not hard-code toggle names. */
    initialToggles?: Record<string, boolean>;
    /** Optional: when set, attach message token to outbound sendMessage (header or body). Server validates. */
    messageTokenProvider?: () => Promise<MessageTokenPayload> | MessageTokenPayload;
    /** Optional: for server-side RobotCopy when acting as client; secret used to generate tokens. */
    messageTokenSecret?: string;
    /** Optional: CORS (e.g. credentials: true for fetch). CORS headers are server responsibility. */
    cors?: boolean | {
        credentials?: boolean;
    };
    /** Optional: use HTTP/2 when available (environment-dependent). */
    http2?: boolean;
    /** Optional: retry with exponential backoff on 5xx / network errors. */
    retryPolicy?: BackoffConfig;
    /** Optional: throttle policy; when over limit, sendMessage rejects before calling backend. */
    throttle?: ThrottlePolicy | {
        maxRequestsPerMinute?: number;
        maxBytesPerMinute?: number;
        windowMs?: number;
    };
    /** Optional: circuit breaker config; when open, sendMessage rejects without calling backend. */
    circuitBreaker?: {
        threshold?: number;
        resetMs?: number;
        name?: string;
    };
    /** Optional: record request/bytes/latency/status for metrics. */
    resourceMonitor?: ResourceMonitor;
    /** Optional: custom transport; when set, sendMessage uses transport.send(action, data) instead of fetch. Use for extension messaging (e.g. Chrome background). */
    transport?: {
        send(action: string, data: unknown): Promise<unknown>;
    };
}
export declare class RobotCopy {
    private config;
    private tracing;
    private unleashToggles;
    private machines;
    private circuitBreaker;
    private throttlePolicy;
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
    getFullTrace(traceId: string): import("../../../../tracing/Tracing").TraceInfo;
    sendMessage(action: string, data?: any): Promise<any>;
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
    private locationRegistry;
    /**
     * Set or override location for a machine or tome.
     * When local is true, the runner activates local VSM; when false, sends via client (e.g. HTTP) instead.
     */
    setLocation(machineIdOrTomeId: string, opts: {
        local: boolean;
        client?: string | Record<string, unknown>;
    }): void;
    /**
     * Get location for a machine or tome. Returns undefined if not set (caller may treat as local).
     */
    getLocation(machineIdOrTomeId: string): {
        local: boolean;
        client?: string | Record<string, unknown>;
    } | undefined;
    /**
     * Register default location from TomeMachineConfig (location / remoteClient).
     * Converts location hint to local/remote; can be overridden later by setLocation.
     */
    registerMachineLocation(machineIdOrTomeId: string, defaultFromConfig?: {
        location?: string;
        remoteClient?: string | Record<string, unknown>;
    }): void;
    /**
     * Answer whether the given machine/tome is local (run here) or remote (send via client).
     * Defaults to true (local) when no location is registered.
     */
    isLocal(machineIdOrTomeId: string): boolean;
}
export declare function createRobotCopy(config?: RobotCopyConfig): RobotCopy;
//# sourceMappingURL=RobotCopy.d.ts.map