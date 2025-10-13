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

// TomeClient exports (browser-compatible alternative to TomeManager)
export {
  TomeClient,
  HttpTomeAPI,
  createTomeClient
} from './core/TomeClient';

// Re-export TomeAPI types
export type {
  TomeAPI,
  TomeInstanceResponse,
  TomeListResponse,
  TomeStatusResponse,
  TomeMessageRequest,
  TomeMessageResponse
} from './core/TomeAPI';

// TomeConfig exports
export {
  createTomeConfig,
  FishBurgerTomeConfig,
  EditorTomeConfig
} from './core/TomeConfig';

export type {
  TomeConfig,
  TomeInstance,
  ISubMachine
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

// Example exports (OpenTelemetry examples excluded for browser build)
// export {
//   StackTraceExample,
//   createStackTraceExample
// } from './examples/StackTraceExample';
