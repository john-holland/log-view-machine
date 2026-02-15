/**
 * Component Middleware Index
 *
 * This module provides access to all component middleware integrations
 * including TeleportHQ, Jump Server UI, and Generic Editor.
 */

// TeleportHQ Integration
const {
  TeleportHQAdapter,
  TeleportHQConfig,
  TeleportHQComponent,
  TeleportHQTemplate,
  createTeleportHQAdapter
} = require('./teleportHQ/index.js');

const {
  TemplateManager,
  createTemplateManager
} = require('./teleportHQ/templateManager.js');

const {
  runTeleportHQDemo,
  integrateWithFishBurger
} = require('./teleportHQ/demo.js');

// Jump Server UI Integration
const {
  JumpServerUIAdapter,
  JumpServerUIConfig,
  JumpServerUIComponent,
  JumpServerUITemplate,
  createJumpServerUIAdapter
} = require('./jumpServerUI/index.js');

const {
  runJumpServerUIDemo,
  integrateWithFishBurger: integrateJumpServerWithFishBurger
} = require('./jumpServerUI/demo.js');

// Generic Editor Integration
const {
  GenericEditor,
  GenericEditorConfig,
  DotCMSComponentTemplate,
  XStateConfiguration,
  SASSComponentIdentity,
  createGenericEditor
} = require('./generic-editor/index.js');

const {
  runGenericEditorDemo,
  integrateWithFishBurger: integrateGenericEditorWithFishBurger
} = require('./generic-editor/demo.js');

// Generic Editor UI Integration
const {
  GenericEditorUI,
  createGenericEditorUI
} = require('./generic-editor/ui.js');

const {
  runGenericEditorUIDemo,
  integrateWithFishBurger: integrateGenericEditorUIWithFishBurger
} = require('./generic-editor/ui-demo.js');

// BoundaryHQ Integration
const {
  BoundaryHQAdapter,
  BoundaryHQConfig,
  BoundaryHQIdentity,
  BoundaryHQSecureComponent,
  BoundaryHQSecureStateMachine,
  createBoundaryHQAdapter
} = require('./boundaryHQ/index.js');

const {
  runBoundaryHQDemo,
  integrateWithFishBurger: integrateBoundaryHQWithFishBurger
} = require('./boundaryHQ/demo.js');

/**
 * Component Middleware Manager
 *
 * Central manager for all component middleware integrations
 */
class ComponentMiddlewareManager {
  constructor(config = {}) {
    this.config = config;
    this.teleportHQ = createTemplateManager(config.teleportHQ || {});
    this.jumpServerUI = createJumpServerUIAdapter(config.jumpServerUI || {});
    this.genericEditor = createGenericEditor(config.genericEditor || {});
    this.genericEditorUI = createGenericEditorUI(config.genericEditorUI || {});
    this.boundaryHQ = createBoundaryHQAdapter(config.boundaryHQ || {});
    this.middleware = new Map();
  }

  /**
   * Get TeleportHQ template manager
   */
  getTeleportHQ() {
    return this.teleportHQ;
  }

  /**
   * Get Jump Server UI adapter
   */
  getJumpServerUI() {
    return this.jumpServerUI;
  }

  /**
   * Get Generic Editor
   */
  getGenericEditor() {
    return this.genericEditor;
  }

  /**
   * Get Generic Editor UI
   */
  getGenericEditorUI() {
    return this.genericEditorUI;
  }

  /**
   * Get BoundaryHQ adapter
   */
  getBoundaryHQ() {
    return this.boundaryHQ;
  }

  /**
   * Register custom middleware
   */
  registerMiddleware(name, middleware) {
    this.middleware.set(name, middleware);
  }

  /**
   * Get registered middleware
   */
  getMiddleware(name) {
    return this.middleware.get(name);
  }

  /**
   * Get all registered middleware
   */
  getAllMiddleware() {
    return Array.from(this.middleware.entries());
  }

  /**
   * Initialize all middleware
   */
  async initialize() {
    console.log('Initializing component middleware...');

    // Initialize TeleportHQ
    if (this.config.teleportHQ?.enabled !== false) {
      await this.teleportHQ.initialize();
      console.log('✅ TeleportHQ middleware initialized');
    }

    // Initialize Jump Server UI
    if (this.config.jumpServerUI?.enabled !== false) {
      await this.jumpServerUI.initialize();
      console.log('✅ Jump Server UI middleware initialized');
    }

    // Initialize Generic Editor
    if (this.config.genericEditor?.enabled !== false) {
      await this.genericEditor.initialize();
      console.log('✅ Generic Editor middleware initialized');
    }

    // Initialize Generic Editor UI
    if (this.config.genericEditorUI?.enabled !== false) {
      await this.genericEditorUI.initialize();
      console.log('✅ Generic Editor UI middleware initialized');
    }

    // Initialize BoundaryHQ
    if (this.config.boundaryHQ?.enabled !== false) {
      await this.boundaryHQ.initialize();
      console.log('✅ BoundaryHQ middleware initialized');
    }

    // Initialize other middleware here as needed
    console.log('✅ Component middleware initialization complete');
  }

