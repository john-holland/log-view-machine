/**
 * container-cave-adapter – Tome container adapter with header/footer tracking.
 *
 * Features:
 * - Header and footer injection with single-injection tracking per Cave/Tome
 * - Composed-view override with configurable container tag and classes
 * - Optional container override limit for sub-machine renders (default: infinite)
 */
export { ContainerAdapterProvider, useContainerAdapter, parseContainerOverrideTag, ContainerAdapterContext, } from './ContainerAdapterContext';
export type { ContainerAdapterContextValue, ContainerAdapterProviderProps, } from './ContainerAdapterContext';
export { useContainerAdapterFragmentsFromApi, } from './useContainerAdapterFragments';
export type { UseContainerAdapterFragmentsResult } from './useContainerAdapterFragments';
/** Adapter descriptor for discovery/listing. */
export declare const CONTAINER_ADAPTER_DESCRIPTOR: {
    readonly id: "container-cave-adapter";
    readonly name: "Container Cave Adapter";
    readonly type: "typescript";
    readonly features: readonly ["header_tracking", "footer_tracking", "container_override", "composed_view_override"];
    readonly usedIn: readonly ["log-view-machine", "StructuralTomeConnector"];
};
//# sourceMappingURL=index.d.ts.map