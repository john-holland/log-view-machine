# withServerState() Implementation Summary

## Overview

This implementation demonstrates the distinction between client-side and server-side state handling in ViewStateMachine:

- **`withState()`**: For client-side React components with full interactivity
- **`withServerState()`**: For server-side HTML rendering with static output
- **`CompleteOrderStateMachine`**: Dedicated state machine for order processing

## Key Concepts

### withServerState() vs withState()

#### Client State (withState)
```typescript
// Client-side state handler
viewStateMachine.withState('checkout', async ({ state, model, log, view, transition }) => {
  await log('Client checkout state', { orderId: model.orderId });
  
  view(
    <div className="checkout-form">
      <h2>Checkout Form</h2>
      <input type="text" placeholder="Name" />
      <button onClick={() => transition('COMPLETE')}>
        Complete Order
      </button>
    </div>
  );
});
```

#### Server State (withServerState)
```typescript
// Server-side state handler
viewStateMachine.withServerState('checkout', async ({ state, model, log, renderHtml, transition }) => {
  await log('Server checkout state', { orderId: model.orderId });
  
  const html = renderHtml(`
    <div class="checkout-form">
      <h2>Checkout Form</h2>
      <input type="text" placeholder="Name" value="${model.customer?.name || ''}" />
      <button onclick="completeOrder()">Complete Order</button>
    </div>
  `);
  
  return html; // Returns static HTML string
});
```

## CompleteOrderStateMachine

### Architecture

The `CompleteOrderStateMachine` provides a dedicated state machine for order processing with:

1. **Validation State**: Validates customer and order data
2. **Payment State**: Processes payment information
3. **Processing State**: Handles order completion
4. **Error State**: Manages validation and payment errors
5. **Completed State**: Final order state

### State Flow

```
validating → payment → processing → completed
     ↓         ↓         ↓
   error ←→ retry ←→ cancel
```

### Implementation

```javascript
class CompleteOrderStateMachine {
  constructor() {
    this.tracer = trace.getTracer('complete-order-state-machine');
    this.machine = this.createCompleteOrderMachine();
  }

  async processOrder(orderData, traceId = null, spanId = null) {
    const span = this.tracer.startSpan('process_order');
    
    try {
      const service = interpret(this.machine).start();
      
      // Process through states
      service.send({ type: 'VALIDATE_ORDER' });
      service.send({ type: 'PROCESS_PAYMENT' });
      service.send({ type: 'COMPLETE_ORDER' });
      
      const finalState = service.getSnapshot();
      
      return {
        success: finalState.value === 'completed',
        orderId: finalState.context.orderId,
        status: finalState.context.status,
        state: finalState.value,
        context: finalState.context,
        traceId,
      };
    } finally {
      span.end();
    }
  }
}
```

## Tome Server Integration

### Server-Side Rendering

```javascript
// Tome server with CompleteOrderStateMachine
app.post('/api/checkout/process', async (req, res) => {
  const { orderData } = req.body;
  const { traceId, spanId } = req.traceContext;
  
  const span = tracer.startSpan('process_checkout');
  
  try {
    // Use CompleteOrderStateMachine for server-side processing
    const completeOrderMachine = new CompleteOrderStateMachine();
    const result = await completeOrderMachine.processOrder(orderData, traceId, spanId);
    
    res.json({
      success: result.success,
      orderId: result.orderId,
      status: result.status,
      state: result.state,
      traceId,
    });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});
```

### API Endpoints

```javascript
// Order processing
POST /api/checkout/process
{
  "orderData": {
    "orderId": "ORDER-123",
    "customer": { "name": "John", "email": "john@example.com" },
    "items": [...],
    "total": 25.97,
    "payment": { "method": "credit" }
  }
}

// Order retry
POST /api/order/retry
{
  "orderId": "ORDER-123"
}

// Order cancellation
POST /api/order/cancel
{
  "orderId": "ORDER-123"
}
```

