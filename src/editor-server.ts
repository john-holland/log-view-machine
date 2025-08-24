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
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
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
            .component-card { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; position: relative; }
            .component-card:hover { background: #f1f5f9; border-color: #2563eb; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }
            .component-card.clicked { background: #dbeafe; border-color: #2563eb; }
            .component-card h4 { margin: 0 0 10px 0; color: #1e293b; }
            .component-card p { margin: 5px 0; color: #64748b; font-size: 14px; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status.active { background: #dcfce7; color: #166534; }
            .status.inactive { background: #fef2f2; color: #991b1b; }
            .component-actions { margin-top: 15px; display: flex; gap: 10px; }
            .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 500; transition: all 0.2s; }
            .btn-primary { background: #2563eb; color: white; }
            .btn-primary:hover { background: #1d4ed8; }
            .btn-secondary { background: #64748b; color: white; }
            .btn-secondary:hover { background: #475569; }
            .btn-success { background: #059669; color: white; }
            .btn-success:hover { background: #047857; }
            .component-editor { background: white; border: 2px solid #e2e8f0; border-radius: 12px; margin-top: 30px; padding: 30px; display: none; }
            .component-editor.active { display: block; }
            .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e2e8f0; }
            .editor-header h3 { margin: 0; color: #1e293b; }
            .close-btn { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
            .close-btn:hover { background: #dc2626; }
            .editor-content { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .editor-panel { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .editor-panel h4 { margin: 0 0 15px 0; color: #1e293b; }
            .code-editor { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 13px; line-height: 1.5; min-height: 200px; white-space: pre-wrap; }
            .file-tree { background: #f1f5f9; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
            .file-item { padding: 8px 12px; margin: 4px 0; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
            .file-item:hover { background: #e2e8f0; }
            .file-item.active { background: #dbeafe; color: #1e40af; }
            .loading { display: none; text-align: center; padding: 40px; color: #64748b; }
            .loading.active { display: block; }
            .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #2563eb; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
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
                    <p><strong>Studio Version:</strong> 1.2.0</p>
                    <p><strong>Status:</strong> <span class="status active">Active</span></p>
                </div>
                
                <div class="editor-section">
                    <h3>🔧 Component Middleware</h3>
                    <p>Click on any component card to open it in the editor. Manage and configure Wave Reader component middleware components.</p>
                    
                    <div class="component-list">
                        <div class="component-card" data-component="error-boundary">
                            <h4>🎯 Error Boundary</h4>
                            <p>Error handling and boundary management for components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="error-boundary">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="error-boundary">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="go-button">
                            <h4>🔘 Go Button</h4>
                            <p>Navigation and action button components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="go-button">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="go-button">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="selector-hierarchy">
                            <h4>📋 Selector Hierarchy</h4>
                            <p>Component selection and hierarchy management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="selector-hierarchy">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="selector-hierarchy">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="settings">
                            <h4>⚙️ Settings</h4>
                            <p>Configuration and settings management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="settings">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="settings">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="wave-tabs">
                            <h4>📊 Wave Tabs</h4>
                            <p>Tab-based navigation and content management</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="wave-tabs">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="wave-tabs">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="scan-for-input">
                            <h4>🔍 Scan for Input</h4>
                            <p>Input detection and scanning functionality</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="scan-for-input">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="scan-for-input">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="selector-input">
                            <h4>⌨️ Selector Input</h4>
                            <p>Input selection and management tools</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="selector-input">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="selector-input">View Files</button>
                            </div>
                        </div>
                        <div class="component-card" data-component="wave-reader">
                            <h4>🌊 Wave Reader</h4>
                            <p>Core Wave Reader functionality and components</p>
                            <p><strong>Status:</strong> <span class="status active">Available</span></p>
                            <div class="component-actions">
                                <button class="btn btn-primary" data-action="open-editor" data-component="wave-reader">Open Editor</button>
                                <button class="btn btn-secondary" data-action="view-files" data-component="wave-reader">View Files</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Component Editor Panel -->
                <div class="component-editor" id="componentEditor">
                    <div class="editor-header">
                        <h3 id="editorTitle">Component Editor</h3>
                        <button class="close-btn" id="closeEditorBtn">✕ Close</button>
                    </div>
                    <div class="editor-content">
                        <div class="editor-panel">
                            <h4>📁 File Structure</h4>
                            <div class="file-tree" id="fileTree">
                                <div class="file-item active" data-file="component.tsx">component.tsx</div>
                                <div class="file-item" data-file="index.ts">index.ts</div>
                                <div class="file-item" data-file="types.ts">types.ts</div>
                                <div class="file-item" data-file="utils.ts">utils.ts</div>
                            </div>
                        </div>
                        <div class="editor-panel">
                            <h4>💻 Code Editor</h4>
                            <div class="code-editor" id="codeEditor" contenteditable="true">
// Component code will be loaded here
// Click on a file in the file tree to view its contents
                            </div>
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

        <script>
            // Component data (in a real app, this would come from the server)
            const componentData = {
                'error-boundary': {
                    name: 'Error Boundary',
                    description: 'Error handling and boundary management for components',
                    files: {
                        'component.tsx': \`import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page</p>
        </div>
      );
    }

    return this.props.children;
  }
}\`,
                        'index.ts': \`export { ErrorBoundary } from './component';\`,
                        'types.ts': \`export interface ErrorInfo {
  componentStack: string;
}\`,
                        'utils.ts': \`export const logError = (error: Error, errorInfo: any) => {
  console.error('Error logged:', error, errorInfo);
};\`
                    }
                },
                'go-button': {
                    name: 'Go Button',
                    description: 'Navigation and action button components',
                    files: {
                        'component.tsx': \`import React from 'react';

interface GoButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success';
}

export const GoButton: React.FC<GoButtonProps> = ({
  onClick,
  disabled = false,
  children,
  variant = 'primary'
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white'
  };

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]}\`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};\`,
                        'index.ts': \`export { GoButton } from './component';\`,
                        'types.ts': \`export type ButtonVariant = 'primary' | 'secondary' | 'success';\`,
                        'utils.ts': \`export const getButtonClasses = (variant: ButtonVariant) => {
  // Button styling utilities
};\`
                    }
                },
                'selector-hierarchy': {
                    name: 'Selector Hierarchy',
                    description: 'Component selection and hierarchy management',
                    files: {
                        'component.tsx': \`import React from 'react';

interface SelectorNode {
  id: string;
  name: string;
  children?: SelectorNode[];
  selected?: boolean;
}

interface SelectorHierarchyProps {
  nodes: SelectorNode[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const SelectorHierarchy: React.FC<SelectorHierarchyProps> = ({
  nodes,
  onSelectionChange
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleToggle = (nodeId: string) => {
    const newSelection = selectedIds.includes(nodeId)
      ? selectedIds.filter(id => id !== nodeId)
      : [...selectedIds, nodeId];
    
    setSelectedIds(newSelection);
    onSelectionChange(newSelection);
  };

  const renderNode = (node: SelectorNode) => (
    <div key={node.id} className="selector-node">
      <label>
        <input
          type="checkbox"
          checked={selectedIds.includes(node.id)}
          onChange={() => handleToggle(node.id)}
        />
        {node.name}
      </label>
      {node.children && (
        <div className="selector-children">
          {node.children.map(renderNode)}
        </div>
      )}
    </div>
  );

  return (
    <div className="selector-hierarchy">
      {nodes.map(renderNode)}
    </div>
  );
};\`,
                        'index.ts': \`export { SelectorHierarchy } from './component';\`,
                        'types.ts': \`export interface SelectorNode {
  id: string;
  name: string;
  children?: SelectorNode[];
  selected?: boolean;
}\`,
                        'utils.ts': \`export const flattenNodes = (nodes: SelectorNode[]): SelectorNode[] => {
  const result: SelectorNode[] = [];
  const stack = [...nodes];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node);
    if (node.children) {
      stack.push(...node.children);
    }
  }
  
  return result;
};\`
                    }
                },
                'settings': {
                    name: 'Settings',
                    description: 'Configuration and settings management',
                    files: {
                        'component.tsx': \`import React from 'react';

interface Setting {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: any;
  options?: string[];
}

interface SettingsProps {
  settings: Setting[];
  onSettingChange: (key: string, value: any) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  onSettingChange
}) => {
  const renderSettingInput = (setting: Setting) => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={setting.value}
            onChange={(e) => onSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={setting.value}
            onChange={(e) => onSettingChange(setting.key, Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={setting.value}
            onChange={(e) => onSettingChange(setting.key, e.target.checked)}
            className="w-4 h-4"
          />
        );
      case 'select':
        return (
          <select
            value={setting.value}
            onChange={(e) => onSettingChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings">
      <h3>Settings</h3>
      {settings.map(setting => (
        <div key={setting.key} className="setting-item">
          <label>{setting.label}</label>
          {renderSettingInput(setting)}
        </div>
      ))}
    </div>
  );
};\`,
                        'index.ts': \`export { Settings } from './component';\`,
                        'types.ts': \`export interface Setting {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: any;
  options?: string[];
}\`,
                        'utils.ts': \`export const validateSetting = (setting: Setting, value: any): boolean => {
  // Validation logic for different setting types
  return true;
};\`
                    }
                },
                'wave-tabs': {
                    name: 'Wave Tabs',
                    description: 'Tab-based navigation and content management',
                    files: {
                        'component.tsx': \`import React from 'react';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface WaveTabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange: (tabId: string) => void;
}

export const WaveTabs: React.FC<WaveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange
}) => {
  const [currentTab, setCurrentTab] = React.useState(activeTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    if (!tabs.find(tab => tab.id === tabId)?.disabled) {
      setCurrentTab(tabId);
      onTabChange(tabId);
    }
  };

  const activeTabData = tabs.find(tab => tab.id === currentTab);

  return (
    <div className="wave-tabs">
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={\`tab-button \${currentTab === tab.id ? 'active' : ''} \${tab.disabled ? 'disabled' : ''}\`}
            onClick={() => handleTabClick(tab.id)}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTabData?.content}
      </div>
    </div>
  );
};\`,
                        'index.ts': \`export { WaveTabs } from './component';\`,
                        'types.ts': \`export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}\`,
                        'utils.ts': \`export const createTab = (id: string, label: string, content: React.ReactNode): Tab => ({
  id,
  label,
  content,
  disabled: false
});\`
                    }
                },
                'scan-for-input': {
                    name: 'Scan for Input',
                    description: 'Input detection and scanning functionality',
                    files: {
                        'component.tsx': \`import React from 'react';

interface ScanResult {
  id: string;
  type: 'input' | 'button' | 'link' | 'select';
  value?: string;
  placeholder?: string;
}

interface ScanForInputProps {
  onScanComplete: (results: ScanResult[]) => void;
  autoScan?: boolean;
}

export const ScanForInput: React.FC<ScanForInputProps> = ({
  onScanComplete,
  autoScan = false
}) => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResults, setScanResults] = React.useState<ScanResult[]>([]);

  const performScan = () => {
    setIsScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      const mockResults: ScanResult[] = [
        { id: 'input-1', type: 'input', placeholder: 'Enter text...' },
        { id: 'button-1', type: 'button', value: 'Submit' },
        { id: 'link-1', type: 'link', value: 'Click here' }
      ];
      
      setScanResults(mockResults);
      setIsScanning(false);
      onScanComplete(mockResults);
    }, 1000);
  };

  React.useEffect(() => {
    if (autoScan) {
      performScan();
    }
  }, [autoScan]);

  return (
    <div className="scan-for-input">
      <button
        onClick={performScan}
        disabled={isScanning}
        className="scan-button"
      >
        {isScanning ? 'Scanning...' : 'Scan for Inputs'}
      </button>
      
      {scanResults.length > 0 && (
        <div className="scan-results">
          <h4>Scan Results:</h4>
          <ul>
            {scanResults.map(result => (
              <li key={result.id}>
                <strong>{result.type}:</strong> {result.value || result.placeholder}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};\`,
                        'index.ts': \`export { ScanForInput } from './component';\`,
                        'types.ts': \`export interface ScanResult {
  id: string;
  type: 'input' | 'button' | 'link' | 'select';
  value?: string;
  placeholder?: string;
}\`,
                        'utils.ts': \`export const validateInput = (input: HTMLInputElement): boolean => {
  return input.offsetWidth > 0 && input.offsetHeight > 0;
};\`
                    }
                },
                'selector-input': {
                    name: 'Selector Input',
                    description: 'Input selection and management tools',
                    files: {
                        'component.tsx': \`import React from 'react';

interface SelectorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
}

export const SelectorInput: React.FC<SelectorInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter selector...',
  suggestions = []
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = React.useState(suggestions);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    
    if (inputValue.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="selector-input">
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className="selector-field"
        onFocus={() => setShowSuggestions(suggestions.length > 0)}
      />
      
      {showSuggestions && (
        <div className="suggestions-dropdown">
          {filteredSuggestions.map(suggestion => (
            <div
              key={suggestion}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};\`,
                        'index.ts': \`export { SelectorInput } from './component';\`,
                        'types.ts': \`export interface SelectorSuggestion {
  value: string;
  label: string;
  category?: string;
}\`,
                        'utils.ts': \`export const parseSelector = (selector: string) => {
  // Parse CSS selector into components
  return {
    tag: selector.match(/^[a-zA-Z]+/)?.[0],
    id: selector.match(/#([a-zA-Z0-9_-]+)/)?.[1],
    classes: selector.match(/\\.([a-zA-Z0-9_-]+)/g)?.map(c => c.slice(1)) || []
  };
};\`
                    }
                },
                'wave-reader': {
                    name: 'Wave Reader',
                    description: 'Core Wave Reader functionality and components',
                    files: {
                        'component.tsx': \`import React from 'react';

interface WaveReaderProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const WaveReader: React.FC<WaveReaderProps> = ({
  text,
  speed = 200,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isReading, setIsReading] = React.useState(false);

  const startReading = () => {
    setIsReading(true);
    setCurrentIndex(0);
  };

  const stopReading = () => {
    setIsReading(false);
  };

  React.useEffect(() => {
    if (isReading && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= text.length) {
            setIsReading(false);
            onComplete?.();
          }
          return next;
        });
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [isReading, currentIndex, text.length, speed, onComplete]);

  const currentText = text.slice(0, currentIndex + 1);
  const remainingText = text.slice(currentIndex + 1);

  return (
    <div className="wave-reader">
      <div className="controls">
        <button onClick={startReading} disabled={isReading}>
          {isReading ? 'Reading...' : 'Start Reading'}
        </button>
        <button onClick={stopReading} disabled={!isReading}>
          Stop
        </button>
      </div>
      
      <div className="text-display">
        <span className="read-text">{currentText}</span>
        <span className="remaining-text">{remainingText}</span>
      </div>
      
      <div className="progress">
        <div 
          className="progress-bar" 
          style={{ width: \`\${((currentIndex + 1) / text.length) * 100}%\` }}
        />
      </div>
    </div>
  );
};\`,
                        'index.ts': \`export { WaveReader } from './component';\`,
                        'types.ts': \`export interface ReadingConfig {
  speed: number;
  autoStart: boolean;
  highlightWords: boolean;
}\`,
                        'utils.ts': \`export const calculateReadingTime = (text: string, speed: number): number => {
  const words = text.split(' ').length;
  const wordsPerMinute = 60000 / speed;
  return Math.ceil(words / wordsPerMinute);
};\`
                    }
                }
            };

            // State variables
            let currentComponent = null;
            let currentFile = 'component.tsx';

            // Event handlers
            function openComponent(componentId) {
                currentComponent = componentId;
                const component = componentData[componentId];
                
                if (component) {
                    // Update UI
                    document.getElementById('editorTitle').textContent = \`\${component.name} Editor\`;
                    document.getElementById('componentEditor').classList.add('active');
                    
                    // Load first file
                    loadFile('component.tsx');
                    
                    // Update component cards
                    document.querySelectorAll('.component-card').forEach(card => {
                        card.classList.remove('clicked');
                    });
                    document.querySelector(\`[data-component="\${componentId}"]\`).classList.add('clicked');
                }
            }

            function closeComponent() {
                document.getElementById('componentEditor').classList.remove('active');
                document.querySelectorAll('.component-card').forEach(card => {
                    card.classList.remove('clicked');
                });
                currentComponent = null;
            }

            function loadFile(filename) {
                if (!currentComponent) return;
                
                currentFile = filename;
                const component = componentData[currentComponent];
                const fileContent = component.files[filename];
                
                if (fileContent) {
                    document.getElementById('codeEditor').textContent = fileContent;
                    
                    // Update file tree
                    document.querySelectorAll('.file-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    document.querySelector(\`[data-file="\${filename}"]\`).classList.add('active');
                }
            }

            function viewFiles(componentId) {
                // This could open a file explorer or show file structure
                alert(\`Viewing files for \${componentData[componentId].name}\`);
            }

            // Initialize event listeners when DOM is loaded
            document.addEventListener('DOMContentLoaded', function() {
                // Button click handlers
                document.addEventListener('click', function(e) {
                    const target = e.target;
                    
                    if (target.matches('[data-action="open-editor"]')) {
                        const componentId = target.getAttribute('data-component');
                        openComponent(componentId);
                    } else if (target.matches('[data-action="view-files"]')) {
                        const componentId = target.getAttribute('data-component');
                        viewFiles(componentId);
                    }
                });

                // Close editor button
                document.getElementById('closeEditorBtn').addEventListener('click', closeComponent);

                // File tree click handlers
                document.querySelectorAll('.file-item').forEach(item => {
                    item.addEventListener('click', function() {
                        const filename = this.getAttribute('data-file');
                        loadFile(filename);
                    });
                });

                console.log('🎨 Wave Reader Editor initialized successfully!');
            });
        </script>
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
