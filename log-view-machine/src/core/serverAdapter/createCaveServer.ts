/**
 * createCaveServer - applies Cave + tome config and plugins (adapters) generically.
 * Initializes the Cave, then calls each adapter's apply(context).
 */

import type { CaveInstance } from '../Cave/Cave';
import type { TomeConfig } from '../Cave/tome/TomeConfig';
import type { RobotCopy } from '../Cave/tome/viewstatemachine/robotcopy/RobotCopy';
import type { CaveServerAdapter, CaveServerContext } from './CaveServerAdapter';

export interface CreateCaveServerConfig {
  cave: CaveInstance;
  tomeConfigs: TomeConfig[];
  variables?: Record<string, string>;
  sections?: Record<string, boolean>;
  plugins: CaveServerAdapter[];
  /** Optional RobotCopy; when provided, passed to adapters so they can override location (setLocation) when mounting. */
  robotCopy?: RobotCopy;
  /** Optional resource monitor for request/bandwidth/circuit metrics (AWS/Hystrix-compatible). */
  resourceMonitor?: import('../monitoring/types').ResourceMonitor;
  /** Optional metrics reporter (e.g. GA, CloudWatch, Hystrix); can use resourceMonitor.getSnapshot(). */
  metricsReporter?: import('../monitoring/MetricsReporter').MetricsReporter;
}

/**
 * Create and run a Cave server: initialize the Cave, then apply each plugin (adapter) with the shared context.
 * Each adapter's apply() is responsible for creating host resources (e.g. TomeManager) and registering routes.
 */
export async function createCaveServer(config: CreateCaveServerConfig): Promise<void> {
  const { cave, tomeConfigs, variables = {}, sections = {}, plugins, robotCopy, resourceMonitor, metricsReporter } = config;

  await cave.initialize();

  const tomeManagerRef = { current: null as import('../Cave/tome/TomeConfig').TomeManager | null };
  const context: CaveServerContext = {
    cave,
    tomeConfigs,
    variables: { ...variables },
    sections: { ...sections },
    robotCopy,
    resourceMonitor,
    metricsReporter,
    tomeManagerRef,
  };

  for (const plugin of plugins) {
    await plugin.apply(context);
  }
}
