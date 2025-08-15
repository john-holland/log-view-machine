/**
 * Pact Test Proxy for API Proxy Machines
 * 
 * This proxy intercepts requests to the API proxy machines and provides
 * controlled test data, allowing us to test cart components without
 * making real API calls. It can be instrumented with pact test data
 * for various test scenarios.
 */

import { createProxyRobotCopyStateMachine } from 'log-view-machine';

// Test data scenarios for different test cases
const TEST_SCENARIOS = {
  // Happy path - successful cart operations
  HAPPY_PATH: {
    cart: {
      items: [
        { id: 'burger-1', name: 'Classic Burger', price: 12.99, quantity: 1 },
        { id: 'fries-1', name: 'French Fries', price: 4.99, quantity: 2 }
      ],
      total: 22.97,
      status: 'active'
    },
    checkout: {
      customerInfo: { name: 'Test User', email: 'test@example.com' },
      shippingInfo: { address: '123 Test St', city: 'Test City' },
      paymentInfo: { method: 'credit_card', last4: '1234' },
      orderId: 'TEST-ORDER-001'
    }
  },
  
  // Error scenarios
  ERROR_SCENARIOS: {
    NETWORK_ERROR: {
      type: 'network_error',
      message: 'Network connection failed',
      retryable: true
    },
    VALIDATION_ERROR: {
      type: 'validation_error',
      message: 'Invalid input data',
      fields: ['email', 'address'],
      retryable: false
    },
    PAYMENT_ERROR: {
      type: 'payment_error',
      message: 'Payment processing failed',
      code: 'INSUFFICIENT_FUNDS',
      retryable: false
    }
  },
  
  // Edge cases
  EDGE_CASES: {
    EMPTY_CART: {
      cart: { items: [], total: 0, status: 'empty' },
      checkout: null
    },
    LARGE_ORDER: {
      cart: {
        items: Array.from({ length: 50 }, (_, i) => ({
          id: `item-${i}`,
          name: `Test Item ${i}`,
          price: 9.99,
          quantity: 1
        })),
        total: 499.50,
        status: 'active'
      }
    },
    TIMEOUT_SCENARIO: {
      type: 'timeout',
      message: 'Request timed out',
      retryable: true
    }
  }
};

// Pact test configuration
const PACT_CONFIG = {
  // Test mode - can be 'happy_path', 'error_scenarios', 'edge_cases', or 'mixed'
  testMode: 'happy_path',
  
  // Response delays for testing loading states
  responseDelay: {
    min: 100,  // ms
    max: 2000  // ms
  },
  
  // Error injection probability (0.0 to 1.0)
  errorProbability: 0.1,
  
  // Test data overrides
  overrides: {},
  
  // Pact test hooks
  hooks: {
    beforeRequest: null,
    afterRequest: null,
    onError: null
  }
};

/**
 * Create a pact test proxy that intercepts API proxy machines
 */
