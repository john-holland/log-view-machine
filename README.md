# Log View Machine

A powerful state machine library with fluent API, sub-machines, RobotCopy message broker, and GraphQL integration.

## Project Structure

```
log-view-machine/
├── log-view-machine/          # Core library code
│   ├── src/                  # Source code
│   ├── dist/                 # Built distribution
│   ├── core/                 # Core state machine logic
│   ├── graphql/              # GraphQL integration
│   ├── adapters/             # Adapter implementations
│   └── package.json          # Library package configuration
├── example/                  # Example applications
│   ├── ts-example/           # TypeScript/React example
│   ├── kotlin-example/       # Kotlin example
│   ├── java-example/         # Java example
│   └── node-example/         # Node.js example
├── docs/                     # Documentation
├── scripts/                  # Build and development scripts
└── package.json              # Workspace configuration
```

## Features

- **Fluent API**: Beautiful `withState()` syntax for state management
- **Sub-Machines**: Compose complex state machines from simpler ones
- **RobotCopy Message Broker**: Configurable message broker with multiple transport options
- **GraphQL Integration**: Built-in GraphQL server and client generation
- **Multi-Language Support**: Examples in TypeScript, Kotlin, Java, and Node.js
- **Client Generation**: Automated client discovery and code generation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Java 11+ (for Java/Kotlin examples)
- Docker (for some examples)

### Installation

```bash
# Clone the repository
git clone https://github.com/viewstatemachine/log-view-machine.git
cd log-view-machine

# Install dependencies
npm install

# Build the library
npm run build
```

### Development

```bash
# Start development mode
npm run dev

# Run tests
npm run test
```

## Library Usage

The core library is located in `log-view-machine/` and provides:

### Basic State Machine

```typescript
import { createViewStateMachine } from 'log-view-machine';

const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: {
    initial: 'idle',
    states: {
      idle: { on: { START: 'active' } },
      active: { on: { STOP: 'idle' } }
    }
  }
})
.withState('idle', async ({ log, view, send }) => {
  await log('Entered idle state');
  return view(<div>Idle UI</div>);
})
.withState('active', async ({ log, view, send }) => {
  await log('Entered active state');
  return view(<div>Active UI</div>);
});
```

### Sub-Machines

```typescript
.withState('selecting', async ({ getSubMachine, view }) => {
  const childMachine = getSubMachine('child');
  return view(childMachine.render(model));
});
```

### RobotCopy Message Broker

```typescript
import { createRobotCopy } from 'log-view-machine';

const robotCopy = createRobotCopy();
robotCopy.registerMachine('my-machine', machine, {
  messageBrokers: [
    { type: 'window-intercom', config: { targetOrigin: '*' } },
    { type: 'http-api', config: { baseUrl: 'https://api.com' } },
    { type: 'graphql', config: { endpoint: 'https://api.com/graphql' } }
  ]
});
```

### Client Generation

```typescript
import { createClientGenerator } from 'log-view-machine';

const clientGenerator = createClientGenerator();
clientGenerator.registerMachine('my-machine', machine, {
  description: 'My awesome machine',
  version: '1.0.0'
});
const typescriptClient = clientGenerator.generateClientCode('typescript', 'my-machine');
```

## Examples

### TypeScript/React Example (`example/ts-example/`)

A comprehensive React application demonstrating:
- Traditional XState implementation
- Fluent API usage
- Advanced features with sub-machines and RobotCopy

```bash
cd example/ts-example
npm install
npm run dev
```

### Kotlin Example (`example/kotlin-example/`)

Kotlin implementation showing:
- State machine creation
- HTTP client integration
- GraphQL adapter usage

```bash
cd example/kotlin-example
./gradlew build
```

### Java Example (`example/java-example/`)

Java implementation demonstrating:
- State machine analysis
- GraphQL integration
- Multi-language interoperability

```bash
cd example/java-example
./gradlew build
```

### Node.js Example (`example/node-example/`)

Node.js implementation featuring:
- State analyzer
- OpenTelemetry integration
- Docker deployment

```bash
cd example/node-example
npm install
docker-compose up
```

## Architecture

### Core Components

- **ViewStateMachine**: Main state machine with fluent API
- **RobotCopy**: Message broker with multiple transport options
- **ClientGenerator**: Automated client code generation
- **GraphQL Server**: Built-in GraphQL server for state machine queries

### Message Brokers

- **Window Intercom**: Cross-window communication
- **HTTP API**: RESTful API integration
- **GraphQL**: GraphQL endpoint integration
- **WebSocket**: Real-time communication

### Client Generation

Supports multiple languages:
- TypeScript/JavaScript
- Kotlin
- Java
- Python (planned)

## Development

### Adding New Examples

1. Create a new directory in `example/`
2. Set up the appropriate build system (npm, gradle, etc.)
3. Import from the library: `import { createViewStateMachine } from 'log-view-machine'`
4. Add documentation in the example's README

### Modifying the Library

1. Make changes in `log-view-machine/src/`
2. Build the library: `npm run build`
3. Examples will automatically use the updated library

### Testing

```bash
# Run all tests
npm test

# Run specific example tests
cd example/ts-example && npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Documentation

- [Installation Guide](INSTALLATION.md)
- [Tracing Integration](docs/tracing-integration.md)
- [Checklist](CHECKLIST.md)

## Support

- Issues: [GitHub Issues](https://github.com/viewstatemachine/log-view-machine/issues)
- Discussions: [GitHub Discussions](https://github.com/viewstatemachine/log-view-machine/discussions)
- Documentation: [GitHub Wiki](https://github.com/viewstatemachine/log-view-machine/wiki) 