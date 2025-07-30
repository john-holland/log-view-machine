import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import dotenv from 'dotenv';
import winston from 'winston';

import { createViewStateMachine, createRobotCopy, createProxyRobotCopyStateMachine } from 'log-view-machine';
import { setupDatabase } from './database/setup.js';
import { createGraphQLSchema } from './graphql/schema.js';
import { createProxyMachines } from './machines/proxy-machines.js';
import { createStateMachines } from './machines/state-machines.js';
import { setupWebSocketServer } from './websocket/server.js';
import { setupMiddleware } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
import { runTeleportHQDemo } from './component-middleware/teleportHQ/demo.js';

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
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Setup middleware
setupMiddleware(app, logger);

// Setup rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500 // begin adding 500ms of delay per request above 50
});

app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Setup CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Setup security headers
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

// Setup compression
app.use(compression());

// Setup logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Initialize database
const db = await setupDatabase();

// Create RobotCopy instance
const robotCopy = createRobotCopy();

// Create state machines
const stateMachines = await createStateMachines(db, robotCopy);

// Create proxy machines
const proxyMachines = await createProxyMachines(db, robotCopy);

// Create GraphQL schema
const schema = createGraphQLSchema(stateMachines, proxyMachines, db);

// Create Apollo Server
const apolloServer = new ApolloServer({
  schema,
  context: ({ req }) => ({
    req,
    db,
    stateMachines,
    proxyMachines,
    robotCopy,
    logger
  }),
  plugins: [
    {
      requestDidStart: async ({ request, context }) => {
        const startTime = Date.now();
        logger.info(`GraphQL request: ${request.operationName || 'anonymous'}`, {
          query: request.query,
          variables: request.variables
        });

        return {
          willSendResponse: async ({ response }) => {
            const duration = Date.now() - startTime;
            logger.info(`GraphQL response: ${response.errors ? 'ERROR' : 'SUCCESS'}`, {
              duration,
              errors: response.errors
            });
          }
        };
      }
    }
  ]
});

await apolloServer.start();
apolloServer.applyMiddleware({ app, path: '/graphql' });

// Setup REST routes
setupRoutes(app, db, stateMachines, proxyMachines, robotCopy, logger);

// TeleportHQ demo endpoint
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

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server for GraphQL subscriptions
setupWebSocketServer(server, schema, logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Start server
server.listen(port, () => {
  logger.info(`🚀 Server running on http://localhost:${port}`);
  logger.info(`📊 GraphQL endpoint: http://localhost:${port}/graphql`);
  logger.info(`🔌 WebSocket endpoint: ws://localhost:${port}/graphql`);
  logger.info(`📈 Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { app, server, db, stateMachines, proxyMachines, robotCopy, logger }; 