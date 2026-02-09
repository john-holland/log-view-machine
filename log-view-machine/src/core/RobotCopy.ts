import { Tracing, createTracing, MessageMetadata } from './Tracing';

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
}

export class RobotCopy {
  private config: RobotCopyConfig;
  private tracing: Tracing;
  private unleashToggles: Map<string, boolean> = new Map();
  private machines: Map<string, { machine: any; config: any; registeredAt: string }> | undefined;

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
    const messageId = this.generateMessageId();
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const backend = await this.getBackendType();
    const backendUrl = await this.getBackendUrl();

    // Track the message
    this.trackMessage(messageId, traceId, spanId, {
      backend,
      action,
      data,
    });

    // Prepare headers for tracing
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.tracing.createTracingHeaders(traceId, spanId, messageId, await this.isEnabled('enable-datadog')),
    };

    const basePath = (this.config.apiBasePath ?? '/api').replace(/\/$/, '');
    try {
      const response = await fetch(`${backendUrl}${basePath}/${action}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...data,
          messageId,
          traceId,
          spanId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Track the response
      this.trackMessage(
        `${messageId}_response`,
        traceId,
        spanId,
        {
          backend,
          action: `${action}_response`,
          data: result,
        }
      );

      return result;
    } catch (error) {
      // Track the error
      this.trackMessage(
        `${messageId}_error`,
        traceId,
        spanId,
        {
          backend,
          action: `${action}_error`,
          data: { error: error instanceof Error ? error.message : String(error) },
        }
      );

      throw error;
    }
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
    // For now, we'll just store the handler for future use
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
  }

  // Get registered machines
  getRegisteredMachines(): Map<string, any> {
    return this.machines || new Map();
  }

  // Get a specific registered machine
  getRegisteredMachine(name: string): any {
    return this.machines?.get(name);
  }
}

export function createRobotCopy(config?: RobotCopyConfig): RobotCopy {
  return new RobotCopy(config);
} 