/**
 * define-cavemod-adapter: defineMod() - declarative mod definition.
 */
/**
 * Define a mod declaratively. Accepts plain object and returns ModConfig with defaults.
 */
export function defineMod(options) {
    const { id, name, description, version, serverUrl, assets, entryPoints = {}, pathReplacements, modMetadata: explicitModMetadata, pactStatus, pactVerifiedAt, } = options;
    let modMetadata = explicitModMetadata;
    if (pathReplacements && Object.keys(pathReplacements).length > 0 && !modMetadata) {
        modMetadata = { pathReplacements };
    }
    else if (pathReplacements && modMetadata?.pathReplacements === undefined) {
        modMetadata = { ...modMetadata, pathReplacements };
    }
    return {
        id,
        name,
        description,
        version,
        serverUrl,
        assets: { ...assets },
        entryPoints: Object.keys(entryPoints).length > 0 ? entryPoints : undefined,
        modMetadata,
        pactStatus,
        pactVerifiedAt,
    };
}
