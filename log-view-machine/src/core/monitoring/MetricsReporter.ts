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

export function createMetricsReporter(
  getSnapshot: () => MetricsSnapshot,
  options?: MetricsReporterOptions
): MetricsReporter {
  const reportTo = options?.reportTo ?? (() => {});
  let intervalId: ReturnType<typeof setInterval> | null = null;

  async function report(snapshot: MetricsSnapshot): Promise<void> {
    await Promise.resolve(reportTo(snapshot));
  }

  return {
    report(snapshot: MetricsSnapshot) {
      return report(snapshot);
    },
    start() {
      if (options?.intervalMs != null && options.intervalMs > 0 && intervalId == null) {
        intervalId = setInterval(() => {
          report(getSnapshot()).catch(() => {});
        }, options.intervalMs);
      }
    },
    stop() {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };
}
