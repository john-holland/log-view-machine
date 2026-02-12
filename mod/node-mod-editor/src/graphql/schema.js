import { gql } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { dbUtils } from '../database/setup.js';

// GraphQL type definitions
const typeDefs = gql`
  # State Machine Types
  type StateMachine {
    id: ID!
    name: String!
    description: String
    currentState: String!
    config: JSON!
    createdAt: String!
    updatedAt: String!
    transitions: [StateTransition!]!
  }

  type StateTransition {
    id: ID!
    machineId: String!
    fromState: String!
    toState: String!
    event: String
    data: JSON
    timestamp: String!
  }

  # Proxy Machine Types
  type ProxyMachine {
    id: ID!
    name: String!
    description: String
    targetUrl: String!
    config: JSON!
    status: String!
    createdAt: String!
    updatedAt: String!
    requests: [ProxyRequest!]!
  }

  type ProxyRequest {
    id: ID!
    proxyId: String!
    method: String!
    path: String!
    headers: JSON
    body: JSON
    responseStatus: Int
    responseBody: JSON
    durationMs: Int
    timestamp: String!
  }

  # GraphQL Query Types
  type GraphQLQuery {
    id: ID!
    query: String!
    variables: JSON
    result: JSON
    durationMs: Int
    timestamp: String!
  }

  # User Types
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    createdAt: String!
    updatedAt: String!
    apiKeys: [ApiKey!]!
  }

  type ApiKey {
    id: ID!
    userId: Int!
    name: String!
    permissions: JSON
    expiresAt: String
    createdAt: String!
  }

  # Statistics Types
  type ProxyStatistics {
    totalRequests: Int!
    successRate: Float!
    averageResponseTime: Float!
    errorCount: Int!
    lastRequestAt: String
  }

  type StateMachineStatistics {
    totalTransitions: Int!
    averageTransitionsPerMinute: Float!
    mostActiveState: String!
    lastTransitionAt: String
  }

  # Query Root
  type Query {
    # State Machine Queries
    stateMachines: [StateMachine!]!
    stateMachine(id: ID!): StateMachine
    stateMachineTransitions(machineId: ID!, limit: Int): [StateTransition!]!
    
    # Proxy Machine Queries
    proxyMachines: [ProxyMachine!]!
    proxyMachine(id: ID!): ProxyMachine
    proxyRequests(proxyId: ID!, limit: Int): [ProxyRequest!]!
    proxyStatistics(proxyId: ID!): ProxyStatistics!
    
    # GraphQL Query History
    graphqlQueries(limit: Int): [GraphQLQuery!]!
    
    # User Queries
    users: [User!]!
    user(id: ID!): User
    me: User
    
    # Statistics Queries
    stateMachineStatistics(machineId: ID!): StateMachineStatistics!
    overallStatistics: OverallStatistics!
  }

  # Mutation Root
  type Mutation {
    # State Machine Mutations
    createStateMachine(input: CreateStateMachineInput!): StateMachine!
    updateStateMachine(id: ID!, input: UpdateStateMachineInput!): StateMachine!
    deleteStateMachine(id: ID!): Boolean!
    sendStateMachineEvent(machineId: ID!, event: String!, data: JSON): StateTransition!
    
    # Proxy Machine Mutations
    createProxyMachine(input: CreateProxyMachineInput!): ProxyMachine!
    updateProxyMachine(id: ID!, input: UpdateProxyMachineInput!): ProxyMachine!
    deleteProxyMachine(id: ID!): Boolean!
    sendProxyRequest(proxyId: ID!, input: ProxyRequestInput!): ProxyRequest!
    
    # User Mutations
    createUser(input: CreateUserInput!): User!
    updateUser(id: ID!, input: UpdateUserInput!): User!
    deleteUser(id: ID!): Boolean!
    createApiKey(input: CreateApiKeyInput!): ApiKey!
    deleteApiKey(id: ID!): Boolean!
    
    # Authentication Mutations
    login(username: String!, password: String!): AuthPayload!
    logout: Boolean!
    refreshToken: AuthPayload!
  }

  # Subscription Root
  type Subscription {
    # State Machine Subscriptions
    stateMachineUpdated(id: ID!): StateMachine!
    stateTransitionOccurred(machineId: ID!): StateTransition!
    
    # Proxy Machine Subscriptions
    proxyRequestCompleted(proxyId: ID!): ProxyRequest!
    proxyMachineStatusChanged(id: ID!): ProxyMachine!
    
    # System Subscriptions
    systemHealthUpdate: SystemHealth!
  }

  # Input Types
  input CreateStateMachineInput {
    id: ID!
    name: String!
    description: String
    config: JSON!
  }

  input UpdateStateMachineInput {
    name: String
    description: String
    currentState: String
    config: JSON
  }

  input CreateProxyMachineInput {
    id: ID!
    name: String!
    description: String
    targetUrl: String!
    config: JSON!
  }

  input UpdateProxyMachineInput {
    name: String
    description: String
    targetUrl: String
    config: JSON
    status: String
  }

  input ProxyRequestInput {
    method: String!
    path: String!
    headers: JSON
    body: JSON
  }

  input CreateUserInput {
    username: String!
    email: String!
    password: String!
    role: String
  }

  input UpdateUserInput {
    username: String
    email: String
    password: String
    role: String
  }

  input CreateApiKeyInput {
    userId: ID!
    name: String!
    permissions: JSON
    expiresAt: String
  }

  # Response Types
  type AuthPayload {
    token: String!
    user: User!
  }

  type SystemHealth {
    status: String!
    timestamp: String!
    uptime: Float!
    memoryUsage: JSON!
    databaseStatus: String!
  }

  type OverallStatistics {
    totalStateMachines: Int!
    totalProxyMachines: Int!
    totalUsers: Int!
    totalRequests: Int!
    averageResponseTime: Float!
    systemUptime: Float!
  }

  # Scalar Types
  scalar JSON
  scalar DateTime
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    // State Machine Queries
    stateMachines: async (_, __, { db }) => {
      return await dbUtils.getAllStateMachines();
    },
    
    stateMachine: async (_, { id }, { db }) => {
      return await dbUtils.getStateMachine(id);
    },
    
    stateMachineTransitions: async (_, { machineId, limit = 100 }, { db }) => {
      return await dbUtils.getStateTransitions(machineId, limit);
    },
    
    // Proxy Machine Queries
    proxyMachines: async (_, __, { db }) => {
      return await dbUtils.getAllProxyMachines();
    },
    
    proxyMachine: async (_, { id }, { db }) => {
      return await dbUtils.getProxyMachine(id);
    },
    
    proxyRequests: async (_, { proxyId, limit = 100 }, { db }) => {
      return await dbUtils.getProxyRequests(proxyId, limit);
    },
    
    proxyStatistics: async (_, { proxyId }, { db }) => {
      const requests = await dbUtils.getProxyRequests(proxyId, 1000);
      const totalRequests = requests.length;
      const successfulRequests = requests.filter(r => r.response_status >= 200 && r.response_status < 300);
      const errorRequests = requests.filter(r => r.response_status >= 400);
      const averageResponseTime = requests.length > 0 
        ? requests.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / requests.length 
        : 0;
      
      return {
        totalRequests,
        successRate: totalRequests > 0 ? successfulRequests.length / totalRequests : 0,
        averageResponseTime,
        errorCount: errorRequests.length,
        lastRequestAt: requests.length > 0 ? requests[0].timestamp : null
      };
    },
    
    // GraphQL Query History
    graphqlQueries: async (_, { limit = 100 }, { db }) => {
      return await dbUtils.getGraphQLQueries(limit);
    },
    
    // User Queries
    users: async (_, __, { db }) => {
      return await db('users').select('*');
    },
    
    user: async (_, { id }, { db }) => {
      return await dbUtils.getUserById(id);
    },
    
    me: async (_, __, { req }) => {
      // This would typically check JWT token and return current user
      return null;
    },
    
    // Statistics Queries
    stateMachineStatistics: async (_, { machineId }, { db }) => {
      const transitions = await dbUtils.getStateTransitions(machineId, 1000);
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
      
      return {
        totalTransitions,
        averageTransitionsPerMinute: recentTransitions.length,
        mostActiveState: mostActiveState || 'unknown',
        lastTransitionAt: transitions.length > 0 ? transitions[0].timestamp : null
      };
    },
    
    overallStatistics: async (_, __, { db }) => {
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
      
      return {
        totalStateMachines: stateMachines.length,
        totalProxyMachines: proxyMachines.length,
        totalUsers: users.length,
        totalRequests,
        averageResponseTime: requestCount > 0 ? totalResponseTime / requestCount : 0,
        systemUptime: process.uptime()
      };
    }
  },
  
  Mutation: {
    // State Machine Mutations
    createStateMachine: async (_, { input }, { db }) => {
      const { id, name, description, config } = input;
      await dbUtils.createStateMachine(id, name, description, config);
      return await dbUtils.getStateMachine(id);
    },
    
    updateStateMachine: async (_, { id, input }, { db }) => {
      await dbUtils.updateStateMachine(id, input);
      return await dbUtils.getStateMachine(id);
    },
    
    deleteStateMachine: async (_, { id }, { db }) => {
      await db('state_machines').where({ id }).del();
      return true;
    },
    
    sendStateMachineEvent: async (_, { machineId, event, data }, { stateMachines, db }) => {
      const machine = stateMachines.get(machineId);
      if (!machine) {
        throw new Error(`State machine ${machineId} not found`);
      }
      
      // Send event to state machine
      const result = await machine.send(event, { data });
      
      // Record transition in database
      await dbUtils.recordStateTransition(
        machineId,
        result.previousState,
        result.currentState,
        event,
        data
      );
      
      return {
        id: Date.now().toString(),
        machineId,
        fromState: result.previousState,
        toState: result.currentState,
        event,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString()
      };
    },
    
    // Proxy Machine Mutations
    createProxyMachine: async (_, { input }, { db }) => {
      const { id, name, description, targetUrl, config } = input;
      await dbUtils.createProxyMachine(id, name, description, targetUrl, config);
      return await dbUtils.getProxyMachine(id);
    },
    
    updateProxyMachine: async (_, { id, input }, { db }) => {
      await dbUtils.updateProxyMachine(id, input);
      return await dbUtils.getProxyMachine(id);
    },
    
    deleteProxyMachine: async (_, { id }, { db }) => {
      await db('proxy_machines').where({ id }).del();
      return true;
    },
    
    sendProxyRequest: async (_, { proxyId, input }, { proxyMachines, db }) => {
      const proxy = proxyMachines.get(proxyId);
      if (!proxy) {
        throw new Error(`Proxy machine ${proxyId} not found`);
      }
      
      const { method, path, headers, body } = input;
      const startTime = Date.now();
      
      try {
        // Send request through proxy machine
        const result = await proxy.send('REQUEST', {
          data: { method, url: path, headers, body }
        });
        
        const duration = Date.now() - startTime;
        
        // Record request in database
        const requestId = await dbUtils.recordProxyRequest(
          proxyId,
          method,
          path,
          headers,
          body,
          result.response?.status || 200,
          result.response,
          duration
        );
        
        return {
          id: requestId[0],
          proxyId,
          method,
          path,
          headers: JSON.stringify(headers),
          body: JSON.stringify(body),
          responseStatus: result.response?.status || 200,
          responseBody: JSON.stringify(result.response),
          durationMs: duration,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Record failed request
        const requestId = await dbUtils.recordProxyRequest(
          proxyId,
          method,
          path,
          headers,
          body,
          500,
          { error: error.message },
          duration
        );
        
        throw error;
      }
    },
    
    // User Mutations
    createUser: async (_, { input }, { db }) => {
      const { username, email, password, role = 'user' } = input;
      
      // Hash password (in production, use bcrypt)
      const passwordHash = password; // Simplified for demo
      
      const userId = await dbUtils.createUser(username, email, passwordHash, role);
      return await dbUtils.getUserById(userId[0]);
    },
    
    updateUser: async (_, { id, input }, { db }) => {
      const updates = { ...input };
      if (input.password) {
        updates.password_hash = input.password; // Simplified for demo
        delete updates.password;
      }
      
      await db('users').where({ id }).update({
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      return await dbUtils.getUserById(id);
    },
    
    deleteUser: async (_, { id }, { db }) => {
      await db('users').where({ id }).del();
      return true;
    },
    
    createApiKey: async (_, { input }, { db }) => {
      const { userId, name, permissions, expiresAt } = input;
      const keyHash = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const keyId = await dbUtils.createApiKey(userId, keyHash, name, permissions, expiresAt);
      return await db('api_keys').where({ id: keyId[0] }).first();
    },
    
    deleteApiKey: async (_, { id }, { db }) => {
      await db('api_keys').where({ id }).del();
      return true;
    },
    
    // Authentication Mutations
    login: async (_, { username, password }, { db }) => {
      const user = await dbUtils.getUserByUsername(username);
      if (!user || user.password_hash !== password) { // Simplified for demo
        throw new Error('Invalid credentials');
      }
      
      // Generate JWT token (simplified for demo)
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        token,
        user
      };
    },
    
    logout: async (_, __, { req }) => {
      // In production, invalidate JWT token
      return true;
    },
    
    refreshToken: async (_, __, { req }) => {
      // In production, validate current token and issue new one
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return { token, user: null };
    }
  },
  
  Subscription: {
    // State Machine Subscriptions
    stateMachineUpdated: {
      subscribe: (_, { id }, { pubsub }) => {
        return pubsub.asyncIterator(`STATE_MACHINE_UPDATED_${id}`);
      }
    },
    
    stateTransitionOccurred: {
      subscribe: (_, { machineId }, { pubsub }) => {
        return pubsub.asyncIterator(`STATE_TRANSITION_${machineId}`);
      }
    },
    
    // Proxy Machine Subscriptions
    proxyRequestCompleted: {
      subscribe: (_, { proxyId }, { pubsub }) => {
        return pubsub.asyncIterator(`PROXY_REQUEST_${proxyId}`);
      }
    },
    
    proxyMachineStatusChanged: {
      subscribe: (_, { id }, { pubsub }) => {
        return pubsub.asyncIterator(`PROXY_MACHINE_STATUS_${id}`);
      }
    },
    
    // System Subscriptions
    systemHealthUpdate: {
      subscribe: (_, __, { pubsub }) => {
        return pubsub.asyncIterator('SYSTEM_HEALTH');
      }
    }
  },
  
  // Field resolvers
  StateMachine: {
    transitions: async (parent, { limit = 100 }, { db }) => {
      return await dbUtils.getStateTransitions(parent.id, limit);
    }
  },
  
  ProxyMachine: {
    requests: async (parent, { limit = 100 }, { db }) => {
      return await dbUtils.getProxyRequests(parent.id, limit);
    }
  },
  
  User: {
    apiKeys: async (parent, __, { db }) => {
      return await db('api_keys').where({ user_id: parent.id });
    }
  }
};

// Create executable schema
export function createGraphQLSchema(stateMachines, proxyMachines, db) {
  return makeExecutableSchema({
    typeDefs,
    resolvers
  });
} 