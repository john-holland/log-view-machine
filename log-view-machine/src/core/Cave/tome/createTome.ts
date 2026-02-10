/**
 * createTome - Browser-safe Tome factory (no Express).
 * Builds ViewStateMachines from TomeConfig and returns a TomeInstance.
 * Use TomeManager when you have Express and need routing.
 */

import { TomeConfig, TomeInstance } from './TomeConfig';
import { createViewStateMachine } from './viewstatemachine/ViewStateMachine';

/**
 * Create a TomeInstance from config without Express or routing.
 * Same machine-building logic as TomeManager.registerTome; use for browser or non-Express environments.
 */
export function createTome(config: TomeConfig): TomeInstance {
  const machines = new Map<string, any>();

  for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
    const machine = createViewStateMachine({
      machineId: machineConfig.id,
      xstateConfig: machineConfig.xstateConfig,
      context: {
        ...(config.context || {}),
        ...(machineConfig.context || {}),
      },
      ...(machineConfig.logStates && { logStates: machineConfig.logStates }),
    });
    machines.set(machineKey, machine);
  }

  let isCaveSynchronized = false;
  let context: Record<string, any> = { ...(config.context || {}) };
  const viewKeyListeners: Array<(key: string) => void> = [];

  function getRenderKey(): string {
    const base = config.renderKey ?? config.id;
    const machineKeys: string[] = [];
    machines.forEach((m, key) => {
      if (m && typeof m.getRenderKey === 'function') {
        machineKeys.push(m.getRenderKey());
      } else {
        machineKeys.push(key);
      }
    });
    if (machineKeys.length === 0) return base;
    return `${base}:${machineKeys.join(',')}`;
  }

  const tomeInstance: TomeInstance = {
    id: config.id,
    config,
    machines,
    get context() {
      return context;
    },
    set context(value: Record<string, any>) {
      context = value;
    },
    get isCaveSynchronized() {
      return isCaveSynchronized;
    },

    getRenderKey,
    observeViewKey(callback: (key: string) => void): () => void {
      callback(getRenderKey());
      viewKeyListeners.push(callback);
      return () => {
        const i = viewKeyListeners.indexOf(callback);
        if (i !== -1) viewKeyListeners.splice(i, 1);
      };
    },

    synchronizeWithCave(_cave?: unknown) {
      isCaveSynchronized = true;
    },

    async start() {
      for (const [, machine] of machines) {
        if (machine && typeof machine.start === 'function') {
          await machine.start();
        }
      }
    },

    async stop() {
      for (const [, machine] of machines) {
        if (machine && typeof machine.stop === 'function') {
          await machine.stop();
        }
      }
    },

    getMachine(id: string) {
      return machines.get(id);
    },

    async sendMessage(machineId: string, event: string, data?: any): Promise<any> {
      const machine = machines.get(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
      }
      const eventObj = typeof event === 'string' ? { type: event, ...(data || {}) } : event;
      if (typeof machine.send === 'function') {
        machine.send(eventObj);
      }
      if (typeof machine.getState === 'function') {
        return machine.getState();
      }
      return undefined;
    },

    getState(machineId: string) {
      const machine = machines.get(machineId);
      if (!machine) {
        throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
      }
      return typeof machine.getState === 'function' ? machine.getState() : null;
    },

    updateContext(updates: Record<string, any>) {
      context = { ...context, ...updates };
      // ViewStateMachine does not implement updateContext; only update Tome context
    },
  };

  return tomeInstance;
}
