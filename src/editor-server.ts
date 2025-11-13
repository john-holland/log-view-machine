import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { RobotCopy } from './core/RobotCopy';
import { openTelemetryManager } from './opentelemetry-setup';
import { SpanStatusCode } from '@opentelemetry/api';
import { editorTome } from './editor/tomes/EditorTome';
import { initializeAuthService } from './services/auth-service';
import fs from 'fs';
import path from 'path';

// Simple template processor for server-side rendering
class TemplateProcessor {
  private static processTemplate(template: string, variables: Record<string, any> = {}): string {
    // Only remove very specific JSX patterns that cause browser errors
    // Be very conservative to avoid breaking JavaScript code structure
    
    let processed = template;
    
    // Remove JSX code blocks with problematic attributes (only if they're complete)
    processed = processed.replace(/<[^>]*\s+value=\{.*?\}[^>]*>/g, '');
    processed = processed.replace(/<[^>]*\s+onChange=\{.*?\}[^>]*>/g, '');
    processed = processed.replace(/<[^>]*\s+checked=\{.*?\}[^>]*>/g, '');
    
    // Remove JSX expressions but be very careful
    // Only remove JSX expressions that are clearly JSX, not JavaScript
    // Look for patterns like {setting.value} but avoid {this.state.hasError}
    processed = processed.replace(/\{([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_]*)\}/g, '');
    
    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed = processed.replace(pattern, String(value));
    });
    
    return processed;
  }
  
  static renderComponentTemplate(template: string, componentName: string): string {
    return this.processTemplate(template, {
      componentName,
      timestamp: new Date().toISOString(),
      version: '1.2.0'
    });
  }
}

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

// Initialize AuthService
const authService = initializeAuthService({
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
});

// Load component whitelist
let componentWhitelist: any = { components: [] };
try {
  const whitelistPath = path.join(process.cwd(), 'src/config/component-whitelist.json');
  if (fs.existsSync(whitelistPath)) {
    componentWhitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf-8'));
    console.log(`📋 Loaded component whitelist: ${componentWhitelist.components.length} components`);
  }
} catch (error) {
  console.warn('📋 Could not load component whitelist, using empty list');
}

// Create Express app
const app = express();

// OpenTelemetry middleware for trace context propagation
app.use((req, res, next) => {
  // Extract trace context from incoming request
  const traceContext = openTelemetryManager.extractTraceContext(req.headers as Record<string, string>);
  
  if (traceContext) {
    // If trace context exists, use it
    req.traceId = traceContext.traceId;
    req.spanId = traceContext.spanId;
  } else {
    // Generate new trace context for this request
    const newContext = openTelemetryManager.createTraceContext();
    req.traceId = newContext.traceId;
    req.spanId = newContext.spanId;
  }
  
  // Add trace headers to response
  res.set('X-Trace-ID', req.traceId);
  res.set('X-Span-ID', req.spanId);
  
  next();
});

