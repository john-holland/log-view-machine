import { ViewStateMachine } from './ViewStateMachine';

export interface RobotCopyConfig {
  unleashUrl?: string;
  unleashClientKey?: string;
  unleashAppName?: string;
  unleashEnvironment?: string;
  kotlinBackendUrl?: string;
  nodeBackendUrl?: string;
  enableTracing?: boolean;
  enableDataDog?: boolean;
}

export interface MessageMetadata {
  messageId: string;
  traceId: string;
  spanId: string;
  timestamp: string;
  backend: 'kotlin' | 'node';
  action: string;
  data?: any;
}

export class RobotCopy {
  private config: RobotCopyConfig;
  private messageHistory: Map<string, MessageMetadata> = new Map();
  private traceMap: Map<string, string[]> = new Map();
  private unleashToggles: Map<string, boolean> = new Map();

  constructor(config: RobotCopyConfig = {}) {
    this.config = {
      unleashUrl: 'http://localhost:4242/api',
      unleashClientKey: 'default:development.unleash-insecure-api-token',
      unleashAppName: 'fish-burger-frontend',
      unleashEnvironment: 'development',
      kotlinBackendUrl: 'http://localhost:8080',
      nodeBackendUrl: 'http://localhost:3001',
      enableTracing: true,
      enableDataDog: true,
      ...config,
    };

    this.initializeUnleashToggles();
  }

  private async initializeUnleashToggles() {
    // Simulate Unleash toggle initialization
    // In real implementation, this would fetch from Unleash API
    this.unleashToggles.set('fish-burger-kotlin-backend', false);
    this.unleashToggles.set('fish-burger-node-backend', true);
    this.unleashToggles.set('enable-tracing', true);
    this.unleashToggles.set('enable-datadog', true);
  }

  async isEnabled(toggleName: string, context: any = {}): Promise<boolean> {
    return this.unleashToggles.get(toggleName) || false;
  }

  async getBackendUrl(): Promise<string> {
    const useKotlin = await this.isEnabled('fish-burger-kotlin-backend');
    return useKotlin ? this.config.kotlinBackendUrl! : this.config.nodeBackendUrl!;
  }

  async getBackendType(): Promise<'kotlin' | 'node'> {
    const useKotlin = await this.isEnabled('fish-burger-kotlin-backend');
    return useKotlin ? 'kotlin' : 'node';
  }

  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackMessage(messageId: string, traceId: string, spanId: string, metadata: Partial<MessageMetadata>): MessageMetadata {
    const message: MessageMetadata = {
      messageId,
      traceId,
      spanId,
      timestamp: new Date().toISOString(),
      backend: metadata.backend || 'node',
      action: metadata.action || 'unknown',
      data: metadata.data,
    };

    this.messageHistory.set(messageId, message);

    if (!this.traceMap.has(traceId)) {
      this.traceMap.set(traceId, []);
    }
    this.traceMap.get(traceId)!.push(messageId);

    return message;
  }

  getMessage(messageId: string): MessageMetadata | undefined {
    return this.messageHistory.get(messageId);
  }

  getTraceMessages(traceId: string): MessageMetadata[] {
    const messageIds = this.traceMap.get(traceId) || [];
    return messageIds.map(id => this.messageHistory.get(id)).filter(Boolean) as MessageMetadata[];
  }

  getFullTrace(traceId: string) {
    const messages = this.getTraceMessages(traceId);
    return {
      traceId,
      messages,
      startTime: messages[0]?.timestamp,
      endTime: messages[messages.length - 1]?.timestamp,
      backend: messages[0]?.backend,
    };
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
      'x-trace-id': traceId,
      'x-span-id': spanId,
      'x-message-id': messageId,
    };

    // Add DataDog headers if enabled
    if (await this.isEnabled('enable-datadog')) {
      headers['x-datadog-trace-id'] = traceId;
      headers['x-datadog-parent-id'] = spanId;
      headers['x-datadog-sampling-priority'] = '1';
    }

    try {
      const response = await fetch(`${backendUrl}/api/fish-burger/${action}`, {
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

  async startCooking(orderId: string, ingredients: string[]): Promise<any> {
    return this.sendMessage('start', { orderId, ingredients });
  }

  async updateProgress(orderId: string, cookingTime: number, temperature: number): Promise<any> {
    return this.sendMessage('progress', { orderId, cookingTime, temperature });
  }

  async completeCooking(orderId: string): Promise<any> {
    return this.sendMessage('complete', { orderId });
  }

  async getTrace(traceId: string): Promise<any> {
    const backend = await this.getBackendType();
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
    const backend = await this.getBackendType();
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

  // Integration with ViewStateMachine
  integrateWithViewStateMachine(viewStateMachine: ViewStateMachine<any>): RobotCopy {
    // Register message handlers for ViewStateMachine
    viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message) => {
      return this.startCooking(message.data.orderId, message.data.ingredients);
    });

    viewStateMachine.registerRobotCopyHandler('UPDATE_PROGRESS', async (message) => {
      return this.updateProgress(message.data.orderId, message.data.cookingTime, message.data.temperature);
    });

    viewStateMachine.registerRobotCopyHandler('COMPLETE_COOKING', async (message) => {
      return this.completeCooking(message.data.orderId);
    });

    return this;
  }

  // Debugging and monitoring methods
  getMessageHistory(): MessageMetadata[] {
    return Array.from(this.messageHistory.values());
  }

  getTraceIds(): string[] {
    return Array.from(this.traceMap.keys());
  }

  clearHistory(): void {
    this.messageHistory.clear();
    this.traceMap.clear();
  }

  // Configuration methods
  updateConfig(newConfig: Partial<RobotCopyConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RobotCopyConfig {
    return { ...this.config };
  }
}

export function createRobotCopy(config?: RobotCopyConfig): RobotCopy {
  return new RobotCopy(config);
} 