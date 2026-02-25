/**
 * define-cavemod-adapter: produce dotCMS interactions for tenancy, mod details, upload/assign.
 */
/**
 * Convert ModConfig to dotCMS ModDefinition content shape for content/mod-definition.json.
 */
export function toModDefinition(mod, contentType = 'Cavemod') {
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
/**
 * Produce dotCMS interaction functions for a mod. Callers provide implementation or optional fetch wrapper.
 * These are stubbed by default - integrators wire to actual dotCMS API.
 */
export function toDotCmsInteractions(_mod, options = {}) {
    const { tenant = 'default' } = options;
    return {
        async getModIdsForUser(_authorization) {
            // Stub: callers should implement via dotCMS API
            void tenant;
            return [];
        },
        async createModContent(mod) {
            // Stub: POST to dotCMS content API with mod-definition.json shape
            void tenant;
            return { identifier: mod.id };
        },
        async assignModToUser(_userId, _modId) {
            void tenant;
            // Stub: update user mod assignments in dotCMS
        },
        async assignModToRole(_role, _modId) {
            void tenant;
            // Stub: update role mod assignments in dotCMS
        },
    };
}
