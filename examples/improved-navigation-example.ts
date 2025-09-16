/**
 * Example demonstrating improved VS Code navigation for XState actions and withState parameters
 * 
 * This file shows how to structure your code for better IDE support:
 * 1. Named action functions for better command-click navigation
 * 2. Well-typed action creators
 * 3. Clear parameter documentation
 */

import { createViewStateMachine, createAssignAction, createNamedAction, type StateContext } from '../src/core/ViewStateMachine';

// Define your model type for better type safety
interface ExampleModel {
  count: number;
  items: string[];
  loading: boolean;
  error?: string;
}

// Define event types for better type safety
interface AddItemEvent {
  type: 'ADD_ITEM';
  payload: string;
}

interface RemoveItemEvent {
  type: 'REMOVE_ITEM';
  payload: string;
}

interface ClearItemsEvent {
  type: 'CLEAR_ITEMS';
}

type ExampleEvent = AddItemEvent | RemoveItemEvent | ClearItemsEvent;

// Create named action functions - these will be easily navigable
const addItemAction = createAssignAction<ExampleModel, AddItemEvent>((context, event) => ({
  items: [...context.items, event.payload]
}));

const removeItemAction = createAssignAction<ExampleModel, RemoveItemEvent>((context, event) => ({
  items: context.items.filter(item => item !== event.payload)
}));

const clearItemsAction = createAssignAction<ExampleModel>({ items: [] });

const setLoadingAction = createAssignAction<ExampleModel>({ loading: true });

const setErrorAction = createAssignAction<ExampleModel, { error: string }>((context, event) => ({
  error: event.error,
  loading: false
}));

// Create the state machine with improved action references
const exampleMachine = createViewStateMachine<ExampleModel>({
  machineId: 'example-machine',
  xstateConfig: {
    id: 'example-machine',
    initial: 'idle',
    context: {
      count: 0,
      items: [],
      loading: false
    },
    states: {
      idle: {
        on: {
          ADD_ITEM: {
            target: 'idle',
            actions: addItemAction // Now easily navigable!
          },
          REMOVE_ITEM: {
            target: 'idle',
            actions: removeItemAction // Now easily navigable!
          },
          CLEAR_ITEMS: {
            target: 'idle',
            actions: clearItemsAction // Now easily navigable!
          },
          START_LOADING: {
            target: 'loading',
            actions: setLoadingAction // Now easily navigable!
          }
        }
      },
      loading: {
        on: {
          SUCCESS: 'idle',
          ERROR: {
            target: 'error',
            actions: setErrorAction // Now easily navigable!
          }
        }
      },
      error: {
        on: {
          RETRY: 'loading',
          CLEAR_ERROR: 'idle'
        }
      }
    }
  }
});

// State handlers with improved parameter documentation
exampleMachine
  .withState('idle', async ({ state, model, log, view, transition, send }) => {
    // All parameters are now well-documented and navigable
    await log('Entered idle state', { 
      itemCount: model.items.length,
      count: model.count 
    });
    
    view(
      <div className="idle-state">
        <h2>Item Manager - Idle</h2>
        <p>Items: {model.items.length}</p>
        <p>Count: {model.count}</p>
        <div>
          <button onClick={() => send({ type: 'ADD_ITEM', payload: 'New Item' })}>
            Add Item
          </button>
          <button onClick={() => send({ type: 'CLEAR_ITEMS' })}>
            Clear All
          </button>
          <button onClick={() => send({ type: 'START_LOADING' })}>
            Start Loading
          </button>
        </div>
      </div>
    );
  })
  .withState('loading', async ({ state, model, log, view, send }) => {
    await log('Loading state active', { loading: model.loading });
    
    view(
      <div className="loading-state">
        <h2>Loading...</h2>
        <p>Please wait while we process your request</p>
        <button onClick={() => send({ type: 'SUCCESS' })}>
          Simulate Success
        </button>
        <button onClick={() => send({ type: 'ERROR', error: 'Something went wrong' })}>
          Simulate Error
        </button>
      </div>
    );
  })
  .withState('error', async ({ state, model, log, view, send }) => {
    await log('Error state', { error: model.error });
    
    view(
      <div className="error-state">
        <h2>Error Occurred</h2>
        <p>Error: {model.error}</p>
        <button onClick={() => send({ type: 'RETRY' })}>
          Retry
        </button>
        <button onClick={() => send({ type: 'CLEAR_ERROR' })}>
          Clear Error
        </button>
      </div>
    );
  });

// Export for use in other files
export { exampleMachine, type ExampleModel, type ExampleEvent };
