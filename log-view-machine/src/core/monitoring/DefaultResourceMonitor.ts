/**
 * In-memory default implementation of ResourceMonitor.
 * Aggregates request counts, bytes, latency; maintains circuit state; produces MetricsSnapshot for reporting.
 */

import type { MetricsSnapshot, RequestMeta, ResourceMonitor } from './types';

interface LatencySample {
  ms: number;
  at: number;
}

const DEFAULT_WINDOW_MS = 60_000;

export class DefaultResourceMonitor implements ResourceMonitor {
  private requestCount = 0;
  private errorCount = 0;
  private bytesIn = 0;
  private bytesOut = 0;
  private latencySamples: LatencySample[] = [];
  private circuitState: Record<string, 'closed' | 'open' | 'halfOpen'> = {};
  private dimensions: Record<string, string> = {};
  private readonly windowMs: number;
  private readonly maxSamples: number;

  constructor(options?: { windowMs?: number; maxSamples?: number; dimensions?: Record<string, string> }) {
    this.windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxSamples = options?.maxSamples ?? 1000;
    this.dimensions = options?.dimensions ?? {};
  }

  trackRequest(meta: RequestMeta): void {
    this.requestCount++;
    if (meta.status != null && meta.status >= 400) this.errorCount++;
    if (meta.bytesIn != null) this.bytesIn += meta.bytesIn;
    if (meta.bytesOut != null) this.bytesOut += meta.bytesOut;
    if (meta.latencyMs != null) {
      const now = Date.now();
      this.latencySamples.push({ ms: meta.latencyMs, at: now });
      if (this.latencySamples.length > this.maxSamples) {
        this.latencySamples.shift();
      }
    }
  }

  trackCircuit(name: string, state: 'closed' | 'open' | 'halfOpen'): void {
    this.circuitState[name] = state;
  }

  getSnapshot(): MetricsSnapshot {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const recent = this.latencySamples.filter((s) => s.at >= cutoff);
    let p50: number | undefined;
    let p95: number | undefined;
    let p99: number | undefined;
    let avg: number | undefined;
    if (recent.length > 0) {
      const sorted = recent.map((s) => s.ms).sort((a, b) => a - b);
      p50 = sorted[Math.floor(sorted.length * 0.5)] ?? sorted[0];
      p95 = sorted[Math.floor(sorted.length * 0.95)] ?? sorted[sorted.length - 1];
      p99 = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1];
      avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    }
    const circuitNames = Object.keys(this.circuitState);
    const circuitState = circuitNames.length === 1
      ? this.circuitState[circuitNames[0]]
      : circuitNames.length > 1
        ? (this.circuitState['default'] ?? this.circuitState[circuitNames[0]])
        : undefined;
    return {
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      bytesIn: this.bytesIn,
      bytesOut: this.bytesOut,
      latencyMs: p50 != null ? { p50, p95, p99, avg } : undefined,
      circuitState,
      timestamp: now,
      dimensions: { ...this.dimensions },
    };
  }

  getSnapshots(): MetricsSnapshot[] {
    return [this.getSnapshot()];
  }
}

export function createDefaultResourceMonitor(
  options?: { windowMs?: number; maxSamples?: number; dimensions?: Record<string, string> }
): ResourceMonitor {
  return new DefaultResourceMonitor(options);
}
