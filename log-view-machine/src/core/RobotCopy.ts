import { ViewStateMachine } from './ViewStateMachine';

// Message broker configurations
export interface MessageBrokerConfig {
  type: 'window-intercom' | 'chrome-message' | 'http-api' | 'graphql';
  config: WindowIntercomConfig | ChromeMessageConfig | HttpApiConfig | GraphQLConfig;
}

export interface WindowIntercomConfig {
  targetOrigin: string;
  messageType: string;
  timeout?: number;
}

export interface ChromeMessageConfig {
  extensionId?: string;
  messageType: string;
  responseTimeout?: number;
}

export interface HttpApiConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryAttempts?: number;
}

export interface GraphQLConfig {
  endpoint: string;
  headers?: Record<string, string>;
  timeout?: number;
  wsEndpoint?: string; // For subscriptions
}

// RobotCopy configuration
export interface RobotCopyConfig {
  machineId: string;
  description?: string;
  messageBrokers: MessageBrokerConfig[];
  autoDiscovery?: boolean;
  clientSpecification?: ClientSpecification;
}

export interface ClientSpecification {
  supportedLanguages: string[];
  autoGenerateClients: boolean;
  includeExamples: boolean;
  includeDocumentation: boolean;
}

export interface RobotCopyMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
  target: string;
  broker: string;
}

export interface RobotCopyResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
  messageId: string;
}

export class RobotCopy {
  private machines: Map<string, ViewStateMachine<any>> = new Map();
  private configs: Map<string, RobotCopyConfig> = new Map();
  private messageBrokers: Map<string, MessageBroker> = new Map();
  private messageQueue: RobotCopyMessage[] = [];
  private responseHandlers: Map<string, (response: RobotCopyResponse) => void> = new Map();

  constructor() {
    this.initializeDefaultBrokers();
  }

  private initializeDefaultBrokers(): void {
    // Initialize default message brokers
    this.registerMessageBroker('window-intercom', new WindowIntercomBroker());
    this.registerMessageBroker('chrome-message', new ChromeMessageBroker());
    this.registerMessageBroker('http-api', new HttpApiBroker());
    this.registerMessageBroker('graphql', new GraphQLBroker());
  }

  // Register a machine with RobotCopy
  registerMachine(machineId: string, machine: ViewStateMachine<any>, config: RobotCopyConfig): void {
    this.machines.set(machineId, machine);
    this.configs.set(machineId, config);
    
    // Set up message brokers for this machine
    config.messageBrokers.forEach(brokerConfig => {
      const broker = this.messageBrokers.get(brokerConfig.type);
      if (broker) {
        broker.configure(brokerConfig.config);
      }
    });
  }

  // Register a custom message broker
  registerMessageBroker(type: string, broker: MessageBroker): void {
    this.messageBrokers.set(type, broker);
  }

  // Send a message through the appropriate broker
  async sendMessage(message: Omit<RobotCopyMessage, 'id' | 'timestamp'>): Promise<RobotCopyResponse> {
    const fullMessage: RobotCopyMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    };

    // Add to queue
    this.messageQueue.push(fullMessage);

    // Find the appropriate broker
    const broker = this.messageBrokers.get(message.broker);
    if (!broker) {
      throw new Error(`No message broker found for type: ${message.broker}`);
    }

    try {
      const response = await broker.send(fullMessage);
      this.handleResponse(response);
      return response;
    } catch (error) {
      const errorResponse: RobotCopyResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        messageId: fullMessage.id
      };
      this.handleResponse(errorResponse);
      return errorResponse;
    }
  }

  // Post message to window (intercom)
  async postToWindow(message: any, targetOrigin: string = '*'): Promise<RobotCopyResponse> {
    return this.sendMessage({
      type: 'window-post',
      payload: message,
      source: 'robotcopy',
      target: 'window',
      broker: 'window-intercom'
    });
  }

  // Post message to Chrome extension
  async postToChrome(message: any, extensionId?: string): Promise<RobotCopyResponse> {
    return this.sendMessage({
      type: 'chrome-post',
      payload: message,
      source: 'robotcopy',
      target: extensionId || 'chrome-extension',
      broker: 'chrome-message'
    });
  }

  // Post to HTTP API
  async postToHttp(message: any, endpoint: string): Promise<RobotCopyResponse> {
    return this.sendMessage({
      type: 'http-post',
      payload: message,
      source: 'robotcopy',
      target: endpoint,
      broker: 'http-api'
    });
  }

  // Post to GraphQL
  async postToGraphQL(query: string, variables?: any): Promise<RobotCopyResponse> {
    return this.sendMessage({
      type: 'graphql-query',
      payload: { query, variables },
      source: 'robotcopy',
      target: 'graphql-endpoint',
      broker: 'graphql'
    });
  }

  // Discover all registered machines and their capabilities
  discover(): RobotCopyDiscovery {
    const discovery: RobotCopyDiscovery = {
      machines: new Map(),
      messageBrokers: Array.from(this.messageBrokers.keys()),
      configurations: new Map(),
      capabilities: new Map()
    };

    this.machines.forEach((machine, machineId) => {
      discovery.machines.set(machineId, machine);
      
      const config = this.configs.get(machineId);
      if (config) {
        discovery.configurations.set(machineId, config);
        
        // Analyze machine capabilities
        const capabilities = this.analyzeMachineCapabilities(machine, config);
        discovery.capabilities.set(machineId, capabilities);
      }
    });

    return discovery;
  }

  private analyzeMachineCapabilities(machine: ViewStateMachine<any>, config: RobotCopyConfig): MachineCapabilities {
    return {
      supportedBrokers: config.messageBrokers.map(b => b.type),
      autoDiscovery: config.autoDiscovery || false,
      clientSpecification: config.clientSpecification,
      messageTypes: ['state-change', 'event-send', 'log-entry', 'view-update'],
      graphQLStates: this.extractGraphQLStates(machine)
    };
  }

  private extractGraphQLStates(machine: ViewStateMachine<any>): GraphQLState[] {
    // This would analyze the machine for GraphQL states
    // For now, return a basic structure
    return [
      {
        name: 'query',
        operation: 'query',
        query: 'query GetBurger($id: ID!) { burger(id: $id) { id ingredients } }',
        variables: { id: 'string' }
      },
      {
        name: 'mutation',
        operation: 'mutation',
        query: 'mutation CreateBurger($input: BurgerInput!) { createBurger(input: $input) { id } }',
        variables: { input: 'BurgerInput' }
      }
    ];
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleResponse(response: RobotCopyResponse): void {
    const handler = this.responseHandlers.get(response.messageId);
    if (handler) {
      handler(response);
      this.responseHandlers.delete(response.messageId);
    }
  }

  // Set up response handler for async operations
  onResponse(messageId: string, handler: (response: RobotCopyResponse) => void): void {
    this.responseHandlers.set(messageId, handler);
  }

  // Get message queue
  getMessageQueue(): RobotCopyMessage[] {
    return [...this.messageQueue];
  }

  // Clear message queue
  clearMessageQueue(): void {
    this.messageQueue = [];
  }
}

