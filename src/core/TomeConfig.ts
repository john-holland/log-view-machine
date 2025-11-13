import React from 'react';
import { LazyTomeManager } from './TomeAdapters';

/**
 * TomeConfig - Configuration for Tome routing and state management
 * 
 * This interface defines how tomes can be configured with routing support,
 * allowing each tome to insert gracefully into a routing hierarchy.
 */

export interface TomeMachineConfig {
  id: string;
  name: string;
  description?: string;
  xstateConfig: any;
  context?: Record<string, any>;
  dependencies?: string[];
}

export interface TomeBinding {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  middleware?: string[];
  guards?: string[];
  transformers?: {
    input?: (data: any) => any;
    output?: (data: any) => any;
  };
}

export interface TomeRouteConfig {
  basePath?: string;
  middleware?: string[];
  cors?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  authentication?: {
    required: boolean;
    type?: 'jwt' | 'api-key' | 'session';
  };
}

/**
 * TomeRenderContainer type for wrapping rendered views
 * Supports React components, element types, or render functions
 */
export type TomeRenderContainer = 
  | React.ComponentType<{ children?: React.ReactNode; className?: string }>
  | React.ElementType
  | ((props: Partial<{ children?: React.ReactNode; className?: string }>) => React.ReactNode);

export interface TomeConfig {
  id: string;
  name: string;
  description?: string;
  version?: string;
  
  // Machine configurations
  machines: Record<string, TomeMachineConfig>;
  
  // Routing configuration
  routing?: {
    basePath?: string;
    routes?: Record<string, TomeBinding>;
    middleware?: string[];
    cors?: boolean;
    rateLimit?: {
      windowMs: number;
      max: number;
    };
    authentication?: {
      required: boolean;
      type?: 'jwt' | 'api-key' | 'session';
    };
  };
  
  // Shared context for all machines in the tome
  context?: Record<string, any>;
  
  // Dependencies and plugins
  dependencies?: string[];
  plugins?: string[];
  
  // GraphQL configuration
  graphql?: {
    enabled: boolean;
    schema?: string;
    resolvers?: Record<string, any>;
    subscriptions?: boolean;
  };
  
  // Logging configuration
  logging?: {
    level?: 'debug' | 'info' | 'warn' | 'error';
    format?: 'json' | 'text';
    transports?: string[];
  };
  
  // State persistence
  persistence?: {
    enabled: boolean;
    type?: 'memory' | 'database' | 'file';
    config?: Record<string, any>;
  };
  
  // Monitoring and metrics
  monitoring?: {
    enabled: boolean;
    metrics?: string[];
    tracing?: boolean;
    healthChecks?: string[];
  };
  
  // UI Rendering support
  render?: () => React.ReactNode;
  renderContainer?: TomeRenderContainer;
}

export interface TomeInstance {
  id: string;
  config: TomeConfig;
  machines: Map<string, any>;
  router?: any;
  context: Record<string, any>;
  
  // Methods
  start(): Promise<void>;
  stop(): Promise<void>;
  getMachine(id: string): any;
  sendMessage(machineId: string, event: string, data?: any): Promise<any>;
  getState(machineId: string): any;
  updateContext(updates: Record<string, any>): void;
}

export interface TomeManager {
  tomes: Map<string, TomeInstance>;
  
  // Methods
  registerTome(config: TomeConfig): Promise<TomeInstance>;
  unregisterTome(id: string): Promise<void>;
  getTome(id: string): TomeInstance | undefined;
  startTome(id: string): Promise<void>;
  stopTome(id: string): Promise<void>;
  listTomes(): string[];
}

/**
 * ISubMachine Interface
 * 
 * Common interface for all sub-machines in the Tome architecture.
 * Provides standardized access to machine vitals, routing, and messaging capabilities.
 */
export interface ISubMachine {
  // Machine identification
  readonly machineId: string;
  readonly machineType: 'proxy' | 'view' | 'background' | 'content';
  
  // State management
  getState(): any;
  getContext(): any;
  isInState(stateName: string): boolean;
  
  // Event handling
  send(event: string | object): void;
  canHandle(event: string): boolean;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  
  // Routing and messaging
  routeMessage(message: any): Promise<any>;
  sendToParent(message: any): Promise<any>;
  sendToChild(machineId: string, message: any): Promise<any>;
  broadcast(message: any): Promise<any>;

