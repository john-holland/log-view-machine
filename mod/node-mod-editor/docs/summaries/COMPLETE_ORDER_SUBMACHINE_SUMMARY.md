# CompleteOrderStateMachine Sub-Machine Refactor

## Overview

The `CompleteOrderStateMachine` has been refactored to be a reusable sub-machine that can be called from other state machines using the `subMachine()` function and state routing.

## Architecture

### 1. **Sub-Machine Creation**
```typescript
// Create the CompleteOrderStateMachine as a reusable sub-machine
export const createCompleteOrderStateMachine = () => {
  return createViewStateMachine({
    machineId: 'complete-order-submachine',
    xstateConfig: {
      id: 'completeOrder',
      initial: 'validating',
      context: {
        orderId: null,
        customer: null,
        items: [],
        total: 0,
        payment: null,
        status: 'pending',
        validationErrors: [],
        paymentErrors: [],
        traceId: null,
        spanId: null,
        parentMachineId: null, // Track which machine called this sub-machine
      },
      states: {
        validating: { /* ... */ },
        payment: { /* ... */ },
        processing: { /* ... */ },
        completed: { type: 'final' }, // Final state
        error: { /* ... */ },
        cancelled: { type: 'final' }, // Final state
      },
    },
    logStates: {
      // Each state uses the beautiful view(...) pattern
      validating: async ({ state, model, log, view, transition, subMachine }) => {
        await log('Validating order', { orderId: model.orderId });
        
        if (errors.length > 0) {
          view(
            <div className="validation-error">
              <h3>❌ Order Validation Failed</h3>
              {/* Error UI */}
            </div>
          );
        } else {
          view(
            <div className="validation-success">
              <h3>✅ Order Validation Passed</h3>
              {/* Success UI */}
            </div>
          );
        }
      },
      // ... other states
    },
  });
};
```

### 2. **Main State Machine Integration**
```typescript
// Main state machine that uses CompleteOrderStateMachine as a sub-machine
const mainOrderMachine = createViewStateMachine({
  machineId: 'main-order-machine',
  xstateConfig: {
    id: 'mainOrder',
    initial: 'browsing',
    context: {
      currentPage: 'browsing',
      cartItems: [],
      orderData: null,
      completeOrderResult: null,
      traceId: null,
    },
    states: {
      browsing: { /* ... */ },
      checkout: { /* ... */ },
      orderProcessing: { /* ... */ }, // Uses sub-machine here
      orderCompleted: { /* ... */ },
      orderCancelled: { /* ... */ },
      orderError: { /* ... */ },
    },
  },
  logStates: {
    orderProcessing: async ({ state, model, log, view, transition, subMachine }) => {
      await log('Processing order with sub-machine', {
        orderData: model.orderData,
        traceId: model.traceId,
      });

      // Create and use the CompleteOrderStateMachine as a sub-machine
      const completeOrderMachine = subMachine('completeOrder', createCompleteOrderStateMachine());
      
      if (completeOrderMachine) {
        // Initialize the sub-machine with order data
        completeOrderMachine.send({
          type: 'SET_CONTEXT',
          data: {
            ...model.orderData,
            parentMachineId: 'main-order-machine',
            traceId: model.traceId,
          },
        });

        // Start the order processing
        completeOrderMachine.send({ type: 'VALIDATE_ORDER' });

        view(
          <div className="order-processing-state">
            <h3>🔄 Processing Order</h3>
            <p>Using CompleteOrderStateMachine sub-machine...</p>
            <div className="sub-machine-view">
              {/* The sub-machine renders its own view */}
              {completeOrderMachine.render(model.orderData)}
            </div>
          </div>
        );
      }
    },
    // ... other states
  },
});
```

## State Flow

### **Main Machine States**
```
browsing → checkout → orderProcessing → orderCompleted
    ↓         ↓           ↓              ↓
    ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

### **Sub-Machine States**
```
validating → payment → processing → completed
    ↓         ↓         ↓
   error ←→ retry ←→ cancel
```

### **Integration Points**
1. **Main Machine**: `orderProcessing` state
2. **Sub-Machine**: `validating` → `payment` → `processing` → `completed`
3. **State Routing**: Main machine routes to sub-machine, then back

## Key Features

### 1. **Sub-Machine Creation**
```typescript
// Create reusable sub-machine
export const createCompleteOrderStateMachine = () => {
  return createViewStateMachine({ /* config */ });
};
```

### 2. **Sub-Machine Integration**
```typescript
// Use sub-machine in main machine
const completeOrderMachine = subMachine('completeOrder', createCompleteOrderStateMachine());
```

### 3. **State Routing**
```typescript
// Route to sub-machine
completeOrderMachine.send({ type: 'VALIDATE_ORDER' });

