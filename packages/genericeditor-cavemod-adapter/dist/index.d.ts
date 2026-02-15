/**
 * Generic Editor Cave Mod Adapter
 * Replaces Caves and Tomes via path entry points based on modMetadata configuration
 */
import type { CaveServerAdapter } from 'log-view-machine';
/** Mod metadata shape (aligned with TomeConfig.modMetadata in log-view-machine) */
export interface ModMetadata {
    pathReplacements?: Record<string, {
        modCaveId?: string;
        modTomeId?: string;
        spelunk?: Record<string, unknown>;
    }>;
    assetLinks?: {
        templates?: string;
        styles?: string;
        scripts?: string;
        serverUrl?: string;
    };
    spelunkMap?: Record<string, {
        route?: string;
        modCaveId?: string;
        modTomeId?: string;
        spelunk?: Record<string, unknown>;
    }>;
}
export interface GenericEditorCaveModAdapterOptions {
    /** URL to mod index server (kotlin-mod-index) */
    modIndexUrl?: string;
    /** Function to fetch mod metadata by mod ID */
    fetchModMetadata?: (modId: string) => Promise<ModMetadata | undefined>;
}
/**
 * Generic Editor Cave Mod Adapter
 * Intercepts routes and replaces them with mod implementations when modMetadata is present.
 */
export declare function genericeditorCaveModAdapter(options?: GenericEditorCaveModAdapterOptions): CaveServerAdapter;
