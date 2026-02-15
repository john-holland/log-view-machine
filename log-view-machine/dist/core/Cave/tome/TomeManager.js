/**
 * TomeManager - Manages Tome instances and routing
 *
 * This class handles the registration, lifecycle, and routing of Tome instances,
 * allowing them to insert gracefully into a routing hierarchy.
 */
import { createViewStateMachine } from './viewstatemachine/ViewStateMachine';
import express from 'express';
export class TomeManager {
    constructor(app, options) {
        this.tomes = new Map();
        this.app = app;
        this.middlewareRegistry = options?.middlewareRegistry ?? {};
    }
    /**
     * Register a new Tome with the manager
     */
    async registerTome(config) {
        console.log(`📚 Registering Tome: ${config.id}`);
        // Create machines for the tome
        const machines = new Map();
        for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
            const machine = createViewStateMachine({
                machineId: machineConfig.id,
                xstateConfig: machineConfig.xstateConfig,
                context: {
                    ...config.context,
                    ...machineConfig.context
                }
            });
            machines.set(machineKey, machine);
            console.log(`  🤖 Created machine: ${machineConfig.name} (${machineConfig.id})`);
        }
        let isCaveSynchronized = false;
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
        // Create tome instance
        const tomeInstance = {
            id: config.id,
            config,
            machines,
            context: config.context || {},
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
                console.log(`🚀 Starting Tome: ${this.id}`);
                // Initialize all machines
                for (const [key, machine] of this.machines) {
                    await machine.start();
                }
            },
            async stop() {
                console.log(`🛑 Stopping Tome: ${this.id}`);
                // Stop all machines
                for (const [key, machine] of this.machines) {
                    await machine.stop();
                }
            },
            getMachine(id) {
                return this.machines.get(id);
            },
            async sendMessage(machineId, event, data) {
                const machine = this.getMachine(machineId);
                if (!machine) {
                    throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
                }
                return await machine.send(event, data);
            },
            getState(machineId) {
                const machine = this.getMachine(machineId);
                if (!machine) {
                    throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
                }
                return machine.getState();
            },
            updateContext(updates) {
                this.context = { ...this.context, ...updates };
                // Update context for all machines
                for (const [key, machine] of this.machines) {
                    machine.updateContext(updates);
                }
            }
        };
        // Setup routing if configured
        if (config.routing) {
            await this.setupTomeRouting(tomeInstance);
        }
        this.tomes.set(config.id, tomeInstance);
        console.log(`✅ Tome registered: ${config.id}`);
        return tomeInstance;
    }
    /**
     * Setup routing for a tome
     */
    async setupTomeRouting(tome) {
        const { config } = tome;
        const { routing } = config;
        if (!routing)
            return;
        console.log(`🛣️ Setting up routing for Tome: ${config.id}`);
        // Create router for this tome
        const router = express.Router();
        // Apply middleware (from registry when routing.middleware lists names)
        if (routing.middleware) {
            for (const name of routing.middleware) {
                const handler = this.middlewareRegistry[name];
                if (handler) {
                    router.use(handler);
                    console.log(`  🔧 Applied middleware: ${name}`);
                }
                else {
                    console.log(`  🔧 Middleware "${name}" not in registry (add to TomeManagerOptions.middlewareRegistry to apply)`);
                }
            }
        }
        // Setup routes for each machine
        if (routing.routes) {
            for (const [machineKey, routeConfig] of Object.entries(routing.routes)) {
                const machine = tome.getMachine(machineKey);
                if (!machine) {
                    console.warn(`⚠️ Machine ${machineKey} not found for routing`);
                    continue;
                }
                const method = routeConfig.method || 'POST';
                const path = routeConfig.path;
                console.log(`  🛣️ Route: ${method} ${routing.basePath}${path} -> ${machineKey}`);
                // Create route handler
                router[method.toLowerCase()](path, async (req, res) => {
                    try {
                        const { event, data } = req.body;
                        if (!event) {
                            return res.status(400).json({
                                error: 'Event is required',
                                tome: config.id,
                                machine: machineKey
                            });
                        }
                        // Apply input transformer if configured
                        let transformedData = data;
                        if (routeConfig.transformers?.input) {
                            transformedData = routeConfig.transformers.input(data, 'forward');
                        }
                        // Send message to machine
                        const result = await tome.sendMessage(machineKey, event, transformedData);
                        // Apply output transformer if configured
                        let response = result;
                        if (routeConfig.transformers?.output) {
                            response = routeConfig.transformers.output(result, 'forward');
                        }
                        res.json({
                            success: true,
                            tome: config.id,
                            machine: machineKey,
                            event,
                            result: response,
                            timestamp: new Date().toISOString()
                        });
                    }
                    catch (error) {
                        console.error(`❌ Error in tome route ${config.id}:${machineKey}:`, error);
                        res.status(500).json({
                            success: false,
                            error: error.message,
                            tome: config.id,
                            machine: machineKey,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
            }
        }
        // Mount router on app
        const mountPath = routing.basePath || `/api/${config.id}`;
        this.app.use(mountPath, router);
        tome.router = router;
        console.log(`✅ Routing setup complete for Tome: ${config.id} at ${mountPath}`);
    }
    /**
     * Unregister a Tome
     */
    async unregisterTome(id) {
        const tome = this.tomes.get(id);
        if (!tome) {
            throw new Error(`Tome ${id} not found`);
        }
        console.log(`🗑️ Unregistering Tome: ${id}`);
        await tome.stop();
        this.tomes.delete(id);
        console.log(`✅ Tome unregistered: ${id}`);
    }
    /**
     * Get a Tome by ID
     */
    getTome(id) {
        return this.tomes.get(id);
    }
    /**
     * Start a Tome
     */
    async startTome(id) {
        const tome = this.getTome(id);
        if (!tome) {
            throw new Error(`Tome ${id} not found`);
        }
        await tome.start();
    }
    /**
     * Stop a Tome
     */
    async stopTome(id) {
        const tome = this.getTome(id);
        if (!tome) {
            throw new Error(`Tome ${id} not found`);
        }
        await tome.stop();
    }
    /**
     * List all registered Tome IDs
     */
    listTomes() {
        return Array.from(this.tomes.keys());
    }
    /**
     * Get status of all tomes
     */
    getTomeStatus() {
        const status = [];
        for (const [id, tome] of this.tomes) {
            const machineStatus = {};
            for (const [machineKey, machine] of tome.machines) {
                machineStatus[machineKey] = {
                    state: machine.getState(),
                    context: machine.getContext()
                };
            }
            status.push({
                id,
                name: tome.config.name,
                description: tome.config.description,
                version: tome.config.version,
                machines: machineStatus,
                context: tome.context
            });
        }
        return status;
    }
    /**
     * Send message to a specific machine in a tome
     */
    async sendTomeMessage(tomeId, machineId, event, data) {
        const tome = this.getTome(tomeId);
        if (!tome) {
            throw new Error(`Tome ${tomeId} not found`);
        }
        return await tome.sendMessage(machineId, event, data);
    }
    /**
     * Get state of a specific machine in a tome
     */
    getTomeMachineState(tomeId, machineId) {
        const tome = this.getTome(tomeId);
        if (!tome) {
            throw new Error(`Tome ${tomeId} not found`);
        }
        return tome.getState(machineId);
    }
    /**
     * Update context for a tome
     */
    updateTomeContext(tomeId, updates) {
        const tome = this.getTome(tomeId);
        if (!tome) {
            throw new Error(`Tome ${tomeId} not found`);
        }
        tome.updateContext(updates);
    }
}
/**
 * Create a TomeManager instance
 */
export function createTomeManager(app, options) {
    return new TomeManager(app, options);
}
