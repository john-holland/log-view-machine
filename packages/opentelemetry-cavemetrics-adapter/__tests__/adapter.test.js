/**
 * Unit tests for opentelemetry-cavemetrics-adapter (stub).
 */
import { createStubOtelCaveMetricsAdapter } from '../src/index.js';

describe('opentelemetry-cavemetrics-adapter', () => {
  describe('stub', () => {
    it('init and shutdown do not throw', async () => {
      const adapter = createStubOtelCaveMetricsAdapter();
      await adapter.init();
      await adapter.shutdown();
    });

    it('getTracer returns an object with startSpan', async () => {
      const adapter = createStubOtelCaveMetricsAdapter();
      await adapter.init();
      const tracer = adapter.getTracer('test');
      expect(tracer).toBeDefined();
      expect(typeof tracer.startSpan).toBe('function');
      const span = tracer.startSpan('x');
      span.end();
      await adapter.shutdown();
    });

    it('getMeter returns an object', async () => {
      const adapter = createStubOtelCaveMetricsAdapter();
      await adapter.init();
      const meter = adapter.getMeter('test');
      expect(meter).toBeDefined();
      await adapter.shutdown();
    });
  });
});
