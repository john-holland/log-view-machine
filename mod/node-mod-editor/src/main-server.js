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
import { genericeditorCaveModAdapter } from 'genericeditor-cavemod-adapter';
import { createDuckDBCaveDBAdapter } from 'duckdb-cavedb-adapter';
import { buildPersistenceRegistry } from './persistence-registry.js';
import { createDotCmsPamCaveAdapter } from 'dotcms-pam-cave-adapter';
import { createDotcmsLoginAdapter, evaluatePermission, deriveTenantFromRequest } from 'dotcms-login-adapter';
import { createEventedModLoader } from 'modload-eventedcavemodorder-adapter';
import { createDotcmsCavemodLoaderAdapter } from 'dotcms-cavemodloader-adapter';
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
import { createPythonAppCaveServiceAdapter } from 'pythonapp-caveservice-adapter';
import { createDockerStartupAdapter } from 'docker-cavestartup-adapter';
import { createContinuumCaveAdapter } from 'continuum-cave-adapter';
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
const MOD_INDEX_URL = process.env.MOD_INDEX_URL || process.env.KOTLIN_MOD_INDEX_URL || 'http://localhost:8082';

// Health check as first middleware so it never hits body parser (avoids 400 for GET /health from health-polling clients)
app.use('/health', (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.status(200).set('Content-Type', 'application/json').end(req.method === 'GET' ? JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString(), uptime: process.uptime() }) : undefined);
    return;
  }
  next();
});

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

// Cave login adapter: standardized CaveUser + session for permission middleware
const sessionStore = new Map();
const SESSION_COOKIE = 'cave_sid';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
function getSessionUser(req) {
  const cookie = req?.get?.('Cookie') || req?.headers?.cookie || '';
  const m = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  const sid = m ? m[1].trim() : null;
  if (!sid) return null;
  return sessionStore.get(sid) || null;
}
const loginAdapter = createDotcmsLoginAdapter({
  loginHandler,
  getSessionUser,
  levelOrder: ['anonymous', 'user', 'admin'],
  loggedInLevel: 'user',
});

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

// EditorLandingCave: Root landing page with features showcase
const editorLandingSpelunk = {
  route: '/',
  container: 'landing',
  childCaves: {
    features: {
      route: '/features',
      container: 'features',
      tomeId: 'features-tome',
      isModableCave: true,
    },
  },
};

