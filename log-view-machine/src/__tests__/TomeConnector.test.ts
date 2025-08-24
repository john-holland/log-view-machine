import { TomeConnector, createTomeConnector } from '../core/TomeConnector';
import { RobotCopy, createRobotCopy } from '../core/RobotCopy';
import { ViewStateMachine, createViewStateMachine } from '../core/ViewStateMachine';

// Mock ViewStateMachine for testing
const createMockViewStateMachine = (name: string) => {
  const mockMachine = {
    constructor: { name },
    on: jest.fn(),
    send: jest.fn(),
    getState: jest.fn(() => ({ value: 'idle' })),
  };
  
  return mockMachine as any;
};

describe('TomeConnector with RobotCopy Integration', () => {
  let tomeConnector: TomeConnector;
  let robotCopy: RobotCopy;
  let mockSourceTome: any;
  let mockTargetTome: any;

  beforeEach(() => {
    robotCopy = createRobotCopy();
    tomeConnector = createTomeConnector(robotCopy);
    mockSourceTome = createMockViewStateMachine('SourceTome');
    mockTargetTome = createMockViewStateMachine('TargetTome');
  });

  afterEach(() => {
    if (tomeConnector) {
      tomeConnector.destroy();
    }
  });

  describe('RobotCopy Integration', () => {
    it('should initialize RobotCopy integration on construction', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(tomeConnector.getRobotCopy()).toBe(robotCopy);
    });

    it('should register with RobotCopy as a machine', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check that the machine was registered by looking at the RobotCopy's machines
      const registeredMachines = robotCopy.getRegisteredMachines();
      expect(registeredMachines.has('tome-connector')).toBe(true);
      
      const registeredMachine = registeredMachines.get('tome-connector');
      expect(registeredMachine).toBeDefined();
      expect(registeredMachine?.config).toEqual({
        type: 'connector',
        capabilities: ['event-routing', 'state-sync', 'network-topology'],
        version: '1.0.0'
      });
    });
  });

  describe('Enhanced Connection Management', () => {
    it('should create connections with tracing when RobotCopy is available', async () => {
      const trackMessageSpy = jest.spyOn(robotCopy, 'trackMessage');
      
      const connectionId = await tomeConnector.connect(mockSourceTome, mockTargetTome, {
        enableTracing: true
      });
      
      expect(connectionId).toBeDefined();
      expect(trackMessageSpy).toHaveBeenCalledWith(
        connectionId,
        expect.any(String), // traceId
        expect.any(String), // spanId
        expect.objectContaining({
          action: 'connection_created',
          data: expect.objectContaining({
            source: 'SourceTome',
            target: 'TargetTome'
          })
        })
      );
    });

    it('should add tracing context to events when RobotCopy is available', async () => {
      // Mock feature toggles to return true for event routing
      jest.spyOn(robotCopy, 'isEnabled').mockResolvedValue(true);
      
      const connectionId = await tomeConnector.connect(mockSourceTome, mockTargetTome, {
        enableTracing: true
      });
      
      // Simulate an event
      const eventHandler = mockSourceTome.on.mock.calls[0][1];
      await eventHandler({ type: 'TEST_EVENT', data: 'test' });
      
      // Verify the event was sent with tracing context
      expect(mockTargetTome.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TEST_EVENT',
          _traceId: expect.any(String),
          _spanId: expect.any(String),
          _connectionId: connectionId,
          _forwarded: true
        })
      );
    });
  });

  describe('Health Monitoring', () => {
    it('should track connection health status', async () => {
      const connectionId = await tomeConnector.connect(mockSourceTome, mockTargetTome);
      
      const connections = tomeConnector.getConnections();
      const connection = connections.find(c => c.id === connectionId);
      
      expect(connection).toBeDefined();
      expect(connection?.healthStatus).toBe('healthy');
      expect(connection?.createdAt).toBeDefined();
      expect(connection?.lastActivity).toBeDefined();
    });

    it('should provide health metrics in network topology', async () => {
      await tomeConnector.connect(mockSourceTome, mockTargetTome);
      
      const topology = tomeConnector.getNetworkTopology();
      
      expect(topology.metrics).toBeDefined();
      expect(topology.metrics.totalConnections).toBe(1);
      expect(topology.metrics.healthyConnections).toBe(1);
      expect(topology.metrics.degradedConnections).toBe(0);
      expect(topology.metrics.unhealthyConnections).toBe(0);
    });
  });

  describe('Feature Toggle Integration', () => {
    it('should respect feature toggles for event routing', async () => {
      // Mock the feature toggle to return false
      jest.spyOn(robotCopy, 'isEnabled').mockResolvedValue(false);
      
      await tomeConnector.connect(mockSourceTome, mockTargetTome);
      
      // Simulate an event
      const eventHandler = mockSourceTome.on.mock.calls[0][1];
      await eventHandler({ type: 'TEST_EVENT', data: 'test' });
      
      // Event should not be forwarded due to feature toggle
      expect(mockTargetTome.send).not.toHaveBeenCalled();
    });

    it('should respect feature toggles for state synchronization', async () => {
      // Mock the feature toggle to return false
      jest.spyOn(robotCopy, 'isEnabled').mockResolvedValue(false);
      
      await tomeConnector.connect(mockSourceTome, mockTargetTome);
      
      // Simulate a state change
      const stateChangeHandler = mockSourceTome.on.mock.calls.find((call: any) => call[0] === 'stateChange')?.[1];
      if (stateChangeHandler) {
        await stateChangeHandler({ newState: { value: 'new' }, oldState: { value: 'old' } });
      }
      
      // State should not be synchronized due to feature toggle
      expect(mockTargetTome.send).not.toHaveBeenCalled();
    });
  });

  describe('Backend-Aware Operations', () => {
    it('should transform state based on backend type', async () => {
      // Mock backend type
      jest.spyOn(robotCopy, 'getBackendType').mockResolvedValue('kotlin');
      // Mock feature toggle to return true for state sync
      jest.spyOn(robotCopy, 'isEnabled').mockResolvedValue(true);
      
      await tomeConnector.connect(mockSourceTome, mockTargetTome);
      
      // Simulate a state change
      const stateChangeHandler = mockSourceTome.on.mock.calls.find((call: any) => call[0] === 'stateChange')?.[1];
      if (stateChangeHandler) {
        await stateChangeHandler({ newState: { value: 'new' }, oldState: { value: 'old' } });
      }
      
      // Should have attempted to get backend type
      expect(robotCopy.getBackendType).toHaveBeenCalled();
    });
  });

  describe('Async Operations', () => {
    it('should support async connect operations', async () => {
      const connectionId = await tomeConnector.connect(mockSourceTome, mockTargetTome);
      expect(connectionId).toBeDefined();
    });

    it('should support async network creation', async () => {
      const mockTomes = [mockSourceTome, mockTargetTome, createMockViewStateMachine('ThirdTome')];
      const connectionIds = await tomeConnector.createNetwork(mockTomes);
      
      // Ring topology: 3 tomes = 3 connections (last connects back to first)
      expect(connectionIds).toHaveLength(3);
    });

    it('should support async hub network creation', async () => {
      const mockSpokes = [mockSourceTome, mockTargetTome];
      const connectionIds = await tomeConnector.createHubNetwork(mockSourceTome, mockSpokes);
      
      expect(connectionIds).toHaveLength(2);
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should properly cleanup on destroy', async () => {
      await tomeConnector.connect(mockSourceTome, mockTargetTome);
      
      const initialConnections = tomeConnector.getConnections();
      expect(initialConnections).toHaveLength(1);
      
      tomeConnector.destroy();
      
      // Should have no connections after destroy
      expect(tomeConnector.getConnections()).toHaveLength(0);
    });
  });
});
