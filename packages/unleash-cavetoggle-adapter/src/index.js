/**
 * Unleash Cave Toggle Adapter
 * Contract: isEnabled(toggleName: string) => Promise<boolean>
 * serverless = true: use config.defaults; serverless = false: real Unleash client (url, clientKey, appName, environment).
 */

/**
 * @param {{ serverless: boolean, defaults?: Record<string, boolean>, logger?: { info?: (msg: string) => void }, url?: string, clientKey?: string, appName?: string, environment?: string }} config
 * @returns {{ isEnabled(toggleName: string): Promise<boolean> }}
 */
export function createUnleashCaveToggleAdapter(config) {
  const log = config.logger?.info ? (msg) => config.logger.info(msg) : (msg) => console.info(msg);

  if (config.serverless === true) {
    const defaults = config.defaults != null && typeof config.defaults === 'object' ? config.defaults : {};
    return {
      async isEnabled(toggleName) {
        const value = defaults[toggleName] ?? false;
        log('[unleash-cavetoggle-adapter] serverless: isEnabled("' + toggleName + '") => ' + value);
        return value;
      },
    };
  }

  // Full Unleash: require url, clientKey, appName; environment optional
  const url = config.url;
  const clientKey = config.clientKey;
  const appName = config.appName;
  const environment = config.environment;

  if (!url || !clientKey || !appName) {
    throw new Error('unleash-cavetoggle-adapter: when serverless is false, url, clientKey, and appName are required');
  }

  let unleashInstance;
  try {
    const { initialize } = await import('unleash-client');
    unleashInstance = initialize({
      url,
      appName,
      environment: environment || undefined,
      customHeaders: { Authorization: clientKey },
    });
  } catch (err) {
    if (config.logger?.error) config.logger.error('[unleash-cavetoggle-adapter] Unleash client init failed: ' + (err?.message || err));
    throw err;
  }

  return {
    async isEnabled(toggleName) {
      return Promise.resolve(unleashInstance.isEnabled(toggleName));
    },
  };
}

export default { createUnleashCaveToggleAdapter };
