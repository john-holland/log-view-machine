import { metrics, ObservableResult, Context } from '@opentelemetry/api';
import { Pool } from 'pg';

const meter = metrics.getMeter('fishburger-api');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fishburger',
});

// Core metrics
const burgerCounter = meter.createCounter('burgers_created_total', {
  description: 'Total number of burgers created'
});

const burgerStateGauge = meter.createObservableGauge('burger_states', {
  description: 'Current number of burgers in each state'
});

const orderLatencyHistogram = meter.createHistogram('order_processing_latency_seconds', {
  description: 'Time taken to process orders'
});

const ingredientUsageCounter = meter.createCounter('ingredient_usage_total', {
  description: 'Total usage of each ingredient'
});

const revenueCounter = meter.createCounter('revenue_total', {
  description: 'Total revenue generated'
});

const errorCounter = meter.createCounter('errors_total', {
  description: 'Total number of errors'
});

const apiLatencyHistogram = meter.createHistogram('api_latency_seconds', {
  description: 'API endpoint latency'
});

const databaseLatencyHistogram = meter.createHistogram('database_latency_seconds', {
  description: 'Database operation latency'
});

const memoryGauge = meter.createObservableGauge('memory_usage_bytes', {
  description: 'Memory usage in bytes'
});

const cpuGauge = meter.createObservableGauge('cpu_usage_percent', {
  description: 'CPU usage percentage'
});

// Register observable callbacks
meter.addBatchObservableCallback(async (observableResult: ObservableResult, context: Context) => {
  try {
    // Get current burger states from database
    const client = await pool.connect();
    try {
      const statesResult = await client.query(`
        SELECT state, COUNT(*) as count 
        FROM burgers 
        WHERE state != 'TRASH' 
        GROUP BY state
      `);
      
      for (const row of statesResult.rows) {
        observableResult.observe(burgerStateGauge, parseInt(row.count), { state: row.state });
      }

      // Get memory usage
      const memUsage = process.memoryUsage();
      observableResult.observe(memoryGauge, memUsage.heapUsed, { type: 'heap_used' });
      observableResult.observe(memoryGauge, memUsage.heapTotal, { type: 'heap_total' });
      observableResult.observe(memoryGauge, memUsage.rss, { type: 'rss' });

      // Get CPU usage (simplified)
      const startUsage = process.cpuUsage();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endUsage = process.cpuUsage(startUsage);
      const cpuPercent = ((endUsage.user + endUsage.system) / 1000000) * 100;
      observableResult.observe(cpuGauge, cpuPercent, { type: 'process' });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating metrics:', error);
    errorCounter.add(1, { type: 'metrics_update_error' });
  }
});

export class MetricsService {
  private static instance: MetricsService;

  private constructor() {}

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // Record burger creation
  recordBurgerCreated(type: string, ingredients: string[], cost: number) {
    burgerCounter.add(1, { type });
    revenueCounter.add(cost, { type });
    
    // Record ingredient usage
    ingredients.forEach(ingredient => {
      ingredientUsageCounter.add(1, { ingredient: ingredient.toLowerCase().replace(/\s+/g, '_') });
    });
  }

  // Record state transition
  recordStateTransition(fromState: string, toState: string, duration: number) {
    orderLatencyHistogram.record(duration / 1000, { 
      from_state: fromState, 
      to_state: toState 
    });
  }

  // Record API call
  recordApiCall(endpoint: string, method: string, duration: number, statusCode: number) {
    apiLatencyHistogram.record(duration / 1000, { 
      endpoint, 
      method, 
      status_code: statusCode.toString() 
    });
  }

  // Record database operation
  recordDatabaseOperation(operation: string, table: string, duration: number) {
    databaseLatencyHistogram.record(duration / 1000, { 
      operation, 
      table 
    });
  }

  // Record error
  recordError(type: string, message: string) {
    errorCounter.add(1, { type, message });
  }

  // Get metrics summary
  async getMetricsSummary() {
    const client = await pool.connect();
    try {
      const [
        totalBurgers,
        totalRevenue,
        stateDistribution,
        ingredientUsage,
        recentErrors
      ] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM burgers'),
        client.query('SELECT SUM(total_cost) as total FROM burgers'),
        client.query('SELECT state, COUNT(*) as count FROM burgers GROUP BY state'),
        client.query('SELECT ingredient, COUNT(*) as count FROM burger_ingredients GROUP BY ingredient'),
        client.query('SELECT * FROM error_logs ORDER BY timestamp DESC LIMIT 10')
      ]);

      return {
        totalBurgers: parseInt(totalBurgers.rows[0]?.count || '0'),
        totalRevenue: parseFloat(totalRevenue.rows[0]?.total || '0'),
        stateDistribution: stateDistribution.rows,
        ingredientUsage: ingredientUsage.rows,
        recentErrors: recentErrors.rows
      };
    } finally {
      client.release();
    }
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    const client = await pool.connect();
    try {
      const [
        avgOrderTime,
        avgApiLatency,
        avgDbLatency
      ] = await Promise.all([
        client.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time 
          FROM burgers 
          WHERE state = 'READY'
        `),
        client.query(`
          SELECT AVG(duration_ms) as avg_latency 
          FROM api_logs 
          WHERE timestamp > NOW() - INTERVAL '1 hour'
        `),
        client.query(`
          SELECT AVG(duration_ms) as avg_latency 
          FROM database_logs 
          WHERE timestamp > NOW() - INTERVAL '1 hour'
        `)
      ]);

      return {
        avgOrderTime: parseFloat(avgOrderTime.rows[0]?.avg_time || '0'),
        avgApiLatency: parseFloat(avgApiLatency.rows[0]?.avg_latency || '0'),
        avgDbLatency: parseFloat(avgDbLatency.rows[0]?.avg_latency || '0')
      };
    } finally {
      client.release();
    }
  }
}

export const metricsService = MetricsService.getInstance(); 