/**
 * Layered Cave server adapter.
 * Wraps another adapter and optionally filters by responsibility/section before forwarding.
 */
/**
 * Create a layered adapter that wraps another adapter and forwards operations
 * when sectionFilter (and optionally responsibility) matches the context.
 */
export function layeredCaveAdapter(options) {
    const { wrap, sectionFilter } = options;
    function shouldForward(context) {
        if (!sectionFilter || sectionFilter.length === 0)
            return true;
        return sectionFilter.some((key) => context.sections[key] === true);
    }
    const adapter = {
        async apply(context) {
            if (!shouldForward(context))
                return;
            await wrap.apply(context);
        },
        registerRoute(method, path, handler) {
            if (wrap.registerRoute)
                wrap.registerRoute(method, path, handler);
        },
        mount(basePath, routeHandlerBag) {
            if (wrap.mount)
                wrap.mount(basePath, routeHandlerBag);
        },
        use(middleware) {
            if (wrap.use)
                wrap.use(middleware);
        },
        healthCheck(path, intervalMs) {
            if (wrap.healthCheck)
                wrap.healthCheck(path, intervalMs);
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
