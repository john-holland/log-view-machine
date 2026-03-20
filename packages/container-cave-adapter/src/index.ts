/**
 * container-cave-adapter – Tome container adapter with header/footer tracking.
 *
 * Features:
 * - Header and footer injection with single-injection tracking per Cave/Tome
 * - Composed-view override with configurable container tag and classes
 * - Optional container override limit for sub-machine renders (default: infinite)
 */

export {
  ContainerAdapterProvider,
  useContainerAdapter,
  parseContainerOverrideTag,
  ContainerAdapterContext,
} from './ContainerAdapterContext';

export type {
  ContainerAdapterContextValue,
  ContainerAdapterProviderProps,
} from './ContainerAdapterContext';

export {
  useContainerAdapterFragmentsFromApi,
} from './useContainerAdapterFragments';

export type { UseContainerAdapterFragmentsResult } from './useContainerAdapterFragments';

/** Adapter descriptor for discovery/listing. */
export const CONTAINER_ADAPTER_DESCRIPTOR = {
  id: 'container-cave-adapter',
  name: 'Container Cave Adapter',
  type: 'typescript' as const,
  features: ['header_tracking', 'footer_tracking', 'container_override', 'composed_view_override'],
  usedIn: ['log-view-machine', 'StructuralTomeConnector'],
} as const;
