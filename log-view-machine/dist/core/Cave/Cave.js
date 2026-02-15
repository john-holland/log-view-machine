function createChildCaves(spelunk) {
    const childCaves = {};
    if (spelunk.childCaves) {
        for (const [key, childSpelunk] of Object.entries(spelunk.childCaves)) {
            childCaves[key] = Cave(key, childSpelunk);
        }
    }
    return childCaves;
}
/**
 * Cave factory: (name, caveDescent, options?) => CaveInstance.
 * Returns a Cave that is config-only until initialize() is called.
 */
export function Cave(name, caveDescent, options) {
    const config = { name, spelunk: caveDescent, ...options };
    let isInitialized = false;
    const childCavesRef = createChildCaves(caveDescent);
    const viewKeyListeners = [];
    function getRenderKey() {
        return caveDescent.renderKey ?? name;
    }
    const instance = {
        get name() {
            return name;
        },
        get isInitialized() {
            return isInitialized;
        },
        get childCaves() {
            return childCavesRef;
        },
        getConfig() {
            return { ...config };
        },
        getRoutedConfig(path) {
            const trimmed = path.replace(/^\.\/?|\/$/g, '') || '.';
            if (trimmed === '.' || trimmed === '') {
                return config;
            }
            const parts = trimmed.split('/').filter(Boolean);
            let current = caveDescent;
            for (const part of parts) {
                const next = current.childCaves?.[part];
                if (!next) {
                    return config;
                }
                current = next;
            }
            return current;
        },
        getRenderTarget(path) {
            const routed = instance.getRoutedConfig(path);
            const spelunk = 'spelunk' in routed ? routed.spelunk : routed;
            return {
                route: spelunk.route,
                container: spelunk.container,
                tomes: spelunk.tomes,
                tomeId: spelunk.tomeId,
            };
        },
        getRenderKey,
        observeViewKey(callback) {
            callback(getRenderKey());
            viewKeyListeners.push(callback);
            return () => {
                const i = viewKeyListeners.indexOf(callback);
                if (i !== -1)
                    viewKeyListeners.splice(i, 1);
            };
        },
        async initialize() {
            if (isInitialized) {
                return instance;
            }
            // Load Tomes, set up routing, etc. Placeholder: just mark initialized.
            for (const child of Object.values(childCavesRef)) {
                await child.initialize();
            }
            isInitialized = true;
            return instance;
        },
    };
    return instance;
}
export function createCave(name, spelunk, options) {
    return Cave(name, spelunk, options);
}
