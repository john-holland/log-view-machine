/**
 * Generic Editor Server
 * 
 * Simple Express server for testing the Generic Editor with dotCMS integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

import { createGenericEditorUI } from './ui.js';
import { createFishBurgerTome } from './fish-burger-integration.js';
import { startServer as startFishBurgerBackend } from './fish-burger-backend.js';

const execAsync = promisify(exec);

dotenv.config();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'generic-editor' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development to allow all inline scripts
}));
app.use(cors());
app.use(compression());

// Rate limiting - disabled for testing
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 1000 // limit each IP to 1000 requests per windowMs
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(__dirname));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Initialize Generic Editor UI
let genericEditorUI = null;
let fishBurgerTome = null;
let fishBurgerBackend = null;

async function initializeGenericEditor() {
  try {
    console.log('🎨 Initializing Generic Editor with Fish Burger integration...');
    
    // Initialize Generic Editor UI
    genericEditorUI = createGenericEditorUI({
      enablePersistence: false, // Disabled to prevent loops
      enableFishBurgerIntegration: false, // Disabled to prevent loops
      enableXStateVisualizer: true,
      enableSunEditor: true,
      enableAceEditor: true,
      enableReactDnD: true,
      enableSASSIdentityManagement: true,
      enableComponentIdentity: true,
      enableStyleManagement: true,
      autoSaveInterval: 0, // Disabled auto-save
      enableAutoLoad: true
    });

    const result = await genericEditorUI.initialize();
    
    if (result.success) {
      logger.info('Generic Editor UI initialized successfully');
    } else {
      logger.error('Failed to initialize Generic Editor UI:', result.error);
      throw new Error(result.error);
    }
    
    // Initialize Fish Burger Tome (disabled to prevent infinite loop)
    // fishBurgerTome = createFishBurgerTome({
    //   genericEditorUrl: 'http://localhost:3000',
    //   fishBurgerBackendUrl: 'http://localhost:3001',
    //   enablePersistence: true,
    //   enableTracing: true
    // });
    
    // await fishBurgerTome.initialize();
    // logger.info('Fish Burger Tome initialized successfully');
    
    // Note: Fish Burger Backend would be started separately
    // fishBurgerBackend = startFishBurgerBackend();
    // logger.info('Fish Burger Backend started successfully');
    
    console.log('✅ Generic Editor with Fish Burger integration initialized');
    
  } catch (error) {
    logger.error('Error initializing Generic Editor:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'generic-editor',
    version: '1.0.0'
  });
});

// Initialize endpoint
app.post('/api/init', async (req, res) => {
  try {
    if (!genericEditorUI) {
      await initializeGenericEditor();
    }
    
    const status = genericEditorUI.getCurrentState();
    
    res.json({
      success: true,
      message: 'Generic Editor initialized',
      status
    });
  } catch (error) {
    logger.error('Init error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    if (!genericEditorUI) {
      await initializeGenericEditor();
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const result = await genericEditorUI.loginToDotCMS({ username, password });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Component search endpoint
app.get('/api/components/search', async (req, res) => {
  try {
    if (!genericEditorUI) {
      return res.status(400).json({
        success: false,
        error: 'Generic Editor not initialized'
      });
    }

    const { query = '' } = req.query;
    const components = await genericEditorUI.searchComponents(query);
    
    res.json({
      success: true,
      components,
      count: components.length
    });
  } catch (error) {
    logger.error('Component search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Component selection endpoint
app.post('/api/components/select', async (req, res) => {
  try {
    if (!genericEditorUI) {
      return res.status(400).json({
        success: false,
        error: 'Generic Editor not initialized'
      });
    }

    const { componentId } = req.body;
    
    if (!componentId) {
      return res.status(400).json({
        success: false,
        error: 'Component ID is required'
      });
    }

    const result = await genericEditorUI.selectComponent(componentId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Component selection error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Component versions endpoint
app.get('/api/components/:componentId/versions', async (req, res) => {
  try {
    if (!genericEditorUI) {
      return res.status(400).json({
        success: false,
        error: 'Generic Editor not initialized'
      });
    }

    const { componentId } = req.params;
    const versions = await genericEditorUI.getComponentVersions(componentId);
    
    res.json({
      success: true,
      componentId,
      versions,
      count: versions.length
    });
  } catch (error) {
    logger.error('Component versions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Component load endpoint
app.post('/api/components/:componentId/load', async (req, res) => {
  try {
    if (!genericEditorUI) {
      return res.status(400).json({
        success: false,
        error: 'Generic Editor not initialized'
      });
    }

    const { componentId } = req.params;
    const { version } = req.body;
    
    if (!version) {
      return res.status(400).json({
        success: false,
        error: 'Version is required'
      });
    }

    const result = await genericEditorUI.loadComponentWithVersion(componentId, version);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    logger.error('Component load error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Current state endpoint
app.get('/api/state', (req, res) => {
  try {
    if (!genericEditorUI) {
      return res.status(400).json({
        success: false,
        error: 'Generic Editor not initialized'
      });
    }

    const state = genericEditorUI.getCurrentState();
    
    res.json({
      success: true,
      state
    });
  } catch (error) {
    logger.error('State error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Demo endpoint
app.get('/api/demo', async (req, res) => {
  try {
    if (!genericEditorUI) {
      await initializeGenericEditor();
    }

    const state = genericEditorUI.getCurrentState();
    
    res.json({
      success: true,
      message: 'Generic Editor Demo',
      state,
      features: {
        persistence: 'enabled',
        fishBurgerIntegration: 'enabled',
        autoSave: 'enabled',
        blankComponent: 'available',
        componentSearch: 'available',
        versionManagement: 'available'
      }
    });
  } catch (error) {
    logger.error('Demo error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Logout endpoint
app.post('/api/logout', async (req, res) => {
  try {
    if (!genericEditorUI) {
      return res.status(400).json({
        success: false,
        error: 'Generic Editor not initialized'
      });
    }

    const result = await genericEditorUI.logout();
    
    res.json(result);
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fish Burger UI endpoint
app.get('/api/fish-burger', (req, res) => {
  res.json({
    success: true,
    message: 'Fish Burger UI endpoint',
    config: {
      genericEditorUrl: 'http://localhost:3000',
      fishBurgerBackendUrl: 'http://localhost:3001',
      enablePersistence: true,
      enableTracing: true
    },
    tome: fishBurgerTome ? {
      isConnected: fishBurgerTome.state.isConnected,
      status: fishBurgerTome.state.status,
      orderId: fishBurgerTome.state.orderId,
      traceId: fishBurgerTome.state.traceId
    } : null
  });
});

// Fish Burger Tome state endpoint
app.get('/api/fish-burger/state', (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  res.json({
    success: true,
    state: fishBurgerTome.getState()
  });
});

// Fish Burger Tome actions
app.post('/api/fish-burger/start-cooking', async (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  try {
    const result = await fishBurgerTome.startCooking(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/fish-burger/update-progress', async (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  try {
    const result = await fishBurgerTome.updateProgress(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/fish-burger/complete-cooking', async (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  try {
    const result = await fishBurgerTome.completeCooking(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/fish-burger/reset', async (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  try {
    const result = await fishBurgerTome.reset();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fish Burger Trace endpoint
app.get('/api/fish-burger/trace', async (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  try {
    const trace = await fishBurgerTome.getTrace();
    res.json({
      success: true,
      trace: trace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fish Burger Message History endpoint
app.get('/api/fish-burger/messages', async (req, res) => {
  if (!fishBurgerTome) {
    return res.status(503).json({
      success: false,
      error: 'Fish Burger Tome not initialized'
    });
  }
  
  try {
    const messages = await fishBurgerTome.getMessageHistory();
    res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// dotCMS Component Search endpoint
app.get('/api/components/search', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const query = req.query.query || '';
    const result = await genericEditorUI.searchComponents(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// dotCMS Component Load endpoint
app.post('/api/components/:id/load', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentId = req.params.id;
    const version = req.body.version;
    const result = await genericEditorUI.loadComponentWithVersion(componentId, version);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// dotCMS Component Save endpoint
app.post('/api/components/:id/save', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentId = req.params.id;
    const componentData = req.body;
    const result = await genericEditorUI.saveComponent(componentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// dotCMS Component Publish endpoint
app.post('/api/components/:id/publish', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentId = req.params.id;
    const version = req.body.version;
    const result = await genericEditorUI.publishComponent(componentId, version);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new component endpoint
app.post('/api/components/create', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentData = req.body;
    const result = await genericEditorUI.createComponent(componentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Duplicate component endpoint
app.post('/api/components/:id/duplicate', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentId = req.params.id;
    const { newName, newDescription } = req.body;
    const result = await genericEditorUI.duplicateComponent(componentId, newName, newDescription);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Git commit endpoint (developer mode only)
app.post('/api/components/:id/commit', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentId = req.params.id;
    const { includeInEditorSrc, commitMessage, developerMode } = req.body;
    
    // Only allow git commit if developer mode is enabled and include in editor src is checked
    if (!developerMode || !includeInEditorSrc) {
      return res.status(403).json({
        success: false,
        error: 'Git commit requires developer mode and "Include in Editor Src" to be enabled'
      });
    }
    
    const result = await performGitCommit(componentId, commitMessage);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// dotCMS persistence replication endpoint
app.post('/api/components/:id/persist', async (req, res) => {
  if (!genericEditorUI) {
    return res.status(503).json({
      success: false,
      error: 'Generic Editor UI not initialized'
    });
  }
  
  try {
    const componentId = req.params.id;
    const componentData = req.body;
    const result = await replicateDotCMSPersistence(componentId, componentData);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Generic Editor',
    version: '1.0.0',
    description: 'Generic Editor with dotCMS Integration, Fish Burger Integration, and Local Persistence',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: 'GET /health',
      demo: 'GET /api/demo',
      init: 'POST /api/init',
      login: 'POST /api/login',
      logout: 'POST /api/logout',
      search: 'GET /api/components/search',
      select: 'POST /api/components/select',
      versions: 'GET /api/components/:id/versions',
      load: 'POST /api/components/:id/load',
      save: 'POST /api/components/:id/save',
      publish: 'POST /api/components/:id/publish',
      create: 'POST /api/components/create',
      duplicate: 'POST /api/components/:id/duplicate',
      commit: 'POST /api/components/:id/commit',
      persist: 'POST /api/components/:id/persist',
      state: 'GET /api/state',
      fishBurger: 'GET /api/fish-burger',
      fishBurgerState: 'GET /api/fish-burger/state',
      fishBurgerStartCooking: 'POST /api/fish-burger/start-cooking',
      fishBurgerUpdateProgress: 'POST /api/fish-burger/update-progress',
      fishBurgerCompleteCooking: 'POST /api/fish-burger/complete-cooking',
      fishBurgerReset: 'POST /api/fish-burger/reset',
      fishBurgerTrace: 'GET /api/fish-burger/trace',
      fishBurgerMessages: 'GET /api/fish-burger/messages'
    },
    features: {
      persistence: 'enabled',
      fishBurgerIntegration: 'enabled',
      autoSave: 'enabled',
      blankComponent: 'available',
      componentSearch: 'available',
      versionManagement: 'available'
    },
    quickStart: {
      health: 'curl http://localhost:3000/health',
      demo: 'curl http://localhost:3000/api/demo',
      login: 'curl -X POST http://localhost:3000/api/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\'',
      search: 'curl "http://localhost:3000/api/components/search?query=fish"'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/**
 * Perform git commit for component changes
 */
