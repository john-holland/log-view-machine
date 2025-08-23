import express from 'express';
// import { validationSchemas } from '../middleware/index.js';
import { dbUtils } from '../database/setup.js';

// Setup REST routes
export function setupRoutes(app, db, stateMachines, proxyMachines, robotCopy, logger) {
  const router = express.Router();

  // State Machine Routes
  router.get('/state-machines', async (req, res) => {
    try {
      const machines = await dbUtils.getAllStateMachines();
      res.json(machines);
    } catch (error) {
      logger.error('Failed to get state machines', { error: error.message });
      res.status(500).json({ error: 'Failed to get state machines' });
    }
  });

  router.get('/state-machines/:id', async (req, res) => {
    try {
      const machine = await dbUtils.getStateMachine(req.params.id);
      if (!machine) {
        return res.status(404).json({ error: 'State machine not found' });
      }
      res.json(machine);
    } catch (error) {
      logger.error('Failed to get state machine', { error: error.message });
      res.status(500).json({ error: 'Failed to get state machine' });
    }
  });

  router.post('/state-machines', /* validationSchemas.createStateMachine, */ async (req, res) => {
    try {
      const { id, name, description, config } = req.body;
      await dbUtils.createStateMachine(id, name, description, config);
      const machine = await dbUtils.getStateMachine(id);
      res.status(201).json(machine);
    } catch (error) {
      logger.error('Failed to create state machine', { error: error.message });
      res.status(500).json({ error: 'Failed to create state machine' });
    }
  });

  router.put('/state-machines/:id', /* validationSchemas.updateStateMachine, */ async (req, res) => {
    try {
      await dbUtils.updateStateMachine(req.params.id, req.body);
      const machine = await dbUtils.getStateMachine(req.params.id);
      res.json(machine);
    } catch (error) {
      logger.error('Failed to update state machine', { error: error.message });
      res.status(500).json({ error: 'Failed to update state machine' });
    }
  });

  router.delete('/state-machines/:id', async (req, res) => {
    try {
      await db('state_machines').where({ id: req.params.id }).del();
      res.json({ message: 'State machine deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete state machine', { error: error.message });
      res.status(500).json({ error: 'Failed to delete state machine' });
    }
  });

  router.post('/state-machines/:id/events', /* validationSchemas.sendStateMachineEvent, */ async (req, res) => {
    try {
      const { id } = req.params;
      const { event, data } = req.body;
      
      const machine = stateMachines.get(id);
      if (!machine) {
        return res.status(404).json({ error: 'State machine not found' });
      }

      // For XState machines, we need to get the current state before sending the event
      const previousState = machine.state?.value || 'unknown';
      
      // Send the event to the machine
      const result = machine.send(event, { data });
      
      // Get the new state after the event
      const currentState = machine.state?.value || 'unknown';
      
      // Record transition in database
      await dbUtils.recordStateTransition(
        id,
        previousState,
        currentState,
        event,
        data
      );

      res.json({
        machineId: id,
        event,
        data,
        previousState,
        currentState,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to send state machine event', { error: error.message });
      res.status(500).json({ error: 'Failed to send state machine event' });
    }
  });

  router.get('/state-machines/:id/transitions', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const transitions = await dbUtils.getStateTransitions(id, limit);
      res.json(transitions);
    } catch (error) {
      logger.error('Failed to get state transitions', { error: error.message });
      res.status(500).json({ error: 'Failed to get state transitions' });
    }
  });

  // Proxy Machine Routes
  router.get('/proxy-machines', async (req, res) => {
    try {
      const proxies = await dbUtils.getAllProxyMachines();
      res.json(proxies);
    } catch (error) {
      logger.error('Failed to get proxy machines', { error: error.message });
      res.status(500).json({ error: 'Failed to get proxy machines' });
    }
  });

  router.get('/proxy-machines/:id', async (req, res) => {
    try {
      const proxy = await dbUtils.getProxyMachine(req.params.id);
      if (!proxy) {
        return res.status(404).json({ error: 'Proxy machine not found' });
      }
      res.json(proxy);
    } catch (error) {
      logger.error('Failed to get proxy machine', { error: error.message });
      res.status(500).json({ error: 'Failed to get proxy machine' });
    }
  });

  router.post('/proxy-machines', /* validationSchemas.createProxyMachine, */ async (req, res) => {
    try {
      const { id, name, description, targetUrl, config } = req.body;
      await dbUtils.createProxyMachine(id, name, description, targetUrl, config);
      const proxy = await dbUtils.getProxyMachine(id);
      res.status(201).json(proxy);
    } catch (error) {
      logger.error('Failed to create proxy machine', { error: error.message });
      res.status(500).json({ error: 'Failed to create proxy machine' });
    }
  });

  router.put('/proxy-machines/:id', /* validationSchemas.updateProxyMachine, */ async (req, res) => {
    try {
      await dbUtils.updateProxyMachine(req.params.id, req.body);
      const proxy = await dbUtils.getProxyMachine(req.params.id);
      res.json(proxy);
    } catch (error) {
      logger.error('Failed to update proxy machine', { error: error.message });
      res.status(500).json({ error: 'Failed to update proxy machine' });
    }
  });

  router.delete('/proxy-machines/:id', async (req, res) => {
    try {
      await db('proxy_machines').where({ id: req.params.id }).del();
      res.json({ message: 'Proxy machine deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete proxy machine', { error: error.message });
      res.status(500).json({ error: 'Failed to delete proxy machine' });
    }
  });

  router.post('/proxy-machines/:id/requests', /* validationSchemas.sendProxyRequest, */ async (req, res) => {
    try {
      const { id } = req.params;
      const { method, path, headers, body } = req.body;
      
      const proxy = proxyMachines.get(id);
      if (!proxy) {
        return res.status(404).json({ error: 'Proxy machine not found' });
      }

      const startTime = Date.now();
      
      // Send request through proxy machine
      const result = await proxy.send('REQUEST', {
        data: { method, url: path, headers, body }
      });
      
      const duration = Date.now() - startTime;
      
      // Record request in database
      const requestId = await dbUtils.recordProxyRequest(
        id,
        method,
        path,
        headers,
        body,
        result.response?.status || 200,
        result.response,
        duration
      );

      res.json({
        id: requestId[0],
        proxyId: id,
        method,
        path,
        headers,
        body,
        responseStatus: result.response?.status || 200,
        responseBody: result.response,
        durationMs: duration,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to send proxy request', { error: error.message });
      res.status(500).json({ error: 'Failed to send proxy request' });
    }
  });

  router.get('/proxy-machines/:id/requests', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      const requests = await dbUtils.getProxyRequests(id, limit);
      res.json(requests);
    } catch (error) {
      logger.error('Failed to get proxy requests', { error: error.message });
      res.status(500).json({ error: 'Failed to get proxy requests' });
    }
  });

  router.get('/proxy-machines/:id/statistics', async (req, res) => {
    try {
      const { id } = req.params;
      const requests = await dbUtils.getProxyRequests(id, 1000);
      
      const totalRequests = requests.length;
      const successfulRequests = requests.filter(r => r.response_status >= 200 && r.response_status < 300);
      const errorRequests = requests.filter(r => r.response_status >= 400);
      const averageResponseTime = requests.length > 0 
        ? requests.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / requests.length 
        : 0;
      
      res.json({
        totalRequests,
        successRate: totalRequests > 0 ? successfulRequests.length / totalRequests : 0,
        averageResponseTime,
        errorCount: errorRequests.length,
        lastRequestAt: requests.length > 0 ? requests[0].timestamp : null
      });
    } catch (error) {
      logger.error('Failed to get proxy statistics', { error: error.message });
      res.status(500).json({ error: 'Failed to get proxy statistics' });
    }
  });

  // User Routes
  router.get('/users', async (req, res) => {
    try {
      const users = await db('users').select('*');
      res.json(users);
    } catch (error) {
      logger.error('Failed to get users', { error: error.message });
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

  router.get('/users/:id', async (req, res) => {
    try {
      const user = await dbUtils.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      logger.error('Failed to get user', { error: error.message });
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  router.post('/users', /* validationSchemas.createUser, */ async (req, res) => {
    try {
      const { username, email, password, role = 'user' } = req.body;
      const userId = await dbUtils.createUser(username, email, password, role);
      const user = await dbUtils.getUserById(userId[0]);
      res.status(201).json(user);
    } catch (error) {
      logger.error('Failed to create user', { error: error.message });
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  router.put('/users/:id', /* validationSchemas.updateUser, */ async (req, res) => {
    try {
      const updates = { ...req.body };
      if (req.body.password) {
        updates.password_hash = req.body.password; // Simplified for demo
        delete updates.password;
      }
      
      await db('users').where({ id: req.params.id }).update({
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      const user = await dbUtils.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      logger.error('Failed to update user', { error: error.message });
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      await db('users').where({ id: req.params.id }).del();
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete user', { error: error.message });
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Authentication Routes
  router.post('/auth/login', /* validationSchemas.login, */ async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await dbUtils.getUserByUsername(username);
      
      if (!user || user.password_hash !== password) { // Simplified for demo
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token (simplified for demo)
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Failed to login', { error: error.message });
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  router.post('/auth/logout', async (req, res) => {
    try {
      // In production, invalidate JWT token
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Failed to logout', { error: error.message });
      res.status(500).json({ error: 'Failed to logout' });
    }
  });

  // API Key Routes
  router.post('/api-keys', async (req, res) => {
    try {
      const { userId, name, permissions, expiresAt } = req.body;
      const keyHash = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const keyId = await dbUtils.createApiKey(userId, keyHash, name, permissions, expiresAt);
      const apiKey = await db('api_keys').where({ id: keyId[0] }).first();
      
      res.status(201).json(apiKey);
    } catch (error) {
      logger.error('Failed to create API key', { error: error.message });
      res.status(500).json({ error: 'Failed to create API key' });
    }
  });

  router.delete('/api-keys/:id', async (req, res) => {
    try {
      await db('api_keys').where({ id: req.params.id }).del();
      res.json({ message: 'API key deleted successfully' });
    } catch (error) {
      logger.error('Failed to delete API key', { error: error.message });
      res.status(500).json({ error: 'Failed to delete API key' });
    }
  });

  // Statistics Routes
  router.get('/statistics/overall', async (req, res) => {
    try {
      const stateMachines = await dbUtils.getAllStateMachines();
      const proxyMachines = await dbUtils.getAllProxyMachines();
      const users = await db('users').select('*');
      
      // Calculate total requests across all proxies
      let totalRequests = 0;
      let totalResponseTime = 0;
      let requestCount = 0;
      
      for (const proxy of proxyMachines) {
        const requests = await dbUtils.getProxyRequests(proxy.id, 1000);
        totalRequests += requests.length;
        requests.forEach(r => {
          if (r.duration_ms) {
            totalResponseTime += r.duration_ms;
            requestCount++;
          }
        });
      }
      
      res.json({
        totalStateMachines: stateMachines.length,
        totalProxyMachines: proxyMachines.length,
        totalUsers: users.length,
        totalRequests,
        averageResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
        systemUptime: process.uptime()
      });
    } catch (error) {
      logger.error('Failed to get overall statistics', { error: error.message });
      res.status(500).json({ error: 'Failed to get overall statistics' });
    }
  });

  router.get('/statistics/state-machines/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const transitions = await dbUtils.getStateTransitions(id, 1000);
      
      const totalTransitions = transitions.length;
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const recentTransitions = transitions.filter(t => new Date(t.timestamp) > oneMinuteAgo);
      
      // Count state occurrences
      const stateCounts = {};
      transitions.forEach(t => {
        stateCounts[t.to_state] = (stateCounts[t.to_state] || 0) + 1;
      });
      const mostActiveState = Object.keys(stateCounts).reduce((a, b) => 
        stateCounts[a] > stateCounts[b] ? a : b, Object.keys(stateCounts)[0]
      );
      
      res.json({
        totalTransitions,
        averageTransitionsPerMinute: recentTransitions.length,
        mostActiveState: mostActiveState || 'unknown',
        lastTransitionAt: transitions.length > 0 ? transitions[0].timestamp : null
      });
    } catch (error) {
      logger.error('Failed to get state machine statistics', { error: error.message });
      res.status(500).json({ error: 'Failed to get state machine statistics' });
    }
  });

  // RobotCopy Routes
  router.get('/robotcopy/discover', async (req, res) => {
    try {
      const discovery = robotCopy.discover();
      res.json(discovery);
    } catch (error) {
      logger.error('Failed to discover machines', { error: error.message });
      res.status(500).json({ error: 'Failed to discover machines' });
    }
  });

  router.post('/robotcopy/message', async (req, res) => {
    try {
      const { message } = req.body;
      const result = await robotCopy.sendMessage(message);
      res.json(result);
    } catch (error) {
      logger.error('Failed to send RobotCopy message', { error: error.message });
      res.status(500).json({ error: 'Failed to send RobotCopy message' });
    }
  });

  // Cart API Routes
  router.post('/cart/add', async (req, res) => {
    try {
      const { item } = req.body;
      
      if (!item || !item.id) {
        return res.status(400).json({ 
          success: false, 
          error: 'Item data is required' 
        });
      }

      logger.info('Adding item to cart', { item, timestamp: new Date().toISOString() });

      // Simulate cart addition
      const result = {
        success: true,
        message: 'Item added to cart',
        item: item,
        timestamp: new Date().toISOString()
      };

      res.json(result);
    } catch (error) {
      logger.error('Failed to add item to cart', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Failed to add item to cart',
        details: error.message
      });
    }
  });

  router.post('/cart/remove', async (req, res) => {
    try {
      const { itemId } = req.body;
      
      if (!itemId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Item ID is required' 
        });
      }

      logger.info('Removing item from cart', { itemId, timestamp: new Date().toISOString() });

      // Simulate cart removal
      const result = {
        success: true,
        message: 'Item removed from cart',
        itemId: itemId,
        timestamp: new Date().toISOString()
      };

      res.json(result);
    } catch (error) {
      logger.error('Failed to remove item from cart', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Failed to remove item from cart',
        details: error.message
      });
    }
  });

  router.post('/cart/update', async (req, res) => {
    try {
      const { itemId, quantity } = req.body;
      
      if (!itemId || quantity === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Item ID and quantity are required' 
        });
      }

      logger.info('Updating cart item quantity', { itemId, quantity, timestamp: new Date().toISOString() });

      // Simulate cart update
      const result = {
        success: true,
        message: 'Cart item updated',
        itemId: itemId,
        quantity: quantity,
        timestamp: new Date().toISOString()
      };

      res.json(result);
    } catch (error) {
      logger.error('Failed to update cart item', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Failed to update cart item',
        details: error.message
      });
    }
  });

  router.get('/cart/status', async (req, res) => {
    try {
      logger.info('Getting cart status', { timestamp: new Date().toISOString() });

      // Simulate cart status
      const result = {
        success: true,
        cart: {
          items: [],
          total: 0,
          status: 'empty'
        },
        timestamp: new Date().toISOString()
      };

      res.json(result);
    } catch (error) {
      logger.error('Failed to get cart status', { error: error.message, stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Failed to get cart status',
        details: error.message
      });
    }
  });

  // Mount routes
  app.use('/api', router);
} 