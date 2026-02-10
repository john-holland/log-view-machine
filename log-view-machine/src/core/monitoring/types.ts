/**
 * Metrics types compatible with AWS CloudWatch and Hystrix.
 * Same pipeline can feed dashboards or other backends.
 */

export interface MetricsSnapshot {
  requestCount: number;
  errorCount: number;
  bytesIn: number;
  bytesOut: number;
  /** Latency in ms; percentiles when available */
  latencyMs?: { p50?: number; p95?: number; p99?: number; avg?: number };
  circuitState?: 'closed' | 'open' | 'halfOpen';
  timestamp: number;
  /** Dimensions for CloudWatch (e.g. CaveId, TomeId, route, adapter name) */
  dimensions: Record<string, string>;
}

export interface RequestMeta {
  path?: string;
  method?: string;
  caveId?: string;
  tomeId?: string;
  bytesIn?: number;
  bytesOut?: number;
  latencyMs?: number;
  status?: number;
}

/**
 * Monitor interface: track requests and circuit state; produce snapshots for reporting.
 */
export interface ResourceMonitor {
  trackRequest(meta: RequestMeta): void;
  trackCircuit(name: string, state: 'closed' | 'open' | 'halfOpen'): void;
  getSnapshot(): MetricsSnapshot;
  getSnapshots?(): MetricsSnapshot[];
}

/**
 * Optional bandwidth tracker (bytes in/out with optional labels).
 */
export interface BandwidthTracker {
  trackBandwidth(bytesIn: number, bytesOut: number, labels?: Record<string, string>): void;
}
