/**
 * Unleash Cave Toggles Adapter (implements ToggleProvider).
 * Contract: isEnabled(toggleName: string) => Promise<boolean>
 * serverless = true: use config.defaults; serverless = false: real Unleash client (url, clientKey, appName, environment).
 */

/**
 * @param {{ serverless: boolean, defaults?: Record<string, boolean>, logger?: { info?: (msg: string) => void, error?: (msg: string) => void }, url?: string, clientKey?: string, appName?: string, environment?: string }} config
 * @returns {{ isEnabled(toggleName: string): Promise<boolean> }} ToggleProvider
 */
export function createUnleashCaveTogglesAdapter(config) {
  const log = config.logger?.info ? (msg) => config.logger.info(msg) : (msg) => console.info(msg);

  if (config.serverless === true) {
    const defaults = config.defaults != null && typeof config.defaults === 'object' ? config.defaults : {};
    return {
      async isEnabled(toggleName) {
        const value = defaults[toggleName] ?? false;
        log('[unleash-cavetoggles-adapter] serverless: isEnabled("' + toggleName + '") => ' + value);
        return value;
      },
    };
  }

  const url = config.url;
  const clientKey = config.clientKey;
  const appName = config.appName;
  const environment = config.environment;

  if (!url || !clientKey || !appName) {
    throw new Error('unleash-cavetoggles-adapter: when serverless is false, url, clientKey, and appName are required');
  }

  let unleashInstancePromise = null;
  function getUnleashInstance() {
    if (!unleashInstancePromise) {
      unleashInstancePromise = import('unleash-client').then(({ initialize }) => {
        return initialize({
          url,
          appName,
          environment: environment || undefined,
          customHeaders: { Authorization: clientKey },
        });
      }).catch((err) => {
        if (config.logger?.error) config.logger.error('[unleash-cavetoggles-adapter] Unleash client init failed: ' + (err?.message || err));
        throw err;
      });
    }
    return unleashInstancePromise;
  }

  return {
    async isEnabled(toggleName) {
      const instance = await getUnleashInstance();
      return Promise.resolve(instance.isEnabled(toggleName));
    },
  };
}

/** @deprecated Use createUnleashCaveTogglesAdapter */
export function createUnleashCaveToggleAdapter(config) {
  return createUnleashCaveTogglesAdapter(config);
}

export default { createUnleashCaveTogglesAdapter, createUnleashCaveToggleAdapter };
