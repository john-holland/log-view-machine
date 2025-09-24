# React Hooks and TomeContext Implementation Guide

## Overview

The log-view-machine provides a powerful set of React hooks that automatically connect state machines, messaging systems, and context management. This guide explains how to use `useViewStateMachine()`, `useRobotCopyProxyMachine()`, `useTomeManager()`, and the new `<TomeContext>` component to create seamless, interconnected applications.

## Table of Contents

- [Core Hooks](#core-hooks)
  - [useViewStateMachine](#useviewstatemachine)
  - [useRobotCopyProxyMachine](#userobotcopyproxymachine)
  - [useTomeManager](#usetomemanager)
- [TomeContext Component](#tomecontext-component)
- [Automatic Connection Architecture](#automatic-connection-architecture)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## Core Hooks

### useViewStateMachine

The `useViewStateMachine` hook provides React integration for XState-based state machines with automatic view management and logging.

#### Signature
```typescript
function useViewStateMachine<TModel = any>(
  initialModel: TModel
): {
  state: string;
  context: any;
  send: (event: any) => void;
  logEntries: any[];
  viewStack: React.ReactNode[];
  log: (message: string, data?: any) => void;
  view: (component: React.ReactNode) => void;
  clear: () => void;
  transition: (state: string, data?: any) => void;
  subMachine: (id: string, config: any) => void;
  getSubMachine: (id: string) => any;
}
```

#### Implementation Details

The hook is implemented within the `ViewStateMachine` class and provides:

1. **State Management**: Integrates with XState machine interpretation
2. **Context Creation**: Creates a rich context object with fluent API methods
3. **Automatic State Handlers**: Executes registered state handlers on state changes
4. **View Stack Management**: Maintains a stack of React components for navigation
5. **Logging Integration**: Provides structured logging capabilities

```typescript
// From ViewStateMachine.tsx lines 434-459
useViewStateMachine(initialModel: TModel) {
  const [state, send] = useMachine(this.machine);
  
  const context = this.createStateContext(state, initialModel);
  
  // Execute state handler if exists
  React.useEffect(() => {
    this.executeStateHandler(state.value, context);
  }, [state.value]);

  return {
    state: state.value,
    context: state.context,
    send,
    logEntries: this.logEntries,
    viewStack: this.viewStack,
    subMachines: this.subMachines,
    // Expose fluent API methods
    log: context.log,
    view: context.view,
    clear: context.clear,
    transition: context.transition,
    subMachine: context.subMachine,
    getSubMachine: context.getSubMachine
  };
}
```

#### Usage Example

```typescript
const orderMachine = createViewStateMachine({
  machineId: 'order-machine',
  xstateConfig: {
    initial: 'idle',
    context: { orderId: null, items: [] },
    states: {
      idle: {
        on: { START_ORDER: 'processing' }
      },
      processing: {
        on: { ORDER_COMPLETE: 'completed' }
      },
      completed: {
        on: { NEW_ORDER: 'idle' }
      }
    }
  }
});

const OrderComponent: React.FC = () => {
  const {
    state,
    context,
    send,
    log,
    view,
    transition
  } = orderMachine.useViewStateMachine({
    orderId: null,
    items: []
  });

  const handleStartOrder = () => {
    log('Starting new order');
    send({ type: 'START_ORDER' });
  };

  return (
    <div>
      <h2>Order State: {state}</h2>
      <button onClick={handleStartOrder}>Start Order</button>
    </div>
  );
};
```

### useRobotCopyProxyMachine

The `useRobotCopyProxyMachine` hook provides integration with the RobotCopy messaging system for proxy-based communication.

#### Signature
```typescript
function useRobotCopyProxyMachine<TModel = any>(
  config: ProxyRobotCopyStateMachineConfig<TModel>
): {
  machine: ProxyRobotCopyStateMachine<TModel>;
  robotCopy: RobotCopy;
  sendMessage: (message: any) => Promise<any>;
  getBackendType: () => Promise<string>;
  isEnabled: (feature: string) => Promise<boolean>;
}
```

#### Implementation Details

The hook creates a proxy machine that extends `ViewStateMachine` but is specifically designed for RobotCopy integration:

```typescript
// From ViewStateMachine.tsx lines 648-722
export class ProxyRobotCopyStateMachine<TModel = any> extends ViewStateMachine<TModel> {
  private robotCopy: RobotCopy;
  
  constructor(config: ProxyRobotCopyStateMachineConfig<TModel>) {
    super({
      ...config,
      robotCopy: config.robotCopy
    });
    
    this.robotCopy = config.robotCopy;
    this.integrateWithRobotCopy();
  }
  
  private integrateWithRobotCopy(): void {
    // Set up message handling and routing
    this.robotCopy.on('message', this.handleIncomingMessage.bind(this));
  }
  
  useViewStateMachine(initialModel: TModel) {
    throw new Error('ProxyStateMachine does not support useViewStateMachine');
  }
}
```

#### Usage Example

```typescript
const proxyMachine = createProxyRobotCopyStateMachine({
  machineId: 'cart-proxy-machine',
  xstateConfig: {
    initial: 'idle',
    context: { cartItems: [] },
    states: {
      idle: {
        on: { ADD_ITEM: 'adding' }
      },
      adding: {
        on: { ITEM_ADDED: 'idle' }
      }
    }
  },
  robotCopy: createRobotCopy()
});

const CartComponent: React.FC = () => {
  const { machine, robotCopy, sendMessage } = proxyMachine.useRobotCopyProxyMachine();
  
  const handleAddItem = async (item: any) => {
    try {
      const result = await sendMessage('cart/add', { item });
      console.log('Add to cart result:', result);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleAddItem({ id: 1, name: 'Item' })}>
        Add Item
      </button>
    </div>
  );
};
```

### useTomeManager

The `useTomeManager` hook provides access to the Tome management system for registering and managing multiple Tome instances.

#### Signature
```typescript
function useTomeManager(): {
  tomes: Map<string, TomeInstance>;
  registerTome: (config: TomeConfig) => Promise<TomeInstance>;
  unregisterTome: (id: string) => Promise<void>;
  getTome: (id: string) => TomeInstance | undefined;
  startTome: (id: string) => Promise<void>;
  stopTome: (id: string) => Promise<void>;
  listTomes: () => string[];
  getTomeStatus: () => TomeStatus[];
}
```

#### Implementation Details

The hook provides access to the `TomeManager` class which handles:

1. **Tome Registration**: Register new Tome instances with their configurations
2. **Lifecycle Management**: Start, stop, and manage Tome lifecycles
3. **Routing Setup**: Automatically set up Express.js routes for Tome endpoints
4. **Message Routing**: Route messages between Tome instances
5. **Health Monitoring**: Monitor Tome health and status

```typescript
// From TomeManager.ts lines 12-315
export class TomeManager implements ITomeManager {
  public tomes: Map<string, TomeInstance> = new Map();
  private app: express.Application;

  async registerTome(config: TomeConfig): Promise<TomeInstance> {
    console.log(`📚 Registering Tome: ${config.id}`);
    
    // Create machines for the tome
    const machines = new Map<string, any>();
    
    for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
      const machine = createViewStateMachine({
        machineId: machineConfig.id,
        xstateConfig: machineConfig.xstateConfig,
        context: {
          ...config.context,
          ...machineConfig.context
        }
      });
      
      machines.set(machineKey, machine);
    }

    // Create tome instance with lifecycle methods
    const tomeInstance: TomeInstance = {
      id: config.id,
      config,
      machines,
      context: config.context || {},
      
      async start() {
        console.log(`🚀 Starting Tome: ${this.id}`);
        for (const [key, machine] of this.machines) {
          await machine.start();
        }
      },
      
      async stop() {
        console.log(`🛑 Stopping Tome: ${this.id}`);
        for (const [key, machine] of this.machines) {
          await machine.stop();
        }
      }
    };

    this.tomes.set(config.id, tomeInstance);
    this.setupTomeRouting(tomeInstance);
    
    return tomeInstance;
  }
}
```

#### Usage Example

```typescript
const App: React.FC = () => {
  const {
    tomes,
    registerTome,
    startTome,
    stopTome,
    getTomeStatus
  } = useTomeManager();

  useEffect(() => {
    // Register multiple Tome instances
    const registerTomes = async () => {
      await registerTome({
        id: 'user-management',
        name: 'User Management',
        machines: {
          auth: {
            id: 'auth-machine',
            name: 'Authentication Machine',
            xstateConfig: {
              initial: 'loggedOut',
              states: {
                loggedOut: { on: { LOGIN: 'loggedIn' } },
                loggedIn: { on: { LOGOUT: 'loggedOut' } }
              }
            }
          }
        }
      });

      await registerTome({
        id: 'order-processing',
        name: 'Order Processing',
        machines: {
          order: {
            id: 'order-machine',
            name: 'Order Machine',
            xstateConfig: {
              initial: 'idle',
              states: {
                idle: { on: { START: 'processing' } },
                processing: { on: { COMPLETE: 'idle' } }
              }
            }
          }
        }
      });
    };

    registerTomes();
  }, []);

  return (
    <div>
      <h1>Tome Manager Dashboard</h1>
      {getTomeStatus().map(tome => (
        <div key={tome.id}>
          <h3>{tome.name}</h3>
          <p>Status: {tome.context.status || 'unknown'}</p>
        </div>
      ))}
    </div>
  );
};
```

## TomeContext Component

The `<TomeContext>` component provides a React context that automatically weaves state machine context into the component tree, allowing any component to access the current state machine context without prop drilling.

### Signature

```typescript
interface TomeContextProps {
  machine: ViewStateMachine | ProxyRobotCopyStateMachine;
  children: React.ReactNode;
  contextKey?: string;
}

const TomeContext: React.FC<TomeContextProps> = ({ 
  machine, 
  children, 
  contextKey = 'tome' 
}) => {
  // Implementation details below
};
```

### Implementation

```typescript
// New TomeContext component implementation
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ViewStateMachine, ProxyRobotCopyStateMachine } from '../core/ViewStateMachine';

interface TomeContextValue {
  machine: ViewStateMachine | ProxyRobotCopyStateMachine;
  state: string;
  context: any;
  send: (event: any) => void;
  log: (message: string, data?: any) => void;
  view: (component: React.ReactNode) => void;
  clear: () => void;
  transition: (state: string, data?: any) => void;
}

const TomeContext = createContext<TomeContextValue | null>(null);

export const TomeContextProvider: React.FC<{
  machine: ViewStateMachine | ProxyRobotCopyStateMachine;
  children: React.ReactNode;
  contextKey?: string;
}> = ({ machine, children, contextKey = 'tome' }) => {
  const [state, setState] = useState<string>('idle');
  const [context, setContext] = useState<any>({});

  useEffect(() => {
    // Subscribe to machine state changes
    const unsubscribe = machine.subscribe((newState, newContext) => {
      setState(newState);
      setContext(newContext);
    });

    return unsubscribe;
  }, [machine]);

  const contextValue: TomeContextValue = {
    machine,
    state,
    context,
    send: machine.send.bind(machine),
    log: machine.log.bind(machine),
    view: machine.view.bind(machine),
    clear: machine.clear.bind(machine),
    transition: machine.transition.bind(machine)
  };

  return (
    <TomeContext.Provider value={contextValue}>
      {children}
    </TomeContext.Provider>
  );
};

// Hook to access TomeContext
export const useTomeContext = (): TomeContextValue => {
  const context = useContext(TomeContext);
  if (!context) {
    throw new Error('useTomeContext must be used within a TomeContextProvider');
  }
  return context;
};

// Higher-order component for automatic context injection
export const withTomeContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const tomeContext = useTomeContext();
    return <Component {...props} tomeContext={tomeContext} />;
  };
};
```

### Usage Examples

#### Basic TomeContext Usage

```typescript
const App: React.FC = () => {
  const orderMachine = createViewStateMachine({
    machineId: 'order-machine',
    xstateConfig: {
      initial: 'idle',
      context: { orderId: null, items: [] },
      states: {
        idle: { on: { START_ORDER: 'processing' } },
        processing: { on: { ORDER_COMPLETE: 'completed' } }
      }
    }
  });

  return (
    <TomeContextProvider machine={orderMachine}>
      <OrderHeader />
      <OrderContent />
      <OrderFooter />
    </TomeContextProvider>
  );
};

const OrderHeader: React.FC = () => {
  const { state, context } = useTomeContext();
  
  return (
    <header>
      <h1>Order Management</h1>
      <p>Current State: {state}</p>
      <p>Order ID: {context.orderId || 'None'}</p>
    </header>
  );
};

const OrderContent: React.FC = () => {
  const { send, log } = useTomeContext();
  
  const handleStartOrder = () => {
    log('Starting new order');
    send({ type: 'START_ORDER' });
  };

  return (
    <main>
      <button onClick={handleStartOrder}>Start New Order</button>
    </main>
  );
};

const OrderFooter: React.FC = () => {
  const { context, transition } = useTomeContext();
  
  return (
    <footer>
      <p>Items in cart: {context.items?.length || 0}</p>
    </footer>
  );
};
```

#### Nested TomeContext for Sub-Machines

```typescript
const ParentComponent: React.FC = () => {
  const parentMachine = createViewStateMachine({
    machineId: 'parent-machine',
    xstateConfig: {
      initial: 'idle',
      states: {
        idle: { on: { START_CHILD: 'child' } },
        child: { on: { BACK_TO_PARENT: 'idle' } }
      }
    }
  });

  return (
    <TomeContextProvider machine={parentMachine}>
      <ParentContent />
    </TomeContextProvider>
  );
};

const ParentContent: React.FC = () => {
  const { state, send } = useTomeContext();
  
  if (state === 'child') {
    const childMachine = createViewStateMachine({
      machineId: 'child-machine',
      xstateConfig: {
        initial: 'active',
        states: {
          active: { on: { COMPLETE: 'done' } },
          done: { on: { RESET: 'active' } }
        }
      }
    });

    return (
      <TomeContextProvider machine={childMachine}>
        <ChildContent />
      </TomeContextProvider>
    );
  }

  return (
    <div>
      <p>Parent State: {state}</p>
      <button onClick={() => send({ type: 'START_CHILD' })}>
        Start Child Process
      </button>
    </div>
  );
};

const ChildContent: React.FC = () => {
  const { state, send } = useTomeContext();
  
  return (
    <div>
      <p>Child State: {state}</p>
      <button onClick={() => send({ type: 'COMPLETE' })}>
        Complete Child Process
      </button>
    </div>
  );
};
```

## Automatic Connection Architecture

The hooks and TomeContext work together to create an automatic connection architecture:

### 1. State Machine Integration
- `useViewStateMachine` provides direct access to XState machine state and actions
- `useRobotCopyProxyMachine` adds messaging capabilities to state machines
- `useTomeManager` manages multiple state machine instances

### 2. Context Weaving
- `TomeContext` automatically injects state machine context into the React component tree
- Any component can access current state and actions without prop drilling
- Context updates automatically trigger re-renders when state changes

### 3. Message Flow
- RobotCopy handles inter-machine communication
- Messages flow automatically between registered machines
- Context changes propagate through the component tree

### 4. Lifecycle Management
- TomeManager handles registration and lifecycle of multiple Tome instances
- Automatic cleanup when components unmount
- Health monitoring and error recovery

## Usage Examples

### Complete E-commerce Example with EC2 Backend

```typescript
import React, { useEffect, useState, useMemo } from 'react';
import { 
  createViewStateMachine, 
  createProxyRobotCopyStateMachine, 
  createRobotCopy, 
  TomeManager 
} from 'log-view-machine';

// 1. Environment Configuration
const ENVIRONMENT_CONFIG = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3000/ws',
    enableLogging: true
  },
  staging: {
    apiBaseUrl: 'https://staging-api.yourdomain.com',
    wsUrl: 'wss://staging-api.yourdomain.com/ws',
    enableLogging: true
  },
  production: {
    apiBaseUrl: 'https://api.yourdomain.com',
    wsUrl: 'wss://api.yourdomain.com/ws',
    enableLogging: false
  }
};

// 2. Create RobotCopy with EC2 Backend Configuration
const createProductionRobotCopy = () => {
  const environment = process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIG || 'development';
  const config = ENVIRONMENT_CONFIG[environment];
  
  return createRobotCopy({
    messageBrokers: [
      {
        type: 'http-api',
        config: {
          baseUrl: config.apiBaseUrl,
          timeout: 30000,
          retries: 3,
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Version': '1.3.0'
          }
        }
      },
      {
        type: 'websocket',
        config: {
          url: config.wsUrl,
          reconnectInterval: 5000,
          maxReconnectAttempts: 10,
          heartbeatInterval: 30000
        }
      },
      {
        type: 'graphql',
        config: {
          endpoint: `${config.apiBaseUrl}/graphql`,
          subscriptionsEndpoint: `${config.wsUrl}/graphql`,
          cachePolicy: 'cache-first'
        }
      }
    ],
    enableLogging: config.enableLogging,
    enableMetrics: true,
    enableTracing: true,
    traceConfig: {
      serviceName: 'ecommerce-frontend',
      environment: environment,
      version: '1.3.0'
    }
  });
};

// 3. Create the main application machine with enhanced state management
const appMachine = createViewStateMachine({
  machineId: 'ecommerce-app',
  xstateConfig: {
    initial: 'initializing',
    context: { 
      user: null, 
      cart: [], 
      orders: [],
      connectionStatus: 'disconnected',
      backendHealth: 'unknown',
      error: null
    },
    states: {
      initializing: {
        on: {
          INITIALIZE_COMPLETE: 'loading',
          INITIALIZE_ERROR: 'error'
        }
      },
      loading: { 
        on: { 
          LOADED: 'authenticated',
          LOAD_ERROR: 'error'
        } 
      },
      authenticated: { 
        on: { 
          LOGOUT: 'loading',
          CONNECTION_LOST: 'reconnecting'
        } 
      },
      reconnecting: {
        on: {
          RECONNECTED: 'authenticated',
          RECONNECT_FAILED: 'error'
        }
      },
      error: {
        on: {
          RETRY: 'initializing',
          RESET: 'loading'
        }
      }
    }
  }
});

// 4. Create RobotCopy proxy with production configuration
const createMessagingProxy = () => {
  const robotCopy = createProductionRobotCopy();
  
  return createProxyRobotCopyStateMachine({
    machineId: 'messaging-proxy',
    xstateConfig: {
      initial: 'connecting',
      context: {
        connectionStatus: 'connecting',
        messageQueue: [],
        healthCheck: {
          lastCheck: null,
          status: 'unknown',
          responseTime: null
        }
      },
      states: {
        connecting: {
          on: {
            CONNECTED: 'connected',
            CONNECTION_FAILED: 'disconnected'
          }
        },
        connected: { 
          on: { 
            DISCONNECT: 'disconnected',
            HEALTH_CHECK_FAILED: 'degraded'
          } 
        },
        degraded: {
          on: {
            HEALTH_CHECK_PASSED: 'connected',
            DISCONNECT: 'disconnected'
          }
        },
        disconnected: { 
          on: { 
            RECONNECT: 'connecting',
            RETRY_CONNECTION: 'connecting'
          } 
        }
      }
    },
    robotCopy
  });
};

// 5. Enhanced Main App Component with EC2 Integration
const EcommerceApp: React.FC = () => {
  const [messagingProxy] = useState(() => createMessagingProxy());
  const [tomeManager] = useState(() => new TomeManager());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RobotCopy with backend services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Register backend services with RobotCopy
        await messagingProxy.robotCopy.registerService('user-service', {
          baseUrl: `${ENVIRONMENT_CONFIG[process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIG].apiBaseUrl}/users`,
          endpoints: {
            login: 'POST /login',
            logout: 'POST /logout',
            profile: 'GET /profile',
            updateProfile: 'PUT /profile'
          }
        });

        await messagingProxy.robotCopy.registerService('product-service', {
          baseUrl: `${ENVIRONMENT_CONFIG[process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIG].apiBaseUrl}/products`,
          endpoints: {
            list: 'GET /',
            get: 'GET /:id',
            search: 'GET /search',
            categories: 'GET /categories'
          }
        });

        await messagingProxy.robotCopy.registerService('order-service', {
          baseUrl: `${ENVIRONMENT_CONFIG[process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIG].apiBaseUrl}/orders`,
          endpoints: {
            create: 'POST /',
            list: 'GET /',
            get: 'GET /:id',
            update: 'PUT /:id',
            cancel: 'DELETE /:id'
          }
        });

        await messagingProxy.robotCopy.registerService('cart-service', {
          baseUrl: `${ENVIRONMENT_CONFIG[process.env.NODE_ENV as keyof typeof ENVIRONMENT_CONFIG].apiBaseUrl}/cart`,
          endpoints: {
            get: 'GET /',
            add: 'POST /items',
            update: 'PUT /items/:id',
            remove: 'DELETE /items/:id',
            clear: 'DELETE /'
          }
        });

        // Register Tome instances with backend integration
        await tomeManager.registerTome({
          id: 'user-management',
          name: 'User Management',
          description: 'Handles user authentication and profile management',
          machines: {
            auth: {
              id: 'auth-machine',
              name: 'Authentication Machine',
              xstateConfig: {
                initial: 'loggedOut',
                context: { user: null, token: null },
                states: {
                  loggedOut: { 
                    on: { 
                      LOGIN: 'loggingIn',
                      REGISTER: 'registering'
                    } 
                  },
                  loggingIn: {
                    on: {
                      LOGIN_SUCCESS: 'loggedIn',
                      LOGIN_FAILED: 'loggedOut'
                    }
                  },
                  registering: {
                    on: {
                      REGISTER_SUCCESS: 'loggedIn',
                      REGISTER_FAILED: 'loggedOut'
                    }
                  },
                  loggedIn: { 
                    on: { 
                      LOGOUT: 'loggedOut',
                      TOKEN_EXPIRED: 'loggedOut'
                    } 
                  }
                }
              }
            }
          }
        });

        await tomeManager.registerTome({
          id: 'product-catalog',
          name: 'Product Catalog',
          description: 'Manages product browsing and search',
          machines: {
            catalog: {
              id: 'catalog-machine',
              name: 'Catalog Machine',
              xstateConfig: {
                initial: 'loading',
                context: { products: [], categories: [], searchQuery: '' },
                states: {
                  loading: { on: { LOADED: 'browsing' } },
                  browsing: { 
                    on: { 
                      SEARCH: 'searching',
                      SELECT_CATEGORY: 'filtering'
                    } 
                  },
                  searching: {
                    on: {
                      SEARCH_COMPLETE: 'browsing',
                      CLEAR_SEARCH: 'browsing'
                    }
                  },
                  filtering: {
                    on: {
                      FILTER_COMPLETE: 'browsing',
                      CLEAR_FILTER: 'browsing'
                    }
                  }
                }
              }
            }
          }
        });

        await tomeManager.registerTome({
          id: 'shopping-cart',
          name: 'Shopping Cart',
          description: 'Manages shopping cart operations',
          machines: {
            cart: {
              id: 'cart-machine',
              name: 'Cart Machine',
              xstateConfig: {
                initial: 'empty',
                context: { items: [], total: 0 },
                states: {
                  empty: { on: { ADD_ITEM: 'hasItems' } },
                  hasItems: {
                    on: {
                      ADD_ITEM: 'hasItems',
                      REMOVE_ITEM: 'hasItems',
                      CLEAR_CART: 'empty',
                      CHECKOUT: 'checkingOut'
                    }
                  },
                  checkingOut: {
                    on: {
                      CHECKOUT_SUCCESS: 'empty',
                      CHECKOUT_FAILED: 'hasItems'
                    }
                  }
                }
              }
            }
          }
        });

        setIsInitialized(true);
        appMachine.send({ type: 'INITIALIZE_COMPLETE' });

      } catch (error) {
        console.error('Failed to initialize app:', error);
        appMachine.send({ type: 'INITIALIZE_ERROR', error });
      }
    };

    initializeApp();
  }, []);

  // Health check monitoring
  useEffect(() => {
    if (!isInitialized) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        const healthStatus = await messagingProxy.robotCopy.healthCheck();
        if (healthStatus.status === 'healthy') {
          messagingProxy.send({ type: 'HEALTH_CHECK_PASSED' });
        } else {
          messagingProxy.send({ type: 'HEALTH_CHECK_FAILED' });
        }
      } catch (error) {
        messagingProxy.send({ type: 'HEALTH_CHECK_FAILED' });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, [isInitialized]);

  if (!isInitialized) {
    return <div>Initializing application...</div>;
  }

  return (
    <TomeContextProvider machine={appMachine}>
      <TomeContextProvider machine={messagingProxy}>
        <div className="ecommerce-app">
          <Header />
          <ConnectionStatus />
          <MainContent />
          <Footer />
        </div>
      </TomeContextProvider>
    </TomeContextProvider>
  );
};

// 6. Connection Status Component
const ConnectionStatus: React.FC = () => {
  const { state: connectionState, context: connectionContext } = useTomeContext();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'green';
      case 'degraded': return 'orange';
      case 'disconnected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="connection-status" style={{ 
      padding: '8px', 
      backgroundColor: getStatusColor(connectionState),
      color: 'white',
      textAlign: 'center'
    }}>
      Backend Status: {connectionState} 
      {connectionContext.healthCheck?.responseTime && 
        ` (${connectionContext.healthCheck.responseTime}ms)`}
    </div>
  );
};

// 7. Enhanced Header with Backend Integration
const Header: React.FC = () => {
  const { state, context, send } = useTomeContext();
  
  const handleLogin = async () => {
    try {
      // Use RobotCopy to call backend login service
      const loginData = await messagingProxy.robotCopy.callService('user-service', 'login', {
        email: 'user@example.com',
        password: 'password'
      });
      
      send({ type: 'LOGIN', user: loginData.user });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await messagingProxy.robotCopy.callService('user-service', 'logout');
      send({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <header style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
      <h1>E-commerce App</h1>
      <div style={{ float: 'right' }}>
        {context.user ? (
          <div>
            <span>Welcome, {context.user.name}</span>
            <button onClick={handleLogout} style={{ marginLeft: '10px' }}>
              Logout
            </button>
          </div>
        ) : (
          <button onClick={handleLogin}>Login</button>
        )}
      </div>
    </header>
  );
};

// 8. Enhanced MainContent with Error Handling
const MainContent: React.FC = () => {
  const { state, context } = useTomeContext();
  
  switch (state) {
    case 'initializing':
      return <div>Initializing application...</div>;
    case 'loading':
      return <LoadingSpinner />;
    case 'authenticated':
      return <ProductCatalog />;
    case 'reconnecting':
      return <div>Reconnecting to backend...</div>;
    case 'error':
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Error occurred</h2>
          <p>{context.error?.message || 'Unknown error'}</p>
          <button onClick={() => send({ type: 'RETRY' })}>
            Retry
          </button>
        </div>
      );
    default:
      return <div>Unknown state: {state}</div>;
  }
};

// 9. Enhanced ProductCatalog with Backend Integration
const ProductCatalog: React.FC = () => {
  const { send, log } = useTomeContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const productData = await messagingProxy.robotCopy.callService('product-service', 'list');
        setProducts(productData.products);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = async (product: any) => {
    try {
      log('Adding product to cart', { product });
      
      // Call backend cart service
      await messagingProxy.robotCopy.callService('cart-service', 'add', {
        productId: product.id,
        quantity: 1
      });
      
      send({ type: 'ADD_TO_CART', product });
    } catch (error) {
      console.error('Failed to add product to cart:', error);
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Products</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {products.map((product: any) => (
          <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p><strong>${product.price}</strong></p>
            <button 
              onClick={() => handleAddToCart(product)}
              style={{ 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 10. Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div style={{ textAlign: 'center', padding: '40px' }}>
    <div style={{ 
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 2s linear infinite',
      margin: '0 auto'
    }}></div>
    <p>Loading...</p>
  </div>
);

export default EcommerceApp;
```

## Best Practices

### 1. Context Hierarchy
- Use TomeContext at the appropriate level in your component tree
- Avoid nesting too many TomeContext providers
- Consider using a single root TomeContext for global state

### 2. Machine Design
- Keep state machines focused on specific domains
- Use sub-machines for complex nested states
- Leverage RobotCopy for inter-machine communication

### 3. Performance
- Use React.memo for components that don't need to re-render on every state change
- Consider using selectors to limit context updates
- Implement proper cleanup in useEffect hooks

### 4. Error Handling
- Always wrap machine operations in try-catch blocks
- Implement proper error states in your state machines
- Use TomeManager health monitoring for production applications

### 5. Testing
- Mock the TomeContext for unit tests
- Test state machine logic independently of React components
- Use Playwright for end-to-end testing with real state machines

## Conclusion

The log-view-machine React hooks and TomeContext component provide a powerful, automatic way to integrate state machines with React applications. By leveraging these tools, developers can create complex, interconnected applications with minimal boilerplate while maintaining clean separation of concerns and excellent developer experience.

The automatic connection architecture ensures that state changes flow seamlessly through your application, while the context weaving eliminates the need for prop drilling and makes state machine access available anywhere in the component tree.