async function performGitCommit(componentId, commitMessage) {
  try {
    console.log(`🔧 Performing git commit for component: ${componentId}`);
    
    // Check if we're in a git repository
    const { stdout: gitStatus } = await execAsync('git status --porcelain');
    
    if (!gitStatus.trim()) {
      return {
        success: false,
        error: 'No changes to commit'
      };
    }
    
    // Add all changes
    await execAsync('git add .');
    console.log('  ✅ Added changes to git');
    
    // Create commit message if not provided
    const finalCommitMessage = commitMessage || `Update component ${componentId} - ${new Date().toISOString()}`;
    
    // Commit changes
    const { stdout: commitOutput } = await execAsync(`git commit -m "${finalCommitMessage}"`);
    console.log('  ✅ Committed changes:', commitOutput.trim());
    
    // Get commit hash
    const { stdout: commitHash } = await execAsync('git rev-parse HEAD');
    
    return {
      success: true,
      message: 'Changes committed successfully',
      commitHash: commitHash.trim(),
      commitMessage: finalCommitMessage,
      componentId: componentId
    };
    
  } catch (error) {
    console.error('  ❌ Git commit failed:', error.message);
    return {
      success: false,
      error: `Git commit failed: ${error.message}`
    };
  }
}

/**
 * Replicate dotCMS persistence
 */
