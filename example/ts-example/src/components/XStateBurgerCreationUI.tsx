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
        TOGGLE_HUNGRY: {
          target: 'idle',
          actions: 'toggleHungry'
        },
        CREATE_BURGER: 'creating'
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
    })
  },
  services: {
    createBurgerService: async (context: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        id: Date.now(),
        ingredients: context.selectedIngredients,
        isHungry: context.isHungry,
        state: 'READY'
      };
    }
  }
} as any);

// Container component for consistent UI elements
const BurgerContainer = ({ children, state }: { children: React.ReactNode; state: string }) => (
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
const IdleBlock = ({ state, send }: { state: any; send: any }) => (
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
                  console.log('Adding ingredient:', currentIngredient);
                  send({ type: 'ADD_INGREDIENT', payload: currentIngredient });
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
  </div>
);

const CreatingBlock = ({ state, send }: { state: any; send: any }) => (
  <div className="state-block creating">
    <div className="loading-overlay">
      <div className="loading-spinner">Creating your burger...</div>
      <p>Selected ingredients: {state.context.selectedIngredients.join(', ')}</p>
      {state.context.isHungry && <p>Double portion mode!</p>}
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
  
  console.log('Current state:', currentState);
  console.log('Context:', state.context);
  
  // Render appropriate block based on state
  let content;
  switch (currentState) {
    case 'idle':
      content = <IdleBlock state={state} send={send} />;
      break;
    case 'creating':
      content = <CreatingBlock state={state} send={send} />;
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