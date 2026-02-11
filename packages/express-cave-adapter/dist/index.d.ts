/**
 * Express Cave server adapter.
 * Implements CaveServerAdapter by delegating to TomeManager and Express.
 */
import { type Application } from 'express';
import { TomeManager } from 'log-view-machine';
import type { CaveServerAdapter } from 'log-view-machine';
export interface CorsOptions {
    origin?: string | string[] | RegExp;
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
}
export interface Http2Options {
    allowHTTP1?: boolean;
}
export interface ThrottleAdapterConfig {
    maxRequestsPerMinute?: number;
    maxBytesPerMinute?: number;
    windowMs?: number;
}
export interface CircuitBreakerAdapterConfig {
    threshold?: number;
    resetMs?: number;
    name?: string;
}
export interface ExpressCaveAdapterOptions {
    /** Optional: use an existing Express app. If not provided, one is created. */
    app?: Application;
    /** Base path for API routes (default from Tome config or /api). */
    apiBasePath?: string;
    /** Path for Address registry when sections.registry is true (default /registry). */
    registryPath?: string;
    /** CORS: true for defaults, or full options. Applied once at adapter level. */
    cors?: boolean | CorsOptions;
    /** When true, use HTTP/2 for server creation (see createHttp2Server). */
    http2?: boolean | Http2Options;
    /** Optional: throttle config; when resourceMonitor is in context, middleware returns 429 when over limit. */
    throttle?: ThrottleAdapterConfig;
    /** Optional: circuit breaker config; when resourceMonitor is in context, middleware returns 503 when open. */
    circuitBreaker?: CircuitBreakerAdapterConfig;
}
export declare function expressCaveAdapter(options?: ExpressCaveAdapterOptions): CaveServerAdapter & {
    getApp(): Application;
    getTomeManager(): TomeManager | null;
};
/**
 * Create an HTTP or HTTP/2 server for the Express app. Use when http2 option is true.
 * In production, HTTP/2 is often terminated at a reverse proxy (ALB, OpenShift); this applies when Node is the TLS endpoint.
 */
export declare function createServer(app: Application, options: {
    http2?: boolean | Http2Options;
    port?: number;
    tls?: {
        cert: string;
        key: string;
    };
}): import('http').Server | import('http2').Http2SecureServer | import('http2').Http2Server;
