// Core ViewStateMachine exports
export { 
  ViewStateMachine, 
  createViewStateMachine,
  createProxyRobotCopyStateMachine,
  type ViewStateMachineConfig,
  type StateContext,
  type StateHandler
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