// Message broker interface
export interface MessageBroker {
  configure(config: any): void;
  send(message: RobotCopyMessage): Promise<RobotCopyResponse>;
}

// Window Intercom Broker
export class WindowIntercomBroker implements MessageBroker {
  private config: WindowIntercomConfig | null = null;

  configure(config: WindowIntercomConfig): void {
    this.config = config;
  }

  async send(message: RobotCopyMessage): Promise<RobotCopyResponse> {
    if (!this.config) {
      throw new Error('WindowIntercomBroker not configured');
    }

    return new Promise((resolve, reject) => {
      try {
        window.postMessage(message.payload, this.config!.targetOrigin);
        
        // Set up response handler
        const responseHandler = (event: MessageEvent) => {
          if (event.data && event.data.messageId === message.id) {
            window.removeEventListener('message', responseHandler);
            resolve({
              success: true,
              data: event.data,
              timestamp: new Date(),
              messageId: message.id
            });
          }
        };

        window.addEventListener('message', responseHandler);

        // Timeout
        setTimeout(() => {
          window.removeEventListener('message', responseHandler);
          reject(new Error('Window message timeout'));
        }, this.config!.timeout || 5000);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Chrome Message Broker
export class ChromeMessageBroker implements MessageBroker {
  private config: ChromeMessageConfig | null = null;

  configure(config: ChromeMessageConfig): void {
    this.config = config;
  }

  async send(message: RobotCopyMessage): Promise<RobotCopyResponse> {
    if (!this.config) {
      throw new Error('ChromeMessageBroker not configured');
    }

    return new Promise((resolve, reject) => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage(
            this.config!.extensionId,
            message.payload,
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else {
                resolve({
                  success: true,
                  data: response,
                  timestamp: new Date(),
                  messageId: message.id
                });
              }
            }
          );
        } else {
          reject(new Error('Chrome runtime not available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

// HTTP API Broker
export class HttpApiBroker implements MessageBroker {
  private config: HttpApiConfig | null = null;

  configure(config: HttpApiConfig): void {
    this.config = config;
  }

  async send(message: RobotCopyMessage): Promise<RobotCopyResponse> {
    if (!this.config) {
      throw new Error('HttpApiBroker not configured');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}${message.target}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers
        },
        body: JSON.stringify(message.payload),
        signal: AbortSignal.timeout(this.config.timeout || 10000)
      });

      const data = await response.json();

      return {
        success: response.ok,
        data: data,
        error: response.ok ? undefined : data.error || 'HTTP request failed',
        timestamp: new Date(),
        messageId: message.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HTTP request failed',
        timestamp: new Date(),
        messageId: message.id
      };
    }
  }
}

// GraphQL Broker
export class GraphQLBroker implements MessageBroker {
  private config: GraphQLConfig | null = null;

  configure(config: GraphQLConfig): void {
    this.config = config;
  }

  async send(message: RobotCopyMessage): Promise<RobotCopyResponse> {
    if (!this.config) {
      throw new Error('GraphQLBroker not configured');
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers
        },
        body: JSON.stringify({
          query: message.payload.query,
          variables: message.payload.variables
        }),
        signal: AbortSignal.timeout(this.config.timeout || 10000)
      });

      const data = await response.json();

      return {
        success: !data.errors,
        data: data.data,
        error: data.errors ? data.errors[0].message : undefined,
        timestamp: new Date(),
        messageId: message.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'GraphQL request failed',
        timestamp: new Date(),
        messageId: message.id
      };
    }
  }
}

// Discovery interfaces
export interface RobotCopyDiscovery {
  machines: Map<string, ViewStateMachine<any>>;
  messageBrokers: string[];
  configurations: Map<string, RobotCopyConfig>;
  capabilities: Map<string, MachineCapabilities>;
}

export interface MachineCapabilities {
  supportedBrokers: string[];
  autoDiscovery: boolean;
  clientSpecification?: ClientSpecification;
  messageTypes: string[];
  graphQLStates: GraphQLState[];
}

export interface GraphQLState {
  name: string;
  operation: 'query' | 'mutation' | 'subscription';
  query: string;
  variables?: Record<string, string>;
}

// Helper function to create RobotCopy
export function createRobotCopy(): RobotCopy {
  return new RobotCopy();
} 