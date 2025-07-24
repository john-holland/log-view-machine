# ViewStateMachine Examples

This directory contains comprehensive examples of the ViewStateMachine package, demonstrating different approaches to state management.

## Examples

### 1. XState Demo (`/xstate`)
Traditional XState implementation showing:
- Manual state management
- Direct XState usage
- Manual UI rendering
- Standard XState patterns

### 2. Fluent API Demo (`/fluent`)
ViewStateMachine with fluent API showing:
- Beautiful `withState()` syntax
- Automatic view stacking
- Logging integration
- Fluent context methods (`log`, `view`, `clear`, `send`)
- Simplified state management

### 3. Advanced Demo (`/advanced`)
Advanced features showing:
- Sub-machine composition
- RobotCopy message broker
- ClientGenerator code generation
- GraphQL integration
- Multi-language client generation
- Complex state orchestration

## Getting Started

### Prerequisites

Make sure the ViewStateMachine package is built:

```bash
cd ../../
npm run build
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at http://localhost:5173

## Package Dependency

This example depends on the ViewStateMachine package:

```json
{
  "dependencies": {
    "log-view-machine": "file:../../"
  }
}
```

The package provides:
- `createViewStateMachine()` - Create state machines with fluent API
- `createRobotCopy()` - Configurable message broker
- `createClientGenerator()` - Automated client discovery and generation

## Architecture

```
example/ts-example/
├── src/
│   ├── components/
│   │   ├── XStateBurgerCreationUI.tsx    # Traditional XState
│   │   ├── FluentBurgerCreationUI.tsx    # Fluent API demo
│   │   └── AdvancedFluentDemo.tsx        # Advanced features
│   ├── App.tsx                           # Main app with routing
│   └── main.tsx                          # Entry point
├── package.json                          # Dependencies
└── README.md                            # This file
```

## Key Concepts Demonstrated

### Fluent API
```typescript
const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: { /* XState config */ }
})
.withState('idle', async ({ log, view, send }) => {
  await log('Entered idle state');
  return view(<div>Idle UI</div>);
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
const robotCopy = createRobotCopy();
robotCopy.registerMachine('my-machine', machine, {
  messageBrokers: [
    { type: 'window-intercom', config: { targetOrigin: '*' } },
    { type: 'http-api', config: { baseUrl: 'https://api.com' } },
    { type: 'graphql', config: { endpoint: 'https://api.com/graphql' } }
  ]
});
```

### ClientGenerator
```typescript
const clientGenerator = createClientGenerator();
clientGenerator.registerMachine('my-machine', machine, {
  description: 'My awesome machine',
  version: '1.0.0'
});
const typescriptClient = clientGenerator.generateClientCode('typescript', 'my-machine');
```

## Development

### Adding New Examples

1. Create a new component in `src/components/`
2. Import from the ViewStateMachine package: `import { createViewStateMachine } from 'log-view-machine'`
3. Add a route in `src/App.tsx`
4. Test with `npm run dev`

### Modifying the Package

1. Make changes in `../../src/`
2. Build the package: `cd ../../ && npm run build`
3. The example will automatically use the updated package

## Troubleshooting

### Import Errors
If you see import errors for `log-view-machine`, make sure:
1. The package is built: `cd ../../ && npm run build`
2. The dependency is correctly specified in `package.json`
3. Run `npm install` to reinstall dependencies

### TypeScript Errors
The example uses TypeScript with strict settings. If you see type errors:
1. Check that all imports are correct
2. Ensure proper type annotations
3. The ViewStateMachine package provides full TypeScript support

## License

MIT - Same as the ViewStateMachine package 