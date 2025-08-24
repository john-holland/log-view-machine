# 🚀 OpenTelemetry Quick Start Guide

## Overview

This guide will get you up and running with OpenTelemetry observability for your TomeConnector in just a few minutes!

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- Basic understanding of observability concepts

## 🚀 Quick Start

### 1. Start Everything with One Command

```bash
npm run start:otel
```

This will:
- Start OpenTelemetry Collector
- Start Jaeger for distributed tracing
- Start Prometheus for metrics
- Start Grafana for dashboards
- Start all supporting services
- Run the OpenTelemetry integration demo

### 2. Manual Start (if you prefer)

```bash
# Start OpenTelemetry infrastructure
npm run otel:up

# Wait for services to be ready (about 10 seconds)
sleep 10

# Run the demo
npm run demo:otel
```

## 🌐 Access Your Observability Stack

Once everything is running, you'll have access to:

| Service | URL | Purpose | Credentials |
|---------|-----|---------|-------------|
| **Jaeger** | http://localhost:16686 | Distributed tracing | None |
| **Grafana** | http://localhost:3001 | Metrics dashboards | admin/admin |
| **Prometheus** | http://localhost:9090 | Raw metrics | None |
| **Loki** | http://localhost:3100 | Log aggregation | None |
| **Tempo** | http://localhost:3200 | Alternative tracing | None |
| **Zipkin** | http://localhost:9411 | Alternative tracing | None |
| **Elasticsearch** | http://localhost:9200 | Search backend | None |
| **Kibana** | http://localhost:5601 | Elasticsearch UI | None |

## 📊 What You'll See

### 1. **Jaeger (Distributed Tracing)**
- Complete trace flows through your TomeConnector
- Service dependencies and call chains
- Performance bottlenecks and timing analysis
- Error propagation tracking

### 2. **Grafana (Metrics Dashboards)**
- Connection creation rates
- Response time percentiles
- Active connection counts
- API response rates
- Custom business metrics

### 3. **Prometheus (Raw Metrics)**
- All OpenTelemetry metrics
- Custom TomeConnector metrics
- System health indicators
- Performance counters

## 🔧 Configuration

### OpenTelemetry Collector
- **Config**: `otel-collector-config.yaml`
- **Ports**: 4317 (gRPC), 4318 (HTTP)
- **Features**: Automatic batching, filtering, resource attribution

### Prometheus
- **Config**: `prometheus.yml`
- **Port**: 9090
- **Scraping**: Every 15 seconds from all services

### Grafana
- **Config**: `grafana/dashboards/` and `grafana/datasources/`
- **Port**: 3001 (to avoid conflicts)
- **Pre-configured**: TomeConnector dashboard with all metrics

## 🎯 Demo Features

The OpenTelemetry integration demo will show you:

1. **Distributed Tracing**
   - Complete workflow traces
   - Span correlation across services
   - Performance timing breakdown

2. **Metrics Collection**
   - Connection creation rates
   - Response time distributions
   - Active connection gauges

3. **Structured Logging**
   - Business context correlation
   - Trace ID linking
   - Structured error reporting

4. **Health Monitoring**
   - Service health checks
   - Connection status monitoring
   - Performance degradation alerts

## 🛠️ Customization

### Add Custom Metrics
```typescript
// In your TomeConnector code
const customCounter = openTelemetry.createCounter('business.orders.total', 'Total orders processed');
customCounter.add(1, { 'customer.tier': 'premium' });
```

### Add Custom Spans
```typescript
const span = openTelemetry.startSpan('business.order.processing', {
  'business.order_id': orderId,
  'business.customer_id': customerId,
  'business.order_value': orderValue
});
// ... do work ...
span.end();
```

### Add Custom Logs
```typescript
openTelemetry.log('info', 'Order processed successfully', {
  'business.order_id': orderId,
  'business.processing_time_ms': processingTime
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the ports
   lsof -i :16686  # Jaeger
   lsof -i :3001   # Grafana
   lsof -i :9090   # Prometheus
   ```

2. **Docker Issues**
   ```bash
   # Check container status
   docker-compose -f docker-compose.opentelemetry.yml ps
   
   # Check logs
   npm run otel:logs
   ```

3. **Service Health**
   ```bash
   # Check individual services
   curl http://localhost:13133/  # OpenTelemetry Collector
   curl http://localhost:16686/  # Jaeger
   curl http://localhost:9090/   # Prometheus
   ```

### Reset Everything
```bash
# Stop and remove everything
npm run otel:down

# Remove volumes (WARNING: This deletes all data)
docker-compose -f docker-compose.opentelemetry.yml down -v

# Start fresh
npm run otel:up
```

## 📚 Next Steps

1. **Explore Jaeger**: Look at the distributed traces and understand your service flow
2. **Customize Grafana**: Modify the dashboard to show metrics important to your business
3. **Add Custom Metrics**: Instrument your business logic with custom OpenTelemetry metrics
4. **Set Up Alerts**: Configure Prometheus alerting rules for critical metrics
5. **Production Deployment**: Adapt the configuration for your production environment

## 🎉 You're Ready!

You now have a complete OpenTelemetry observability stack running with your TomeConnector! 

- **Distributed tracing** across your entire system
- **Real-time metrics** with beautiful dashboards
- **Structured logging** with full correlation
- **Health monitoring** with automatic alerting

**Welcome to enterprise-grade observability!** 🚀🔍📊
