import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

export interface OpenTelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  endpoint: string;
  enableMetrics?: boolean;
  enableLogs?: boolean;
  samplingRate?: number;
  enableStackTraces?: boolean;
  maxStackTraceDepth?: number;
}

export interface StackTraceInfo {
  message: string;
  stack: string;
  name: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  functionName?: string;
}

export interface ErrorContext {
  error: Error;
  stackTrace: StackTraceInfo;
  context?: Record<string, any>;
  timestamp: number;
}

export class OpenTelemetryManager {
  private config: OpenTelemetryConfig;
  private isInitialized: boolean = false;
  private errorRegistry: Map<string, ErrorContext> = new Map();

  constructor(config: OpenTelemetryConfig) {
    this.config = {
      enableMetrics: true,
      enableLogs: true,
      samplingRate: 1.0,
      enableStackTraces: true,
      maxStackTraceDepth: 10,
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔧 Initializing OpenTelemetry...');
      console.log(`  📡 Service: ${this.config.serviceName}`);
      console.log(`  🌍 Environment: ${this.config.environment}`);
      console.log(`  🔗 Endpoint: ${this.config.endpoint}`);
      console.log(`  🔍 Stack Traces: ${this.config.enableStackTraces ? 'Enabled' : 'Disabled'}`);
      
      // For now, we'll use a simplified approach without the full SDK
      // This will still provide trace ID generation and basic functionality
      this.isInitialized = true;
      console.log('✅ OpenTelemetry initialized successfully (simplified mode)');
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      console.log('🔄 Shutting down OpenTelemetry...');
      this.isInitialized = false;
      console.log('✅ OpenTelemetry shutdown complete');
    } catch (error) {
      console.error('❌ Error during OpenTelemetry shutdown:', error);
    }
  }

