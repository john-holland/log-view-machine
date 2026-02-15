/**
 * Generic Editor UI Flow
 * 
 * This module provides the complete UI flow for the generic editor including:
 * - dotCMS login and authentication
 * - Component search and selection
 * - Semantic version management
 * - Dynamic component loading and unloading
 * - State machine integration
 */

import { createGenericEditor } from './index.js';

/**
 * Generic Editor UI Configuration
 */
export class GenericEditorUIConfig {
  constructor(options = {}) {
    this.dotCMSUrl = options.dotCMSUrl || 'http://localhost:8080';
    this.dotCMSApiKey = options.dotCMSApiKey || 'demo-key';
    this.enablePersistence = options.enablePersistence !== false;
    this.enableFishBurgerIntegration = options.enableFishBurgerIntegration !== false;
    this.autoSaveInterval = options.autoSaveInterval || 30000; // 30 seconds
    this.enableAutoLoad = options.enableAutoLoad !== false;
  }
}

/**
 * Generic Editor UI
 */
export class GenericEditorUI {
  constructor(config = new GenericEditorUIConfig()) {
    this.config = config;
    this.genericEditor = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    this.isLoading = false;
    this.error = null;
    this.currentComponent = null;
    this.currentVersion = null;
    this.autoSaveTimer = null;
    this.eventListeners = new Map();
  }

