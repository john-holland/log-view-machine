import { TomeConfig, createTome } from '../core/XStateAdapter';

// Burger Creation Tome - A bound collection of nested state machines
export const BurgerTome: TomeConfig = {
  id: 'burger-tome',
  name: 'Tasty Fish Burger Creation System',
  description: 'A complete burger creation system with nested state machines for ingredients, cooking, and admin',
  context: {
    baseUrl: 'http://localhost:3001',
    adminKey: 'admin123',
    csrfToken: 'csrf:burger-tome-2024'
  },
  
  // Define all the machines in this tome
  machines: {
    // Main burger creation machine
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

    // Ingredient selection machine
    ingredientSelector: {
      id: 'ingredient-selector',
      initial: 'empty',
      context: {
        selectedIngredients: [],
        availableIngredients: ['lettuce', 'tomato', 'onion', 'cheese', 'bacon', 'pickles']
      },
      states: {
        empty: {
          on: {
            ADD_INGREDIENT: 'hasIngredients'
          }
        },
        hasIngredients: {
          on: {
            ADD_INGREDIENT: 'hasIngredients',
            REMOVE_INGREDIENT: 'hasIngredients',
            CLEAR_ALL: 'empty'
          }
        }
      }
    },

    // Cooking machine
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

    // Admin machine
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
    }
  },

  // Bind machines to addresses for routing
  bindings: {
    burgerCreation: '/burger/creation',
    ingredientSelector: '/burger/ingredients',
    cookingMachine: '/burger/cooking',
    adminMachine: '/burger/admin'
  },

  // Routing configuration
  routing: {
    stateToUrl: (state: string) => {
      const stateMap: Record<string, string> = {
        'idle': '/burger',
        'selecting': '/burger/ingredients',
        'creating': '/burger/cooking',
        'ready': '/burger/ready',
        'admin': '/burger/admin'
      };
      return stateMap[state] || '/burger';
    },
    urlToState: (url: string) => {
      const urlMap: Record<string, string> = {
        '/burger': 'idle',
        '/burger/ingredients': 'selecting',
        '/burger/cooking': 'creating',
        '/burger/ready': 'ready',
        '/burger/admin': 'admin'
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

// Create and export the tome manager
export const burgerTomeManager = createTome(BurgerTome);

// Helper functions for working with the burger tome
export const getBurgerMachine = () => burgerTomeManager.getMachine('/burger/creation');
export const getIngredientMachine = () => burgerTomeManager.getMachine('/burger/ingredients');
export const getCookingMachine = () => burgerTomeManager.getMachine('/burger/cooking');
export const getAdminMachine = () => burgerTomeManager.getMachine('/burger/admin');

// Send messages to specific machines in the tome
export const sendBurgerMessage = (type: string, payload?: any) => {
  burgerTomeManager.sendMessage('/burger/creation', type, payload);
};

export const sendIngredientMessage = (type: string, payload?: any) => {
  burgerTomeManager.sendMessage('/burger/ingredients', type, payload);
};

export const sendCookingMessage = (type: string, payload?: any) => {
  burgerTomeManager.sendMessage('/burger/cooking', type, payload);
};

export const sendAdminMessage = (type: string, payload?: any) => {
  burgerTomeManager.sendMessage('/burger/admin', type, payload);
}; 