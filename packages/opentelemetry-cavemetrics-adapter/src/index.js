/**
 * OpenTelemetry Cave Metrics Adapter (OtelCaveMetricsProvider).
 * Stub: no-op tracer/meter. Real: OTLP trace (and optional metrics) export.
 */

import { trace, metrics } from '@opentelemetry/api';

/**
 * Create a stub adapter: init/shutdown no-op; getTracer/getMeter return API no-ops (no provider registered).
 * @returns {{ init(): Promise<void>, getTracer(name: string, version?: string): Object, getMeter(name: string, version?: string): Object, shutdown(): Promise<void> }}
 */
export function createStubOtelCaveMetricsAdapter() {
  return {
    async init() {},
    getTracer(name, version) {
      return trace.getTracer(name || 'stub', version);
    },
    getMeter(name, version) {
      return metrics.getMeter(name || 'stub', version);
    },
    async shutdown() {},
  };
}

/**
 * Create real OTEL adapter when endpoint and serviceName are set; otherwise returns stub shape.
 * @param {{
 *   endpoint?: string,
 *   serviceName?: string,
 *   serviceVersion?: string,
 *   metricsEndpoint?: string,
 *   enableTracing?: boolean,
 *   enableMetrics?: boolean,
 *   logger?: { info?: (m: string) => void, error?: (m: string) => void },
 *   instrumentations?: Array<import('@opentelemetry/instrumentation').Instrumentation>
 * }} options
 * @returns {{ init(): Promise<void>, getTracer(name: string, version?: string): Object, getMeter(name: string, version?: string): Object, shutdown(): Promise<void> }}
 */
export function createOtelCaveMetricsAdapter(options = {}) {
  const endpoint = (options.endpoint || '').trim();
  const serviceName = (options.serviceName || '').trim();
  const enableTracing = options.enableTracing !== false;
  const enableMetrics = options.enableMetrics === true;
  const metricsEndpoint = (options.metricsEndpoint || '').trim();
  const log = options.logger?.info ? (m) => options.logger.info(m) : () => {};
  const logError = options.logger?.error ? (m) => options.logger.error(m) : () => {};

  if (!endpoint || !serviceName) {
    log('[opentelemetry-cavemetrics-adapter] endpoint or serviceName missing; using stub');
    return createStubOtelCaveMetricsAdapter();
  }

  let tracerProvider = null;
  let meterProvider = null;
  let registered = false;

  async function init() {
    if (registered) return;
    try {
      const { NodeTracerProvider } = await import('@opentelemetry/sdk-trace-node');
      const { BatchSpanProcessor } = await import('@opentelemetry/sdk-trace-base');
      const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
      const { Resource } = await import('@opentelemetry/resources');
      const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
        ...(options.serviceVersion && { [SemanticResourceAttributes.SERVICE_VERSION]: options.serviceVersion }),
      });

      tracerProvider = new NodeTracerProvider({ resource });
      const traceExporter = new OTLPTraceExporter({ url: endpoint });
      tracerProvider.addSpanProcessor(new BatchSpanProcessor(traceExporter));
      tracerProvider.register();
      registered = true;
      log('[opentelemetry-cavemetrics-adapter] tracing registered');

      if (enableMetrics && metricsEndpoint) {
        try {
          const { MeterProvider } = await import('@opentelemetry/sdk-metrics');
          const { OTLPMetricExporter } = await import('@opentelemetry/exporter-metrics-otlp-http');
          const { PeriodicExportingMetricReader } = await import('@opentelemetry/sdk-metrics');
          meterProvider = new MeterProvider({ resource });
          const metricExporter = new OTLPMetricExporter({ url: metricsEndpoint });
          meterProvider.addMetricReader(new PeriodicExportingMetricReader({ exporter: metricExporter }));
          metrics.setGlobalMeterProvider(meterProvider);
          log('[opentelemetry-cavemetrics-adapter] metrics registered');
        } catch (e) {
          logError('[opentelemetry-cavemetrics-adapter] metrics init failed: ' + (e?.message || e));
        }
      }

      if (Array.isArray(options.instrumentations) && options.instrumentations.length > 0) {
        const { registerInstrumentations } = await import('@opentelemetry/instrumentation');
        registerInstrumentations({ instrumentations: options.instrumentations });
        log('[opentelemetry-cavemetrics-adapter] instrumentations registered');
      }
    } catch (err) {
      logError('[opentelemetry-cavemetrics-adapter] init failed: ' + (err?.message || err));
      throw err;
    }
  }

  function getTracer(name, version) {
    return trace.getTracer(name || serviceName, version || options.serviceVersion);
  }

  function getMeter(name, version) {
    return metrics.getMeter(name || serviceName, version || options.serviceVersion);
  }

  async function shutdown() {
    if (tracerProvider && typeof tracerProvider.shutdown === 'function') {
      await tracerProvider.shutdown();
    }
    if (meterProvider && typeof meterProvider.shutdown === 'function') {
      await meterProvider.shutdown();
    }
  }

  return { init, getTracer, getMeter, shutdown };
}

export default { createStubOtelCaveMetricsAdapter, createOtelCaveMetricsAdapter };
