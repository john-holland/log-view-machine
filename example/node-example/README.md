# Log View Machine - Node.js Backend Example

A comprehensive Node.js backend example demonstrating proxy machines, GraphQL APIs, and SQL database integration with the Log View Machine library.

## Features

- **Proxy Machines**: HTTP API, GraphQL, and Database proxy machines with `withStateGraphQL()` definitions
- **GraphQL API**: Full GraphQL server with queries, mutations, and subscriptions
- **SQL Database**: SQLite database with Knex.js ORM
- **REST API**: Complete REST API for state machines, proxy machines, and users
- **Authentication**: User management and API key authentication
- **Real-time**: WebSocket support for GraphQL subscriptions
- **Monitoring**: System health monitoring and statistics
- **RobotCopy Integration**: Message broker integration for inter-service communication

## Architecture

```
node-example/
├── src/
│   ├── server.js              # Main server with Express and Apollo
│   ├── database/
│   │   └── setup.js           # Database setup and utilities
│   ├── graphql/
│   │   └── schema.js          # GraphQL schema and resolvers
│   ├── machines/
│   │   ├── state-machines.js  # State machines (user, API key, health)
│   │   └── proxy-machines.js  # Proxy machines with GraphQL states
│   ├── middleware/
│   │   └── index.js           # Express middleware setup
│   ├── routes/
│   │   └── index.js           # REST API routes
│   └── websocket/
│       └── server.js          # WebSocket server for subscriptions
├── data/                      # SQLite database files
├── logs/                      # Application logs
└── package.json               # Dependencies and scripts
```

## Proxy Machines

### HTTP API Proxy Machine
- Proxies HTTP requests to target services
- Records request/response data in database
- Supports health checks and retry logic
- Rate limiting and timeout handling

### GraphQL Proxy Machine
- Proxies GraphQL queries, mutations, and subscriptions
- Validates GraphQL operations
- Records query history and performance metrics
- Supports WebSocket connections for subscriptions

### Database Proxy Machine
- Proxies database operations with transaction support
- SQL query execution and result caching
- Migration management
- Connection pooling and timeout handling

## GraphQL API

### Queries
- `stateMachines`: Get all state machines
- `proxyMachines`: Get all proxy machines
- `users`: Get all users
- `statistics`: Get system statistics
- `graphqlQueries`: Get GraphQL query history

### Mutations
- `createStateMachine`: Create new state machine
- `sendStateMachineEvent`: Send event to state machine
- `createProxyMachine`: Create new proxy machine
- `sendProxyRequest`: Send request through proxy
- `createUser`: Create new user
- `login`: Authenticate user

### Subscriptions
- `stateMachineUpdated`: Real-time state machine updates
- `proxyRequestCompleted`: Real-time proxy request completion
- `systemHealthUpdate`: Real-time system health updates

## REST API Endpoints

### State Machines
- `GET /api/state-machines` - List all state machines
- `GET /api/state-machines/:id` - Get specific state machine
- `POST /api/state-machines` - Create state machine
- `PUT /api/state-machines/:id` - Update state machine
- `DELETE /api/state-machines/:id` - Delete state machine
- `POST /api/state-machines/:id/events` - Send event to state machine
- `GET /api/state-machines/:id/transitions` - Get state transitions

### Proxy Machines
- `GET /api/proxy-machines` - List all proxy machines
- `GET /api/proxy-machines/:id` - Get specific proxy machine
- `POST /api/proxy-machines` - Create proxy machine
- `PUT /api/proxy-machines/:id` - Update proxy machine
- `DELETE /api/proxy-machines/:id` - Delete proxy machine
- `POST /api/proxy-machines/:id/requests` - Send request through proxy
- `GET /api/proxy-machines/:id/requests` - Get proxy request history
- `GET /api/proxy-machines/:id/statistics` - Get proxy statistics

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get specific user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Statistics
- `GET /api/statistics/overall` - Overall system statistics
- `GET /api/statistics/state-machines/:id` - State machine statistics

### RobotCopy
- `GET /api/robotcopy/discover` - Discover registered machines
- `POST /api/robotcopy/message` - Send RobotCopy message

## Installation

