import React from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';

// Pure state definitions - no business logic
const burgerMachine = createMachine({
  id: 'burger-creation',
  initial: 'idle',
  context: {
    selectedIngredients: [] as string[],
    isHungry: false,
    burgers: [] as any[],
    loading: false,
    error: null as string | null,
    successMessage: null as string | null
  },
  states: {
    // State definitions are pure - just transitions
    idle: {
      on: {
        ADD_INGREDIENT: {
          target: 'idle', // Stay in same state
          actions: 'addIngredient' // Business logic in action
        },
        REMOVE_INGREDIENT: {
          target: 'idle',
          actions: 'removeIngredient'
        },
        TOGGLE_HUNGRY: {
          target: 'idle',
          actions: 'toggleHungry'
        },
        CREATE_BURGER: 'creating',
        LOAD_BURGERS: 'loading',
        EAT_BURGER: {
          target: 'idle',
          actions: 'eatBurger'
        },
        TRASH_BURGER: {
          target: 'idle',
          actions: 'trashBurger'
        }
      }
    },
    loading: {
      invoke: {
        src: 'loadBurgersService',
        onDone: {
          target: 'idle',
          actions: 'loadBurgers'
        },
        onError: {
          target: 'error',
          actions: 'handleError'
        }
      }
    },
    creating: {
      entry: 'setLoading',
      invoke: {
        src: 'createBurgerService',
        onDone: {
          target: 'success',
          actions: 'handleSuccess'
        },
        onError: {
          target: 'error',
          actions: 'handleError'
        }
      }
    },
    success: {
      entry: 'setSuccessMessage',
      on: {
        CONTINUE: {
          target: 'idle',
          actions: 'resetState'
        }
      }
    },
    error: {
      on: {
        RETRY: 'creating',
        CONTINUE: {
          target: 'idle',
          actions: 'clearError'
        }
      }
    }
  }
}, {
  // Business logic handlers - separate from state definitions
  actions: {
    addIngredient: assign((context: any, event: any) => ({
      selectedIngredients: [...context.selectedIngredients, event.payload]
    })),
    removeIngredient: assign((context: any, event: any) => ({
      selectedIngredients: context.selectedIngredients.filter((ingredient: string) => ingredient !== event.payload)
    })),
    toggleHungry: assign((context: any, event: any) => ({
      isHungry: event.payload
    })),
    setLoading: assign({
      loading: true,
      error: null
    }),
    handleSuccess: assign((context: any, event: any) => ({
      burgers: [...context.burgers, event.data],
      loading: false
    })),
    handleError: assign((context: any, event: any) => ({
      error: event.data.message,
      loading: false
    })),
    setSuccessMessage: assign({
      successMessage: 'Burger created successfully!'
    }),
    resetState: assign({
      selectedIngredients: [],
      isHungry: false,
      error: null,
      successMessage: null
    }),
    clearError: assign({
      error: null
    }),
    loadBurgers: assign((context: any, event: any) => ({
      burgers: event.data
    })),
    eatBurger: assign((context: any, event: any) => ({
      burgers: context.burgers.map((burger: any) => 
        burger.id === event.data.id ? event.data : burger
      )
    })),
    trashBurger: assign((context: any, event: any) => ({
      burgers: context.burgers.map((burger: any) => 
        burger.id === event.data.id ? event.data : burger
      )
    }))
  },
  services: {
    createBurgerService: async (context: any) => {
      // Call the actual backend API
      const response = await fetch('http://localhost:3001/api/burgers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients: context.selectedIngredients,
          isHungry: context.isHungry
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create burger');
      }
      
      return await response.json();
    },
    loadBurgersService: async () => {
      const response = await fetch('http://localhost:3001/api/burgers');
      if (!response.ok) {
        throw new Error('Failed to load burgers');
      }
      return await response.json();
    },
    eatBurgerService: async (context: any, event: any) => {
      const response = await fetch(`http://localhost:3001/api/burgers/${event.payload}/eat`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to eat burger');
      }
      return await response.json();
    },
    trashBurgerService: async (context: any, event: any) => {
      const response = await fetch(`http://localhost:3001/api/burgers/${event.payload}/trash`, {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to trash burger');
      }
      return await response.json();
    }
  }
} as any);

// Container component for consistent UI elements
const BurgerContainer = ({ children, state }: { children: any; state: string }) => (
  <div className={`burger-creation-wrapper state-${state}`}>
    <div className="burger-creation-container">
      {/* Always present header */}
      <div className="burger-header">
        <h1>XState Burger Creation (Fluid Interface)</h1>
        <p>Demonstrates fluid withState interface and container pattern</p>
      </div>
      
      {/* Always present navigation */}
      <div className="burger-nav">
        <span className="nav-item">State: {state}</span>
        <span className="nav-item">Ingredients: {state === 'idle' ? 'Selecting' : 'Selected'}</span>
      </div>
      
      {/* State-specific content */}
      <div className="burger-content">
        {children}
      </div>
      
      {/* Always present footer */}
      <div className="burger-footer">
        <p>Powered by XState + ViewStateMachine</p>
      </div>
    </div>
  </div>
);

// Individual render blocks for each state
const IdleBlock = ({ state, send, testSend }: { state: any; send: any; testSend?: any }) => {
  console.log('IdleBlock render - state:', state.value, 'context:', state.context);
  return (
  <div className="state-block idle">
    <h2>Create Your Tasty Fish Burger</h2>
    
    {/* Error Banner */}
    {state.context.error && (
      <div className="error-banner">
        <span>{state.context.error}</span>
        <button onClick={() => send({ type: 'CONTINUE' })}>×</button>
      </div>
    )}
    
    {/* Success Message */}
    {state.context.successMessage && (
      <div className="success-message">
        <span>{state.context.successMessage}</span>
        <button onClick={() => send({ type: 'CONTINUE' })}>×</button>
      </div>
    )}
    
    {/* Ingredient Selection */}
    <div className="ingredient-section">
      <h3>Select Ingredients</h3>
      <div className="ingredient-grid">
        {['lettuce', 'tomato', 'onion', 'cheese', 'bacon', 'pickles'].map(ingredient => {
          const currentIngredient = ingredient; // Bootstrap to constant to fix closure
          return (
            <label key={ingredient} className="ingredient-item">
              <input
                type="checkbox"
                checked={state.context.selectedIngredients.includes(ingredient)}
                onChange={() => {
                  if (state.context.selectedIngredients.includes(currentIngredient)) {
                    console.log('Removing ingredient:', currentIngredient);
                    send({ type: 'REMOVE_INGREDIENT', payload: currentIngredient });
                  } else {
                    console.log('Adding ingredient:', currentIngredient);
                    send({ type: 'ADD_INGREDIENT', payload: currentIngredient });
                  }
                }}
              />
              <span>{ingredient}</span>
            </label>
          );
        })}
      </div>
    </div>
    
    {/* Hunger Level */}
    <div className="hunger-section">
      <h3>How Hungry Are You?</h3>
      <label className="hunger-toggle">
        <input
          type="checkbox"
          checked={state.context.isHungry}
          onChange={(e) => {
            console.log('Toggling hungry:', e.target.checked);
            send({ type: 'TOGGLE_HUNGRY', payload: e.target.checked });
          }}
        />
        <span>Very Hungry (Double Portion)</span>
      </label>
    </div>
    
    {/* Test Button */}
    <button
      className="test-button"
      onClick={() => {
        console.log('Test button clicked');
        testSend({ type: 'ADD_INGREDIENT', payload: 'test-ingredient' });
      }}
      style={{ backgroundColor: 'red', color: 'white', margin: '10px' }}
    >
      Test Event
    </button>
    
    {/* Create Button */}
    <button
      className="create-button"
      onClick={() => {
        console.log('Creating burger');
        send({ type: 'CREATE_BURGER' });
      }}
    >
      Create Burger
    </button>

    {/* Load Data Button */}
    <button
      className="load-button"
      onClick={() => {
        console.log('Loading burgers');
        send({ type: 'LOAD_BURGERS' });
      }}
    >
      Refresh Cart
    </button>

    {/* Burger List */}
    {state.context.burgers.length > 0 && (
      <div className="burger-list">
        <h3>Your Fish Burgers</h3>
        {state.context.burgers.map((burger: any) => (
          <div key={burger.id} className="burger-item">
            <div className="burger-info">
              <span className="burger-id">#{burger.id}</span>
              <span className={`burger-state ${burger.state.toLowerCase()}`}>
                {burger.state}
              </span>
              <span className="burger-ingredients">
                {burger.ingredients?.join(', ') || 'No ingredients'}
              </span>
              {burger.isHungry && <span className="hungry-badge">Double Portion</span>}
            </div>
            <div className="burger-actions">
              {burger.state === 'READY' && (
                <button
                  className="eat-button"
                  onClick={() => {
                    console.log('Eating burger:', burger.id);
                    send({ type: 'EAT_BURGER', payload: burger.id });
                  }}
                >
                  Eat
                </button>
              )}
              <button
                className="trash-button"
                onClick={() => {
                  console.log('Trashing burger:', burger.id);
                  send({ type: 'TRASH_BURGER', payload: burger.id });
                }}
              >
                Trash
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  );
};

const CreatingBlock = ({ state, send }: { state: any; send: any }) => (
  <div className="state-block creating">
    <div className="loading-overlay">
      <div className="loading-spinner">Creating your burger...</div>
      <p>Selected ingredients: {state.context.selectedIngredients.join(', ')}</p>
      {state.context.isHungry && <p>Double portion mode!</p>}
    </div>
  </div>
);

const LoadingBlock = ({ state }: { state: any; send: any }) => (
  <div className="state-block loading">
    <div className="loading-overlay">
      <div className="loading-spinner">Loading your burgers...</div>
      <p>Fetching cart data from backend...</p>
    </div>
  </div>
);

const SuccessBlock = ({ state, send }: { state: any; send: any }) => (
  <div className="state-block success">
    <h2>Burger Created Successfully!</h2>
    <div className="burger-info">
      <p>Ingredients: {state.context.selectedIngredients.join(', ')}</p>
      {state.context.isHungry && <p>Double portion served!</p>}
    </div>
    <button onClick={() => send({ type: 'CONTINUE' })}>Create Another</button>
  </div>
);

const ErrorBlock = ({ state, send }: { state: any; send: any }) => (
  <div className="state-block error">
    <h2>Error Creating Burger</h2>
    <p className="error-message">{state.context.error}</p>
    <button onClick={() => send({ type: 'RETRY' })}>Try Again</button>
    <button onClick={() => send({ type: 'CONTINUE' })}>Start Over</button>
  </div>
);

// Main component that uses the machine directly
const XStateBurgerCreationUI: React.FC = () => {
  const [state, send] = useMachine(burgerMachine);
  const currentState = state.value as string;
  
  // Test function to verify send is working
  const testSend = (event: any) => {
    console.log('Sending event:', event);
    send(event);
  };
  
  console.log('Current state:', currentState);
  console.log('Context:', state.context);
  console.log('Selected ingredients:', state.context.selectedIngredients);
  console.log('Is hungry:', state.context.isHungry);
  
  // Render appropriate block based on state
  let content;
  switch (currentState) {
    case 'idle':
      content = <IdleBlock state={state} send={send} testSend={testSend} />;
      break;
    case 'creating':
      content = <CreatingBlock state={state} send={send} />;
      break;
    case 'loading':
      content = <LoadingBlock state={state} send={send} />;
      break;
    case 'success':
      content = <SuccessBlock state={state} send={send} />;
      break;
    case 'error':
      content = <ErrorBlock state={state} send={send} />;
      break;
    default:
      content = <IdleBlock state={state} send={send} />;
  }
  
  return (
    <BurgerContainer state={currentState}>
      {content}
    </BurgerContainer>
  );
};

export default XStateBurgerCreationUI; 