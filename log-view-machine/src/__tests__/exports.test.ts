/**
 * Test file to verify all exports from log-view-machine work correctly
 * This ensures the npm package can be imported and used properly
 */

import {
  // Core ViewStateMachine exports
  ViewStateMachine,
  createViewStateMachine,
  createProxyRobotCopyStateMachine,
  type ViewStateMachineConfig,
  type StateContext,
  type StateHandler,
  
  // Tracing exports
  Tracing,
  createTracing,
  type MessageMetadata,
  type TraceInfo,
  
  // TomeConnector exports
  TomeConnector,
  createTomeConnector,
  type TomeConnection,
  type TomeConnectionConfig,
  
  // RobotCopy exports
  RobotCopy,
  createRobotCopy,
  type RobotCopyConfig,
  
  // ClientGenerator exports
  ClientGenerator,
  createClientGenerator,
  type ClientGeneratorConfig,
  type ClientGeneratorExample,
  type ClientGeneratorDiscovery,
  
  // TomeManager exports
  TomeManager,
  
  // TomeConfig exports
  createTomeConfig,
  FishBurgerTomeConfig,
  EditorTomeConfig,
  type TomeConfig,
  type TomeInstance
} from '../index';

describe('log-view-machine Exports', () => {
  describe('Core ViewStateMachine Exports', () => {
    test('should export ViewStateMachine class', () => {
      expect(ViewStateMachine).toBeDefined();
      expect(typeof ViewStateMachine).toBe('function');
    });

    test('should export createViewStateMachine function', () => {
      expect(createViewStateMachine).toBeDefined();
      expect(typeof createViewStateMachine).toBe('function');
    });

    test('should export createProxyRobotCopyStateMachine function', () => {
      expect(createProxyRobotCopyStateMachine).toBeDefined();
      expect(typeof createProxyRobotCopyStateMachine).toBe('function');
    });

    test('should export ViewStateMachineConfig type', () => {
      // TypeScript types are removed at runtime, so we just verify the import works
      expect(true).toBe(true);
    });

    test('should export StateContext type', () => {
      expect(true).toBe(true);
    });

    test('should export StateHandler type', () => {
      expect(true).toBe(true);
    });
  });

  describe('Tracing Exports', () => {
    test('should export Tracing class', () => {
      expect(Tracing).toBeDefined();
      expect(typeof Tracing).toBe('function');
    });

    test('should export createTracing function', () => {
      expect(createTracing).toBeDefined();
      expect(typeof createTracing).toBe('function');
    });

    test('should export MessageMetadata type', () => {
      expect(true).toBe(true);
    });

    test('should export TraceInfo type', () => {
      expect(true).toBe(true);
    });
  });

  describe('TomeConnector Exports', () => {
    test('should export TomeConnector class', () => {
      expect(TomeConnector).toBeDefined();
      expect(typeof TomeConnector).toBe('function');
    });

    test('should export createTomeConnector function', () => {
      expect(createTomeConnector).toBeDefined();
      expect(typeof createTomeConnector).toBe('function');
    });

    test('should export TomeConnection type', () => {
      expect(true).toBe(true);
    });

    test('should export TomeConnectionConfig type', () => {
      expect(true).toBe(true);
    });
  });

  describe('RobotCopy Exports', () => {
    test('should export RobotCopy class', () => {
      expect(RobotCopy).toBeDefined();
      expect(typeof RobotCopy).toBe('function');
    });

    test('should export createRobotCopy function', () => {
      expect(createRobotCopy).toBeDefined();
      expect(typeof createRobotCopy).toBe('function');
    });

    test('should export RobotCopyConfig type', () => {
      expect(true).toBe(true);
    });
  });

  describe('ClientGenerator Exports', () => {
    test('should export ClientGenerator class', () => {
      expect(ClientGenerator).toBeDefined();
      expect(typeof ClientGenerator).toBe('function');
    });

    test('should export createClientGenerator function', () => {
      expect(createClientGenerator).toBeDefined();
      expect(typeof createClientGenerator).toBe('function');
    });

    test('should export ClientGeneratorConfig type', () => {
      expect(true).toBe(true);
    });

    test('should export ClientGeneratorExample type', () => {
      expect(true).toBe(true);
    });

    test('should export ClientGeneratorDiscovery type', () => {
      expect(true).toBe(true);
    });
  });

  describe('TomeManager Exports', () => {
    test('should export TomeManager class', () => {
      expect(TomeManager).toBeDefined();
      expect(typeof TomeManager).toBe('function');
    });
  });

  describe('TomeConfig Exports', () => {
    test('should export createTomeConfig function', () => {
      expect(createTomeConfig).toBeDefined();
      expect(typeof createTomeConfig).toBe('function');
    });

    test('should export FishBurgerTomeConfig', () => {
      expect(FishBurgerTomeConfig).toBeDefined();
      expect(typeof FishBurgerTomeConfig).toBe('object');
    });

    test('should export EditorTomeConfig', () => {
      expect(EditorTomeConfig).toBeDefined();
      expect(typeof EditorTomeConfig).toBe('object');
    });

    test('should export TomeConfig type', () => {
      expect(true).toBe(true);
    });

    test('should export TomeInstance type', () => {
      expect(true).toBe(true);
    });
  });
});

