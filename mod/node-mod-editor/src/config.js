const config = {
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost'
    },

    // Metrics service configuration
    metrics: {
        enabled: process.env.METRICS_ENABLED !== 'false',
        service: {
            // If true, metrics will be sent to a separate service
            separate: process.env.METRICS_SEPARATE_SERVICE === 'true',
            // URL of the separate metrics service (if enabled)
            url: process.env.METRICS_SERVICE_URL || 'http://localhost:3001',
            // Timeout for metrics service requests
            timeout: parseInt(process.env.METRICS_SERVICE_TIMEOUT || '5000', 10)
        },
        // DataDog configuration
        datadog: {
            enabled: process.env.DATADOG_ENABLED !== 'false',
            apiKey: process.env.DATADOG_API_KEY,
            appKey: process.env.DATADOG_APP_KEY,
            site: process.env.DATADOG_SITE || 'datadoghq.com',
            // Service name for DataDog
            service: process.env.DATADOG_SERVICE || 'state-machine-analyzer',
            // Environment tag
            env: process.env.DATADOG_ENV || 'development'
        }
    },

    // OpenTelemetry configuration
    tracing: {
        enabled: process.env.TRACING_ENABLED !== 'false',
        service: {
            // If true, tracing will be handled by a separate service
            separate: process.env.TRACING_SEPARATE_SERVICE === 'true',
            // URL of the separate tracing service (if enabled)
            url: process.env.TRACING_SERVICE_URL || 'http://localhost:3002',
            // Timeout for tracing service requests
            timeout: parseInt(process.env.TRACING_SERVICE_TIMEOUT || '5000', 10)
        },
        // OpenTelemetry configuration
        opentelemetry: {
            endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
            serviceName: process.env.OTEL_SERVICE_NAME || 'state-machine-analyzer',
            // Sampling rate (0.0 to 1.0)
            samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || '1.0')
        }
    }
};

module.exports = config; 