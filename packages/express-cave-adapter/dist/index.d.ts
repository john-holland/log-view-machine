/**
 * Express Cave server adapter.
 * Implements CaveServerAdapter by delegating to TomeManager and Express.
 */
import { type Application } from 'express';
import type { CaveServerAdapter } from 'log-view-machine';
export interface ExpressCaveAdapterOptions {
    /** Optional: use an existing Express app. If not provided, one is created. */
    app?: Application;
    /** Base path for API routes (default from Tome config or /api). */
    apiBasePath?: string;
    /** Path for Address registry when sections.registry is true (default /registry). */
    registryPath?: string;
}
export declare function expressCaveAdapter(options?: ExpressCaveAdapterOptions): CaveServerAdapter & {
    getApp(): Application;
};
