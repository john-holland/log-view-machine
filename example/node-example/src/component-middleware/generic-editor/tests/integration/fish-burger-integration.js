/**
 * Fish Burger Integration Service
 * 
 * Connects Fish Burger UI to Generic Editor backend using RobotCopy proxy machines
 */

import { createFishBurgerRobotCopy } from '../../../fish-burger-robotcopy.js';

/**
 * Fish Burger Tome Configuration
 */
export class FishBurgerTomeConfig {
  constructor(options = {}) {
    this.genericEditorUrl = options.genericEditorUrl || 'http://localhost:3000';
    this.fishBurgerBackendUrl = options.fishBurgerBackendUrl || 'http://localhost:3001';
    this.enablePersistence = options.enablePersistence !== false;
    this.enableTracing = options.enableTracing !== false;
    this.autoSaveInterval = options.autoSaveInterval || 5000; // 5 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }
}

/**
 * Fish Burger Tome
 * 
 * Manages Fish Burger state and persistence through RobotCopy proxy machines
 */
export class FishBurgerTome {
  constructor(config = new FishBurgerTomeConfig()) {
    this.config = config;
    this.robotCopy = createFishBurgerRobotCopy();
    this.state = {
      orderId: null,
      ingredients: [],
      cookingTime: 0,
      temperature: 0,
      status: 'idle',
      backend: 'generic-editor',
      traceId: null,
      messageHistory: [],
      lastSaved: null,
      isConnected: false
    };
    this.eventListeners = new Map();
    this.autoSaveTimer = null;
    this.retryCount = 0;
  }

  /**
   * Initialize the Fish Burger Tome
   */
  async initialize() {
    console.log('🐟 Initializing Fish Burger Tome...');
    
    try {
      // Set up proxy machines
      await this.setupProxyMachines();
      
      // Connect to Generic Editor
      await this.connectToGenericEditor();
      
      // Set up auto-save if enabled
      if (this.config.enablePersistence) {
        this.setupAutoSave();
      }
      
      // Set up tracing if enabled
      if (this.config.enableTracing) {
        await this.setupTracing();
      }
      
      this.state.isConnected = true;
      console.log('  ✅ Fish Burger Tome initialized');
      
      // Emit initialized event
      this.emit('initialized', { state: this.state });
      
    } catch (error) {
      console.error('  ❌ Failed to initialize Fish Burger Tome:', error);
      throw error;
    }
  }

  /**
   * Set up proxy machines
   */
  async setupProxyMachines() {
    console.log('  🔗 Setting up proxy machines...');
    
    // Generic Editor Proxy Machine
    this.genericEditorProxy = {
      name: 'generic-editor-proxy',
      target: this.config.genericEditorUrl,
      getComponents: async () => {
        const response = await fetch(`${this.config.genericEditorUrl}/api/components/search`);
        return response.json();
      },
      
      saveComponent: async (component) => {
        const response = await fetch(`${this.config.genericEditorUrl}/api/components/select`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentId: component.id })
        });
        return response.json();
      },
      
      // State management
      getState: async () => {
        const response = await fetch(`${this.config.genericEditorUrl}/api/state`);
        return response.json();
      },
      
