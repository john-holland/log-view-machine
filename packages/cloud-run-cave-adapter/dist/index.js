/**
 * cloud-run-cave-adapter: Cave server adapter for Google Cloud Run.
 * Uses Express + express-cave-adapter. Export the app and run app.listen(Number(process.env.PORT) || 8080).
 * Cloud Run sets PORT; container listens on HTTP.
 */
import express from 'express';
import { expressCaveAdapter } from 'express-cave-adapter';
/**
 * Create the Cloud Run Cave adapter. Uses express-cave-adapter under the hood.
 * After createCaveServer(), use getApp() and run: app.listen(Number(process.env.PORT) || 8080).
 */
export function cloudRunCaveAdapter(options = {}) {
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
