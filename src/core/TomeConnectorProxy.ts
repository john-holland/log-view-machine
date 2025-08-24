import { TomeConnector, TomeConnectionConfig } from './TomeConnector';
import { RobotCopy, createRobotCopy } from './RobotCopy';
import { ViewStateMachine } from './ViewStateMachine';

export interface TomeConnectorProxyConfig {
  robotCopy?: RobotCopy;
  apiPort?: number;
  enableHealthChecks?: boolean;
  enableMetrics?: boolean;
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
  rateLimiting?: {
    windowMs: number;
    maxRequests: number;
  };
}

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: any;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  traceId?: string;
  spanId?: string;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  traceId: string;
  spanId: string;
  timestamp: string;
  duration: number;
}

export class TomeConnectorProxy {
  private tomeConnector: TomeConnector;
  private robotCopy: RobotCopy;
  private config: TomeConnectorProxyConfig;
  private apiRoutes: Map<string, (req: APIRequest) => Promise<APIResponse>> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;
  private metrics: Map<string, any> = new Map();

  constructor(config: TomeConnectorProxyConfig = {}) {
    this.config = {
      apiPort: 3000,
      enableHealthChecks: true,
      enableMetrics: true,
      cors: {
        origin: '*',
        credentials: false
      },
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100
      },
      ...config
    };

    // Create or use provided RobotCopy instance
    this.robotCopy = config.robotCopy || createRobotCopy();
    
    // Create TomeConnector with RobotCopy
    this.tomeConnector = new TomeConnector(this.robotCopy);
    
    // Initialize the proxy
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Register the proxy with RobotCopy
      this.robotCopy.registerMachine('tome-connector-proxy', this, {
        type: 'proxy',
        capabilities: ['api-routing', 'connection-management', 'metrics-collection'],
        version: '1.0.0'
      });

      // Set up API routes
      this.setupAPIRoutes();

      // Start health monitoring if enabled
      if (this.config.enableHealthChecks) {
        this.startHealthMonitoring();
      }