// Root Cave for node-mod-editor: route/entry describe where each feature is exposed (path → handler/Tome).
// Editor childCaves: editor (main panel), library, donation. Mod metadata comes from Index.
const nodeExampleSpelunk = {
  childCaves: {
    editor: {
      route: '/editor',
      container: 'editor',
      tomeId: 'editor-tome',
      permission: '>anonymous',
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
    features: {
      route: '/features',
      container: 'features',
      tomeId: 'features-tome',
      permission: '>=anonymous',
    },
  },
};

// Create EditorLandingCave
const EditorLandingCave = Cave('editor-landing', editorLandingSpelunk);

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

// Features TomeConfig; mod metadata is fetched from Index via mod adapter fetchModMetadata
const FeaturesTomeConfig = createTomeConfig({
  id: 'features-tome',
  name: 'Features',
  description: 'Landing page features showcase',
  isModableTome: true,
  modMetadata: null,
  permission: '>=anonymous',
  machines: {
    featuresMachine: {
      id: 'features-machine',
      name: 'Features',
      xstateConfig: {
        id: 'features-machine',
        initial: 'idle',
        states: {
          idle: {
            on: { LOAD_MOD: 'modded' }
          },
          modded: {
            on: {
              INITIALIZE: 'idle',
              LOAD_MOD_COMPLETE: 'idle',
              UNLOAD_MOD: 'idle'
            }
          }
        }
      }
    }
  },
  routing: {
    basePath: '/api/features',
    routes: {
      featuresMachine: { path: '/', method: 'POST' }
    }
  }
});

const tomeConfigsList = [
  FishBurgerTomeConfig,
  EditorTomeConfig,
  LibraryTomeConfig,
  DonationTomeConfig,
  FeaturesTomeConfig,
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
const caveAdapter = expressCaveAdapter({
  app,
  registryPath: '/registry',
  cors: true,
  redirectLoginPath: '/features',
  permissionMiddleware: {
    getCurrentUser: (req) => loginAdapter.getCurrentUser(req),
    evaluatePermission,
    levelOrder: ['anonymous', 'user', 'admin'],
    getTenantName: (_cave, req) => deriveTenantFromRequest(req),
    redirectLoginPath: '/features',
    allowAnonymousPaths: ['/api/login', '/api/editor/presence', '/api/mods'],
  },
});

// Create mod adapter
const modAdapter = genericeditorCaveModAdapter({
  modIndexUrl: MOD_INDEX_URL,
  fetchModMetadata: async (modId) => {
    try {
      const response = await fetch(`${MOD_INDEX_URL}/api/mods/${modId}`);
      if (!response.ok) return undefined;
      const modConfig = await response.json();
      return modConfig.modMetadata;
    } catch (error) {
      console.error(`Failed to fetch mod metadata for ${modId}:`, error);
      return undefined;
    }
  }
});

// Evented mod loader: load mods when features machine enters "modded", unload on logout state
const { adapter: eventedModLoaderAdapter, getTenantChangeHandler } = createEventedModLoader({
  load: { 'features-tome/featuresMachine': 'modded' },
  unload: {},
  pathToTomeMachine: (path) => {
    if (path === 'features-tome/featuresMachine') return { tomeId: 'features-tome', machineId: 'featuresMachine' };
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) return { tomeId: parts[0], machineId: parts[1] };
    if (parts.length === 1) return { tomeId: parts[0], machineId: parts[0] };
    return undefined;
  },
  onLoadMods: () => { /* client refetches mod list on next visit; optional: broadcast or invalidate cache */ },
  onUnloadMods: () => {},
});

// Mod loader config (dotCMS timeout/CORS); tenant from URL when not provided
const modLoaderConfig = createDotcmsCavemodLoaderAdapter({
  timeoutMs: 15000,
  dotCmsBaseUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
});

// Python app shell registry: optional config from env or file (see PYTHON_APPS_JSON / PYTHON_APPS_CONFIG)
let pythonAppsConfig = {};
try {
  const configPath = process.env.PYTHON_APPS_CONFIG;
  const jsonEnv = process.env.PYTHON_APPS_JSON;
  if (jsonEnv && jsonEnv.trim()) {
    pythonAppsConfig = JSON.parse(jsonEnv);
  } else if (configPath) {
    const fs = await import('fs');
    const content = fs.readFileSync(configPath, 'utf8');
    pythonAppsConfig = JSON.parse(content);
  }
} catch (err) {
  logger.warn('[pythonapp-caveservice-adapter] Could not load Python apps config: ' + (err?.message || err));
}
const pythonAppAdapter = createPythonAppCaveServiceAdapter({ apps: pythonAppsConfig });

await createCaveServer({
  cave,
  tomeConfigs: tomeConfigsList,
  sections: { registry: true },
  plugins: [caveAdapter, eventedModLoaderAdapter, modAdapter, pythonAppAdapter],
});
const tomeManager = caveAdapter.getTomeManager();
if (tomeManager) {
  for (const tomeId of ['fish-burger-tome', 'editor-tome', 'library-tome', 'donation-tome', 'features-tome']) {
    const tome = tomeManager.getTome(tomeId);
    if (tome && typeof tome.synchronizeWithCave === 'function') {
      tome.synchronizeWithCave(cave);
    }
  }
}

// Continuum library proxy: when CONTINUUM_LIBRARY_URL is set, proxy /api/continuum/library/* to the continuum server (tenant from request)
createContinuumCaveAdapter({
  continuumBaseUrl: process.env.CONTINUUM_LIBRARY_URL || '',
  getTenantFromRequest: (req) => deriveTenantFromRequest(req),
  logger,
}).mount(app, '/api/continuum/library');

// App shell: run registered Python app by name (optional; requires PYTHON_APPS_JSON or PYTHON_APPS_CONFIG)
app.post('/api/app-shell/:name/run', express.json(), async (req, res) => {
  try {
    const name = req.params.name;
    const args = Array.isArray(req.body?.args) ? req.body.args : [];
    const child = await pythonAppAdapter.runAppShell(name, args);
    res.status(202).json({ status: 'started', name, args });
    child.on('close', (code) => logger.info('[app-shell] ' + name + ' exited with code ' + code));
    child.on('error', (err) => logger.warn('[app-shell] ' + name + ' error: ' + (err?.message || err)));
  } catch (err) {
    res.status(400).json({ error: err?.message || String(err) });
  }
});

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

// Favicon: avoid 404 (no icon file; 204 stops browser from retrying)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Home page – mods from Index, link to features
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Log View Machine</title>
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
            h1 { text-align: center; margin-bottom: 30px; font-size: 2.5em; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
            .nav-links { display: flex; justify-content: center; gap: 20px; margin-bottom: 40px; flex-wrap: wrap; }
            .nav-link {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                text-decoration: none;
                padding: 15px 30px;
                border-radius: 10px;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            .nav-link:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); }
            .content { background: rgba(255, 255, 255, 0.1); border-radius: 15px; padding: 30px; margin-top: 30px; }
            .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
            .feature { background: rgba(255, 255, 255, 0.1); padding: 20px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.2); }
            .feature h3 { margin-top: 0; color: #ffd700; }
            .feature-mod { border: 2px solid #ffd700; background: rgba(255, 215, 0, 0.1); }
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
            .feature-button:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3); }
            #mods-loading { color: rgba(255,255,255,0.8); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Log View Machine</h1>
            <div class="nav-links">
                <a href="/" class="nav-link">Home</a>
                <a href="/features" class="nav-link">Features (login &amp; mods)</a>
                <a href="/editor" class="nav-link">Editor</a>
                <a href="/api/teleporthq/demo" class="nav-link">TeleportHQ Demo</a>
                <a href="/health" class="nav-link">Health</a>
            </div>
            <div class="content">
                <div class="features" id="features-list">
                    <div class="feature">
                        <h3>State Management</h3>
                        <p>Advanced state machines with XState integration for complex workflows.</p>
                    </div>
                    <div class="feature">
                        <h3>Logging & Tracing</h3>
                        <p>Comprehensive logging with OpenTelemetry integration for observability.</p>
                    </div>
                    <div class="feature">
                        <h3>Component Editor</h3>
                        <p>Visual component editor with real-time preview and state machine visualization.</p>
                    </div>
                    <div class="feature">
                        <h3>TeleportHQ Integration</h3>
                        <p>Seamless integration with TeleportHQ for component generation and management.</p>
                    </div>
                    <div id="mods-container">
                        <p id="mods-loading">Loading mods…</p>
                    </div>
                </div>
            </div>
        </div>
        <script>
            (async function() {
                const container = document.getElementById('mods-container');
                try {
                    const r = await fetch('/api/mods', { credentials: 'include' });
                    const data = r.ok ? await r.json() : { mods: [] };
                    const mods = Array.isArray(data.mods) ? data.mods : [];
                    document.getElementById('mods-loading').remove();
                    mods.forEach(function(m) {
                        const div = document.createElement('div');
                        div.className = 'feature feature-mod';
                        div.setAttribute('data-mod-id', m.id);
                        div.innerHTML = '<h3>' + (m.name || m.id) + '</h3><p>' + (m.description || '') + '</p><a href="/features" class="feature-button">Open in Features</a>';
                        container.appendChild(div);
                    });
                } catch (e) {
                    document.getElementById('mods-loading').textContent = 'Mods unavailable. Try the Features page.';
                }
            })();
        </script>
    </body>
    </html>
  `);
});

// Mod API: proxy to Index (forward Authorization); use mod loader config for timeout and tenant
app.get('/api/mods', async (req, res) => {
  try {
    const tenant = deriveTenantFromRequest(req);
    const loaderConfig = modLoaderConfig.getModLoaderConfig(tenant);
    const headers = {};
    const auth = req.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    const cookie = req.get('Cookie');
    if (cookie) headers['Cookie'] = cookie;
    const controller = new AbortController();
    const timeoutId = loaderConfig.timeoutMs ? setTimeout(() => controller.abort(), loaderConfig.timeoutMs) : null;
    const r = await fetch(`${MOD_INDEX_URL}/api/mods`, { headers, signal: controller.signal }).finally(() => { if (timeoutId) clearTimeout(timeoutId); });
    const data = await r.json().catch(() => ({ mods: [] }));
    res.status(r.status).json(data);
  } catch (e) {
    logger.warn('Mod index unavailable', { error: e.message });
    res.json({ mods: [] });
  }
});

app.get('/api/mods/:modId', async (req, res) => {
  const { modId } = req.params;
  try {
    const tenant = deriveTenantFromRequest(req);
    const loaderConfig = modLoaderConfig.getModLoaderConfig(tenant);
    const headers = {};
    const auth = req.get('Authorization');
    if (auth) headers['Authorization'] = auth;
    const cookie = req.get('Cookie');
    if (cookie) headers['Cookie'] = cookie;
    const controller = new AbortController();
    const timeoutId = loaderConfig.timeoutMs ? setTimeout(() => controller.abort(), loaderConfig.timeoutMs) : null;
    const r = await fetch(`${MOD_INDEX_URL}/api/mods/${encodeURIComponent(modId)}`, { headers, signal: controller.signal }).finally(() => { if (timeoutId) clearTimeout(timeoutId); });
    if (!r.ok) {
      return res.status(r.status).json(r.status === 404 ? { error: 'Mod not found' } : await r.json().catch(() => ({})));
    }
    const data = await r.json();
    res.json(data);
  } catch (e) {
    logger.warn('Mod index unavailable', { modId, error: e.message });
    res.status(502).json({ error: 'Mod index unavailable' });
  }
});

// Features page (login, presence, mod list). Next.js may also serve /features when frontend is used.
app.get('/features', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Features</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #1a1a2e; color: #eee; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { margin-top: 0; }
        .section { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin: 16px 0; }
        .section h2 { margin-top: 0; font-size: 1.1em; }
        .login-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 10px; }
        input { padding: 10px 16px; margin: 0; border-radius: 8px; border: 1px solid #555; background: #fff; color: #222; font-size: 1rem; }
        #login-btn { padding: 10px 18px; margin: 0; border-radius: 8px; border: none; background: #667eea; color: white; font-size: 1rem; cursor: pointer; }
        #login-btn:hover { opacity: 0.9; }
        #login-status { margin-left: 8px; font-size: 14px; color: #ccc; }
        #presence-list, #mod-list { margin: 8px 0; font-size: 14px; color: #aaa; }
        .mod-card { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; margin: 8px 0; }
        .mod-card .open-demo-btn { margin-top: 10px; padding: 8px 16px; border-radius: 8px; border: none; background: #667eea; color: white; font-size: 14px; cursor: pointer; }
        .mod-card .open-demo-btn:hover { opacity: 0.9; }
        .mod-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content: center; z-index: 1000; }
        .mod-modal.open { display: flex; }
        .mod-modal-content { background: #1a1a2e; width: 90%; max-width: 900px; height: 80%; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
        .mod-modal-header { padding: 12px; background: rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
        .mod-modal-close { padding: 6px 12px; border-radius: 6px; border: 1px solid #555; background: #333; color: #eee; cursor: pointer; }
        .mod-modal-close:hover { background: #444; }
        .user-badge { display: inline-block; background: #667eea; color: white; padding: 4px 10px; border-radius: 20px; margin: 4px 4px 4px 0; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Features</h1>
        <div class="section" id="login-section">
          <h2>Login</h2>
          <div class="login-row">
            <input type="text" id="login-username" placeholder="Username" aria-label="Username" />
            <input type="password" id="login-password" placeholder="Password" aria-label="Password" />
            <button type="button" id="login-btn">Log in</button>
            <span id="login-status"></span>
          </div>
        </div>
        <div class="section">
          <h2>Who's here</h2>
          <div id="presence-list">—</div>
        </div>
        <div class="section">
          <h2>Mods</h2>
          <div id="mod-list">Loading…</div>
        </div>
      </div>
      <div class="mod-modal" id="mod-modal">
        <div class="mod-modal-content" onclick="event.stopPropagation()">
          <div class="mod-modal-header">
            <strong id="mod-modal-title">Mod Demo</strong>
            <button type="button" class="mod-modal-close" id="mod-modal-close">Close</button>
          </div>
          <iframe id="mod-modal-iframe" title="Mod demo" style="flex:1;border:none;width:100%;"></iframe>
        </div>
      </div>
      <script>
        (function() {
          var params = new URLSearchParams(window.location.search);
          var authError = params.get('auth_error');
          var message = params.get('message');
          if (authError || message) {
            console.log('[Auth redirect] auth_error=' + (authError || '') + ' message=' + (message || ''));
            try {
              var cleanUrl = window.location.origin + window.location.pathname;
              if (window.history && window.history.replaceState) {
                window.history.replaceState({}, document.title || '', cleanUrl);
              }
            } catch (e) {}
          }
        })();
        const api = (path, opts) => fetch(path, { credentials: 'include', ...opts });
        async function loadPresence() {
          try {
            const r = await api('/api/editor/presence?caveOrTomeId=features-tome');
            const list = r.ok ? await r.json() : [];
            const el = document.getElementById('presence-list');
            el.innerHTML = Array.isArray(list) && list.length ? list.map(u => '<span class="user-badge">' + (u.user || u) + '</span>').join('') : 'No one yet';
          } catch (_) { document.getElementById('presence-list').textContent = '—'; }
        }
        async function loadMods() {
          try {
            const r = await api('/api/mods');
            const data = r.ok ? await r.json() : { mods: [] };
            const mods = Array.isArray(data.mods) ? data.mods : [];
            const el = document.getElementById('mod-list');
            el.innerHTML = mods.length ? mods.map(m => {
              const demoPath = (m.entryPoints && m.entryPoints.demo) ? m.entryPoints.demo : '/fish-burger-demo';
              const serverUrl = (m.serverUrl || '').replace(/\/$/, '');
              const demoUrl = serverUrl ? (serverUrl + demoPath) : null;
              let card = '<div class="mod-card" data-mod-id="' + (m.id || '').replace(/"/g, '&quot;') + '" data-demo-url="' + (demoUrl || '').replace(/"/g, '&quot;') + '" data-mod-name="' + (m.name || m.id || '').replace(/"/g, '&quot;') + '"><strong>' + (m.name || m.id) + '</strong><br>' + (m.description || '');
              if (demoUrl) card += '<br><button type="button" class="open-demo-btn">Open Demo</button>';
              card += '</div>';
              return card;
            }).join('') : 'No mods for your account.';
            el.querySelectorAll('.open-demo-btn').forEach(function(btn) {
              btn.onclick = function() {
                var card = btn.closest('.mod-card');
                var url = card && card.getAttribute('data-demo-url');
                var name = card && card.getAttribute('data-mod-name');
                if (url) {
                  document.getElementById('mod-modal-iframe').src = url;
                  document.getElementById('mod-modal-title').textContent = (name || 'Mod') + ' – Demo';
                  document.getElementById('mod-modal').classList.add('open');
                }
              };
            });
          } catch (_) { document.getElementById('mod-list').textContent = 'Could not load mods.'; }
        }
        async function updatePresence(user, location) {
          try {
            await api('/api/editor/presence', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, location }) });
          } catch (_) {}
        }
        document.getElementById('login-btn').onclick = async () => {
          const username = document.getElementById('login-username').value.trim();
          const password = document.getElementById('login-password').value;
          if (!username || !password) { document.getElementById('login-status').textContent = 'Enter username and password'; return; }
          try {
            const r = await api('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
            const data = await r.json().catch(() => ({}));
            document.getElementById('login-status').textContent = data.success ? 'Logged in as ' + (data.user?.username || data.user?.email) : (data.error || 'Login failed');
            if (data.success) {
              var who = (data.user && (data.user.username || data.user?.email)) || username;
              await updatePresence(who, 'features-tome');
              loadMods();
              loadPresence();
            }
          } catch (e) { document.getElementById('login-status').textContent = 'Request failed'; }
        };
        document.getElementById('mod-modal-close').onclick = function() {
          document.getElementById('mod-modal').classList.remove('open');
          document.getElementById('mod-modal-iframe').src = '';
        };
        document.getElementById('mod-modal').onclick = function() {
          document.getElementById('mod-modal').classList.remove('open');
          document.getElementById('mod-modal-iframe').src = '';
        };
        loadPresence(); loadMods();
        setInterval(loadPresence, 15000);
      </script>
    </body>
    </html>
  `);
});

