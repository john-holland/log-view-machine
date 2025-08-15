/**
 * Fish Burger Backend Server
 * 
 * Provides cooking API endpoints for Fish Burger Tome integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fish-burger-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create Express app
const app = express();
const PORT = process.env.FISH_BURGER_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  });
  next();
});

// In-memory storage for cooking sessions
const cookingSessions = new Map();
const messageHistory = new Map();
const traces = new Map();

/**
 * Generate cooking session data
 */
function generateCookingSession(orderData) {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const traceId = orderData.traceId || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    sessionId,
    traceId,
    orderId: orderData.orderId,
    ingredients: orderData.ingredients || ['fish-patty', 'bun', 'lettuce'],
    cookingTime: 0,
    temperature: 0,
    status: 'processing',
    startTime: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    messageHistory: []
  };
}

/**
 * Add message to history
 */
function addMessage(traceId, message) {
  if (!messageHistory.has(traceId)) {
    messageHistory.set(traceId, []);
  }
  
  const messageEntry = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    traceId,
    ...message
  };
  
  messageHistory.get(traceId).push(messageEntry);
  return messageEntry;
}

/**
 * Add trace entry
 */
function addTrace(traceId, traceData) {
  if (!traces.has(traceId)) {
    traces.set(traceId, {
      traceId,
      startTime: new Date().toISOString(),
      entries: []
    });
  }
  
  const traceEntry = {
    id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...traceData
  };
  
  traces.get(traceId).entries.push(traceEntry);
  return traceEntry;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'Fish Burger Backend',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    sessions: cookingSessions.size,
    messages: messageHistory.size,
    traces: traces.size
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Fish Burger Backend',
    version: '1.0.0',
    description: 'Cooking API for Fish Burger Tome integration',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      startCooking: 'POST /api/cooking/start',
      updateProgress: 'POST /api/cooking/progress',
      completeCooking: 'POST /api/cooking/complete',
      getTrace: 'GET /api/trace/:traceId',
      getMessages: 'GET /api/messages'
    },
    features: {
      cooking: 'enabled',
      tracing: 'enabled',
      messageHistory: 'enabled',
      sessionManagement: 'enabled'
    }
  });
});

// Start cooking endpoint
app.post('/api/cooking/start', async (req, res) => {
  try {
    const { orderId, ingredients, traceId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required'
      });
    }
    
    // Generate cooking session
    const session = generateCookingSession({ orderId, ingredients, traceId });
    cookingSessions.set(session.sessionId, session);
    
    // Add trace entry
    addTrace(session.traceId, {
      type: 'cooking_started',
      orderId: session.orderId,
      ingredients: session.ingredients,
      sessionId: session.sessionId
    });
    
    // Add message to history
    addMessage(session.traceId, {
      type: 'cooking_started',
      orderId: session.orderId,
      ingredients: session.ingredients,
      sessionId: session.sessionId
    });
    
    logger.info('Cooking started', {
      sessionId: session.sessionId,
      orderId: session.orderId,
      traceId: session.traceId
    });
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      traceId: session.traceId,
      cookingTime: session.cookingTime,
      temperature: session.temperature,
      status: session.status,
      message: 'Cooking started successfully'
    });
    
  } catch (error) {
    logger.error('Failed to start cooking', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update progress endpoint
app.post('/api/cooking/progress', async (req, res) => {
  try {
    const { orderId, cookingTime, temperature, traceId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required'
      });
    }
    
    // Find session by orderId
    let session = null;
    for (const [sessionId, sess] of cookingSessions) {
      if (sess.orderId === orderId) {
        session = sess;
        break;
      }
    }
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Cooking session not found'
      });
    }
    
    // Update session
    session.cookingTime = cookingTime || session.cookingTime;
    session.temperature = temperature || session.temperature;
    session.lastUpdated = new Date().toISOString();
    
    // Add trace entry
    addTrace(session.traceId, {
      type: 'progress_updated',
      orderId: session.orderId,
      cookingTime: session.cookingTime,
      temperature: session.temperature
    });
    
    // Add message to history
    addMessage(session.traceId, {
      type: 'progress_updated',
      orderId: session.orderId,
      cookingTime: session.cookingTime,
      temperature: session.temperature
    });
    
    logger.info('Progress updated', {
      sessionId: session.sessionId,
      orderId: session.orderId,
      cookingTime: session.cookingTime,
      temperature: session.temperature
    });
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      traceId: session.traceId,
      cookingTime: session.cookingTime,
      temperature: session.temperature,
      status: session.status,
      message: 'Progress updated successfully'
    });
    
  } catch (error) {
    logger.error('Failed to update progress', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete cooking endpoint
app.post('/api/cooking/complete', async (req, res) => {
  try {
    const { orderId, finalCookingTime, finalTemperature, traceId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required'
      });
    }
    
    // Find session by orderId
    let session = null;
    for (const [sessionId, sess] of cookingSessions) {
      if (sess.orderId === orderId) {
        session = sess;
        break;
      }
    }
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Cooking session not found'
      });
    }
    
    // Update session
    session.cookingTime = finalCookingTime || session.cookingTime;
    session.temperature = finalTemperature || session.temperature;
    session.status = 'completed';
    session.lastUpdated = new Date().toISOString();
    session.endTime = new Date().toISOString();
    
    // Add trace entry
    addTrace(session.traceId, {
      type: 'cooking_completed',
      orderId: session.orderId,
      finalCookingTime: session.cookingTime,
      finalTemperature: session.temperature
    });
    
    // Add message to history
    addMessage(session.traceId, {
      type: 'cooking_completed',
      orderId: session.orderId,
      finalCookingTime: session.cookingTime,
      finalTemperature: session.temperature
    });
    
    logger.info('Cooking completed', {
      sessionId: session.sessionId,
      orderId: session.orderId,
      finalCookingTime: session.cookingTime,
      finalTemperature: session.temperature
    });
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      traceId: session.traceId,
      finalCookingTime: session.cookingTime,
      finalTemperature: session.temperature,
      status: session.status,
      message: 'Cooking completed successfully'
    });
    
  } catch (error) {
    logger.error('Failed to complete cooking', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get trace endpoint
app.get('/api/trace/:traceId', async (req, res) => {
  try {
    const { traceId } = req.params;
    
    const trace = traces.get(traceId);
    if (!trace) {
      return res.status(404).json({
        success: false,
        error: 'Trace not found'
      });
    }
    
    res.json({
      success: true,
      trace
    });
    
  } catch (error) {
    logger.error('Failed to get trace', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message history endpoint
app.get('/api/messages', async (req, res) => {
  try {
    const { traceId } = req.query;
    
    if (traceId) {
      const messages = messageHistory.get(traceId) || [];
      res.json({
        success: true,
        traceId,
        messages
      });
    } else {
      // Return all messages
      const allMessages = [];
      for (const [traceId, messages] of messageHistory) {
        allMessages.push(...messages);
      }
      
      res.json({
        success: true,
        messages: allMessages
      });
    }
    
  } catch (error) {
    logger.error('Failed to get message history', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all sessions endpoint
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = Array.from(cookingSessions.values());
    
    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
    
  } catch (error) {
    logger.error('Failed to get sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
function startServer() {
  app.listen(PORT, () => {
    logger.info(`🐟 Fish Burger Backend server running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/health`);
    logger.info(`📋 API docs: http://localhost:${PORT}/`);
  });
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export for testing
export { app, startServer, cookingSessions, messageHistory, traces };

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
} 