/**
 * Vite Cave server adapter.
 * Implements CaveServerAdapter via Vite's configureServer and proxy/middleware.
 */
import type { Plugin } from 'vite';
import type { CaveServerAdapter } from 'log-view-machine';
export interface ViteCaveAdapterOptions {
    /** Path for Address registry when sections.registry is true (default /registry). */
    registryPath?: string;
    /** Proxy target for API when using proxy (e.g. http://localhost:3000). */
    proxyTarget?: string;
}
export declare function viteCaveAdapter(options?: ViteCaveAdapterOptions): Plugin & CaveServerAdapter;
