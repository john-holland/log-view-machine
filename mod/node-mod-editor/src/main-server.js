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

import { createViewStateMachine, createRobotCopy, createProxyRobotCopyStateMachine, Cave, FishBurgerTomeConfig, EditorTomeConfig, createTomeConfig, createCaveServer } from 'log-view-machine';
import { expressCaveAdapter } from 'express-cave-adapter';
import { createDuckDBCaveDBAdapter } from 'duckdb-cavedb-adapter';
import { buildPersistenceRegistry } from './persistence-registry.js';
import { createDotCmsPamCaveAdapter } from 'dotcms-pam-cave-adapter';
import { setupDatabase, dbUtils } from './database/setup.js';
import crypto from 'crypto';
import { createGoogleTokenVerifier } from 'google-login-adapter';
import { createStubTokenVerifier } from 'security-adapter';
import { createStubLoginHandler } from 'login-handler-adapter';
import { createStubEmailSendAdapter, createNodemailerEmailAdapter } from 'email-send-adapter';
import { createGraphQLSchema } from './graphql/schema.js';
import { createProxyMachines } from './machines/proxy-machines.js';
import { createStateMachines } from './machines/state-machines.js';
import { setupWebSocketServer } from './websocket/server.js';
import { setupMiddleware } from './middleware/index.js';
import { setupRoutes } from './routes/index.js';
import { killProcessOnPort } from 'port-cavestartup-adapter';
import { createUnleashCaveTogglesAdapter } from 'unleash-cavetoggles-adapter';
import { createDotcmsStartupAdapter } from 'dotcms-startup-adapter';
import { createUnleashStartupAdapter } from 'unleash-cavestartup-adapter';
import { createOtelStartupAdapter } from 'opentelemetry-cavestartup-adapter';
import { createStubOtelCaveMetricsAdapter, createOtelCaveMetricsAdapter } from 'opentelemetry-cavemetrics-adapter';
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

// Rate limit: stable peak per user from 1M req/min server budget (AWS free/low tier sizing).
//   capacity = 1_000_000 req/min, target peak concurrent users = 10_000 → per_user = 100 req/min.
//   Average user (10–60 req/min active) stays under limit; 10k users at peak = 1M/min.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const SERVER_CAPACITY_REQ_PER_MIN = Number(process.env.SERVER_CAPACITY_REQ_PER_MIN) || 1_000_000;
const TARGET_PEAK_CONCURRENT_USERS = Number(process.env.TARGET_PEAK_CONCURRENT_USERS) || 10_000;
const PER_USER_REQ_PER_MIN = Math.max(60, Math.floor(SERVER_CAPACITY_REQ_PER_MIN / TARGET_PEAK_CONCURRENT_USERS));

const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: PER_USER_REQ_PER_MIN,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.originalUrl.includes('state-machines') && req.originalUrl.includes('/events')
});

const stateMachineEventsLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: PER_USER_REQ_PER_MIN,
  message: 'Too many state machine events, please try again later.'
});

const speedLimiter = slowDown({
  windowMs: RATE_LIMIT_WINDOW_MS,
  delayAfter: Math.max(1, Math.floor(PER_USER_REQ_PER_MIN * 0.5)),
  delayMs: 500
});

// Apply higher limit to state-machine events first so demo can send many Update Progress requests
app.use('/api/state-machines/:id/events', stateMachineEventsLimiter);
app.use('/api/', limiter);
app.use('/api/', speedLimiter);

// Setup CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Setup security headers (worker-src blob: for Ace workers; script-src unpkg for React-DnD if loaded from CDN)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      workerSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http://localhost:3000", "http://localhost:8080"],
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

// dotCMS PAM Cave adapter (user permissions and presence); attach to request for Tome routes
const cavePam = createDotCmsPamCaveAdapter({
  dotCmsUrl: process.env.DOTCMS_URL,
  apiKey: process.env.DOTCMS_API_KEY,
});
app.use((req, res, next) => {
  req.cavePam = cavePam;
  next();
});

// Email send adapter for magic link / sign-up (attach to request)
const LOG_VIEW_NODEMAILER_USER = (process.env.LOG_VIEW_NODEMAILER_USER || process.env.NODEMAILER_USER || '').trim();
const LOG_VIEW_NODEMAILER_APP_PASSWORD = (process.env.LOG_VIEW_NODEMAILER_APP_PASSWORD || '').trim();
const emailSendAdapter = (LOG_VIEW_NODEMAILER_USER && LOG_VIEW_NODEMAILER_APP_PASSWORD)
  ? createNodemailerEmailAdapter({ user: LOG_VIEW_NODEMAILER_USER, appPassword: LOG_VIEW_NODEMAILER_APP_PASSWORD })
  : createStubEmailSendAdapter();
