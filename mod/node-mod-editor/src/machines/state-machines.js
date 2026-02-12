import { createViewStateMachine } from 'log-view-machine';
import { createMachine, interpret, assign } from 'xstate';
import { dbUtils } from '../database/setup.js';

// Create state machines for the backend
export async function createStateMachines(db, robotCopy) {
  const stateMachines = new Map();

  // User Management State Machine
  const userManagementMachine = createViewStateMachine({
    machineId: 'user-management',
    xstateConfig: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            CREATE_USER: 'creating',
            UPDATE_USER: 'updating',
            DELETE_USER: 'deleting',
            AUTHENTICATE: 'authenticating'
          }
        },
        creating: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        updating: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        deleting: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        authenticating: {
          on: {
            SUCCESS: 'authenticated',
            ERROR: 'error'
          }
        },
        authenticated: {
          on: {
            LOGOUT: 'idle',
            REFRESH: 'refreshing'
          }
        },
        refreshing: {
          on: {
            SUCCESS: 'authenticated',
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
            RETRY: 'idle',
            RESET: 'idle'
          }
        }
      }
    }
  })
  .withState('idle', async ({ log, view }) => {
    await log('User Management: Idle state');
    return view({
      status: 'idle',
      message: 'Ready to handle user operations',
      timestamp: new Date().toISOString()
    });
  })
  .withState('creating', async ({ log, view, send, event }) => {
    await log('User Management: Creating user', { event });
    
    const { username, email, password, role } = event.data || {};
    
    try {
      const userId = await dbUtils.createUser(username, email, password, role);
      const user = await dbUtils.getUserById(userId[0]);
      
      await log('User Management: User created successfully', { userId: user.id });
      
      return send('SUCCESS', { user });
    } catch (error) {
      await log('User Management: Failed to create user', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('updating', async ({ log, view, send, event }) => {
    await log('User Management: Updating user', { event });
    
    const { id, updates } = event.data || {};
    
    try {
      await dbUtils.updateStateMachine(id, updates);
      const user = await dbUtils.getUserById(id);
      
      await log('User Management: User updated successfully', { userId: user.id });
      
      return send('SUCCESS', { user });
    } catch (error) {
      await log('User Management: Failed to update user', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('deleting', async ({ log, view, send, event }) => {
    await log('User Management: Deleting user', { event });
    
    const { id } = event.data || {};
    
    try {
      await db('users').where({ id }).del();
      
      await log('User Management: User deleted successfully', { userId: id });
      
      return send('SUCCESS', { userId: id });
    } catch (error) {
      await log('User Management: Failed to delete user', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('authenticating', async ({ log, view, send, event }) => {
    await log('User Management: Authenticating user', { event });
    
    const { username, password } = event.data || {};
    
    try {
      const user = await dbUtils.getUserByUsername(username);
      if (!user || user.password_hash !== password) {
        throw new Error('Invalid credentials');
      }
      
      await log('User Management: User authenticated successfully', { userId: user.id });
      
      return send('SUCCESS', { user });
    } catch (error) {
      await log('User Management: Authentication failed', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('authenticated', async ({ log, view, context }) => {
    await log('User Management: User authenticated');
    return view({
      status: 'authenticated',
      user: context.user,
      timestamp: new Date().toISOString()
    });
  })
  .withState('refreshing', async ({ log, view, send }) => {
    await log('User Management: Refreshing token');
    
    try {
      // In production, validate current token and issue new one
      const newToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await log('User Management: Token refreshed successfully');
      
      return send('SUCCESS', { token: newToken });
    } catch (error) {
      await log('User Management: Token refresh failed', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('success', async ({ log, view, context }) => {
    await log('User Management: Success state');
    return view({
      status: 'success',
      data: context.user || context.userId,
      timestamp: new Date().toISOString()
    });
  })
  .withState('error', async ({ log, view, context }) => {
    await log('User Management: Error state');
    return view({
      status: 'error',
      error: context.error,
      timestamp: new Date().toISOString()
    });
  });

  // API Key Management State Machine
  const apiKeyManagementMachine = createViewStateMachine({
    machineId: 'api-key-management',
    xstateConfig: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            CREATE_KEY: 'creating',
            VALIDATE_KEY: 'validating',
            REVOKE_KEY: 'revoking'
          }
        },
        creating: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        validating: {
          on: {
            VALID: 'valid',
            INVALID: 'invalid',
            EXPIRED: 'expired'
          }
        },
        revoking: {
          on: {
            SUCCESS: 'success',
            ERROR: 'error'
          }
        },
        valid: {
          on: {
            RESET: 'idle'
          }
        },
        invalid: {
          on: {
            RESET: 'idle'
          }
        },
        expired: {
          on: {
            RESET: 'idle'
          }
        },
        success: {
          on: {
            RESET: 'idle'
          }
        },
        error: {
          on: {
            RETRY: 'idle',
            RESET: 'idle'
          }
        }
      }
    }
  })
  .withState('idle', async ({ log, view }) => {
    await log('API Key Management: Idle state');
    return view({
      status: 'idle',
      message: 'Ready to handle API key operations',
      timestamp: new Date().toISOString()
    });
  })
  .withState('creating', async ({ log, view, send, event }) => {
    await log('API Key Management: Creating API key', { event });
    
    const { userId, name, permissions, expiresAt } = event.data || {};
    
    try {
      const keyHash = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const keyId = await dbUtils.createApiKey(userId, keyHash, name, permissions, expiresAt);
      const apiKey = await db('api_keys').where({ id: keyId[0] }).first();
      
      await log('API Key Management: API key created successfully', { keyId: apiKey.id });
      
      return send('SUCCESS', { apiKey });
    } catch (error) {
      await log('API Key Management: Failed to create API key', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('validating', async ({ log, view, send, event }) => {
    await log('API Key Management: Validating API key', { event });
    
    const { keyHash } = event.data || {};
    
    try {
      const apiKey = await dbUtils.getApiKey(keyHash);
      
      if (!apiKey) {
        await log('API Key Management: API key not found');
        return send('INVALID');
      }
      
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        await log('API Key Management: API key expired');
        return send('EXPIRED');
      }
      
      await log('API Key Management: API key is valid', { keyId: apiKey.id });
      return send('VALID', { apiKey });
    } catch (error) {
      await log('API Key Management: Failed to validate API key', { error: error.message });
      return send('INVALID');
    }
  })
  .withState('revoking', async ({ log, view, send, event }) => {
    await log('API Key Management: Revoking API key', { event });
    
    const { keyId } = event.data || {};
    
    try {
      await db('api_keys').where({ id: keyId }).del();
      
      await log('API Key Management: API key revoked successfully', { keyId });
      
      return send('SUCCESS', { keyId });
    } catch (error) {
      await log('API Key Management: Failed to revoke API key', { error: error.message });
      return send('ERROR', { error: error.message });
    }
  })
  .withState('valid', async ({ log, view, context }) => {
    await log('API Key Management: API key is valid');
    return view({
      status: 'valid',
      apiKey: context.apiKey,
      timestamp: new Date().toISOString()
    });
  })
  .withState('invalid', async ({ log, view }) => {
    await log('API Key Management: API key is invalid');
    return view({
      status: 'invalid',
      message: 'API key is invalid',
      timestamp: new Date().toISOString()
    });
  })
  .withState('expired', async ({ log, view }) => {
    await log('API Key Management: API key is expired');
    return view({
      status: 'expired',
      message: 'API key has expired',
      timestamp: new Date().toISOString()
    });
  })
  .withState('success', async ({ log, view, context }) => {
    await log('API Key Management: Success state');
    return view({
      status: 'success',
      data: context.apiKey || context.keyId,
      timestamp: new Date().toISOString()
    });
  })
  .withState('error', async ({ log, view, context }) => {
    await log('API Key Management: Error state');
    return view({
      status: 'error',
      error: context.error,
      timestamp: new Date().toISOString()
    });
  });

  // System Health Monitoring State Machine
  const systemHealthMachine = createViewStateMachine({
    machineId: 'system-health',
    xstateConfig: {
      initial: 'healthy',
      states: {
        healthy: {
          on: {
            CHECK_HEALTH: 'checking',
            WARNING: 'warning',
            CRITICAL: 'critical'
          }
        },
        checking: {
          on: {
            HEALTHY: 'healthy',
            WARNING: 'warning',
            CRITICAL: 'critical'
          }
        },
        warning: {
          on: {
            RECOVER: 'healthy',
            ESCALATE: 'critical',
            CHECK_HEALTH: 'checking'
          }
        },
        critical: {
          on: {
            RECOVER: 'healthy',
            CHECK_HEALTH: 'checking'
          }
        }
      }
    }
  })
  .withState('healthy', async ({ log, view }) => {
    await log('System Health: System is healthy');
    return view({
      status: 'healthy',
      message: 'System is operating normally',
      timestamp: new Date().toISOString(),
      metrics: {
        cpu: Math.random() * 30 + 10, // 10-40%
        memory: Math.random() * 40 + 20, // 20-60%
        disk: Math.random() * 20 + 10, // 10-30%
        network: Math.random() * 50 + 20 // 20-70%
      }
    });
  })
  .withState('checking', async ({ log, view, send }) => {
    await log('System Health: Checking system health');
    
    // Simulate health check
    const cpu = Math.random() * 100;
    const memory = Math.random() * 100;
    const disk = Math.random() * 100;
    const network = Math.random() * 100;
    
    const metrics = { cpu, memory, disk, network };
    
    if (cpu > 80 || memory > 85 || disk > 90 || network > 90) {
      await log('System Health: Critical conditions detected', { metrics });
      return send('CRITICAL', { metrics });
    } else if (cpu > 60 || memory > 70 || disk > 75 || network > 75) {
      await log('System Health: Warning conditions detected', { metrics });
      return send('WARNING', { metrics });
    } else {
      await log('System Health: All systems normal', { metrics });
      return send('HEALTHY', { metrics });
    }
  })
  .withState('warning', async ({ log, view, context }) => {
    await log('System Health: System in warning state');
    return view({
      status: 'warning',
      message: 'System performance degraded',
      timestamp: new Date().toISOString(),
      metrics: context.metrics
    });
  })
  .withState('critical', async ({ log, view, context }) => {
    await log('System Health: System in critical state');
    return view({
      status: 'critical',
      message: 'System requires immediate attention',
      timestamp: new Date().toISOString(),
      metrics: context.metrics
    });
  });

  // Register machines with RobotCopy
  robotCopy.registerMachine('user-management', userManagementMachine, {
    description: 'User Management State Machine',
    messageBrokers: [
      { type: 'http-api', config: { baseUrl: process.env.USER_API_URL || 'http://localhost:3001' } }
    ]
  });

  robotCopy.registerMachine('api-key-management', apiKeyManagementMachine, {
    description: 'API Key Management State Machine',
    messageBrokers: [
      { type: 'http-api', config: { baseUrl: process.env.AUTH_API_URL || 'http://localhost:3001' } }
    ]
  });

  robotCopy.registerMachine('system-health', systemHealthMachine, {
    description: 'System Health Monitoring State Machine',
    messageBrokers: [
      { type: 'http-api', config: { baseUrl: process.env.MONITORING_API_URL || 'http://localhost:3001' } }
    ]
  });

  // Store machines in Map
  stateMachines.set('user-management', userManagementMachine);
  stateMachines.set('api-key-management', apiKeyManagementMachine);
  stateMachines.set('system-health', systemHealthMachine);

  // Initialize state machines in database
  await initializeStateMachinesInDatabase(db);

  console.log('✅ State machines created and registered');

  return stateMachines;
}

// Initialize state machines in database
async function initializeStateMachinesInDatabase(db) {
  const machineConfigs = [
    {
      id: 'user-management',
      name: 'User Management',
      description: 'Manages user operations (create, update, delete, authenticate)',
      config: {
        initial: 'idle',
        states: {
          idle: { on: { CREATE_USER: 'creating', UPDATE_USER: 'updating', DELETE_USER: 'deleting', AUTHENTICATE: 'authenticating' } },
          creating: { on: { SUCCESS: 'success', ERROR: 'error' } },
          updating: { on: { SUCCESS: 'success', ERROR: 'error' } },
          deleting: { on: { SUCCESS: 'success', ERROR: 'error' } },
          authenticating: { on: { SUCCESS: 'authenticated', ERROR: 'error' } },
          authenticated: { on: { LOGOUT: 'idle', REFRESH: 'refreshing' } },
          refreshing: { on: { SUCCESS: 'authenticated', ERROR: 'error' } },
          success: { on: { RESET: 'idle' } },
          error: { on: { RETRY: 'idle', RESET: 'idle' } }
        }
      }
    },
    {
      id: 'api-key-management',
      name: 'API Key Management',
      description: 'Manages API key operations (create, validate, revoke)',
      config: {
        initial: 'idle',
        states: {
          idle: { on: { CREATE_KEY: 'creating', VALIDATE_KEY: 'validating', REVOKE_KEY: 'revoking' } },
          creating: { on: { SUCCESS: 'success', ERROR: 'error' } },
          validating: { on: { VALID: 'valid', INVALID: 'invalid', EXPIRED: 'expired' } },
          revoking: { on: { SUCCESS: 'success', ERROR: 'error' } },
          valid: { on: { RESET: 'idle' } },
          invalid: { on: { RESET: 'idle' } },
          expired: { on: { RESET: 'idle' } },
          success: { on: { RESET: 'idle' } },
          error: { on: { RETRY: 'idle', RESET: 'idle' } }
        }
      }
    },
    {
      id: 'system-health',
      name: 'System Health Monitoring',
      description: 'Monitors system health and performance metrics',
      config: {
        initial: 'healthy',
        states: {
          healthy: { on: { CHECK_HEALTH: 'checking', WARNING: 'warning', CRITICAL: 'critical' } },
          checking: { on: { HEALTHY: 'healthy', WARNING: 'warning', CRITICAL: 'critical' } },
          warning: { on: { RECOVER: 'healthy', ESCALATE: 'critical', CHECK_HEALTH: 'checking' } },
          critical: { on: { RECOVER: 'healthy', CHECK_HEALTH: 'checking' } }
        }
      }
    },
    {
      id: 'fish-burger',
      name: 'Fish Burger Order Management',
      description: 'Manages fish burger order workflow and ingredient selection',
      config: {
        initial: 'idle',
        states: {
          idle: { on: { START_ORDER: 'ordering', VIEW_MENU: 'viewing_menu', START_COOKING: 'cooking' } },
          ordering: { on: { ADD_INGREDIENT: 'adding_ingredient', REMOVE_INGREDIENT: 'removing_ingredient', COMPLETE_ORDER: 'order_complete', CANCEL_ORDER: 'idle', START_COOKING: 'cooking' } },
          adding_ingredient: { on: { INGREDIENT_ADDED: 'ordering', ERROR: 'ordering' } },
          removing_ingredient: { on: { INGREDIENT_REMOVED: 'ordering', ERROR: 'ordering' } },
          viewing_menu: { on: { BACK_TO_ORDER: 'ordering', CLOSE_MENU: 'idle' } },
          cooking: { on: { UPDATE_PROGRESS: 'cooking', COOKING_COMPLETE: 'order_complete', PAUSE_COOKING: 'paused' } },
          paused: { on: { RESUME_COOKING: 'cooking', CANCEL_COOKING: 'idle' } },
          order_complete: { on: { NEW_ORDER: 'idle', VIEW_ORDER: 'viewing_order' } },
          viewing_order: { on: { NEW_ORDER: 'idle', BACK_TO_ORDERING: 'ordering' } }
        }
      }
    }
  ];

  for (const config of machineConfigs) {
    const existing = await dbUtils.getStateMachine(config.id);
    if (!existing) {
      await dbUtils.createStateMachine(
        config.id,
        config.name,
        config.description,
        config.config
      );
    }
  }
} 