export async function createPactTestProxy(robotCopy, config = {}) {
  const pactConfig = { ...PACT_CONFIG, ...config };
  
  console.log('🔧 Creating Pact Test Proxy with config:', pactConfig);
  
  // Create the pact test proxy machine
  const pactTestProxy = createProxyRobotCopyStateMachine({
    machineId: 'pact-test-proxy',
    robotCopy: robotCopy,
    xstateConfig: {
      initial: 'idle',
      context: {
        testMode: pactConfig.testMode,
        responseDelay: pactConfig.responseDelay,
        errorProbability: pactConfig.errorProbability,
        overrides: pactConfig.overrides,
        hooks: pactConfig.hooks,
        requestCount: 0,
        errorCount: 0,
        lastRequest: null
      },
      states: {
        idle: {
          on: {
            INTERCEPT_REQUEST: 'intercepting',
            UPDATE_CONFIG: 'updating_config',
            RESET_STATS: 'resetting_stats'
          }
        },
        intercepting: {
          on: {
            PROCESS_REQUEST: 'processing',
            INJECT_ERROR: 'injecting_error',
            PROVIDE_TEST_DATA: 'providing_data'
          }
        },
        processing: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error',
            TIMEOUT: 'timeout'
          }
        },
        injecting_error: {
          on: {
            ERROR_INJECTED: 'error'
          }
        },
        providing_data: {
          on: {
            DATA_READY: 'success'
          }
        },
        success: {
          on: {
            RESET: 'idle',
            CONTINUE: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'intercepting',
            RESET: 'idle'
          }
        },
        timeout: {
          on: {
            RETRY: 'intercepting',
            RESET: 'idle'
          }
        },
        updating_config: {
          on: {
            CONFIG_UPDATED: 'idle'
          }
        },
        resetting_stats: {
          on: {
            STATS_RESET: 'idle'
          }
        }
      }
    }
  })
  .withState('idle', async ({ log, view, context }) => {
    await log('Pact Test Proxy: Idle state');
    return view({
      status: 'idle',
      testMode: context.testMode,
      stats: {
        requestCount: context.requestCount,
        errorCount: context.errorCount,
        lastRequest: context.lastRequest
      },
      config: {
        responseDelay: context.responseDelay,
        errorProbability: context.errorProbability
      }
    });
  })
  .withState('intercepting', async ({ log, view, send, event }) => {
    const { request, proxyType } = event.data || {};
    await log('Pact Test Proxy: Intercepting request', { request, proxyType });
    
    // Update request count
    context.requestCount++;
    context.lastRequest = {
      timestamp: new Date().toISOString(),
      proxyType,
      request: request ? JSON.stringify(request) : 'No request data'
    };
    
    // Determine if we should inject an error
    const shouldInjectError = Math.random() < context.errorProbability;
    
    if (shouldInjectError) {
      await log('Pact Test Proxy: Injecting error based on probability');
      return send('INJECT_ERROR', { 
        error: TEST_SCENARIOS.ERROR_SCENARIOS.NETWORK_ERROR 
      });
    }
    
    // Process the request normally
    return send('PROCESS_REQUEST', { request, proxyType });
  })
  .withState('processing', async ({ log, view, send, event }) => {
    const { request, proxyType } = event.data || {};
    await log('Pact Test Proxy: Processing request', { request, proxyType });
    
    // Simulate response delay
    const delay = Math.random() * 
      (context.responseDelay.max - context.responseDelay.min) + 
      context.responseDelay.min;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Generate test data based on test mode
    const testData = generateTestData(context.testMode, request, proxyType);
    
    await log('Pact Test Proxy: Generated test data', { testData });
    return send('SUCCESS', { data: testData, delay });
  })
  .withState('injecting_error', async ({ log, view, send, event }) => {
    const { error } = event.data || {};
    await log('Pact Test Proxy: Injecting error', { error });
    
    // Update error count
    context.errorCount++;
    
    return send('ERROR_INJECTED', { error });
  })
  .withState('providing_data', async ({ log, view, send, event }) => {
    const { request, proxyType } = event.data || {};
    await log('Pact Test Proxy: Providing test data', { request, proxyType });
    
    // Generate test data
    const testData = generateTestData(context.testMode, request, proxyType);
    
    return send('DATA_READY', { data: testData });
  })
  .withState('success', async ({ log, view, context }) => {
    await log('Pact Test Proxy: Success state');
    return view({
      status: 'success',
      data: context.data,
      stats: {
        requestCount: context.requestCount,
        errorCount: context.errorCount,
        lastRequest: context.lastRequest
      }
    });
  })
  .withState('error', async ({ log, view, context }) => {
    await log('Pact Test Proxy: Error state');
    return view({
      status: 'error',
      error: context.error,
      stats: {
        requestCount: context.requestCount,
        errorCount: context.errorCount,
        lastRequest: context.lastRequest
      }
    });
  })
  .withState('timeout', async ({ log, view }) => {
    await log('Pact Test Proxy: Timeout state');
    return view({
      status: 'timeout',
      message: 'Request timed out',
      timestamp: new Date().toISOString()
    });
  })
  .withState('updating_config', async ({ log, view, send, event }) => {
    const { newConfig } = event.data || {};
    await log('Pact Test Proxy: Updating configuration', { newConfig });
    
    // Update configuration
    Object.assign(context, newConfig);
    
    return send('CONFIG_UPDATED');
  })
  .withState('resetting_stats', async ({ log, view, send }) => {
    await log('Pact Test Proxy: Resetting statistics');
    
    // Reset statistics
    context.requestCount = 0;
    context.errorCount = 0;
    context.lastRequest = null;
    
    return send('STATS_RESET');
  });

  // Register the pact test proxy with RobotCopy
  robotCopy.registerMachine('pact-test-proxy', pactTestProxy, {
    description: 'Pact Test Proxy for API Proxy Machines',
    messageBrokers: [
      { type: 'pact-test', config: pactConfig }
    ]
  });

  console.log('✅ Pact Test Proxy created and registered');

  return pactTestProxy;
}

