# XState Integration Concepts

This document explains the key concepts behind the XState integration and how it addresses your questions about state definitions, business logic separation, view model mutation, and ViewStateMachine render blocks.

## 1. State Definitions as Pure Configuration

### The Problem
In traditional state machines, state definitions often mix configuration with business logic:

```typescript
// BAD: Business logic mixed with state definition
states: {
  idle: {
    on: {
      ADD_INGREDIENT: {
        target: 'idle',
        actions: (context, event) => {
          // Business logic directly in state definition
          context.selectedIngredients.push(event.payload);
          context.updateUI();
          context.logAction('ingredient_added');
        }
      }
    }
  }
}
```

### The Solution
State definitions should be pure configuration - just transitions and action names:

```typescript
// GOOD: Pure state definitions
states: {
  idle: {
    on: {
      ADD_INGREDIENT: {
        target: 'idle',
        actions: 'addIngredient' // Just a name, no logic
      },
      TOGGLE_HUNGRY: {
        target: 'idle', 
        actions: 'toggleHungry'
      },
      CREATE_BURGER: 'creating'
    }
  }
}
```

## 2. Business Logic in Action Handlers

Business logic is separated into action handlers, keeping state definitions pure:

```typescript
// Business logic handlers - separate from state definitions
actions: {
  addIngredient: assign((context, event) => ({
    selectedIngredients: [...context.selectedIngredients, event.payload]
  })),
  toggleHungry: assign((context, event) => ({
    isHungry: event.payload
  })),
  setLoading: assign({
    loading: true,
    error: null
  }),
  handleSuccess: assign((context, event) => ({
    burgers: [...context.burgers, event.data],
    loading: false
  }))
}
```

### Benefits
- **Separation of Concerns**: State definitions focus on transitions, actions focus on logic
- **Testability**: Business logic can be tested independently
- **Reusability**: Actions can be reused across different states
- **Maintainability**: Changes to business logic don't require state definition changes

## 3. View Model Mutation Through XState Actions

### How View Model Gets Mutated

The view model (context) is mutated through XState's `assign` function in action handlers:

```typescript
// View model mutation through actions
actions: {
  addIngredient: assign((context, event) => ({
    // Mutates the view model by returning new state
    selectedIngredients: [...context.selectedIngredients, event.payload]
  })),
  
  handleSuccess: assign((context, event) => ({
    // Multiple view model updates in one action
    burgers: [...context.burgers, event.data],
    loading: false,
    successMessage: 'Burger created successfully!'
  }))
}
```

### Key Points
- **Immutable Updates**: XState enforces immutable updates through `assign`
- **Reactive UI**: React automatically re-renders when context changes
- **Predictable State**: All mutations go through defined actions
- **Debugging**: XState DevTools show all state transitions and mutations

## 4. ViewStateMachine Render Blocks

### The Problem with Traditional Components
Traditional React components often mix state logic with rendering:

```typescript
// BAD: Mixed concerns
const BurgerComponent = () => {
  const [state, setState] = useState('idle');
  const [ingredients, setIngredients] = useState([]);
  
  const handleAddIngredient = (ingredient) => {
    setIngredients([...ingredients, ingredient]);
    // Business logic mixed with UI logic
  };
  
  // Rendering logic mixed with state management
  if (state === 'idle') {
    return <IdleView />;
  } else if (state === 'creating') {
    return <CreatingView />;
  }
};
```

### The Solution: Render Blocks
Each state has its own render block, making the relationship between state and UI explicit:

```typescript
// GOOD: Render blocks for different states
const renderBlocks = {
  idle: ({ state, send }) => (
    <div className="state-block idle">
      <h2>Create Your Tasty Fish Burger</h2>
      {/* UI specific to idle state */}
    </div>
  ),
  
  creating: ({ state, send }) => (
    <div className="state-block creating">
      <div className="loading-overlay">
        <div className="loading-spinner">Creating your burger...</div>
        {/* UI specific to creating state */}
      </div>
    </div>
  ),
  
  success: ({ state, send }) => (
    <div className="state-block success">
      <h2>Burger Created Successfully!</h2>
      {/* UI specific to success state */}
    </div>
  )
};
```

