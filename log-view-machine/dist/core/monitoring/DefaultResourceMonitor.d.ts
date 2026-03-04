/**
 * In-memory default implementation of ResourceMonitor.
 * Aggregates request counts, bytes, latency; maintains circuit state; produces MetricsSnapshot for reporting.
 */
import type { MetricsSnapshot, RequestMeta, ResourceMonitor } from './types';
export declare class DefaultResourceMonitor implements ResourceMonitor {
    private requestCount;
    private errorCount;
    private bytesIn;
    private bytesOut;
    private latencySamples;
    private circuitState;
    private dimensions;
    private readonly windowMs;
    private readonly maxSamples;
    constructor(options?: {
        windowMs?: number;
        maxSamples?: number;
        dimensions?: Record<string, string>;
    });
    trackRequest(meta: RequestMeta): void;
    trackCircuit(name: string, state: 'closed' | 'open' | 'halfOpen'): void;
    getSnapshot(): MetricsSnapshot;
    getSnapshots(): MetricsSnapshot[];
}
export declare function createDefaultResourceMonitor(options?: {
    windowMs?: number;
    maxSamples?: number;
    dimensions?: Record<string, string>;
}): ResourceMonitor;
//# sourceMappingURL=DefaultResourceMonitor.d.ts.map