/**
 * Tests for ViewStateMachine: withState optional config, result/results, log(message, metadata?, config?), getRenderKey, observeViewKey.
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import {
  createViewStateMachine,
  type ViewStorageConfig,
  type LogEntry,
} from '../index';

const baseConfig = {
  machineId: 'test-vsm',
  xstateConfig: {
    id: 'test',
    initial: 'idle' as const,
    states: {
      idle: { on: { GO: 'active' } },
      active: { on: { STOP: 'idle' } },
    },
  },
};

describe('ViewStateMachine', () => {
  describe('withState optional third parameter (ViewStorageConfig)', () => {
    it('should accept withState(stateName, handler) without config', () => {
      const machine = createViewStateMachine(baseConfig);
      expect(() => {
        machine.withState('idle', async () => {});
      }).not.toThrow();
      expect(machine).toBeDefined();
    });

    it('should accept withState(stateName, handler, config) with partial ViewStorageConfig', () => {
      const machine = createViewStateMachine(baseConfig);
      const config: Partial<ViewStorageConfig> = {
        find: { selector: { name: { $exists: true } } },
        findOne: { id: 1 },
        collection: 'testViews',
        logCollection: 'testLogs',
      };
      expect(() => {
        machine.withState('idle', async () => {}, config);
      }).not.toThrow();
    });
  });

  describe('StateContext result and results (no db)', () => {
    it('should provide result undefined and results [] when no db', async () => {
      const machine = createViewStateMachine(baseConfig);
      const ref: { result: unknown; results: unknown[] } = { result: undefined, results: [] };
      machine.withState('idle', async (ctx) => {
        ref.result = ctx.result;
        ref.results = ctx.results;
      });
      function Test() {
        const out = machine.useViewStateMachine({});
        return (
          <div>
            <span data-testid="result">{out.result === undefined ? 'undefined' : 'set'}</span>
            <span data-testid="results">{Array.isArray(out.results) ? out.results.length : -1}</span>
          </div>
        );
      }
      render(<Test />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });
      expect(screen.getByTestId('result').textContent).toBe('undefined');
      expect(screen.getByTestId('results').textContent).toBe('0');
    });
  });

  describe('log(message, metadata?, config?)', () => {
    it('should support log(message) and push to logEntries', async () => {
      const machine = createViewStateMachine(baseConfig);
      machine.withState('idle', async ({ log }) => {
        await log('hello');
      });
      const ref: { logEntries: LogEntry[] } = { logEntries: [] };
      function Test() {
        const out = machine.useViewStateMachine({});
        ref.logEntries = out.logEntries;
        return <div data-testid="len">{out.logEntries.length}</div>;
      }
      render(<Test />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });
      expect(ref.logEntries.length).toBeGreaterThanOrEqual(1);
      expect(ref.logEntries.some((e) => e.message === 'hello')).toBe(true);
    });

    it('should support log(message, metadata)', async () => {
      const machine = createViewStateMachine(baseConfig);
      machine.withState('idle', async ({ log }) => {
        await log('with meta', { foo: 'bar' });
      });
      const ref: { logEntries: LogEntry[] } = { logEntries: [] };
      function Test() {
        const out = machine.useViewStateMachine({});
        ref.logEntries = out.logEntries;
        return <div />;
      }
      render(<Test />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });
      const entry = ref.logEntries.find((e) => e.message === 'with meta');
      expect(entry).toBeDefined();
      expect(entry?.metadata).toEqual({ foo: 'bar' });
    });

    it('should support log(message, metadata, config) with config spread onto entry', async () => {
      const machine = createViewStateMachine(baseConfig);
      machine.withState('idle', async ({ log }) => {
        await log('msg', { a: 1 }, { level: 'WARN' });
      });
      const ref: { logEntries: LogEntry[] } = { logEntries: [] };
      function Test() {
        const out = machine.useViewStateMachine({});
        ref.logEntries = out.logEntries;
        return <div />;
      }
      render(<Test />);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 80));
      });
      const entry = ref.logEntries.find((e) => e.message === 'msg');
      expect(entry).toBeDefined();
      expect(entry?.level).toBe('WARN');
      expect(entry?.metadata).toEqual({ a: 1 });
    });
  });

  describe('getRenderKey and observeViewKey', () => {
    it('should have getRenderKey returning string', () => {
      const machine = createViewStateMachine(baseConfig);
      expect(typeof machine.getRenderKey).toBe('function');
      expect(typeof machine.getRenderKey()).toBe('string');
      expect(machine.getRenderKey().length).toBeGreaterThan(0);
    });

    it('should have observeViewKey returning unsubscribe', () => {
      const machine = createViewStateMachine(baseConfig);
      expect(typeof machine.observeViewKey).toBe('function');
      const cb = jest.fn();
      const unsub = machine.observeViewKey(cb);
      expect(cb).toHaveBeenCalledWith(machine.getRenderKey());
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});
