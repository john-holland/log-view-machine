/**
 * app-engine-cave-adapter: Cave server adapter for Google App Engine (Node.js standard or flexible).
 * Uses Express + express-cave-adapter. Export the app and run app.listen(process.env.PORT || 8080).
 */
import express from 'express';
import { expressCaveAdapter } from 'express-cave-adapter';
/**
 * Create the App Engine Cave adapter. Uses express-cave-adapter under the hood.
 * After createCaveServer(), use getApp() and run: app.listen(Number(process.env.PORT) || 8080).
 */
export function appEngineCaveAdapter(options = {}) {
    const app = options.app ?? express();
    if (!options.app) {
        app.use(express.json());
    }
    const expressAdapter = expressCaveAdapter({ ...options, app });
    return {
        registerRoute: expressAdapter.registerRoute?.bind(expressAdapter),
        mount: expressAdapter.mount?.bind(expressAdapter),
        use: expressAdapter.use?.bind(expressAdapter),
        async apply(context) {
            await expressAdapter.apply(context);
        },
        getApp() {
            return expressAdapter.getApp();
        },
    };
}