  /**
   * Initialize the UI
   */
  async initialize() {
    console.log('🎨 Initializing Generic Editor UI...');
    
    try {
      // Create generic editor with UI config
                   this.genericEditor = createGenericEditor({
               enablePersistence: this.config.enablePersistence,
               enableFishBurgerIntegration: this.config.enableFishBurgerIntegration,
               persistenceConfig: {
                 dataDir: './data',
                 componentsDir: './data/components',
                 stateMachinesDir: './data/state-machines',
                 sassDir: './data/sass',
                 backupsDir: './data/backups'
               }
             });

      // Initialize the generic editor
      await this.genericEditor.initialize();
      
      // Set up auto-save if enabled
      if (this.config.enablePersistence) {
        this.setupAutoSave();
      }

      // Auto-load components if enabled
      if (this.config.enableAutoLoad) {
        await this.loadAvailableComponents();
      }

      console.log('✅ Generic Editor UI initialized');
      return { success: true, message: 'UI initialized successfully' };
      
    } catch (error) {
      console.error('❌ Failed to initialize Generic Editor UI:', error);
      this.error = error.message;
      return { success: false, error: error.message };
    }
  }

  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    this.autoSaveTimer = setInterval(async () => {
      if (this.currentComponent) {
        try {
          await this.genericEditor.saveComponent(this.currentComponent);
          console.log('  💾 Auto-saved component:', this.currentComponent.name);
        } catch (error) {
          console.error('  ❌ Auto-save failed:', error);
        }
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Login to dotCMS
   */
  async loginToDotCMS(credentials) {
    console.log('🔐 Logging into dotCMS...');
    this.isLoading = true;
    this.error = null;
    
    try {
      const loginResult = await this.simulateDotCMSLogin(credentials);
      
      if (loginResult.success) {
        this.currentUser = loginResult.user;
        this.isAuthenticated = true;
        
        // Load available components after successful login
        await this.loadAvailableComponents();
        
        return { 
          success: true, 
          user: this.currentUser, 
          message: 'Login successful' 
        };
      } else {
        throw new Error(loginResult.error);
      }
    } catch (error) {
      this.error = error.message;
      console.error(`  ❌ Login failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Simulate dotCMS login
   */
  async simulateDotCMSLogin(credentials) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.username === 'admin' && credentials.password === 'admin') {
          resolve({
            success: true,
            user: {
              id: 'admin-1',
              username: 'admin',
              email: 'admin@dotcms.com',
              role: 'admin',
              permissions: ['read', 'write', 'publish']
            }
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid credentials'
          });
        }
      }, 500);
    });
  }

  /**
   * Load available components from dotCMS
   */
  async loadAvailableComponents() {
    console.log('📦 Loading available components from dotCMS...');
    
    try {
      // Simulate loading components from dotCMS
      const components = await this.simulateLoadComponents();
      
      // Create default blank component that loads automatically
      const blankComponent = {
        id: 'blank-component',
        name: 'Blank Component',
        description: 'Default blank component - start here',
        type: 'blank',
        semanticVersions: ['1.0.0'],
        template: '<div class="blank-component" data-component-id="{{componentId}}"><!-- Start building here --></div>',
        styles: `
          .blank-component { 
            min-height: 200px; 
            border: 2px dashed #ccc; 
            padding: 20px;
            text-align: center;
            color: #666;
            background: #f9f9f9;
          }
          .blank-component:hover {
            border-color: #007bff;
            background: #f0f8ff;
          }
        `,
        stateMachine: {
          id: 'blank-state',
          name: 'Blank Component State Machine',
          config: {
            id: 'blankState',
            initial: 'empty',
            states: {
              empty: {
                on: { START_BUILDING: 'building' }
              },
              building: {
                on: { SAVE: 'saved', RESET: 'empty' }
              },
              saved: {
                on: { EDIT: 'building', PUBLISH: 'published' }
              },
              published: {
                on: { UNPUBLISH: 'saved' }
              }
            }
          }
        },
        metadata: {
          author: 'System',
          created: new Date().toISOString(),
          tags: ['default', 'blank', 'starter'],
          isDefault: true
        }
      };
      
      // Add blank component to the list and make it the default
      components.unshift(blankComponent);
      
      // Store components in generic editor
      for (const component of components) {
        await this.genericEditor.saveComponent(component);
      }
      
      // Auto-select the blank component as default
      await this.selectComponent('blank-component');
      await this.selectComponentVersion('blank-component', '1.0.0');
      
      console.log(`  ✅ Loaded ${components.length} components`);
      console.log(`  ✅ Auto-selected blank component as default`);
      return components;
      
    } catch (error) {
      console.error(`  ❌ Failed to load components: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simulate loading components from dotCMS
   */
  async simulateLoadComponents() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 'fish-burger-component',
            name: 'Fish Burger Component',
            description: 'Interactive fish burger ordering component',
            type: 'fish-burger',
            semanticVersions: ['1.0.0', '1.1.0'],
            template: `
              <div class="fish-burger-component" data-component-id="{{componentId}}">
                <div class="burger-builder">
                  <h3>Build Your Fish Burger</h3>
                  <div class="ingredients">
                    <div class="ingredient" data-ingredient="bun">Bun</div>
                    <div class="ingredient" data-ingredient="fish">Fish Patty</div>
                    <div class="ingredient" data-ingredient="lettuce">Lettuce</div>
                    <div class="ingredient" data-ingredient="tomato">Tomato</div>
                    <div class="ingredient" data-ingredient="cheese">Cheese</div>
                  </div>
                  <div class="burger-preview">
                    <div class="burger-stack"></div>
                  </div>
                  <button class="order-btn">Order Now</button>
                </div>
              </div>
            `,
            styles: `
              .fish-burger-component {
                padding: 20px;
                border: 2px solid #007bff;
                border-radius: 8px;
                background: #f8f9fa;
              }
              .burger-builder {
                text-align: center;
              }
              .ingredients {
                display: flex;
                justify-content: center;
                gap: 10px;
                margin: 20px 0;
              }
              .ingredient {
                padding: 8px 16px;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                background: white;
              }
              .ingredient:hover {
                background: #e9ecef;
              }
              .burger-preview {
                margin: 20px 0;
                min-height: 100px;
                border: 1px dashed #ccc;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .order-btn {
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
              .order-btn:hover {
                background: #0056b3;
              }
            `,
            stateMachine: {
              id: 'fish-burger-state',
              name: 'Fish Burger State Machine',
              config: {
                id: 'fishBurgerState',
                initial: 'idle',
                states: {
                  idle: {
                    on: { START_BUILDING: 'building' }
                  },
                  building: {
                    on: { ADD_INGREDIENT: 'building', COMPLETE_BUILD: 'ready' }
                  },
                  ready: {
                    on: { ORDER: 'ordering', MODIFY: 'building' }
                  },
                  ordering: {
                    on: { CONFIRM: 'confirmed', CANCEL: 'ready' }
                  },
                  confirmed: {
                    on: { RESET: 'idle' }
                  }
                }
              }
            },
            metadata: {
              author: 'Fish Burger Team',
              created: new Date().toISOString(),
              tags: ['food', 'interactive', 'burger'],
              isFishBurger: true
            }
          },
          {
            id: 'checkout-form',
            name: 'Checkout Form',
            description: 'E-commerce checkout form component',
            type: 'form',
            semanticVersions: ['1.0.0'],
            template: `
              <div class="checkout-form" data-component-id="{{componentId}}">
                <h2>Complete Your Order</h2>
                <form>
                  <input type="email" placeholder="Email" />
                  <input type="text" placeholder="Name" />
                  <button type="submit">Submit Order</button>
                </form>
              </div>
            `,
            styles: `
              .checkout-form {
                padding: 20px;
                border: 1px solid #ddd;
                border-radius: 4px;
              }
              .checkout-form input {
                display: block;
                width: 100%;
                margin: 10px 0;
                padding: 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
              }
              .checkout-form button {
                background: #28a745;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
            `,
            stateMachine: {
              id: 'checkout-state',
              name: 'Checkout State Machine',
              config: {
                id: 'checkoutState',
                initial: 'idle',
                states: {
                  idle: { on: { START: 'filling' } },
                  filling: { on: { SUBMIT: 'validating' } },
                  validating: { on: { VALID: 'success', INVALID: 'error' } },
                  success: { type: 'final' },
                  error: { on: { RETRY: 'filling' } }
                }
              }
            },
            metadata: {
              author: 'E-commerce Team',
              created: new Date().toISOString(),
              tags: ['form', 'checkout', 'ecommerce']
            }
          }
        ]);
      }, 300);
    });
  }

  /**
   * Search components
   */
  async searchComponents(query) {
    console.log(`🔍 Searching components: "${query}"`);
    
    try {
      const allComponents = this.genericEditor.getAllComponents();
      const filteredComponents = allComponents.filter(component => 
        component.name.toLowerCase().includes(query.toLowerCase()) ||
        component.description.toLowerCase().includes(query.toLowerCase()) ||
        component.type.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log(`  ✅ Found ${filteredComponents.length} matching components`);
      return filteredComponents;
      
    } catch (error) {
      console.error(`  ❌ Search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Select component
   */
  async selectComponent(componentId) {
    console.log(`📦 Selecting component: ${componentId}`);
    
    try {
      const component = this.genericEditor.getComponent(componentId);
      
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }
      
      this.currentComponent = component;
      console.log(`  ✅ Selected component: ${component.name}`);
      
      // Emit component selected event
      this.emit('componentSelected', { component });
      
      return { success: true, component };
      
    } catch (error) {
      console.error(`  ❌ Failed to select component: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get component versions
   */
  async getComponentVersions(componentId) {
    console.log(`📋 Getting versions for component: ${componentId}`);
    
    try {
      const component = this.genericEditor.getComponent(componentId);
      
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }
      
      const versions = component.semanticVersions || ['1.0.0'];
      console.log(`  ✅ Found ${versions.length} versions`);
      
      return versions;
      
    } catch (error) {
      console.error(`  ❌ Failed to get versions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Select component version
   */
  async selectComponentVersion(componentId, version) {
    console.log(`📋 Selecting version: ${version} for component: ${componentId}`);
    
    try {
      const component = this.genericEditor.getComponent(componentId);
      
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }
      
      if (!component.semanticVersions.includes(version)) {
        throw new Error(`Version ${version} not found for component ${componentId}`);
      }
      
      this.currentVersion = version;
      console.log(`  ✅ Selected version: ${version}`);
      
      // Emit version selected event
      this.emit('versionSelected', { component, version });
      
      return { success: true, version };
      
    } catch (error) {
      console.error(`  ❌ Failed to select version: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load component with version
   */
  async loadComponentWithVersion(componentId, version) {
    console.log(`📦 Loading component: ${componentId} version: ${version}`);
    
    try {
      // Select component and version
      const componentResult = await this.selectComponent(componentId);
      if (!componentResult.success) {
        throw new Error(componentResult.error);
      }
      
      const versionResult = await this.selectComponentVersion(componentId, version);
      if (!versionResult.success) {
        throw new Error(versionResult.error);
      }
      
      // Load the component into the editor
      const component = this.currentComponent;
      
      // Emit component loaded event
      this.emit('componentLoaded', { component, version });
      
      console.log(`  ✅ Loaded component: ${component.name} (${version})`);
      return { success: true, component, version };
      
    } catch (error) {
      console.error(`  ❌ Failed to load component: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unload current component
   */
  async unloadCurrentComponent() {
    console.log('📦 Unloading current component...');
    
    try {
      if (this.currentComponent) {
        const component = this.currentComponent;
        this.currentComponent = null;
        this.currentVersion = null;
        
        // Emit component unloaded event
        this.emit('componentUnloaded', { component });
        
        console.log(`  ✅ Unloaded component: ${component.name}`);
        return { success: true, component };
      } else {
        console.log('  ℹ️ No component currently loaded');
        return { success: true, component: null };
      }
      
    } catch (error) {
      console.error(`  ❌ Failed to unload component: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current state
   */
  getCurrentState() {
    return {
      isAuthenticated: this.isAuthenticated,
      currentUser: this.currentUser,
      isLoading: this.isLoading,
      error: this.error,
      currentComponent: this.currentComponent,
      currentVersion: this.currentVersion,
      editorStatus: this.genericEditor ? this.genericEditor.getStatus() : null
    };
  }

  /**
   * Event handling
   */
  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * Create new component
   */
  async createComponent(componentData) {
    console.log('📝 Creating new component...');
    
    try {
      if (!this.genericEditor) {
        throw new Error('Generic Editor not initialized');
      }
      
      // Generate unique ID for new component
      const componentId = `component-${Date.now()}`;
      const newComponent = {
        id: componentId,
        name: componentData.name,
        description: componentData.description || '',
        template: componentData.template || '',
        styles: componentData.styles || '',
        script: componentData.script || '',
        stateMachine: componentData.stateMachine || {},
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        createdBy: this.currentUser,
        lastModified: new Date().toISOString()
      };
      
      // Save component using persistence
      const savedComponent = await this.genericEditor.saveComponent(newComponent);
      
      console.log(`  ✅ Created component: ${newComponent.name}`);
      return { success: true, component: savedComponent };
      
    } catch (error) {
      console.error(`  ❌ Failed to create component: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Duplicate existing component
   */
  async duplicateComponent(componentId, newName, newDescription) {
    console.log(`📋 Duplicating component: ${componentId}`);
    
    try {
      if (!this.genericEditor) {
        throw new Error('Generic Editor not initialized');
      }
      
      // Load the original component
      const originalComponent = await this.genericEditor.loadComponent(componentId);
      if (!originalComponent) {
        throw new Error(`Component ${componentId} not found`);
      }
      
      // Create duplicate with new name and description
      const duplicateId = `component-${Date.now()}`;
      const duplicateComponent = {
        ...originalComponent,
        id: duplicateId,
        name: newName,
        description: newDescription || originalComponent.description,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        createdBy: this.currentUser,
        lastModified: new Date().toISOString(),
        duplicatedFrom: componentId
      };
      
      // Save the duplicate component
      const savedComponent = await this.genericEditor.saveComponent(duplicateComponent);
      
      console.log(`  ✅ Duplicated component: ${originalComponent.name} -> ${newName}`);
      return { success: true, component: savedComponent };
      
    } catch (error) {
      console.error(`  ❌ Failed to duplicate component: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout
   */
  async logout() {
    console.log('🚪 Logging out...');
    
    try {
      // Clear current state
      this.currentUser = null;
      this.isAuthenticated = false;
      this.currentComponent = null;
      this.currentVersion = null;
      this.error = null;
      
      // Stop auto-save
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
      
      // Emit logout event
      this.emit('logout', {});
      
      console.log('  ✅ Logged out successfully');
      return { success: true, message: 'Logged out successfully' };
      
    } catch (error) {
      console.error(`  ❌ Logout failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Create Generic Editor UI
 */
export function createGenericEditorUI(config = new GenericEditorUIConfig()) {
  return new GenericEditorUI(config);
} 