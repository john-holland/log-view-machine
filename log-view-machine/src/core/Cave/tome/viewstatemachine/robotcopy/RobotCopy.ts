import { Tracing, createTracing, MessageMetadata } from '../../../../tracing/Tracing';
import { serializeToken, type MessageTokenPayload } from '../../../../messaging/MessageToken';
import type { ResourceMonitor } from '../../../../monitoring/types';
import { createCircuitBreaker, type CircuitBreaker } from '../../../../resilience/CircuitBreaker';
import { createThrottlePolicy, type ThrottlePolicy } from '../../../../resilience/ThrottlePolicy';

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
  cors?: boolean | { credentials?: boolean };
  /** Optional: use HTTP/2 when available (environment-dependent). */
  http2?: boolean;
  /** Optional: retry with exponential backoff on 5xx / network errors. */
  retryPolicy?: BackoffConfig;
  /** Optional: throttle policy; when over limit, sendMessage rejects before calling backend. */
  throttle?: ThrottlePolicy | { maxRequestsPerMinute?: number; maxBytesPerMinute?: number; windowMs?: number };
  /** Optional: circuit breaker config; when open, sendMessage rejects without calling backend. */
  circuitBreaker?: { threshold?: number; resetMs?: number; name?: string };
  /** Optional: record request/bytes/latency/status for metrics. */
  resourceMonitor?: ResourceMonitor;
  /** Optional: custom transport; when set, sendMessage uses transport.send(action, data) instead of fetch. Use for extension messaging (e.g. Chrome background). */
  transport?: { send(action: string, data: unknown): Promise<unknown> };
}

export class RobotCopy {
  private config: RobotCopyConfig;
  private tracing: Tracing;
  private unleashToggles: Map<string, boolean> = new Map();
  private machines: Map<string, { machine: any; config: any; registeredAt: string }> | undefined;
  private circuitBreaker: CircuitBreaker | null = null;
  private throttlePolicy: ThrottlePolicy | null = null;

  constructor(config: RobotCopyConfig = {}) {
    this.config = {
      unleashUrl: 'http://localhost:4242/api',
      unleashClientKey: 'default:development.unleash-insecure-api-token',
      unleashAppName: 'log-view-machine',
      unleashEnvironment: 'development',
      kotlinBackendUrl: 'http://localhost:8080',
      nodeBackendUrl: 'http://localhost:3001',
      enableTracing: true,
      enableDataDog: true,
      apiBasePath: '/api',
      ...config,
    };

    this.tracing = createTracing();
    this.initializeUnleashToggles();

    if (this.config.circuitBreaker) {
      const cb = this.config.circuitBreaker;
      this.circuitBreaker = createCircuitBreaker({
        name: cb.name ?? 'robotcopy',
        threshold: cb.threshold,
        resetMs: cb.resetMs,
        monitor: this.config.resourceMonitor,
      });
    }
    if (this.config.throttle) {
      const t = this.config.throttle;
      this.throttlePolicy = 'record' in t && 'isOverLimit' in t
        ? (t as ThrottlePolicy)
        : createThrottlePolicy({ config: t as any, monitor: this.config.resourceMonitor });
    }
  }

  private async initializeUnleashToggles() {
    // Apply optional initial toggles from config; otherwise only generic toggles
    if (this.config.initialToggles && Object.keys(this.config.initialToggles).length > 0) {
      for (const [name, value] of Object.entries(this.config.initialToggles)) {
        this.unleashToggles.set(name, value);
      }
    }
    this.unleashToggles.set('enable-tracing', true);
    this.unleashToggles.set('enable-datadog', true);
  }

  async isEnabled(toggleName: string, _context: any = {}): Promise<boolean> {
    return this.unleashToggles.get(toggleName) || false;
  }

  async getBackendUrl(): Promise<string> {
    const toggleName = this.config.backendSelectorToggle;
    if (!toggleName) {
      return this.config.nodeBackendUrl!;
    }
    const useKotlin = await this.isEnabled(toggleName);
    return useKotlin ? this.config.kotlinBackendUrl! : this.config.nodeBackendUrl!;
  }

  async getBackendType(): Promise<'kotlin' | 'node'> {
    const toggleName = this.config.backendSelectorToggle;
    if (!toggleName) {
      return 'node';
    }
    const useKotlin = await this.isEnabled(toggleName);
    return useKotlin ? 'kotlin' : 'node';
  }

  generateMessageId(): string {
    return this.tracing.generateMessageId();
  }

  generateTraceId(): string {
    return this.tracing.generateTraceId();
  }

