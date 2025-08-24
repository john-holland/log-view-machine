import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RobotCopy } from './core/RobotCopy';

// Editor-specific configuration
const EDITOR_CONFIG = {
  port: process.env.EDITOR_PORT || 3003,
  enableCors: true,
  enableSecurity: true
};

// Initialize RobotCopy with editor-specific features
const robotCopy = new RobotCopy({
  unleashUrl: process.env.UNLEASH_URL || 'http://localhost:4242/api',
  unleashAppName: process.env.UNLEASH_APP_NAME || 'tome-connector-editor',
  unleashEnvironment: process.env.UNLEASH_ENVIRONMENT || 'development'
});

// Create Express app
const app = express();

// Security middleware
if (EDITOR_CONFIG.enableSecurity) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"]
      }
    }
  }));
}

// CORS middleware
if (EDITOR_CONFIG.enableCors) {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'tome-connector-editor',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Editor-specific API endpoints
app.get('/api/editor/status', (req, res) => {
  res.json({
    status: 'ready',
    service: 'tome-connector-editor',
    robotCopy: {
      unleashUrl: robotCopy['config'].unleashUrl,
      unleashAppName: robotCopy['config'].unleashAppName,
      unleashEnvironment: robotCopy['config'].unleashEnvironment
    }
  });
});

// Pact-related endpoints (using actual RobotCopy methods)
app.get('/api/pact/features', async (req, res) => {
  try {
    // Get available feature toggles
    const features = {
      'fish-burger-kotlin-backend': await robotCopy.isEnabled('fish-burger-kotlin-backend'),
      'fish-burger-node-backend': await robotCopy.isEnabled('fish-burger-node-backend'),
      'enable-tracing': await robotCopy.isEnabled('enable-tracing'),
      'enable-datadog': await robotCopy.isEnabled('enable-datadog')
    };
    
    res.json({ features });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve feature toggles' });
  }
});

app.get('/api/pact/backend', async (req, res) => {
  try {
    const backendType = await robotCopy.getBackendType();
    const backendUrl = await robotCopy.getBackendUrl();
    
    res.json({ 
      backendType, 
      backendUrl,
      features: {
        'fish-burger-kotlin-backend': await robotCopy.isEnabled('fish-burger-kotlin-backend'),
        'fish-burger-node-backend': await robotCopy.isEnabled('fish-burger-node-backend')
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve backend information' });
  }
});

// Tracing endpoints
app.get('/api/tracing/status', (req, res) => {
  res.json({
    tracing: {
      enabled: robotCopy['config'].enableTracing,
      datadog: robotCopy['config'].enableDataDog
    }
  });
});

app.post('/api/tracing/message', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'action parameter is required' });
    }
    
    const result = await robotCopy.sendMessage(action, data);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

app.get('/api/tracing/message/:messageId', (req, res) => {
  try {
    const { messageId } = req.params;
    const message = robotCopy.getMessage(messageId);
    
    if (message) {
      res.json({ message });
    } else {
      res.status(404).json({ error: 'Message not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve message' });
  }
});

app.get('/api/tracing/trace/:traceId', (req, res) => {
  try {
    const { traceId } = req.params;
    const messages = robotCopy.getTraceMessages(traceId);
    const fullTrace = robotCopy.getFullTrace(traceId);
    
    res.json({ 
      traceId, 
      messageCount: messages.length,
      messages,
      fullTrace
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve trace' });
  }
});

// Generate new IDs
app.get('/api/tracing/generate', (req, res) => {
  try {
    const messageId = robotCopy.generateMessageId();
    const traceId = robotCopy.generateTraceId();
    const spanId = robotCopy.generateSpanId();
    
    res.json({ messageId, traceId, spanId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate IDs' });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Editor server error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'GET /api/editor/status',
      'GET /api/pact/features',
      'GET /api/pact/backend',
      'GET /api/tracing/status',
      'POST /api/tracing/message',
      'GET /api/tracing/message/:messageId',
      'GET /api/tracing/trace/:traceId',
      'GET /api/tracing/generate'
    ]
  });
});

// Start server
async function startServer() {
  try {
    // Start listening
    app.listen(EDITOR_CONFIG.port, () => {
      console.log(`🚀 TomeConnector Editor Server running on port ${EDITOR_CONFIG.port}`);
      console.log(`🔍 Health check at http://localhost:${EDITOR_CONFIG.port}/health`);
      console.log(`🎛️  Editor status at http://localhost:${EDITOR_CONFIG.port}/api/editor/status`);
      console.log(`⚙️  Pact features at http://localhost:${EDITOR_CONFIG.port}/api/pact/features`);
      console.log(`🔍 Tracing at http://localhost:${EDITOR_CONFIG.port}/api/tracing/status`);
    });
  } catch (error) {
    console.error('Failed to start editor server:', error);
    process.exit(1);
  }
}

// Export for testing
export { app, startServer, robotCopy };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
