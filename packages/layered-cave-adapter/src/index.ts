/**
 * Layered Cave server adapter.
 * Wraps another adapter and optionally filters by responsibility/section before forwarding.
 */

import type {
  CaveServerAdapter,
  CaveServerContext,
  NormalizedRequestHandler,
  NormalizedMiddleware,
  RouteHandlerBag,
} from 'log-view-machine';

export interface LayeredCaveAdapterOptions {
  /** The adapter to delegate to (runtime or another layer). */
  wrap: CaveServerAdapter;
  /** Responsibility name(s); if set, we only forward when context matches (e.g. via variables or convention). */
  responsibility?: string | string[];
  /** Optional order/phase for composition. */
  order?: number;
  /** Section keys this layer handles; we only call wrap.apply() when at least one is true in context.sections. If empty/omitted, we always forward. */
  sectionFilter?: string[];
}

/**
 * Create a layered adapter that wraps another adapter and forwards operations
 * when sectionFilter (and optionally responsibility) matches the context.
 */
export function layeredCaveAdapter(options: LayeredCaveAdapterOptions): CaveServerAdapter {
  const { wrap, sectionFilter } = options;

  function shouldForward(context: CaveServerContext): boolean {
    if (!sectionFilter || sectionFilter.length === 0) return true;
    return sectionFilter.some((key) => context.sections[key] === true);
  }

  const adapter: CaveServerAdapter = {
    async apply(context: CaveServerContext): Promise<void> {
      if (!shouldForward(context)) return;
      await wrap.apply(context);
    },

    registerRoute(method: string, path: string, handler: NormalizedRequestHandler): void {
      if (wrap.registerRoute) wrap.registerRoute(method, path, handler);
    },

    mount(basePath: string, routeHandlerBag: RouteHandlerBag): void {
      if (wrap.mount) wrap.mount(basePath, routeHandlerBag);
    },

    use(middleware: NormalizedMiddleware): void {
      if (wrap.use) wrap.use(middleware);
    },

    healthCheck(path?: string, intervalMs?: number): void {
      if (wrap.healthCheck) wrap.healthCheck(path, intervalMs);
    },

    get retryPolicy() {
      return wrap.retryPolicy;
    },

    get circuitBreaker() {
      return wrap.circuitBreaker;
    },
  };

  return adapter;
}