  // View rendering (for view container)
  renderContainer?(): React.ReactNode;
  
  // View rendering (for view machines)
  render?(): React.ReactNode;
  
  // Configuration
  getConfig(): any;
  updateConfig(config: Partial<any>): void;
  
  // Health and monitoring
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastHeartbeat: number;
    errorCount: number;
    uptime: number;
  };
  
  // Event subscription
  on(event: string, handler: (data: any) => void): void;
  off(event: string, handler: (data: any) => void): void;
  emit(event: string, data: any): void;
  
  // State change subscription
  subscribe(callback: (data: any) => void): { unsubscribe: () => void };
}

/**
 * Create a TomeConfig with routing support and lazy TomeManager
 */
export function createTomeConfig(config: Partial<TomeConfig>): TomeConfig & {
  tomeManager: any;
  start(): { success: boolean };
  stop(): { success: boolean };
  registerTome(tome: any): { success: boolean };
  startTome(tomeId: string): { success: boolean };
  stopTome(tomeId: string): { success: boolean };
  getTome(tomeId: string): any;
  on(event: string, handler: (data: any) => void): any;
  off(event: string, handler: (data: any) => void): any;
  emit(event: string, data: any): any;
  forceRender(): any;
  getSubMachine(machineId: string): any;
  subscribe(callback: (data: any) => void): { unsubscribe: () => void };
  getState(): any;
  getContext(): any;
  getHealth(): any;
  route(path: string, method: string, data: any): any;
} {
  // LazyTomeManager is now imported at the top of the file
  
  const tomeConfig = {
    id: config.id || 'default-tome',
    name: config.name || 'Default Tome',
    description: config.description || 'A configured tome with routing support',
    version: config.version || '1.0.0',
    machines: config.machines || {},
    routing: {
      basePath: config.routing?.basePath || '/api',
      routes: config.routing?.routes || {},
      middleware: config.routing?.middleware || [],
      cors: config.routing?.cors ?? true,
      rateLimit: config.routing?.rateLimit || {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      },
      authentication: config.routing?.authentication || {
        required: false
      }
    },
    context: config.context || {},
    dependencies: config.dependencies || [],
    plugins: config.plugins || [],
    graphql: {
      enabled: config.graphql?.enabled ?? true,
      schema: config.graphql?.schema,
      resolvers: config.graphql?.resolvers || {},
      subscriptions: config.graphql?.subscriptions ?? true
    },
    logging: {
      level: config.logging?.level || 'info',
      format: config.logging?.format || 'json',
      transports: config.logging?.transports || ['console']
    },
    persistence: {
      enabled: config.persistence?.enabled ?? false,
      type: config.persistence?.type || 'memory',
      config: config.persistence?.config || {}
    },
    monitoring: {
      enabled: config.monitoring?.enabled ?? true,
      metrics: config.monitoring?.metrics || ['requests', 'errors', 'performance'],
      tracing: config.monitoring?.tracing ?? true,
      healthChecks: config.monitoring?.healthChecks || ['/health']
    },
    render: config.render,
    renderContainer: config.renderContainer
  };

  let lazyTomeManager: any = null;

  return {
    ...tomeConfig,
    
    // Lazy TomeManager getter
    get tomeManager() {
      if (!lazyTomeManager) {
        lazyTomeManager = new LazyTomeManager(this);
      }
      return lazyTomeManager;
    },
    
    // TomeManager methods that delegate to lazy manager
    start() {
      return this.tomeManager.startTome(this.id);
    },
    
    stop() {
      return this.tomeManager.stopTome(this.id);
    },
    
    registerTome(tome: any) {
      return this.tomeManager.registerTome(tome);
    },
    
    startTome(tomeId: string) {
      return this.tomeManager.startTome(tomeId);
    },
    
    stopTome(tomeId: string) {
      return this.tomeManager.stopTome(tomeId);
    },
    
    getTome(tomeId: string) {
      return this.tomeManager.getTome(tomeId);
    },
    
    // Event system
    on(event: string, handler: (data: any) => void) {
      return this.tomeManager.on(event, handler);
    },
    
    off(event: string, handler: (data: any) => void) {
      return this.tomeManager.off(event, handler);
    },
    
    emit(event: string, data: any) {
      return this.tomeManager.emit(event, data);
    },
    
    // Force re-render
    forceRender() {
      return this.tomeManager.forceRender();
    },
    
    // Sub-machine management
    getSubMachine(machineId: string) {
      return this.tomeManager.getSubMachine(machineId);
    },
    
    // Subscription system
    subscribe(callback: (data: any) => void) {
      console.log('🌊 Tome: Subscribing to tome', this.id);
      if (typeof callback === 'function') {
        callback({ type: 'tomeStarted', data: this });
      }
      return {
        unsubscribe: () => {
          console.log('🌊 Tome: Unsubscribing from tome', this.id);
        }
      };
    },
    
    // State management
    getState() {
      return this.tomeManager.getState();
    },
    
    getContext() {
      return this.tomeManager.getContext();
    },
    
    // Health monitoring
    getHealth() {
      return this.tomeManager.getHealth();
    },
    
    // Routing
    route(path: string, method: string, data: any) {
      return this.tomeManager.route(path, method, data);
    }
  };
}

