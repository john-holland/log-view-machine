// Core ViewStateMachine exports
export { 
  ViewStateMachine, 
  createViewStateMachine,
  createProxyRobotCopyStateMachine,
  type ViewStateMachineConfig,
  type StateContext,
  type StateHandler,
  type ViewStorageConfig
} from './core/Cave/tome/viewstatemachine/ViewStateMachine';

// Tracing exports
export {
  Tracing,
  createTracing,
  type MessageMetadata,
  type TraceInfo
} from './core/tracing/Tracing';

// TomeConnector exports
export {
  TomeConnector,
  createTomeConnector,
  type TomeConnection,
  type TomeConnectionConfig
} from './core/Cave/tome/TomeConnector';

// RobotCopy message broker exports
export {
  RobotCopy,
  createRobotCopy,
  type RobotCopyConfig
} from './core/Cave/tome/viewstatemachine/robotcopy/RobotCopy';

// ClientGenerator exports
export {
  ClientGenerator,
  createClientGenerator,
  type ClientGeneratorConfig,
  type ClientGeneratorExample,
  type ClientGeneratorDiscovery
} from './core/adapters/ClientGenerator';

// TomeManager exports
export {
  TomeManager,
  createTomeManager,
  type TomeManagerOptions
} from './core/Cave/tome/TomeManager';

// Browser-safe Tome creation (no Express)
export { createTome } from './core/Cave/tome/createTome';

// TomeConfig exports
export {
  createTomeConfig,
  FishBurgerTomeConfig,
  EditorTomeConfig,
  LibraryTomeConfig,
  CartTomeConfig,
  DonationTomeConfig,
} from './core/Cave/tome/TomeConfig';

export type {
  TomeConfig,
  TomeInstance,
  TomeMachineConfig,
  ModMetadata,
  LocationHint,
  RemoteClientDescriptor,
} from './core/Cave/tome/TomeConfig';

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
} from './core/structural/StructuralSystem';

// Structural Router exports
export {
  StructuralRouter,
  Route,
  RouteFallback,
  useRouter,
  type RouterContextType
} from './core/structural/StructuralRouter';

// Structural Tome Connector exports
export {
  StructuralTomeConnector,
  useStructuralTomeConnector,
  type TomeConnectorContext
} from './core/structural/StructuralTomeConnector';

// Default Structural Config exports
export {
  DefaultStructuralConfig,
  createStructuralConfig
} from './core/structural/DefaultStructuralConfig';

// Cave exports
export {
  Cave,
  createCave,
  type Spelunk,
  type CaveConfig,
  type CaveInstance,
  type RenderTarget,
  type SecurityConfig,
  type CaveExtensionContext,
  type CaveOptions,
} from './core/Cave/Cave';

// Cave server adapter (generic contract + createCaveServer)
export {
  createCaveServer,
  type CreateCaveServerConfig,
} from './core/serverAdapter';
export type {
  CaveServerAdapter,
  CaveServerContext,
  NormalizedRequest,
  NormalizedResponse,
  NormalizedRequestHandler,
  NormalizedMiddleware,
  RouteHandlerBag,
} from './core/serverAdapter';

// CaveDB adapter contract (canonical; cavedb adapters implement this)
export type { CaveDBAdapter, CaveDBAdapterOptions, CaveDBAdapterFactory } from './core/cavedb';

// useCave, useTome, useViewStateMachineInstance (React hooks for Cave/Tome/VSM with observeViewKey)
export {
  useCave,
  useTome,
  useViewStateMachineInstance,
  type UseViewStateMachineInstanceOptions
} from './core/hooks/useCaveTomeVSM';

// DuckDB backend storage exports
export {
  createDuckDBStorage,
  createDuckDBStorageSync,
  DuckDBStorageStub,
  type DuckDBStorageAdapter
} from './core/storage/DuckDBStorage';

// Script-injection prevention (browser and Node)
export {
  escapeText,
  unescapeText,
  parseHtml,
  type SafeResult,
  type ParseHtmlOptions,
} from './core/sanitize/scriptInjectionPrevention';

// Message token (CSRF-style) for cross-boundary Cave/Tome/VSM
export {
  generateToken,
  generateTokenAsync,
  validateToken,
  serializeToken,
  parseToken,
  type MessageTokenPayload,
  type MessageTokenOptions,
  type ValidateTokenOptions,
} from './core/messaging/MessageToken';

// Cave messaging transport (extension content/background/popup)
export {
  createInMemoryTransport,
  wireInMemoryTransportPair,
  type CaveMessagingTransport,
  type CaveMessage,
  type MessageTarget,
  type MessageSender,
  type ExtensionContextType,
  type InMemoryTransportOptions,
} from './core/messaging/CaveMessagingTransport';

// Monitoring (AWS/Hystrix-compatible metrics)
export {
  createDefaultResourceMonitor,
  createMetricsReporter,
  DefaultResourceMonitor,
  type MetricsSnapshot,
  type RequestMeta,
  type ResourceMonitor,
  type BandwidthTracker,
  type MetricsReporter,
  type MetricsReporterOptions,
  type ReportFn,
} from './core/monitoring';

// Resilience (circuit breaker, throttle)
export {
  CircuitBreaker,
  createCircuitBreaker,
  ThrottlePolicy,
  createThrottlePolicy,
  type CircuitState,
  type CircuitBreakerOptions,
  type ThrottleConfig,
  type ThrottlePolicyOptions,
} from './core/resilience';

// Editor components (EditorWrapper from wave-reader alignment)
export {
  default as EditorWrapper,
  type EditorWrapperProps,
  type EditorWrapperRouter
} from './components/EditorWrapper';
export { ErrorBoundary, type ErrorBoundaryProps } from './components/ErrorBoundary'; 