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
import path from 'path';
import { fileURLToPath } from 'url';

import { createViewStateMachine, createRobotCopy, createProxyRobotCopyStateMachine, Cave, TomeManager, FishBurgerTomeConfig } from 'log-view-machine';
import { setupDatabase } from './database/setup.js';
import { createGraphQLSchema } from './graphql/schema.js';
import { createProxyMachines } from './machines/proxy-machines.js';
import { createStateMachines } from './machines/state-machines.js';
import { setupWebSocketServer } from './websocket/server.js';
import { setupMiddleware } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
// import { runTeleportHQDemo } from './component-middleware/teleportHQ/demo.js';

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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
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

// Root Cave for node-example: route/entry describe where each feature is exposed (path → handler/Tome).
const nodeExampleSpelunk = {
  childCaves: {
    'fish-burger-api': {
      route: '/api/fish-burger',
      tomeId: 'fish-burger-tome',
      tomes: { fishBurger: {} },
    },
    'fish-burger-demo': {
      route: '/fish-burger-demo',
    },
    'generic-editor': {
      route: '/editor',
    },
  },
};
const cave = Cave('node-example', nodeExampleSpelunk);
await cave.initialize();

// TomeManager with Express app; register fish-burger Tome
const tomeManager = new TomeManager(app);
const fishBurgerTome = await tomeManager.registerTome(FishBurgerTomeConfig);
fishBurgerTome.synchronizeWithCave(cave);

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

