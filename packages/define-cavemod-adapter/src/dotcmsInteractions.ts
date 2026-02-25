/**
 * define-cavemod-adapter: produce dotCMS interactions for tenancy, mod details, upload/assign.
 */

import type { ModConfig, ModDefinition } from './schema.js';

/**
 * Convert ModConfig to dotCMS ModDefinition content shape for content/mod-definition.json.
 */
export function toModDefinition(mod: ModConfig, contentType = 'Cavemod'): ModDefinition {
  return {
    contentType,
    fields: {
      modId: mod.id,
      modName: mod.name,
      modDescription: mod.description,
      modVersion: mod.version,
      serverUrl: mod.serverUrl,
      assets: mod.assets,
      entryPoints: mod.entryPoints,
      modMetadata: mod.modMetadata,
    },
  };
}

export interface DotCmsInteractionsOptions {
  tenant?: string;
}

export interface DotCmsInteractions {
  /** Resolve mod IDs assigned to the current user for the tenant */
  getModIdsForUser: (authorization: string) => Promise<string[]>;
  /** Create or update mod content in dotCMS */
  createModContent: (mod: ModConfig) => Promise<{ identifier?: string }>;
  /** Assign mod to a user */
  assignModToUser: (userId: string, modId: string) => Promise<void>;
  /** Assign mod to a role */
  assignModToRole: (role: string, modId: string) => Promise<void>;
}

/**
 * Produce dotCMS interaction functions for a mod. Callers provide implementation or optional fetch wrapper.
 * These are stubbed by default - integrators wire to actual dotCMS API.
 */
export function toDotCmsInteractions(
  _mod: ModConfig,
  options: DotCmsInteractionsOptions = {}
): DotCmsInteractions {
  const { tenant = 'default' } = options;

  return {
    async getModIdsForUser(_authorization: string): Promise<string[]> {
      // Stub: callers should implement via dotCMS API
      void tenant;
      return [];
    },
    async createModContent(mod: ModConfig): Promise<{ identifier?: string }> {
      // Stub: POST to dotCMS content API with mod-definition.json shape
      void tenant;
      return { identifier: mod.id };
    },
    async assignModToUser(_userId: string, _modId: string): Promise<void> {
      void tenant;
      // Stub: update user mod assignments in dotCMS
    },
    async assignModToRole(_role: string, _modId: string): Promise<void> {
      void tenant;
      // Stub: update role mod assignments in dotCMS
    },
  };
}
