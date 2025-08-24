import express from 'express';
import { TomeConnectorHTTPServer } from './core/TomeConnectorHTTPServer';
import { TomeConnectorOpenTelemetry } from './core/TomeConnectorOpenTelemetry';
import { RobotCopy } from './core/RobotCopy';

// Initialize OpenTelemetry
const otel = new TomeConnectorOpenTelemetry({
  serviceName: 'tome-connector',
  serviceVersion: '1.0.0',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
});

// Initialize RobotCopy
const robotCopy = new RobotCopy({
  backendType: 'node',
  featureToggles: {
    'tracing.enabled': true,
    'metrics.enabled': true,
    'health.monitoring': true
  }
});

// Initialize TomeConnector HTTP Server
const httpServer = new TomeConnectorHTTPServer({
  port: parseInt(process.env.PORT || '3000'),
  robotCopy,
  enableOpenTelemetry: true,
  openTelemetry: otel
});

// Create Express app for additional middleware and routes
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tome-connector',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TomeConnector Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*',
      metrics: '/metrics'
    }
  });
});

// Mount the TomeConnector API routes
app.use('/api', (req, res, next) => {
  // Route API requests through the TomeConnector HTTP server
  httpServer.handleHTTPRequest(req, res, next);
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await otel.getTelemetryMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
async function startServer() {
  try {
    // Initialize OpenTelemetry
    await otel.initialize();
    
    // Initialize TomeConnector HTTP Server
    await httpServer.initialize();
    
    // Start the Express server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🚀 TomeConnector Server running on port ${port}`);
      console.log(`📊 Health check: http://localhost:${port}/health`);
      console.log(`📈 Metrics: http://localhost:${port}/metrics`);
      console.log(`🔍 API: http://localhost:${port}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await otel.shutdown();
  await httpServer.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await otel.shutdown();
  await httpServer.destroy();
  process.exit(0);
});

// Start the server
startServer();
