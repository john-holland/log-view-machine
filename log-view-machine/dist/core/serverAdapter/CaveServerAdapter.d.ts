/**
 * Cave server adapter contract (generic).
 * Runtime adapters implement this and map to their host (Express, Vite, Next, etc.).
 * Layered adapters wrap another adapter and filter by responsibility/section.
 */
import type { NormalizedRequestHandler, NormalizedMiddleware, RouteHandlerBag } from './types';
/** Context passed to each adapter when createCaveServer applies plugins. */
export interface CaveServerContext {
    cave: import('../Cave').CaveInstance;
    tomeConfigs: import('../TomeConfig').TomeConfig[];
    variables: Record<string, string>;
    sections: Record<string, boolean>;
}
/**
 * Server adapter interface.
 * - registerRoute: register a single route (method, path, handler).
 * - mount: attach a set of routes under a base path.
 * - use: register middleware (auth, CORS, body parsing, etc.).
 * - apply: main entry; runner calls this with context. Adapter creates host resources and registers routes.
 */
export interface CaveServerAdapter {
    /**
     * Apply this adapter: use cave and tomeConfigs to register routes with the host.
     * The runner calls apply() after cave.initialize(). Adapter may create TomeManager (or equivalent) and register routes.
     */
    apply(context: CaveServerContext): Promise<void>;
    /** Register a single route. Handler receives normalized request and returns normalized response. */
    registerRoute?(method: string, path: string, handler: NormalizedRequestHandler): void;
    /** Mount a route handler bag under a base path. */
    mount?(basePath: string, routeHandlerBag: RouteHandlerBag): void;
    /** Register middleware (order matters). */
    use?(middleware: NormalizedMiddleware): void;
    /** Optional: health check endpoint and interval. */
    healthCheck?(path?: string, intervalMs?: number): void;
    /** Optional: retry policy for failed requests or startup. */
    retryPolicy?: {
        maxRetries?: number;
        backoffMs?: number;
    };
    /** Optional: circuit breaker config. */
    circuitBreaker?: {
        threshold?: number;
        resetMs?: number;
    };
}
