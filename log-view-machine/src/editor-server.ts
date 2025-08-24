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

// Main studio interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tome Connector Studio</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { color: #2563eb; margin-bottom: 20px; }
            .nav { margin: 30px 0; }
            .nav a { display: inline-block; margin: 10px 20px 10px 0; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; transition: background 0.2s; }
            .nav a:hover { background: #1d4ed8; }
            .endpoint { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
            .endpoint h3 { margin: 0 0 10px 0; color: #1e293b; }
            .endpoint p { margin: 5px 0; color: #64748b; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🌊 Tome Connector Studio</h1>
            <p>A powerful studio for building and managing Tome Connector components, state machines, and integrations.</p>
            
            <div class="nav">
                <a href="/wave-reader">🎨 Wave Reader Editor</a>
                <a href="/health">📊 Health Check</a>
                <a href="/api/editor/status">🎛️ Editor Status</a>
            </div>
            
            <h2>Available Endpoints</h2>
            <div class="endpoint">
                <h3>🎨 Wave Reader Editor</h3>
                <p><strong>GET /wave-reader</strong> - Main editor interface for Wave Reader components</p>
            </div>
            <div class="endpoint">
                <h3>📊 Health & Status</h3>
                <p><strong>GET /health</strong> - Server health check</p>
                <p><strong>GET /api/editor/status</strong> - Editor status and configuration</p>
            </div>
            <div class="endpoint">
                <h3>⚙️ Pact Features</h3>
                <p><strong>GET /api/pact/features</strong> - Available Pact features</p>
                <p><strong>GET /api/pact/backend</strong> - Pact backend status</p>
            </div>
            <div class="endpoint">
                <h3>🔍 Tracing & Monitoring</h3>
                <p><strong>GET /api/tracing/status</strong> - Tracing system status</p>
                <p><strong>POST /api/tracing/message</strong> - Send tracing message</p>
                <p><strong>GET /api/tracing/message/:messageId</strong> - Get specific message</p>
                <p><strong>GET /api/tracing/trace/:traceId</strong> - Get trace details</p>
                <p><strong>GET /api/tracing/generate</strong> - Generate new IDs</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Wave Reader Editor Interface
app.get('/wave-reader', (req, res) => {
  const workingDir = process.env.WORKING_DIRECTORY || 'Current Directory';
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wave Reader Editor - Tome Connector Studio</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8fafc; }
            .header { background: white; padding: 20px; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .header h1 { margin: 0; color: #2563eb; }
            .header p { margin: 5px 0 0 0; color: #64748b; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .nav { margin: 20px 0; }
            .nav a { display: inline-block; margin: 0 15px 15px 0; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; transition: background 0.2s; }
            .nav a:hover { background: #1d4ed8; }
            .content { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .project-info { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            .project-info h3 { margin: 0 0 15px 0; color: #1e293b; }
            .project-info p { margin: 5px 0; color: #475569; }
            .editor-section { margin: 30px 0; }
            .editor-section h3 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            .component-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
            .component-card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .component-card h4 { margin: 0 0 10px 0; color: #1e293b; }
            .component-card p { margin: 5px 0; color: #64748b; font-size: 14px; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status.active { background: #dcfce7; color: #166534; }
            .status.inactive { background: #fef2f2; color: #991b1b; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="container">
                <h1>🎨 Wave Reader Editor</h1>
                <p>Tome Connector Studio - Component Middleware Editor</p>
            </div>
        </div>
        
        <div class="container">
            <div class="nav">
                <a href="/">🏠 Studio Home</a>
                <a href="/health">📊 Health</a>
                <a href="/api/editor/status">🎛️ Status</a>
                <a href="/api/pact/features">⚙️ Pact Features</a>
            </div>
            
            <div class="content">
                <div class="project-info">
                    <h3>📁 Project Information</h3>
                    <p><strong>Working Directory:</strong> ${workingDir}</p>
                    <p><strong>Studio Version:</strong> 1.1.0</p>
                    <p><strong>Status:</strong> <span class="status active">Active</span></p>
                </div>
                
                <div class="editor-section">
                    <h3>🔧 Component Middleware</h3>
                    <p>Manage and configure Wave Reader component middleware components.</p>
                    
                    <div class="component-list">
                        <div class="component-card">
                            <h4>🎯 Error Boundary</h4>
                            <p>Error handling and boundary management for components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>🔘 Go Button</h4>
                            <p>Navigation and action button components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>📋 Selector Hierarchy</h4>
                            <p>Component selection and hierarchy management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>⚙️ Settings</h4>
                            <p>Configuration and settings management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>📊 Wave Tabs</h4>
                            <p>Tab-based navigation and content management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>🔍 Scan for Input</h4>
                            <p>Input detection and scanning functionality</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>⌨️ Selector Input</h4>
                            <p>Input selection and management tools</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                        <div class="component-card">
                            <h4>🌊 Wave Reader</h4>
                            <p>Core Wave Reader functionality and components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="editor-section">
                    <h3>🚀 Quick Actions</h3>
                    <p>Common actions and shortcuts for development.</p>
                    <div class="nav">
                        <a href="/api/editor/status">📊 Check Status</a>
                        <a href="/api/pact/features">⚙️ View Features</a>
                        <a href="/api/tracing/status">🔍 Tracing Status</a>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
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
