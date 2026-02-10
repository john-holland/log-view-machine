/**
 * Layered Cave server adapter.
 * Wraps another adapter and optionally filters by responsibility/section before forwarding.
 */
import type { CaveServerAdapter } from 'log-view-machine';
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
export declare function layeredCaveAdapter(options: LayeredCaveAdapterOptions): CaveServerAdapter;
