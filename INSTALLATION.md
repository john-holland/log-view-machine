# ViewStateMachine Installation Guide

## Quick Install

```bash
npm install log-view-machine
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react @xstate/react xstate
```

## Usage

```typescript
import { createViewStateMachine, createRobotCopy, createClientGenerator } from 'log-view-machine';

// Create a ViewStateMachine
const machine = createViewStateMachine({
  machineId: 'my-machine',
  xstateConfig: {
    id: 'my-machine',
    initial: 'idle',
    states: { idle: {} }
  }
})
.withState('idle', async ({ log, view }) => {
  await log('Entered idle state');
  return view(<div>Idle UI</div>);
});

// Create RobotCopy message broker
const robotCopy = createRobotCopy();
robotCopy.registerMachine('my-machine', machine, {
  description: 'My awesome machine',
  messageBrokers: [
    {
      type: 'window-intercom',
      config: { targetOrigin: '*', messageType: 'event' }
    }
  ]
});

// Create ClientGenerator
const clientGenerator = createClientGenerator();
clientGenerator.registerMachine('my-machine', machine, {
  description: 'My awesome machine'
});
```

## Features

- **Fluent API**: Beautiful, intuitive interface for state management
- **XState Integration**: Built on top of XState for powerful state machine capabilities
- **Sub-Machines**: Compose complex systems with nested state machines
- **RobotCopy Message Broker**: Configurable message broker removing API barriers
- **GraphQL Support**: Native GraphQL integration in state handlers
- **ClientGenerator**: Automated client discovery and code generation

## Examples

See the `example/` directory for complete working examples.

## Documentation

Full documentation is available in the [README.md](README.md) file. 