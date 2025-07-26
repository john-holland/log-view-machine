import React from 'react';
import { createViewStateMachine, createRobotCopy, createClientGenerator } from 'log-view-machine';

// Create a sub-machine for ingredient selection
const ingredientSelectorMachine = createViewStateMachine({
  machineId: 'ingredient-selector',
  xstateConfig: {
    id: 'ingredient-selector',
    initial: 'selecting',
    context: {
      availableIngredients: ['lettuce', 'tomato', 'onion', 'cheese', 'bacon', 'pickles'],
      selectedIngredients: [] as string[],
      searchTerm: ''
    },
    states: {
      selecting: {
        on: {
          SELECT_INGREDIENT: {
            target: 'selecting',
            actions: 'addIngredient'
          },
          REMOVE_INGREDIENT: {
            target: 'selecting',
            actions: 'removeIngredient'
          },
          CONFIRM_SELECTION: 'confirmed'
        }
      },
      confirmed: {
        on: {
          MODIFY_SELECTION: 'selecting'
        }
      }
    },
    actions: {
      addIngredient: (context: any, event: any) => ({
        selectedIngredients: [...context.selectedIngredients, event.payload]
      }),
      removeIngredient: (context: any, event: any) => ({
        selectedIngredients: context.selectedIngredients.filter((ing: string) => ing !== event.payload)
      })
    }
  }
})
.withState('selecting', async ({ state, model, log, view, send }) => {
  await log('Ingredient selector: selecting state', { 
    available: model.availableIngredients.length,
    selected: model.selectedIngredients.length 
  });
  
  return view(
    <div className="ingredient-selector">
      <h3>Select Ingredients</h3>
      <div className="ingredient-grid">
        {model.availableIngredients.map((ingredient: string) => {
          const currentIngredient = ingredient;
          return (
            <label key={ingredient} className="ingredient-item">
              <input
                type="checkbox"
                checked={model.selectedIngredients.includes(ingredient)}
                onChange={() => {
                  if (model.selectedIngredients.includes(ingredient)) {
                    send({ type: 'REMOVE_INGREDIENT', payload: currentIngredient });
                  } else {
                    send({ type: 'SELECT_INGREDIENT', payload: currentIngredient });
                  }
                }}
              />
              <span>{ingredient}</span>
            </label>
          );
        })}
      </div>
      <button 
        onClick={() => send({ type: 'CONFIRM_SELECTION' })}
        disabled={model.selectedIngredients.length === 0}
      >
        Confirm Selection ({model.selectedIngredients.length})
      </button>
    </div>
  );
})
.withState('confirmed', async ({ state, model, log, view, send }) => {
  await log('Ingredient selector: confirmed state', { 
    selected: model.selectedIngredients 
  });
  
  return view(
    <div className="ingredient-confirmed">
      <h3>Ingredients Confirmed</h3>
      <p>Selected: {model.selectedIngredients.join(', ')}</p>
      <button onClick={() => send({ type: 'MODIFY_SELECTION' })}>
        Modify Selection
      </button>
    </div>
  );
});