app.use((req, res, next) => {
  req.emailSendAdapter = emailSendAdapter;
  next();
});

// Editor config (early so client can always fetch it)
const PUBLISH_REQUIRES_LOGIN = process.env.PUBLISH_REQUIRES_LOGIN === 'true' || process.env.PUBLISH_REQUIRES_LOGIN === '1';
const REQUIRE_EMAIL_FOR_PUBLISH = process.env.REQUIRE_EMAIL_FOR_PUBLISH === 'true' || process.env.REQUIRE_EMAIL_FOR_PUBLISH === '1';

// Auth adapters: bootstrap from env (caller passes options; no process.env inside adapter logic)
const AUTH_TOKEN_VERIFIER = process.env.AUTH_TOKEN_VERIFIER || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const tokenVerifier = (AUTH_TOKEN_VERIFIER === 'google' && GOOGLE_CLIENT_ID)
  ? createGoogleTokenVerifier({ clientId: GOOGLE_CLIENT_ID })
  : createStubTokenVerifier();

const AUTH_LOGIN_HANDLER = process.env.AUTH_LOGIN_HANDLER || 'stub';
const loginHandler = AUTH_LOGIN_HANDLER === 'stub'
  ? createStubLoginHandler({ acceptedUser: process.env.STUB_LOGIN_USER || 'admin', acceptedPassword: process.env.STUB_LOGIN_PASSWORD || 'admin' })
  : createStubLoginHandler({ acceptedUser: process.env.STUB_LOGIN_USER || 'admin', acceptedPassword: process.env.STUB_LOGIN_PASSWORD || 'admin' });

app.get('/api/editor/config', (req, res) => {
  res.json({
    publishRequiresLogin: PUBLISH_REQUIRES_LOGIN,
    requireEmailForPublish: REQUIRE_EMAIL_FOR_PUBLISH,
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    modIndexUrl: process.env.MOD_INDEX_URL || process.env.KOTLIN_MOD_INDEX_URL || '',
    ecommerceUrl: process.env.ECOMMERCE_URL || process.env.JAVA_MOD_ECOMMERCE_URL || 'http://localhost:8083'
  });
});

// Initialize database
const db = await setupDatabase();

// Create RobotCopy instance
const robotCopy = createRobotCopy();

// Root Cave for node-mod-editor: route/entry describe where each feature is exposed (path → handler/Tome).
// Editor childCaves: editor (main panel), library, cart, donation — each with route and tomeId for getRenderTarget.
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
    editor: {
      route: '/editor',
      container: 'editor',
      tomeId: 'editor-tome',
      childCaves: {
        library: {
          route: '/editor/library',
          container: 'library',
          tomeId: 'library-tome',
        },
        donation: {
          route: '/editor/donation',
          container: 'donation',
          tomeId: 'donation-tome',
        },
      },
    },
  },
};
// Library, Cart, Donation Tomes (inline so we work with current log-view-machine dist; or use LibraryTomeConfig etc. when built)
const LibraryTomeConfig = createTomeConfig({
  id: 'library-tome',
  name: 'Component Library',
  machines: { libraryMachine: { id: 'library-machine', name: 'Library', xstateConfig: { id: 'library-machine', initial: 'idle', states: { idle: { on: { OPEN: 'browsing' } }, browsing: { on: { SELECT: 'idle', CLOSE: 'idle' } } } } } },
  routing: { basePath: '/api/editor/library', routes: { libraryMachine: { path: '/', method: 'POST' } } },
});
const DonationTomeConfig = createTomeConfig({
  id: 'donation-tome',
  name: 'Donation',
  machines: { donationMachine: { id: 'donation-machine', name: 'Donation', xstateConfig: { id: 'donation-machine', initial: 'idle', states: { idle: { on: { CONNECT_WALLET: 'connected' } }, connected: { on: { DONATE: 'idle', DISCONNECT: 'idle' } } } } } },
  routing: { basePath: '/api/editor/donation', routes: { donationMachine: { path: '/', method: 'POST' } } },
});

const tomeConfigsList = [
  FishBurgerTomeConfig,
  EditorTomeConfig,
  LibraryTomeConfig,
  DonationTomeConfig,
];

