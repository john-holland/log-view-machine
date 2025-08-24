import { ViewStateMachine } from './ViewStateMachine';
import { RobotCopy } from './RobotCopy';

export interface TomeConnection {
  id: string;
  sourceTome: ViewStateMachine<any>;
  targetTome: ViewStateMachine<any>;
  eventMapping: Map<string, string>; // source event -> target event
  stateMapping: Map<string, string>; // source state path -> target state path
  bidirectional: boolean;
  filters?: {
    events?: string[];
    states?: string[];
  };
  transformers?: {
    eventTransformer?: (event: any, direction: 'forward' | 'backward') => any;
    stateTransformer?: (state: any, direction: 'forward' | 'backward') => any;
  };
  // Add RobotCopy integration fields
  traceId?: string;
  spanId?: string;
  createdAt: string;
  lastActivity: string;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
}

export interface TomeConnectionConfig {
  eventMapping?: Record<string, string>;
  stateMapping?: Record<string, string>;
  bidirectional?: boolean;
  filters?: {
    events?: string[];
    states?: string[];
  };
  transformers?: {
    eventTransformer?: (event: any, direction: 'forward' | 'backward') => any;
    stateTransformer?: (state: any, direction: 'forward' | 'backward') => any;
  };
  // Add RobotCopy-specific config
  enableTracing?: boolean;
  enableHealthMonitoring?: boolean;
  customTraceId?: string;
}

export class TomeConnector {
  private connections: Map<string, TomeConnection> = new Map();
  private robotCopy?: RobotCopy;
  private connectionMetrics: Map<string, any> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private isInitialized: boolean = false;

  constructor(robotCopy?: RobotCopy) {
    this.robotCopy = robotCopy;
    if (robotCopy) {
      this.initializeRobotCopyIntegration();
    }
  }

