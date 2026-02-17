/**
 * Mod API client - fetches /api/mods and /api/mods/:modId from Mod Index provider.
 * Used by node-mod-editor proxy and features page.
 */

/**
 * @typedef {Object} ModConfig
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} version
 * @property {string} serverUrl
 * @property {Record<string, string>} assets
 * @property {Record<string, string>} [entryPoints]
 * @property {Object} [modMetadata]
 */

/**
 * @typedef {Object} ModApiClientOptions
 * @property {string} baseUrl - Base URL of Mod Index (e.g. http://localhost:8082)
 * @property {number} [timeoutMs]
 * @property {string} [authorization]
 * @property {string} [cookie]
 */

/**
 * Fetch list of mods from Mod Index.
 * @param {ModApiClientOptions} options
 * @returns {Promise<{ mods: ModConfig[] }>}
 */
export async function fetchMods(options = {}) {
  const { baseUrl, timeoutMs = 15000, authorization, cookie } = options;
  const url = `${baseUrl.replace(/\/$/, '')}/api/mods`;
  const headers = { Accept: 'application/json' };
  if (authorization) headers['Authorization'] = authorization;
  if (cookie) headers['Cookie'] = cookie;

  const controller = new AbortController();
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const res = await fetch(url, { headers, signal: controller.signal }).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  const data = await res.json().catch(() => ({ mods: [] }));
  if (!res.ok) {
    throw new Error(data.error || `Mod API error: ${res.status}`);
  }
  return data;
}

/**
 * Fetch single mod by ID from Mod Index.
 * @param {string} modId
 * @param {ModApiClientOptions} options
 * @returns {Promise<ModConfig | null>}
 */
export async function fetchMod(modId, options = {}) {
  const { baseUrl, timeoutMs = 15000, authorization, cookie } = options;
  const url = `${baseUrl.replace(/\/$/, '')}/api/mods/${encodeURIComponent(modId)}`;
  const headers = { Accept: 'application/json' };
  if (authorization) headers['Authorization'] = authorization;
  if (cookie) headers['Cookie'] = cookie;

  const controller = new AbortController();
  const timeoutId = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const res = await fetch(url, { headers, signal: controller.signal }).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(data.error || `Mod API error: ${res.status}`);
  }
  return data;
}
