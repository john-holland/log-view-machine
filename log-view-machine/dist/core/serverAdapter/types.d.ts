/**
 * Normalized request/response types for the Cave server adapter contract.
 * Adapters map from their host's native request/response to these shapes.
 */
export interface NormalizedRequest {
    url: string;
    path: string;
    method: string;
    query: Record<string, string | string[]>;
    headers: Record<string, string>;
    body?: unknown;
}
export interface NormalizedResponse {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
}
export type NormalizedRequestHandler = (req: NormalizedRequest) => Promise<NormalizedResponse> | NormalizedResponse;
export type NormalizedMiddleware = (req: NormalizedRequest, next: () => Promise<NormalizedResponse>) => Promise<NormalizedResponse>;
/** Opaque bag passed to mount(); adapter-defined (e.g. router, handler map). */
export type RouteHandlerBag = unknown;
