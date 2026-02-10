/**
 * Proxygen Cave server adapter.
 * Uses a Node C++ addon (N-API) to run Proxygen in-process; JS handlers run in Node.
 */
import { type CaveServerAdapter, type NormalizedRequest, type NormalizedResponse } from 'log-view-machine';
export interface ProxygenAddon {
    getVersion(): string;
    startServer(port: number): number;
    stopServer(): void;
    addRoute(method: string, path: string): number;
    setDispatcher(fn: (handlerId: number, req: NormalizedRequest) => Promise<NormalizedResponse> | NormalizedResponse): void;
}
/** Returns the native addon version (for diagnostics). */
export declare function getVersion(): string;
export interface ProxygenCaveAdapterOptions {
    port?: number;
    host?: string;
    /** Path for health check (default /health). */
    healthPath?: string;
    /** Path for Address registry when sections.registry is true (default /registry). */
    registryPath?: string;
}
/**
 * Cave server adapter that uses Proxygen (C++) for HTTP and N-API to run JS handlers.
 * Same contract as expressCaveAdapter; createCaveServer({ plugins: [proxygenCaveAdapter({ port: 8080 })] }) works.
 */
export declare function proxygenCaveAdapter(options?: ProxygenCaveAdapterOptions): CaveServerAdapter;
