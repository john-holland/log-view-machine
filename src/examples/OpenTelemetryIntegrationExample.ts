import { TomeConnectorProxy, createTomeConnectorProxy } from '../core/TomeConnectorProxy';
import { TomeConnectorHTTPServer, createTomeConnectorHTTPServer } from '../core/TomeConnectorHTTPServer';
import { TomeConnectorOpenTelemetry, createTomeConnectorOpenTelemetry } from '../core/TomeConnectorOpenTelemetry';
import { RobotCopy, createRobotCopy } from '../core/RobotCopy';

// Example demonstrating OpenTelemetry integration with TomeConnectorProxy
export class OpenTelemetryIntegrationExample {
  private proxy: TomeConnectorProxy;
  private httpServer: TomeConnectorHTTPServer;
  private openTelemetry: TomeConnectorOpenTelemetry;
  private robotCopy: RobotCopy;

  constructor() {
    // Create RobotCopy with enhanced tracing
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

    // Create OpenTelemetry integration
    this.openTelemetry = createTomeConnectorOpenTelemetry(this.proxy, {
      serviceName: 'tome-connector-service',
      serviceVersion: '1.0.0',
      environment: 'development',
      endpoint: 'http://localhost:4318/v1/traces', // OTLP HTTP endpoint
      enableMetrics: true,
      enableLogs: true,
      samplingRate: 1.0, // 100% sampling for development
      maxExportBatchSize: 512,
      maxQueueSize: 2048,
      exportTimeoutMillis: 30000
    });

    // Create HTTP server
    this.httpServer = createTomeConnectorHTTPServer({
      robotCopy: this.robotCopy,
      port: 3000,
      enableCORS: true,
      enableLogging: true
    });
  }