/**
 * Example TomeConfig for Fish Burger system
 */
export const FishBurgerTomeConfig: TomeConfig = createTomeConfig({
  id: 'fish-burger-tome',
  name: 'Fish Burger System',
  description: 'Complete fish burger ordering and cooking system',
  version: '1.0.0',
  machines: {
    orderMachine: {
      id: 'order-machine',
      name: 'Order Management',
      description: 'Handles order creation and management',
      xstateConfig: {
        id: 'order-machine',
        initial: 'idle',
        states: {
          idle: {
            on: { CREATE_ORDER: 'processing' }
          },
          processing: {
            on: { COMPLETE_ORDER: 'completed' }
          },
          completed: {
            on: { RESET: 'idle' }
          }
        }
      }
    },
    cookingMachine: {
      id: 'cooking-machine',
      name: 'Cooking System',
      description: 'Manages the cooking process',
      xstateConfig: {
        id: 'cooking-machine',
        initial: 'idle',
        states: {
          idle: {
            on: { START_COOKING: 'cooking' }
          },
          cooking: {
            on: { COMPLETE_COOKING: 'completed' }
          },
          completed: {
            on: { RESET: 'idle' }
          }
        }
      }
    }
  },
  routing: {
    basePath: '/api/fish-burger',
    routes: {
      orderMachine: {
        path: '/orders',
        method: 'POST'
      },
      cookingMachine: {
        path: '/cooking',
        method: 'POST'
      }
    }
  },
  context: {
    baseUrl: 'http://localhost:3000',
    adminKey: (typeof process !== 'undefined' && process.env?.ADMIN_KEY) || 'admin123'
  }
});

/**
 * Example TomeConfig for Editor system
 */
export const EditorTomeConfig: TomeConfig = createTomeConfig({
  id: 'editor-tome',
  name: 'Component Editor System',
  description: 'Visual component editor with real-time preview',
  version: '1.0.0',
  machines: {
    editorMachine: {
      id: 'editor-machine',
      name: 'Component Editor',
      description: 'Main editor interface',
      xstateConfig: {
        id: 'editor-machine',
        initial: 'idle',
        states: {
          idle: {
            on: { LOAD_COMPONENT: 'editing' }
          },
          editing: {
            on: { SAVE: 'saving' }
          },
          saving: {
            on: { SAVE_SUCCESS: 'editing' }
          }
        }
      }
    },
    previewMachine: {
      id: 'preview-machine',
      name: 'Preview System',
      description: 'Real-time component preview',
      xstateConfig: {
        id: 'preview-machine',
        initial: 'idle',
        states: {
          idle: {
            on: { UPDATE_PREVIEW: 'updating' }
          },
          updating: {
            on: { PREVIEW_READY: 'ready' }
          },
          ready: {
            on: { UPDATE_PREVIEW: 'updating' }
          }
        }
      }
    }
  },
  routing: {
    basePath: '/api/editor',
    routes: {
      editorMachine: {
        path: '/components',
        method: 'POST'
      },
      previewMachine: {
        path: '/preview',
        method: 'POST'
      }
    }
  },
  context: {
    editorType: 'generic',
    previewMode: 'iframe'
  }
}); 