import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import winston from 'winston';

import { createComponentMiddlewareManager, runTeleportHQDemo } from './index.js';

// Load environment variables
dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/teleporthq-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/teleporthq-combined.log' })
  ]
});

// Create Express app
const app = express();
const port = process.env.TELEPORTHQ_PORT || 3001;

// Setup middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Setup rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Initialize component middleware manager
const componentMiddleware = createComponentMiddlewareManager({
  teleportHQ: {
    apiKey: process.env.TELEPORTHQ_API_KEY || 'demo-key',
    projectId: process.env.TELEPORTHQ_PROJECT_ID || 'demo-project',
    environment: process.env.NODE_ENV || 'development',
    enableRealTimeSync: true,
    enableComponentStateSync: true,
    enabled: true
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const status = componentMiddleware.getStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    componentMiddleware: status
  });
});

// TeleportHQ API endpoints
app.get('/api/teleporthq/status', (req, res) => {
  try {
    const status = componentMiddleware.getStatus();
    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get TeleportHQ status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/teleporthq/demo', async (req, res) => {
  try {
    logger.info('Running TeleportHQ demo...');
    await runTeleportHQDemo();
    res.json({
      success: true,
      message: 'TeleportHQ demo completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('TeleportHQ demo failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Template management endpoints
app.post('/api/teleporthq/templates/:templateId/load', async (req, res) => {
  try {
    const { templateId } = req.params;
    const options = req.body || {};
    
    logger.info(`Loading template: ${templateId}`);
    await componentMiddleware.getTeleportHQ().loadTemplate(templateId, options);
    
    res.json({
      success: true,
      message: `Template ${templateId} loaded successfully`,
      templateId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to load template ${req.params.templateId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      templateId: req.params.templateId,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/teleporthq/templates/:templateId/create-machine', async (req, res) => {
  try {
    const { templateId } = req.params;
    const initialState = req.body.initialState || {};
    
    logger.info(`Creating ViewStateMachine for template: ${templateId}`);
    const viewStateMachine = componentMiddleware.getTeleportHQ().createViewStateMachine(templateId, initialState);
    
    res.json({
      success: true,
      message: `ViewStateMachine created for template ${templateId}`,
      templateId,
      machineId: viewStateMachine.machineId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to create ViewStateMachine for template ${req.params.templateId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      templateId: req.params.templateId,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/teleporthq/templates/:templateId/state', (req, res) => {
  try {
    const { templateId } = req.params;
    const state = componentMiddleware.getTeleportHQ().getTemplateState(templateId);
    
    res.json({
      success: true,
      templateId,
      state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to get state for template ${req.params.templateId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      templateId: req.params.templateId,
      timestamp: new Date().toISOString()
    });
  }
});

app.put('/api/teleporthq/templates/:templateId/state', (req, res) => {
  try {
    const { templateId } = req.params;
    const updates = req.body;
    
    logger.info(`Updating state for template: ${templateId}`);
    const newState = componentMiddleware.getTeleportHQ().updateTemplateState(templateId, updates);
    
    res.json({
      success: true,
      message: `State updated for template ${templateId}`,
      templateId,
      state: newState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to update state for template ${req.params.templateId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      templateId: req.params.templateId,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/teleporthq/templates/:templateId/validate', (req, res) => {
  try {
    const { templateId } = req.params;
    const validation = componentMiddleware.getTeleportHQ().validateTemplate(templateId);
    
    res.json({
      success: true,
      templateId,
      validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to validate template ${req.params.templateId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      templateId: req.params.templateId,
      timestamp: new Date().toISOString()
    });
  }
});

// Template connection endpoints
app.post('/api/teleporthq/connections', (req, res) => {
  try {
    const { sourceTemplateId, targetTemplateId, config } = req.body;
    
    logger.info(`Connecting templates: ${sourceTemplateId} -> ${targetTemplateId}`);
    const connectionId = componentMiddleware.getTeleportHQ().connectTemplates(
      sourceTemplateId, 
      targetTemplateId, 
      config
    );
    
    res.json({
      success: true,
      message: `Templates connected successfully`,
      connectionId,
      sourceTemplateId,
      targetTemplateId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to connect templates:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/teleporthq/connections/:connectionId', (req, res) => {
  try {
    const { connectionId } = req.params;
    
    logger.info(`Disconnecting templates: ${connectionId}`);
    const disconnected = componentMiddleware.getTeleportHQ().disconnectTemplates(connectionId);
    
    res.json({
      success: true,
      message: disconnected ? 'Templates disconnected successfully' : 'Connection not found',
      connectionId,
      disconnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to disconnect templates ${req.params.connectionId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      connectionId: req.params.connectionId,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/teleporthq/connections', (req, res) => {
  try {
    const connections = componentMiddleware.getTeleportHQ().getConnections();
    
    res.json({
      success: true,
      connections,
      count: connections.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get connections:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Cache management endpoints
app.get('/api/teleporthq/cache/stats', (req, res) => {
  try {
    const stats = componentMiddleware.getTeleportHQ().getCacheStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.delete('/api/teleporthq/cache', (req, res) => {
  try {
    const { templateId } = req.query;
    
    if (templateId) {
      logger.info(`Clearing cache for template: ${templateId}`);
      componentMiddleware.getTeleportHQ().clearCache(templateId);
    } else {
      logger.info('Clearing all cache');
      componentMiddleware.getTeleportHQ().clearCache();
    }
    
    res.json({
      success: true,
      message: templateId ? `Cache cleared for template ${templateId}` : 'All cache cleared',
      templateId: templateId || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Export endpoints
app.post('/api/teleporthq/export/all', async (req, res) => {
  try {
    logger.info('Exporting all template states to TeleportHQ');
    await componentMiddleware.getTeleportHQ().exportAllStates();
    
    res.json({
      success: true,
      message: 'All template states exported successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to export template states:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/teleporthq/templates/:templateId/export', async (req, res) => {
  try {
    const { templateId } = req.params;
    const state = req.body.state || componentMiddleware.getTeleportHQ().getTemplateState(templateId);
    
    logger.info(`Exporting state for template: ${templateId}`);
    await componentMiddleware.getTeleportHQ().adapter.exportToTeleportHQ(templateId, state);
    
    res.json({
      success: true,
      message: `State exported for template ${templateId}`,
      templateId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Failed to export state for template ${req.params.templateId}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      templateId: req.params.templateId,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize component middleware
(async () => {
  try {
    await componentMiddleware.initialize();
    logger.info('Component middleware initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize component middleware:', error);
  }
})();

// Start server
app.listen(port, () => {
  logger.info(`🚀 TeleportHQ Server running on http://localhost:${port}`);
  logger.info(`📊 Health check: http://localhost:${port}/health`);
  logger.info(`🔍 TeleportHQ status: http://localhost:${port}/api/teleporthq/status`);
  logger.info(`🎯 Demo endpoint: http://localhost:${port}/api/teleporthq/demo`);
  logger.info(`📁 Template management: http://localhost:${port}/api/teleporthq/templates`);
  logger.info(`🔗 Connection management: http://localhost:${port}/api/teleporthq/connections`);
  logger.info(`💾 Cache management: http://localhost:${port}/api/teleporthq/cache`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export { app, componentMiddleware, logger }; 