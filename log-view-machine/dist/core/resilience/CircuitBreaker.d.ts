/**
 * Circuit breaker: closed (normal), open (reject), half-open (probe).
 * State transitions driven by failure count / error rate from ResourceMonitor or internal counts.
 * Expose circuit state so MetricsReporter can include it in snapshots (AWS/Hystrix).
 */
import type { ResourceMonitor } from '../monitoring/types';
export type CircuitState = 'closed' | 'open' | 'halfOpen';
export interface CircuitBreakerOptions {
    /** Name for metrics dimensions */
    name?: string;
    /** Failure count or error-rate threshold to open (default 5) */
    threshold?: number;
    /** Ms to wait before half-open (default 30_000) */
    resetMs?: number;
    /** Optional: use this monitor to read failure count; otherwise use internal count */
    monitor?: ResourceMonitor;
    /** When true, use monitor.getSnapshot().errorCount (and requestCount for rate); else use internal failureCount */
    useMonitorForThreshold?: boolean;
}
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private lastOpenAt;
    private readonly name;
    private readonly threshold;
    private readonly resetMs;
    private readonly monitor?;
    private readonly useMonitorForThreshold;
    constructor(options?: CircuitBreakerOptions);
    getState(): CircuitState;
    /** Record success (e.g. after a successful request). */
    recordSuccess(): void;
    /** Record failure (e.g. after a failed request). */
    recordFailure(): void;
    /** Returns true if the request is allowed (closed or halfOpen). */
    allowRequest(): boolean;
    /** Execute fn through the circuit; on throw or non-ok result, recordFailure; else recordSuccess. */
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
export declare function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.d.ts.map