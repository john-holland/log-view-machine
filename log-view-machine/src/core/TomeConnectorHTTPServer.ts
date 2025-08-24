import { TomeConnectorProxy, APIRequest, APIResponse } from './TomeConnectorProxy';
import { RobotCopy } from './RobotCopy';

export interface HTTPServerConfig {
  port?: number;
  host?: string;
  enableCORS?: boolean;
  enableRateLimiting?: boolean;
  enableLogging?: boolean;
  robotCopy?: RobotCopy;
}

export class TomeConnectorHTTPServer {
  private proxy: TomeConnectorProxy;
  private config: HTTPServerConfig;
  private server: any; // Express-like server
  private isRunning: boolean = false;

  constructor(config: HTTPServerConfig = {}) {
    this.config = {
      port: 3000,
      host: 'localhost',
      enableCORS: true,
      enableRateLimiting: true,
      enableLogging: true,
      ...config
    };

    // Create the proxy with RobotCopy
    this.proxy = new TomeConnectorProxy({
      robotCopy: this.config.robotCopy,
      enableHealthChecks: true,
      enableMetrics: true
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Server is already running');
      return;
    }

    try {
      // In a real implementation, you'd use Express or similar
      // For now, we'll create a simple HTTP server
      await this.createHTTPServer();
      
      this.isRunning = true;
      console.log(`TomeConnector HTTP Server running on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error('Failed to start HTTP server:', error);
      throw error;
    }
  }

  private async createHTTPServer(): Promise<void> {
    // This is a simplified example - in practice you'd use Express
    // and set up proper middleware, error handling, etc.
    
    // For demonstration, we'll just log that the server would be created
    console.log(`Would create HTTP server on ${this.config.host}:${this.config.port}`);
    console.log('In a real implementation, this would set up Express routes');
    
    // Example of how the routes would be set up:
    this.setupHTTPRoutes();
  }

  private setupHTTPRoutes(): void {
    // This shows how the HTTP routes would map to the proxy API
    console.log('Setting up HTTP routes that map to TomeConnectorProxy:');
    console.log('  POST /api/connections -> proxy.handleCreateConnection');
    console.log('  GET  /api/connections -> proxy.handleGetConnections');
    console.log('  GET  /api/connections/:id -> proxy.handleGetConnection');
    console.log('  DELETE /api/connections/:id -> proxy.handleDeleteConnection');
    console.log('  GET  /api/topology -> proxy.handleGetTopology');
    console.log('  POST /api/networks/ring -> proxy.handleCreateRingNetwork');
    console.log('  POST /api/networks/hub -> proxy.handleCreateHubNetwork');
    console.log('  GET  /api/health -> proxy.handleHealthCheck');
    console.log('  GET  /api/metrics -> proxy.handleGetMetrics');
    console.log('  POST /api/broadcast -> proxy.handleBroadcastEvent');
    console.log('  POST /api/validate -> proxy.handleValidateNetwork');
  }

  // Method to handle HTTP requests (would be called by Express middleware)
  async handleHTTPRequest(method: string, path: string, body?: any, query?: any, headers?: any): Promise<APIResponse> {
    const request: APIRequest = {
      method: method as any,
      path,
      body,
      query,
      headers,
      // Extract trace context from headers if available
      traceId: headers?.['x-trace-id'],
      spanId: headers?.['x-span-id']
    };

    return this.proxy.handleAPIRequest(request);
  }

  // Convenience methods for common operations
  async createConnection(sourceTome: any, targetTome: any, config?: any): Promise<string> {
    const response = await this.proxy.handleAPIRequest({
      method: 'POST',
      path: '/connections',
      body: { sourceTome, targetTome, config }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create connection');
    }

    return response.data.connectionId;
  }

  async getConnections(): Promise<any[]> {
    const response = await this.proxy.handleAPIRequest({
      method: 'GET',
      path: '/connections'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get connections');
    }

    return response.data.connections;
  }

  async getTopology(): Promise<any> {
    const response = await this.proxy.handleAPIRequest({
      method: 'GET',
      path: '/topology'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get topology');
    }

    return response.data.topology;
  }

  async createRingNetwork(tomes: any[], config?: any): Promise<string[]> {
    const response = await this.proxy.handleAPIRequest({
      method: 'POST',
      path: '/networks/ring',
      body: { tomes, config }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create ring network');
    }

    return response.data.connectionIds;
  }

  async createHubNetwork(hubTome: any, spokeTomes: any[], config?: any): Promise<string[]> {
    const response = await this.proxy.handleAPIRequest({
      method: 'POST',
      path: '/networks/hub',
      body: { hubTome, spokeTomes, config }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to create hub network');
    }

    return response.data.connectionIds;
  }

  async broadcastEvent(event: any, sourceTome: any): Promise<void> {
    const response = await this.proxy.handleAPIRequest({
      method: 'POST',
      path: '/broadcast',
      body: { event, sourceTome }
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to broadcast event');
    }
  }

  async validateNetwork(): Promise<any> {
    const response = await this.proxy.handleAPIRequest({
      method: 'POST',
      path: '/validate'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to validate network');
    }

    return response.data.validation;
  }

  async getHealth(): Promise<any> {
    const response = await this.proxy.handleAPIRequest({
      method: 'GET',
      path: '/health'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get health status');
    }

    return response.data.health;
  }

  async getMetrics(): Promise<any> {
    const response = await this.proxy.handleAPIRequest({
      method: 'GET',
      path: '/metrics'
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to get metrics');
    }

    return response.data.metrics;
  }

  // Access to underlying components
  getProxy(): TomeConnectorProxy {
    return this.proxy;
  }

  getTomeConnector(): any {
    return this.proxy.getTomeConnector();
  }

  getRobotCopy(): RobotCopy {
    return this.proxy.getRobotCopy();
  }

  // Server control
  isServerRunning(): boolean {
    return this.isRunning;
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Server is not running');
      return;
    }

    try {
      // In a real implementation, you'd close the HTTP server
      console.log('Stopping HTTP server...');
      
      this.isRunning = false;
      this.proxy.destroy();
      
      console.log('HTTP server stopped');
    } catch (error) {
      console.error('Error stopping server:', error);
      throw error;
    }
  }
}

// Factory function
export function createTomeConnectorHTTPServer(config?: HTTPServerConfig): TomeConnectorHTTPServer {
  return new TomeConnectorHTTPServer(config);
}
