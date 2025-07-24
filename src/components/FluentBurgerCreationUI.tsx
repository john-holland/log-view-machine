import React from 'react';
import { createViewStateMachine } from 'log-view-machine';

// Create the fluent burger machine using the package
const fluentBurgerMachine = createViewStateMachine({
  machineId: 'fluent-burger-creation',
  xstateConfig: {
    id: 'fluent-burger-creation',
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
      idle: {
        on: {
          ADD_INGREDIENT: {
            target: 'idle',
            actions: 'addIngredient'
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
    },
    actions: {
      addIngredient: (context: any, event: any) => ({
        selectedIngredients: [...context.selectedIngredients, event.payload]
      }),
      toggleHungry: (context: any, event: any) => ({
        isHungry: event.payload
      }),
      setLoading: {
        loading: true,
        error: null
      },
      handleSuccess: (context: any, event: any) => ({
        burgers: [...context.burgers, event.data],
        loading: false
      }),
      handleError: (context: any, event: any) => ({
        error: event.data.message,
        loading: false
      }),
      setSuccessMessage: {
        successMessage: 'Burger created successfully!'
      },
      resetState: {
        selectedIngredients: [],
        isHungry: false,
        error: null,
        successMessage: null
      },
      clearError: {
        error: null
      }
    },
    services: {
      createBurgerService: async (context: any) => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          id: Date.now(),
          ingredients: context.selectedIngredients,
          isHungry: context.isHungry,
          state: 'READY'
        };
      }
    }
  }
})
.withState('idle', async ({ state, model, log, view, clear, on, send }) => {
  on('idle', () => {
    console.log('Entered idle state');
  });
  
  await log('Entered idle state', { 
    ingredients: model.selectedIngredients,
    isHungry: model.isHungry 
  });
  
  return view(
    <div className="state-block idle">
      <h2>Create Your Tasty Fish Burger (Fluent API)</h2>
      
      {/* Error Banner */}
      {model.error && (
        <div className="error-banner">
          <span>{model.error}</span>
          <button onClick={() => send({ type: 'CONTINUE' })}>×</button>
        </div>
      )}
      
      {/* Success Message */}
      {model.successMessage && (
        <div className="success-message">
          <span>{model.successMessage}</span>
          <button onClick={() => send({ type: 'CONTINUE' })}>×</button>
        </div>
      )}
      
      {/* Ingredient Selection */}
      <div className="ingredient-section">
        <h3>Select Ingredients</h3>
        <div className="ingredient-grid">
          {['lettuce', 'tomato', 'onion', 'cheese', 'bacon', 'pickles'].map(ingredient => {
            const currentIngredient = ingredient;
            return (
              <label key={ingredient} className="ingredient-item">
                <input
                  type="checkbox"
                  checked={model.selectedIngredients.includes(ingredient)}
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
            checked={model.isHungry}
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
})
.withState('creating', async ({ state, model, log, view, on }) => {
  on('creating', () => {
    console.log('Started burger creation');
  });
  
  await log('Starting burger creation', { 
    ingredients: model.selectedIngredients,
    isHungry: model.isHungry 
  });
  
  return view(
    <div className="state-block creating">
      <div className="loading-overlay">
        <div className="loading-spinner">Creating your burger...</div>
        <p>Selected ingredients: {model.selectedIngredients.join(', ')}</p>
        {model.isHungry && <p>Double portion mode!</p>}
      </div>
    </div>
  );
})
.withState('success', async ({ state, model, log, view, clear, on, send }) => {
  on('success', () => {
    console.log('Burger created successfully');
  });
  
  await log('Burger created successfully', { 
    burgerId: model.burgers[model.burgers.length - 1]?.id 
  });
  
  return view(
    <div className="state-block success">
      <h2>Burger Created Successfully!</h2>
      <div className="burger-info">
        <p>Ingredients: {model.selectedIngredients.join(', ')}</p>
        {model.isHungry && <p>Double portion served!</p>}
      </div>
      <button onClick={() => send({ type: 'CONTINUE' })}>Create Another</button>
    </div>
  );
})
.withState('error', async ({ state, model, log, view, on, send }) => {
  on('error', () => {
    console.log('Error occurred during burger creation');
  });
  
  await log('Error creating burger', { error: model.error });
  
  return view(
    <div className="state-block error">
      <h2>Error Creating Burger</h2>
      <p className="error-message">{model.error}</p>
      <button onClick={() => send({ type: 'RETRY' })}>Try Again</button>
      <button onClick={() => send({ type: 'CONTINUE' })}>Start Over</button>
    </div>
  );
});

// Main component that uses the fluent machine
const FluentBurgerCreationUI: React.FC = () => {
  const { 
    state, 
    context, 
    send, 
    logEntries, 
    viewStack,
    log, 
    view, 
    clear, 
    transition 
  } = fluentBurgerMachine.useViewStateMachine({
    selectedIngredients: [],
    isHungry: false,
    burgers: [],
    loading: false,
    error: null,
    successMessage: null
  });

  console.log('Current state:', state);
  console.log('Context:', context);
  console.log('Log entries:', logEntries);
  console.log('View stack:', viewStack);

  return (
    <div className="fluent-burger-creation-wrapper">
      <div className="fluent-burger-creation-container">
        {/* Header */}
        <div className="burger-header">
          <h1>Fluent API Burger Creation</h1>
          <p>Demonstrates ViewStateMachine fluent API</p>
        </div>
        
        {/* Navigation */}
        <div className="burger-nav">
          <span className="nav-item">State: {state}</span>
          <span className="nav-item">Log Entries: {logEntries.length}</span>
          <span className="nav-item">View Stack: {viewStack.length}</span>
        </div>
        
        {/* State-specific content */}
        <div className="burger-content">
          {/* Render the current view from the stack */}
          {viewStack.length > 0 ? (
            <div className="view-stack">
              {viewStack.map((view, index) => (
                <div key={index} className="view-container">
                  {view}
                </div>
              ))}
            </div>
          ) : (
            <div className="default-view">
              <p>No views in stack. Current state: {state}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="burger-footer">
          <p>Powered by ViewStateMachine Fluent API</p>
        </div>
      </div>
    </div>
  );
};

export default FluentBurgerCreationUI; 