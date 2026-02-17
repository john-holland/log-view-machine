/**
 * Mod Index API PACT contract constants and mod entry shape.
 * Consumer: ModApiConsumer (e.g. node-mod-editor).
 * Provider: ModIndexProvider (e.g. kotlin-mod-index).
 */

export const MOD_PACT_CONSUMER = 'ModApiConsumer';
export const MOD_PACT_PROVIDER = 'ModIndexProvider';

/**
 * Mod entry shape returned by GET /api/mods and GET /api/mods/:id.
 * Optional pactStatus and pactVerifiedAt are set by build/CI when PACT tests run.
 * @typedef {Object} ModEntry
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} version
 * @property {string} serverUrl
 * @property {Record<string, string>} assets
 * @property {Record<string, string>} [entryPoints]
 * @property {Object} [modMetadata]
 * @property {'good'|'fail'|'unknown'} [pactStatus] - Set when PACT consumer tests are run and verified in build/CI
 * @property {string} [pactVerifiedAt] - ISO timestamp of last PACT verification
 */

export const PACT_STATUS_GOOD = 'good';
export const PACT_STATUS_FAIL = 'fail';
export const PACT_STATUS_UNKNOWN = 'unknown';