// Security middleware
if (EDITOR_CONFIG.enableSecurity) {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        // Block extension scripts and service workers
        workerSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        // Prevent extension manifest injection
        manifestSrc: ["'none'"],
        // Allow inline styles and scripts for editor functionality
        styleSrcAttr: ["'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"]
      }
    },
    // Additional security headers
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Extension isolation middleware
app.use((req, res, next) => {
  // Block extension-related requests
  if (req.path.includes('manifest.json') || 
      req.path.includes('background.js') || 
      req.path.includes('content.js') ||
      req.path.includes('service-worker') ||
      req.path.includes('chrome-extension') ||
      req.path.includes('shadowContent.js') ||
      req.path.includes('log-view-machine')) {
    return res.status(404).json({ error: 'Extension resources not available' });
  }
  
  // Add headers to prevent extension interference
  res.set({
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
    // Additional headers to block extension loading
    'X-Content-Security-Policy': "default-src 'self'; worker-src 'none'; manifest-src 'none';",
    'X-WebKit-CSP': "default-src 'self'; worker-src 'none'; manifest-src 'none';"
  });
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Favicon endpoint - palette emoji 🎨
app.get('/favicon.ico', (req, res) => {
  // SVG favicon with palette emoji
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <text y="80" font-size="80">🎨</text>
    </svg>
  `;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

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
    },
    tome: {
      enabled: true,
      machines: ['EditorMachine', 'PreviewMachine', 'TemplateMachine', 'HealthMachine']
    }
  });
});

// Tome-based Editor API endpoints

/**
 * List all components
 */
app.get('/api/tome/components', async (req, res) => {
  try {
    await editorTome.send('EditorMachine', 'LIST_COMPONENTS');
    
    // Get the components from the machine context
    const context = editorTome.getMachineContext('EditorMachine');
    res.json({ 
      success: true, 
      components: context?.components || [] 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Load a specific component
 */
app.get('/api/tome/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
    
    // Wait a bit for the state transition
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const context = editorTome.getMachineContext('EditorMachine');
    const state = editorTome.getMachineState('EditorMachine');
    
    if (state?.value === 'error') {
      res.status(404).json({ 
        success: false, 
        error: context?.error || 'Component not found' 
      });
    } else {
      res.json({ 
        success: true, 
        component: context?.currentComponent,
        state: state?.value
      });
    }
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Create a new component
 */
app.post('/api/tome/components', async (req, res) => {
  try {
    await editorTome.send('EditorMachine', 'CREATE_NEW');
    
    // Wait for state transition
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const context = editorTome.getMachineContext('EditorMachine');
    res.json({ 
      success: true, 
      component: context?.currentComponent 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Save the current component
 */
app.put('/api/tome/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const component = req.body;
    
    // First load the component if not already loaded
    const context = editorTome.getMachineContext('EditorMachine');
    if (context?.currentComponent?.id !== id) {
      await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Update the component content in the machine context
    const currentContext = editorTome.getMachineContext('EditorMachine');
    if (currentContext) {
      currentContext.currentComponent = component;
    }
    
    // Trigger save
    await editorTome.send('EditorMachine', 'SAVE');
    
    // Wait for save to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const updatedContext = editorTome.getMachineContext('EditorMachine');
    res.json({ 
      success: true, 
      component: updatedContext?.currentComponent 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Delete a component
 */
app.delete('/api/tome/components/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Load the component first
    await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Delete it
    await editorTome.send('EditorMachine', 'DELETE');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    res.json({ 
      success: true, 
      message: 'Component deleted' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Preview a component
 */
app.post('/api/tome/components/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Load component if needed
    const context = editorTome.getMachineContext('EditorMachine');
    if (context?.currentComponent?.id !== id) {
      await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Request preview
    await editorTome.send('EditorMachine', 'PREVIEW');
    
    // Wait for preview to render
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const previewContext = editorTome.getMachineContext('PreviewMachine');
    res.json({ 
      success: true, 
      preview: previewContext?.previewData 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get editor machine state
 */
app.get('/api/tome/state', (req, res) => {
  try {
    const editorState = editorTome.getMachineState('EditorMachine');
    const previewState = editorTome.getMachineState('PreviewMachine');
    const healthState = editorTome.getMachineState('HealthMachine');
    
    res.json({
      success: true,
      states: {
        editor: editorState?.value,
        preview: previewState?.value,
        health: healthState?.value
      },
      contexts: {
        editor: editorTome.getMachineContext('EditorMachine'),
        preview: editorTome.getMachineContext('PreviewMachine'),
        health: editorTome.getMachineContext('HealthMachine')
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Authentication API endpoints

/**
 * Google OAuth2 login
 */
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'idToken required' });
    }

    const authToken = await authService.authenticateWithGoogle(idToken);
    
    if (!authToken) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    res.json({
      success: true,
      token: authToken.token,
      expiresAt: authToken.expiresAt,
      user: authToken.user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Refresh auth token
 */
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'token required' });
    }

    const newAuthToken = await authService.refreshToken(token);
    
    if (!newAuthToken) {
      return res.status(401).json({ error: 'Token refresh failed' });
    }

    res.json({
      success: true,
      token: newAuthToken.token,
      expiresAt: newAuthToken.expiresAt,
      user: newAuthToken.user
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Developer mode: Switch user type
 */
app.post('/api/auth/dev/switch-user-type', async (req, res) => {
  try {
    // Check if developer mode is enabled
    const isDeveloperMode = await robotCopy.isEnabled('developer-mode');
    
    if (!isDeveloperMode) {
      return res.status(403).json({ error: 'Developer mode not enabled' });
    }

    const { token, userType } = req.body;
    
    if (!token || !userType) {
      return res.status(400).json({ error: 'token and userType required' });
    }

    const newToken = authService.switchUserType(token, userType);

    res.json({
      success: true,
      token: newToken,
      message: `Switched to ${userType} mode (dev only, not persisted)`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Component Whitelist API

/**
 * Get component whitelist
 */
app.get('/api/mods/whitelist', (req, res) => {
  res.json({
    success: true,
    version: componentWhitelist.version,
    components: componentWhitelist.components,
    moddingRules: componentWhitelist.modding_rules
  });
});

/**
 * Check if component is moddable
 */
app.get('/api/mods/whitelist/:componentName', (req, res) => {
  const { componentName } = req.params;
  const component = componentWhitelist.components.find(
    (c: any) => c.name === componentName
  );

  if (!component) {
    return res.status(404).json({
      success: false,
      isModdable: false,
      message: 'Component not in whitelist'
    });
  }

  res.json({
    success: true,
    isModdable: component.isModdable,
    component
  });
});

// Donation API endpoints

/**
 * Process a donation
 */
app.post('/api/donate', async (req, res) => {
  try {
    const { portfolio, amount, userId } = req.body;

    if (!portfolio || !amount) {
      return res.status(400).json({ error: 'portfolio and amount required' });
    }

    const validPortfolios = ['developer', 'w3c_wai', 'aspca', 'audubon'];
    if (!validPortfolios.includes(portfolio)) {
      return res.status(400).json({ error: 'Invalid portfolio' });
    }

    // Calculate tokens (only for developer donations)
    const tokensGranted = portfolio === 'developer' ? Math.floor(amount) : 0;

    console.log(`💰 Processing donation: $${amount} to ${portfolio}, tokens: ${tokensGranted}`);

    // TODO: Process actual payment via Solana/PayPal/TheGivingBlock
    // TODO: Grant tokens to user if developer donation
    // TODO: Record in charity_donations table

    res.json({
      success: true,
      portfolio,
      amount,
      tokensGranted,
      message: tokensGranted > 0 
        ? `Thank you! ${tokensGranted} tokens granted` 
        : 'Thank you for supporting charity!'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process batch donations (all portfolios at once)
 */
app.post('/api/donate/batch', async (req, res) => {
  try {
    const { donations, userId } = req.body;

    if (!donations || !Array.isArray(donations)) {
      return res.status(400).json({ error: 'donations array required' });
    }

    const results = [];
    let totalTokens = 0;

    for (const donation of donations) {
      const { portfolio, amount } = donation;
      const tokensGranted = portfolio === 'developer' ? Math.floor(amount) : 0;
      totalTokens += tokensGranted;

      results.push({
        portfolio,
        amount,
        tokensGranted
      });

      console.log(`💰 Batch donation: $${amount} to ${portfolio}`);
    }

    // TODO: Process all payments
    // TODO: Grant total tokens to user

    res.json({
      success: true,
      donations: results,
      totalTokens,
      message: `Thank you for donating! ${totalTokens} tokens granted`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get donation statistics
 */
app.get('/api/donate/stats', (req, res) => {
  // TODO: Query charity_donations table for real stats
  res.json({
    success: true,
    stats: {
      developer: { total: 0, count: 0 },
      w3c_wai: { total: 0, count: 0 },
      aspca: { total: 0, count: 0 },
      audubon: { total: 0, count: 0 }
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
  const currentContext = openTelemetryManager.getCurrentTraceContext();
  
  res.json({
    tracing: {
      enabled: openTelemetryManager.getInitializationStatus(),
      opentelemetry: true,
      currentTrace: currentContext,
      service: {
        name: 'tome-connector-editor',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      endpoint: process.env.OTEL_ENDPOINT || 'http://localhost:4318'
    }
  });
});

app.post('/api/tracing/message', async (req, res) => {
  try {
    const { action, data } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: 'action parameter is required' });
    }
    
    // Start a span for this message
    const span = openTelemetryManager.startSpan(`tracing.message.${action}`);
    
    try {
      const result = await robotCopy.sendMessage(action, data);
      
      // Add attributes to span
      span.setAttributes({
        'action': action,
        'success': true,
        'traceId': req.traceId,
        'spanId': req.spanId
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      res.json({ success: true, result, traceId: req.traceId, spanId: req.spanId });
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to send message', traceId: req.traceId, spanId: req.spanId });
  }
});

app.get('/api/tracing/message/:messageId', (req, res) => {
  try {
    const { messageId } = req.params;
    const message = robotCopy.getMessage(messageId);
    
    if (message) {
      res.json({ 
        message,
        traceId: req.traceId,
        spanId: req.spanId
      });
    } else {
      res.status(404).json({ 
        error: 'Message not found',
        traceId: req.traceId,
        spanId: req.spanId
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve message',
      traceId: req.traceId,
      spanId: req.spanId
    });
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
      fullTrace,
      currentTrace: {
        traceId: req.traceId,
        spanId: req.spanId
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve trace',
      traceId: req.traceId,
      spanId: req.spanId
    });
  }
});

// Generate new IDs using OpenTelemetry
app.get('/api/tracing/generate', (req, res) => {
  try {
    const messageId = robotCopy.generateMessageId();
    const traceId = openTelemetryManager.generateTraceId();
    const spanId = openTelemetryManager.generateSpanId();
    
    res.json({ 
      messageId, 
      traceId, 
      spanId,
      currentTrace: {
        traceId: req.traceId,
        spanId: req.spanId
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate IDs',
      traceId: req.traceId,
      spanId: req.spanId
    });
  }
});

// ===== NEW PREMIUM MODDING PLATFORM API ENDPOINTS =====

// Linter API
import { linterService } from './services/linter-service';

/**
 * Lint check endpoint
 */
app.post('/api/lint/check', async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'files array is required',
      });
    }

    console.log(`🔍 Linting ${files.length} file(s)...`);

    const { results, summary } = await linterService.lintFiles(files);

    res.json({
      success: true,
      results,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Auto-fix endpoint
 */
app.post('/api/lint/fix', async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({
        success: false,
        error: 'files array is required',
      });
    }

    console.log(`🔧 Auto-fixing ${files.length} file(s)...`);

    const { files: fixedFiles, fixed } = await linterService.autoFix(files);

    res.json({
      success: true,
      files: fixedFiles,
      fixed,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get rule documentation
 */
app.get('/api/lint/rules/:ruleId', (req, res) => {
  try {
    const { ruleId } = req.params;
    const documentation = linterService.getRuleDocumentation(ruleId);

    res.json({
      success: true,
      ruleId,
      documentation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// PII Scanner API
app.post('/api/pii/scan', async (req, res) => {
  try {
    const { content, filename } = req.body;
    const piiScanner = initializePIIScanner();
    const result = piiScanner.scanContent(content, filename);
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Mod Review API
app.get('/api/mods/review/queue', async (req, res) => {
  try {
    const modReviewService = initializeModReviewService();
    const queue = await modReviewService.getReviewQueue();
    
    res.json({
      success: true,
      queue
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/mods/review/action', async (req, res) => {
  try {
    const { submissionId, action, reviewerId, notes, piiOverride } = req.body;
    const modReviewService = initializeModReviewService();
    const result = await modReviewService.processReviewAction({
      submissionId,
      action,
      reviewerId,
      notes,
      piiOverride
    });
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Token Ledger API
app.get('/api/tokens/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tokenLedger = initializeTokenLedgerService();
    const balance = await tokenLedger.getBalance(userId);
    
    res.json({
      success: true,
      balance
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/tokens/grant', async (req, res) => {
  try {
    const { userId, amount, source, reason } = req.body;
    const tokenLedger = initializeTokenLedgerService();
    const transaction = await tokenLedger.grantTokens(userId, amount, source, reason);
    
    res.json({
      success: true,
      transaction
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.get('/api/tokens/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, type } = req.query;
    const tokenLedger = initializeTokenLedgerService();
    const history = await tokenLedger.getTransactionHistory(
      userId, 
      parseInt(limit as string), 
      type as string
    );
    
    res.json({
      success: true,
      history
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Mod Install API
app.post('/api/mods/install', async (req, res) => {
  try {
    const { userId, modId, authorId, tokenAmount } = req.body;
    const tokenLedger = initializeTokenLedgerService();
    const result = await tokenLedger.processModInstall(userId, modId, authorId, tokenAmount);
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/mods/uninstall', async (req, res) => {
  try {
    const { userId, modId } = req.body;
    const tokenLedger = initializeTokenLedgerService();
    const result = await tokenLedger.processModUninstall(userId, modId);
    
    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Solana Integration API
app.get('/api/solana/status', async (req, res) => {
  try {
    const solanaService = initializeSolanaService({
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      programId: 'mock-program-id',
      tokenMint: 'mock-token-mint'
    });
    
    const status = await solanaService.getNetworkStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/solana/connect', async (req, res) => {
  try {
    const solanaService = initializeSolanaService({
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      programId: 'mock-program-id',
      tokenMint: 'mock-token-mint'
    });
    
    const connection = await solanaService.connectWallet();
    
    res.json({
      success: true,
      connection
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Admin API
app.get('/api/admin/users', async (req, res) => {
  try {
    // Mock user data for now
    const users = [
      {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        tokens: 150,
        status: 'premium',
        joinedAt: '2024-01-15'
      },
      {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        tokens: 75,
        status: 'free',
        joinedAt: '2024-01-16'
      }
    ];
    
    res.json({
      success: true,
      users
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.post('/api/admin/tokens/grant', async (req, res) => {
  try {
    const { email, amount, reason, notes } = req.body;
    const tokenLedger = initializeTokenLedgerService();
    
    // In a real implementation, you'd look up the user by email
    const userId = `user-${Date.now()}`;
    const transaction = await tokenLedger.grantTokens(userId, amount, 'admin_grant', reason);
    
    res.json({
      success: true,
      transaction,
      message: `Granted ${amount} tokens to ${email}`
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
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
        <!-- Extension isolation meta tags -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'none'; child-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'none'; style-src-attr 'unsafe-inline'; script-src-attr 'unsafe-inline';">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <meta name="format-detection" content="telephone=no">
        <meta name="robots" content="noindex, nofollow">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
            .container { max-width: 1000px; margin: 0 auto; padding: 40px 20px; }
            .hero { text-align: center; margin-bottom: 60px; }
            .hero h1 { color: white; margin-bottom: 20px; font-size: 3.5rem; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
            .hero p { color: rgba(255,255,255,0.9); font-size: 1.3rem; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
            .hero-button { display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 50px; font-size: 1.2rem; font-weight: 600; transition: all 0.3s; box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
            .hero-button:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(0,0,0,0.4); }
            .main-content { background: white; border-radius: 20px; padding: 50px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .nav { margin: 30px 0; text-align: center; }
            .nav a { display: inline-block; margin: 10px 15px; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; transition: all 0.2s; }
            .nav a:hover { background: #1d4ed8; transform: translateY(-2px); }
            .endpoint { background: #f8fafc; padding: 20px; margin: 15px 0; border-radius: 12px; border-left: 4px solid #2563eb; }
            .endpoint h3 { margin: 0 0 15px 0; color: #1e293b; }
            .endpoint p { margin: 8px 0; color: #475569; }
            .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 30px 0; }
            .feature-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 15px; text-align: center; }
            .feature-card h3 { margin: 0 0 15px 0; font-size: 1.4rem; }
            .feature-card p { margin: 0; opacity: 0.9; }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Hero Section -->
            <div class="hero">
                <h1>🌊 Tome Connector Studio</h1>
                <p>A powerful studio for building and managing Tome Connector components, state machines, and integrations.</p>
                <a href="/wave-reader" class="hero-button">🚀 Open Wave Reader Editor</a>
            </div>
            
            <!-- Main Content -->
            <div class="main-content">
                <!-- Feature Grid -->
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>🎨 Component Editor</h3>
                        <p>Full-featured editor for Wave Reader components with live preview and file management</p>
                    </div>
                    <div class="feature-card">
                        <h3>⚙️ State Machines</h3>
                        <p>Visual state machine editor and management for complex component behaviors</p>
                    </div>
                    <div class="feature-card">
                        <h3>🔍 Tracing & Monitoring</h3>
                        <p>Advanced tracing and monitoring capabilities for debugging and performance analysis</p>
                    </div>
                </div>
                
                <!-- Navigation -->
                <div class="nav">
                    <a href="/wave-reader">🎨 Wave Reader Editor</a>
                    <a href="/health">📊 Health Check</a>
                    <a href="/api/editor/status">🎛️ Editor Status</a>
                    <a href="/api/pact/features">⚙️ Pact Features</a>
                </div>
                
                <!-- Available Endpoints -->
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
        </div>
    </body>
    </html>
  `);
});

// Premium Editor Route
app.get('/editor/premium', (req, res) => {
  const premiumEditorPath = path.join(process.cwd(), 'static/premium-editor.html');
  
  if (fs.existsSync(premiumEditorPath)) {
    res.sendFile(premiumEditorPath);
  } else {
    res.status(404).send('Premium editor not found');
  }
});

// Donation Page Route
app.get('/donate', (req, res) => {
  const donatePath = path.join(process.cwd(), 'static/donate.html');
  
  if (fs.existsSync(donatePath)) {
    res.sendFile(donatePath);
  } else {
    res.status(404).send('Donation page not found');
  }
});

// Mod Marketplace Route
app.get('/marketplace', (req, res) => {
  const marketplacePath = path.join(process.cwd(), 'static/marketplace.html');
  
  if (fs.existsSync(marketplacePath)) {
    res.sendFile(marketplacePath);
  } else {
    res.status(404).send('Marketplace not found');
  }
});

// Admin Panel Route
app.get('/admin', (req, res) => {
  const adminPath = path.join(process.cwd(), 'static/admin.html');
  
  if (fs.existsSync(adminPath)) {
    res.sendFile(adminPath);
  } else {
    res.status(404).send('Admin panel not found');
  }
});

// Wave Reader Editor Interface
app.get('/wave-reader', (req, res) => {
  const workingDir = process.env.WORKING_DIRECTORY || 'Current Directory';
  
  const template = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wave Reader Editor - Tome Connector Studio</title>
        <!-- Extension isolation meta tags -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; worker-src 'none'; child-src 'self'; frame-src 'none'; object-src 'none'; manifest-src 'none'; style-src-attr 'unsafe-inline'; script-src-attr 'unsafe-inline';">
        <meta name="referrer" content="strict-origin-when-cross-origin">
        <meta name="format-detection" content="telephone=no">
        <meta name="robots" content="noindex, nofollow">
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
                                <!-- File items will be dynamically populated -->
                            </div>
                        </div>
                        <div class="editor-panel">
                            <h4>💻 Code Editor</h4>
                            <div class="code-editor" id="codeEditor" contenteditable="true">
<!-- HTML Component code will be loaded here -->
<!-- Click on a file in the file tree to view its contents -->
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
                        'component.tsx': '// Error Boundary Component - React component for error handling',
                        'index.ts': 'export { ErrorBoundary } from "./component";',
                        'types.ts': 'export interface ErrorInfo { componentStack: string; }',
                        'utils.ts': 'export const logError = (error, errorInfo) => console.error("Error logged:", error, errorInfo);'
                    }
                },
                'go-button': {
                    name: 'Go Button',
                    description: 'Navigation and action button components',
                    files: {
                        'component.html': '<!DOCTYPE html><html><head><title>Go Button</title></head><body><button class="go-button">Go</button></body></html>',
                        'component.css': '.go-button { padding: 0.5rem 1rem; border-radius: 0.25rem; }',
                        'component.js': 'function handleClick() { console.log("Button clicked"); }'
                    }
                },
                'selector-hierarchy': {
                    name: 'Selector Hierarchy',
                    description: 'Component selection and hierarchy management',
                    files: {
                        'component.html': '<!DOCTYPE html><html><head><title>Selector</title></head><body><div class="selector">Selector Component</div></body></html>',
                        'component.css': '.selector { font-family: Arial, sans-serif; }',
                        'component.js': 'function initSelector() { console.log("Selector initialized"); }'
                    }
                },
                'settings': {
                    name: 'Settings',
                    description: 'Configuration and settings management',
                    files: {
                        'component.tsx': '// Settings Component - Configuration management',
                        'index.ts': 'export { Settings } from "./component";',
                        'types.ts': 'export interface Setting { key: string; value: any; }',
                        'utils.ts': 'export const validateSetting = (setting, value) => true;'
                    }
                },
                'wave-tabs': {
                    name: 'Wave Tabs',
                    description: 'Tab-based navigation and content management',
                    files: {
                        'component.tsx': '// Wave Tabs Component - Tab navigation',
                        'index.ts': 'export { WaveTabs } from "./component";',
                        'types.ts': 'export interface Tab { id: string; label: string; }',
                        'utils.ts': 'export const createTab = (id, label) => ({ id, label });'
                    }
                },
                'scan-for-input': {
                    name: 'Scan for Input',
                    description: 'Input detection and scanning functionality',
                    files: {
                        'component.tsx': '// Scan for Input Component - Input detection',
                        'index.ts': 'export { ScanForInput } from "./component";',
                        'types.ts': 'export interface ScanResult { id: string; type: string; }',
                        'utils.ts': 'export const validateInput = (input) => input.offsetWidth > 0;'
                    }
                },
                'selector-input': {
                    name: 'Selector Input',
                    description: 'Input selection and management tools',
                    files: {
                        'component.tsx': '// Selector Input Component - Input selection',
                        'index.ts': 'export { SelectorInput } from "./component";',
                        'types.ts': 'export interface SelectorSuggestion { value: string; label: string; }',
                        'utils.ts': 'export const parseSelector = (selector) => ({ tag: "div", id: null, classes: [] });'
                    }
                },
                'wave-reader': {
                    name: 'Wave Reader',
                    description: 'Core Wave Reader functionality and components',
                    files: {
                        'component.tsx': '// Wave Reader Component - Core functionality',
                        'index.ts': 'export { WaveReader } from "./component";',
                        'types.ts': 'export interface ReadingConfig { speed: number; autoStart: boolean; }',
                        'utils.ts': 'export const calculateReadingTime = (text, speed) => Math.ceil(text.split(" ").length / (60000 / speed));'
                    }
                }
            };

            // State variables
            let currentComponent = null;
            let currentFile = 'component.html';

            // Event handlers
            function openEditor(componentId) {
                console.log('🎨 Opening WYSIWYG editor for component:', componentId);
                currentComponent = componentId;
                const component = componentData[componentId];
                
                if (component) {
                    console.log('📁 Component found:', component);
                    
                    // Create a new WYSIWYG editor window/modal
                    const wysiwygContainer = document.createElement('div');
                    wysiwygContainer.id = 'wysiwygEditor';
                    wysiwygContainer.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
                    
                    const wysiwygContent = document.createElement('div');
                    wysiwygContent.style.cssText = 'background: white; border-radius: 12px; padding: 30px; max-width: 1200px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';
                    
                    wysiwygContent.innerHTML = 
                        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">' +
                            '<h2 style="margin: 0; color: #1e293b;">🎨 WYSIWYG Editor - ' + component.name + '</h2>' +
                            '<button id="closeWysiwyg" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">✕ Close</button>' +
                        '</div>' +
                        '<div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">' +
                            '<h3 style="margin: 0 0 10px 0; color: #475569;">Component Properties</h3>' +
                            '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">' +
                                '<div>' +
                                    '<label style="display: block; margin-bottom: 5px; font-weight: 500; color: #64748b;">Component Name</label>' +
                                    '<input type="text" value="' + component.name + '" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">' +
                                '</div>' +
                                '<div>' +
                                    '<label style="display: block; margin-bottom: 5px; font-weight: 500; color: #64748b;">Type</label>' +
                                    '<select id="componentType-' + componentId + '" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px;">' +
                                        '<option value="react">React Component</option>' +
                                        '<option value="html">HTML Template</option>' +
                                        '<option value="vue">Vue Component</option>' +
                                    '</select>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; min-height: 300px;">' +
                            '<h3 style="margin: 0 0 15px 0; color: #475569;">Visual Preview</h3>' +
                            '<div id="wysiwygPreview-' + componentId + '" style="background: white; padding: 20px; border-radius: 4px; border: 2px solid #cbd5e1; min-height: 250px;">' +
                                '<!-- Component preview will be rendered here -->' +
                            '</div>' +
                        '</div>' +
                        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">' +
                            '<div>' +
                                '<h3 style="margin: 0 0 10px 0; color: #475569;">Component Files</h3>' +
                                '<ul style="list-style: none; padding: 0; margin: 0; margin-bottom: 15px;">' +
                                    Object.keys(component.files).map(file => 
                                        '<li style="padding: 8px 12px; background: #f8fafc; margin-bottom: 5px; border-radius: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background=\'#e2e8f0\'" onmouseout="this.style.background=\'#f8fafc\'">' +
                                            '📄 ' + file +
                                        '</li>'
                                    ).join('') +
                                '</ul>' +
                                '<button id="openPremiumBtn-' + componentId + '" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; margin-bottom: 10px;">' +
                                    '✨ Open in Premium Editor' +
                                '</button>' +
                            '</div>' +
                            '<div>' +
                                '<h3 style="margin: 0 0 10px 0; color: #475569;">Actions</h3>' +
                                '<button id="saveBtn-' + componentId + '" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 10px; font-size: 14px; font-weight: 500;">' +
                                    '💾 Save Component' +
                                '</button>' +
                                '<button id="previewBtn-' + componentId + '" style="width: 100%; padding: 12px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 10px; font-size: 14px; font-weight: 500;">' +
                                    '👁️ Preview in Browser' +
                                '</button>' +
                                '<button id="exportBtn-' + componentId + '" style="width: 100%; padding: 12px; background: #64748b; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">' +
                                    '📤 Export Component' +
                                '</button>' +
                            '</div>' +
                        '</div>';
                    
                    wysiwygContainer.appendChild(wysiwygContent);
                    document.body.appendChild(wysiwygContainer);
                    
                    // Render the component preview
                    const previewContainer = document.getElementById('wysiwygPreview-' + componentId);
                    if (previewContainer) {
                        // Get all file contents as preview
                        const filesHtml = Object.entries(component.files).map(function([filename, content]) {
                            // For HTML files, render them
                            if (filename.endsWith('.html')) {
                                return '<div style="margin-bottom: 20px;">' +
                                    '<h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">📄 ' + filename + '</h4>' +
                                    '<div style="background: #f8fafc; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0;">' +
                                        content +
                                    '</div>' +
                                '</div>';
                            }
                            // For other files, show as code preview
                            return '<div style="margin-bottom: 20px;">' +
                                '<h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">📄 ' + filename + '</h4>' +
                                '<pre style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; line-height: 1.5;">' + 
                                    content.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
                                '</pre>' +
                            '</div>';
                        }).join('');
                        
                        previewContainer.innerHTML = filesHtml || '<p style="color: #94a3b8; text-align: center; padding: 40px;">No preview available</p>';
                    }
                    
                    // Close button handler
                    document.getElementById('closeWysiwyg').addEventListener('click', function() {
                        document.body.removeChild(wysiwygContainer);
                    });
                    
                    // Close on background click
                    wysiwygContainer.addEventListener('click', function(e) {
                        if (e.target === wysiwygContainer) {
                            document.body.removeChild(wysiwygContainer);
                        }
                    });
                    
                    // Preview in Browser button handler
                    document.getElementById('previewBtn-' + componentId).addEventListener('click', function() {
                        console.log('👁️ Opening preview in new window for:', componentId);
                        
                        // Create a preview HTML document with all component files
                        const cssFiles = Object.entries(component.files)
                            .filter(function([name]) { return name.endsWith('.css'); })
                            .map(function([_, content]) { return content; })
                            .join('\\n');
                            
                        const htmlFiles = Object.entries(component.files)
                            .filter(function([name]) { return name.endsWith('.html'); })
                            .map(function([_, content]) { return content; })
                            .join('\\n');
                            
                        const jsFiles = Object.entries(component.files)
                            .filter(function([name]) { return name.endsWith('.js'); })
                            .map(function([_, content]) { return content; })
                            .join('\\n');
                        
                        const previewHtml = 
                            '<!DOCTYPE html>' +
                            '<html lang="en">' +
                            '<head>' +
                                '<meta charset="UTF-8">' +
                                '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
                                '<title>Preview - ' + component.name + '</title>' +
                                '<style>' +
                                    'body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }' +
                                    '.component-preview { border: 1px solid #ddd; padding: 20px; border-radius: 8px; }' +
                                    cssFiles +
                                '</style>' +
                            '</head>' +
                            '<body>' +
                                '<h1>Component Preview: ' + component.name + '</h1>' +
                                '<div class="component-preview">' +
                                    htmlFiles +
                                '</div>' +
                                '<script>' +
                                    jsFiles +
                                '</script>' +
                            '</body>' +
                            '</html>';
                        
                        // Open in new window
                        const previewWindow = window.open('', '_blank', 'width=800,height=600');
                        previewWindow.document.write(previewHtml);
                        previewWindow.document.close();
                    });
                    
                    // Save button handler
                    document.getElementById('saveBtn-' + componentId).addEventListener('click', function() {
                        alert('💾 Save functionality coming soon! Will integrate with EditorTome.');
                    });
                    
                    // Export button handler
                    document.getElementById('exportBtn-' + componentId).addEventListener('click', function() {
                        alert('📤 Export functionality coming soon!');
                    });
                    
                    // Open in Premium Editor button handler
                    document.getElementById('openPremiumBtn-' + componentId).addEventListener('click', function() {
                        console.log('✨ Opening in Premium Editor:', componentId);
                        window.open('/editor/premium?component=' + componentId, '_blank', 'width=1400,height=900');
                    });
                    } else {
                    alert('❌ Component not found: ' + componentId);
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
                    // For HTML files, we'll display them in a preview format
                    if (filename.endsWith('.html')) {
                        // Create a preview container
                        const codeEditor = document.getElementById('codeEditor');
                        if (codeEditor) {
                            codeEditor.innerHTML = '<div style="padding: 20px; background: #f8f9fa; border-radius: 8px;"><h3>HTML Preview</h3><p>This is an HTML component file. You can view it in a browser or edit the HTML content.</p><div style="background: white; border: 1px solid #ddd; padding: 15px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; overflow-x: auto;">' + fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div></div>';
                        }
                    } else {
                        // For other file types, display as text
                        const codeEditor = document.getElementById('codeEditor');
                        if (codeEditor) {
                            codeEditor.textContent = fileContent;
                        }
                    }
                    
                    // Update file tree - safely handle missing elements
                    document.querySelectorAll('.file-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    
                    const targetFileItem = document.querySelector(\`[data-file="\${filename}"]\`);
                    if (targetFileItem) {
                        targetFileItem.classList.add('active');
                    } else {
                        console.warn(\`⚠️ File item not found for: \${filename}\`);
                    }
                }
            }

            function viewFiles(componentId) {
                console.log('📂 Viewing files for component:', componentId);
                currentComponent = componentId;
                const component = componentData[componentId];
                
                if (component) {
                    console.log('📁 Component found:', component);
                    
                    // Update UI
                    const editorTitle = document.getElementById('editorTitle');
                    const componentEditor = document.getElementById('componentEditor');
                    
                    if (editorTitle && componentEditor) {
                        editorTitle.textContent = \`\${component.name} Files\`;
                        console.log('📝 Editor title updated to:', component.name);
                        
                        componentEditor.classList.add('active');
                        console.log('✅ Editor UI updated - active class added');
                        
                        // Populate file tree with actual component files
                        const fileTree = document.getElementById('fileTree');
                        if (fileTree) {
                            fileTree.innerHTML = '';
                            const availableFiles = Object.keys(component.files);
                            
                            availableFiles.forEach((filename, index) => {
                                const fileItem = document.createElement('div');
                                fileItem.className = 'file-item';
                                fileItem.setAttribute('data-file', filename);
                                fileItem.textContent = filename;
                                
                                // Make first file active by default
                                if (index === 0) {
                                    fileItem.classList.add('active');
                                }
                                
                                // Add click handler
                                fileItem.addEventListener('click', function() {
                                    const clickedFilename = this.getAttribute('data-file');
                                    loadFile(clickedFilename);
                                });
                                
                                fileTree.appendChild(fileItem);
                            });
                            
                            // Load first file
                            if (availableFiles.length > 0) {
                                loadFile(availableFiles[0]);
                            }
                        }
                        
                        // Update component cards
                        document.querySelectorAll('.component-card').forEach(card => {
                            card.classList.remove('clicked');
                        });
                        const clickedCard = document.querySelector(\`[data-component="\${componentId}"]\`);
                        if (clickedCard) {
                            clickedCard.classList.add('clicked');
                        }
                        
                        // Scroll to the component editor
                        setTimeout(() => {
                            componentEditor.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        }, 100);
                    } else {
                        console.error('❌ Required DOM elements not found:', { editorTitle, componentEditor });
                    }
                } else {
                    alert('❌ Component not found: ' + componentId);
                }
            }

            // Initialize event listeners when DOM is loaded
            document.addEventListener('DOMContentLoaded', function() {
                // Button click handlers
                document.addEventListener('click', function(e) {
                    const target = e.target;
                    
                    if (target.matches('[data-action="open-editor"]')) {
                        const componentId = target.getAttribute('data-component');
                        openEditor(componentId);
                    } else if (target.matches('[data-action="view-files"]')) {
                        const componentId = target.getAttribute('data-component');
                        viewFiles(componentId);
                    }
                });

                // Close editor button
                document.getElementById('closeEditorBtn').addEventListener('click', closeComponent);

                // File tree is now populated dynamically in openComponent function

                console.log('🎨 Wave Reader Editor initialized successfully!');
            });
        </script>
    </body>
    </html>
  `;
  
  // Process the template to remove JSX and handle variables
  // Temporarily disable template processing to debug the structure
  // const processedTemplate = TemplateProcessor.renderComponentTemplate(template, 'Wave Reader');
  // res.send(processedTemplate);
  
  // Send the raw template for now to debug the structure
  res.send(template);
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
    // Initialize EditorTome before starting server
    console.log('📚 Initializing EditorTome...');
    await editorTome.initialize();
    console.log('📚 EditorTome initialized successfully');

    // Start listening
    app.listen(EDITOR_CONFIG.port, () => {
      console.log(`🚀 TomeConnector Editor Server running on port ${EDITOR_CONFIG.port}`);
      console.log(`🔍 Health check at http://localhost:${EDITOR_CONFIG.port}/health`);
      console.log(`🎛️  Editor status at http://localhost:${EDITOR_CONFIG.port}/api/editor/status`);
      console.log(`⚙️  Pact features at http://localhost:${EDITOR_CONFIG.port}/api/pact/features`);
      console.log(`🔍 Tracing at http://localhost:${EDITOR_CONFIG.port}/api/tracing/status`);
      console.log(`📚 Tome API at http://localhost:${EDITOR_CONFIG.port}/api/tome/components`);
      console.log(`📊 Tome state at http://localhost:${EDITOR_CONFIG.port}/api/tome/state`);
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
