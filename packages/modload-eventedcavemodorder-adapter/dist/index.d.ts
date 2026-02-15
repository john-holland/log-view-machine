/**
 * modload-eventedcavemodorder-adapter: trigger mod load/unload on LVM state transitions and optional tenant change.
 * Stackable; optional modName scope; pathToTomeMachine or convention (tomeId/machineId from path).
 */
import type { CaveServerAdapter } from 'log-view-machine';
export interface EventedModLoaderOptions {
    /** Optional: only this mod; undefined = all mods. */
    modName?: string;
    /** Map path (e.g. "settings/mods/reload") -> target state name (e.g. "reloaded"). When machine enters state, trigger load. */
    load?: Record<string, string>;
    /** Map path -> target state name. When machine enters state, trigger unload. */
    unload?: Record<string, string>;
    /** Optional: map path string to { tomeId, machineId }. If omitted, use convention: first segment = tomeId, second = machineId. */
    pathToTomeMachine?: (path: string) => {
        tomeId: string;
        machineId: string;
    } | undefined;
    /** Called when a load-trigger state is entered. */
    onLoadMods?: (modName?: string) => void | Promise<void>;
    /** Called when an unload-trigger state is entered. */
    onUnloadMods?: (modName?: string) => void | Promise<void>;
    /** Optional: get TomeManager (e.g. from context.tomeManagerRef) when not yet set during apply. */
    getTomeManager?: () => {
        getTome(id: string): {
            getMachine(id: string): {
                subscribe(cb: (s: unknown) => void): () => void;
            } | undefined;
        } | undefined;
    } | null;
}
export interface EventedModLoaderResult {
    adapter: CaveServerAdapter;
    /** Handler to call when tenant changes (e.g. from Cave config onTenantChange). Triggers unload then load. */
    getTenantChangeHandler: () => (newTenant: string, previousTenant: string) => void;
}
/**
 * Create evented mod loader adapter. In apply(), subscribes to tome machines when TomeManager is available (context.tomeManagerRef).
 * Returns adapter and getTenantChangeHandler for the app to call when tenant changes.
 */
export declare function createEventedModLoader(options: EventedModLoaderOptions): EventedModLoaderResult;