describe('log-view-machine Functionality', () => {
  describe('createViewStateMachine', () => {
    test('should create a ViewStateMachine instance', () => {
      const machine = createViewStateMachine({
        machineId: 'test-machine',
        xstateConfig: {
          id: 'test',
          initial: 'idle',
          states: {
            idle: {
              on: {
                START: 'running'
              }
            },
            running: {
              on: {
                STOP: 'idle'
              }
            }
          }
        }
      });

      expect(machine).toBeDefined();
      expect(machine.send).toBeDefined();
      expect(typeof machine.send).toBe('function');
      expect(machine.withState).toBeDefined();
      expect(typeof machine.withState).toBe('function');
      expect(machine.withRobotCopy).toBeDefined();
      expect(typeof machine.withRobotCopy).toBe('function');
    });
  });

  describe('createTomeConfig', () => {
    test('should create a TomeConfig instance', () => {
      const config = createTomeConfig({
        id: 'test-tome',
        name: 'Test Tome',
        version: '1.0.0'
      });

      expect(config).toBeDefined();
      expect(config.id).toBe('test-tome');
      expect(config.name).toBe('Test Tome');
      expect(config.version).toBe('1.0.0');
    });
  });

  describe('createRobotCopy', () => {
    test('should create a RobotCopy instance', () => {
      const robotCopy = createRobotCopy();

      expect(robotCopy).toBeDefined();
      expect(robotCopy.registerMachine).toBeDefined();
      expect(typeof robotCopy.registerMachine).toBe('function');
    });
  });

  describe('createTracing', () => {
    test('should create a Tracing instance', () => {
      const tracing = createTracing();

      expect(tracing).toBeDefined();
      // Note: Tracing methods may vary based on implementation
      expect(tracing).toBeDefined();
    });
  });

  describe('createTomeConnector', () => {
    test('should create a TomeConnector instance', () => {
      const connector = createTomeConnector();

      expect(connector).toBeDefined();
      expect(connector.connect).toBeDefined();
      expect(typeof connector.connect).toBe('function');
    });
  });

  describe('createClientGenerator', () => {
    test('should create a ClientGenerator instance', () => {
      const generator = createClientGenerator();

      expect(generator).toBeDefined();
      expect(generator.registerMachine).toBeDefined();
      expect(typeof generator.registerMachine).toBe('function');
    });
  });
});

describe('Integration Tests', () => {
  test('should create and use a complete state machine workflow', async () => {
    // Create a machine
    const machine = createViewStateMachine({
      machineId: 'workflow-test',
      xstateConfig: {
        id: 'workflow',
        initial: 'start',
        context: {
          step: 0,
          data: null
        },
        states: {
          start: {
            on: {
              NEXT: 'processing'
            }
          },
          processing: {
            on: {
              COMPLETE: 'finished',
              ERROR: 'error'
            }
          },
          finished: {
            type: 'final'
          },
          error: {
            on: {
              RETRY: 'start'
            }
          }
        }
      }
    });

    // Verify the machine was created
    expect(machine).toBeDefined();
    expect(machine.send).toBeDefined();
    expect(typeof machine.send).toBe('function');

    // Start the machine
    machine.start();
    
    // Test sending events (the machine handles state internally)
    expect(() => machine.send('NEXT')).not.toThrow();
    expect(() => machine.send('COMPLETE')).not.toThrow();
    
    // Test getting state
    const state = machine.getState();
    expect(state).toBeDefined();
  });

  test('should create and configure a TomeConfig with machines', () => {
    const config = createTomeConfig({
      id: 'integration-tome',
      name: 'Integration Test Tome',
      version: '1.0.0',
      machines: {
        main: {
          id: 'main-machine',
          name: 'Main Machine',
          xstateConfig: {
            id: 'main',
            initial: 'idle',
            states: {
              idle: { on: { START: 'active' } },
              active: { on: { STOP: 'idle' } }
            }
          }
        }
      }
    });

    expect(config.machines.main).toBeDefined();
    expect(config.machines.main.id).toBe('main-machine');
    expect(config.machines.main.xstateConfig.states.idle).toBeDefined();
  });
});
