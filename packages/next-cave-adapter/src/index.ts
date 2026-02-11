/**
 * Next.js Cave server adapter.
 * Implements CaveServerAdapter via proxy to a backend Cave server.
 * Use createProxyHandler() in Next.js API routes to forward registry and per-path Tome requests.
 */

import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';

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
export function nextCaveAdapter(options: NextCaveAdapterOptions): CaveServerAdapter {
  const registryPath = options.registryPath ?? '/api/registry';
  const backendCaveUrl = (options.backendCaveUrl || '').replace(/\/$/, '');

  const adapter: CaveServerAdapter = {
    async apply(context: CaveServerContext): Promise<void> {
      const { sections, cave } = context;
      if (sections?.registry === true && cave) {
        const config = cave.getConfig();
        const spelunk = config.spelunk;
        if (spelunk?.childCaves) {
          for (const [_name, _child] of Object.entries(spelunk.childCaves)) {
            // Per-path routes are derived from context.tomeConfigs in createProxyHandler
          }
        }
      }
    },
  };

  return adapter;
}

/** Params from Next.js App Router (path can be string[] from [...path]). */
export type NextRouteParams = { path?: string[] };

/**
 * Create a proxy handler for use in Next.js API route (e.g. app/api/[...path]/route.ts).
 * - GET request to registryPath (e.g. /api/registry) → backend GET /registry
 * - Any request to /api/<tomeBasePath>/... (e.g. /api/fish-burger/cooking) → same method to backend backendCaveUrl/api/fish-burger/cooking
 */
export function createProxyHandler(options: NextCaveAdapterOptions): (request: Request, params?: NextRouteParams) => Promise<Response> {
  const backendCaveUrl = (options.backendCaveUrl || '').replace(/\/$/, '');
  const registryPathFull = options.registryPath ?? '/api/registry';
  const registryPathSegments = registryPathFull.replace(/^\/api\/?/, '').split('/').filter(Boolean);

  return async function proxyHandler(request: Request, params?: NextRouteParams): Promise<Response> {
    const pathParam = params?.path;
    const pathSegments = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
    const pathname = pathSegments.length > 0 ? '/api/' + pathSegments.join('/') : '/api';

    // GET .../registry (pathSegments ['registry']) → backend GET /registry
    if (request.method === 'GET' && pathSegments.length === registryPathSegments.length &&
        pathSegments.every((s, i) => registryPathSegments[i] === s)) {
      const url = `${backendCaveUrl}/registry`;
      const res = await fetch(url, { method: 'GET', headers: request.headers });
      const body = await res.text();
      return new Response(body, {
        status: res.status,
        headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json' },
      });
    }

    // Per-path Tome: /api/fish-burger/cooking etc. → backend /api/fish-burger/cooking
    const backendUrl = `${backendCaveUrl}${pathname}`;
    const headers = new Headers(request.headers);
    headers.delete('host');
    const init: RequestInit = {
      method: request.method,
      headers,
      duplex: 'half',
    } as RequestInit;
    if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
      init.body = request.body;
    }
    const res = await fetch(backendUrl, init);
    const resBody = await res.text();
    const resHeaders = new Headers();
    res.headers.forEach((v, k) => resHeaders.set(k, v));
    return new Response(resBody, { status: res.status, headers: resHeaders });
  };
}