// Redirect legacy routes to features (no fish-burger/cart pages in editor)
app.get('/fish-burger-demo', (req, res) => res.redirect(302, '/features'));
app.get('/cart', (req, res) => res.redirect(302, '/features'));

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

// Editor login: login adapter (CaveUser + session), then DB users (activated sign-ups)
app.post('/api/login', express.json(), async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }
  let caveUser = await loginAdapter.login({ username, password });
  if (!caveUser) {
    const user = await dbUtils.getUserByUsername(username) || await dbUtils.getUserByEmail(username);
    if (user && user.password_hash === password) {
      caveUser = { id: String(user.id), username: user.username, email: user.email, permissionLevel: 'user' };
    }
  }
  if (caveUser) {
    const sessionId = crypto.randomBytes(24).toString('hex');
    sessionStore.set(sessionId, caveUser);
    res.cookie(SESSION_COOKIE, sessionId, { httpOnly: true, maxAge: SESSION_MAX_AGE_MS, sameSite: 'lax' });
    return res.json({ success: true, user: { id: caveUser.id, username: caveUser.username, email: caveUser.email } });
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

// Proxy dotCMS health so the editor (browser) uses same-origin; server uses DOTCMS_URL.
const DOTCMS_URL = (process.env.DOTCMS_URL || 'http://localhost:8080').replace(/\/$/, '');
app.get('/api/editor/dotcms-health', (req, res) => {
  const url = `${DOTCMS_URL}/api/health`;
  fetch(url, { method: 'GET' })
    .then((proxied) => {
      res.status(proxied.status).set('Content-Type', proxied.headers.get('Content-Type') || 'application/json');
      return proxied.text();
    })
    .then((body) => res.send(body))
    .catch((err) => {
      logger.debug('dotCMS health proxy error: %s', err?.message || err);
      res.status(502).json({ error: 'dotCMS unreachable', message: err?.message || 'Connection refused' });
    });
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

// Redirect legacy cart test/demo pages to features
app.get('/cart-test', (req, res) => res.redirect(302, '/features'));
app.get('/cart-integration-test', (req, res) => res.redirect(302, '/features'));
app.get('/cart-demo', (req, res) => res.redirect(302, '/features'));

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

  // Start dotCMS in development by default (unless START_DOTCMS=false). In production, only when START_DOTCMS=true.
  const startDotcms = process.env.NODE_ENV !== 'production'
    ? process.env.START_DOTCMS !== 'false'
    : process.env.START_DOTCMS === 'true';
  const dotcmsStartup = createDotcmsStartupAdapter({
    startDotcms,
    unleashIsEnabled: (name) =>
      name === 'dotcms-startup-enabled' ? Promise.resolve(startDotcms) : unleashToggle.isEnabled(name),
    dotCmsUrl: process.env.DOTCMS_URL || 'http://localhost:8080',
    logger,
    composePath: composePath || process.env.DOTCMS_COMPOSE_PATH || path.join(process.cwd(), 'docker-compose.yml'),
    composeProject,
    pipeContainerLogs: true,
  });
  await dotcmsStartup.startUp();

  // Generic Docker provisioning: when DOCKER_STARTUP_COMPOSE_PATH is set, run docker compose up -d for configured services
  const dockerStartup = createDockerStartupAdapter({
    enabled: !!process.env.DOCKER_STARTUP_COMPOSE_PATH,
    isEnabled: (name) => unleashToggle.isEnabled(name),
    toggleName: 'docker-startup-enabled',
    composePath: process.env.DOCKER_STARTUP_COMPOSE_PATH || undefined,
    composeProject: process.env.DOCKER_STARTUP_PROJECT || undefined,
    services: process.env.DOCKER_STARTUP_SERVICES ? process.env.DOCKER_STARTUP_SERVICES.split(',').map((s) => s.trim()).filter(Boolean) : ['app'],
    readinessUrl: process.env.DOCKER_STARTUP_READINESS_URL || undefined,
    readinessTimeoutMs: Number(process.env.DOCKER_STARTUP_READINESS_TIMEOUT_MS) || 90000,
    logger,
  });
  await dockerStartup.startUp();

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
    logger.info(`📋 Features: http://localhost:${port}/features`);
    logger.info(`✏️ Editor: http://localhost:${port}/editor`);
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