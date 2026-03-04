/**
 * createTome - Browser-safe Tome factory (no Express).
 * Builds ViewStateMachines from TomeConfig and returns a TomeInstance.
 * Use TomeManager when you have Express and need routing.
 */
import { createViewStateMachine } from './viewstatemachine/ViewStateMachine';
/**
 * Create a TomeInstance from config without Express or routing.
 * Same machine-building logic as TomeManager.registerTome; use for browser or non-Express environments.
 */
export function createTome(config) {
    const machines = new Map();
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
    let context = { ...(config.context || {}) };
    const viewKeyListeners = [];
    function getRenderKey() {
        const base = config.renderKey ?? config.id;
        const machineKeys = [];
        machines.forEach((m, key) => {
            if (m && typeof m.getRenderKey === 'function') {
                machineKeys.push(m.getRenderKey());
            }
            else {
                machineKeys.push(key);
            }
        });
        if (machineKeys.length === 0)
            return base;
        return `${base}:${machineKeys.join(',')}`;
    }
    const tomeInstance = {
        id: config.id,
        config,
        machines,
        get context() {
            return context;
        },
        set context(value) {
            context = value;
        },
        get isCaveSynchronized() {
            return isCaveSynchronized;
        },
        getRenderKey,
        observeViewKey(callback) {
            callback(getRenderKey());
            viewKeyListeners.push(callback);
            return () => {
                const i = viewKeyListeners.indexOf(callback);
                if (i !== -1)
                    viewKeyListeners.splice(i, 1);
            };
        },
        synchronizeWithCave(_cave) {
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
        getMachine(id) {
            return machines.get(id);
        },
        async sendMessage(machineId, event, data) {
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
        getState(machineId) {
            const machine = machines.get(machineId);
            if (!machine) {
                throw new Error(`Machine ${machineId} not found in tome ${config.id}`);
            }
            return typeof machine.getState === 'function' ? machine.getState() : null;
        },
        updateContext(updates) {
            context = { ...context, ...updates };
            // ViewStateMachine does not implement updateContext; only update Tome context
        },
    };
    return tomeInstance;
}
