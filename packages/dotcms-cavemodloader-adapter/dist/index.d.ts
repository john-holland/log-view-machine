/**
 * dotcms-cavemodloader-adapter: configure mod loading for dotCMS (timeout, CORS, base URL).
 * Tenant-aware getModLoaderConfig(tenant?) for SaaS; tenant defaults to URL-derived when not provided.
 */
export interface ModLoaderConfig {
    timeoutMs?: number;
    cors?: {
        allowedOrigins?: string[];
        credentials?: boolean;
    };
    dotCmsBaseUrl?: string;
}
export interface DotcmsCavemodLoaderAdapterOptions {
    timeoutMs?: number;
    cors?: {
        allowedOrigins?: string[];
        credentials?: boolean;
    };
    dotCmsBaseUrl?: string;
    /** Optional: per-tenant overrides (e.g. different dotCMS URL per tenant). When getModLoaderConfig(tenant) is called, tenant key is used. */
    perTenant?: Record<string, Partial<ModLoaderConfig>>;
}
/**
 * Create dotCMS cavemod loader adapter. Returns getModLoaderConfig(tenant?) for use by mod proxy/iframe logic.
 * When tenant is omitted, caller should derive from request URL (origin/basePath) or pass from tenant name provider.
 */
export declare function createDotcmsCavemodLoaderAdapter(options?: DotcmsCavemodLoaderAdapterOptions): {
    getModLoaderConfig: (tenant?: string) => ModLoaderConfig;
};
