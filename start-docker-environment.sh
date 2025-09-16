#!/bin/bash

# Docker Environment Startup Script
# This script starts the complete development environment with generic editor and dotCMS

set -e

echo "🚀 Starting Docker development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Wait for dotCMS
echo "⏳ Waiting for dotCMS..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:8080/api/v1/system/status > /dev/null 2>&1; then
        echo "✅ dotCMS is ready"
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ dotCMS failed to start within 60 seconds"
    docker-compose logs dotcms
    exit 1
fi

# Wait for generic editor
echo "⏳ Waiting for Generic Editor..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Generic Editor is ready"
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ Generic Editor failed to start within 30 seconds"
    docker-compose logs generic-editor
    exit 1
fi

# Run component registration
echo "📦 Registering components with dotCMS..."
docker-compose run --rm component-registrar

echo ""
echo "🎉 Docker development environment is ready!"
echo ""
echo "📊 Services:"
echo "  • Generic Editor: http://localhost:3001"
echo "  • dotCMS: http://localhost:8080"
echo "  • dotCMS Admin: http://localhost:8080/admin (admin@dotcms.com / admin)"
echo ""
echo "🔧 Useful commands:"
echo "  • View logs: docker-compose logs -f [service-name]"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart [service-name]"
echo "  • Shell access: docker-compose exec [service-name] sh"
echo ""
echo "📝 Component registration completed. Components are now available in dotCMS."
