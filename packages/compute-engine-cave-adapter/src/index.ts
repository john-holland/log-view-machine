/**
 * compute-engine-cave-adapter: Cave server adapter for Google Compute Engine (VM or MIG).
 * Uses Express + express-cave-adapter. Optional getGceMetadata() for project/instance id.
 * Run: app.listen(Number(process.env.PORT) || 8080).
 */

import express, { type Application } from 'express';
import { expressCaveAdapter, type ExpressCaveAdapterOptions } from 'express-cave-adapter';
import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';

export type { ExpressCaveAdapterOptions } from 'express-cave-adapter';

export interface ComputeEngineCaveAdapterOptions extends ExpressCaveAdapterOptions {
  app?: Application;
}

export interface GceMetadata {
  projectId?: string;
  instanceId?: string;
}

const GCE_METADATA_HOST = 'http://metadata.google.internal';

/**
 * Fetch GCE metadata (project id, instance id). Resolves to {} if not on GCE or request fails.
 */
export async function getGceMetadata(): Promise<GceMetadata> {
  try {
    const [projectRes, instanceRes] = await Promise.all([
      fetch(`${GCE_METADATA_HOST}/computeMetadata/v1/project/project-id`, { headers: { 'Metadata-Flavor': 'Google' } }),
      fetch(`${GCE_METADATA_HOST}/computeMetadata/v1/instance/id`, { headers: { 'Metadata-Flavor': 'Google' } }),
    ]);
    const projectId = projectRes.ok ? await projectRes.text() : undefined;
    const instanceId = instanceRes.ok ? await instanceRes.text() : undefined;
    return { projectId, instanceId };
  } catch {
    return {};
  }
}

/**
 * Create the Compute Engine Cave adapter. Uses express-cave-adapter under the hood.
 * After createCaveServer(), use getApp() and run: app.listen(Number(process.env.PORT) || 8080).
 */
export function computeEngineCaveAdapter(options: ComputeEngineCaveAdapterOptions = {}): CaveServerAdapter & { getApp(): Application } {
  const app: Application = options.app ?? express();
  if (!options.app) {
    app.use(express.json());
  }
  const expressAdapter = expressCaveAdapter({ ...options, app });
  return {
    registerRoute: expressAdapter.registerRoute?.bind(expressAdapter),
    mount: expressAdapter.mount?.bind(expressAdapter),
    use: expressAdapter.use?.bind(expressAdapter),
    async apply(context: CaveServerContext): Promise<void> {
      await expressAdapter.apply(context);
    },
    getApp(): Application {
      return (expressAdapter as { getApp(): Application }).getApp();
    },
  };
}
