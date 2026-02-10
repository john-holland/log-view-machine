/**
 * createCaveServer - applies Cave + tome config and plugins (adapters) generically.
 * Initializes the Cave, then calls each adapter's apply(context).
 */
import type { CaveInstance } from '../Cave';
import type { TomeConfig } from '../TomeConfig';
import type { CaveServerAdapter } from './CaveServerAdapter';
export interface CreateCaveServerConfig {
    cave: CaveInstance;
    tomeConfigs: TomeConfig[];
    variables?: Record<string, string>;
    sections?: Record<string, boolean>;
    plugins: CaveServerAdapter[];
}
/**
 * Create and run a Cave server: initialize the Cave, then apply each plugin (adapter) with the shared context.
 * Each adapter's apply() is responsible for creating host resources (e.g. TomeManager) and registering routes.
 */
export declare function createCaveServer(config: CreateCaveServerConfig): Promise<void>;
