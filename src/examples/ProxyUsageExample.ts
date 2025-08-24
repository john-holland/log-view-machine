import { TomeConnectorProxy, createTomeConnectorProxy } from '../core/TomeConnectorProxy';
import { TomeConnectorHTTPServer, createTomeConnectorHTTPServer } from '../core/TomeConnectorHTTPServer';
import { RobotCopy, createRobotCopy } from '../core/RobotCopy';
import { ViewStateMachine, createViewStateMachine } from '../core/ViewStateMachine';

// Example of how to use the proxy pattern with RobotCopy
export class ProxyUsageExample {
  private proxy: TomeConnectorProxy;
  private httpServer: TomeConnectorHTTPServer;
  private robotCopy: RobotCopy;

  constructor() {
    // Create a RobotCopy instance for this proxy
    this.robotCopy = createRobotCopy({
      enableTracing: true,
      enableDataDog: true
    });

    // Create the proxy with RobotCopy
    this.proxy = createTomeConnectorProxy({
      robotCopy: this.robotCopy,
      enableHealthChecks: true,
      enableMetrics: true
    });

    // Create the HTTP server that uses the proxy
    this.httpServer = createTomeConnectorHTTPServer({
      robotCopy: this.robotCopy,
      port: 3000,
      enableCORS: true,
      enableLogging: true
    });
  }