  // Generate a new trace ID using a simple approach
  generateTraceId(): string {
    // Generate a random 32-character hex string for trace ID
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Generate a new span ID using a simple approach
  generateSpanId(): string {
    // Generate a random 16-character hex string for span ID
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  // Extract stack trace information from an Error object
  extractStackTrace(error: Error): StackTraceInfo {
    if (!this.config.enableStackTraces) {
      return {
        message: error.message,
        stack: '',
        name: error.name
      };
    }

    const stackLines = error.stack?.split('\n') || [];
    const stackTrace: StackTraceInfo = {
      message: error.message,
      stack: error.stack || '',
      name: error.name
    };

    // Parse stack trace lines to extract file and line information
    if (stackLines.length > 1) {
      // Skip the first line (error message) and parse the stack
      for (let i = 1; i < Math.min(stackLines.length, this.config.maxStackTraceDepth! + 1); i++) {
        const line = stackLines[i].trim();
        if (line.startsWith('at ')) {
          // Parse: "at FunctionName (fileName:lineNumber:columnNumber)"
          const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
          if (match) {
            stackTrace.functionName = match[1];
            stackTrace.fileName = match[2];
            stackTrace.lineNumber = parseInt(match[3]);
            stackTrace.columnNumber = parseInt(match[4]);
            break; // Get the first meaningful stack frame
          }
        }
      }
    }

    return stackTrace;
  }

  // Capture error context with stack trace
  captureError(error: Error, context?: Record<string, any>): string {
    if (!this.config.enableStackTraces) {
      return this.generateTraceId();
    }

    const traceId = this.generateTraceId();
    const stackTrace = this.extractStackTrace(error);
    
    const errorContext: ErrorContext = {
      error,
      stackTrace,
      context,
      timestamp: Date.now()
    };

    this.errorRegistry.set(traceId, errorContext);
    
    console.log(`🔍 Error captured with trace ID: ${traceId}`);
    console.log(`  📍 File: ${stackTrace.fileName}:${stackTrace.lineNumber}`);
    console.log(`  🔧 Function: ${stackTrace.functionName}`);
    console.log(`  💬 Message: ${stackTrace.message}`);
    
    return traceId;
  }

  // Get error context by trace ID
  getErrorContext(traceId: string): ErrorContext | undefined {
    return this.errorRegistry.get(traceId);
  }

  // Start a new span with enhanced error handling
  startSpan(name: string, options?: any) {
    // Create a simple span object for now
    const spanId = this.generateSpanId();
    const traceId = this.generateTraceId();
    
    // Create a proper span object with its own state
    const span = {
      name,
      traceId,
      spanId,
      attributes: {} as Record<string, any>,
      status: { code: SpanStatusCode.OK, message: '' },
      
      setAttributes: (attributes: Record<string, any>) => {
        // Store attributes on the span object
        Object.assign(span.attributes, attributes);
      },
      
      setStatus: (status: any) => {
        // Store status on the span object
        span.status = status;
      },
      
      recordException: (error: Error, attributes?: Record<string, any>) => {
        // Capture error with stack trace
        const errorTraceId = this.captureError(error, attributes);
        
        // Set error attributes on the span
        span.setAttributes({
          'error': true,
          'error.message': error.message,
          'error.type': error.name,
          'error.stack_trace_id': errorTraceId,
          'error.timestamp': new Date().toISOString()
        });

        // Also set any additional attributes passed in
        if (attributes) {
          span.setAttributes(attributes);
        }

        // Set span status to error
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        
        console.log(`🚨 Exception recorded in span: ${name} (${traceId}:${spanId})`);
        console.log(`  🔍 Error trace ID: ${errorTraceId}`);
      },
      
      end: () => {
        // End the span
        console.log(`🔍 Span ended: ${name} (${traceId}:${spanId})`);
        console.log(`  📊 Final attributes:`, span.attributes);
        console.log(`  📊 Final status:`, span.status);
      },
      
      spanContext: () => ({
        traceId,
        spanId,
        traceFlags: 1,
        isRemote: false
      })
    };
    
    return span;
  }

  // Get current trace context
  getCurrentTraceContext() {
    // For now, return a generated context
    return {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      traceFlags: 1,
      isRemote: false,
    };
  }

  // Create a trace context for HTTP requests
  createTraceContext() {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    
    return {
      traceId,
      spanId,
      headers: {
        'X-Trace-ID': traceId,
        'X-Span-ID': spanId,
        'traceparent': `00-${traceId}-${spanId}-01`,
      }
    };
  }

  // Extract trace context from HTTP headers
  extractTraceContext(headers: Record<string, string>) {
    const traceId = headers['x-trace-id'] || headers['X-Trace-ID'];
    const spanId = headers['x-span-id'] || headers['X-Span-ID'];
    const traceparent = headers['traceparent'];

    if (traceId && spanId) {
      return { traceId, spanId };
    }

    if (traceparent) {
      // Parse W3C traceparent header: 00-<trace-id>-<span-id>-<trace-flags>
      const parts = traceparent.split('-');
      if (parts.length === 4) {
        return { traceId: parts[1], spanId: parts[2] };
      }
    }

    return null;
  }

  // Get error statistics
  getErrorStats(): Record<string, any> {
    if (!this.config.enableStackTraces) {
      return { enabled: false };
    }

    const errors = Array.from(this.errorRegistry.values());
    const errorTypes = new Map<string, number>();
    const fileErrors = new Map<string, number>();

    errors.forEach(errorContext => {
      // Count error types
      const errorType = errorContext.error.name;
      errorTypes.set(errorType, (errorTypes.get(errorType) || 0) + 1);

      // Count errors by file
      if (errorContext.stackTrace.fileName) {
        fileErrors.set(errorContext.stackTrace.fileName, (fileErrors.get(errorContext.stackTrace.fileName) || 0) + 1);
      }
    });

    return {
      enabled: true,
      totalErrors: errors.length,
      errorTypes: Object.fromEntries(errorTypes),
      fileErrors: Object.fromEntries(fileErrors),
      recentErrors: errors
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
        .map(ec => ({
          message: ec.error.message,
          type: ec.error.name,
          file: ec.stackTrace.fileName,
          line: ec.stackTrace.lineNumber,
          timestamp: new Date(ec.timestamp).toISOString()
        }))
    };
  }

  // Clear error registry (useful for testing or cleanup)
  clearErrorRegistry(): void {
    this.errorRegistry.clear();
    console.log('🧹 Error registry cleared');
  }

  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  getConfig(): OpenTelemetryConfig {
    return { ...this.config };
  }
}

// Create and export a singleton instance
export const openTelemetryManager = new OpenTelemetryManager({
  serviceName: 'tome-connector-editor',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318',
  enableMetrics: true,
  enableLogs: true,
  enableStackTraces: true,
  maxStackTraceDepth: 10,
});

// Initialize OpenTelemetry when this module is imported
if (process.env.NODE_ENV !== 'test') {
  openTelemetryManager.initialize().catch(console.error);
}
