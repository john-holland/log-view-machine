/**
 * Vite Cave server adapter.
 * Implements CaveServerAdapter via Vite's configureServer and proxy/middleware.
 */
export function viteCaveAdapter(options = {}) {
    const registryPath = options.registryPath ?? '/registry';
    async function applyCave(context) {
        const { cave, sections } = context;
        if (sections.registry === true) {
            const config = cave.getConfig();
            const spelunk = config.spelunk;
            if (spelunk.childCaves) {
                for (const [_name, _child] of Object.entries(spelunk.childCaves)) {
                }
            }
        }
    }
    const adapter = {
        name: 'vite-cave-adapter',
        apply(configOrContext, env) {
            if (env !== undefined)
                return true;
            return applyCave(configOrContext);
        },
        configureServer(server) {
            return () => {
                server.middlewares.use((req, res, next) => {
                    const r = req;
                    const w = res;
                    const url = r.url ?? '';
                    if (r.method === 'GET' && url.startsWith(registryPath)) {
                        w.setHeader('Content-Type', 'application/json');
                        w.end(JSON.stringify({ cave: '', addresses: [], message: 'Registry: configure via apply(context)' }));
                        return;
                    }
                    next();
                });
            };
        },
    };
    return adapter;
}
