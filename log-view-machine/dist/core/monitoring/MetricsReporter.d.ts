/**
 * Pluggable reporter for MetricsSnapshot. Default can post to GA-like endpoint;
 * override reportTo to push to CloudWatch, Hystrix stream, or other backend.
 */
import type { MetricsSnapshot } from './types';
export type ReportFn = (snapshot: MetricsSnapshot) => void | Promise<void>;
export interface MetricsReporterOptions {
    /** Called with each snapshot; default no-op. Set to post to GA4 Measurement Protocol, CloudWatch, Hystrix, etc. */
    reportTo?: ReportFn;
    /** When set, reporter periodically calls getSnapshot() and reportTo(snapshot) at this interval (ms). */
    intervalMs?: number;
}
/**
 * MetricsReporter: holds a ResourceMonitor (or getSnapshot fn), optionally reports at interval.
 * Call report(snapshot) manually or set intervalMs to report periodically.
 */
export interface MetricsReporter {
    report(snapshot: MetricsSnapshot): void | Promise<void>;
    start?(): void;
    stop?(): void;
}
export declare function createMetricsReporter(getSnapshot: () => MetricsSnapshot, options?: MetricsReporterOptions): MetricsReporter;
//# sourceMappingURL=MetricsReporter.d.ts.map