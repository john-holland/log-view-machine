// Core ViewStateMachine exports
export { 
  ViewStateMachine, 
  createViewStateMachine,
  createProxyRobotCopyStateMachine,
  type ViewStateMachineConfig,
  type StateContext,
  type StateHandler,
  // New action helper exports
  createAssignAction,
  createNamedAction,
  type XStateAction,
  type ActionCreator,
  type XStateActions,
  // Router and service exports
  type RoutedSend,
  type ServiceMeta
} from './core/ViewStateMachine';

// ViewStack and TomeBase exports
export {
  ViewStack,
  type ViewStackEntry
} from './core/ViewStack';

export {
  TomeBase,
  MachineRouter,
  type ViewKeyObserver
} from './core/TomeBase';

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

// TomeConfig exports
export {
  createTomeConfig,
  FishBurgerTomeConfig,
  EditorTomeConfig
} from './core/TomeConfig';

export type {
  TomeConfig,
  TomeInstance,
  ISubMachine,
  TomeRenderContainer
} from './core/TomeConfig';

// TomeAdapter exports
export {
  ProxyMachineAdapter,
  ViewMachineAdapter,
  LazyTomeManager
} from './core/TomeAdapters';

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

// OpenTelemetry exports
export {
  OpenTelemetryManager,
  openTelemetryManager,
  type OpenTelemetryConfig,
  type StackTraceInfo,
  type ErrorContext
} from './opentelemetry-setup';

// Example exports
export {
  StackTraceExample,
  createStackTraceExample
} from './examples/StackTraceExample';

// TomeRenderer exports
export {
  TomeRenderer,
  useTomeRenderer
} from './core/TomeRenderer';

// ErrorBoundary export - lightweight error boundary without ace-editor dependency
export {
  ErrorBoundary
} from './components/ErrorBoundary';

// Component exports - Note: GenericEditor requires CSS to be loaded separately
// Import directly: import GenericEditor from 'log-view-machine/src/components/GenericEditor'
// Or use EditorWrapper from your application which handles this
// export { default as GenericEditor } from './components/GenericEditor'; 