/**
 * Next.js Cave server adapter.
 * Implements CaveServerAdapter via proxy to a backend Cave server.
 * Use createProxyHandler() in Next.js API routes to forward registry and per-path Tome requests.
 */
import type { CaveServerAdapter } from 'log-view-machine';
export interface NextCaveAdapterOptions {
    /** Backend Cave server URL (e.g. http://localhost:3000 or process.env.BACKEND_CAVE_URL). */
    backendCaveUrl: string;
    /** Path for registry proxy (default /api/registry). GET this path → backend GET /registry. */
    registryPath?: string;
    /** Next.js runtime: node (default) or edge. */
    runtime?: 'node' | 'edge';
}
/**
 * Apply: store config for optional use; per-path proxy is done via createProxyHandler in API routes.
 */
export declare function nextCaveAdapter(options: NextCaveAdapterOptions): CaveServerAdapter;
/** Params from Next.js App Router (path can be string[] from [...path]). */
export type NextRouteParams = {
    path?: string[];
};
/**
 * Create a proxy handler for use in Next.js API route (e.g. app/api/[...path]/route.ts).
 * - GET request to registryPath (e.g. /api/registry) → backend GET /registry
 * - Any request to /api/<tomeBasePath>/... (e.g. /api/fish-burger/cooking) → same method to backend backendCaveUrl/api/fish-burger/cooking
 */
export declare function createProxyHandler(options: NextCaveAdapterOptions): (request: Request, params?: NextRouteParams) => Promise<Response>;
