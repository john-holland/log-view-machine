/**
 * Log-view-machine adapters index.
 * Lists all TypeScript adapters provided by the package.
 */

export { ClientGenerator, createClientGenerator } from './ClientGenerator';
export type {
  ClientGeneratorConfig,
  ClientGeneratorExample,
  ClientGeneratorDiscovery,
} from './ClientGenerator';

export { TeleportHQAdapter, createTeleportHQAdapter } from './TeleportHQAdapter';
export type {
  TeleportHQConfig,
  TeleportHQComponent,
  TeleportHQTemplate,
} from './TeleportHQAdapter';

export {
  ContainerAdapterProvider,
  useContainerAdapter,
  parseContainerOverrideTag,
  ContainerAdapterContext,
  useContainerAdapterFragmentsFromApi,
  CONTAINER_ADAPTER_DESCRIPTOR,
} from 'container-cave-adapter';
export type {
  ContainerAdapterContextValue,
  ContainerAdapterProviderProps,
  UseContainerAdapterFragmentsResult,
} from 'container-cave-adapter';

/** All adapter descriptors for discovery. */
export const ADAPTER_DESCRIPTORS = [
  {
    id: 'client-generator',
    name: 'ClientGenerator',
    type: 'typescript' as const,
    features: ['discovery', 'documentation', 'examples'],
  },
  {
    id: 'teleport-hq',
    name: 'TeleportHQAdapter',
    type: 'typescript' as const,
    features: ['template_loading', 'component_mapping', 'state_sync'],
  },
  {
    id: 'container-cave-adapter',
    name: 'Container Cave Adapter',
    type: 'typescript' as const,
    features: ['header_tracking', 'footer_tracking', 'container_override', 'composed_view_override'],
    usedIn: ['log-view-machine', 'StructuralTomeConnector'],
  },
] as const;
