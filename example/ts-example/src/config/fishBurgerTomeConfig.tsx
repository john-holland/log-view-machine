import React from 'react';
import { createTomeConfig, type TomeConfig } from 'log-view-machine';

export const fishBurgerTomeConfig: TomeConfig = createTomeConfig({
  id: 'fish-burger-tome',
  name: 'Fish Burger Tracing',
  description: 'Fish Burger with tracing and RobotCopy',
  version: '1.0.0',
  machines: {
    fishBurger: {
      id: 'fish-burger-with-tracing',
      name: 'Fish Burger with Tracing',
      description: 'Fish Burger state machine',
      xstateConfig: {
        id: 'fish-burger-with-tracing',
        initial: 'idle',
        context: {
          orderId: null as string | null,
          ingredients: [] as string[],
          cookingTime: 0,
          temperature: 0,
          backend: 'node' as 'kotlin' | 'node',
          traceId: null as string | null,
          messageHistory: [] as any[],
        },
        states: {
          idle: {
            on: {
              START_COOKING: {
                target: 'processing',
                actions: 'logStartCooking',
              },
            },
          },
          processing: {
            on: {
              UPDATE_PROGRESS: {
                target: 'processing',
                actions: 'logProgress',
              },
              COMPLETE_COOKING: {
                target: 'completed',
                actions: 'logCompletion',
              },
              ERROR: {
                target: 'error',
                actions: 'logError',
              },
            },
          },
          completed: {
            on: {
              RESET: {
                target: 'idle',
                actions: 'logReset',
              },
            },
          },
          error: {
            on: {
              RETRY: {
                target: 'processing',
                actions: 'logRetry',
              },
              RESET: {
                target: 'idle',
                actions: 'logReset',
              },
            },
          },
        },
      },
      logStates: {
        idle: async ({ model, log, view, transition }) => {
          await log('Fish burger machine is idle', {
            orderId: model.orderId,
            backend: model.backend,
            traceId: model.traceId,
          });
          view(
            <div className="idle-state">
              <h3>Fish Burger Machine - Idle</h3>
              <p>Backend: {model.backend}</p>
              <p>Trace ID: {model.traceId || 'None'}</p>
              <button onClick={() => transition('START_COOKING')}>Start Cooking</button>
            </div>
          );
        },
        processing: async ({ model, log, view, transition }) => {
          await log('Fish burger cooking in progress', {
            orderId: model.orderId,
            cookingTime: model.cookingTime,
            temperature: model.temperature,
            backend: model.backend,
            traceId: model.traceId,
          });
          view(
            <div className="processing-state">
              <h3>Fish Burger Machine - Processing</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Cooking Time: {model.cookingTime}s</p>
              <p>Temperature: {model.temperature}°F</p>
              <p>Backend: {model.backend}</p>
              <p>Trace ID: {model.traceId}</p>
              <button onClick={() => transition('COMPLETE_COOKING')}>Complete Cooking</button>
              <button onClick={() => transition('ERROR')}>Simulate Error</button>
            </div>
          );
        },
        completed: async ({ model, log, view, transition }) => {
          await log('Fish burger cooking completed', {
            orderId: model.orderId,
            backend: model.backend,
            traceId: model.traceId,
          });
          view(
            <div className="completed-state">
              <h3>Fish Burger Machine - Completed</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Backend: {model.backend}</p>
              <p>Trace ID: {model.traceId}</p>
              <button onClick={() => transition('RESET')}>Reset Machine</button>
            </div>
          );
        },
        error: async ({ model, log, view, transition }) => {
          await log('Error occurred while cooking fish burger', {
            orderId: model.orderId,
            backend: model.backend,
            traceId: model.traceId,
          });
          view(
            <div className="error-state">
              <h3>Fish Burger Machine - Error</h3>
              <p>Order ID: {model.orderId}</p>
              <p>Backend: {model.backend}</p>
              <p>Trace ID: {model.traceId}</p>
              <button onClick={() => transition('RETRY')}>Retry</button>
              <button onClick={() => transition('RESET')}>Reset</button>
            </div>
          );
        },
      },
    },
  },
});
