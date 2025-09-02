import { OpenTelemetryManager, StackTraceInfo, ErrorContext } from '../opentelemetry-setup';

describe('OpenTelemetry Stack Trace Integration', () => {
  let manager: OpenTelemetryManager;

  beforeEach(() => {
    manager = new OpenTelemetryManager({
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      environment: 'test',
      endpoint: 'http://localhost:4318',
      enableStackTraces: true,
      maxStackTraceDepth: 5
    });
  });

  afterEach(async () => {
    await manager.shutdown();
  });

  describe('Stack Trace Extraction', () => {
    it('should extract stack trace information from errors', () => {
      const error = new Error('Test error message');
      error.stack = `Error: Test error message
        at TestClass.testMethod (test-file.ts:42:15)
        at Object.<anonymous> (test-spec.ts:123:45)
        at Module._compile (internal/module/cjs/loader.js:1085:30)`;

      const stackTrace = manager.extractStackTrace(error);

      expect(stackTrace.message).toBe('Test error message');
      expect(stackTrace.name).toBe('Error');
      expect(stackTrace.stack).toContain('Test error message');
      expect(stackTrace.fileName).toBe('test-file.ts');
      expect(stackTrace.lineNumber).toBe(42);
      expect(stackTrace.columnNumber).toBe(15);
      expect(stackTrace.functionName).toBe('TestClass.testMethod');
    });

    it('should handle errors without stack traces', () => {
      const error = new Error('No stack trace');
      error.stack = undefined;

      const stackTrace = manager.extractStackTrace(error);

      expect(stackTrace.message).toBe('No stack trace');
      expect(stackTrace.name).toBe('Error');
      expect(stackTrace.stack).toBe('');
      expect(stackTrace.fileName).toBeUndefined();
      expect(stackTrace.lineNumber).toBeUndefined();
    });

    it('should respect maxStackTraceDepth configuration', () => {
      const deepManager = new OpenTelemetryManager({
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        environment: 'test',
        endpoint: 'http://localhost:4318',
        enableStackTraces: true,
        maxStackTraceDepth: 2
      });

      const error = new Error('Deep stack error');
      error.stack = `Error: Deep stack error
        at Level1 (file1.ts:10:5)
        at Level2 (file2.ts:20:10)
        at Level3 (file3.ts:30:15)
        at Level4 (file4.ts:40:20)
        at Level5 (file5.ts:50:25)`;

      const stackTrace = deepManager.extractStackTrace(error);
      
      // Should only capture the first meaningful frame due to max depth
      expect(stackTrace.functionName).toBe('Level1');
      expect(stackTrace.fileName).toBe('file1.ts');
      expect(stackTrace.lineNumber).toBe(10);
    });
  });

  describe('Error Capture and Registry', () => {
    it('should capture errors and store them in registry', () => {
      const error = new Error('Captured error');
      const context = { userId: '123', operation: 'test' };

      const traceId = manager.captureError(error, context);
      const errorContext = manager.getErrorContext(traceId);

      expect(errorContext).toBeDefined();
      expect(errorContext?.error.message).toBe('Captured error');
      expect(errorContext?.context).toEqual(context);
      expect(errorContext?.timestamp).toBeGreaterThan(0);
    });

    it('should generate unique trace IDs for different errors', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');

      const traceId1 = manager.captureError(error1);
      const traceId2 = manager.captureError(error2);

      expect(traceId1).not.toBe(traceId2);
      expect(manager.getErrorContext(traceId1)).toBeDefined();
      expect(manager.getErrorContext(traceId2)).toBeDefined();
    });

    it('should return undefined for non-existent trace IDs', () => {
      const errorContext = manager.getErrorContext('non-existent-id');
      expect(errorContext).toBeUndefined();
    });
  });

  describe('Span Error Handling', () => {
    it('should create spans with error recording capability', () => {
      const span = manager.startSpan('test-span');
      
      expect(span).toBeDefined();
      expect(span.recordException).toBeDefined();
      expect(span.setAttributes).toBeDefined();
      expect(span.setStatus).toBeDefined();
      expect(span.end).toBeDefined();
    });

    it('should record exceptions in spans', () => {
      const span = manager.startSpan('error-span');
      const error = new Error('Span error');
      
      span.recordException(error, { 'custom.attr': 'value' });
      
      // The span should have error attributes set
      expect(span.attributes['error']).toBe(true);
      expect(span.attributes['error.message']).toBe('Span error');
      expect(span.attributes['error.type']).toBe('Error');
      expect(span.attributes['error.stack_trace_id']).toBeDefined();
      expect(span.attributes['custom.attr']).toBe('value');
    });

    it('should set span status to error when recording exceptions', () => {
      const span = manager.startSpan('status-span');
      const error = new Error('Status error');
      
      span.recordException(error);
      
      expect(span.status.code).toBe(2); // ERROR status
      expect(span.status.message).toBe('Status error');
    });
  });

  describe('Error Statistics', () => {
    it('should provide error statistics when stack traces are enabled', () => {
      const error1 = new Error('Type A error');
      const error2 = new Error('Type B error');
      const error3 = new Error('Type A error'); // Same type

      // Set custom stack traces for testing
      error1.stack = `Error: Type A error\n    at test (file1.ts:10:5)`;
      error2.stack = `Error: Type B error\n    at test (file2.ts:20:10)`;
      error3.stack = `Error: Type A error\n    at test (file1.ts:30:15)`;

      manager.captureError(error1);
      manager.captureError(error2);
      manager.captureError(error3);

      const stats = manager.getErrorStats();

      expect(stats.enabled).toBe(true);
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorTypes['Error']).toBe(3);
      expect(stats.fileErrors['file1.ts']).toBe(2);
      expect(stats.fileErrors['file2.ts']).toBe(1);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should return disabled stats when stack traces are disabled', () => {
      const disabledManager = new OpenTelemetryManager({
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        environment: 'test',
        endpoint: 'http://localhost:4318',
        enableStackTraces: false
      });

      const stats = disabledManager.getErrorStats();
      expect(stats.enabled).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should respect enableStackTraces configuration', () => {
      const disabledManager = new OpenTelemetryManager({
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        environment: 'test',
        endpoint: 'http://localhost:4318',
        enableStackTraces: false
      });

      const error = new Error('Test error');
      const traceId = disabledManager.captureError(error);
      
      // Should still generate a trace ID but not store error context
      expect(traceId).toBeDefined();
      expect(disabledManager.getErrorContext(traceId)).toBeUndefined();
    });

    it('should use default configuration values', () => {
      const defaultManager = new OpenTelemetryManager({
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        environment: 'test',
        endpoint: 'http://localhost:4318'
      });

      expect(defaultManager.getConfig().enableStackTraces).toBe(true);
      expect(defaultManager.getConfig().maxStackTraceDepth).toBe(10);
    });
  });

  describe('Cleanup', () => {
    it('should clear error registry', () => {
      const error = new Error('Cleanup test');
      const traceId = manager.captureError(error);
      
      expect(manager.getErrorContext(traceId)).toBeDefined();
      
      manager.clearErrorRegistry();
      
      expect(manager.getErrorContext(traceId)).toBeUndefined();
      expect(manager.getErrorStats().totalErrors).toBe(0);
    });
  });
});