      console.log('TomeConnectorProxy initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TomeConnectorProxy:', error);
    }
  }

  private setupAPIRoutes(): void {
    // Connection management routes
    this.apiRoutes.set('POST /connections', this.handleCreateConnection.bind(this));
    this.apiRoutes.set('GET /connections', this.handleGetConnections.bind(this));
    this.apiRoutes.set('GET /connections/:id', this.handleGetConnection.bind(this));
    this.apiRoutes.set('DELETE /connections/:id', this.handleDeleteConnection.bind(this));
    
    // Network topology routes
    this.apiRoutes.set('GET /topology', this.handleGetTopology.bind(this));
    this.apiRoutes.set('POST /networks/ring', this.handleCreateRingNetwork.bind(this));
    this.apiRoutes.set('POST /networks/hub', this.handleCreateHubNetwork.bind(this));
    
    // Health and metrics routes
    this.apiRoutes.set('GET /health', this.handleHealthCheck.bind(this));
    this.apiRoutes.set('GET /metrics', this.handleGetMetrics.bind(this));
    
    // Event broadcasting routes
    this.apiRoutes.set('POST /broadcast', this.handleBroadcastEvent.bind(this));
    
    // Validation routes
    this.apiRoutes.set('POST /validate', this.handleValidateNetwork.bind(this));
  }

  // API Route Handlers
  private async handleCreateConnection(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const { sourceTome, targetTome, config } = req.body;
      
      if (!sourceTome || !targetTome) {
        throw new Error('sourceTome and targetTome are required');
      }

      const connectionId = await this.tomeConnector.connect(sourceTome, targetTome, config);
      
      // Track the API call
      this.robotCopy.trackMessage(`api_${Date.now()}`, traceId, spanId, {
        action: 'connection_created_via_api',
        data: { connectionId, sourceTome, targetTome, config }
      });

      return {
        success: true,
        data: { connectionId },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleGetConnections(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const connections = this.tomeConnector.getConnections();
      
      return {
        success: true,
        data: { connections },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleGetConnection(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const connectionId = req.path.split('/').pop();
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const connections = this.tomeConnector.getConnections();
      const connection = connections.find(c => c.id === connectionId);
      
      if (!connection) {
        throw new Error('Connection not found');
      }

      return {
        success: true,
        data: { connection },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleDeleteConnection(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const connectionId = req.path.split('/').pop();
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const success = await this.tomeConnector.disconnect(connectionId);
      
      if (!success) {
        throw new Error('Failed to disconnect connection');
      }

      return {
        success: true,
        data: { message: 'Connection disconnected successfully' },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleGetTopology(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const topology = this.tomeConnector.getNetworkTopology();
      
      return {
        success: true,
        data: { topology },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleCreateRingNetwork(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const { tomes, config } = req.body;
      
      if (!Array.isArray(tomes) || tomes.length < 2) {
        throw new Error('At least 2 tomes are required for ring network');
      }

      const connectionIds = await this.tomeConnector.createNetwork(tomes, config);
      
      return {
        success: true,
        data: { connectionIds, networkType: 'ring' },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleCreateHubNetwork(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const { hubTome, spokeTomes, config } = req.body;
      
      if (!hubTome || !Array.isArray(spokeTomes) || spokeTomes.length === 0) {
        throw new Error('hubTome and spokeTomes array are required');
      }

      const connectionIds = await this.tomeConnector.createHubNetwork(hubTome, spokeTomes, config);
      
      return {
        success: true,
        data: { connectionIds, networkType: 'hub-and-spoke' },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleHealthCheck(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const connections = this.tomeConnector.getConnections();
      const healthyConnections = connections.filter(c => c.healthStatus === 'healthy').length;
      const totalConnections = connections.length;
      
      const healthStatus = {
        status: totalConnections === 0 ? 'no-connections' : 
                healthyConnections === totalConnections ? 'healthy' : 'degraded',
        connections: {
          total: totalConnections,
          healthy: healthyConnections,
          degraded: connections.filter(c => c.healthStatus === 'degraded').length,
          unhealthy: connections.filter(c => c.healthStatus === 'unhealthy').length
        },
        timestamp: new Date().toISOString()
      };

      return {
        success: true,
        data: { health: healthStatus },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleGetMetrics(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const metrics = {
        connections: this.tomeConnector.getConnections().length,
        topology: this.tomeConnector.getNetworkTopology(),
        robotCopy: {
          messageCount: this.robotCopy.getMessageHistory().length,
          traceCount: this.robotCopy.getTraceIds().length
        },
        proxy: {
          apiCallCount: this.metrics.get('apiCalls') || 0,
          lastHealthCheck: this.metrics.get('lastHealthCheck') || null
        }
      };

      return {
        success: true,
        data: { metrics },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleBroadcastEvent(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const { event, sourceTome } = req.body;
      
      if (!event || !sourceTome) {
        throw new Error('event and sourceTome are required');
      }

      await this.tomeConnector.broadcastEvent(event, sourceTome);
      
      return {
        success: true,
        data: { message: 'Event broadcasted successfully' },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  private async handleValidateNetwork(req: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    const traceId = req.traceId || this.robotCopy.generateTraceId();
    const spanId = req.spanId || this.robotCopy.generateSpanId();

    try {
      const validation = await this.tomeConnector.validateNetwork();
      
      return {
        success: true,
        data: { validation },
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId,
        spanId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };
    }
  }

  // Main API handler
  async handleAPIRequest(request: APIRequest): Promise<APIResponse> {
    const routeKey = `${request.method} ${request.path}`;
    const handler = this.apiRoutes.get(routeKey);
    
    if (!handler) {
      return {
        success: false,
        error: `Route not found: ${routeKey}`,
        traceId: request.traceId || this.robotCopy.generateTraceId(),
        spanId: request.spanId || this.robotCopy.generateSpanId(),
        timestamp: new Date().toISOString(),
        duration: 0
      };
    }

    // Track API call metrics
    const currentCalls = this.metrics.get('apiCalls') || 0;
    this.metrics.set('apiCalls', currentCalls + 1);

    try {
      return await handler(request);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        traceId: request.traceId || this.robotCopy.generateTraceId(),
        spanId: request.spanId || this.robotCopy.generateSpanId(),
        timestamp: new Date().toISOString(),
        duration: 0
      };
    }
  }

  // Health monitoring
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthResponse = await this.handleHealthCheck({
          method: 'GET',
          path: '/health'
        });
        
        this.metrics.set('lastHealthCheck', {
          timestamp: new Date().toISOString(),
          status: healthResponse.data?.health?.status
        });

        // Send health status to RobotCopy
        await this.robotCopy.sendMessage('proxy-health-check', healthResponse.data);
      } catch (error) {
        console.warn('Health check failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Public methods for direct access
  getTomeConnector(): TomeConnector {
    return this.tomeConnector;
  }

  getRobotCopy(): RobotCopy {
    return this.robotCopy;
  }

  getMetrics(): Map<string, any> {
    return this.metrics;
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.tomeConnector.destroy();
    console.log('TomeConnectorProxy destroyed');
  }
}

// Factory function
export function createTomeConnectorProxy(config?: TomeConnectorProxyConfig): TomeConnectorProxy {
  return new TomeConnectorProxy(config);
}
