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
// import { runTeleportHQDemo } from './component-middleware/teleportHQ/demo.js';
import { createPactTestProxy } from './machines/pact-test-proxy.js';
import { setupFishBurgerDemoRoutes } from './routes/fish-burger-demo.js';

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
      styleSrc: ["'self'", "'unsafe-inline'", "http:", "https:", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http:", "https:", "ws:", "wss:"],
      fontSrc: ["'self'", "data:", "https:"],
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

// Create pact test proxy for testing cart components
const pactTestProxy = await createPactTestProxy(robotCopy, {
  testMode: 'happy_path',
  responseDelay: { min: 100, max: 1000 },
  errorProbability: 0.05
});

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
    pactTestProxy,
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

// Serve static assets for generic editor components
app.use('/assets', express.static('./src/component-middleware/generic-editor/assets', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Root route with navigation
app.get('/', (req, res) => {
  try {
    logger.info('Serving root route with navigation...');
    
    const navigationHTML = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http: https: ws: wss:;">
        <title>Log View Machine - Node Example</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 3rem;
            margin: 0 0 10px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            font-size: 1.2rem;
            margin: 0;
            opacity: 0.9;
        }
        .nav-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .nav-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 25px;
            text-decoration: none;
            color: white;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .nav-card:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .nav-card h3 {
            margin: 0 0 15px 0;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .nav-card p {
            margin: 0;
            opacity: 0.9;
            line-height: 1.6;
        }
        .status-section {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 20px;
        }
        .status-section h2 {
            margin: 0 0 20px 0;
            text-align: center;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .status-item {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .status-item h4 {
            margin: 0 0 10px 0;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        .status-item .value {
            font-size: 1.2rem;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            opacity: 0.7;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Log View Machine</h1>
            <p>Node Example - Generic Editor & Component System</p>
        </div>
        
        <div class="status-section">
            <h2>📊 System Status</h2>
            <div class="status-grid">
                <div class="status-item">
                    <h4>Database</h4>
                    <div class="value">✅ Connected</div>
                </div>
                <div class="status-item">
                    <h4>State Machines</h4>
                    <div class="value">✅ Active</div>
                </div>
                <div class="status-item">
                    <h4>Proxy Machines</h4>
                    <div class="value">✅ Running</div>
                </div>
                <div class="status-item">
                    <h4>Pact Test Proxy</h4>
                    <div class="value">✅ Ready</div>
                </div>
            </div>
        </div>
        
        <div class="nav-grid">
            <a href="/generic-editor" class="nav-card">
                <h3>🎨 Generic Editor</h3>
                <p>Main component editor with HTML, CSS, JavaScript, and XState editing capabilities. Build and test components in real-time.</p>
            </a>
            
            <a href="/fish-burger-demo" class="nav-card">
                <h3>🍔 Fish Burger Demo</h3>
                <p>Interactive demo showcasing our generic editor components with pact test proxy integration. Test cart functionality and state machines.</p>
            </a>
            
            <a href="/graphql" class="nav-card">
                <h3>🔍 GraphQL Playground</h3>
                <p>Interactive GraphQL playground to explore and test our state machine and proxy machine APIs.</p>
            </a>
            
            <a href="/health" class="nav-card">
                <h3>💚 Health Check</h3>
                <p>System health status and diagnostic information for all services and components.</p>
            </a>
            
            <a href="/api/pact-test/status" class="nav-card">
                <h3>🧪 Pact Test Status</h3>
                <p>Current pact test proxy configuration and statistics. Monitor test scenarios and error injection.</p>
            </a>
            
            <a href="/api/state-machines" class="nav-card">
                <h3>⚙️ State Machines</h3>
                <p>List and manage all registered state machines. View states, transitions, and send events.</p>
            </a>
        </div>
        
        <div class="footer">
            <p>Built with ❤️ using XState, Express, and the Generic Editor Component System</p>
        </div>
    </div>
</body>
</html>`;
    
    res.send(navigationHTML);
  } catch (error) {
    logger.error('Failed to serve root route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve root route',
      details: error.message
    });
  }
});

// Setup REST routes
setupRoutes(app, db, stateMachines, proxyMachines, robotCopy, logger);

// Setup fish burger demo routes
setupFishBurgerDemoRoutes(app, logger);

// TeleportHQ demo endpoint - temporarily disabled
// app.get('/api/teleporthq/demo', async (req, res) => {
//   try {
//     logger.info('Running TeleportHQ demo...');
//     await runTeleportHQDemo();
//     res.json({
//       success: true,
//       message: 'TeleportHQ demo completed successfully',
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     logger.error('TeleportHQ demo failed:', error);
//     res.status(500).json({
//       success: false,
//       error: error.message,
//       timestamp: new Date().toISOString()
//     });
//   }
// });

// Fish Burger Demo with Generic Editor Components
app.get('/fish-burger-demo', (req, res) => {
  try {
    logger.info('Serving Fish Burger Demo with Generic Editor Components...');
    
    // Serve the fish burger demo HTML template from external file
    res.sendFile('./src/component-middleware/generic-editor/assets/components/fish-burger-demo/templates/demo-template.html', { root: process.cwd() });
  } catch (error) {
    logger.error('Fish Burger Demo failed:', error);
    res.status(500).send(`
      <h1>Error Loading Fish Burger Demo</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    `);
  }
});

// Pact Test Proxy Control Endpoints
app.get('/api/pact-test/status', (req, res) => {
  try {
    const stats = pactTestProxy.getSnapshot().context;
    res.json({
      success: true,
      status: 'active',
      testMode: stats.testMode,
      requestCount: stats.requestCount,
      errorCount: stats.errorCount,
      lastRequest: stats.lastRequest,
      config: {
        responseDelay: stats.responseDelay,
        errorProbability: stats.errorProbability
      }
    });
  } catch (error) {
    logger.error('Failed to get pact test status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/pact-test/config', (req, res) => {
  try {
    const { testMode, responseDelay, errorProbability } = req.body;
    
    pactTestProxy.send('UPDATE_CONFIG', {
      newConfig: { testMode, responseDelay, errorProbability }
    });
    
    res.json({
      success: true,
      message: 'Pact test configuration updated',
      config: { testMode, responseDelay, errorProbability }
    });
  } catch (error) {
    logger.error('Failed to update pact test config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/pact-test/reset', (req, res) => {
  try {
    pactTestProxy.send('RESET_STATS');
    
    res.json({
      success: true,
      message: 'Pact test statistics reset'
    });
  } catch (error) {
    logger.error('Failed to reset pact test stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generic Editor Interface
app.get('/generic-editor', async (req, res) => {
  try {
    logger.info('Serving Generic Editor Interface...');
    
    // Read and serve the generic editor HTML file
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const editorPath = path.join(__dirname, 'component-middleware', 'generic-editor', 'index.html');
    let editorHTML = await fs.readFile(editorPath, 'utf8');
    
    // Add CSP meta tag to the generic editor HTML
    const cspMetaTag = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: https:; connect-src \'self\' http: https: ws: wss:;">';
    
    // Insert CSP meta tag after the first meta tag
    editorHTML = editorHTML.replace(
      /<meta charset="UTF-8">/,
      '<meta charset="UTF-8">\n    ' + cspMetaTag
    );
    
    res.send(editorHTML);
  } catch (error) {
    logger.error('Generic Editor failed to load:', error);
    res.status(500).send(`
      <h1>Error Loading Generic Editor</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    `);
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