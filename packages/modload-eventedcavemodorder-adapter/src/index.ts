/**
 * modload-eventedcavemodorder-adapter: trigger mod load/unload on LVM state transitions and optional tenant change.
 * Stackable; optional modName scope; pathToTomeMachine or convention (tomeId/machineId from path).
 */

import type { CaveServerAdapter, CaveServerContext } from 'log-view-machine';

export interface EventedModLoaderOptions {
  /** Optional: only this mod; undefined = all mods. */
  modName?: string;
  /** Map path (e.g. "settings/mods/reload") -> target state name (e.g. "reloaded"). When machine enters state, trigger load. */
  load?: Record<string, string>;
  /** Map path -> target state name. When machine enters state, trigger unload. */
  unload?: Record<string, string>;
  /** Optional: map path string to { tomeId, machineId }. If omitted, use convention: first segment = tomeId, second = machineId. */
  pathToTomeMachine?: (path: string) => { tomeId: string; machineId: string } | undefined;
  /** Called when a load-trigger state is entered. */
  onLoadMods?: (modName?: string) => void | Promise<void>;
  /** Called when an unload-trigger state is entered. */
  onUnloadMods?: (modName?: string) => void | Promise<void>;
  /** Optional: get TomeManager (e.g. from context.tomeManagerRef) when not yet set during apply. */
  getTomeManager?: () => { getTome(id: string): { getMachine(id: string): { subscribe(cb: (s: unknown) => void): () => void } | undefined } | undefined } | null;
}

function defaultPathToTomeMachine(path: string): { tomeId: string; machineId: string } | undefined {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2) return { tomeId: parts[0], machineId: parts[1] };
  if (parts.length === 1) return { tomeId: parts[0], machineId: parts[0] };
  return undefined;
}

export interface EventedModLoaderResult {
  adapter: CaveServerAdapter;
  /** Handler to call when tenant changes (e.g. from Cave config onTenantChange). Triggers unload then load. */
  getTenantChangeHandler: () => (newTenant: string, previousTenant: string) => void;
}

/**
 * Create evented mod loader adapter. In apply(), subscribes to tome machines when TomeManager is available (context.tomeManagerRef).
 * Returns adapter and getTenantChangeHandler for the app to call when tenant changes.
 */
export function createEventedModLoader(options: EventedModLoaderOptions): EventedModLoaderResult {
  const {
    modName,
    load = {},
    unload = {},
    pathToTomeMachine = defaultPathToTomeMachine,
    onLoadMods,
    onUnloadMods,
    getTomeManager: getTomeManagerOption,
  } = options;

  const unsubscribes: Array<() => void> = [];

  function triggerLoad(): void {
    if (onLoadMods) {
      try {
        const r = onLoadMods(modName);
        if (r && typeof (r as Promise<void>).then === 'function') (r as Promise<void>).catch(() => {});
      } catch (_) {}
    }
  }

  function triggerUnload(): void {
    if (onUnloadMods) {
      try {
        const r = onUnloadMods(modName);
        if (r && typeof (r as Promise<void>).then === 'function') (r as Promise<void>).catch(() => {});
      } catch (_) {}
    }
  }

  function subscribeToTomeManager(tomeManager: { getTome(id: string): { getMachine(id: string): { subscribe(cb: (s: unknown) => void): () => void } | undefined } | undefined } | null): void {
    if (!tomeManager) return;
    const resolve = (path: string) => pathToTomeMachine(path) ?? defaultPathToTomeMachine(path);
    for (const [path, targetState] of Object.entries(load)) {
      const resolved = resolve(path);
      if (!resolved) continue;
      const tome = tomeManager.getTome(resolved.tomeId);
      if (!tome) continue;
      const machine = tome.getMachine(resolved.machineId);
      if (!machine || typeof machine.subscribe !== 'function') continue;
      const unsub = machine.subscribe((snapshot: unknown) => {
        const s = snapshot as { value?: string; state?: string };
        const state = s?.value ?? s?.state;
        if (state === targetState) triggerLoad();
      });
      if (typeof unsub === 'function') unsubscribes.push(unsub);
    }
    for (const [path, targetState] of Object.entries(unload)) {
      const resolved = resolve(path);
      if (!resolved) continue;
      const tome = tomeManager.getTome(resolved.tomeId);
      if (!tome) continue;
      const machine = tome.getMachine(resolved.machineId);
      if (!machine || typeof machine.subscribe !== 'function') continue;
      const unsub = machine.subscribe((snapshot: unknown) => {
        const s = snapshot as { value?: string; state?: string };
        const state = s?.value ?? s?.state;
        if (state === targetState) triggerUnload();
      });
      if (typeof unsub === 'function') unsubscribes.push(unsub);
    }
  }

  const adapter: CaveServerAdapter = {
    async apply(context: CaveServerContext): Promise<void> {
      const ref = context.tomeManagerRef;
      const tomeManager = ref?.current ?? (getTomeManagerOption ? getTomeManagerOption() : null);
      subscribeToTomeManager(tomeManager);
    },
  };

  function getTenantChangeHandler(): (newTenant: string, previousTenant: string) => void {
    return (_newTenant: string, _previousTenant: string) => {
      triggerUnload();
      triggerLoad();
    };
  }

  return { adapter, getTenantChangeHandler };
}
