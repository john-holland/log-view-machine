import { TomeConfig, IngredientSelectorContext, BurgerCreationContext } from '../core/XStateAdapter';
import { assign } from 'xstate';

// Example of how tomes can be used for configuration management
// This replaces the "configuration hell" problem with a clean, declarative approach

export const BurgerTomeConfig: TomeConfig = {
  id: 'burger-tome',
  name: 'Tasty Fish Burger System',
  description: 'Complete burger creation system with nested state machines',
  
  // Shared context across all machines in this tome
  context: {
    baseUrl: 'http://localhost:3001',
    adminKey: 'admin123',
    csrfToken: 'csrf:burger-tome-2024',
    features: {
      doublePortion: true,
      customIngredients: true,
      adminPanel: true,
      metrics: true
    }
  },

  // Define all machines in this tome
  machines: {
    // Main burger creation flow
    burgerCreation: {
      id: 'burger-creation',
      initial: 'idle',
      context: {
        selectedIngredients: [],
        isHungry: false,
        burgers: [],
        register: null,
        loading: false,
        error: null,
        showAdmin: false,
        adminKey: 'admin123'
      },
      states: {
        idle: {
          on: {
            SELECT_INGREDIENT: 'selecting',
            TOGGLE_HUNGRY: 'idle',
            CREATE_BURGER: 'creating'
          }
        },
        selecting: {
          on: {
            INGREDIENT_SELECTED: 'idle',
            CREATE_BURGER: 'creating'
          }
        },
        creating: {
          invoke: {
            src: 'createBurgerService',
            onDone: 'success',
            onError: 'error'
          }
        },
        success: {
          on: {
            CONTINUE: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'creating'
          }
        }
      }
    },

    // Ingredient management
    ingredientSelector: {
      id: 'ingredient-selector',
      initial: 'empty',
      context: {
        selectedIngredients: [] as string[],
        availableIngredients: ['lettuce', 'tomato', 'onion', 'cheese', 'bacon', 'pickles']
      },
      states: {
        empty: {
          on: {
            ADD_INGREDIENT: {
              target: 'hasIngredients',
              actions: assign((context: any, event: any) => ({
                selectedIngredients: [...context.selectedIngredients, event.payload]
              }))
            }
          }
        },
        hasIngredients: {
          on: {
            ADD_INGREDIENT: {
              target: 'hasIngredients',
              actions: assign((context: any, event: any) => ({
                selectedIngredients: [...context.selectedIngredients, event.payload]
              }))
            },
            REMOVE_INGREDIENT: {
              target: 'hasIngredients',
              actions: assign((context: any, event: any) => ({
                selectedIngredients: context.selectedIngredients.filter((ing: string) => ing !== event.payload)
              }))
            },
            CLEAR_ALL: {
              target: 'empty',
              actions: assign({
                selectedIngredients: []
              })
            }
          }
        }
      }
    },

    // Cooking process
    cookingMachine: {
      id: 'cooking-machine',
      initial: 'waiting',
      context: {
        currentBurger: null,
        cookingTime: 0,
        temperature: 0
      },
      states: {
        waiting: {
          on: {
            START_COOKING: 'preparing'
          }
        },
        preparing: {
          on: {
            INGREDIENTS_READY: 'cooking'
          }
        },
        cooking: {
          invoke: {
            src: 'cookingService',
            onDone: 'ready',
            onError: 'error'
          }
        },
        ready: {
          on: {
            EAT_BURGER: 'consumed',
            TRASH_BURGER: 'trashed'
          }
        },
        consumed: {
          on: {
            CONTINUE: 'waiting'
          }
        },
        trashed: {
          on: {
            CONTINUE: 'waiting'
          }
        },
        error: {
          on: {
            RETRY: 'preparing'
          }
        }
      }
    },

    // Admin system
    adminMachine: {
      id: 'admin-machine',
      initial: 'hidden',
      context: {
        isAuthenticated: false,
        adminKey: '',
        register: null,
        burgers: []
      },
      states: {
        hidden: {
          on: {
            SHOW_ADMIN: 'visible'
          }
        },
        visible: {
          on: {
            HIDE_ADMIN: 'hidden',
            AUTHENTICATE: 'authenticated'
          }
        },
        authenticated: {
          on: {
            CLEAR_REGISTER: 'authenticated',
            CLEAR_BURGERS: 'authenticated',
            LOGOUT: 'visible'
          }
        }
      }
    },

    // Metrics and analytics
    metricsMachine: {
      id: 'metrics-machine',
      initial: 'idle',
      context: {
        metrics: {},
        lastUpdate: null
      },
      states: {
        idle: {
          on: {
            START_COLLECTION: 'collecting'
          }
        },
        collecting: {
          invoke: {
            src: 'metricsService',
            onDone: 'idle',
            onError: 'error'
          }
        },
        error: {
          on: {
            RETRY: 'collecting'
          }
        }
      }
    }
  },

  // Address bindings - maps machine IDs to network addresses
  bindings: {
    burgerCreation: '/burger/creation',
    ingredientSelector: '/burger/ingredients',
    cookingMachine: '/burger/cooking',
    adminMachine: '/burger/admin',
    metricsMachine: '/burger/metrics'
  },

  // URL routing configuration
  routing: {
    stateToUrl: (state: string) => {
      const stateMap: Record<string, string> = {
        'idle': '/burger',
        'selecting': '/burger/ingredients',
        'creating': '/burger/cooking',
        'ready': '/burger/ready',
        'admin': '/burger/admin',
        'metrics': '/burger/metrics'
      };
      return stateMap[state] || '/burger';
    },
    urlToState: (url: string) => {
      const urlMap: Record<string, string> = {
        '/burger': 'idle',
        '/burger/ingredients': 'selecting',
        '/burger/cooking': 'creating',
        '/burger/ready': 'ready',
        '/burger/admin': 'admin',
        '/burger/metrics': 'metrics'
      };
      return urlMap[url] || 'idle';
    }
  },

  // Addressability configuration
  addressability: {
    basePath: '/burger',
    graphqlSubQueries: true
  }
};

// Additional tomes for different domains
export const MetricsTomeConfig: TomeConfig = {
  id: 'metrics-tome',
  name: 'Metrics and Analytics System',
  description: 'System for collecting and analyzing metrics',
  
  context: {
    baseUrl: 'http://localhost:3001',
    metricsEndpoint: '/api/metrics',
    tracingEnabled: true
  },

  machines: {
    metricsCollector: {
      id: 'metrics-collector',
      initial: 'idle',
      context: {
        collectedMetrics: [],
        lastCollection: null
      },
      states: {
        idle: {
          on: {
            START_COLLECTION: 'collecting'
          }
        },
        collecting: {
          invoke: {
            src: 'collectMetricsService',
            onDone: 'processing',
            onError: 'error'
          }
        },
        processing: {
          invoke: {
            src: 'processMetricsService',
            onDone: 'idle',
            onError: 'error'
          }
        },
        error: {
          on: {
            RETRY: 'collecting'
          }
        }
      }
    }
  },

  bindings: {
    metricsCollector: '/metrics/collector'
  },

  routing: {
    stateToUrl: (state: string) => `/metrics/${state}`,
    urlToState: (url: string) => url.split('/').pop() || 'idle'
  },

  addressability: {
    basePath: '/metrics',
    graphqlSubQueries: false
  }
};

// Export all tome configurations
export const TomeConfigurations = {
  burger: BurgerTomeConfig,
  metrics: MetricsTomeConfig
}; 