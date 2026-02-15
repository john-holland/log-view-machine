import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  client: process.env.DB_CLIENT || 'sqlite3',
  connection: process.env.DB_CONNECTION || {
    filename: path.join(__dirname, '../../data/app.db')
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, './migrations')
  },
  seeds: {
    directory: path.join(__dirname, './seeds')
  }
};

// Create database connection
const db = knex(dbConfig);

// Database schema
const schema = {
  // State machines table
  stateMachines: `
    CREATE TABLE IF NOT EXISTS state_machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      current_state TEXT NOT NULL,
      config JSON NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  // State transitions table
  stateTransitions: `
    CREATE TABLE IF NOT EXISTS state_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id TEXT NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      event TEXT,
      data JSON,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (machine_id) REFERENCES state_machines (id)
    )
  `,
  
  // Proxy machines table
  proxyMachines: `
    CREATE TABLE IF NOT EXISTS proxy_machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      target_url TEXT NOT NULL,
      config JSON NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  // Proxy requests table
  proxyRequests: `
    CREATE TABLE IF NOT EXISTS proxy_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proxy_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      headers JSON,
      body JSON,
      response_status INTEGER,
      response_body JSON,
      duration_ms INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proxy_id) REFERENCES proxy_machines (id)
    )
  `,
  
  // GraphQL queries table
  graphqlQueries: `
    CREATE TABLE IF NOT EXISTS graphql_queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      variables JSON,
      result JSON,
      duration_ms INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  // Users table for authentication
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  // API keys table
  apiKeys: `
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      permissions JSON,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `
};

// Initialize database
export async function setupDatabase() {
  try {
    // Create tables
    for (const [tableName, createTableSQL] of Object.entries(schema)) {
      await db.raw(createTableSQL);
    }
    
    console.log('✅ Database initialized successfully');
    
    // Create indexes for better performance
    await db.raw('CREATE INDEX IF NOT EXISTS idx_state_transitions_machine_id ON state_transitions(machine_id)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_state_transitions_timestamp ON state_transitions(timestamp)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_proxy_requests_proxy_id ON proxy_requests(proxy_id)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_proxy_requests_timestamp ON proxy_requests(timestamp)');
    await db.raw('CREATE INDEX IF NOT EXISTS idx_graphql_queries_timestamp ON graphql_queries(timestamp)');
    
    console.log('✅ Database indexes created');
    
    return db;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

// Database utility functions
export const dbUtils = {
  // State machine operations
  async createStateMachine(id, name, description, config) {
    return await db('state_machines').insert({
      id,
      name,
      description,
      current_state: config.initial || 'idle',
      config: JSON.stringify(config)
    });
  },
  
  async updateStateMachine(id, updates) {
    return await db('state_machines')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      });
  },
  
  async getStateMachine(id) {
    const machine = await db('state_machines').where({ id }).first();
    if (machine) {
      machine.config = JSON.parse(machine.config);
    }
    return machine;
  },
  
  async getAllStateMachines() {
    const machines = await db('state_machines').select('*');
    return machines.map(machine => ({
      ...machine,
      config: JSON.parse(machine.config)
    }));
  },
  
  async recordStateTransition(machineId, fromState, toState, event, data) {
    return await db('state_transitions').insert({
      machine_id: machineId,
      from_state: fromState,
      to_state: toState,
      event,
      data: JSON.stringify(data)
    });
  },
  
  async getStateTransitions(machineId, limit = 100) {
    return await db('state_transitions')
      .where({ machine_id: machineId })
      .orderBy('timestamp', 'desc')
      .limit(limit);
  },
  
  // Proxy machine operations
  async createProxyMachine(id, name, description, targetUrl, config) {
    return await db('proxy_machines').insert({
      id,
      name,
      description,
      target_url: targetUrl,
      config: JSON.stringify(config)
    });
  },
  
  async updateProxyMachine(id, updates) {
    return await db('proxy_machines')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      });
  },
  
  async getProxyMachine(id) {
    const proxy = await db('proxy_machines').where({ id }).first();
    if (proxy) {
      proxy.config = JSON.parse(proxy.config);
    }
    return proxy;
  },
  
  async getAllProxyMachines() {
    const proxies = await db('proxy_machines').select('*');
    return proxies.map(proxy => ({
      ...proxy,
      config: JSON.parse(proxy.config)
    }));
  },
  
  async recordProxyRequest(proxyId, method, path, headers, body, responseStatus, responseBody, duration) {
    return await db('proxy_requests').insert({
      proxy_id: proxyId,
      method,
      path,
      headers: JSON.stringify(headers),
      body: JSON.stringify(body),
      response_status: responseStatus,
      response_body: JSON.stringify(responseBody),
      duration_ms: duration
    });
  },
  
  async getProxyRequests(proxyId, limit = 100) {
    return await db('proxy_requests')
      .where({ proxy_id: proxyId })
      .orderBy('timestamp', 'desc')
      .limit(limit);
  },
  
  // GraphQL operations
  async recordGraphQLQuery(query, variables, result, duration) {
    return await db('graphql_queries').insert({
      query,
      variables: JSON.stringify(variables),
      result: JSON.stringify(result),
      duration_ms: duration
    });
  },
  
  async getGraphQLQueries(limit = 100) {
    return await db('graphql_queries')
      .orderBy('timestamp', 'desc')
      .limit(limit);
  },
  
  // User operations
  async createUser(username, email, passwordHash, role = 'user') {
    return await db('users').insert({
      username,
      email,
      password_hash: passwordHash,
      role
    });
  },
  
  async getUserByUsername(username) {
    return await db('users').where({ username }).first();
  },
  
  async getUserById(id) {
    return await db('users').where({ id }).first();
  },
  
  // API key operations
  async createApiKey(userId, keyHash, name, permissions, expiresAt = null) {
    return await db('api_keys').insert({
      user_id: userId,
      key_hash: keyHash,
      name,
      permissions: JSON.stringify(permissions),
      expires_at: expiresAt
    });
  },
  
  async getApiKey(keyHash) {
    return await db('api_keys').where({ key_hash: keyHash }).first();
  }
};

export { db }; 