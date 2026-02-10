export interface MessageMetadata {
  messageId: string;
  traceId: string;
  spanId: string;
  timestamp: string;
  backend: 'kotlin' | 'node';
  action: string;
  data?: any;
}

export interface TraceInfo {
  traceId: string;
  messages: MessageMetadata[];
  startTime?: string;
  endTime?: string;
  backend?: 'kotlin' | 'node';
}

export class Tracing {
  private messageHistory: Map<string, MessageMetadata> = new Map();
  private traceMap: Map<string, string[]> = new Map();

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

  getFullTrace(traceId: string): TraceInfo {
    const messages = this.getTraceMessages(traceId);
    return {
      traceId,
      messages,
      startTime: messages[0]?.timestamp,
      endTime: messages[messages.length - 1]?.timestamp,
      backend: messages[0]?.backend,
    };
  }

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

  // Create tracing headers for HTTP requests
  createTracingHeaders(traceId: string, spanId: string, messageId: string, enableDataDog: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'x-trace-id': traceId,
      'x-span-id': spanId,
      'x-message-id': messageId,
    };

    if (enableDataDog) {
      headers['x-datadog-trace-id'] = traceId;
      headers['x-datadog-parent-id'] = spanId;
      headers['x-datadog-sampling-priority'] = '1';
    }

    return headers;
  }
}

export function createTracing(): Tracing {
  return new Tracing();
}
