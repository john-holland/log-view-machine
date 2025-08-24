#!/bin/bash

set -e

echo "🚀 Starting TomeConnector Full Stack with OpenTelemetry"
echo "=================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.opentelemetry.yml" ]; then
    echo "❌ Please run this script from the log-view-machine directory"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building TomeConnector application..."
npm run build

# Build the Docker image
echo "🐳 Building Docker image..."
docker build -t tome-connector .

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.opentelemetry.yml down

# Start the full stack
echo "🚀 Starting full stack..."
docker-compose -f docker-compose.opentelemetry.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check service health
echo "🔍 Checking service health..."
docker-compose -f docker-compose.opentelemetry.yml ps

echo ""
echo "🎉 Full Stack is Running!"
echo "=================================================="
echo "🌐 TomeConnector Server: http://localhost:3002"
echo "📊 Health Check: http://localhost:3002/health"
echo "📈 Metrics: http://localhost:3002/metrics"
echo "🔍 API: http://localhost:3002/api"
echo ""
echo "🔍 Jaeger (Tracing): http://localhost:16686"
echo "📊 Prometheus (Metrics): http://localhost:9090"
echo "📈 Grafana (Dashboards): http://localhost:3001 (admin/admin)"
echo "📡 OpenTelemetry Collector: http://localhost:4318"
echo ""
echo "📋 Useful Commands:"
echo "  View logs: npm run otel:logs"
echo "  Stop stack: npm run otel:down"
echo "  Rebuild & restart: ./start-full-stack.sh"
echo ""
echo "🛑 To stop everything, run: docker-compose -f docker-compose.opentelemetry.yml down"
echo ""
