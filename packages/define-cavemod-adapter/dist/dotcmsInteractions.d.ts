/**
 * define-cavemod-adapter: produce dotCMS interactions for tenancy, mod details, upload/assign.
 */
import type { ModConfig, ModDefinition } from './schema.js';
/**
 * Convert ModConfig to dotCMS ModDefinition content shape for content/mod-definition.json.
 */
export declare function toModDefinition(mod: ModConfig, contentType?: string): ModDefinition;
export interface DotCmsInteractionsOptions {
    tenant?: string;
}
export interface DotCmsInteractions {
    /** Resolve mod IDs assigned to the current user for the tenant */
    getModIdsForUser: (authorization: string) => Promise<string[]>;
    /** Create or update mod content in dotCMS */
    createModContent: (mod: ModConfig) => Promise<{
        identifier?: string;
    }>;
    /** Assign mod to a user */
    assignModToUser: (userId: string, modId: string) => Promise<void>;
    /** Assign mod to a role */
    assignModToRole: (role: string, modId: string) => Promise<void>;
}
/**
 * Produce dotCMS interaction functions for a mod. Callers provide implementation or optional fetch wrapper.
 * These are stubbed by default - integrators wire to actual dotCMS API.
 */
export declare function toDotCmsInteractions(_mod: ModConfig, options?: DotCmsInteractionsOptions): DotCmsInteractions;
