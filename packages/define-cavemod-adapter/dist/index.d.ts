/**
 * define-cavemod-adapter: Declarative mod metadata definition with dotCMS tenancy,
 * user presence, and mod upload/installation support.
 */
export { defineMod } from './defineMod.js';
export { toDotCmsInteractions, toModDefinition } from './dotcmsInteractions.js';
export type { ModConfig, ModDefinition, DefineModOptions, ModMetadata, PathReplacement, AssetLinks, SpelunkMapEntry, } from './schema.js';
export type { DotCmsInteractions, DotCmsInteractionsOptions } from './dotcmsInteractions.js';
