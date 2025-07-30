import { createProxyRobotCopyStateMachine } from 'log-view-machine';
import axios from 'axios';
import { dbUtils } from '../database/setup.js';

// Create proxy machines with GraphQL state definitions
export async function createProxyMachines(db, robotCopy) {
  const proxyMachines = new Map();

  // HTTP API Proxy Machine
  const httpApiProxy = createProxyRobotCopyStateMachine({
    machineId: 'http-api-proxy',
    xstateConfig: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            REQUEST: 'processing',
            HEALTH_CHECK: 'health_check'
          }
        },
        processing: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error',
            TIMEOUT: 'timeout'
          }
        },
        success: {
          on: {
            RESET: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'processing',
            RESET: 'idle'
          }
        },
        timeout: {
          on: {
            RETRY: 'processing',
            RESET: 'idle'
          }
        },
        health_check: {
          on: {
            HEALTH_OK: 'idle',
            HEALTH_FAIL: 'error'
          }
        }
      }
    }
  })
  .withState('idle', async ({ log, view, send }) => {
    await log('HTTP API Proxy: Idle state');
    return view({
      status: 'idle',
      message: 'Ready to process HTTP requests',
      timestamp: new Date().toISOString()
    });
  })
  .withState('processing', async ({ log, view, send, event }) => {
    await log('HTTP API Proxy: Processing request', { event });
    
    const { method, url, headers, body } = event.data || {};
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method: method || 'GET',
        url,
        headers,
        data: body,
        timeout: 10000
      });
      
      const duration = Date.now() - startTime;
      
      // Record the request in database
      await dbUtils.recordProxyRequest(
        'http-api-proxy',
        method,
        url,
        headers,
        body,
        response.status,
        response.data,
        duration
      );
      
      await log('HTTP API Proxy: Request successful', {
        status: response.status,
        duration
      });
      
      return send('SUCCESS', { response: response.data, duration });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await log('HTTP API Proxy: Request failed', {
        error: error.message,
        duration
      });
      
      return send('ERROR', { error: error.message, duration });
    }
  })
  .withState('success', async ({ log, view, context }) => {
    await log('HTTP API Proxy: Success state');
    return view({
      status: 'success',
      data: context.response,
      duration: context.duration,
      timestamp: new Date().toISOString()
    });
  })
  .withState('error', async ({ log, view, context }) => {
    await log('HTTP API Proxy: Error state');
    return view({
      status: 'error',
      error: context.error,
      duration: context.duration,
      timestamp: new Date().toISOString()
    });
  })
  .withState('timeout', async ({ log, view }) => {
    await log('HTTP API Proxy: Timeout state');
    return view({
      status: 'timeout',
      message: 'Request timed out',
      timestamp: new Date().toISOString()
    });
  })
  .withState('health_check', async ({ log, view, send }) => {
    await log('HTTP API Proxy: Health check');
    
    try {
      // Check if target service is healthy
      const response = await axios.get('/health', { timeout: 5000 });
      await log('HTTP API Proxy: Health check passed');
      return send('HEALTH_OK');
    } catch (error) {
      await log('HTTP API Proxy: Health check failed', { error: error.message });
      return send('HEALTH_FAIL');
    }
  });

  // GraphQL Proxy Machine with withStateGraphQL()
  const graphqlProxy = createProxyRobotCopyStateMachine({
    machineId: 'graphql-proxy',
    xstateConfig: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            QUERY: 'processing_query',
            MUTATION: 'processing_mutation',
            SUBSCRIPTION: 'processing_subscription'
          }
        },
        processing_query: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error',
            VALIDATION_ERROR: 'validation_error'
          }
        },
        processing_mutation: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error',
            VALIDATION_ERROR: 'validation_error'
          }
        },
        processing_subscription: {
          on: {
            CONNECTED: 'subscription_active',
            ERROR: 'error'
          }
        },
        subscription_active: {
          on: {
            MESSAGE: 'message_received',
            DISCONNECT: 'idle'
          }
        },
        message_received: {
          on: {
            CONTINUE: 'subscription_active',
            DISCONNECT: 'idle'
          }
        },
        success: {
          on: {
            RESET: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'processing_query',
            RESET: 'idle'
          }
        },
        validation_error: {
          on: {
            RESET: 'idle'
          }
        }
      }
    }
  })
  .withState('idle', async ({ log, view }) => {
    await log('GraphQL Proxy: Idle state');
    return view({
      status: 'idle',
      message: 'Ready to process GraphQL operations',
      timestamp: new Date().toISOString()
    });
  })
  .withState('processing_query', async ({ log, view, send, event }) => {
    await log('GraphQL Proxy: Processing query', { event });
    
    const { query, variables, operationName } = event.data || {};
    const startTime = Date.now();
    
    try {
      // Validate GraphQL query
      if (!query || typeof query !== 'string') {
        return send('VALIDATION_ERROR', { 
          error: 'Invalid GraphQL query' 
        });
      }
      
      // Execute GraphQL query against target
      const response = await axios.post('/graphql', {
        query,
        variables,
        operationName
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
      
      const duration = Date.now() - startTime;
      
      // Record GraphQL query in database
      await dbUtils.recordGraphQLQuery(
        query,
        variables,
        response.data,
        duration
      );
      
      await log('GraphQL Proxy: Query successful', {
        operationName,
        duration
      });
      
      return send('SUCCESS', { 
        data: response.data,
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await log('GraphQL Proxy: Query failed', {
        error: error.message,
        duration
      });
      
      return send('ERROR', { 
        error: error.message,
        duration 
      });
    }
  })
  .withState('processing_mutation', async ({ log, view, send, event }) => {
    await log('GraphQL Proxy: Processing mutation', { event });
    
    const { mutation, variables, operationName } = event.data || {};
    const startTime = Date.now();
    
    try {
      // Validate GraphQL mutation
      if (!mutation || typeof mutation !== 'string') {
        return send('VALIDATION_ERROR', { 
          error: 'Invalid GraphQL mutation' 
        });
      }
      
      // Execute GraphQL mutation against target
      const response = await axios.post('/graphql', {
        query: mutation,
        variables,
        operationName
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });
      
      const duration = Date.now() - startTime;
      
      // Record GraphQL mutation in database
      await dbUtils.recordGraphQLQuery(
        mutation,
        variables,
        response.data,
        duration
      );
      
      await log('GraphQL Proxy: Mutation successful', {
        operationName,
        duration
      });
      
      return send('SUCCESS', { 
        data: response.data,
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await log('GraphQL Proxy: Mutation failed', {
        error: error.message,
        duration
      });
      
      return send('ERROR', { 
        error: error.message,
        duration 
      });
    }
  })
  .withState('processing_subscription', async ({ log, view, send, event }) => {
    await log('GraphQL Proxy: Processing subscription', { event });
    
    const { subscription, variables } = event.data || {};
    
    try {
      // Validate GraphQL subscription
      if (!subscription || typeof subscription !== 'string') {
        return send('ERROR', { 
          error: 'Invalid GraphQL subscription' 
        });
      }
      
      // Setup WebSocket connection for subscription
      // This would typically connect to a WebSocket endpoint
      await log('GraphQL Proxy: Subscription connection established');
      
      return send('CONNECTED', { 
        subscription,
        variables 
      });
    } catch (error) {
      await log('GraphQL Proxy: Subscription failed', {
        error: error.message
      });
      
      return send('ERROR', { 
        error: error.message 
      });
    }
  })
  .withState('subscription_active', async ({ log, view, send, context }) => {
    await log('GraphQL Proxy: Subscription active');
    return view({
      status: 'subscription_active',
      subscription: context.subscription,
      variables: context.variables,
      timestamp: new Date().toISOString()
    });
  })
  .withState('message_received', async ({ log, view, send, event }) => {
    await log('GraphQL Proxy: Message received', { event });
    
    const { message } = event.data || {};
    
    return view({
      status: 'message_received',
      message,
      timestamp: new Date().toISOString()
    });
  })
  .withState('success', async ({ log, view, context }) => {
    await log('GraphQL Proxy: Success state');
    return view({
      status: 'success',
      data: context.data,
      duration: context.duration,
      timestamp: new Date().toISOString()
    });
  })
  .withState('error', async ({ log, view, context }) => {
    await log('GraphQL Proxy: Error state');
    return view({
      status: 'error',
      error: context.error,
      duration: context.duration,
      timestamp: new Date().toISOString()
    });
  })
  .withState('validation_error', async ({ log, view, context }) => {
    await log('GraphQL Proxy: Validation error state');
    return view({
      status: 'validation_error',
      error: context.error,
      timestamp: new Date().toISOString()
    });
  });

  // Database Proxy Machine
  const databaseProxy = createProxyRobotCopyStateMachine({
    machineId: 'database-proxy',
    xstateConfig: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            QUERY: 'processing_query',
            TRANSACTION: 'processing_transaction',
            MIGRATION: 'processing_migration'
          }
        },
        processing_query: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        processing_transaction: {
          on: {
            COMMIT: 'success',
            ROLLBACK: 'error'
          }
        },
        processing_migration: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        success: {
          on: {
            RESET: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'processing_query',
            RESET: 'idle'
          }
        }
      }
    }
  })
  .withState('idle', async ({ log, view }) => {
    await log('Database Proxy: Idle state');
    return view({
      status: 'idle',
      message: 'Ready to process database operations',
      timestamp: new Date().toISOString()
    });
  })
  .withState('processing_query', async ({ log, view, send, event }) => {
    await log('Database Proxy: Processing query', { event });
    
    const { sql, params } = event.data || {};
    const startTime = Date.now();
    
    try {
      const result = await db.raw(sql, params);
      const duration = Date.now() - startTime;
      
      await log('Database Proxy: Query successful', {
        duration,
        rowCount: result.rows?.length || 0
      });
      
      return send('SUCCESS', { 
        result: result.rows || result,
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await log('Database Proxy: Query failed', {
        error: error.message,
        duration
      });
      
      return send('ERROR', { 
        error: error.message,
        duration 
      });
    }
  })
  .withState('processing_transaction', async ({ log, view, send, event }) => {
    await log('Database Proxy: Processing transaction', { event });
    
    const { operations } = event.data || {};
    const startTime = Date.now();
    
    try {
      const result = await db.transaction(async (trx) => {
        const results = [];
        for (const operation of operations) {
          const { sql, params } = operation;
          const opResult = await trx.raw(sql, params);
          results.push(opResult);
        }
        return results;
      });
      
      const duration = Date.now() - startTime;
      
      await log('Database Proxy: Transaction successful', {
        duration,
        operationCount: operations.length
      });
      
      return send('COMMIT', { 
        results: result,
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await log('Database Proxy: Transaction failed', {
        error: error.message,
        duration
      });
      
      return send('ROLLBACK', { 
        error: error.message,
        duration 
      });
    }
  })
  .withState('processing_migration', async ({ log, view, send, event }) => {
    await log('Database Proxy: Processing migration', { event });
    
    const { migrationName } = event.data || {};
    const startTime = Date.now();
    
    try {
      // Run database migration
      await db.migrate.latest();
      const duration = Date.now() - startTime;
      
      await log('Database Proxy: Migration successful', {
        migrationName,
        duration
      });
      
      return send('SUCCESS', { 
        migrationName,
        duration 
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await log('Database Proxy: Migration failed', {
        error: error.message,
        duration
      });
      
      return send('ERROR', { 
        error: error.message,
        duration 
      });
    }
  })
  .withState('success', async ({ log, view, context }) => {
    await log('Database Proxy: Success state');
    return view({
      status: 'success',
      data: context.result || context.results,
      duration: context.duration,
      timestamp: new Date().toISOString()
    });
  })
  .withState('error', async ({ log, view, context }) => {
    await log('Database Proxy: Error state');
    return view({
      status: 'error',
      error: context.error,
      duration: context.duration,
      timestamp: new Date().toISOString()
    });
  });

  // Register machines with RobotCopy
  robotCopy.registerMachine('http-api-proxy', httpApiProxy, {
    description: 'HTTP API Proxy Machine',
    messageBrokers: [
      { type: 'http-api', config: { baseUrl: process.env.TARGET_API_URL || 'http://localhost:3001' } }
    ]
  });

  robotCopy.registerMachine('graphql-proxy', graphqlProxy, {
    description: 'GraphQL Proxy Machine',
    messageBrokers: [
      { type: 'graphql', config: { endpoint: process.env.TARGET_GRAPHQL_URL || 'http://localhost:3001/graphql' } }
    ]
  });

  robotCopy.registerMachine('database-proxy', databaseProxy, {
    description: 'Database Proxy Machine',
    messageBrokers: [
      { type: 'http-api', config: { baseUrl: process.env.DATABASE_API_URL || 'http://localhost:3002' } }
    ]
  });

  // Store machines in Map
  proxyMachines.set('http-api-proxy', httpApiProxy);
  proxyMachines.set('graphql-proxy', graphqlProxy);
  proxyMachines.set('database-proxy', databaseProxy);

  // Initialize proxy machines in database
  await initializeProxyMachinesInDatabase(db);

  console.log('✅ Proxy machines created and registered');

  return proxyMachines;
}

// Initialize proxy machines in database
async function initializeProxyMachinesInDatabase(db) {
  const proxyConfigs = [
    {
      id: 'http-api-proxy',
      name: 'HTTP API Proxy',
      description: 'Proxies HTTP API requests to target services',
      targetUrl: process.env.TARGET_API_URL || 'http://localhost:3001',
      config: {
        timeout: 10000,
        retryAttempts: 3,
        rateLimit: 100
      }
    },
    {
      id: 'graphql-proxy',
      name: 'GraphQL Proxy',
      description: 'Proxies GraphQL queries, mutations, and subscriptions',
      targetUrl: process.env.TARGET_GRAPHQL_URL || 'http://localhost:3001/graphql',
      config: {
        timeout: 15000,
        retryAttempts: 2,
        subscriptionTimeout: 30000
      }
    },
    {
      id: 'database-proxy',
      name: 'Database Proxy',
      description: 'Proxies database operations with transaction support',
      targetUrl: process.env.DATABASE_API_URL || 'http://localhost:3002',
      config: {
        timeout: 30000,
        maxConnections: 10,
        transactionTimeout: 60000
      }
    }
  ];

  for (const config of proxyConfigs) {
    const existing = await dbUtils.getProxyMachine(config.id);
    if (!existing) {
      await dbUtils.createProxyMachine(
        config.id,
        config.name,
        config.description,
        config.targetUrl,
        config.config
      );
    }
  }
} 