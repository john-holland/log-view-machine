# 🐳 TomeConnector Docker Setup

This document explains how to run the complete TomeConnector stack using Docker, including the server and OpenTelemetry observability infrastructure.

## 🚀 Quick Start

### Option 1: One-Command Startup (Recommended)
```bash
npm run start:full
```

This will:
- Install dependencies
- Build the application
- Build the Docker image
- Start the complete stack
- Show you all the URLs

### Option 2: Manual Steps
```bash
# Install dependencies
npm install

# Build the application
npm run build

# Build Docker image
npm run docker:build

# Start the full stack
npm run docker:compose
```

## 🏗️ Architecture

The Docker setup includes:

### Core Services
- **TomeConnector Server** (`tome-connector:3000`) - Main application server
- **OpenTelemetry Collector** (`otel-collector:4317/4318`) - Telemetry data processing
- **Jaeger** (`jaeger:16686`) - Distributed tracing
- **Prometheus** (`prometheus:9090`) - Metrics collection
- **Grafana** (`grafana:3001`) - Metrics visualization

### Network
All services run on the `otel-network` bridge network for secure communication.

## 📍 Ports

| Service | Port | Description |
|---------|------|-------------|
| TomeConnector | 3000 | Main application |
| Grafana | 3001 | Metrics dashboards |
| Prometheus | 9090 | Metrics endpoint |
| Jaeger | 16686 | Tracing UI |
| OTLP HTTP | 4318 | OpenTelemetry HTTP |
| OTLP gRPC | 4317 | OpenTelemetry gRPC |

## 🔧 Configuration

### Environment Variables
The TomeConnector server uses these environment variables:

```bash
NODE_ENV=production
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_SERVICE_NAME=tome-connector
OTEL_RESOURCE_ATTRIBUTES=service.name=tome-connector,service.version=1.0.0
PORT=3000
```

### Health Checks
- **TomeConnector**: `/health` endpoint
- **OpenTelemetry Collector**: Port 13133 health check
- **Docker**: Built-in health checks for all services

## 📊 Monitoring & Observability

### Health Check
```bash
curl http://localhost:3000/health
```

### Metrics (Prometheus)
```bash
curl http://localhost:3000/metrics
```

### Tracing (Jaeger)
- Open http://localhost:16686
- Search for traces from `tome-connector` service

### Dashboards (Grafana)
- Open http://localhost:3001
- Login: `admin` / `admin`
- Pre-configured dashboards for TomeConnector metrics

## 🛠️ Development

### Local Development
```bash
# Run server locally with hot reload
npm run start:dev

# Run with OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm run start:dev
```

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using a port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Docker Issues
```bash
# Check Docker status
docker info

# Restart Docker Desktop
open --background -a Docker
```

#### Service Health
```bash
# Check all services
docker-compose -f docker-compose.opentelemetry.yml ps

# View logs
npm run otel:logs

# Check specific service logs
docker-compose -f docker-compose.opentelemetry.yml logs tome-connector
```

### Reset Everything
```bash
# Stop and remove everything
docker-compose -f docker-compose.opentelemetry.yml down -v

# Remove Docker image
docker rmi tome-connector

# Start fresh
npm run start:full
```

## 📁 File Structure

```
.
├── Dockerfile                    # Server container definition
├── docker-compose.opentelemetry.yml  # Full stack orchestration
├── start-full-stack.sh          # One-command startup script
├── src/
│   └── server.ts               # Production server entry point
├── grafana/                     # Grafana configuration
├── otel-collector-config.yaml   # OpenTelemetry configuration
└── prometheus.yml              # Prometheus configuration
```

## 🔄 Lifecycle Management

### Start Services
```bash
npm run start:full              # Full stack with build
npm run docker:compose          # Just start services
npm run otel:up                 # Start OpenTelemetry only
```

### Stop Services
```bash
npm run otel:down               # Stop all services
docker-compose -f docker-compose.opentelemetry.yml down
```

### View Logs
```bash
npm run otel:logs               # All services
docker-compose -f docker-compose.opentelemetry.yml logs -f tome-connector
```

### Rebuild & Restart
```bash
npm run start:full              # Full rebuild and restart
```

## 🚀 Production Deployment

For production, consider:

1. **Environment Variables**: Use `.env` files or Kubernetes secrets
2. **Resource Limits**: Add memory/CPU limits in docker-compose
3. **Persistent Storage**: Use named volumes for data persistence
4. **Security**: Run containers as non-root users
5. **Monitoring**: Add external monitoring (e.g., Datadog, New Relic)

## 📚 Next Steps

1. **Custom Dashboards**: Create Grafana dashboards for your specific metrics
2. **Alerting**: Set up Prometheus alerting rules
3. **Log Aggregation**: Add Loki for centralized logging
4. **Service Mesh**: Consider Istio for advanced traffic management
5. **Kubernetes**: Deploy to Kubernetes for production scaling

---

**Happy Observing! 🎉🔍📊**
