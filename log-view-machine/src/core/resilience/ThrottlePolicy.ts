/**
 * Throttle policy: signals "over limit" from a sliding or fixed window (request count or bytes).
 * Reads from ResourceMonitor snapshot or uses an internal window. Middleware or RobotCopy can return 429 when over limit.
 */

import type { ResourceMonitor } from '../monitoring/types';

export interface ThrottleConfig {
  maxRequestsPerMinute?: number;
  maxBytesPerMinute?: number;
  windowMs?: number;
}

export interface ThrottlePolicyOptions {
  config: ThrottleConfig;
  /** Optional: read request/bytes from this monitor's snapshot; otherwise use internal counters */
  monitor?: ResourceMonitor;
}

interface WindowSlot {
  requests: number;
  bytes: number;
  at: number;
}

export class ThrottlePolicy {
  private readonly config: ThrottleConfig;
  private readonly monitor?: ResourceMonitor;
  private readonly windowMs: number;
  private slots: WindowSlot[] = [];

  constructor(options: ThrottlePolicyOptions) {
    this.config = options.config;
    this.monitor = options.monitor;
    this.windowMs = options.config.windowMs ?? 60_000;
  }

  /** Record one request (and optional bytes). Call this when a request is about to be processed or was processed. */
  record(bytesIn = 0, bytesOut = 0): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.slots = this.slots.filter((s) => s.at >= cutoff);
    this.slots.push({ requests: 1, bytes: bytesIn + bytesOut, at: now });
  }

  /** Returns true if over limit (should throttle / 429). */
  isOverLimit(): boolean {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const inWindow = this.slots.filter((s) => s.at >= cutoff);
    const requests = inWindow.reduce((a, s) => a + s.requests, 0);
    const bytes = inWindow.reduce((a, s) => a + s.bytes, 0);
    if (this.config.maxRequestsPerMinute != null && requests >= this.config.maxRequestsPerMinute) return true;
    if (this.config.maxBytesPerMinute != null && bytes >= this.config.maxBytesPerMinute) return true;
    if (this.monitor) {
      const snap = this.monitor.getSnapshot();
      if (this.config.maxRequestsPerMinute != null && snap.requestCount >= this.config.maxRequestsPerMinute) return true;
      if (this.config.maxBytesPerMinute != null && snap.bytesIn + snap.bytesOut >= this.config.maxBytesPerMinute) return true;
    }
    return false;
  }
}

export function createThrottlePolicy(options: ThrottlePolicyOptions): ThrottlePolicy {
  return new ThrottlePolicy(options);
}