  generateSpanId(): string {
    return this.tracing.generateSpanId();
  }

  trackMessage(messageId: string, traceId: string, spanId: string, metadata: Partial<MessageMetadata>): MessageMetadata {
    return this.tracing.trackMessage(messageId, traceId, spanId, metadata);
  }

  getMessage(messageId: string): MessageMetadata | undefined {
    return this.tracing.getMessage(messageId);
  }

  getTraceMessages(traceId: string): MessageMetadata[] {
    return this.tracing.getTraceMessages(traceId);
  }

  getFullTrace(traceId: string) {
    return this.tracing.getFullTrace(traceId);
  }

  async sendMessage(action: string, data: any = {}): Promise<any> {
    if (this.throttlePolicy?.isOverLimit()) {
      const err = new Error('Throttle limit exceeded; try again later') as Error & { code?: string };
      err.code = 'THROTTLED';
      throw err;
    }
    if (this.circuitBreaker && !this.circuitBreaker.allowRequest()) {
      const err = new Error('Circuit breaker is open') as Error & { code?: string };
      err.code = 'CIRCUIT_OPEN';
      throw err;
    }

    if (this.config.transport) {
      return this.config.transport.send(action, data);
    }

    const doOne = async (): Promise<any> => {
      const messageId = this.generateMessageId();
      const traceId = this.generateTraceId();
      const spanId = this.generateSpanId();
      const backend = await this.getBackendType();
      const backendUrl = await this.getBackendUrl();

      this.trackMessage(messageId, traceId, spanId, { backend, action, data });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.tracing.createTracingHeaders(traceId, spanId, messageId, await this.isEnabled('enable-datadog')),
      };
      const bodyPayload: Record<string, unknown> = { ...data, messageId, traceId, spanId };
      if (this.config.messageTokenProvider) {
        try {
          const token = await Promise.resolve(this.config.messageTokenProvider!());
          if (token) {
            headers['X-Cave-Message-Token'] = serializeToken(token);
            bodyPayload._messageToken = token;
          }
        } catch (_) {}
      }

      const basePath = (this.config.apiBasePath ?? '/api').replace(/\/$/, '');
      const url = `${backendUrl}${basePath}/${action}`;
      const bodyStr = JSON.stringify(bodyPayload);
      const start = Date.now();

      const response = await fetch(url, { method: 'POST', headers, body: bodyStr });
      const latencyMs = Date.now() - start;
      const bytesIn = bodyStr.length;
      const responseText = await response.text();
      const bytesOut = new TextEncoder().encode(responseText).length;

      if (this.config.resourceMonitor) {
        this.config.resourceMonitor.trackRequest({
          path: basePath + '/' + action,
          method: 'POST',
          bytesIn,
          bytesOut,
          latencyMs,
          status: response.status,
        });
      }
      if (this.throttlePolicy) this.throttlePolicy.record(bytesIn, bytesOut);

      if (!response.ok) {
        if (this.circuitBreaker) this.circuitBreaker.recordFailure();
        const err = new Error(`HTTP ${response.status}: ${response.statusText}`);
        this.trackMessage(`${messageId}_error`, traceId, spanId, { backend, action: `${action}_error`, data: { error: err.message } });
        throw err;
      }
      if (this.circuitBreaker) this.circuitBreaker.recordSuccess();
      let result: any;
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = {};
      }
      this.trackMessage(`${messageId}_response`, traceId, spanId, { backend, action: `${action}_response`, data: result });
      return result;
    };

    const maxRetries = this.config.retryPolicy?.maxRetries ?? 0;
    const initialDelayMs = this.config.retryPolicy?.initialDelayMs ?? 1000;
    const maxDelayMs = this.config.retryPolicy?.maxDelayMs ?? 30_000;
    const multiplier = this.config.retryPolicy?.multiplier ?? 2;
    const jitter = this.config.retryPolicy?.jitter ?? true;

    const isRetryable = (e: any) => {
      const msg = e?.message ?? String(e);
      if (msg.includes('HTTP 5') || msg.includes('fetch')) return true;
      return false;
    };

    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(async () => {
        let lastErr: any;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await doOne();
          } catch (e) {
            lastErr = e;
            if (attempt < maxRetries && isRetryable(e)) {
              let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
              if (jitter) delay *= 0.5 + Math.random() * 0.5;
              await new Promise((r) => setTimeout(r, delay));
              continue;
            }
            throw e;
          }
        }
        throw lastErr;
      });
    }

    let lastErr: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await doOne();
      } catch (e) {
        lastErr = e;
        if (attempt < maxRetries && isRetryable(e)) {
          let delay = Math.min(initialDelayMs * Math.pow(multiplier, attempt), maxDelayMs);
          if (jitter) delay *= 0.5 + Math.random() * 0.5;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw e;
      }
    }
    throw lastErr;
  }

  async getTrace(traceId: string): Promise<any> {
    const backendUrl = await this.getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/trace/${traceId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to get trace ${traceId}:`, error);
      return this.getFullTrace(traceId);
    }
  }

  async getMessageFromBackend(messageId: string): Promise<any> {
    const backendUrl = await this.getBackendUrl();

    try {
      const response = await fetch(`${backendUrl}/api/message/${messageId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Failed to get message ${messageId}:`, error);
      return this.getMessage(messageId);
    }
  }



  // Debugging and monitoring methods
  getMessageHistory(): MessageMetadata[] {
    return this.tracing.getMessageHistory();
  }

  getTraceIds(): string[] {
    return this.tracing.getTraceIds();
  }

  clearHistory(): void {
    this.tracing.clearHistory();
  }

  // Configuration methods
  updateConfig(newConfig: Partial<RobotCopyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RobotCopyConfig {
    return { ...this.config };
  }

  // Response handling
  onResponse(channel: string, _handler: (response: any) => void): void {
    // This would be implemented to handle incoming responses
    // For now, we're just store the handler for future use
    console.log(`Registered response handler for channel: ${channel}`);
  }

  // Machine registration for state machines
  registerMachine(name: string, machine: any, config: any = {}): void {
    console.log(`Registering machine: ${name}`, { config });
    // Store the machine registration for future use
    // This could be used for machine discovery, monitoring, etc.
    if (!this.machines) {
      this.machines = new Map();
    }
    this.machines.set(name, { machine, config, registeredAt: new Date().toISOString() });
    // Apply default location from config (TomeMachineConfig.location / remoteClient)
    const loc = (config as { location?: string; remoteClient?: string | Record<string, unknown> }).location;
    const client = (config as { location?: string; remoteClient?: string | Record<string, unknown> }).remoteClient;
    if (loc !== undefined || client !== undefined) {
      this.registerMachineLocation(name, { location: loc, remoteClient: client });
    }
  }

  // Get registered machines
  getRegisteredMachines(): Map<string, any> {
    return this.machines || new Map();
  }

  // Get a specific registered machine
  getRegisteredMachine(name: string): any {
    return this.machines?.get(name);
  }

  // --- Location (local vs remote) for machines/tomes ---

  private locationRegistry: Map<string, { local: boolean; client?: string | Record<string, unknown> }> = new Map();

  /**
   * Set or override location for a machine or tome.
   * When local is true, the runner activates local VSM; when false, sends via client (e.g. HTTP) instead.
   */
  setLocation(machineIdOrTomeId: string, opts: { local: boolean; client?: string | Record<string, unknown> }): void {
    this.locationRegistry.set(machineIdOrTomeId, { local: opts.local, client: opts.client });
  }

  /**
   * Get location for a machine or tome. Returns undefined if not set (caller may treat as local).
   */
  getLocation(machineIdOrTomeId: string): { local: boolean; client?: string | Record<string, unknown> } | undefined {
    return this.locationRegistry.get(machineIdOrTomeId);
  }

  /**
   * Register default location from TomeMachineConfig (location / remoteClient).
   * Converts location hint to local/remote; can be overridden later by setLocation.
   */
  registerMachineLocation(
    machineIdOrTomeId: string,
    defaultFromConfig?: { location?: string; remoteClient?: string | Record<string, unknown> }
  ): void {
    if (!defaultFromConfig) return;
    const { location, remoteClient } = defaultFromConfig;
    const local = location === 'remote' ? false : true;
    const client = remoteClient ?? (typeof location === 'string' && location !== 'local' && location !== 'same-cave' ? location : undefined);
    if (!this.locationRegistry.has(machineIdOrTomeId)) {
      this.locationRegistry.set(machineIdOrTomeId, { local, client });
    }
  }

  /**
   * Answer whether the given machine/tome is local (run here) or remote (send via client).
   * Defaults to true (local) when no location is registered.
   */
  isLocal(machineIdOrTomeId: string): boolean {
    const entry = this.locationRegistry.get(machineIdOrTomeId);
    return entry === undefined ? true : entry.local;
  }
}

export function createRobotCopy(config?: RobotCopyConfig): RobotCopy {
  return new RobotCopy(config);
}