  private async initializeRobotCopyIntegration(): Promise<void> {
    if (!this.robotCopy || this.isInitialized) return;
    
    try {
      // Register TomeConnector with RobotCopy for monitoring
      this.robotCopy.registerMachine('tome-connector', this, {
        type: 'connector',
        capabilities: ['event-routing', 'state-sync', 'network-topology'],
        version: '1.0.0'
      });
      
      // Set up periodic health checks if enabled
      const enableHealthMonitoring = await this.robotCopy.isEnabled('enable-health-monitoring');
      if (enableHealthMonitoring) {
        this.startHealthMonitoring();
      }
      
      this.isInitialized = true;
      console.log('TomeConnector RobotCopy integration initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize RobotCopy integration:', error);
    }
  }

  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.robotCopy) return;
    
    try {
      const connections = this.getConnections();
      const healthStatus = {
        totalConnections: connections.length,
        activeConnections: connections.filter(conn => 
          conn.sourceTome.getState() && conn.targetTome.getState()
        ).length,
        degradedConnections: connections.filter(conn => 
          conn.healthStatus === 'degraded'
        ).length,
        unhealthyConnections: connections.filter(conn => 
          conn.healthStatus === 'unhealthy'
        ).length,
        timestamp: new Date().toISOString(),
        connectorId: this.robotCopy.generateMessageId()
      };
      
      // Send health status through RobotCopy
      await this.robotCopy.sendMessage('health-check', healthStatus);
      
      // Update connection health statuses
      connections.forEach(connection => {
        this.updateConnectionHealth(connection.id);
      });
      
    } catch (error) {
      console.warn('Health check failed:', error);
    }
  }

  private updateConnectionHealth(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    
    try {
      const sourceState = connection.sourceTome.getState();
      const targetState = connection.targetTome.getState();
      
      if (!sourceState || !targetState) {
        connection.healthStatus = 'unhealthy';
      } else if (Date.now() - new Date(connection.lastActivity).getTime() > 60000) {
        connection.healthStatus = 'degraded';
      } else {
        connection.healthStatus = 'healthy';
      }
      
      connection.lastActivity = new Date().toISOString();
    } catch (error) {
      connection.healthStatus = 'unhealthy';
      connection.lastActivity = new Date().toISOString();
    }
  }

  // Connect two Tomes with bidirectional state and event flow
  async connect(
    sourceTome: ViewStateMachine<any>,
    targetTome: ViewStateMachine<any>,
    config: TomeConnectionConfig = {}
  ): Promise<string> {
    const connectionId = `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate tracing context if RobotCopy is available
    let traceId: string | undefined;
    let spanId: string | undefined;
    
    if (this.robotCopy && config.enableTracing !== false) {
      traceId = config.customTraceId || this.robotCopy.generateTraceId();
      spanId = this.robotCopy.generateSpanId();
      
      // Track connection creation
      this.robotCopy.trackMessage(connectionId, traceId, spanId, {
        action: 'connection_created',
        data: {
          source: sourceTome.constructor.name,
          target: targetTome.constructor.name,
          config,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    const connection: TomeConnection = {
      id: connectionId,
      sourceTome,
      targetTome,
      eventMapping: new Map(Object.entries(config.eventMapping || {})),
      stateMapping: new Map(Object.entries(config.stateMapping || {})),
      bidirectional: config.bidirectional ?? true,
      filters: config.filters,
      transformers: config.transformers,
      traceId,
      spanId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      healthStatus: 'healthy'
    };

    this.connections.set(connectionId, connection);
    await this.setupConnection(connection);

    console.log(`Connected Tomes: ${sourceTome.constructor.name} <-> ${targetTome.constructor.name}`);
    return connectionId;
  }

  private async setupConnection(connection: TomeConnection): Promise<void> {
    const { sourceTome, targetTome, eventMapping, stateMapping, bidirectional, filters, transformers } = connection;

    // Forward events from source to target
    await this.setupEventForwarding(sourceTome, targetTome, eventMapping, 'forward', filters, transformers, connection);
    
    // Forward events from target to source (if bidirectional)
    if (bidirectional) {
      await this.setupEventForwarding(targetTome, sourceTome, this.reverseMap(eventMapping), 'backward', filters, transformers, connection);
    }

    // Forward state changes
    await this.setupStateForwarding(sourceTome, targetTome, stateMapping, 'forward', filters, transformers, connection);
    
    if (bidirectional) {
      await this.setupStateForwarding(targetTome, sourceTome, this.reverseMap(stateMapping), 'backward', filters, transformers, connection);
    }
  }

  private async setupEventForwarding(
    sourceTome: ViewStateMachine<any>,
    targetTome: ViewStateMachine<any>,
    eventMapping: Map<string, string>,
    direction: 'forward' | 'backward',
    filters?: { events?: string[] },
    transformers?: { eventTransformer?: (event: any, direction: 'forward' | 'backward') => any },
    connection?: TomeConnection
  ): Promise<void> {
    // Subscribe to source Tome's events
    sourceTome.on('event', async (event: any) => {
      // Check if event should be filtered
      if (filters?.events && !filters.events.includes(event.type)) {
        return;
      }

      // Check RobotCopy feature toggles for intelligent routing
      if (this.robotCopy) {
        try {
          const enableEventRouting = await this.robotCopy.isEnabled('enable-event-routing');
          if (!enableEventRouting) {
            console.log('Event routing disabled by feature toggle');
            return;
          }
        } catch (error) {
          console.warn('Failed to check event routing toggle:', error);
        }
      }

      // Transform event if transformer is provided
      let transformedEvent = event;
      if (transformers?.eventTransformer) {
        transformedEvent = transformers.eventTransformer(event, direction);
      }

      // Add RobotCopy tracing context if available
      if (this.robotCopy && connection) {
        const eventTraceId = this.robotCopy.generateTraceId();
        const eventSpanId = this.robotCopy.generateSpanId();
        
        transformedEvent = {
          ...transformedEvent,
          _traceId: eventTraceId,
          _spanId: eventSpanId,
          _connectionId: connection.id,
          _direction: direction,
          _timestamp: new Date().toISOString()
        };
        
        // Track the event
        this.robotCopy.trackMessage(
          `event_${event.type}_${Date.now()}`,
          eventTraceId,
          eventSpanId,
          {
            action: 'event_forwarded',
            data: {
              eventType: event.type,
              source: sourceTome.constructor.name,
              target: targetTome.constructor.name,
              direction,
              connectionId: connection.id
            }
          }
        );
      }

      // Map event type if mapping exists
      const mappedEventType = eventMapping.get(transformedEvent.type) || transformedEvent.type;
      
      // Forward to target Tome
      targetTome.send({
        type: mappedEventType,
        ...transformedEvent,
        _forwarded: true,
        _direction: direction,
        _source: sourceTome.constructor.name,
      });

      // Update connection activity
      if (connection) {
        connection.lastActivity = new Date().toISOString();
      }
    });
  }

  private async setupStateForwarding(
    sourceTome: ViewStateMachine<any>,
    targetTome: ViewStateMachine<any>,
    stateMapping: Map<string, string>,
    direction: 'forward' | 'backward',
    filters?: { states?: string[] },
    transformers?: { stateTransformer?: (state: any, direction: 'forward' | 'backward') => any },
    connection?: TomeConnection
  ): Promise<void> {
    // Subscribe to source Tome's state changes
    sourceTome.on('stateChange', async (event: any) => {
      const newState = event.newState || event.state;
      const oldState = event.oldState || event.previousState;
      
      // Check if state should be filtered
      if (filters?.states) {
        const hasRelevantState = filters.states.some(statePath => 
          this.getStateValue(newState, statePath) !== this.getStateValue(oldState, statePath)
        );
        if (!hasRelevantState) {
          return;
        }
      }

      // Check RobotCopy feature toggles for state synchronization
      if (this.robotCopy) {
        try {
          const enableStateSync = await this.robotCopy.isEnabled('enable-state-sync');
          if (!enableStateSync) {
            console.log('State synchronization disabled by feature toggle');
            return;
          }
        } catch (error) {
          console.warn('Failed to check state sync toggle:', error);
        }
      }

      // Transform state if transformer is provided
      let transformedState = newState;
      if (transformers?.stateTransformer) {
        transformedState = transformers.stateTransformer(newState, direction);
      }

      // Add RobotCopy backend-aware state transformation
      if (this.robotCopy) {
        try {
          const backendType = await this.robotCopy.getBackendType();
          transformedState = await this.transformStateForBackend(transformedState, backendType);
        } catch (error) {
          console.warn('Failed to transform state for backend:', error);
        }
      }

      // Map state paths and update target Tome's context
      const stateUpdates: Record<string, any> = {};
      stateMapping.forEach((targetPath, sourcePath) => {
        const sourceValue = this.getStateValue(transformedState, sourcePath);
        if (sourceValue !== undefined) {
          stateUpdates[targetPath] = sourceValue;
        }
      });

      // Update target Tome's context
      if (Object.keys(stateUpdates).length > 0) {
        const syncEvent = {
          type: 'SYNC_STATE',
          updates: stateUpdates,
          _forwarded: true,
          _direction: direction,
          _source: sourceTome.constructor.name,
        };

        // Add RobotCopy tracing if available
        if (this.robotCopy && connection) {
          const stateTraceId = this.robotCopy.generateTraceId();
          const stateSpanId = this.robotCopy.generateSpanId();
          
          Object.assign(syncEvent, {
            _traceId: stateTraceId,
            _spanId: stateSpanId,
            _connectionId: connection.id,
            _timestamp: new Date().toISOString()
          });
          
          // Track the state sync
          this.robotCopy.trackMessage(
            `state_sync_${Date.now()}`,
            stateTraceId,
            stateSpanId,
            {
              action: 'state_synchronized',
              data: {
                updates: Object.keys(stateUpdates),
                source: sourceTome.constructor.name,
                target: targetTome.constructor.name,
                direction,
                connectionId: connection.id
              }
            }
          );
        }

        targetTome.send(syncEvent);
      }

      // Update connection activity
      if (connection) {
        connection.lastActivity = new Date().toISOString();
      }
    });
  }

  private async transformStateForBackend(state: any, backendType: 'kotlin' | 'node'): Promise<any> {
    // Transform state based on backend capabilities
    switch (backendType) {
      case 'kotlin':
        // Kotlin backend might prefer different data structures
        return this.transformStateForKotlin(state);
      case 'node':
        // Node backend might prefer different data structures
        return this.transformStateForNode(state);
      default:
        return state;
    }
  }

  private transformStateForKotlin(state: any): any {
    // Transform state for Kotlin backend preferences
    // This could include type conversions, null handling, etc.
    return state;
  }

  private transformStateForNode(state: any): any {
    // Transform state for Node backend preferences
    // This could include different serialization, etc.
    return state;
  }

  private getStateValue(state: any, path: string): any {
    return path.split('.').reduce((obj, key) => obj?.[key], state);
  }

  private reverseMap<K, V>(map: Map<K, V>): Map<V, K> {
    const reversed = new Map<V, K>();
    map.forEach((value, key) => {
      reversed.set(value, key);
    });
    return reversed;
  }

  // Disconnect Tomes
  async disconnect(connectionId: string): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return false;
    }

    // Track disconnection with RobotCopy if available
    if (this.robotCopy) {
      try {
        const traceId = this.robotCopy.generateTraceId();
        const spanId = this.robotCopy.generateSpanId();
        
        this.robotCopy.trackMessage(
          `disconnect_${connectionId}`,
          traceId,
          spanId,
          {
            action: 'connection_disconnected',
            data: {
              connectionId,
              source: connection.sourceTome.constructor.name,
              target: connection.targetTome.constructor.name,
              duration: Date.now() - new Date(connection.createdAt).getTime(),
              timestamp: new Date().toISOString()
            }
          }
        );
      } catch (error) {
        console.warn('Failed to track disconnection:', error);
      }
    }

    // Clean up event listeners
    // Note: In a real implementation, you'd need to store and remove specific listeners
    this.connections.delete(connectionId);
    console.log(`Disconnected Tomes: ${connection.sourceTome.constructor.name} <-> ${connection.targetTome.constructor.name}`);
    return true;
  }

  // Get all connections
  getConnections(): TomeConnection[] {
    return Array.from(this.connections.values());
  }

  // Get connections for a specific Tome
  getConnectionsForTome(tome: ViewStateMachine<any>): TomeConnection[] {
    return this.getConnections().filter(conn => 
      conn.sourceTome === tome || conn.targetTome === tome
    );
  }

  // Create a network of connected Tomes
  async createNetwork(tomes: ViewStateMachine<any>[], config: TomeConnectionConfig = {}): Promise<string[]> {
    const connectionIds: string[] = [];
    
    for (let i = 0; i < tomes.length - 1; i++) {
      const connectionId = await this.connect(tomes[i], tomes[i + 1], config);
      connectionIds.push(connectionId);
    }

    // Connect last Tome back to first (ring topology)
    if (tomes.length > 2) {
      const ringConnectionId = await this.connect(tomes[tomes.length - 1], tomes[0], config);
      connectionIds.push(ringConnectionId);
    }

    return connectionIds;
  }

  // Create a hub-and-spoke network
  async createHubNetwork(
    hubTome: ViewStateMachine<any>,
    spokeTomes: ViewStateMachine<any>[],
    config: TomeConnectionConfig = {}
  ): Promise<string[]> {
    const connectionIds: string[] = [];
    
    for (const spokeTome of spokeTomes) {
      const connectionId = await this.connect(hubTome, spokeTome, config);
      connectionIds.push(connectionId);
    }

    return connectionIds;
  }

  // Broadcast event to all connected Tomes
  async broadcastEvent(event: any, sourceTome: ViewStateMachine<any>): Promise<void> {
    const connections = this.getConnectionsForTome(sourceTome);
    
    // Add RobotCopy tracing if available
    if (this.robotCopy) {
      const traceId = this.robotCopy.generateTraceId();
      const spanId = this.robotCopy.generateSpanId();
      
      event = {
        ...event,
        _traceId: traceId,
        _spanId: spanId,
        _broadcasted: true,
        _timestamp: new Date().toISOString()
      };
      
      // Track the broadcast
      this.robotCopy.trackMessage(
        `broadcast_${event.type}_${Date.now()}`,
        traceId,
        spanId,
        {
          action: 'event_broadcasted',
          data: {
            eventType: event.type,
            source: sourceTome.constructor.name,
            targetCount: connections.length,
            timestamp: new Date().toISOString()
          }
        }
      );
    }
    
    connections.forEach(connection => {
      const targetTome = connection.targetTome === sourceTome ? connection.sourceTome : connection.targetTome;
      targetTome.send({
        ...event,
        _source: sourceTome.constructor.name,
      });
      
      // Update connection activity
      connection.lastActivity = new Date().toISOString();
    });
  }

  // Get network topology
  getNetworkTopology(): any {
    const topology: any = {
      nodes: new Set<string>(),
      edges: [],
    };

    this.getConnections().forEach(connection => {
      topology.nodes.add(connection.sourceTome.constructor.name);
      topology.nodes.add(connection.targetTome.constructor.name);
      
      topology.edges.push({
        from: connection.sourceTome.constructor.name,
        to: connection.targetTome.constructor.name,
        bidirectional: connection.bidirectional,
        id: connection.id,
        healthStatus: connection.healthStatus,
        createdAt: connection.createdAt,
        lastActivity: connection.lastActivity,
        traceId: connection.traceId
      });
    });

    return {
      nodes: Array.from(topology.nodes),
      edges: topology.edges,
      metrics: {
        totalConnections: this.connections.size,
        healthyConnections: this.getConnections().filter(c => c.healthStatus === 'healthy').length,
        degradedConnections: this.getConnections().filter(c => c.healthStatus === 'degraded').length,
        unhealthyConnections: this.getConnections().filter(c => c.healthStatus === 'unhealthy').length
      }
    };
  }

  // Validate network for potential issues (Turing completeness risks)
  async validateNetwork(): Promise<{ warnings: string[], errors: string[] }> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const topology = this.getNetworkTopology();

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string, parent?: string): boolean => {
      if (recursionStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);

      const edges = topology.edges.filter((edge: any) => 
        edge.from === node || (edge.bidirectional && edge.to === node)
      );

      for (const edge of edges) {
        const nextNode = edge.from === node ? edge.to : edge.from;
        if (nextNode !== parent && hasCycle(nextNode, node)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    // Check each node for cycles
    topology.nodes.forEach((node: any) => {
      if (hasCycle(node)) {
        errors.push(`Circular dependency detected involving node: ${node}`);
      }
    });

    // Check for high fan-out (potential performance issues)
    const fanOutCounts = new Map<string, number>();
    topology.edges.forEach((edge: any) => {
      fanOutCounts.set(edge.from, (fanOutCounts.get(edge.from) || 0) + 1);
      if (edge.bidirectional) {
        fanOutCounts.set(edge.to, (fanOutCounts.get(edge.to) || 0) + 1);
      }
    });

    fanOutCounts.forEach((count, node) => {
      if (count > 10) {
        warnings.push(`High fan-out detected for node ${node}: ${count} connections`);
      }
    });

    // Check for event amplification (potential infinite loops)
    const eventCounts = new Map<string, number>();
    this.getConnections().forEach(connection => {
      connection.eventMapping.forEach((targetEvent, sourceEvent) => {
        const key = `${sourceEvent}->${targetEvent}`;
        eventCounts.set(key, (eventCounts.get(key) || 0) + 1);
      });
    });

    eventCounts.forEach((count, eventPair) => {
      if (count > 5) {
        warnings.push(`Potential event amplification detected: ${eventPair} appears ${count} times`);
      }
    });

    // Check RobotCopy-specific validations if available
    if (this.robotCopy) {
      try {
        const enableAdvancedValidation = await this.robotCopy.isEnabled('enable-advanced-validation');
        if (enableAdvancedValidation) {
          // Add advanced validation logic here
          const advancedWarnings = await this.performAdvancedValidation();
          warnings.push(...advancedWarnings);
        }
      } catch (error) {
        console.warn('Failed to perform advanced validation:', error);
      }
    }

    return { warnings, errors };
  }

  private async performAdvancedValidation(): Promise<string[]> {
    const warnings: string[] = [];
    
    // Check for potential performance issues based on connection patterns
    const connections = this.getConnections();
    
    // Check for connections with high event frequency
    const highFrequencyConnections = connections.filter(conn => {
      const timeSinceCreation = Date.now() - new Date(conn.createdAt).getTime();
      const timeSinceLastActivity = Date.now() - new Date(conn.lastActivity).getTime();
      return timeSinceCreation > 60000 && timeSinceLastActivity < 1000; // High activity
    });
    
    if (highFrequencyConnections.length > 0) {
      warnings.push(`High frequency connections detected: ${highFrequencyConnections.length} connections showing high activity`);
    }
    
    return warnings;
  }

  // Get RobotCopy instance for external access
  getRobotCopy(): RobotCopy | undefined {
    return this.robotCopy;
  }

  // Get connection metrics
  getConnectionMetrics(): Map<string, any> {
    return this.connectionMetrics;
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Disconnect all connections
    this.getConnections().forEach(connection => {
      this.disconnect(connection.id);
    });
    
    console.log('TomeConnector destroyed');
  }
}

export function createTomeConnector(robotCopy?: RobotCopy): TomeConnector {
  return new TomeConnector(robotCopy);
} 