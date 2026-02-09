// Core ViewStateMachine exports
export { 
  ViewStateMachine, 
  createViewStateMachine,
  createProxyRobotCopyStateMachine,
  type ViewStateMachineConfig,
  type StateContext,
  type StateHandler,
  type ViewStorageConfig
} from './core/ViewStateMachine';

// Tracing exports
export {
  Tracing,
  createTracing,
  type MessageMetadata,
  type TraceInfo
} from './core/Tracing';

// TomeConnector exports
export {
  TomeConnector,
  createTomeConnector,
  type TomeConnection,
  type TomeConnectionConfig
} from './core/TomeConnector';

// RobotCopy message broker exports
export {
  RobotCopy,
  createRobotCopy,
  type RobotCopyConfig
} from './core/RobotCopy';

// ClientGenerator exports
export {
  ClientGenerator,
  createClientGenerator,
  type ClientGeneratorConfig,
  type ClientGeneratorExample,
  type ClientGeneratorDiscovery
} from './core/ClientGenerator';

// TomeManager exports
export {
  TomeManager
} from './core/TomeManager';

// Browser-safe Tome creation (no Express)
export { createTome } from './core/createTome';

// TomeConfig exports
export {
  createTomeConfig,
  FishBurgerTomeConfig,
  EditorTomeConfig
} from './core/TomeConfig';

export type {
  TomeConfig,
  TomeInstance
} from './core/TomeConfig';

// Structural System exports
export {
  StructuralSystem,
  createStructuralSystem,
  useStructuralSystem,
  type AppStructureConfig,
  type AppStructureNode,
  type ComponentTomeMapping,
  type RouteConfig,
  type NavigationItem,
  type RoutingConfig,
  type TomeDefinition
} from './core/StructuralSystem';

// Structural Router exports
export {
  StructuralRouter,
  Route,
  RouteFallback,
  useRouter,
  type RouterContextType
} from './core/StructuralRouter';

// Structural Tome Connector exports
export {
  StructuralTomeConnector,
  useStructuralTomeConnector,
  type TomeConnectorContext
} from './core/StructuralTomeConnector';

// Default Structural Config exports
export {
  DefaultStructuralConfig,
  createStructuralConfig
} from './core/DefaultStructuralConfig';

// Cave exports
export {
  Cave,
  createCave,
  type Spelunk,
  type CaveConfig,
  type CaveInstance,
  type RenderTarget
} from './core/Cave';

// useCave, useTome, useViewStateMachineInstance (React hooks for Cave/Tome/VSM with observeViewKey)
export {
  useCave,
  useTome,
  useViewStateMachineInstance,
  type UseViewStateMachineInstanceOptions
} from './core/useCaveTomeVSM';

// DuckDB backend storage exports
export {
  createDuckDBStorage,
  createDuckDBStorageSync,
  DuckDBStorageStub,
  type DuckDBStorageAdapter
} from './core/DuckDBStorage';

// Editor components (EditorWrapper from wave-reader alignment)
export {
  default as EditorWrapper,
  type EditorWrapperProps,
  type EditorWrapperRouter
} from './components/EditorWrapper';
export { ErrorBoundary, type ErrorBoundaryProps } from './components/ErrorBoundary'; 