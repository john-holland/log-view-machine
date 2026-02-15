/**
 * Normalized request shape used by Cave server adapters (Express, Vite, etc.).
 */
export interface NormalizedRequest {
    url: string;
    path: string;
    method: string;
    query: Record<string, string | string[]>;
    headers: Record<string, string>;
    body?: unknown;
}
/**
 * Normalized response shape returned by route handlers.
 */
export interface NormalizedResponse {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
}
export type NormalizedRequestHandler = (req: NormalizedRequest) => NormalizedResponse | Promise<NormalizedResponse>;
export type NormalizedMiddleware = (req: NormalizedRequest, next: () => Promise<NormalizedResponse>) => Promise<NormalizedResponse>;
/**
 * Bag of route handlers mountable under a base path (e.g. Express Router).
 */
export type RouteHandlerBag = unknown;