  async demonstrateOpenTelemetryIntegration(): Promise<void> {
    console.log('🚀 Starting OpenTelemetry Integration Demo...\n');

    try {
      // Initialize OpenTelemetry
      await this.openTelemetry.initialize();
      console.log('✅ OpenTelemetry initialized\n');

      // Start HTTP server
      await this.httpServer.start();
      console.log('✅ HTTP Server started\n');

      // Create mock services
      const mockServices = this.createMockServices();
      console.log('✅ Created mock services\n');

      // Demonstrate distributed tracing
      await this.demonstrateDistributedTracing(mockServices);
      console.log('✅ Distributed tracing demonstrated\n');

      // Demonstrate metrics collection
      await this.demonstrateMetricsCollection(mockServices);
      console.log('✅ Metrics collection demonstrated\n');

      // Demonstrate structured logging
      await this.demonstrateStructuredLogging();
      console.log('✅ Structured logging demonstrated\n');

      // Demonstrate trace correlation
      await this.demonstrateTraceCorrelation(mockServices);
      console.log('✅ Trace correlation demonstrated\n');

      // Show telemetry dashboard
      await this.showTelemetryDashboard();
      console.log('✅ Telemetry dashboard displayed\n');

    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private createMockServices(): any[] {
    const createMockService = (name: string, type: string) => ({
      constructor: { name },
      type,
      on: jest.fn(),
      send: jest.fn(),
      getState: jest.fn(() => ({ value: 'idle', service: name, type })),
    });

    return [
      createMockService('OrderService', 'order-management'),
      createMockService('PaymentService', 'payment-processing'),
      createMockService('InventoryService', 'inventory-management'),
      createMockService('NotificationService', 'notification-delivery'),
      createMockService('AnalyticsService', 'data-analytics')
    ];
  }

  private async demonstrateDistributedTracing(mockServices: any[]): Promise<void> {
    console.log('🔍 Demonstrating Distributed Tracing:');
    
    try {
      // Start a root span for the entire operation
      const rootSpan = this.openTelemetry.startSpan('order.workflow', {
        'business.workflow': 'order_processing',
        'business.customer_id': 'CUST-12345',
        'business.order_id': 'ORDER-67890'
      });

      // Create connections with tracing
      const connectionSpan1 = this.openTelemetry.startSpan('connection.create', {
        'tome.source': mockServices[0].constructor.name,
        'tome.target': mockServices[1].constructor.name,
        'tome.connection_type': 'bidirectional'
      }, {
        traceId: rootSpan.attributes['trace.id'],
        spanId: rootSpan.attributes['span.id']
      });

      const connectionId1 = await this.proxy.handleAPIRequest({
        method: 'POST',
        path: '/connections',
        body: {
          sourceTome: mockServices[0],
          targetTome: mockServices[1],
          config: { bidirectional: true, enableTracing: true }
        }
      });

      connectionSpan1.setAttribute('tome.connection_id', connectionId1.data.connectionId);
      connectionSpan1.addEvent('connection.created', {
        'tome.connection_id': connectionId1.data.connectionId,
        'tome.status': 'active'
      });
      connectionSpan1.end();

      // Create another connection
      const connectionSpan2 = this.openTelemetry.startSpan('connection.create', {
        'tome.source': mockServices[1].constructor.name,
        'tome.target': mockServices[2].constructor.name,
        'tome.connection_type': 'unidirectional'
      }, {
        traceId: rootSpan.attributes['trace.id'],
        spanId: rootSpan.attributes['span.id']
      });

      const connectionId2 = await this.proxy.handleAPIRequest({
        method: 'POST',
        path: '/connections',
        body: {
          sourceTome: mockServices[1],
          targetTome: mockServices[2],
          config: { bidirectional: false, enableTracing: true }
        }
      });

      connectionSpan2.setAttribute('tome.connection_id', connectionId2.data.connectionId);
      connectionSpan2.addEvent('connection.created', {
        'tome.connection_id': connectionId2.data.connectionId,
        'tome.status': 'active'
      });
      connectionSpan2.end();

      // Create a ring network with tracing
      const networkSpan = this.openTelemetry.startSpan('network.create', {
        'tome.network_type': 'ring',
        'tome.service_count': 3
      }, {
        traceId: rootSpan.attributes['trace.id'],
        spanId: rootSpan.attributes['span.id']
      });

      const ringNetwork = await this.proxy.handleAPIRequest({
        method: 'POST',
        path: '/networks/ring',
        body: { tomes: mockServices.slice(0, 3) }
      });

      networkSpan.setAttribute('tome.connection_count', ringNetwork.data.connectionIds.length);
      networkSpan.addEvent('network.created', {
        'tome.network_type': 'ring',
        'tome.connections': ringNetwork.data.connectionIds
      });
      networkSpan.end();

      // End the root span
      rootSpan.addEvent('workflow.completed', {
        'business.connections_created': 2,
        'business.networks_created': 1
      });
      rootSpan.end();

      console.log(`  ✅ Created ${ringNetwork.data.connectionIds.length} connections with full tracing`);
      console.log(`  ✅ Root span: ${rootSpan.name} with trace ID: ${rootSpan.attributes['trace.id']}`);

    } catch (error) {
      console.error('  ❌ Distributed tracing failed:', error);
    }
  }

  private async demonstrateMetricsCollection(mockServices: any[]): Promise<void> {
    console.log('📊 Demonstrating Metrics Collection:');
    
    try {
      // Create various metrics
      const connectionCounter = this.openTelemetry.createCounter('tome.connections.total', 'Total connections created');
      const responseTimeHistogram = this.openTelemetry.createHistogram('tome.response_time_ms', 'Response time distribution');
      const activeConnectionsGauge = this.openTelemetry.createGauge('tome.connections.active', 'Currently active connections');

      // Simulate some metrics
      connectionCounter.add(1, { 'tome.connection_type': 'bidirectional' });
      connectionCounter.add(1, { 'tome.connection_type': 'unidirectional' });
      connectionCounter.add(1, { 'tome.connection_type': 'ring_network' });

      // Record response times
      responseTimeHistogram.record(45, { 'tome.operation': 'connection_create' });
      responseTimeHistogram.record(67, { 'tome.operation': 'connection_create' });
      responseTimeHistogram.record(23, { 'tome.operation': 'network_create' });
      responseTimeHistogram.record(89, { 'tome.operation': 'topology_query' });

      // Set active connections gauge
      activeConnectionsGauge.set(5, { 'tome.status': 'active' });

      // Get metrics statistics
      const responseTimeStats = responseTimeHistogram.getStats();
      console.log(`  ✅ Response time metrics: ${responseTimeStats.count} samples`);
      console.log(`    - Average: ${responseTimeStats.mean.toFixed(2)}ms`);
      console.log(`    - Min: ${responseTimeStats.min}ms, Max: ${responseTimeStats.max}ms`);
      console.log(`  ✅ Connection counter: ${connectionCounter.getValue()} total connections`);
      console.log(`  ✅ Active connections: ${activeConnectionsGauge.getValue()}`);

    } catch (error) {
      console.error('  ❌ Metrics collection failed:', error);
    }
  }

  private async demonstrateStructuredLogging(): Promise<void> {
    console.log('📝 Demonstrating Structured Logging:');
    
    try {
      // Log different levels with structured attributes
      this.openTelemetry.log('info', 'Service initialization started', {
        'service.name': 'tome-connector',
        'service.version': '1.0.0',
        'environment': 'development',
        'timestamp': new Date().toISOString()
      });

      this.openTelemetry.log('debug', 'Creating network topology', {
        'operation': 'topology_creation',
        'network_type': 'ring',
        'service_count': 3,
        'trace_id': this.robotCopy.generateTraceId()
      });

      this.openTelemetry.log('warn', 'High connection count detected', {
        'warning.type': 'high_connection_count',
        'current_count': 15,
        'threshold': 10,
        'recommendation': 'Consider connection pooling'
      });

      this.openTelemetry.log('error', 'Failed to create connection', {
        'error.type': 'connection_failure',
        'error.code': 'TIMEOUT',
        'source_service': 'OrderService',
        'target_service': 'PaymentService',
        'retry_count': 3
      });

      console.log('  ✅ Structured logging demonstrated with different levels');

    } catch (error) {
      console.error('  ❌ Structured logging failed:', error);
    }
  }

  private async demonstrateTraceCorrelation(mockServices: any[]): Promise<void> {
    console.log('🔗 Demonstrating Trace Correlation:');
    
    try {
      // Generate a trace ID that will be used across multiple operations
      const traceId = this.robotCopy.generateTraceId();
      const rootSpanId = this.robotCopy.generateSpanId();

      console.log(`  🔍 Root Trace ID: ${traceId}`);
      console.log(`  🔍 Root Span ID: ${rootSpanId}`);

      // Create a span for the main workflow
      const workflowSpan = this.openTelemetry.startSpan('business.workflow', {
        'business.workflow_id': 'WF-12345',
        'business.customer_id': 'CUST-67890',
        'trace.id': traceId,
        'span.id': rootSpanId
      });

      // Simulate multiple operations that correlate to the same trace
      const operations = [
        { name: 'order.validation', duration: 45 },
        { name: 'payment.processing', duration: 120 },
        { name: 'inventory.check', duration: 23 },
        { name: 'notification.send', duration: 67 }
      ];

      for (const operation of operations) {
        const operationSpan = this.openTelemetry.startSpan(operation.name, {
          'business.operation': operation.name,
          'business.workflow_id': 'WF-12345',
          'trace.id': traceId,
          'span.id': this.robotCopy.generateSpanId()
        }, {
          traceId,
          spanId: rootSpanId
        });

        // Simulate operation duration
        await new Promise(resolve => setTimeout(resolve, operation.duration));
        
        operationSpan.setAttribute('business.duration_ms', operation.duration);
        operationSpan.addEvent('operation.completed', {
          'business.status': 'success',
          'business.duration': operation.duration
        });
        operationSpan.end();
      }

      // End the workflow span
      workflowSpan.addEvent('workflow.completed', {
        'business.operations_completed': operations.length,
        'business.total_duration': operations.reduce((sum, op) => sum + op.duration, 0)
      });
      workflowSpan.end();

      console.log(`  ✅ Correlated ${operations.length} operations under trace ${traceId}`);
      console.log(`  ✅ Total workflow duration: ${operations.reduce((sum, op) => sum + op.duration, 0)}ms`);

    } catch (error) {
      console.error('  ❌ Trace correlation failed:', error);
    }
  }

  private async showTelemetryDashboard(): Promise<void> {
    console.log('📊 Telemetry Dashboard:');
    
    try {
      // Get telemetry metrics
      const telemetryMetrics = await this.openTelemetry.getTelemetryMetrics();
      
      console.log(`  🔧 Service: ${telemetryMetrics.service}`);
      console.log(`  🌍 Environment: ${telemetryMetrics.environment}`);
      console.log(`  📅 Timestamp: ${telemetryMetrics.timestamp}`);
      
      if (telemetryMetrics.metrics) {
        console.log(`  📈 Spans processed: ${telemetryMetrics.metrics.spans_processed}`);
        console.log(`  📊 Metrics recorded: ${telemetryMetrics.metrics.metrics_recorded}`);
        console.log(`  📝 Logs generated: ${telemetryMetrics.metrics.logs_generated}`);
      }

      // Get RobotCopy metrics
      const robotCopyMetrics = {
        messageCount: this.robotCopy.getMessageHistory().length,
        traceCount: this.robotCopy.getTraceIds().length,
        registeredMachines: this.robotCopy.getRegisteredMachines().size
      };

      console.log(`  🤖 RobotCopy Metrics:`);
      console.log(`    - Messages tracked: ${robotCopyMetrics.messageCount}`);
      console.log(`    - Traces generated: ${robotCopyMetrics.traceCount}`);
      console.log(`    - Machines registered: ${robotCopyMetrics.registeredMachines}`);

      // Get proxy metrics
      const proxyMetrics = this.proxy.getMetrics();
      console.log(`  📡 Proxy Metrics:`);
      console.log(`    - API calls: ${proxyMetrics.get('apiCalls') || 0}`);
      console.log(`    - Last health check: ${proxyMetrics.get('lastHealthCheck')?.timestamp || 'Never'}`);

    } catch (error) {
      console.error('  ❌ Failed to show telemetry dashboard:', error);
    }
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...');
    
    try {
      // Shutdown OpenTelemetry
      await this.openTelemetry.shutdown();
      console.log('  ✅ OpenTelemetry shut down');
      
      // Stop HTTP server
      await this.httpServer.stop();
      console.log('  ✅ HTTP server stopped');
      
    } catch (error) {
      console.error('  ❌ Cleanup failed:', error);
    }
  }

  // Getter methods
  getOpenTelemetry(): TomeConnectorOpenTelemetry {
    return this.openTelemetry;
  }

  getProxy(): TomeConnectorProxy {
    return this.proxy;
  }

  getRobotCopy(): RobotCopy {
    return this.robotCopy;
  }
}

// Example usage function
export async function runOpenTelemetryIntegrationExample(): Promise<void> {
  const example = new OpenTelemetryIntegrationExample();
  await example.demonstrateOpenTelemetryIntegration();
}

// Export for use in other modules