// Handle sub-machine completion
if (completeOrderMachine.state === 'completed') {
  transition('ORDER_COMPLETED');
}
```

### 4. **View Composition**
```typescript
// Main machine view with sub-machine view embedded
view(
  <div className="order-processing-state">
    <h3>🔄 Processing Order</h3>
    <div className="sub-machine-view">
      {completeOrderMachine.render(model.orderData)}
    </div>
  </div>
);
```

## Benefits

### 1. **Reusability**
- Sub-machine can be used in multiple parent machines
- Consistent order processing logic across applications
- Easy to test and maintain

### 2. **Composability**
- Main machine focuses on high-level flow
- Sub-machine handles detailed order processing
- Clear separation of concerns

### 3. **State Isolation**
- Sub-machine has its own state and context
- Parent machine can observe sub-machine state
- Clean state transitions between machines

### 4. **View Composition**
- Sub-machine renders its own UI
- Parent machine can wrap sub-machine UI
- Rich, interactive user experience

## Usage Examples

### **Basic Integration**
```typescript
// In any state machine
const orderMachine = subMachine('order', createCompleteOrderStateMachine());
orderMachine.send({ type: 'VALIDATE_ORDER' });
```

### **With Custom Data**
```typescript
// Pass custom order data
orderMachine.send({
  type: 'SET_CONTEXT',
  data: {
    orderId: 'ORDER-123',
    customer: { name: 'John', email: 'john@example.com' },
    items: [{ name: 'Fish Burger', price: 12.99 }],
    payment: { method: 'credit' },
    parentMachineId: 'my-app',
    traceId: 'trace-123',
  },
});
```

### **State Observation**
```typescript
// Observe sub-machine state
if (orderMachine.state === 'completed') {
  // Handle completion
  transition('ORDER_COMPLETED');
} else if (orderMachine.state === 'error') {
  // Handle error
  transition('ORDER_ERROR');
}
```

### **View Rendering**
```typescript
// Render sub-machine view
view(
  <div className="order-container">
    <h2>Order Processing</h2>
    {orderMachine.render(orderData)}
  </div>
);
```

## Advanced Patterns

### 1. **Multiple Sub-Machines**
```typescript
const paymentMachine = subMachine('payment', createPaymentStateMachine());
const inventoryMachine = subMachine('inventory', createInventoryStateMachine());
const orderMachine = subMachine('order', createCompleteOrderStateMachine());
```

### 2. **Sub-Machine Communication**
```typescript
// Sub-machines can communicate through parent
paymentMachine.send({ type: 'PROCESS_PAYMENT', data: { amount: 25.99 } });
inventoryMachine.send({ type: 'CHECK_STOCK', data: { itemId: 'fish-burger' } });
```

### 3. **Conditional Sub-Machines**
```typescript
if (model.paymentMethod === 'credit') {
  const creditMachine = subMachine('credit', createCreditCardMachine());
} else if (model.paymentMethod === 'paypal') {
  const paypalMachine = subMachine('paypal', createPayPalMachine());
}
```

## Error Handling

### **Sub-Machine Errors**
```typescript
if (orderMachine.state === 'error') {
  // Handle sub-machine error
  view(
    <div className="error-state">
      <h3>❌ Order Processing Error</h3>
      <button onClick={() => orderMachine.send({ type: 'RETRY' })}>
        Retry Order
      </button>
    </div>
  );
}
```

### **Parent Machine Error Handling**
```typescript
orderError: async ({ state, model, log, view, transition }) => {
  view(
    <div className="order-error-state">
      <h3>❌ Order Processing Error</h3>
      <div className="actions">
        <button onClick={() => transition('RETRY_ORDER')}>
          Retry Order
        </button>
        <button onClick={() => transition('CANCEL_ORDER')}>
          Cancel Order
        </button>
      </div>
    </div>
  );
}
```

## Tracing Integration

### **Sub-Machine Tracing**
```typescript
// Sub-machine includes tracing context
completeOrderMachine.send({
  type: 'SET_CONTEXT',
  data: {
    ...orderData,
    traceId: robotCopy.generateTraceId(),
    spanId: robotCopy.generateSpanId(),
    parentMachineId: 'main-order-machine',
  },
});
```

### **Cross-Machine Tracing**
```typescript
// Parent and sub-machines share trace context
await log('Processing order with sub-machine', {
  orderData: model.orderData,
  traceId: model.traceId,
  subMachineId: 'completeOrder',
});
```

This refactored architecture provides a powerful, composable, and reusable approach to state machine design, where complex business logic can be encapsulated in sub-machines while maintaining clear state routing and view composition. 