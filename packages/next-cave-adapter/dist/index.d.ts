/**
 * Next.js Cave server adapter.
 * Implements CaveServerAdapter via Next.js API routes / route handlers and middleware.
 */
import type { CaveServerAdapter } from 'log-view-machine';
export interface NextCaveAdapterOptions {
    /** Path for Address registry when sections.registry is true (default /api/registry). */
    registryPath?: string;
    /** Next.js runtime: node (default) or edge. */
    runtime?: 'node' | 'edge';
}
export declare function nextCaveAdapter(options?: NextCaveAdapterOptions): CaveServerAdapter;