## Benefits

### withServerState() Benefits

1. **SEO Optimization**: Pre-rendered HTML for search engines
2. **Performance**: Faster initial page load
3. **Security**: Server-side validation and processing
4. **Accessibility**: Better screen reader support
5. **Tracing**: Full server-side traceability

### CompleteOrderStateMachine Benefits

1. **Separation of Concerns**: Dedicated order processing logic
2. **Reusability**: Can be used across different platforms
3. **Traceability**: Complete order flow tracking
4. **Error Handling**: Comprehensive error states
5. **Extensibility**: Easy to add new order states

### Platform Reusability

The `withServerState()` approach makes tomes reusable across:

1. **Node.js Servers**: Full server-side rendering
2. **React Native**: Client-side with server state simulation
3. **Web Browsers**: Client-side with server API calls
4. **Desktop Apps**: Hybrid approach

## Usage Examples

### Server-Side Rendering

```javascript
// Server-side checkout page
app.get('/checkout', async (req, res) => {
  const { traceId } = req.traceContext;
  
  // Use withServerState for static HTML generation
  const html = await viewStateMachine.executeServerState('checkout', {
    orderId: 'ORDER-123',
    customer: { name: 'John', email: 'john@example.com' },
    items: [...],
    total: 25.97,
  });
  
  res.send(html);
});
```

### Client-Side Integration

```javascript
// Client-side cart with server state awareness
const handleProceedToCheckout = async () => {
  const traceId = robotCopy.generateTraceId();
  
  // Navigate to SSR checkout page
  window.open(`/checkout?traceId=${traceId}`, '_blank');
  
  // Track the transition
  send({
    type: 'PROCEED_TO_CHECKOUT',
    data: { traceId },
  });
};
```

## Tracing Integration

### Server-Side Tracing

```javascript
// CompleteOrderStateMachine with tracing
const span = this.tracer.startSpan('validate_order');
span.setAttributes({
  'order.id': context.orderId,
  'customer.email': context.customer?.email,
  'items.count': context.items?.length || 0,
  'total.amount': context.total,
  'trace.id': context.traceId,
});

// Process validation
if (errors.length > 0) {
  span.setStatus({ code: SpanStatusCode.ERROR, message: 'Validation failed' });
  span.setAttributes({ 'validation.errors': JSON.stringify(errors) });
} else {
  span.setAttributes({ 'validation.status': 'passed' });
}

span.end();
```

### Trace Flow

1. **Client Request** → Generate trace ID
2. **Server Processing** → CompleteOrderStateMachine
3. **State Transitions** → Validation → Payment → Completion
4. **HTML Generation** → withServerState() rendering
5. **Response** → Return HTML with trace correlation

## Cross-Platform Support

### Node.js Server
```javascript
// Full server-side rendering
viewStateMachine.withServerState('checkout', async (context) => {
  return context.renderHtml(`<div>Server HTML</div>`);
});
```

### React Native
```javascript
// Client-side with server state simulation
viewStateMachine.withState('checkout', async (context) => {
  // Simulate server state in mobile app
  const serverHtml = await fetch('/api/checkout/html');
  context.view(<ServerStateView html={serverHtml} />);
});
```

### Web Browser
```javascript
// Hybrid approach
viewStateMachine.withState('checkout', async (context) => {
  // Client-side React component
  context.view(<CheckoutForm />);
  
  // Server state for SEO
  if (typeof window === 'undefined') {
    return context.renderHtml(`<div>Server HTML</div>`);
  }
});
```

## Future Enhancements

1. **Database Integration**: Persistent order state
2. **Payment Processing**: Real payment gateway integration
3. **Email Notifications**: Order confirmation emails
4. **Inventory Management**: Stock level checking
5. **Analytics**: Order flow analytics

This implementation provides a solid foundation for cross-platform state management with clear separation between client and server rendering approaches. 