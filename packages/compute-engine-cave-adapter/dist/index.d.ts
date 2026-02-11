/**
 * compute-engine-cave-adapter: Cave server adapter for Google Compute Engine (VM or MIG).
 * Uses Express + express-cave-adapter. Optional getGceMetadata() for project/instance id.
 * Run: app.listen(Number(process.env.PORT) || 8080).
 */
import { type Application } from 'express';
import { type ExpressCaveAdapterOptions } from 'express-cave-adapter';
import type { CaveServerAdapter } from 'log-view-machine';
export type { ExpressCaveAdapterOptions } from 'express-cave-adapter';
export interface ComputeEngineCaveAdapterOptions extends ExpressCaveAdapterOptions {
    app?: Application;
}
export interface GceMetadata {
    projectId?: string;
    instanceId?: string;
}
/**
 * Fetch GCE metadata (project id, instance id). Resolves to {} if not on GCE or request fails.
 */
export declare function getGceMetadata(): Promise<GceMetadata>;
/**
 * Create the Compute Engine Cave adapter. Uses express-cave-adapter under the hood.
 * After createCaveServer(), use getApp() and run: app.listen(Number(process.env.PORT) || 8080).
 */
export declare function computeEngineCaveAdapter(options?: ComputeEngineCaveAdapterOptions): CaveServerAdapter & {
    getApp(): Application;
};
