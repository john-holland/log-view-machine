/**
 * Generic Editor - Refactored with Log View Model
 * 
 * This module provides a refactored generic editor that uses the log-view-model
 * and implements a hierarchical template structure where each component is
 * exported as a standalone template.
 */

import { createViewStateMachine } from '../../../../../log-view-machine/src/core/ViewStateMachine.tsx';

// Import templates
import { GenericEditorTemplate } from './templates/generic-editor/index.js';
import { HTMLEditorTemplate } from './templates/html-editor/index.js';
import { CSSEditorTemplate } from './templates/css-editor/index.js';
import { JavaScriptEditorTemplate } from './templates/javascript-editor/index.js';
import { XStateEditorTemplate } from './templates/xstate-editor/index.js';
import { ComponentLibraryTemplate } from './templates/component-library/index.js';

/**
 * Generic Editor Configuration
 */
class GenericEditorConfig {
  constructor(config = {}) {
    this.config = {
      enablePersistence: config.enablePersistence || false,
      enableFishBurgerIntegration: config.enableFishBurgerIntegration || false,
      autoSaveInterval: config.autoSaveInterval || 0,
      ...config
    };
  }

  getConfig() {
    return this.config;
  }
}

/**
 * Generic Editor Class
 * 
 * A comprehensive editor that uses the log-view-model and composes
 * multiple editor templates into a unified interface.
 */
class GenericEditor {
  constructor(config = {}) {
    this.config = new GenericEditorConfig(config);
    this.templates = new Map();
    this.activeTemplate = null;
    this.stateMachine = null;
    
    // Initialize templates
    this.initializeTemplates();
  }

  /**
   * Initialize all available templates
   */
  initializeTemplates() {
    this.templates.set('generic-editor', GenericEditorTemplate);
    this.templates.set('html-editor', HTMLEditorTemplate);
    this.templates.set('css-editor', CSSEditorTemplate);
    this.templates.set('javascript-editor', JavaScriptEditorTemplate);
    this.templates.set('xstate-editor', XStateEditorTemplate);
    this.templates.set('component-library', ComponentLibraryTemplate);
  }

  /**
   * Create a template instance
   */
  createTemplate(templateId, config = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }
    
    return template.create({
      ...this.config.getConfig(),
      ...config
    });
  }

  /**
   * Get all available templates
   */
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template metadata
   */
  getTemplateMetadata(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }
    
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      version: template.version,
      dependencies: template.dependencies
    };
  }

  /**
   * Create the main generic editor instance
   */
  createEditor(config = {}) {
    this.stateMachine = this.createTemplate('generic-editor', config);
    return this.stateMachine;
  }

  /**
   * Get the current state machine
   */
  getStateMachine() {
    return this.stateMachine;
  }

  /**
   * Send an event to the state machine
   */
  send(event) {
    if (this.stateMachine) {
      this.stateMachine.send(event);
    }
  }

  /**
   * Get the current state
   */
  getCurrentState() {
    if (this.stateMachine) {
      return this.stateMachine.getCurrentState();
    }
    return null;
  }

  /**
   * Render the editor
   */
  render(model = {}) {
    if (this.stateMachine) {
      return this.stateMachine.render(model);
    }
    return null;
  }
}

/**
 * Factory function to create a Generic Editor instance
 */
function createGenericEditor(config = {}) {
  return new GenericEditor(config);
}

/**
 * Factory function to create a template instance
 */
function createTemplate(templateId, config = {}) {
  const editor = new GenericEditor();
  return editor.createTemplate(templateId, config);
}

/**
 * Demo function to showcase the refactored generic editor
 */
async function runGenericEditorDemo() {
  console.log('🚀 Starting Generic Editor Demo (Refactored)');
  
  try {
    // Create the main editor
    const editor = createGenericEditor({
      enablePersistence: true,
      autoSaveInterval: 5000
    });

    // Create individual template instances
    const htmlEditor = createTemplate('html-editor');
    const cssEditor = createTemplate('css-editor');
    const jsEditor = createTemplate('javascript-editor');
    const xstateEditor = createTemplate('xstate-editor');
    const componentLibrary = createTemplate('component-library');

    console.log('✅ All templates created successfully');
    console.log('📋 Available templates:', editor.getAvailableTemplates());

    // Log template metadata
    editor.getAvailableTemplates().forEach(templateId => {
      const metadata = editor.getTemplateMetadata(templateId);
      console.log(`📄 ${metadata.name} (${metadata.id}) - ${metadata.description}`);
    });

    // Create the main editor instance
    const mainEditor = editor.createEditor();
    
    console.log('🎯 Main editor created with log-view-model integration');
    console.log('📊 Current state:', mainEditor.getCurrentState());

    return {
      editor,
      mainEditor,
      templates: {
        htmlEditor,
        cssEditor,
        jsEditor,
        xstateEditor,
        componentLibrary
      }
    };

  } catch (error) {
    console.error('❌ Error in Generic Editor Demo:', error);
    throw error;
  }
}

/**
 * Integration with Fish Burger demo
 */
async function integrateWithFishBurger(fishBurgerConfig = {}) {
  console.log('🐟 Integrating Generic Editor with Fish Burger');
  
  try {
    const editor = createGenericEditor({
      enableFishBurgerIntegration: true,
      ...fishBurgerConfig
    });

    const mainEditor = editor.createEditor();
    
    // Set up Fish Burger integration
    mainEditor.send({ type: 'INTEGRATE_FISH_BURGER', config: fishBurgerConfig });
    
    console.log('✅ Generic Editor integrated with Fish Burger');
    
    return {
      editor: mainEditor,
      config: editor.config.getConfig()
    };

  } catch (error) {
    console.error('❌ Error integrating with Fish Burger:', error);
    throw error;
  }
}

// Export all components
export {
  // Main classes
  GenericEditor,
  GenericEditorConfig,
  
  // Templates
  GenericEditorTemplate,
  HTMLEditorTemplate,
  CSSEditorTemplate,
  JavaScriptEditorTemplate,
  XStateEditorTemplate,
  ComponentLibraryTemplate,
  
  // Factory functions
  createGenericEditor,
  createTemplate,
  
  // Demo functions
  runGenericEditorDemo,
  integrateWithFishBurger
};

// Template registry
export const templates = {
  'generic-editor': GenericEditorTemplate,
  'html-editor': HTMLEditorTemplate,
  'css-editor': CSSEditorTemplate,
  'javascript-editor': JavaScriptEditorTemplate,
  'xstate-editor': XStateEditorTemplate,
  'component-library': ComponentLibraryTemplate
}; 