async function replicateDotCMSPersistence(componentId, componentData) {
  try {
    console.log(`💾 Replicating dotCMS persistence for component: ${componentId}`);
    
    // Create dotCMS resource structure
    const dotCMSResource = {
      id: componentId,
      name: componentData.name,
      description: componentData.description,
      type: 'component',
      version: componentData.version || '1.0.0',
      template: componentData.template,
      styles: componentData.styles,
      script: componentData.script,
      stateMachine: componentData.stateMachine,
      metadata: {
        createdBy: componentData.createdBy || 'system',
        createdAt: componentData.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        lastModifiedBy: componentData.lastModifiedBy || 'system',
        status: 'active',
        publishStatus: 'draft',
        workflowState: 'draft',
        tags: componentData.tags || [],
        categories: componentData.categories || []
      },
      permissions: {
        read: ['anonymous', 'authenticated'],
        write: ['admin', 'developer'],
        publish: ['admin'],
        delete: ['admin']
      },
      workflow: {
        currentState: 'draft',
        availableTransitions: ['submit_for_review', 'publish'],
        history: []
      },
      review: {
        status: 'not_submitted',
        reviewers: [],
        requiredApprovals: 2,
        approvals: [],
        comments: []
      }
    };
    
    // Save to local dotCMS replication storage
    const dotCMSDir = path.join(process.cwd(), 'data', 'dotcms-replication');
    await fs.mkdir(dotCMSDir, { recursive: true });
    
    const resourcePath = path.join(dotCMSDir, `${componentId}.json`);
    await fs.writeFile(resourcePath, JSON.stringify(dotCMSResource, null, 2));
    
    console.log(`  ✅ Saved dotCMS resource: ${resourcePath}`);
    
    // Create version history
    const versionHistoryPath = path.join(dotCMSDir, `${componentId}-versions.json`);
    const versionHistory = {
      componentId: componentId,
      versions: [
        {
          version: componentData.version || '1.0.0',
          timestamp: new Date().toISOString(),
          changes: 'Initial version',
          author: componentData.createdBy || 'system',
          status: 'active'
        }
      ]
    };
    
    await fs.writeFile(versionHistoryPath, JSON.stringify(versionHistory, null, 2));
    console.log(`  ✅ Saved version history: ${versionHistoryPath}`);
    
    // Create workflow history
    const workflowHistoryPath = path.join(dotCMSDir, `${componentId}-workflow.json`);
    const workflowHistory = {
      componentId: componentId,
      workflowHistory: [
        {
          action: 'created',
          timestamp: new Date().toISOString(),
          user: componentData.createdBy || 'system',
          state: 'draft',
          comment: 'Component created'
        }
      ]
    };
    
    await fs.writeFile(workflowHistoryPath, JSON.stringify(workflowHistory, null, 2));
    console.log(`  ✅ Saved workflow history: ${workflowHistoryPath}`);
    
    return {
      success: true,
      message: 'dotCMS persistence replicated successfully',
      componentId: componentId,
      resourcePath: resourcePath,
      versionHistoryPath: versionHistoryPath,
      workflowHistoryPath: workflowHistoryPath,
      dotCMSResource: dotCMSResource
    };
    
  } catch (error) {
    console.error('  ❌ dotCMS persistence replication failed:', error.message);
    return {
      success: false,
      error: `dotCMS persistence replication failed: ${error.message}`
    };
  }
}

// Start server
async function startServer() {
  try {
    await initializeGenericEditor();
    
    app.listen(PORT, () => {
      logger.info(`Generic Editor server running on port ${PORT}`);
      console.log(`🚀 Generic Editor server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🎨 Demo: http://localhost:${PORT}/api/demo`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer(); 
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer(); 