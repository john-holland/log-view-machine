/**
 * Cave adapters abstraction interfaces (contracts). JSDoc-only; no runtime behavior.
 * Implementers must return objects matching these shapes.
 */

/**
 * Feature toggles (e.g. Unleash). Used by dotcms-startup, unleash-startup, etc.
 * @typedef {Object} ToggleProvider
 * @property {(toggleName: string) => Promise<boolean>} isEnabled
 */

/**
 * OpenTelemetry metrics/tracing provider. Stub = no-op; real = OTLP exporters.
 * @typedef {Object} OtelCaveMetricsProvider
 * @property {() => Promise<void>} init
 * @property {(name: string, version?: string) => Object} getTracer - Returns a Tracer (startSpan, etc.)
 * @property {(name: string, version?: string) => Object} [getMeter] - Returns a Meter (createCounter, etc.) when metrics enabled
 * @property {() => Promise<void>} [shutdown]
 */

export const __interfacesDocOnly = true;