```bash
# Install dependencies
npm install

# Create data directory
mkdir -p data logs

# Set environment variables
export PORT=3000
export NODE_ENV=development
export DB_CLIENT=sqlite3
export DB_CONNECTION=./data/app.db
```

## Usage

### Development
```bash
# Start development server
npm run dev

# The server will be available at:
# - HTTP: http://localhost:3000
# - GraphQL: http://localhost:3000/graphql
# - WebSocket: ws://localhost:3000/graphql
# - Health: http://localhost:3000/health
```

### Production
```bash
# Start production server
npm start

# Build (if needed)
npm run build
```

## Database Setup

The application automatically creates the database schema on startup:

- `state_machines` - State machine configurations
- `state_transitions` - State transition history
- `proxy_machines` - Proxy machine configurations
- `proxy_requests` - Proxy request history
- `graphql_queries` - GraphQL query history
- `users` - User accounts
- `api_keys` - API key management

## Example Usage

### Create a State Machine
```bash
curl -X POST http://localhost:3000/api/state-machines \
  -H "Content-Type: application/json" \
  -d '{
    "id": "my-machine",
    "name": "My State Machine",
    "description": "A test state machine",
    "config": {
      "initial": "idle",
      "states": {
        "idle": { "on": { "START": "active" } },
        "active": { "on": { "STOP": "idle" } }
      }
    }
  }'
```

### Send Event to State Machine
```bash
curl -X POST http://localhost:3000/api/state-machines/my-machine/events \
  -H "Content-Type: application/json" \
  -d '{
    "event": "START",
    "data": { "userId": 123 }
  }'
```

### Create Proxy Machine
```bash
curl -X POST http://localhost:3000/api/proxy-machines \
  -H "Content-Type: application/json" \
  -d '{
    "id": "http-proxy",
    "name": "HTTP API Proxy",
    "description": "Proxies HTTP requests",
    "targetUrl": "https://api.example.com",
    "config": {
      "timeout": 10000,
      "retryAttempts": 3
    }
  }'
```

### Send Request Through Proxy
```bash
curl -X POST http://localhost:3000/api/proxy-machines/http-proxy/requests \
  -H "Content-Type: application/json" \
  -d '{
    "method": "GET",
    "path": "/users",
    "headers": { "Authorization": "Bearer token" }
  }'
```

### GraphQL Query
```graphql
query {
  stateMachines {
    id
    name
    currentState
    transitions(limit: 10) {
      fromState
      toState
      event
      timestamp
    }
  }
  
  proxyMachines {
    id
    name
    targetUrl
    status
    requests(limit: 5) {
      method
      path
      responseStatus
      durationMs
    }
  }
  
  overallStatistics {
    totalStateMachines
    totalProxyMachines
    totalRequests
    averageResponseTime
  }
}
```

### GraphQL Mutation
```graphql
mutation {
  createStateMachine(input: {
    id: "new-machine"
    name: "New Machine"
    description: "A new state machine"
    config: {
      initial: "idle"
      states: {
        idle: { on: { START: "active" } }
        active: { on: { STOP: "idle" } }
      }
    }
  }) {
    id
    name
    currentState
  }
}
```

### GraphQL Subscription
```graphql
subscription {
  stateMachineUpdated(id: "my-machine") {
    id
    currentState
    updatedAt
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment mode |
| `DB_CLIENT` | sqlite3 | Database client |
| `DB_CONNECTION` | ./data/app.db | Database connection |
| `LOG_LEVEL` | info | Logging level |
| `ALLOWED_ORIGINS` | http://localhost:3000,http://localhost:5173 | CORS origins |
| `TARGET_API_URL` | http://localhost:3001 | Target API URL for proxies |
| `TARGET_GRAPHQL_URL` | http://localhost:3001/graphql | Target GraphQL URL |
| `DATABASE_API_URL` | http://localhost:3002 | Database API URL |

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### System Statistics
```bash
curl http://localhost:3000/api/statistics/overall
```

### State Machine Statistics
```bash
curl http://localhost:3000/api/statistics/state-machines/my-machine
```

## Logging

Logs are written to:
- Console (colored output)
- `logs/combined.log` (all logs)
- `logs/error.log` (error logs only)

## Docker Support

```bash
# Build Docker image
docker build -t log-view-machine-node .

# Run with Docker Compose
docker-compose up -d
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE](../../LICENSE) file for details. 