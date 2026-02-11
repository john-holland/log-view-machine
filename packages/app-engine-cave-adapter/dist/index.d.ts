/**
 * app-engine-cave-adapter: Cave server adapter for Google App Engine (Node.js standard or flexible).
 * Uses Express + express-cave-adapter. Export the app and run app.listen(process.env.PORT || 8080).
 */
import { type Application } from 'express';
import { type ExpressCaveAdapterOptions } from 'express-cave-adapter';
import type { CaveServerAdapter } from 'log-view-machine';
export type { ExpressCaveAdapterOptions } from 'express-cave-adapter';
export interface AppEngineCaveAdapterOptions extends ExpressCaveAdapterOptions {
    app?: Application;
}
/**
 * Create the App Engine Cave adapter. Uses express-cave-adapter under the hood.
 * After createCaveServer(), use getApp() and run: app.listen(Number(process.env.PORT) || 8080).
 */
export declare function appEngineCaveAdapter(options?: AppEngineCaveAdapterOptions): CaveServerAdapter & {
    getApp(): Application;
};
