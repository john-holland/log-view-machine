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
 * Create a TomeConfig with routing support
 */
export function createTomeConfig(config: Partial<TomeConfig>): TomeConfig {
  return {
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
    adminKey: process.env.ADMIN_KEY || 'admin123'
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