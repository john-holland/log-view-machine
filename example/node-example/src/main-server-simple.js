import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { createServer } from 'http';
import dotenv from 'dotenv';
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Setup rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: () => 500 // begin adding 500ms of delay per request above 50
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
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://speedcf.cloudflareaccess.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://unpkg.com", "https://speedcf.cloudflareaccess.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "blob:"],
    },
  },
}));

// Setup compression
app.use(compression());

// Setup body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Serve static files
app.use(express.static(path.join(process.cwd(), 'public')));

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
                <a href="/fish-burger-demo" class="nav-link">🍔 Fish Burger Demo</a>
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
                    const response = await fetch('/api/fish-burger/events', {
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
  const editorPath = '/Users/johnholland/Developers/log-view-machine/example/node-example/src/component-middleware/generic-editor/index.html';
  res.sendFile(editorPath);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// API endpoints
app.get('/api/fish-burger/status', (req, res) => {
  res.json({
    status: 'running',
    currentState: 'idle',
    orderId: null,
    cookingTime: 0,
    temperature: 0
  });
});

app.post('/api/fish-burger/events', (req, res) => {
  const { event, data } = req.body;
  
  // Simple state machine simulation
  let currentState = 'idle';
  let orderId = data?.orderId || `ORDER-${Date.now()}`;
  let cookingTime = data?.cookingTime || 0;
  let temperature = data?.temperature || 0;
  
  switch (event) {
    case 'START_COOKING':
      currentState = 'cooking';
      cookingTime = 0;
      temperature = 350;
      break;
    case 'UPDATE_PROGRESS':
      currentState = 'cooking';
      cookingTime += 15;
      temperature = Math.min(400, temperature + 10);
      break;
    case 'COMPLETE_COOKING':
      currentState = 'completed';
      cookingTime = 120;
      temperature = 400;
      break;
    case 'ERROR':
      currentState = 'error';
      break;
    case 'RETRY':
      currentState = 'cooking';
      break;
    case 'RESET':
      currentState = 'idle';
      cookingTime = 0;
      temperature = 0;
      orderId = null;
      break;
  }
  
  res.json({
    success: true,
    currentState,
    orderId,
    cookingTime,
    temperature,
    event,
    timestamp: new Date().toISOString()
  });
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(port, () => {
  logger.info(`🚀 Main Server running on http://localhost:${port}`);
  logger.info(`🏠 Home page: http://localhost:${port}/`);
  logger.info(`✏️ Editor: http://localhost:${port}/editor`);
  logger.info(`🍔 Fish Burger Demo: http://localhost:${port}/fish-burger-demo`);
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

export { app, server, logger }; 