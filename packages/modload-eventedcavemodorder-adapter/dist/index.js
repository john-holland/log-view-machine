/**
 * modload-eventedcavemodorder-adapter: trigger mod load/unload on LVM state transitions and optional tenant change.
 * Stackable; optional modName scope; pathToTomeMachine or convention (tomeId/machineId from path).
 */
function defaultPathToTomeMachine(path) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2)
        return { tomeId: parts[0], machineId: parts[1] };
    if (parts.length === 1)
        return { tomeId: parts[0], machineId: parts[0] };
    return undefined;
}
/**
 * Create evented mod loader adapter. In apply(), subscribes to tome machines when TomeManager is available (context.tomeManagerRef).
 * Returns adapter and getTenantChangeHandler for the app to call when tenant changes.
 */
export function createEventedModLoader(options) {
    const { modName, load = {}, unload = {}, pathToTomeMachine = defaultPathToTomeMachine, onLoadMods, onUnloadMods, getTomeManager: getTomeManagerOption, } = options;
    const unsubscribes = [];
    function triggerLoad() {
        if (onLoadMods) {
            try {
                const r = onLoadMods(modName);
                if (r && typeof r.then === 'function')
                    r.catch(() => { });
            }
            catch (_) { }
        }
    }
    function triggerUnload() {
        if (onUnloadMods) {
            try {
                const r = onUnloadMods(modName);
                if (r && typeof r.then === 'function')
                    r.catch(() => { });
            }
            catch (_) { }
        }
    }
    function subscribeToTomeManager(tomeManager) {
        if (!tomeManager)
            return;
        const resolve = (path) => pathToTomeMachine(path) ?? defaultPathToTomeMachine(path);
        for (const [path, targetState] of Object.entries(load)) {
            const resolved = resolve(path);
            if (!resolved)
                continue;
            const tome = tomeManager.getTome(resolved.tomeId);
            if (!tome)
                continue;
            const machine = tome.getMachine(resolved.machineId);
            if (!machine || typeof machine.subscribe !== 'function')
                continue;
            const unsub = machine.subscribe((snapshot) => {
                const s = snapshot;
                const state = s?.value ?? s?.state;
                if (state === targetState)
                    triggerLoad();
            });
            if (typeof unsub === 'function')
                unsubscribes.push(unsub);
        }
        for (const [path, targetState] of Object.entries(unload)) {
            const resolved = resolve(path);
            if (!resolved)
                continue;
            const tome = tomeManager.getTome(resolved.tomeId);
            if (!tome)
                continue;
            const machine = tome.getMachine(resolved.machineId);
            if (!machine || typeof machine.subscribe !== 'function')
                continue;
            const unsub = machine.subscribe((snapshot) => {
                const s = snapshot;
                const state = s?.value ?? s?.state;
                if (state === targetState)
                    triggerUnload();
            });
            if (typeof unsub === 'function')
                unsubscribes.push(unsub);
        }
    }
    const adapter = {
        async apply(context) {
            const ref = context.tomeManagerRef;
            const tomeManager = ref?.current ?? (getTomeManagerOption ? getTomeManagerOption() : null);
            subscribeToTomeManager(tomeManager);
        },
    };
    function getTenantChangeHandler() {
        return (_newTenant, _previousTenant) => {
            triggerUnload();
            triggerLoad();
        };
    }
    return { adapter, getTenantChangeHandler };
}
