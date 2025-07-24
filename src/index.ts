// Core ViewStateMachine exports
export { 
  ViewStateMachine, 
  createViewStateMachine,
  type ViewStateMachineConfig,
  type StateContext,
  type StateHandler
} from './core/ViewStateMachine';

// RobotCopy message broker exports
export {
  RobotCopy,
  createRobotCopy,
  type RobotCopyConfig,
  type RobotCopyMessage,
  type RobotCopyResponse,
  type MessageBrokerConfig,
  type WindowIntercomConfig,
  type ChromeMessageConfig,
  type HttpApiConfig,
  type GraphQLConfig,
  type RobotCopyDiscovery,
  type MachineCapabilities,
  type GraphQLState,
  type MessageBroker,
  WindowIntercomBroker,
  ChromeMessageBroker,
  HttpApiBroker,
  GraphQLBroker
} from './core/RobotCopy';

// ClientGenerator exports
export {
  ClientGenerator,
  createClientGenerator,
  type ClientGeneratorConfig,
  type ClientGeneratorExample,
  type ClientGeneratorDiscovery
} from './core/ClientGenerator'; 