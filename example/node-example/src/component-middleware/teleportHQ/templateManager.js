const { createTeleportHQAdapter } = require('./index.js');

/**
 * Template Manager for TeleportHQ integration
 */
class TemplateManager {
  constructor(config = {}) {
    this.adapter = createTeleportHQAdapter(config);
    this.templateCache = new Map();
    this.templateStates = new Map();
  }

  /**
   * Load and cache a template
   */
  async loadTemplate(templateId, options = {}) {
    try {
      const template = await this.adapter.loadTemplate(templateId);
      
      // Cache the template
      this.templateCache.set(templateId, {
        template,
        loadedAt: new Date(),
        options
      });

      console.log(`Template ${templateId} loaded and cached`);
      return template;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached template
   */
  getCachedTemplate(templateId) {
    return this.templateCache.get(templateId);
  }

  /**
   * Create ViewStateMachine from cached template
   */
  createViewStateMachine(templateId, initialState = {}) {
    const cached = this.getCachedTemplate(templateId);
    if (!cached) {
      throw new Error(`Template ${templateId} not cached. Load it first with loadTemplate().`);
    }

    const viewStateMachine = this.adapter.createViewStateMachineFromTemplate(templateId, initialState);
    
    // Store initial state
    this.templateStates.set(templateId, initialState);
    
    return viewStateMachine;
  }

  /**
   * Update template state
   */
  updateTemplateState(templateId, updates) {
    const currentState = this.templateStates.get(templateId) || {};
    const newState = { ...currentState, ...updates };
    this.templateStates.set(templateId, newState);
    
    // Export to TeleportHQ if enabled
    this.adapter.exportToTeleportHQ(templateId, newState);
    
    return newState;
  }

  /**
   * Get template state
   */
  getTemplateState(templateId) {
    return this.templateStates.get(templateId) || {};
  }

  /**
   * Clear template cache
   */
  clearCache(templateId = null) {
    if (templateId) {
      this.templateCache.delete(templateId);
      this.templateStates.delete(templateId);
      console.log(`Cleared cache for template ${templateId}`);
    } else {
      this.templateCache.clear();
      this.templateStates.clear();
      console.log('Cleared all template cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedTemplates: this.templateCache.size,
      templateStates: this.templateStates.size,
      cacheEntries: Array.from(this.templateCache.entries()).map(([id, data]) => ({
        templateId: id,
        name: data.template.name,
        loadedAt: data.loadedAt,
        options: data.options
      }))
    };
  }

  /**
   * Validate template compatibility
   */
  validateTemplate(templateId) {
    const cached = this.getCachedTemplate(templateId);
    if (!cached) {
      return { valid: false, error: 'Template not found in cache' };
    }

    const { template } = cached;
    const issues = [];

    // Check for required components
    const requiredComponents = ['Button', 'Input', 'Container'];
    const missingComponents = requiredComponents.filter(type => 
      template.getComponentsByType(type).length === 0
    );

    if (missingComponents.length > 0) {
      issues.push(`Missing required components: ${missingComponents.join(', ')}`);
    }

    // Check for callback definitions
    const componentsWithCallbacks = template.components.filter(comp => 
      Object.keys(comp.callbacks).length > 0
    );

    if (componentsWithCallbacks.length === 0) {
      issues.push('No components with callbacks defined');
    }

    // Check for state variables
    if (Object.keys(template.variables).length === 0) {
      issues.push('No template variables defined');
    }

    return {
      valid: issues.length === 0,
      issues,
      template: {
        id: template.id,
        name: template.name,
        componentCount: template.components.length,
        variableCount: Object.keys(template.variables).length
      }
    };
  }

  /**
   * Create template connection
   */
  connectTemplates(sourceTemplateId, targetTemplateId, config = {}) {
    return this.adapter.connectTemplates(sourceTemplateId, targetTemplateId, config);
  }

  /**
   * Disconnect templates
   */
  disconnectTemplates(connectionId) {
    return this.adapter.disconnectTemplates(connectionId);
  }

  /**
   * Get all connections
   */
  getConnections() {
    return this.adapter.getConnections();
  }

  /**
   * Sync template with TeleportHQ
   */
  syncTemplate(templateId) {
    const viewStateMachine = this.adapter.getViewStateMachine(templateId);
    if (viewStateMachine) {
      this.adapter.syncWithTeleportHQ(viewStateMachine, templateId);
      console.log(`Synced template ${templateId} with TeleportHQ`);
    } else {
      console.warn(`No ViewStateMachine found for template ${templateId}`);
    }
  }

  /**
   * Export all template states to TeleportHQ
   */
  async exportAllStates() {
    const promises = Array.from(this.templateStates.entries()).map(([templateId, state]) =>
      this.adapter.exportToTeleportHQ(templateId, state)
    );

    try {
      await Promise.all(promises);
      console.log(`Exported ${promises.length} template states to TeleportHQ`);
    } catch (error) {
      console.error('Error exporting template states:', error);
    }
  }
}

/**
 * Create template manager
 */
function createTemplateManager(config = {}) {
  return new TemplateManager(config);
}

module.exports = {
  TemplateManager,
  createTemplateManager,
}; 