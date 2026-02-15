/**
 * dotcms-cavemodloader-adapter: configure mod loading for dotCMS (timeout, CORS, base URL).
 * Tenant-aware getModLoaderConfig(tenant?) for SaaS; tenant defaults to URL-derived when not provided.
 */

export interface ModLoaderConfig {
  timeoutMs?: number;
  cors?: { allowedOrigins?: string[]; credentials?: boolean };
  dotCmsBaseUrl?: string;
}

export interface DotcmsCavemodLoaderAdapterOptions {
  timeoutMs?: number;
  cors?: { allowedOrigins?: string[]; credentials?: boolean };
  dotCmsBaseUrl?: string;
  /** Optional: per-tenant overrides (e.g. different dotCMS URL per tenant). When getModLoaderConfig(tenant) is called, tenant key is used. */
  perTenant?: Record<string, Partial<ModLoaderConfig>>;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_BASE = typeof process !== 'undefined' && process.env?.DOTCMS_URL ? process.env.DOTCMS_URL : 'http://localhost:8080';

/**
 * Create dotCMS cavemod loader adapter. Returns getModLoaderConfig(tenant?) for use by mod proxy/iframe logic.
 * When tenant is omitted, caller should derive from request URL (origin/basePath) or pass from tenant name provider.
 */
export function createDotcmsCavemodLoaderAdapter(
  options: DotcmsCavemodLoaderAdapterOptions = {}
): { getModLoaderConfig: (tenant?: string) => ModLoaderConfig } {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cors = {},
    dotCmsBaseUrl = DEFAULT_BASE,
    perTenant = {},
  } = options;

  const baseConfig: ModLoaderConfig = {
    timeoutMs,
    cors: cors.allowedOrigins || cors.credentials !== undefined ? { allowedOrigins: cors.allowedOrigins, credentials: cors.credentials } : undefined,
    dotCmsBaseUrl: dotCmsBaseUrl.replace(/\/$/, ''),
  };

  return {
    getModLoaderConfig(tenant?: string): ModLoaderConfig {
      const overrides = tenant ? perTenant[tenant] : undefined;
      if (!overrides) return baseConfig;
      return {
        timeoutMs: overrides.timeoutMs ?? baseConfig.timeoutMs,
        cors: overrides.cors ?? baseConfig.cors,
        dotCmsBaseUrl: overrides.dotCmsBaseUrl ?? baseConfig.dotCmsBaseUrl,
      };
    },
  };
}
