/**
 * createCaveServer - applies Cave + tome config and plugins (adapters) generically.
 * Initializes the Cave, then calls each adapter's apply(context).
 */
function createDefaultAppShellRegistry() {
    const map = new Map();
    return {
        register(name, descriptor) {
            map.set(name, { ...descriptor, name });
        },
        get(name) {
            return map.get(name);
        },
    };
}
/**
 * Create and run a Cave server: initialize the Cave, then apply each plugin (adapter) with the shared context.
 * Each adapter's apply() is responsible for creating host resources (e.g. TomeManager) and registering routes.
 */
export async function createCaveServer(config) {
    const { cave, tomeConfigs, variables = {}, sections = {}, plugins, robotCopy, resourceMonitor, metricsReporter } = config;
    await cave.initialize();
    const tomeManagerRef = { current: null };
    const appShellRegistry = createDefaultAppShellRegistry();
    const appShellRegistryRef = { current: appShellRegistry };
    const context = {
        cave,
        tomeConfigs,
        variables: { ...variables },
        sections: { ...sections },
        robotCopy,
        resourceMonitor,
        metricsReporter,
        tomeManagerRef,
        appShellRegistryRef,
    };
    for (const plugin of plugins) {
        await plugin.apply(context);
    }
}
