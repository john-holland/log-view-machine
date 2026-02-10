/**
 * React hooks for Cave, Tome, and ViewStateMachine that act like useEffect-compatible useState:
 * hold the instance, subscribe via observeViewKey for renderKey, and handle cleanup on unmount.
 */
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
export declare function useCave(cave: CaveInstance | null): [CaveInstance | null, string];
/**
 * useTome(tome): returns [tome, renderKey]. Subscribes to tome.observeViewKey; cleanup: unsubscribe + tome.stop(), and optional unregister if provided.
 */
export declare function useTome(tome: TomeInstance | null, options?: {
    unregister?: () => void;
}): [TomeInstance | null, string];
/**
 * useViewStateMachineInstance(machine, options): returns [machine, renderKey]. Subscribes to machine.observeViewKey;
 * cleanup: unsubscribe + machine.stop() + options.unregister(). Use when you don't need the full useViewStateMachine state/send API.
 */
export declare function useViewStateMachineInstance<TModel = any>(machine: ViewStateMachine<TModel> | null, options?: UseViewStateMachineInstanceOptions): [ViewStateMachine<TModel> | null, string];
