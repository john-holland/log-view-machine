import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

interface MetricsRequest extends Request {
  startTime?: number;
  metricsData?: {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    timestamp: Date;
  };
}

export class MetricsMiddleware {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fishburger',
    });
  }

  // Middleware to capture request start time
  captureStartTime(req: MetricsRequest, res: Response, next: NextFunction) {
    req.startTime = Date.now();
    next();
  }

  // Middleware to log API metrics
  async logApiMetrics(req: MetricsRequest, res: Response, next: NextFunction) {
    const originalSend = res.send;
    const originalJson = res.json;

    // Override send method to capture response
    res.send = function(body: any) {
      logMetrics(req, res, body);
      return originalSend.call(this, body);
    };

    // Override json method to capture response
    res.json = function(body: any) {
      logMetrics(req, res, body);
      return originalJson.call(this, body);
    };

    next();
  }

  // Log metrics to database
  async logToDatabase(metricsData: any) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO api_logs (endpoint, method, duration_ms, status_code, user_agent, ip_address, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        metricsData.endpoint,
        metricsData.method,
        metricsData.duration,
        metricsData.statusCode,
        metricsData.userAgent,
        metricsData.ipAddress,
        metricsData.timestamp
      ]);
    } finally {
      client.release();
    }
  }

  // Log metrics to database
  private async logMetrics(req: MetricsRequest, res: Response, body: any) {
    if (!req.startTime) return;

    const duration = Date.now() - req.startTime;
    const endpoint = req.route?.path || req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip || req.connection.remoteAddress;

    const metricsData = {
      endpoint,
      method,
      duration,
      statusCode,
      timestamp: new Date(),
      userAgent,
      ipAddress
    };

    req.metricsData = metricsData;

    // Log to database asynchronously (don't block response)
    this.logToDatabase(metricsData).catch(error => {
      console.error('Error logging metrics:', error);
    });
  }

  // Middleware to log database operations
  async logDatabaseOperation(operation: string, table: string, duration: number, rowsAffected?: number) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO database_logs (operation, table_name, duration_ms, rows_affected, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        operation,
        table,
        duration,
        rowsAffected,
        new Date()
      ]);
    } finally {
      client.release();
    }
  }

  // Middleware to log errors
  async logError(error: Error, context?: Record<string, any>) {
    const client = await this.pool.connect();
    try {
      await client.query(`
        INSERT INTO error_logs (error_type, message, stack_trace, context, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        error.name,
        error.message,
        error.stack,
        JSON.stringify(context || {}),
        new Date()
      ]);
    } finally {
      client.release();
    }
  }

  // Get API metrics summary
  async getApiMetricsSummary(timeRange: { start: Date; end: Date }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          endpoint,
          method,
          COUNT(*) as request_count,
          AVG(duration_ms) as avg_duration,
          MAX(duration_ms) as max_duration,
          MIN(duration_ms) as min_duration,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
          COUNT(CASE WHEN status_code >= 500 THEN 1 END) as server_error_count
        FROM api_logs
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY endpoint, method
        ORDER BY request_count DESC
      `, [timeRange.start, timeRange.end]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get error summary
  async getErrorSummary(timeRange: { start: Date; end: Date }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          error_type,
          COUNT(*) as error_count,
          MAX(timestamp) as last_occurrence
        FROM error_logs
        WHERE timestamp BETWEEN $1 AND $2
        GROUP BY error_type
        ORDER BY error_count DESC
      `, [timeRange.start, timeRange.end]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get performance trends
  async getPerformanceTrends(hours: number = 24) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          COUNT(*) as request_count,
          AVG(duration_ms) as avg_duration,
          MAX(duration_ms) as max_duration,
          COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
        FROM api_logs
        WHERE timestamp > NOW() - INTERVAL '1 hour' * $1
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour
      `, [hours]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Cleanup old logs
  async cleanupOldLogs(daysToKeep: number = 7) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT cleanup_old_api_logs($1)
      `, [daysToKeep]);

      return result.rows[0].cleanup_old_api_logs;
    } finally {
      client.release();
    }
  }
}

export const metricsMiddleware = new MetricsMiddleware();

// Helper function to log metrics (used by the middleware)
function logMetrics(req: MetricsRequest, res: Response, body: any) {
  if (!req.startTime) return;

  const duration = Date.now() - req.startTime;
  const endpoint = req.route?.path || req.path;
  const method = req.method;
  const statusCode = res.statusCode;
  const userAgent = req.get('User-Agent');
  const ipAddress = req.ip || req.connection.remoteAddress;

  const metricsData = {
    endpoint,
    method,
    duration,
    statusCode,
    timestamp: new Date(),
    userAgent,
    ipAddress
  };

  req.metricsData = metricsData;

  // Log to database asynchronously
  metricsMiddleware.logToDatabase(metricsData).catch(error => {
    console.error('Error logging metrics:', error);
  });
} 