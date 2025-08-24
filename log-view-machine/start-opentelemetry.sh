#!/bin/bash

echo "🚀 Starting OpenTelemetry Infrastructure for TomeConnector..."
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories
echo "📁 Creating configuration directories..."
mkdir -p grafana/dashboards
mkdir -p grafana/datasources

# Copy dashboard configuration
if [ -f "grafana/dashboards/tome-connector-dashboard.json" ]; then
    echo "✅ Dashboard configuration found"
else
    echo "❌ Dashboard configuration not found. Please ensure grafana/dashboards/tome-connector-dashboard.json exists."
    exit 1
fi

# Copy datasource configuration
if [ -f "grafana/datasources/datasources.yml" ]; then
    echo "✅ Datasource configuration found"
else
    echo "❌ Datasource configuration not found. Please ensure grafana/datasources/datasources.yml exists."
    exit 1
fi

# Check if OpenTelemetry config exists
if [ -f "otel-collector-config.yaml" ]; then
    echo "✅ OpenTelemetry collector configuration found"
else
    echo "❌ OpenTelemetry collector configuration not found. Please ensure otel-collector-config.yaml exists."
    exit 1
fi

# Check if Prometheus config exists
if [ -f "prometheus.yml" ]; then
    echo "✅ Prometheus configuration found"
else
    echo "❌ Prometheus configuration not found. Please ensure prometheus.yml exists."
    exit 1
fi

echo ""
echo "🐳 Starting OpenTelemetry infrastructure with Docker Compose..."
echo "=================================================="

# Start the OpenTelemetry infrastructure
docker-compose -f docker-compose.opentelemetry.yml up -d

echo ""
echo "⏳ Waiting for services to start up..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."
echo "=================================================="

# Check OpenTelemetry Collector
if curl -s http://localhost:13133/ > /dev/null 2>&1; then
    echo "✅ OpenTelemetry Collector: HEALTHY"
else
    echo "❌ OpenTelemetry Collector: UNHEALTHY"
fi

# Check Jaeger
if curl -s http://localhost:16686/ > /dev/null 2>&1; then
    echo "✅ Jaeger: HEALTHY"
else
    echo "❌ Jaeger: UNHEALTHY"
fi

# Check Prometheus
if curl -s http://localhost:9090/ > /dev/null 2>&1; then
    echo "✅ Prometheus: HEALTHY"
else
    echo "❌ Prometheus: UNHEALTHY"
fi

# Check Grafana
if curl -s http://localhost:3001/ > /dev/null 2>&1; then
    echo "✅ Grafana: HEALTHY"
else
    echo "❌ Grafana: UNHEALTHY"
fi

echo ""
echo "🌐 OpenTelemetry Infrastructure URLs:"
echo "=================================================="
echo "🔍 Jaeger (Tracing):     http://localhost:16686"
echo "📊 Prometheus (Metrics): http://localhost:9090"
echo "📈 Grafana (Dashboards): http://localhost:3001 (admin/admin)"
echo "📝 Loki (Logs):         http://localhost:3100"
echo "⏱️  Tempo (Tracing):     http://localhost:3200"
echo "🔗 Zipkin (Tracing):     http://localhost:9411"
echo "📊 Elasticsearch:        http://localhost:9200"
echo "🔍 Kibana:               http://localhost:5601"

echo ""
echo "🚀 Starting TomeConnector with OpenTelemetry integration..."
echo "=================================================="

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Start the OpenTelemetry integration demo
echo "🎯 Running OpenTelemetry integration demo..."
npm run build
node dist/examples/OpenTelemetryIntegrationExample.js

echo ""
echo "🎉 OpenTelemetry infrastructure is running!"
echo "=================================================="
echo ""
echo "💡 Next steps:"
echo "1. Open Jaeger at http://localhost:16686 to see distributed traces"
echo "2. Open Grafana at http://localhost:3001 (admin/admin) to see metrics dashboards"
echo "3. Open Prometheus at http://localhost:9090 to explore raw metrics"
echo "4. Check the console output above for demo results"
echo ""
echo "🛑 To stop everything, run: docker-compose -f docker-compose.opentelemetry.yml down"
echo ""