/**
 * Generate test data based on test mode and request type
 */
function generateTestData(testMode, request, proxyType) {
  switch (testMode) {
    case 'happy_path':
      return TEST_SCENARIOS.HAPPY_PATH;
      
    case 'error_scenarios':
      // Randomly select an error scenario
      const errorTypes = Object.keys(TEST_SCENARIOS.ERROR_SCENARIOS);
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      return TEST_SCENARIOS.ERROR_SCENARIOS[randomError];
      
    case 'edge_cases':
      // Randomly select an edge case
      const edgeTypes = Object.keys(TEST_SCENARIOS.EDGE_CASES);
      const randomEdge = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
      return TEST_SCENARIOS.EDGE_CASES[randomEdge];
      
    case 'mixed':
      // Mix of different scenarios
      const scenarios = [TEST_SCENARIOS.HAPPY_PATH, ...Object.values(TEST_SCENARIOS.ERROR_SCENARIOS), ...Object.values(TEST_SCENARIOS.EDGE_CASES)];
      return scenarios[Math.floor(Math.random() * scenarios.length)];
      
    default:
      return TEST_SCENARIOS.HAPPY_PATH;
  }
}

/**
 * Intercept a proxy machine request and route it through the pact test proxy
 */
export function interceptProxyRequest(proxyMachine, pactTestProxy, request, proxyType) {
  return new Promise((resolve, reject) => {
    // Send the request to the pact test proxy
    pactTestProxy.send('INTERCEPT_REQUEST', { request, proxyType });
    
    // Listen for the response
    pactTestProxy.onTransition((state) => {
      if (state.matches('success')) {
        resolve(state.context.data);
      } else if (state.matches('error')) {
        reject(new Error(state.context.error.message));
      } else if (state.matches('timeout')) {
        reject(new Error('Request timed out'));
      }
    });
  });
}

/**
 * Update pact test configuration
 */
export function updatePactConfig(pactTestProxy, newConfig) {
  pactTestProxy.send('UPDATE_CONFIG', { newConfig });
}

/**
 * Reset pact test statistics
 */
export function resetPactStats(pactTestProxy) {
  pactTestProxy.send('RESET_STATS');
}

/**
 * Get pact test statistics
 */
export function getPactStats(pactTestProxy) {
  const state = pactTestProxy.getSnapshot();
  return {
    testMode: state.context.testMode,
    requestCount: state.context.requestCount,
    errorCount: state.context.errorCount,
    lastRequest: state.context.lastRequest,
    config: {
      responseDelay: state.context.responseDelay,
      errorProbability: state.context.errorProbability
    }
  };
}

export default {
  createPactTestProxy,
  interceptProxyRequest,
  updatePactConfig,
  resetPactStats,
  getPactStats,
  TEST_SCENARIOS,
  PACT_CONFIG
};
