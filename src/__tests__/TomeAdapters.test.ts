import React from 'react';
import { createTomeConfig, ISubMachine } from '../core/TomeConfig';
import { ProxyMachineAdapter, ViewMachineAdapter } from '../core/TomeAdapters';

describe('TomeAdapters', () => {
  describe('ProxyMachineAdapter', () => {
    let mockMachine: any;
    let adapter: ProxyMachineAdapter;

    beforeEach(() => {
      mockMachine = {
        machineId: 'test-proxy',
        getState: jest.fn().mockReturnValue({ value: 'idle' }),
        getContext: jest.fn().mockReturnValue({ data: 'test' }),
        send: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() })
      };
      adapter = new ProxyMachineAdapter(mockMachine);
    });

    it('should implement ISubMachine interface', () => {
      expect(adapter.machineId).toBe('test-proxy');
      expect(adapter.machineType).toBe('proxy');
    });

    it('should delegate getState to machine', () => {
      const state = adapter.getState();
      expect(mockMachine.getState).toHaveBeenCalled();
      expect(state).toEqual({ value: 'idle' });
    });

    it('should delegate getContext to machine', () => {
      const context = adapter.getContext();
      expect(mockMachine.getContext).toHaveBeenCalled();
      expect(context).toEqual({ data: 'test' });
    });

    it('should delegate send to machine', () => {
      adapter.send('TEST_EVENT');
      expect(mockMachine.send).toHaveBeenCalledWith('TEST_EVENT');
    });

    it('should handle send errors gracefully', () => {
      mockMachine.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      adapter.send('TEST_EVENT');
      expect(adapter.getHealth().errorCount).toBe(1);
    });

    it('should provide health status', () => {
      const health = adapter.getHealth();
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('lastHeartbeat');
      expect(health).toHaveProperty('errorCount');
      expect(health).toHaveProperty('uptime');
    });

    it('should support event subscription', () => {
      const handler = jest.fn();
      adapter.on('test-event', handler);
      adapter.emit('test-event', { data: 'test' });
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });
  });

  describe('ViewMachineAdapter', () => {
    let mockMachine: any;
    let adapter: ViewMachineAdapter;

    beforeEach(() => {
      mockMachine = {
        machineId: 'test-view',
        getState: jest.fn().mockReturnValue({ value: 'idle' }),
        getContext: jest.fn().mockReturnValue({ data: 'test' }),
        send: jest.fn(),
        start: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn().mockResolvedValue(undefined),
        subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
        render: jest.fn().mockReturnValue({ type: 'div', props: { children: 'Test View' } })
      };
      adapter = new ViewMachineAdapter(mockMachine);
    });

    it('should implement ISubMachine interface', () => {
      expect(adapter.machineId).toBe('test-view');
      expect(adapter.machineType).toBe('view');
    });

    it('should delegate render to machine', () => {
      const rendered = adapter.render?.();
      expect(mockMachine.render).toHaveBeenCalled();
      expect(rendered).toEqual({ type: 'div', props: { children: 'Test View' } });
    });

    it('should handle sendToParent with chrome runtime', () => {
      // Mock chrome runtime
      (global as any).chrome = {
        runtime: {
          sendMessage: jest.fn().mockResolvedValue({ success: true })
        }
      };

      adapter.sendToParent({ type: 'test' });
      expect((global as any).chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'test' });
    });
  });

  describe('createTomeConfig with lazy TomeManager', () => {
    it('should create a tome with lazy TomeManager functionality', () => {
      const tome = createTomeConfig({
        id: 'test-tome',
        name: 'Test Tome',
        machines: {
          testMachine: {
            id: 'test-machine',
            name: 'Test Machine',
            xstateConfig: {
              initial: 'idle',
              states: {
                idle: {}
              }
            }
          }
        }
      });

      expect(tome.id).toBe('test-tome');
      expect(tome.name).toBe('Test Tome');
      expect(typeof tome.start).toBe('function');
      expect(typeof tome.stop).toBe('function');
      expect(typeof tome.getState).toBe('function');
      expect(typeof tome.getHealth).toBe('function');
      expect(typeof tome.on).toBe('function');
      expect(typeof tome.emit).toBe('function');
      expect(typeof tome.forceRender).toBe('function');
    });

    it('should support render method', () => {
      const renderFn = jest.fn().mockReturnValue({ type: 'div', props: { children: 'Test Render' } });
      const tome = createTomeConfig({
        id: 'test-tome',
        name: 'Test Tome',
        machines: {},
        render: renderFn
      });

      expect(tome.render).toBe(renderFn);
    });

    it('should support event subscription', () => {
      const tome = createTomeConfig({
        id: 'test-tome',
        name: 'Test Tome',
        machines: {}
      });

      const handler = jest.fn();
      tome.on('test-event', handler);
      tome.emit('test-event', { data: 'test' });
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support sub-machine management', () => {
      const tome = createTomeConfig({
        id: 'test-tome',
        name: 'Test Tome',
        machines: {
          testMachine: {
            id: 'test-machine',
            name: 'Test Machine',
            xstateConfig: {
              initial: 'idle',
              states: { idle: {} }
            }
          }
        }
      });

      const subMachine = tome.getSubMachine('testMachine');
      expect(subMachine).toBeDefined();
    });
  });
});