### Benefits of Render Blocks
- **State-UI Mapping**: Clear relationship between states and UI
- **Separation**: UI logic separated from state management
- **Maintainability**: Easy to modify UI for specific states
- **Reusability**: Render blocks can be reused across different machines

## 5. TomSelector with Invoke States

### The Question: Don't we want invoke states for ingredient management?

Yes! The `ingredientSelector` should have invoke states for proper ingredient management:

```typescript
// Current implementation (needs improvement)
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
        ADD_INGREDIENT: {
          target: 'hasIngredients',
          actions: assign((context, event) => ({
            selectedIngredients: [...context.selectedIngredients, event.payload]
          }))
        }
      }
    },
    hasIngredients: {
      on: {
        ADD_INGREDIENT: {
          target: 'hasIngredients',
          actions: assign((context, event) => ({
            selectedIngredients: [...context.selectedIngredients, event.payload]
          }))
        },
        REMOVE_INGREDIENT: {
          target: 'hasIngredients',
          actions: assign((context, event) => ({
            selectedIngredients: context.selectedIngredients.filter(ing => ing !== event.payload)
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
}
```

### Better Implementation with Invoke States

```typescript
// Better: Using invoke states for ingredient management
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
        ADD_INGREDIENT: {
          target: 'loading',
          actions: 'prepareIngredient'
        }
      }
    },
    loading: {
      invoke: {
        src: 'ingredientValidationService',
        onDone: {
          target: 'hasIngredients',
          actions: 'addValidatedIngredient'
        },
        onError: {
          target: 'error',
          actions: 'handleIngredientError'
        }
      }
    },
    hasIngredients: {
      on: {
        ADD_INGREDIENT: {
          target: 'loading'
        },
        REMOVE_INGREDIENT: {
          target: 'removing',
          actions: 'prepareRemoval'
        },
        CLEAR_ALL: {
          target: 'clearing',
          invoke: {
            src: 'clearIngredientsService',
            onDone: 'empty'
          }
        }
      }
    },
    removing: {
      invoke: {
        src: 'removeIngredientService',
        onDone: 'hasIngredients',
        onError: 'error'
      }
    },
    clearing: {
      // State for clearing all ingredients
    },
    error: {
      on: {
        RETRY: 'loading',
        CONTINUE: 'hasIngredients'
      }
    }
  }
}
```

## 6. Architecture Summary

### State Definitions (Pure Configuration)
```typescript
states: {
  idle: {
    on: {
      ADD_INGREDIENT: {
        target: 'idle',
        actions: 'addIngredient' // Just names, no logic
      }
    }
  }
}
```

### Business Logic (Action Handlers)
```typescript
actions: {
  addIngredient: assign((context, event) => ({
    selectedIngredients: [...context.selectedIngredients, event.payload]
  }))
}
```

### View Model Mutation (Through Actions)
```typescript
// View model gets mutated when actions are called
send({ type: 'ADD_INGREDIENT', payload: 'lettuce' })
// → triggers addIngredient action
// → mutates context.selectedIngredients
// → React re-renders with new state
```

### Render Blocks (State-Specific UI)
```typescript
const renderBlocks = {
  idle: ({ state, send }) => <IdleUI state={state} send={send} />,
  creating: ({ state, send }) => <CreatingUI state={state} send={send} />,
  success: ({ state, send }) => <SuccessUI state={state} send={send} />
};
```

## 7. Benefits of This Approach

1. **Separation of Concerns**: State definitions, business logic, and UI are separate
2. **Testability**: Each part can be tested independently
3. **Maintainability**: Changes to one part don't affect others
4. **Reusability**: Actions and render blocks can be reused
5. **Predictability**: All state changes go through defined actions
6. **Debugging**: XState DevTools provide excellent debugging capabilities

## 8. Migration Strategy

### From Current System to XState
1. **Extract State Definitions**: Convert current state logic to pure XState state definitions
2. **Move Business Logic**: Move business logic to XState action handlers
3. **Create Render Blocks**: Convert current UI components to render blocks
4. **Update View Model**: Ensure view model mutations go through XState actions
5. **Add Invoke States**: Add proper invoke states for async operations

This approach maintains all existing capabilities while providing better separation, testability, and maintainability. 