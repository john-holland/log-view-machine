# State Machine Tracing Integration

This document explains how our state machine system integrates with OpenTelemetry and DataDog for comprehensive tracing and monitoring.

## Overview

Our state machine implementation uses distributed tracing to provide visibility into state transitions, operations, and their relationships. This integration helps developers:

1. Understand state machine behavior
2. Debug issues across distributed systems
3. Monitor performance and bottlenecks
4. Track business metrics
5. Correlate events across services

## Tracing Architecture

### Components

1. **OpenTelemetry SDK**
   - Provides the core tracing functionality
   - Handles span creation and context propagation
   - Exports traces to configured backends

2. **DataDog Integration**
   - Receives traces from OpenTelemetry
   - Provides visualization and analysis tools
   - Enables metric correlation

3. **State Machine Tracer**
   - Creates spans for state transitions
   - Links related operations
   - Adds business context to traces

## Trace Structure

### State Machine Traces

Each state machine operation creates a trace with the following structure:

```
StateMachineOperation
├── StateTransition
│   ├── GraphQLOperation
│   │   ├── Request
│   │   └── Response
│   └── ViewModelUpdate
└── SideEffects
    └── ExternalServiceCalls
```

### Key Spans

1. **StateMachineOperation**
   - Operation name (e.g., "StartOrder", "ProcessPayment")
   - Machine ID
   - Initial state
   - Variables

2. **StateTransition**
   - From state
   - To state
   - Transition reason
   - Timestamp

3. **GraphQLOperation**
   - Query/mutation name
   - Variables
   - Response data
   - Error information

## Benefits for Developers

### 1. Debugging

- **Trace Context**: Each state transition is linked to its parent operation
- **State History**: View complete state history in chronological order
- **Error Tracking**: Identify where and why transitions fail
- **Variable Inspection**: See the data that triggered transitions

### 2. Performance Analysis

- **Transition Timing**: Measure time spent in each state
- **Operation Latency**: Track GraphQL operation performance
- **Bottleneck Detection**: Identify slow states or operations
- **Resource Usage**: Monitor memory and CPU impact

### 3. Business Insights

- **State Distribution**: Understand which states are most common
- **Transition Patterns**: Identify typical state sequences
- **Error Rates**: Track failure rates by state and operation
- **User Impact**: Correlate state machine behavior with user experience

### 4. Development Workflow

- **Trace URLs**: Share trace URLs for debugging
- **State Visualization**: View state machine graphs with timing
- **Metric Correlation**: Link traces with business metrics
- **Alert Integration**: Set up alerts based on state behavior

## Example Trace URL

```
~/statemachine/order-123/STATE:PROCESSING/service/call?query#trace-123
```

This URL provides:
- Machine ID: `order-123`
- Current State: `PROCESSING`
- Operation: `service/call`
- Trace ID: `trace-123`

## Configuration

The tracing system can be configured in two modes:

1. **Integrated Mode** (Default)
   - Tracing runs in the same process as the state machine
   - Lower latency
   - Simpler deployment

2. **Separate Service Mode**
   - Tracing runs in a dedicated service
   - Better scalability
   - Independent scaling

Configuration is managed through environment variables:

```bash
# Enable/disable tracing
TRACING_ENABLED=true

# Separate service configuration
TRACING_SEPARATE_SERVICE=true
TRACING_SERVICE_URL=http://localhost:3002

# OpenTelemetry configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=state-machine-analyzer
OTEL_SAMPLING_RATE=1.0

# DataDog configuration
DATADOG_ENABLED=true
DATADOG_API_KEY=your_api_key
DATADOG_APP_KEY=your_app_key
DATADOG_SERVICE=state-machine-analyzer
DATADOG_ENV=development
```

## Best Practices

1. **Trace Naming**
   - Use consistent naming for operations
   - Include machine ID in span names
   - Add business context to span attributes

2. **Error Handling**
   - Always include error information in spans
   - Link related error spans
   - Add error context to attributes

3. **Performance**
   - Use sampling for high-volume operations
   - Keep span attributes concise
   - Avoid expensive operations in span creation

4. **Security**
   - Never include sensitive data in spans
   - Use environment variables for configuration
   - Validate trace context

## Integration with Development Tools

### IDE Integration

- View traces directly in your IDE
- Set breakpoints based on trace data
- Inspect state machine variables

### CI/CD Integration

- Track state machine changes
- Monitor performance regressions
- Validate state transitions

### Monitoring Integration

- Set up alerts for state machine issues
- Create dashboards for key metrics
- Track business KPIs

## Conclusion

The tracing integration provides developers with powerful tools for understanding, debugging, and optimizing state machines. By following the best practices and utilizing the available features, teams can build more reliable and maintainable state machine implementations. 