// Persistence override: build registry from TomeConfig.persistence.adapter so store API uses the right backend per Tome
const cavedbFactories = { duckdb: (opts) => createDuckDBCaveDBAdapter(opts) };
try {
  const { createDynamoDBCaveDBAdapter } = await import('dynamodb-cavedb-adapter');
  cavedbFactories.dynamodb = (opts) => createDynamoDBCaveDBAdapter(opts);
} catch (_) {}
try {
  const { createRedisCaveDBAdapter } = await import('redis-cavedb-adapter');
  cavedbFactories.redis = (opts) => createRedisCaveDBAdapter(opts);
} catch (_) {}
try {
  const { createMemcacheCaveDBAdapter } = await import('memcache-cavedb-adapter');
  cavedbFactories.memcache = (opts) => createMemcacheCaveDBAdapter(opts);
} catch (_) {}
const persistenceRegistry = await buildPersistenceRegistry(tomeConfigsList, cavedbFactories);

const cave = Cave('node-mod-editor', nodeExampleSpelunk);
const caveAdapter = expressCaveAdapter({ app, registryPath: '/registry', cors: true });
await createCaveServer({
  cave,
  tomeConfigs: tomeConfigsList,
  sections: { registry: true },
  plugins: [caveAdapter],
});
const tomeManager = caveAdapter.getTomeManager();
if (tomeManager) {
  for (const tomeId of ['fish-burger-tome', 'editor-tome', 'library-tome', 'donation-tome']) {
    const tome = tomeManager.getTome(tomeId);
    if (tome && typeof tome.synchronizeWithCave === 'function') {
      tome.synchronizeWithCave(cave);
    }
  }
}

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

// Tome management routes (per-path Tome routes are registered by express-cave-adapter via FishBurgerTomeConfig.routing)
if (tomeManager) {
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
}

