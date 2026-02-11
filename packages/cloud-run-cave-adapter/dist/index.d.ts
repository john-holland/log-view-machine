/**
 * cloud-run-cave-adapter: Cave server adapter for Google Cloud Run.
 * Uses Express + express-cave-adapter. Export the app and run app.listen(Number(process.env.PORT) || 8080).
 * Cloud Run sets PORT; container listens on HTTP.
 */
import { type Application } from 'express';
import { type ExpressCaveAdapterOptions } from 'express-cave-adapter';
import type { CaveServerAdapter } from 'log-view-machine';
export type { ExpressCaveAdapterOptions } from 'express-cave-adapter';
export interface CloudRunCaveAdapterOptions extends ExpressCaveAdapterOptions {
    app?: Application;
}
/**
 * Create the Cloud Run Cave adapter. Uses express-cave-adapter under the hood.
 * After createCaveServer(), use getApp() and run: app.listen(Number(process.env.PORT) || 8080).
 */
export declare function cloudRunCaveAdapter(options?: CloudRunCaveAdapterOptions): CaveServerAdapter & {
    getApp(): Application;
};
