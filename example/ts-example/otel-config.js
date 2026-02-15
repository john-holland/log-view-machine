const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Configure the SDK
const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'fishburger-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
    }),
    traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
    }),
    instrumentations: [
        getNodeAutoInstrumentations({
            // Enable all instrumentations
            '@opentelemetry/instrumentation-http': {
                enabled: true,
                ignoreIncomingRequestHook: (request) => {
                    // Ignore health check endpoints
                    return request.url?.includes('/health');
                }
            },
            '@opentelemetry/instrumentation-express': {
                enabled: true
            },
            '@opentelemetry/instrumentation-graphql': {
                enabled: true,
                // Add custom attributes to GraphQL spans
                ignoreTrivialResolveSpans: true,
                mergeItems: true
            },
            '@opentelemetry/instrumentation-pg': {
                enabled: true
            }
        })
    ]
});

// Initialize the SDK
sdk.start()
    .then(() => {
        console.log('Tracing initialized');
    })
    .catch((error) => {
        console.log('Error initializing tracing', error);
    });

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error))
        .finally(() => process.exit(0));
}); 