/**
 * React hooks for Cave, Tome, and ViewStateMachine that act like useEffect-compatible useState:
 * hold the instance, subscribe via observeViewKey for renderKey, and handle cleanup on unmount.
 */

import { useState, useEffect, useRef } from 'react';
import type { CaveInstance } from './Cave';
import type { TomeInstance } from './TomeConfig';
import type { ViewStateMachine } from './ViewStateMachine';

/** Options for useViewStateMachineInstance (e.g. unregister from app Tome router). */
export interface UseViewStateMachineInstanceOptions {
  /** Called on unmount to unregister the machine (e.g. appTomeRouter.unregister(id)). */
  unregister?: () => void;
}

/**
 * useCave(cave): returns [cave, renderKey]. Subscribes to cave.observeViewKey; cleanup: unsubscribe only.
 */
export function useCave(cave: CaveInstance | null): [CaveInstance | null, string] {
  const [renderKey, setRenderKey] = useState(() => (cave ? cave.getRenderKey() : ''));
  const caveRef = useRef(cave);

  useEffect(() => {
    caveRef.current = cave;
    if (!cave) {
      setRenderKey('');
      return undefined;
    }
    setRenderKey(cave.getRenderKey());
    const unsubscribe = cave.observeViewKey(setRenderKey);
    return () => {
      unsubscribe();
    };
  }, [cave]);

  return [cave, renderKey];
}

/**
 * useTome(tome): returns [tome, renderKey]. Subscribes to tome.observeViewKey; cleanup: unsubscribe + tome.stop(), and optional unregister if provided.
 */
export function useTome(
  tome: TomeInstance | null,
  options?: { unregister?: () => void }
): [TomeInstance | null, string] {
  const [renderKey, setRenderKey] = useState(() => (tome ? tome.getRenderKey() : ''));
  const tomeRef = useRef(tome);
  const unregisterRef = useRef(options?.unregister);

  useEffect(() => {
    unregisterRef.current = options?.unregister;
  }, [options?.unregister]);

  useEffect(() => {
    tomeRef.current = tome;
    if (!tome) {
      setRenderKey('');
      return undefined;
    }
    setRenderKey(tome.getRenderKey());
    const unsubscribe = tome.observeViewKey(setRenderKey);
    return () => {
      unsubscribe();
      if (typeof tomeRef.current?.stop === 'function') {
        tomeRef.current.stop();
      }
      if (typeof unregisterRef.current === 'function') {
        unregisterRef.current();
      }
    };
  }, [tome]);

  return [tome, renderKey];
}

/**
 * useViewStateMachineInstance(machine, options): returns [machine, renderKey]. Subscribes to machine.observeViewKey;
 * cleanup: unsubscribe + machine.stop() + options.unregister(). Use when you don't need the full useViewStateMachine state/send API.
 */
export function useViewStateMachineInstance<TModel = any>(
  machine: ViewStateMachine<TModel> | null,
  options?: UseViewStateMachineInstanceOptions
): [ViewStateMachine<TModel> | null, string] {
  const [renderKey, setRenderKey] = useState(() =>
    machine && typeof machine.getRenderKey === 'function' ? machine.getRenderKey() : ''
  );
  const machineRef = useRef(machine);
  const unregisterRef = useRef(options?.unregister);

  useEffect(() => {
    unregisterRef.current = options?.unregister;
  }, [options?.unregister]);

  useEffect(() => {
    machineRef.current = machine;
    if (!machine) {
      setRenderKey('');
      return undefined;
    }
    if (typeof machine.getRenderKey === 'function') {
      setRenderKey(machine.getRenderKey());
    }
    const unsubscribe =
      typeof machine.observeViewKey === 'function'
        ? machine.observeViewKey(setRenderKey)
        : () => {};
    return () => {
      unsubscribe();
      if (machineRef.current && typeof (machineRef.current as any).stop === 'function') {
        (machineRef.current as any).stop();
      }
      if (typeof unregisterRef.current === 'function') {
        unregisterRef.current();
      }
    };
  }, [machine]);

  return [machine, renderKey];
}
