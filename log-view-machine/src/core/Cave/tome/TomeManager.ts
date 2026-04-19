/**
 * TomeManager - Manages Tome instances and routing
 * 
 * This class handles the registration, lifecycle, and routing of Tome instances,
 * allowing them to insert gracefully into a routing hierarchy.
 */

import { TomeConfig, TomeInstance, TomeManager as ITomeManager } from './TomeConfig';
import { createViewStateMachine } from './viewstatemachine/ViewStateMachine';
import express, { type Application, type RequestHandler } from 'express';

export interface TomeManagerOptions {
  /** Optional registry of named middleware. When routing.middleware contains a name, it is looked up and applied to the tome router. */
  middlewareRegistry?: Record<string, RequestHandler>;
}

export class TomeManager implements ITomeManager {
  public tomes: Map<string, TomeInstance> = new Map();
  private app: Application;
  private readonly middlewareRegistry: Record<string, RequestHandler>;

  constructor(app: Application, options?: TomeManagerOptions) {
    this.app = app;
    this.middlewareRegistry = options?.middlewareRegistry ?? {};
  }

  /**
   * Register a new Tome with the manager
   */
  async registerTome(config: TomeConfig): Promise<TomeInstance> {
    console.log(`📚 Registering Tome: ${config.id}`);
    
    // Create machines for the tome
    const machines = new Map<string, any>();
    
    for (const [machineKey, machineConfig] of Object.entries(config.machines)) {
      const mergedXstate = {
        ...machineConfig.xstateConfig,
        context: {
          ...(config.context || {}),
          ...(machineConfig.context || {}),
          ...(machineConfig.xstateConfig?.context || {}),
        },
      };
      const machine = createViewStateMachine({
        machineId: machineConfig.id,
        xstateConfig: mergedXstate,
        tomeConfig: config,
        ...(machineConfig.logStates ? { logStates: machineConfig.logStates } : {}),
        ...(machineConfig.db !== undefined ? { db: machineConfig.db } : {}),
        ...(machineConfig.viewStorage !== undefined ? { viewStorage: machineConfig.viewStorage } : {}),
        ...(machineConfig.runHandlersOnTransition !== undefined
          ? { runHandlersOnTransition: machineConfig.runHandlersOnTransition }
          : {}),
        ...(machineConfig.defaultModelForTransitionHandlers !== undefined
          ? { defaultModelForTransitionHandlers: machineConfig.defaultModelForTransitionHandlers }
          : {}),
      });
      
      machines.set(machineKey, machine);
      console.log(`  🤖 Created machine: ${machineConfig.name} (${machineConfig.id})`);
    }

    let isCaveSynchronized = false;
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

    // Create tome instance
    const tomeInstance: TomeInstance = {
      id: config.id,
      config,
      machines,
      context: config.context || {},
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
      
      getMachine(id: string) {
        return this.machines.get(id);
      },
      
      async sendMessage(machineId: string, event: string, data?: any) {
        const machine = this.getMachine(machineId);
        if (!machine) {
          throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
        }
        const eventObj =
          typeof event === 'string'
            ? { type: event, ...(data !== undefined && data !== null ? { data } : {}) }
            : event;
        machine.send(eventObj);
        return typeof machine.getState === 'function' ? machine.getState() : undefined;
      },
      
      getState(machineId: string) {
        const machine = this.getMachine(machineId);
        if (!machine) {
          throw new Error(`Machine ${machineId} not found in tome ${this.id}`);
        }
        return machine.getState();
      },
      
      updateContext(updates: Record<string, any>) {
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
  private async setupTomeRouting(tome: TomeInstance) {
    const { config } = tome;
    const { routing } = config;
    
    if (!routing) return;

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
        } else {
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
              const inputFn = routeConfig.transformers.input as (d: any, direction?: string) => any;
              transformedData = inputFn.length > 1 ? inputFn(data, 'forward') : inputFn(data);
            }

            // Send message to machine
            const result = await tome.sendMessage(machineKey, event, transformedData);
            
            // Apply output transformer if configured
            let response = result;
            if (routeConfig.transformers?.output) {
              const outputFn = routeConfig.transformers.output as (r: any, direction?: string) => any;
              response = outputFn.length > 1 ? outputFn(result, 'forward') : outputFn(result);
            }

            res.json({
              success: true,
              tome: config.id,
              machine: machineKey,
              event,
              result: response,
              timestamp: new Date().toISOString()
            });

          } catch (error: unknown) {
            console.error(`❌ Error in tome route ${config.id}:${machineKey}:`, error);
            const message = error instanceof Error ? error.message : String(error);
            res.status(500).json({
              success: false,
              error: message,
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
  async unregisterTome(id: string): Promise<void> {
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
  getTome(id: string): TomeInstance | undefined {
    return this.tomes.get(id);
  }

  /**
   * Start a Tome
   */
  async startTome(id: string): Promise<void> {
    const tome = this.getTome(id);
    if (!tome) {
      throw new Error(`Tome ${id} not found`);
    }

    await tome.start();
  }

  /**
   * Stop a Tome
   */
  async stopTome(id: string): Promise<void> {
    const tome = this.getTome(id);
    if (!tome) {
      throw new Error(`Tome ${id} not found`);
    }

    await tome.stop();
  }

  /**
   * List all registered Tome IDs
   */
  listTomes(): string[] {
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
  async sendTomeMessage(tomeId: string, machineId: string, event: string, data?: any) {
    const tome = this.getTome(tomeId);
    if (!tome) {
      throw new Error(`Tome ${tomeId} not found`);
    }

    return await tome.sendMessage(machineId, event, data);
  }

  /**
   * Get state of a specific machine in a tome
   */
  getTomeMachineState(tomeId: string, machineId: string) {
    const tome = this.getTome(tomeId);
    if (!tome) {
      throw new Error(`Tome ${tomeId} not found`);
    }

    return tome.getState(machineId);
  }

  /**
   * Update context for a tome
   */
  updateTomeContext(tomeId: string, updates: Record<string, any>) {
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
export function createTomeManager(app: express.Application, options?: TomeManagerOptions): TomeManager {
  return new TomeManager(app, options);
} 