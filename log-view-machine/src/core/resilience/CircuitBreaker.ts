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

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastOpenAt = 0;
  private readonly name: string;
  private readonly threshold: number;
  private readonly resetMs: number;
  private readonly monitor?: ResourceMonitor;
  private readonly useMonitorForThreshold: boolean;

  constructor(options: CircuitBreakerOptions = {}) {
    this.name = options.name ?? 'default';
    this.threshold = options.threshold ?? 5;
    this.resetMs = options.resetMs ?? 30_000;
    this.monitor = options.monitor;
    this.useMonitorForThreshold = options.useMonitorForThreshold ?? false;
  }

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.lastOpenAt >= this.resetMs) {
      this.state = 'halfOpen';
      this.successCount = 0;
      this.failureCount = 0;
    }
    return this.state;
  }

  /** Record success (e.g. after a successful request). */
  recordSuccess(): void {
    if (this.monitor) this.monitor.trackCircuit(this.name, 'closed');
    if (this.state === 'halfOpen') {
      this.successCount++;
      if (this.successCount >= 1) {
        this.state = 'closed';
        this.failureCount = 0;
      }
    } else if (this.state === 'closed') {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /** Record failure (e.g. after a failed request). */
  recordFailure(): void {
    if (this.state === 'closed') {
      let overThreshold = false;
      if (this.useMonitorForThreshold && this.monitor) {
        const snap = this.monitor.getSnapshot();
        const rate = snap.requestCount > 0 ? snap.errorCount / snap.requestCount : 0;
        overThreshold = snap.errorCount >= this.threshold || rate >= this.threshold / 10;
      } else {
        this.failureCount++;
        overThreshold = this.failureCount >= this.threshold;
      }
      if (overThreshold) {
        this.state = 'open';
        this.lastOpenAt = Date.now();
        if (this.monitor) this.monitor.trackCircuit(this.name, 'open');
      }
    } else if (this.state === 'halfOpen') {
      this.state = 'open';
      this.lastOpenAt = Date.now();
      if (this.monitor) this.monitor.trackCircuit(this.name, 'open');
    }
  }

  /** Returns true if the request is allowed (closed or halfOpen). */
  allowRequest(): boolean {
    const s = this.getState();
    if (s === 'open') return false;
    if (s === 'halfOpen' && this.monitor) this.monitor.trackCircuit(this.name, 'halfOpen');
    return true;
  }

  /** Execute fn through the circuit; on throw or non-ok result, recordFailure; else recordSuccess. */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.allowRequest()) {
      throw new Error(`CircuitBreaker ${this.name} is open`);
    }
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (e) {
      this.recordFailure();
      throw e;
    }
  }
}

export function createCircuitBreaker(options?: CircuitBreakerOptions): CircuitBreaker {
  return new CircuitBreaker(options);
}
