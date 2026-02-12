import { createMachine, interpret, assign } from 'xstate';

/**
 * Fish Burger State Machine with Cart Functionality
 * Extracted from node-mod-editor for use in standalone fish burger server
 */
export function createFishBurgerStateMachine() {
  return createMachine({
    id: 'fish-burger',
    initial: 'idle',
    context: {
      order: [],
      progress: 0,
      cookingTime: 0,
      temperature: 0,
      orderId: null,
      message: 'Ready to take your fish burger order!'
    },
    states: {
      idle: {
        on: {
          START_ORDER: 'ordering',
          VIEW_MENU: 'viewing_menu',
          START_COOKING: { target: 'cooking', actions: assign({ orderId: (_, ev) => ev.orderId ?? null, cookingTime: 0, temperature: 0, progress: 0 }) }
        }
      },
      ordering: {
        on: {
          ADD_INGREDIENT: 'adding_ingredient',
          REMOVE_INGREDIENT: 'removing_ingredient',
          COMPLETE_ORDER: 'order_complete',
          CANCEL_ORDER: 'idle',
          START_COOKING: 'cooking'
        }
      },
      adding_ingredient: {
        on: {
          INGREDIENT_ADDED: 'ordering',
          ERROR: 'ordering'
        }
      },
      removing_ingredient: {
        on: {
          INGREDIENT_REMOVED: 'ordering',
          ERROR: 'ordering'
        }
      },
      viewing_menu: {
        on: {
          BACK_TO_ORDER: 'ordering',
          CLOSE_MENU: 'idle'
        }
      },
      cooking: {
        on: {
          UPDATE_PROGRESS: {
            target: 'cooking',
            actions: assign({
              cookingTime: (_, ev) => ev.cookingTime ?? 0,
              temperature: (_, ev) => ev.temperature ?? 0,
              progress: (ctx, ev) => ev.progress ?? ctx.progress
            })
          },
          COOKING_COMPLETE: 'order_complete',
          COMPLETE_COOKING: 'order_complete',
          PAUSE_COOKING: 'paused',
          ERROR: 'cooking',
          RETRY: 'cooking',
          RESET: 'idle'
        }
      },
      paused: {
        on: {
          RESUME_COOKING: 'cooking',
          CANCEL_COOKING: 'idle',
          RESET: 'idle'
        }
      },
      order_complete: {
        on: {
          NEW_ORDER: 'idle',
          START_COOKING: { target: 'cooking', actions: assign({ orderId: (_, ev) => ev.orderId ?? null, cookingTime: 0, temperature: 0, progress: 0 }) },
          VIEW_ORDER: 'viewing_order',
          RESET: 'idle'
        }
      },
      viewing_order: {
        on: {
          NEW_ORDER: 'idle',
          BACK_TO_ORDERING: 'ordering'
        }
      }
    }
  });
}