// Store API: use persistence registry (from TomeConfig.persistence.adapter) or fallback to duckdb per Tome
const cavedbAdapters = new Map();
function getCaveDBAdapter(tomeId) {
  const fromRegistry = persistenceRegistry.get(tomeId);
  if (fromRegistry) return fromRegistry;
  if (!cavedbAdapters.has(tomeId)) {
    cavedbAdapters.set(tomeId, createDuckDBCaveDBAdapter({ tomeId }));
  }
  return cavedbAdapters.get(tomeId);
}
app.get('/api/editor/store/:tomeId/:key', async (req, res) => {
  try {
    const { tomeId, key } = req.params;
    const adapter = getCaveDBAdapter(tomeId);
    const value = await adapter.get(key);
    res.json(value ?? null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.put('/api/editor/store/:tomeId/:key', express.json(), async (req, res) => {
  try {
    const { tomeId, key } = req.params;
    const adapter = getCaveDBAdapter(tomeId);
    await adapter.put(key, req.body ?? {});
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/api/editor/store/:tomeId/find', express.json(), async (req, res) => {
  try {
    const { tomeId } = req.params;
    const { selector, one } = req.body ?? {};
    const adapter = getCaveDBAdapter(tomeId);
    const result = one ? await adapter.findOne(selector) : await adapter.find(selector);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Generic editor component API (save/load protected by cavePam)
let genericEditorUI = null;
try {
  const { createGenericEditorUI } = await import('./component-middleware/generic-editor/ui.js');
  genericEditorUI = createGenericEditorUI({
    persistenceConfig: {
      dataDir: path.join(process.cwd(), 'src/component-middleware/generic-editor/data'),
      componentsDir: path.join(process.cwd(), 'src/component-middleware/generic-editor/data/components'),
      stateMachinesDir: path.join(process.cwd(), 'src/component-middleware/generic-editor/data/state-machines'),
      sassDir: path.join(process.cwd(), 'src/component-middleware/generic-editor/data/sass'),
      backupsDir: path.join(process.cwd(), 'src/component-middleware/generic-editor/data/backups')
    }
  });
  await genericEditorUI.initialize();
  logger.info('Generic Editor UI initialized for component API');
} catch (e) {
  logger.warn('Generic Editor UI not available', e.message);
}
function getEditorUser(req) {
  return (req.user && (req.user.username || req.user.id)) || req.get('x-user') || 'anonymous';
}
app.get('/api/components/search', async (req, res) => {
  if (!genericEditorUI) return res.status(503).json({ success: false, error: 'Generic Editor UI not initialized' });
  try {
    const query = (req.query.query || '').toString();
    const components = await genericEditorUI.searchComponents(query);
    res.json({ success: true, components: Array.isArray(components) ? components : [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.get('/api/components/:componentId/versions', async (req, res) => {
  if (!genericEditorUI) return res.status(503).json({ success: false, error: 'Generic Editor UI not initialized' });
  try {
    const { componentId } = req.params;
    const versions = await genericEditorUI.getComponentVersions(componentId);
    res.json({ success: true, versions: Array.isArray(versions) ? versions : [versions] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.post('/api/components/:id/load', express.json(), async (req, res) => {
  if (!genericEditorUI) return res.status(503).json({ success: false, error: 'Generic Editor UI not initialized' });
  try {
    const componentId = req.params.id;
    const user = getEditorUser(req);
    const pam = req.cavePam;
    if (pam && typeof pam.checkPermission === 'function') {
      const allowed = await Promise.resolve(pam.checkPermission(user, 'editor/component/' + componentId, 'read'));
      if (!allowed) return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const version = req.body?.version;
    const result = await genericEditorUI.loadComponentWithVersion(componentId, version);
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
app.post('/api/components/:id/save', express.json(), async (req, res) => {
  if (!genericEditorUI) return res.status(503).json({ success: false, error: 'Generic Editor UI not initialized' });
  try {
    const componentId = req.params.id;
    const user = getEditorUser(req);
    const pam = req.cavePam;
    if (pam && typeof pam.checkPermission === 'function') {
      const allowed = await Promise.resolve(pam.checkPermission(user, 'editor/component/' + componentId, 'write'));
      if (!allowed) return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const editor = genericEditorUI.genericEditor;
    if (!editor || typeof editor.saveComponent !== 'function') {
      return res.status(503).json({ success: false, error: 'Editor persistence not available' });
    }
    const saved = await editor.saveComponent(req.body);
    res.json({ success: true, component: saved });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/components/:id/duplicate', express.json(), async (req, res) => {
  if (!genericEditorUI) return res.status(503).json({ success: false, error: 'Generic Editor UI not initialized' });
  try {
    const componentId = req.params.id;
    const { newName, newDescription } = req.body || {};
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return res.status(400).json({ success: false, error: 'newName is required' });
    }
    const result = await genericEditorUI.duplicateComponent(componentId, newName.trim(), (newDescription && typeof newDescription === 'string') ? newDescription.trim() : '');
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message || 'Failed to duplicate component' });
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
            .feature-mod {
                border: 2px solid #ffd700;
                background: rgba(255, 215, 0, 0.1);
            }
            .feature-button {
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                font-size: 0.9em;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 10px;
            }
            .feature-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
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
                    <div class="feature feature-mod" data-mod-id="fish-burger-mod">
                        <h3>🛒 Fish Burger Cart</h3>
                        <p>Interactive shopping cart with fish burger state machine. Demonstrates mod system replacing hardcoded features.</p>
                        <button class="feature-button" onclick="loadFishBurgerMod()">Try Fish Burger Cart</button>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            async function loadFishBurgerMod() {
                try {
                    // Fetch mod configuration
                    const modResponse = await fetch('/api/mods/fish-burger-mod');
                    if (!modResponse.ok) {
                        throw new Error('Failed to load mod configuration');
                    }
                    const modConfig = await modResponse.json();
                    
                    // Load mod assets
                    const templateResponse = await fetch(modConfig.assets.templates + 'fish-burger-demo/templates/demo-template.html');
                    const template = await templateResponse.text();
                    
                    // Create mod container
                    const modContainer = document.createElement('div');
                    modContainer.id = 'fish-burger-mod-container';
                    modContainer.innerHTML = template;
                    modContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; overflow-y: auto;';
                    
                    // Add close button
                    const closeBtn = document.createElement('button');
                    closeBtn.textContent = '✕ Close';
                    closeBtn.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10001; padding: 10px 20px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;';
                    closeBtn.onclick = () => {
                        document.body.removeChild(modContainer);
                        document.body.removeChild(closeBtn);
                    };
                    
                    document.body.appendChild(modContainer);
                    document.body.appendChild(closeBtn);
                    
                    // Load mod scripts
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = modConfig.serverUrl + '/assets/js/fish-burger-demo/main.js';
                    modContainer.appendChild(script);
                    
                    // Load mod styles
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = modConfig.serverUrl + '/assets/css/fish-burger-demo/demo-styles.css';
                    document.head.appendChild(link);
                    
                } catch (error) {
                    console.error('Error loading fish burger mod:', error);
                    alert('Failed to load Fish Burger Cart mod. Please check the console for details.');
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Mod API endpoints
app.get('/api/mods', (req, res) => {
  res.json({
    mods: [
      {
        id: 'fish-burger-mod',
        name: 'Fish Burger Cart',
        description: 'Interactive shopping cart with fish burger state machine',
        version: '1.0.0',
        serverUrl: process.env.FISH_BURGER_SERVER_URL || 'http://localhost:3004',
        assets: {
          templates: '/mods/fish-burger/templates/',
          styles: '/mods/fish-burger/styles/',
          scripts: '/mods/fish-burger/scripts/'
        }
      }
    ]
  });
});

app.get('/api/mods/:modId', (req, res) => {
  const { modId } = req.params;
  if (modId === 'fish-burger-mod') {
    res.json({
      id: 'fish-burger-mod',
      name: 'Fish Burger Cart',
      description: 'Interactive shopping cart with fish burger state machine. Demonstrates mod system replacing hardcoded features.',
      version: '1.0.0',
      serverUrl: process.env.FISH_BURGER_SERVER_URL || 'http://localhost:3004',
      assets: {
        templates: '/mods/fish-burger/templates/',
        styles: '/mods/fish-burger/styles/',
        scripts: '/mods/fish-burger/scripts/'
      },
      entryPoints: {
        cart: '/mods/fish-burger/cart',
        demo: '/mods/fish-burger/demo'
      }
    });
  } else {
    res.status(404).json({ error: 'Mod not found' });
  }
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
                    let payload = {
                        timestamp: new Date().toISOString(),
                        cookingTime: cookingTime,
                        temperature: temperature
                    };
                    if (eventType === 'UPDATE_PROGRESS') {
                        payload.cookingTime = (cookingTime || 0) + 10;
                        payload.temperature = Math.min((temperature || 0) + 15, 220);
                    }
                    if (eventType === 'START_COOKING') {
                        payload.orderId = 'order-' + Date.now();
                    }
                    const response = await fetch('/api/state-machines/fish-burger/events', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            event: eventType,
                            data: payload
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        updateStatus(result);
                        addLog('info', \`Event '\${eventType}' sent successfully\`);
                    } else {
                        const errBody = await response.text();
                        let errMsg = \`Failed to send event '\${eventType}' (\${response.status})\`;
                        try {
                            const errJson = JSON.parse(errBody);
                            if (errJson.message) errMsg += ': ' + errJson.message;
                        } catch (_) {
                            if (errBody) errMsg += ': ' + errBody.slice(0, 80);
                        }
                        addLog('error', errMsg);
                    }
                } catch (error) {
                    addLog('error', \`Error sending event: \${error.message}\`);
                }
            }
            
            function addLog(level, message) {
                const logEntries = document.getElementById('log-entries');
                const logEntry = document.createElement('div');
                logEntry.className = \`log-entry log-\${level}\`;
                logEntry.textContent = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
                logEntries.appendChild(logEntry);
                logEntries.scrollTop = logEntries.scrollHeight;
            }
            
            // When cooking completes, add burger to cart and show link
            let lastAddedOrderId = null;
            async function maybeAddToCart() {
                if (currentState !== 'order_complete' || !orderId || lastAddedOrderId === orderId) return;
                lastAddedOrderId = orderId;
                try {
                    const r = await fetch('/api/cart/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            item: {
                                id: orderId,
                                name: 'Fish Burger',
                                price: 9.99,
                                orderId,
                                cookingTime,
                                temperature
                            }
                        })
                    });
                    if (r.ok) {
                        addLog('info', 'Added to cart! View cart →');
                        const cartLink = document.createElement('a');
                        cartLink.href = '/cart';
                        cartLink.textContent = ' View cart';
                        cartLink.className = 'back-link';
                        cartLink.style.marginLeft = '8px';
                        const statusEl = document.getElementById('status');
                        if (statusEl && !document.getElementById('cart-link')) {
                            cartLink.id = 'cart-link';
                            statusEl.appendChild(cartLink);
                        }
                    }
                } catch (e) {
                    addLog('error', 'Failed to add to cart: ' + e.message);
                }
            }
            function updateStatus(result) {
                currentState = result.currentState;
                document.getElementById('current-state').textContent = currentState;
                if (result.data) {
                    if (result.data.orderId != null) orderId = result.data.orderId;
                    if (result.data.cookingTime != null) cookingTime = result.data.cookingTime;
                    if (result.data.temperature != null) temperature = result.data.temperature;
                }
                document.getElementById('order-id').textContent = orderId || '-';
                document.getElementById('cooking-time').textContent = cookingTime;
                document.getElementById('temperature').textContent = temperature;
                maybeAddToCart();
            }
            // Initialize
            addLog('info', 'Fish Burger Demo initialized');
        </script>
    </body>
    </html>
  `);
});

// Cart page: receives cooked burgers, payment-free checkout
app.get('/cart', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cart – Cooked Burgers</title>
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: system-ui, sans-serif;
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                min-height: 100vh;
                color: #eee;
            }
            .container { max-width: 560px; margin: 0 auto; }
            .back-link {
                display: inline-block;
                margin-bottom: 20px;
                color: white;
                text-decoration: none;
                padding: 10px 20px;
                background: rgba(255,255,255,0.2);
                border-radius: 10px;
            }
            .back-link:hover { background: rgba(255,255,255,0.3); }
            h1 { margin: 0 0 20px; }
            .cart-list {
                background: rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 16px;
                margin: 20px 0;
                list-style: none;
            }
            .cart-list li {
                padding: 12px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .cart-list li:last-child { border-bottom: none; }
            .empty { text-align: center; color: #999; padding: 24px; }
            .total { font-size: 1.2em; margin: 16px 0; }
            .checkout-btn {
                background: linear-gradient(45deg, #2ecc71, #27ae60);
                color: white;
                border: none;
                padding: 14px 28px;
                border-radius: 25px;
                font-size: 1em;
                cursor: pointer;
            }
            .checkout-btn:hover { opacity: 0.9; }
            .checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .success-msg { background: rgba(46, 204, 113, 0.3); padding: 16px; border-radius: 10px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <a href="/fish-burger-demo" class="back-link">← Back to Fish Burger Demo</a>
            <h1>🛒 Cart</h1>
            <p>Cooked burgers ready for checkout (no payment).</p>
            <ul class="cart-list" id="cart-list"></ul>
            <p class="total" id="total-line"></p>
            <button class="checkout-btn" id="checkout-btn" disabled>Checkout (free)</button>
            <div class="success-msg" id="success-msg" style="display:none;">
                Order complete. No payment required. Thank you!
            </div>
        </div>
        <script>
            const listEl = document.getElementById('cart-list');
            const totalEl = document.getElementById('total-line');
            const btn = document.getElementById('checkout-btn');
            const successEl = document.getElementById('success-msg');
            function render(cart) {
                const items = cart?.cart?.items ?? [];
                listEl.innerHTML = '';
                if (items.length === 0) {
                    listEl.innerHTML = '<li class="empty">No items. Cook a burger and complete cooking to add it here.</li>';
                    totalEl.textContent = '';
                    btn.disabled = true;
                    return;
                }
                items.forEach(function(item) {
                    const li = document.createElement('li');
                    li.innerHTML = '<span>🍔 ' + (item.name || 'Burger') + '</span><span>$' + (item.price ?? 0).toFixed(2) + '</span>';
                    listEl.appendChild(li);
                });
                const total = (cart?.cart?.total ?? 0);
                totalEl.textContent = 'Total: $' + total.toFixed(2);
                btn.disabled = false;
            }
            fetch('/api/cart/status').then(function(r) { return r.json(); }).then(render).catch(function() {
                listEl.innerHTML = '<li class="empty">Could not load cart.</li>';
            });
            btn.addEventListener('click', function() {
                btn.disabled = true;
                fetch('/api/cart/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
                    .then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data.success) {
                            successEl.style.display = 'block';
                            listEl.innerHTML = '<li class="empty">Cart is empty.</li>';
                            totalEl.textContent = '';
                        }
                    })
                    .catch(function() { btn.disabled = false; });
            });
        </script>
    </body>
    </html>
  `);
});

// Editor: render-target for Cave getRenderTarget(path) — used by generic-editor entry to resolve container/tomeId.
app.get('/api/editor/render-target', (req, res) => {
  const requestPath = (req.query.path || req.query.p || '/editor').toString().replace(/^\.\/?|\/$/g, '') || 'editor';
  const target = cave.getRenderTarget(requestPath);
  res.json({ path: requestPath, ...target });
});

// Editor presence (dotcms-pam): who is viewing/editing; client can show "who's here".
app.get('/api/editor/presence', async (req, res) => {
  try {
    const caveOrTomeId = (req.query.caveOrTomeId || req.query.tomeId || 'editor').toString();
    const pam = req.cavePam;
    if (!pam || typeof pam.getPresence !== 'function') {
      return res.json([]);
    }
    const list = await Promise.resolve(pam.getPresence(caveOrTomeId));
    res.json(Array.isArray(list) ? list : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.post('/api/editor/presence', express.json(), async (req, res) => {
  try {
    const { user, location } = req.body || {};
    const pam = req.cavePam;
    if (!pam || typeof pam.updatePresence !== 'function' || !user || !location) {
      return res.json({ ok: true });
    }
    await Promise.resolve(pam.updatePresence(user, location));
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Editor login: uses loginHandler adapter, then DB users (activated sign-ups)
app.post('/api/login', express.json(), async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }
  let result = await loginHandler.login({ username, password });
  if (!result) {
    const user = await dbUtils.getUserByUsername(username) || await dbUtils.getUserByEmail(username);
    if (user && user.password_hash === password) {
      result = { user: { id: String(user.id), username: user.username, email: user.email } };
    }
  }
  if (result) {
    return res.json({ success: true, user: result.user });
  }
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Sign-up: store pending activation, update presence, send magic link email
app.post('/api/signup', express.json(), async (req, res) => {
  const { email, name } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ success: false, error: 'A valid email is required' });
  }
  const existingUser = await dbUtils.getUserByEmail(trimmedEmail);
  if (existingUser) {
    return res.json({ success: true, message: 'If an account exists for this email, you will receive an activation link.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await dbUtils.createPendingActivation(trimmedEmail, name || null, token, expiresAt);
  const pam = req.cavePam;
  if (pam && typeof pam.updatePresence === 'function') {
    await Promise.resolve(pam.updatePresence(trimmedEmail, 'signup'));
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const activateUrl = `${baseUrl}/editor/activate?token=${encodeURIComponent(token)}`;
  const sendEmail = req.emailSendAdapter;
  if (typeof sendEmail === 'function') {
    await sendEmail({
      to: trimmedEmail,
      subject: 'Activate your account',
      html: `<p>Click the link to activate your account and set your password:</p><p><a href="${activateUrl}">${activateUrl}</a></p><p>This link expires in 24 hours.</p>`
    });
  }
  res.json({ success: true, message: 'If an account exists for this email, you will receive an activation link.' });
});

// GET /api/editor/activate?token=... — validate token, return { valid, email? }
app.get('/api/editor/activate', async (req, res) => {
  const token = (req.query.token || '').toString().trim();
  if (!token) {
    return res.json({ valid: false });
  }
  const row = await dbUtils.getPendingActivationByToken(token);
  if (!row) {
    return res.json({ valid: false });
  }
  const expiresAt = new Date(row.expires_at).getTime();
  if (Date.now() > expiresAt) {
    return res.json({ valid: false });
  }
  res.json({ valid: true, email: row.email });
});

// POST /api/editor/activate — body { token, password }; create user, delete pending
app.post('/api/editor/activate', express.json(), async (req, res) => {
  const { token, password } = req.body || {};
  const trimmedToken = (token || '').toString().trim();
  if (!trimmedToken || !password || String(password).length < 1) {
    return res.status(400).json({ success: false, error: 'Token and password are required' });
  }
  const row = await dbUtils.getPendingActivationByToken(trimmedToken);
  if (!row) {
    return res.status(400).json({ success: false, error: 'Invalid or expired link' });
  }
  const expiresAt = new Date(row.expires_at).getTime();
  if (Date.now() > expiresAt) {
    return res.status(400).json({ success: false, error: 'Link has expired' });
  }
  const email = row.email;
  const username = email.replace(/@.*/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'user';
  const existing = await dbUtils.getUserByEmail(email);
  if (existing) {
    await dbUtils.deletePendingActivation(trimmedToken);
    return res.json({ success: true, redirectUrl: '/editor' });
  }
  const passwordHash = String(password);
  try {
    await dbUtils.createUser(username, email, passwordHash, 'user');
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT' && e.message.includes('UNIQUE')) {
      const base = username;
      for (let i = 1; i < 100; i++) {
        try {
          await dbUtils.createUser(base + i, email, passwordHash, 'user');
          break;
        } catch (_) {}
      }
    } else {
      throw e;
    }
  }
  await dbUtils.deletePendingActivation(trimmedToken);
  res.json({ success: true, redirectUrl: '/editor' });
});

// Editor component preview: build HTML from posted html/css/js (no dotCMS required)
app.post('/api/component/preview', express.json(), (req, res) => {
  const { html = '', css = '', js = '' } = req.body || {};
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${js}</script></body></html>`;
  res.type('html').send(fullHtml);
});

// Editor publish: when PUBLISH_REQUIRES_LOGIN, require valid Bearer token (tokenVerifier adapter).
app.post('/api/editor/publish', express.json(), async (req, res) => {
  if (PUBLISH_REQUIRES_LOGIN) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = token ? await tokenVerifier.verifyToken(token) : null;
    if (!user) {
      return res.status(401).json({ error: 'Sign in to publish.' });
    }
    req.publishUser = user;
  }
  const body = req.body || {};
  // Accept any payload; actual publish logic can be added later.
  res.json({ ok: true, message: 'Component published successfully!' });
});

// Editor pages: SPA-style so /editor, /editor/library, /editor/cart, /editor/donation, /editor/signup, /editor/activate serve the same shell.
app.get('/editor', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});
app.get('/editor/library', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});
app.get('/editor/donation', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});

app.get('/editor/redeem', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/redeem-tome-widget.html'));
});
app.get('/editor/signup', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});
app.get('/editor/activate', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});

app.get('/editor/redeem', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/redeem-tome-widget.html'));
});
app.get('/editor/signup', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'src/component-middleware/generic-editor/index.html'));
});
app.get('/editor/activate', (req, res) => {
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

// Start server (skip when running tests so supertest can use app without binding port)
if (process.env.SKIP_SERVER_LISTEN !== '1') {
  const composePath = process.env.DOTCMS_COMPOSE_PATH || process.env.UNLEASH_COMPOSE_PATH || process.env.OTEL_COMPOSE_PATH || undefined;
  const composeProject = process.env.DOTCMS_COMPOSE_PROJECT || process.env.UNLEASH_COMPOSE_PROJECT || process.env.OTEL_COMPOSE_PROJECT || undefined;

  const unleashToggle = createUnleashCaveTogglesAdapter(
    process.env.UNLEASH_URL && process.env.UNLEASH_CLIENT_KEY && process.env.UNLEASH_APP_NAME
      ? {
          serverless: false,
          url: process.env.UNLEASH_URL,
          clientKey: process.env.UNLEASH_CLIENT_KEY,
          appName: process.env.UNLEASH_APP_NAME,
          environment: process.env.UNLEASH_ENVIRONMENT || undefined,
          logger,
        }
      : {
          serverless: true,
          defaults: { 'dotcms-startup-enabled': false, 'unleash-startup-enabled': false, 'otel-startup-enabled': false },
          logger,
        }
  );

  const unleashStartup = createUnleashStartupAdapter({
    startUnleash: process.env.START_UNLEASH === 'true',
    unleashIsEnabled: (name) => unleashToggle.isEnabled(name),
    unleashUrl: process.env.UNLEASH_URL || undefined,
    logger,
    composePath,
    composeProject,
  });
  await unleashStartup.startUp();

  const otelStartup = createOtelStartupAdapter({
    startOtel: process.env.START_OTEL === 'true',
    otelIsEnabled: (name) => unleashToggle.isEnabled(name),
    otelEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
    logger,
    composePath,
    composeProject,
  });
  await otelStartup.startUp();

  const startDotcms = process.env.START_DOTCMS === 'true';
  const dotcmsStartup = createDotcmsStartupAdapter({
    startDotcms,
    unleashIsEnabled: (name) => unleashToggle.isEnabled(name),
    dotCmsUrl: process.env.DOTCMS_URL || undefined,
    logger,
    composePath: composePath || process.env.DOTCMS_COMPOSE_PATH,
    composeProject,
  });
  await dotcmsStartup.startUp();

  const otelEndpoint = (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '').trim();
  const otelServiceName = (process.env.OTEL_SERVICE_NAME || '').trim();
  const otelAdapter = (otelEndpoint && otelServiceName)
    ? createOtelCaveMetricsAdapter({
        endpoint: otelEndpoint.replace(/\/$/, '') + (otelEndpoint.endsWith('/v1/traces') ? '' : '/v1/traces'),
        serviceName: otelServiceName,
        serviceVersion: process.env.OTEL_SERVICE_VERSION || undefined,
        logger,
      })
    : createStubOtelCaveMetricsAdapter();
  await otelAdapter.init();

  await killProcessOnPort(port, { logger });
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
    logger.info(`🛒 Cart (cooked burgers, payment-free checkout): http://localhost:${port}/cart`);
  });
}

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