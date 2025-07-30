const express = require('express');
const { createMachine, interpret } = require('xstate');
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { v4: uuidv4 } = require('uuid');

// Initialize OpenTelemetry
const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'fish-burger-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
});

provider.addSpanProcessor(
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    })
  )
);

provider.register();

registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

const tracer = trace.getTracer('fish-burger-backend');

// Fish Burger State Machine
const fishBurgerMachine = createMachine({
  id: 'fishBurger',
  initial: 'idle',
  context: {
    orderId: null,
    ingredients: [],
    cookingTime: 0,
    temperature: 0,
    messageHistory: [],
  },
  states: {
    idle: {
      on: {
        START_COOKING: {
          target: 'processing',
          actions: ['logStartCooking', 'addToHistory'],
        },
      },
    },
    processing: {
      on: {
        UPDATE_PROGRESS: {
          target: 'processing',
          actions: ['logProgress', 'addToHistory'],
        },
        COMPLETE_COOKING: {
          target: 'completed',
          actions: ['logCompletion', 'addToHistory'],
        },
        ERROR: {
          target: 'error',
          actions: ['logError', 'addToHistory'],
        },
      },
    },
    completed: {
      on: {
        RESET: {
          target: 'idle',
          actions: ['logReset', 'addToHistory'],
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'processing',
          actions: ['logRetry', 'addToHistory'],
        },
        RESET: {
          target: 'idle',
          actions: ['logReset', 'addToHistory'],
        },
      },
    },
  },
}, {
  actions: {
    logStartCooking: (context, event) => {
      const span = tracer.startSpan('start_cooking');
      span.setAttributes({
        'order.id': context.orderId,
        'ingredients': JSON.stringify(context.ingredients),
        'message.id': event.messageId,
      });
      
      console.log(`[${new Date().toISOString()}] Starting cooking for order ${context.orderId}`);
      span.end();
    },
    
    logProgress: (context, event) => {
      const span = tracer.startSpan('update_progress');
      span.setAttributes({
        'order.id': context.orderId,
        'cooking.time': context.cookingTime,
        'temperature': context.temperature,
        'message.id': event.messageId,
      });
      
      console.log(`[${new Date().toISOString()}] Progress update: ${context.cookingTime}s, ${context.temperature}°F`);
      span.end();
    },
    
    logCompletion: (context, event) => {
      const span = tracer.startSpan('complete_cooking');
      span.setAttributes({
        'order.id': context.orderId,
        'message.id': event.messageId,
      });
      
      console.log(`[${new Date().toISOString()}] Cooking completed for order ${context.orderId}`);
      span.end();
    },
    
    logError: (context, event) => {
      const span = tracer.startSpan('cooking_error');
      span.setAttributes({
        'order.id': context.orderId,
        'error.message': event.error,
        'message.id': event.messageId,
      });
      span.setStatus({ code: SpanStatusCode.ERROR, message: event.error });
      
      console.log(`[${new Date().toISOString()}] Error: ${event.error}`);
      span.end();
    },
    
    logRetry: (context, event) => {
      const span = tracer.startSpan('retry_cooking');
      span.setAttributes({
        'order.id': context.orderId,
        'message.id': event.messageId,
      });
      
      console.log(`[${new Date().toISOString()}] Retrying cooking for order ${context.orderId}`);
      span.end();
    },
    
    logReset: (context, event) => {
      const span = tracer.startSpan('reset_machine');
      span.setAttributes({
        'message.id': event.messageId,
      });
      
      console.log(`[${new Date().toISOString()}] Machine reset to idle`);
      span.end();
    },
    
    addToHistory: (context, event) => {
      const historyEntry = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        event: event.type,
        messageId: event.messageId,
        state: context.value,
        data: event.data || {},
        traceId: context.traceId,
        spanId: context.spanId,
      };
      
      context.messageHistory.push(historyEntry);
    },
  },
});

// Unleash toggle configuration
const unleashConfig = {
  appName: 'fish-burger-backend',
  environment: process.env.NODE_ENV || 'development',
  url: process.env.UNLEASH_URL || 'http://localhost:4242/api',
  clientKey: process.env.UNLEASH_CLIENT_KEY || 'default:development.unleash-insecure-api-token',
};

// Simulate Unleash client (in real implementation, use @unleash/node-server)
const unleashClient = {
  isEnabled: (toggleName, context = {}) => {
    // Simulate toggle logic - in real implementation, this would call Unleash API
    const toggles = {
      'fish-burger-kotlin-backend': false,
      'fish-burger-node-backend': true,
      'enable-tracing': true,
      'enable-datadog': true,
    };
    return toggles[toggleName] || false;
  },
};

// Message tracking for traceability
class MessageTracker {
  constructor() {
    this.messages = new Map();
    this.traceMap = new Map();
  }

