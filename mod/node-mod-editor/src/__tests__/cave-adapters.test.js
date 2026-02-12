/**
 * Unit tests for cave adapters (unleash-cavetoggles, opentelemetry-cavemetrics).
 */
import { createUnleashCaveTogglesAdapter } from 'unleash-cavetoggles-adapter';
import { createStubOtelCaveMetricsAdapter } from 'opentelemetry-cavemetrics-adapter';

describe('unleash-cavetoggles-adapter', () => {
  it('serverless: isEnabled returns defaults', async () => {
    const adapter = createUnleashCaveTogglesAdapter({
      serverless: true,
      defaults: { a: true, b: false },
    });
    expect(await adapter.isEnabled('a')).toBe(true);
    expect(await adapter.isEnabled('b')).toBe(false);
    expect(await adapter.isEnabled('unknown')).toBe(false);
  });
});

describe('opentelemetry-cavemetrics-adapter stub', () => {
  it('init, getTracer, getMeter, shutdown', async () => {
    const adapter = createStubOtelCaveMetricsAdapter();
    await adapter.init();
    const tracer = adapter.getTracer('test');
    expect(tracer && typeof tracer.startSpan === 'function').toBe(true);
    const span = tracer.startSpan('x');
    span.end();
    const meter = adapter.getMeter('test');
    expect(meter).toBeDefined();
    await adapter.shutdown();
  });
});
