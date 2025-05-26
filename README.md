# Log View Machine

A flexible log viewing framework that supports both React and Mithril, with GraphQL integration and semantic versioning.

## Features

- TypeScript support
- React and Mithril adapters
- GraphQL integration
- Semantic versioning with fallback mechanisms
- Kotlin server integration for version management
- Real-time log updates
- Filtering and search capabilities
- Customizable UI components

## Installation

```bash
npm install log-view-machine
```

## Usage

### React

```tsx
import { LogViewProvider, LogView } from 'log-view-machine/adapters/react';
import { createApolloClient } from 'log-view-machine/graphql/client';

const client = createApolloClient('http://your-graphql-endpoint');

function App() {
  return (
    <LogViewProvider 
      client={client}
      version="1.2.0"
      versionConstraint={{
        requireStable: true,
        minVersion: { major: 1, minor: 0, patch: 0, stable: true }
      }}
      kotlinServer={{
        baseUrl: 'http://your-kotlin-server',
        apiKey: 'your-api-key'
      }}
    >
      <LogView />
    </LogViewProvider>
  );
}
```

### Mithril

```ts
import { LogViewComponent } from 'log-view-machine/adapters/mithril';
import { createApolloClient } from 'log-view-machine/graphql/client';
import m from 'mithril';

const client = createApolloClient('http://your-graphql-endpoint');
const logView = new LogViewComponent({
  client,
  version: '1.2.0',
  versionConstraint: {
    requireStable: true,
    minVersion: { major: 1, minor: 0, patch: 0, stable: true }
  },
  kotlinServer: {
    baseUrl: 'http://your-kotlin-server',
    apiKey: 'your-api-key'
  }
});

m.mount(document.body, logView);
```

## Versioning

The framework supports semantic versioning with the following features:

- Version constraints (min/max versions)
- Stable version requirements
- Local version fallback
- Kotlin server integration for remote version management
- Automatic version resolution

### Version Format

Versions follow the semantic versioning format: `major.minor.patch[-prerelease][+build]`

Example: `1.2.3-beta.1+20240220`

### Version Resolution

1. Check local versions first
2. If not found, try Kotlin server
3. Fall back to latest compatible local version
4. If no compatible version found, use default implementation

## GraphQL Schema

The framework expects the following GraphQL schema:

```graphql
input LogFiltersInput {
  level: String
  search: String
  startDate: DateTime
  endDate: DateTime
}

input LogInput {
  level: String!
  message: String!
  metadata: JSON
}

type Log {
  id: ID!
  timestamp: DateTime!
  level: String!
  message: String!
  metadata: JSON
}

type Query {
  logs(filters: LogFiltersInput): [Log!]!
}

type Mutation {
  addLog(input: LogInput!): Log!
}
```

## Kotlin Server API

The Kotlin server should implement the following endpoints:

```kotlin
GET /api/machines/{major}.{minor}
  Headers:
    - Accept: application/javascript
    - X-Require-Stable: true/false
  Response: JavaScript code for the machine implementation

GET /api/machines/versions
  Response: List of available versions

GET /api/machines/validate/{major}.{minor}
  Response: Boolean indicating if version is valid
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode
npm run dev

# Run tests
npm test

# Lint
npm run lint

# Format code
npm run format
```

## License

MIT 