  trackMessage(messageId, traceId, spanId, metadata = {}) {
    const message = {
      id: messageId,
      traceId,
      spanId,
      timestamp: new Date().toISOString(),
      metadata,
    };
    
    this.messages.set(messageId, message);
    
    if (!this.traceMap.has(traceId)) {
      this.traceMap.set(traceId, []);
    }
    this.traceMap.get(traceId).push(messageId);
    
    return message;
  }

  getMessage(messageId) {
    return this.messages.get(messageId);
  }

  getTraceMessages(traceId) {
    const messageIds = this.traceMap.get(traceId) || [];
    return messageIds.map(id => this.messages.get(id)).filter(Boolean);
  }

  getFullTrace(traceId) {
    const messages = this.getTraceMessages(traceId);
    return {
      traceId,
      messages,
      startTime: messages[0]?.timestamp,
      endTime: messages[messages.length - 1]?.timestamp,
    };
  }
}

const messageTracker = new MessageTracker();

// Express app setup
const app = express();
app.use(express.json());

// Middleware to extract trace context
app.use((req, res, next) => {
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const spanId = req.headers['x-span-id'] || uuidv4();
  
  req.traceContext = { traceId, spanId };
  next();
});

// Fish Burger API endpoints
app.post('/api/fish-burger/start', async (req, res) => {
  const { orderId, ingredients } = req.body;
  const { traceId, spanId } = req.traceContext;
  
  const span = tracer.startSpan('start_cooking_request');
  span.setAttributes({
    'order.id': orderId,
    'ingredients': JSON.stringify(ingredients),
    'trace.id': traceId,
  });

  try {
    const messageId = uuidv4();
    messageTracker.trackMessage(messageId, traceId, spanId, {
      orderId,
      ingredients,
      action: 'start_cooking',
    });

    const service = interpret(fishBurgerMachine)
      .start()
      .send({
        type: 'START_COOKING',
        data: { orderId, ingredients },
        messageId,
        traceId,
        spanId,
      });

    const state = service.getSnapshot();
    
    span.setAttributes({
      'state.machine.state': state.value,
      'message.id': messageId,
    });

    res.json({
      success: true,
      messageId,
      traceId,
      state: state.value,
      context: state.context,
    });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});

app.post('/api/fish-burger/progress', async (req, res) => {
  const { orderId, cookingTime, temperature } = req.body;
  const { traceId, spanId } = req.traceContext;
  
  const span = tracer.startSpan('update_progress_request');
  span.setAttributes({
    'order.id': orderId,
    'cooking.time': cookingTime,
    'temperature': temperature,
    'trace.id': traceId,
  });

  try {
    const messageId = uuidv4();
    messageTracker.trackMessage(messageId, traceId, spanId, {
      orderId,
      cookingTime,
      temperature,
      action: 'update_progress',
    });

    const service = interpret(fishBurgerMachine)
      .start()
      .send({
        type: 'UPDATE_PROGRESS',
        data: { orderId, cookingTime, temperature },
        messageId,
        traceId,
        spanId,
      });

    const state = service.getSnapshot();
    
    span.setAttributes({
      'state.machine.state': state.value,
      'message.id': messageId,
    });

    res.json({
      success: true,
      messageId,
      traceId,
      state: state.value,
      context: state.context,
    });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});

app.post('/api/fish-burger/complete', async (req, res) => {
  const { orderId } = req.body;
  const { traceId, spanId } = req.traceContext;
  
  const span = tracer.startSpan('complete_cooking_request');
  span.setAttributes({
    'order.id': orderId,
    'trace.id': traceId,
  });

  try {
    const messageId = uuidv4();
    messageTracker.trackMessage(messageId, traceId, spanId, {
      orderId,
      action: 'complete_cooking',
    });

    const service = interpret(fishBurgerMachine)
      .start()
      .send({
        type: 'COMPLETE_COOKING',
        data: { orderId },
        messageId,
        traceId,
        spanId,
      });

    const state = service.getSnapshot();
    
    span.setAttributes({
      'state.machine.state': state.value,
      'message.id': messageId,
    });

    res.json({
      success: true,
      messageId,
      traceId,
      state: state.value,
      context: state.context,
    });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});

// Traceability endpoints
app.get('/api/trace/:traceId', (req, res) => {
  const { traceId } = req.params;
  const trace = messageTracker.getFullTrace(traceId);
  
  if (!trace.messages.length) {
    return res.status(404).json({ error: 'Trace not found' });
  }
  
  res.json(trace);
});

app.get('/api/message/:messageId', (req, res) => {
  const { messageId } = req.params;
  const message = messageTracker.getMessage(messageId);
  
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  res.json(message);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    backend: 'node',
    unleash: unleashClient.isEnabled('fish-burger-node-backend'),
    tracing: unleashClient.isEnabled('enable-tracing'),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Fish Burger Node.js Backend running on port ${PORT}`);
  console.log(`Unleash toggle 'fish-burger-node-backend': ${unleashClient.isEnabled('fish-burger-node-backend')}`);
  console.log(`Tracing enabled: ${unleashClient.isEnabled('enable-tracing')}`);
});

module.exports = { app, messageTracker, fishBurgerMachine }; 