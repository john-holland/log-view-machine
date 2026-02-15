# Fish Burger Backend with Unleash Toggles and OpenTelemetry Tracing

## Overview

This implementation provides a complete backend solution for the fish burger system with:
- **Unleash Feature Toggles** for switching between Kotlin and Node.js backends
- **OpenTelemetry Tracing** for full request traceability
- **DataDog Integration** for monitoring and observability
- **Message History Tracking** for debugging and audit trails

## Architecture

### Backend Components

1. **Node.js Backend** (`src/fish-burger-backend.js`)
   - Express server with XState state machine
   - OpenTelemetry instrumentation
   - Message tracking and traceability
   - RESTful API endpoints

2. **Kotlin Backend** (existing implementation)
   - Spring Boot with ViewStateMachine
   - GraphQL integration
   - Log management system

3. **RobotCopy Integration** (`log-view-machine/src/core/RobotCopy.ts`)
   - Unleash toggle management
   - Backend switching logic
   - Message tracking and history
   - Trace correlation

### Tracing Infrastructure

1. **OpenTelemetry Collector** (`otel-collector-config.yaml`)
   - Receives traces from both backends
   - Exports to Jaeger (local) and DataDog (production)
   - Processes and enriches trace data

2. **Message Tracking**
   - Unique message IDs for correlation
   - Trace ID propagation across services
   - Span ID for detailed timing
   - History metadata for debugging

## Key Features

### Unleash Toggle Management

```typescript
// RobotCopy configuration
const robotCopy = createRobotCopy({
  unleashUrl: 'http://localhost:4242/api',
  kotlinBackendUrl: 'http://localhost:8080',
  nodeBackendUrl: 'http://localhost:3001',
  enableTracing: true,
  enableDataDog: true,
});

// Check backend type
const backend = await robotCopy.getBackendType(); // 'kotlin' | 'node'
const backendUrl = await robotCopy.getBackendUrl();
```

### Message Tracing

```typescript
// Send message with tracing
const result = await robotCopy.startCooking(orderId, ingredients);
// Returns: { messageId, traceId, spanId, backend, state, context }

// Track message history
const history = robotCopy.getMessageHistory();
const trace = await robotCopy.getTrace(traceId);
```

### OpenTelemetry Integration

```javascript
// Node.js backend tracing
const span = tracer.startSpan('start_cooking_request');
span.setAttributes({
  'order.id': orderId,
  'ingredients': JSON.stringify(ingredients),
  'trace.id': traceId,
  'message.id': messageId,
});
span.end();
```

## Docker Setup

### Complete Stack

```yaml
# docker-compose.yml
services:
  fish-burger-node-backend:    # Node.js backend
  fish-burger-kotlin-backend:  # Kotlin backend
  otel-collector:              # OpenTelemetry collector
  unleash:                     # Feature toggle service
  postgres:                    # Unleash database
  redis:                       # Unleash cache
  datadog-agent:               # DataDog monitoring
  jaeger:                      # Local tracing UI
```

### Running the Stack

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f fish-burger-node-backend
```

## API Endpoints

### Node.js Backend

```
POST /api/fish-burger/start
POST /api/fish-burger/progress
POST /api/fish-burger/complete
GET  /api/trace/:traceId
GET  /api/message/:messageId
GET  /health
```

### Request Headers for Tracing

```
x-trace-id: <unique-trace-id>
x-span-id: <unique-span-id>
x-message-id: <unique-message-id>
x-datadog-trace-id: <trace-id> (if DataDog enabled)
x-datadog-parent-id: <span-id>
x-datadog-sampling-priority: 1
```

## Trace Flow

1. **Frontend Request**
   ```
   RobotCopy.generateTraceId() → traceId
   RobotCopy.generateSpanId() → spanId
   RobotCopy.generateMessageId() → messageId
   ```

2. **Backend Processing**
   ```
   Extract headers → Create OpenTelemetry span
   Process request → Update span attributes
   Send response → End span
   ```

3. **Trace Collection**
   ```
   OpenTelemetry Collector → Jaeger (local)
   OpenTelemetry Collector → DataDog (production)
   ```

4. **Message History**
   ```
   RobotCopy.trackMessage() → Local history
   RobotCopy.getTrace() → Full trace retrieval
   ```

## Unleash Toggles

### Available Toggles

- `fish-burger-kotlin-backend`: Enable Kotlin backend
- `fish-burger-node-backend`: Enable Node.js backend
- `enable-tracing`: Enable OpenTelemetry tracing
- `enable-datadog`: Enable DataDog integration

### Toggle Logic

```typescript
// RobotCopy automatically switches based on toggles
const backend = await robotCopy.getBackendType();
const tracingEnabled = await robotCopy.isEnabled('enable-tracing');
const datadogEnabled = await robotCopy.isEnabled('enable-datadog');
```

## Debugging and Monitoring

### Local Tracing (Jaeger)

1. Access Jaeger UI: `http://localhost:16686`
2. Search for traces by service: `fish-burger-backend`
3. View trace details with spans and timing

### Production Monitoring (DataDog)

1. Configure DataDog API key in environment
2. Traces automatically sent to DataDog
3. View traces in DataDog APM dashboard

### Message History

```typescript
// Get all message history
const history = robotCopy.getMessageHistory();

// Get specific trace
const trace = await robotCopy.getTrace(traceId);

// Get specific message
const message = robotCopy.getMessage(messageId);
```

## State Machine Integration

### XState with Tracing

```javascript
// Node.js backend
const fishBurgerMachine = createMachine({
  // ... state machine config
}, {
  actions: {
    logStartCooking: (context, event) => {
      const span = tracer.startSpan('start_cooking');
      span.setAttributes({
        'order.id': context.orderId,
        'message.id': event.messageId,
      });
      span.end();
    },
  },
});
```

### ViewStateMachine with RobotCopy

```typescript
// Frontend integration
robotCopy.integrateWithViewStateMachine(fishBurgerMachine);

// Automatic message handling
viewStateMachine.registerRobotCopyHandler('START_COOKING', async (message) => {
  return robotCopy.startCooking(message.data.orderId, message.data.ingredients);
});
```

## Benefits

1. **Full Traceability**: Every request is traced from frontend to backend
2. **Backend Flexibility**: Easy switching between Kotlin and Node.js
3. **Observability**: Complete visibility into system behavior
4. **Debugging**: Rich message history for troubleshooting
5. **Monitoring**: Integration with DataDog for production monitoring

## Next Steps

1. **Real Unleash Integration**: Replace simulated toggles with real Unleash API
2. **Database Persistence**: Add persistent storage for message history
3. **Metrics Collection**: Add custom metrics for business KPIs
4. **Alerting**: Configure alerts for errors and performance issues
5. **Load Testing**: Add performance testing with trace correlation

This implementation provides a solid foundation for a production-ready fish burger system with comprehensive tracing, monitoring, and feature toggle capabilities. 