  async demonstrateProxyUsage(): Promise<void> {
    console.log('🚀 Starting TomeConnector Proxy Demo...\n');

    try {
      // Start the HTTP server
      await this.httpServer.start();
      console.log('✅ HTTP Server started\n');

      // Create some mock ViewStateMachines
      const mockTomes = this.createMockTomes();
      console.log('✅ Created mock ViewStateMachines\n');

      // Demonstrate direct proxy usage
      await this.demonstrateDirectProxyUsage(mockTomes);
      console.log('✅ Direct proxy usage demonstrated\n');

      // Demonstrate HTTP API usage
      await this.demonstrateHTTPAPIUsage(mockTomes);
      console.log('✅ HTTP API usage demonstrated\n');

      // Demonstrate RobotCopy integration
      await this.demonstrateRobotCopyIntegration();
      console.log('✅ RobotCopy integration demonstrated\n');

      // Show metrics and health
      await this.showMetricsAndHealth();
      console.log('✅ Metrics and health displayed\n');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  private createMockTomes(): any[] {
    // Create mock ViewStateMachines for demonstration
    const createMockTome = (name: string) => ({
      constructor: { name },
      on: jest.fn(),
      send: jest.fn(),
      getState: jest.fn(() => ({ value: 'idle' })),
    });

    return [
      createMockTome('OrderService'),
      createMockTome('PaymentService'),
      createMockTome('InventoryService'),
      createMockTome('NotificationService')
    ];
  }

  private async demonstrateDirectProxyUsage(mockTomes: any[]): Promise<void> {
    console.log('📡 Demonstrating Direct Proxy Usage:');
    
    try {
      // Create connections using the proxy directly
      const connectionId1 = await this.proxy.handleAPIRequest({
        method: 'POST',
        path: '/connections',
        body: {
          sourceTome: mockTomes[0],
          targetTome: mockTomes[1],
          config: { bidirectional: true, enableTracing: true }
        }
      });

      console.log(`  ✅ Created connection: ${connectionId1.data.connectionId}`);

      // Create a ring network
      const ringNetwork = await this.proxy.handleAPIRequest({
        method: 'POST',
        path: '/networks/ring',
        body: { tomes: mockTomes.slice(0, 3) }
      });

      console.log(`  ✅ Created ring network with ${ringNetwork.data.connectionIds.length} connections`);

      // Get topology
      const topology = await this.proxy.handleAPIRequest({
        method: 'GET',
        path: '/topology'
      });

      console.log(`  ✅ Network topology: ${topology.data.topology.nodes.length} nodes, ${topology.data.topology.edges.length} edges`);

    } catch (error) {
      console.error('  ❌ Direct proxy usage failed:', error);
    }
  }

  private async demonstrateHTTPAPIUsage(mockTomes: any[]): Promise<void> {
    console.log('🌐 Demonstrating HTTP API Usage:');
    
    try {
      // Use the HTTP server convenience methods
      const connectionId = await this.httpServer.createConnection(
        mockTomes[2], 
        mockTomes[3],
        { bidirectional: false }
      );

      console.log(`  ✅ Created connection via HTTP API: ${connectionId}`);

      // Get connections
      const connections = await this.httpServer.getConnections();
      console.log(`  ✅ Retrieved ${connections.length} connections via HTTP API`);

      // Get health status
      const health = await this.httpServer.getHealth();
      console.log(`  ✅ Health status: ${health.status} (${health.connections.healthy}/${health.connections.total} healthy)`);

    } catch (error) {
      console.error('  ❌ HTTP API usage failed:', error);
    }
  }

  private async demonstrateRobotCopyIntegration(): Promise<void> {
    console.log('🤖 Demonstrating RobotCopy Integration:');
    
    try {
      // Check feature toggles
      const enableTracing = await this.robotCopy.isEnabled('enable-tracing');
      const enableDataDog = await this.robotCopy.isEnabled('enable-datadog');
      
      console.log(`  ✅ Feature toggles: tracing=${enableTracing}, datadog=${enableDataDog}`);

      // Generate trace IDs
      const traceId = this.robotCopy.generateTraceId();
      const spanId = this.robotCopy.generateSpanId();
      
      console.log(`  ✅ Generated trace: ${traceId}, span: ${spanId}`);

      // Track a custom message
      this.robotCopy.trackMessage('demo-message', traceId, spanId, {
        action: 'proxy_demo',
        data: { message: 'Hello from proxy demo!' }
      });

      console.log('  ✅ Tracked custom message');

      // Get message history
      const messageHistory = this.robotCopy.getMessageHistory();
      console.log(`  ✅ Message history: ${messageHistory.length} messages`);

      // Get registered machines
      const registeredMachines = this.robotCopy.getRegisteredMachines();
      console.log(`  ✅ Registered machines: ${registeredMachines.size} machines`);
      
      for (const [name, machine] of registeredMachines) {
        console.log(`    - ${name}: ${machine.config.type} (${machine.config.capabilities.join(', ')})`);
      }

    } catch (error) {
      console.error('  ❌ RobotCopy integration failed:', error);
    }
  }

  private async showMetricsAndHealth(): Promise<void> {
    console.log('📊 Showing Metrics and Health:');
    
    try {
      // Get metrics from the proxy
      const metrics = await this.proxy.handleAPIRequest({
        method: 'GET',
        path: '/metrics'
      });

      if (metrics.success) {
        const data = metrics.data.metrics;
        console.log(`  ✅ Proxy metrics:`);
        console.log(`    - API calls: ${data.proxy.apiCallCount}`);
        console.log(`    - Connections: ${data.connections}`);
        console.log(`    - RobotCopy messages: ${data.robotCopy.messageCount}`);
        console.log(`    - RobotCopy traces: ${data.robotCopy.traceCount}`);
      }

      // Get health status
      const health = await this.proxy.handleAPIRequest({
        method: 'GET',
        path: '/health'
      });

      if (health.success) {
        const healthData = health.data.health;
        console.log(`  ✅ Health status:`);
        console.log(`    - Overall: ${healthData.status}`);
        console.log(`    - Connections: ${healthData.connections.total} total, ${healthData.connections.healthy} healthy`);
        console.log(`    - Timestamp: ${healthData.timestamp}`);
      }

    } catch (error) {
      console.error('  ❌ Failed to get metrics and health:', error);
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    
    try {
      // Stop the HTTP server
      await this.httpServer.stop();
      console.log('  ✅ HTTP server stopped');
      
      // The proxy will be destroyed when the HTTP server stops
      console.log('  ✅ Proxy destroyed');
      
    } catch (error) {
      console.error('  ❌ Cleanup failed:', error);
    }
  }

  // Getter methods for external access
  getProxy(): TomeConnectorProxy {
    return this.proxy;
  }

  getHTTPServer(): TomeConnectorHTTPServer {
    return this.httpServer;
  }

  getRobotCopy(): RobotCopy {
    return this.robotCopy;
  }
}

// Example usage function
export async function runProxyUsageExample(): Promise<void> {
  const example = new ProxyUsageExample();
  await example.demonstrateProxyUsage();
}

// Export for use in other modules
