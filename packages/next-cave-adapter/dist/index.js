/**
 * Next.js Cave server adapter.
 * Implements CaveServerAdapter via Next.js API routes / route handlers and middleware.
 */
export function nextCaveAdapter(options = {}) {
    const registryPath = options.registryPath ?? '/api/registry';
    const adapter = {
        async apply(context) {
            const { cave, sections } = context;
            if (sections.registry === true) {
                const config = cave.getConfig();
                const spelunk = config.spelunk;
                if (spelunk.childCaves) {
                    for (const [_name, _child] of Object.entries(spelunk.childCaves)) {
                    }
                }
            }
        },
    };
    return adapter;
}