// Fish Burger API: delegate to registered fish-burger Tome
app.post('/api/fish-burger/start', async (req, res) => {
  try {
    const { orderId, ingredients } = req.body || {};
    logger.info('Fish burger start', { orderId, ingredients });
    const traceId = req.headers['x-trace-id'] || `trace-${Date.now()}`;
    await tomeManager.sendTomeMessage('fish-burger-tome', 'cookingMachine', 'START_COOKING', { orderId, ingredients });
    const state = tomeManager.getTomeMachineState('fish-burger-tome', 'cookingMachine');
    res.json({
      success: true,
      messageId: `msg-${Date.now()}`,
      traceId,
      state: state?.value ?? 'processing',
      context: { orderId: orderId || null, ingredients: ingredients || [] },
    });
  } catch (err) {
    logger.error('Fish burger start error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/fish-burger/progress', (req, res) => {
  try {
    const { orderId, cookingTime, temperature } = req.body || {};
    logger.info('Fish burger progress', { orderId, cookingTime, temperature });
    tomeManager.updateTomeContext('fish-burger-tome', { orderId, cookingTime, temperature });
    res.json({
      success: true,
      messageId: `msg-${Date.now()}`,
      state: 'processing',
      context: { orderId, cookingTime, temperature },
    });
  } catch (err) {
    logger.error('Fish burger progress error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/fish-burger/complete', async (req, res) => {
  try {
    const { orderId } = req.body || {};
    logger.info('Fish burger complete', { orderId });
    await tomeManager.sendTomeMessage('fish-burger-tome', 'cookingMachine', 'COMPLETE_COOKING', { orderId });
    const state = tomeManager.getTomeMachineState('fish-burger-tome', 'cookingMachine');
    res.json({
      success: true,
      messageId: `msg-${Date.now()}`,
      state: state?.value ?? 'completed',
      context: { orderId: orderId || null },
    });
  } catch (err) {
    logger.error('Fish burger complete error', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Add tome management routes
app.get('/api/tomes', (req, res) => {
  res.json({
    tomes: tomeManager.listTomes(),
    status: tomeManager.getTomeStatus()
  });
});

app.get('/api/tomes/:tomeId', (req, res) => {
  const { tomeId } = req.params;
  const tome = tomeManager.getTome(tomeId);
  if (!tome) {
    return res.status(404).json({ error: 'Tome not found' });
  }
  res.json({
    id: tome.id,
    name: tome.config.name,
    description: tome.config.description,
    version: tome.config.version,
    machines: Array.from(tome.machines.keys()),
    context: tome.context
  });
});

app.post('/api/tomes/:tomeId/machines/:machineId/message', async (req, res) => {
  try {
    const { tomeId, machineId } = req.params;
    const { event, data } = req.body;
    
    const result = await tomeManager.sendTomeMessage(tomeId, machineId, event, data);
    res.json({
      success: true,
      tomeId,
      machineId,
      event,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

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

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve cart component assets
app.use('/assets', express.static(path.join(process.cwd(), 'src/component-middleware/generic-editor/assets'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Home page - Fish Burger Example
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Log View Machine - Fish Burger Example</title>
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
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            .nav-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 40px;
            }
            .nav-link {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 10px;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .nav-link:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            .content {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 30px;
                margin-top: 30px;
            }
            .fish-burger-demo {
                text-align: center;
                margin-bottom: 30px;
            }
            .demo-button {
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 1.1em;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            .demo-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .feature {
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 10px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .feature h3 {
                margin-top: 0;
                color: #ffd700;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐟 Log View Machine</h1>
            
            <div class="nav-links">
                <a href="/" class="nav-link">🏠 Home</a>
                <a href="/editor" class="nav-link">✏️ Editor</a>
                <a href="/api/teleporthq/demo" class="nav-link">🚀 TeleportHQ Demo</a>
                <a href="/health" class="nav-link">💚 Health</a>
            </div>
            
            <div class="content">
                <div class="fish-burger-demo">
                    <h2>🍔 Fish Burger State Machine Demo</h2>
                    <p>Experience the power of XState with our interactive fish burger ordering system.</p>
                    <button class="demo-button" onclick="startFishBurgerDemo()">Start Fish Burger Demo</button>
                </div>
                
                <div class="features">
                    <div class="feature">
                        <h3>🎯 State Management</h3>
                        <p>Advanced state machines with XState integration for complex workflows.</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Logging & Tracing</h3>
                        <p>Comprehensive logging with OpenTelemetry integration for observability.</p>
                    </div>
                    <div class="feature">
                        <h3>🔧 Component Editor</h3>
                        <p>Visual component editor with real-time preview and state machine visualization.</p>
                    </div>
                    <div class="feature">
                        <h3>🚀 TeleportHQ Integration</h3>
                        <p>Seamless integration with TeleportHQ for component generation and management.</p>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            function startFishBurgerDemo() {
                // Redirect to the fish burger demo
                window.location.href = '/fish-burger-demo';
            }
        </script>
    </body>
    </html>
  `);
});

// Fish Burger Demo Page
app.get('/fish-burger-demo', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fish Burger Demo</title>
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
                max-width: 800px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 20px;
                padding: 40px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5em;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            .demo-controls {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }
            .demo-button {
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 1em;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            .demo-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
            }
            .demo-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            .status {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 20px;
                margin: 20px 0;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .logs {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 10px;
                padding: 20px;
                margin-top: 20px;
                max-height: 300px;
                overflow-y: auto;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }
            .log-entry {
                margin-bottom: 5px;
                padding: 5px;
                border-radius: 5px;
            }
            .log-info { background: rgba(0, 255, 0, 0.2); }
            .log-error { background: rgba(255, 0, 0, 0.2); }
            .log-warn { background: rgba(255, 255, 0, 0.2); color: #333; }
            .back-link {
                display: inline-block;
                margin-bottom: 20px;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
                transition: all 0.3s ease;
            }
            .back-link:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/" class="back-link">← Back to Home</a>
            <h1>🍔 Fish Burger Demo</h1>
            
            <div class="demo-controls">
                <button class="demo-button" onclick="sendEvent('START_COOKING')">Start Cooking</button>
                <button class="demo-button" onclick="sendEvent('UPDATE_PROGRESS')">Update Progress</button>
                <button class="demo-button" onclick="sendEvent('COMPLETE_COOKING')">Complete Cooking</button>
                <button class="demo-button" onclick="sendEvent('ERROR')">Simulate Error</button>
                <button class="demo-button" onclick="sendEvent('RETRY')">Retry</button>
                <button class="demo-button" onclick="sendEvent('RESET')">Reset</button>
            </div>
            
            <div class="status" id="status">
                <h3>Current Status: <span id="current-state">idle</span></h3>
                <p>Order ID: <span id="order-id">-</span></p>
                <p>Cooking Time: <span id="cooking-time">0</span> seconds</p>
                <p>Temperature: <span id="temperature">0</span>°C</p>
            </div>
            
            <div class="logs" id="logs">
                <h3>Logs</h3>
                <div id="log-entries"></div>
            </div>
        </div>
        
        <script>
            let currentState = 'idle';
            let orderId = null;
            let cookingTime = 0;
            let temperature = 0;
            
            async function sendEvent(eventType) {
                try {
                    const response = await fetch('/api/state-machines/fish-burger/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            event: eventType,
                            data: {
                                timestamp: new Date().toISOString(),
                                cookingTime: cookingTime,
                                temperature: temperature
                            }
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        updateStatus(result);
                        addLog('info', \`Event '\${eventType}' sent successfully\`);
                    } else {
                        addLog('error', \`Failed to send event '\${eventType}'\`);
                    }
                } catch (error) {
                    addLog('error', \`Error sending event: \${error.message}\`);
                }
            }
            
            function updateStatus(result) {
                currentState = result.currentState;
                document.getElementById('current-state').textContent = currentState;
                
                if (result.data) {
                    if (result.data.orderId) orderId = result.data.orderId;
                    if (result.data.cookingTime) cookingTime = result.data.cookingTime;
                    if (result.data.temperature) temperature = result.data.temperature;
                }
                
                document.getElementById('order-id').textContent = orderId || '-';
                document.getElementById('cooking-time').textContent = cookingTime;
                document.getElementById('temperature').textContent = temperature;
            }
            
            function addLog(level, message) {
                const logEntries = document.getElementById('log-entries');
                const logEntry = document.createElement('div');
                logEntry.className = \`log-entry log-\${level}\`;
                logEntry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
                logEntries.appendChild(logEntry);
                logEntries.scrollTop = logEntries.scrollHeight;
            }
            
            // Initialize
            addLog('info', 'Fish Burger Demo initialized');
        </script>
    </body>
    </html>
  `);
});

// Editor Page
app.get('/editor', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});

// Cart Component Test Page
app.get('/cart-test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/cart-test.html'));
});

// Cart Component Integration Test Page
app.get('/cart-integration-test', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/cart-integration-test.html'));
});

// Cart Component Demo Page
app.get('/cart-demo', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/cart-demo.html'));
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
  logger.info(`🚀 Main Server running on http://localhost:${port}`);
  logger.info(`📊 GraphQL endpoint: http://localhost:${port}/graphql`);
  logger.info(`🔌 WebSocket endpoint: ws://localhost:${port}/graphql`);
  logger.info(`📈 Health check: http://localhost:${port}/health`);
  logger.info(`🏠 Home page: http://localhost:${port}/`);
  logger.info(`✏️ Editor: http://localhost:${port}/editor`);
  logger.info(`🛒 Cart Test: http://localhost:${port}/cart-test`);
  logger.info(`🔧 Cart Integration Test: http://localhost:${port}/cart-integration-test`);
  logger.info(`🎯 Cart Demo: http://localhost:${port}/cart-demo`);
  logger.info(`🍔 Fish Burger Demo: http://localhost:${port}/fish-burger-demo`);
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