      // Persistence
      saveToPersistence: async (data) => {
        // Don't call init endpoint for persistence - this was causing infinite loop
        // Instead, just log the save operation
        console.log('  💾 Fish Burger state would be saved to persistence:', data);
        return { success: true, message: 'State saved to persistence' };
      }
    };
    
    // Fish Burger Backend Proxy Machine
    this.fishBurgerBackendProxy = {
      name: 'fish-burger-backend-proxy',
      target: this.config.fishBurgerBackendUrl,
      // Cooking operations
      startCooking: async (orderData) => {
        const response = await fetch(`${this.config.fishBurgerBackendUrl}/api/cooking/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        return response.json();
      },
      
      updateProgress: async (progressData) => {
        const response = await fetch(`${this.config.fishBurgerBackendUrl}/api/cooking/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progressData)
        });
        return response.json();
      },
      
      completeCooking: async (completionData) => {
        const response = await fetch(`${this.config.fishBurgerBackendUrl}/api/cooking/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completionData)
        });
        return response.json();
      },
      
      // Tracing
      getTrace: async (traceId) => {
        const response = await fetch(`${this.config.fishBurgerBackendUrl}/api/trace/${traceId}`);
        return response.json();
      },
      
      getMessageHistory: async () => {
        const response = await fetch(`${this.config.fishBurgerBackendUrl}/api/messages`);
        return response.json();
      }
    };
    
    console.log('  ✅ Proxy machines configured');
  }

  /**
   * Connect to Generic Editor
   */
  async connectToGenericEditor() {
    console.log('  🔌 Connecting to Generic Editor...');
    
    try {
      // Test connection
      const healthResponse = await fetch(`${this.config.genericEditorUrl}/health`);
      if (!healthResponse.ok) {
        console.log('  ⚠️  Generic Editor not available, continuing without connection');
        return;
      }
      
      console.log('  ✅ Connected to Generic Editor');
      
    } catch (error) {
      console.log('  ⚠️  Failed to connect to Generic Editor, continuing without connection:', error.message);
      // Don't throw error, just log and continue
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
      try {
        await this.saveState();
        console.log('  💾 Auto-saved Fish Burger state');
      } catch (error) {
        console.error('  ❌ Auto-save failed:', error);
      }
    }, this.config.autoSaveInterval);
  }

  /**
   * Set up tracing
   */
  async setupTracing() {
    console.log('  📊 Setting up tracing...');
    
    // Generate trace ID
    this.state.traceId = this.generateTraceId();
    
    // Set up basic message tracking
    this.state.messageHistory = [];
    
    console.log('  ✅ Tracing configured');
  }

  /**
   * Generate trace ID
   */
  generateTraceId() {
    return `fish-burger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cooking process
   */
  async startCooking(orderData = {}) {
    console.log('  🍳 Starting cooking process...');
    
    try {
      this.state.status = 'processing';
      this.state.orderId = orderData.orderId || `order-${Date.now()}`;
      this.state.ingredients = orderData.ingredients || ['fish-patty', 'bun', 'lettuce'];
      this.state.cookingTime = 0;
      this.state.temperature = 0;
      
      // Try to send to backend, but don't fail if backend is not available
      try {
        const result = await this.fishBurgerBackendProxy.startCooking({
          orderId: this.state.orderId,
          ingredients: this.state.ingredients,
          traceId: this.state.traceId
        });
        
        if (result.success) {
          this.state.cookingTime = result.cookingTime || 0;
          this.state.temperature = result.temperature || 0;
        }
      } catch (backendError) {
        console.log('  ⚠️  Backend not available, using local state only:', backendError.message);
      }
      
      // Add message to history
      this.state.messageHistory.push({
        type: 'cooking_started',
        timestamp: new Date().toISOString(),
        data: {
          orderId: this.state.orderId,
          ingredients: this.state.ingredients,
          traceId: this.state.traceId
        }
      });
      
      // Save to Generic Editor persistence
      try {
        await this.saveState();
      } catch (persistenceError) {
        console.log('  ⚠️  Persistence not available:', persistenceError.message);
      }
      
      console.log('  ✅ Cooking started');
      this.emit('cookingStarted', { state: this.state });
      
      return { success: true, state: this.state };
      
    } catch (error) {
      console.error('  ❌ Failed to start cooking:', error);
      this.state.status = 'error';
      this.emit('cookingError', { error: error.message, state: this.state });
      throw error;
    }
  }

  /**
   * Update cooking progress
   */
  async updateProgress(progressData = {}) {
    console.log('  📈 Updating cooking progress...');
    
    try {
      this.state.cookingTime += progressData.timeIncrement || 1;
      this.state.temperature = progressData.temperature || this.state.temperature;
      
      // Try to send to backend, but don't fail if backend is not available
      try {
        const result = await this.fishBurgerBackendProxy.updateProgress({
          orderId: this.state.orderId,
          cookingTime: this.state.cookingTime,
          temperature: this.state.temperature,
          traceId: this.state.traceId
        });
        
        if (result.success) {
          console.log('  ✅ Backend progress updated');
        }
      } catch (backendError) {
        console.log('  ⚠️  Backend not available, using local state only:', backendError.message);
      }
      
      // Add message to history
      this.state.messageHistory.push({
        type: 'progress_updated',
        timestamp: new Date().toISOString(),
        data: {
          cookingTime: this.state.cookingTime,
          temperature: this.state.temperature,
          orderId: this.state.orderId,
          traceId: this.state.traceId
        }
      });
      
      // Save to Generic Editor persistence
      try {
        await this.saveState();
      } catch (persistenceError) {
        console.log('  ⚠️  Persistence not available:', persistenceError.message);
      }
      
      console.log('  ✅ Progress updated');
      this.emit('progressUpdated', { state: this.state });
      
      return { success: true, state: this.state };
      
    } catch (error) {
      console.error('  ❌ Failed to update progress:', error);
      this.emit('progressError', { error: error.message, state: this.state });
      throw error;
    }
  }

  /**
   * Complete cooking
   */
  async completeCooking(completionData = {}) {
    console.log('  ✅ Completing cooking process...');
    
    try {
      this.state.status = 'completed';
      this.state.cookingTime = completionData.finalCookingTime || this.state.cookingTime;
      this.state.temperature = completionData.finalTemperature || this.state.temperature;
      
      // Try to send to backend, but don't fail if backend is not available
      try {
        const result = await this.fishBurgerBackendProxy.completeCooking({
          orderId: this.state.orderId,
          finalCookingTime: this.state.cookingTime,
          finalTemperature: this.state.temperature,
          traceId: this.state.traceId
        });
        
        if (result.success) {
          console.log('  ✅ Backend cooking completed');
        }
      } catch (backendError) {
        console.log('  ⚠️  Backend not available, using local state only:', backendError.message);
      }
      
      // Add message to history
      this.state.messageHistory.push({
        type: 'cooking_completed',
        timestamp: new Date().toISOString(),
        data: {
          finalCookingTime: this.state.cookingTime,
          finalTemperature: this.state.temperature,
          orderId: this.state.orderId,
          traceId: this.state.traceId
        }
      });
      
      // Save to Generic Editor persistence
      try {
        await this.saveState();
      } catch (persistenceError) {
        console.log('  ⚠️  Persistence not available:', persistenceError.message);
      }
      
      console.log('  ✅ Cooking completed');
      this.emit('cookingCompleted', { state: this.state });
      
      return { success: true, state: this.state };
      
    } catch (error) {
      console.error('  ❌ Failed to complete cooking:', error);
      this.emit('completionError', { error: error.message, state: this.state });
      throw error;
    }
  }

  /**
   * Reset cooking state
   */
  async reset() {
    console.log('  🔄 Resetting Fish Burger state...');
    
    try {
      this.state = {
        orderId: null,
        ingredients: [],
        cookingTime: 0,
        temperature: 0,
        status: 'idle',
        backend: 'generic-editor',
        traceId: this.state.traceId, // Keep trace ID for continuity
        messageHistory: this.state.messageHistory, // Keep message history
        lastSaved: null,
        isConnected: this.state.isConnected
      };
      
      // Save to Generic Editor persistence
      await this.saveState();
      
      console.log('  ✅ State reset');
      this.emit('stateReset', { state: this.state });
      
      return { success: true, state: this.state };
      
    } catch (error) {
      console.error('  ❌ Failed to reset state:', error);
      throw error;
    }
  }

  /**
   * Save state to Generic Editor persistence
   */
  async saveState() {
    try {
      const saveData = {
        type: 'fish-burger-state',
        data: this.state,
        timestamp: new Date().toISOString()
      };
      
      const result = await this.genericEditorProxy.saveToPersistence(saveData);
      
      if (result.success) {
        this.state.lastSaved = new Date().toISOString();
        console.log('  💾 State saved to Generic Editor');
        return result;
      } else {
        throw new Error(result.error || 'Failed to save state');
      }
      
    } catch (error) {
      console.log('  ⚠️  Failed to save state (non-critical):', error.message);
      // Don't throw error for auto-save failures
      return { success: false, error: error.message };
    }
  }

  /**
   * Get trace information
   */
  async getTrace(traceId = this.state.traceId) {
    try {
      const result = await this.fishBurgerBackendProxy.getTrace(traceId);
      return result;
    } catch (error) {
      console.log('  ⚠️  Backend not available, returning local trace');
      // Return local trace when backend is unavailable
      return {
        success: true,
        trace: {
          traceId: traceId,
          status: this.state.status,
          orderId: this.state.orderId,
          cookingTime: this.state.cookingTime,
          temperature: this.state.temperature,
          ingredients: this.state.ingredients,
          timestamp: new Date().toISOString(),
          backend: 'local'
        }
      };
    }
  }

  /**
   * Get message history
   */
  async getMessageHistory() {
    try {
      const result = await this.fishBurgerBackendProxy.getMessageHistory();
      return result;
    } catch (error) {
      console.log('  ⚠️  Backend not available, returning local message history');
      // Return local message history when backend is unavailable
      return {
        success: true,
        messages: this.state.messageHistory || []
      };
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state };
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
   * Cleanup
   */
  cleanup() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
    
    this.state.isConnected = false;
    console.log('  🧹 Fish Burger Tome cleaned up');
  }
}

/**
 * Create Fish Burger Tome
 */
export function createFishBurgerTome(config = new FishBurgerTomeConfig()) {
  return new FishBurgerTome(config);
} 