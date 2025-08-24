# TomeConnector Proxy Pattern with RobotCopy API Routing

## Overview

Yes, you're absolutely right! We can use a copy of RobotCopy in a proxy machine to create a clean API layer that's properly routed. This pattern provides excellent separation of concerns and gives us a clean, RESTful API interface while maintaining all the RobotCopy benefits.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP/REST API
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              TomeConnectorHTTPServer                           │
│  - HTTP server wrapper                                         │
│  - CORS, rate limiting, logging                               │
│  - Convenience methods for common operations                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ API calls
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              TomeConnectorProxy                                │
│  - API routing and validation                                  │
│  - Request/response handling                                   │
│  - Metrics collection                                          │
│  - Health monitoring                                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Direct calls
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              TomeConnector                                     │
│  - Core connection management                                  │
│  - Network topology                                            │
│  - Event routing                                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │ RobotCopy integration
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              RobotCopy                                          │
│  - Feature toggles                                             │
│  - Tracing and observability                                   │
│  - Backend communication                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Benefits of This Pattern

### 1. **Clean Separation of Concerns**
- **HTTP Server**: Handles HTTP concerns (CORS, rate limiting, logging)
- **Proxy**: Manages API routing, validation, and response formatting
- **TomeConnector**: Focuses on core connection management
- **RobotCopy**: Provides infrastructure services (tracing, toggles, etc.)

### 2. **Flexible RobotCopy Usage**
- Each proxy can have its own RobotCopy instance
- Different configurations for different use cases
- Isolated tracing and feature toggle contexts
- Independent health monitoring and metrics

### 3. **Clean API Interface**
- RESTful endpoints for all operations
- Consistent response format with tracing
- Built-in error handling and validation
- Convenience methods for common operations

### 4. **Production Ready Features**
- Health checks and metrics collection
- Rate limiting and CORS support
- Comprehensive logging and monitoring
- Graceful error handling and cleanup

## API Endpoints

### **Connection Management**
```
POST   /api/connections          - Create a new connection
GET    /api/connections          - List all connections
GET    /api/connections/:id      - Get connection details
DELETE /api/connections/:id      - Delete a connection
```

### **Network Topology**
```
GET    /api/topology            - Get network topology
POST   /api/networks/ring       - Create ring network
POST   /api/networks/hub        - Create hub-and-spoke network
```

### **Operations**
```
POST   /api/broadcast           - Broadcast event to network
POST   /api/validate            - Validate network configuration
```

### **Monitoring**
```
GET    /api/health              - Get system health status
GET    /api/metrics             - Get system metrics
```

## Usage Examples

### **Basic Setup**
```typescript
import { createTomeConnectorProxy } from './TomeConnectorProxy';
import { createTomeConnectorHTTPServer } from './TomeConnectorHTTPServer';
import { createRobotCopy } from './RobotCopy';

// Create RobotCopy instance for this proxy
const robotCopy = createRobotCopy({
  enableTracing: true,
  enableDataDog: true
});

// Create the proxy with RobotCopy
const proxy = createTomeConnectorProxy({
  robotCopy,
  enableHealthChecks: true,
  enableMetrics: true
});

// Create HTTP server that uses the proxy
const httpServer = createTomeConnectorHTTPServer({
  robotCopy,
  port: 3000,
  enableCORS: true
});
```

### **Direct Proxy Usage**
```typescript
// Create connection via proxy
const response = await proxy.handleAPIRequest({
  method: 'POST',
  path: '/connections',
  body: {
    sourceTome: orderService,
    targetTome: paymentService,
    config: { bidirectional: true, enableTracing: true }
  }
});

if (response.success) {
  console.log('Connection created:', response.data.connectionId);
  console.log('Trace ID:', response.traceId);
}
```

### **HTTP API Usage**
```typescript
// Use HTTP server convenience methods
const connectionId = await httpServer.createConnection(
  orderService, 
  paymentService,
  { bidirectional: true }
);

const topology = await httpServer.getTopology();
const health = await httpServer.getHealth();
```

### **RobotCopy Integration**
```typescript
// Check feature toggles
const enableTracing = await robotCopy.isEnabled('enable-tracing');

// Generate trace context
const traceId = robotCopy.generateTraceId();
const spanId = robotCopy.generateSpanId();

// Track custom messages
robotCopy.trackMessage('api-call', traceId, spanId, {
  action: 'connection_created',
  data: { source: 'order-service', target: 'payment-service' }
});
```