  /**
   * Get middleware status
   */
  getStatus() {
    return {
      teleportHQ: {
        enabled: this.config.teleportHQ?.enabled !== false,
        templates: this.teleportHQ.getCacheStats().cachedTemplates,
        connections: this.teleportHQ.getConnections().length
      },
      jumpServerUI: {
        enabled: this.config.jumpServerUI?.enabled !== false,
        templates: this.jumpServerUI.getCacheStats().cachedTemplates,
        componentLibraries: this.jumpServerUI.getCacheStats().componentLibraries,
        designSystems: this.jumpServerUI.getCacheStats().designSystems
      },
      genericEditor: {
        enabled: this.config.genericEditor?.enabled !== false,
        components: this.genericEditor.getCacheStats().components,
        stateMachines: this.genericEditor.getCacheStats().stateMachines,
        workflows: this.genericEditor.getCacheStats().workflows,
        sassIdentities: this.genericEditor.getCacheStats().sassIdentities
      },
      genericEditorUI: {
        enabled: this.config.genericEditorUI?.enabled !== false,
        isAuthenticated: this.genericEditorUI.getCurrentState().isAuthenticated,
        currentComponent: this.genericEditorUI.getCurrentState().currentComponent?.name || 'None',
        currentVersion: this.genericEditorUI.getCurrentState().currentVersion || 'None'
      },
      boundaryHQ: {
        enabled: this.config.boundaryHQ?.enabled !== false,
        identities: this.boundaryHQ.identities.size,
        secureComponents: this.boundaryHQ.secureComponents.size,
        secureStateMachines: this.boundaryHQ.secureStateMachines.size,
        accessPolicies: this.boundaryHQ.accessPolicies.size
      },
      customMiddleware: this.middleware.size,
      totalMiddleware: this.middleware.size + 5 // +5 for TeleportHQ, Jump Server UI, Generic Editor, Generic Editor UI, and BoundaryHQ
    };
  }
}

/**
 * Create component middleware manager
 */
function createComponentMiddlewareManager(config = {}) {
  return new ComponentMiddlewareManager(config);
}

// Export all component middleware integrations
module.exports = {
  // Component Middleware Manager
  ComponentMiddlewareManager,
  createComponentMiddlewareManager,

  // TeleportHQ Integration
  TeleportHQAdapter,
  TeleportHQConfig,
  TeleportHQComponent,
  TeleportHQTemplate,
  createTeleportHQAdapter,
  TemplateManager,
  createTemplateManager,
  runTeleportHQDemo,
  integrateWithFishBurger,

  // Jump Server UI Integration
  JumpServerUIAdapter,
  JumpServerUIConfig,
  JumpServerUIComponent,
  JumpServerUITemplate,
  createJumpServerUIAdapter,
  runJumpServerUIDemo,
  integrateJumpServerWithFishBurger,

  // Generic Editor Integration
  GenericEditor,
  GenericEditorConfig,
  DotCMSComponentTemplate,
  XStateConfiguration,
  SASSComponentIdentity,
  createGenericEditor,
  runGenericEditorDemo,
  integrateGenericEditorWithFishBurger,

  // Generic Editor UI Integration
  GenericEditorUI,
  createGenericEditorUI,
  runGenericEditorUIDemo,
  integrateGenericEditorUIWithFishBurger,

  // BoundaryHQ Integration
  BoundaryHQAdapter,
  BoundaryHQConfig,
  BoundaryHQIdentity,
  BoundaryHQSecureComponent,
  BoundaryHQSecureStateMachine,
  createBoundaryHQAdapter,
  runBoundaryHQDemo,
  integrateBoundaryHQWithFishBurger,

  // Convenience exports
  teleportHQ: {
    createAdapter: createTeleportHQAdapter,
    createManager: createTemplateManager,
    runDemo: runTeleportHQDemo,
    integrateWithFishBurger
  },
  jumpServerUI: {
    createAdapter: createJumpServerUIAdapter,
    runDemo: runJumpServerUIDemo,
    integrateWithFishBurger: integrateJumpServerWithFishBurger
  },
  genericEditor: {
    createEditor: createGenericEditor,
    runDemo: runGenericEditorDemo,
    integrateWithFishBurger: integrateGenericEditorWithFishBurger
  },
  genericEditorUI: {
    createUI: createGenericEditorUI,
    runDemo: runGenericEditorUIDemo,
    integrateWithFishBurger: integrateGenericEditorUIWithFishBurger
  },
  boundaryHQ: {
    createAdapter: createBoundaryHQAdapter,
    runDemo: runBoundaryHQDemo,
    integrateWithFishBurger: integrateBoundaryHQWithFishBurger
  }
}; 