// Create the main machine with sub-machines
const advancedBurgerMachine = createViewStateMachine({
  machineId: 'advanced-burger-creation',
  xstateConfig: {
    id: 'advanced-burger-creation',
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
          START_SELECTION: 'selecting',
          TOGGLE_HUNGRY: {
            target: 'idle',
            actions: 'toggleHungry'
          },
          CREATE_BURGER: 'creating'
        }
      },
      selecting: {
        on: {
          INGREDIENTS_CONFIRMED: 'idle',
          CANCEL_SELECTION: 'idle'
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
.withState('idle', async ({ state, model, log, view, clear, on, send, subMachine }) => {
  on('idle', () => {
    console.log('Entered advanced idle state');
  });
  
  await log('Entered advanced idle state', { 
    ingredients: model.selectedIngredients,
    isHungry: model.isHungry 
  });
  
  return view(
    <div className="state-block advanced-idle">
      <h2>Advanced Burger Creation (Sub-Machines + RobotCopy)</h2>
      
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
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="action-button"
          onClick={() => send({ type: 'START_SELECTION' })}
        >
          Select Ingredients
        </button>
        
        <button
          className="action-button"
          onClick={() => send({ type: 'CREATE_BURGER' })}
          disabled={model.selectedIngredients.length === 0}
        >
          Create Burger ({model.selectedIngredients.length} ingredients)
        </button>
      </div>
    </div>
  );
})
.withState('selecting', async ({ state, model, log, view, on, send, getSubMachine }) => {
  on('selecting', () => {
    console.log('Started ingredient selection');
  });
  
  await log('Started ingredient selection');
  
  // Get the ingredient selector sub-machine
  const ingredientSelector = getSubMachine('ingredientSelector');
  
  return view(
    <div className="state-block selecting">
      <h2>Select Your Ingredients</h2>
      {ingredientSelector && (
        <div className="sub-machine-container">
          {ingredientSelector.render(model)}
        </div>
      )}
      <button onClick={() => send({ type: 'CANCEL_SELECTION' })}>
        Cancel Selection
      </button>
    </div>
  );
})
.withState('creating', async ({ state, model, log, view, on }) => {
  on('creating', () => {
    console.log('Started advanced burger creation');
  });
  
  await log('Starting advanced burger creation', { 
    ingredients: model.selectedIngredients,
    isHungry: model.isHungry 
  });
  
  return view(
    <div className="state-block creating">
      <div className="loading-overlay">
        <div className="loading-spinner">Creating your advanced burger...</div>
        <p>Selected ingredients: {model.selectedIngredients.join(', ')}</p>
        {model.isHungry && <p>Double portion mode!</p>}
      </div>
    </div>
  );
})
.withState('success', async ({ state, model, log, view, clear, on, send }) => {
  on('success', () => {
    console.log('Advanced burger created successfully');
  });
  
  await log('Advanced burger created successfully', { 
    burgerId: model.burgers[model.burgers.length - 1]?.id 
  });
  
  return view(
    <div className="state-block success">
      <h2>Advanced Burger Created Successfully!</h2>
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
    console.log('Error occurred during advanced burger creation');
  });
  
  await log('Error creating advanced burger', { error: model.error });
  
  return view(
    <div className="state-block error">
      <h2>Error Creating Advanced Burger</h2>
      <p className="error-message">{model.error}</p>
      <button onClick={() => send({ type: 'RETRY' })}>Try Again</button>
      <button onClick={() => send({ type: 'CONTINUE' })}>Start Over</button>
    </div>
  );
});

// Main component that demonstrates sub-machines and RobotCopy
const AdvancedFluentDemo: React.FC = () => {
  const { 
    state, 
    context, 
    send, 
    logEntries, 
    viewStack, 
    subMachines,
    log, 
    view, 
    clear, 
    transition,
    subMachine,
    getSubMachine 
  } = advancedBurgerMachine.useViewStateMachine({
    selectedIngredients: [],
    isHungry: false,
    burgers: [],
    loading: false,
    error: null,
    successMessage: null
  });

  // Set up RobotCopy for message broker
  const robotCopy = createRobotCopy();
  robotCopy.registerMachine('advanced-burger-creation', advancedBurgerMachine, {
    description: 'Advanced burger creation with sub-machines and RobotCopy message broker',
    messageBrokers: [
      {
        type: 'window-intercom',
        config: {
          targetOrigin: '*',
          messageType: 'burger-creation-event',
          timeout: 5000
        }
      },
      {
        type: 'http-api',
        config: {
          baseUrl: 'https://api.burger.com',
          headers: { 'Authorization': 'Bearer token' },
          timeout: 10000
        }
      },
      {
        type: 'graphql',
        config: {
          endpoint: 'https://api.burger.com/graphql',
          headers: { 'Authorization': 'Bearer token' },
          timeout: 10000
        }
      }
    ],
    autoDiscovery: true,
    clientSpecification: {
      supportedLanguages: ['typescript', 'react', 'kotlin'],
      autoGenerateClients: true,
      includeExamples: true,
      includeDocumentation: true
    }
  });

  // Set up ClientGenerator for code generation
  const clientGenerator = createClientGenerator();
  clientGenerator.registerMachine('advanced-burger-creation', advancedBurgerMachine, {
    description: 'Advanced burger creation with sub-machines and ClientGenerator',
    version: '1.0.0',
    author: 'ViewStateMachine Team',
    tags: ['burger', 'sub-machines', 'fluent-api'],
    examples: [
      {
        name: 'Sub-Machine Composition',
        description: 'How to compose sub-machines in the fluent API',
        language: 'typescript',
        code: `
const parentMachine = createViewStateMachine({
  machineId: 'parent',
  xstateConfig: { /* config */ },
  subMachines: {
    child: { machineId: 'child', xstateConfig: { /* config */ } }
  }
})
.withState('selecting', async ({ getSubMachine, view }) => {
  const childMachine = getSubMachine('child');
  return view(childMachine.render(model));
});`
      }
    ]
  });

  // Discover and generate documentation
  const robotCopyDiscovery = robotCopy.discover();
  const clientGeneratorDiscovery = clientGenerator.discover();
  const typescriptClient = clientGenerator.generateClientCode('typescript', 'advanced-burger-creation');
  const reactClient = clientGenerator.generateClientCode('react', 'advanced-burger-creation');

  console.log('Current state:', state);
  console.log('Context:', context);
  console.log('Log entries:', logEntries);
  console.log('View stack:', viewStack);
  console.log('Sub-machines:', subMachines);
  console.log('RobotCopy discovery:', robotCopyDiscovery);
  console.log('ClientGenerator discovery:', clientGeneratorDiscovery);
  console.log('Generated TypeScript client:', typescriptClient);
  console.log('Generated React client:', reactClient);

  return (
    <div className="advanced-fluent-demo-wrapper">
      <div className="advanced-fluent-demo-container">
        {/* Header */}
        <div className="demo-header">
          <h1>Advanced Fluent API Demo</h1>
          <p>Sub-Machines + RobotCopy Discovery</p>
        </div>
        
        {/* Navigation */}
        <div className="demo-nav">
          <span className="nav-item">State: {state}</span>
          <span className="nav-item">Log Entries: {logEntries.length}</span>
          <span className="nav-item">View Stack: {viewStack.length}</span>
          <span className="nav-item">Sub-Machines: {subMachines.size}</span>
        </div>
        
        {/* State-specific content */}
        <div className="demo-content">
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
        
        {/* RobotCopy Discovery Panel */}
        <div className="robotcopy-panel">
          <h3>🤖 RobotCopy Discovery</h3>
          <div className="discovery-info">
            <p><strong>Machines Discovered:</strong> {robotCopyDiscovery.machines.size}</p>
            <p><strong>Message Brokers:</strong> {robotCopyDiscovery.messageBrokers.length}</p>
            <p><strong>Configurations:</strong> {robotCopyDiscovery.configurations.size}</p>
            <p><strong>Capabilities:</strong> {robotCopyDiscovery.capabilities.size}</p>
          </div>
          
          <div className="generated-code">
            <h4>Generated TypeScript Client:</h4>
            <pre className="code-block">
              <code>{typescriptClient}</code>
            </pre>
          </div>
        </div>
        
        {/* Footer */}
        <div className="demo-footer">
          <p>Powered by Advanced ViewStateMachine with Sub-Machines & RobotCopy</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFluentDemo; 