## Configuration Options

### **Proxy Configuration**
```typescript
interface TomeConnectorProxyConfig {
  robotCopy?: RobotCopy;           // RobotCopy instance
  apiPort?: number;                // API port (default: 3000)
  enableHealthChecks?: boolean;    // Enable health monitoring
  enableMetrics?: boolean;         // Enable metrics collection
  cors?: {                         // CORS configuration
    origin: string | string[];
    credentials?: boolean;
  };
  rateLimiting?: {                 // Rate limiting
    windowMs: number;
    maxRequests: number;
  };
}
```

### **HTTP Server Configuration**
```typescript
interface HTTPServerConfig {
  port?: number;                   // Server port
  host?: string;                   // Server host
  enableCORS?: boolean;            // Enable CORS
  enableRateLimiting?: boolean;    // Enable rate limiting
  enableLogging?: boolean;         // Enable request logging
  robotCopy?: RobotCopy;           // RobotCopy instance
}
```

## Advanced Features

### **1. Multiple Proxy Instances**
```typescript
// Different proxies for different purposes
const orderProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ enableTracing: true })
});

const paymentProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ enableDataDog: true })
});

const inventoryProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ enableHealthChecks: true })
});
```

### **2. Custom API Routes**
```typescript
// Extend the proxy with custom routes
class CustomTomeConnectorProxy extends TomeConnectorProxy {
  private setupCustomAPIRoutes(): void {
    this.apiRoutes.set('POST /custom/operation', this.handleCustomOperation.bind(this));
  }
  
  private async handleCustomOperation(req: APIRequest): Promise<APIResponse> {
    // Custom logic here
  }
}
```

### **3. Middleware Integration**
```typescript
// In a real Express implementation, you'd add middleware
app.use('/api', (req, res, next) => {
  // Extract trace context from headers
  req.traceId = req.headers['x-trace-id'];
  req.spanId = req.headers['x-span-id'];
  next();
});

app.post('/api/connections', async (req, res) => {
  const response = await proxy.handleAPIRequest({
    method: 'POST',
    path: '/connections',
    body: req.body,
    traceId: req.traceId,
    spanId: req.spanId
  });
  
  res.json(response);
});
```

## Benefits Over Direct Usage

### **1. API Standardization**
- Consistent response format across all operations
- Built-in error handling and validation
- Standard HTTP status codes and error messages

### **2. Observability**
- Every API call gets tracing context
- Built-in metrics collection
- Health monitoring and alerting

### **3. Flexibility**
- Easy to add new endpoints
- Simple to modify response formats
- Can add custom middleware and validation

### **4. Production Features**
- Rate limiting and CORS support
- Comprehensive logging
- Health checks and monitoring
- Graceful error handling

## Real-World Use Cases

### **1. Microservices Architecture**
```typescript
// Each service has its own proxy
const orderServiceProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ unleashAppName: 'order-service' })
});

const paymentServiceProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ unleashAppName: 'payment-service' })
});
```

### **2. Multi-Tenant Systems**
```typescript
// Different proxies for different tenants
const tenant1Proxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ unleashEnvironment: 'tenant1' })
});

const tenant2Proxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ unleashEnvironment: 'tenant2' })
});
```

### **3. Development vs Production**
```typescript
// Development proxy with full tracing
const devProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ 
    enableTracing: true,
    enableDataDog: false 
  })
});

// Production proxy with limited tracing
const prodProxy = createTomeConnectorProxy({
  robotCopy: createRobotCopy({ 
    enableTracing: false,
    enableDataDog: true 
  })
});
```

## Conclusion

The proxy pattern with RobotCopy provides an excellent way to create a clean, maintainable API layer for TomeConnector operations. It gives us:

- **Clean Architecture**: Clear separation between HTTP, API, and core logic
- **Flexibility**: Easy to customize and extend for different use cases
- **Observability**: Full tracing and monitoring integration
- **Production Ready**: Built-in features for production deployment
- **Maintainability**: Easy to test, debug, and modify

This approach allows you to use RobotCopy's capabilities (feature toggles, tracing, health monitoring) while providing a clean REST API interface that's easy for clients to consume and integrate with.
