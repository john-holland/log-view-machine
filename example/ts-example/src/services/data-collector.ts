import { Pool } from 'pg';

interface DataPoint {
  timestamp: Date;
  type: string;
  data: Record<string, any>;
  tags?: Record<string, string>;
}

interface UserBehavior {
  userId?: string;
  sessionId: string;
  action: string;
  timestamp: Date;
  context: Record<string, any>;
}

interface SystemEvent {
  eventType: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class DataCollector {
  private pool: Pool;
  private batchSize: number = 100;
  private flushInterval: number = 5000; // 5 seconds
  private dataBuffer: DataPoint[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fishburger',
    });
    
    this.startFlushTimer();
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  // Collect user behavior data
  async collectUserBehavior(behavior: UserBehavior) {
    const dataPoint: DataPoint = {
      timestamp: behavior.timestamp,
      type: 'user_behavior',
      data: {
        userId: behavior.userId,
        sessionId: behavior.sessionId,
        action: behavior.action,
        context: behavior.context
      },
      tags: {
        action: behavior.action,
        sessionId: behavior.sessionId
      }
    };

    await this.addDataPoint(dataPoint);
  }

  // Collect system events
  async collectSystemEvent(event: SystemEvent) {
    const dataPoint: DataPoint = {
      timestamp: event.timestamp,
      type: 'system_event',
      data: {
        eventType: event.eventType,
        severity: event.severity,
        message: event.message,
        metadata: event.metadata
      },
      tags: {
        eventType: event.eventType,
        severity: event.severity
      }
    };

    await this.addDataPoint(dataPoint);
  }

  // Collect performance metrics
  async collectPerformanceMetrics(metrics: {
    endpoint: string;
    method: string;
    duration: number;
    statusCode: number;
    timestamp: Date;
  }) {
    const dataPoint: DataPoint = {
      timestamp: metrics.timestamp,
      type: 'performance',
      data: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: metrics.duration,
        statusCode: metrics.statusCode
      },
      tags: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        statusCode: metrics.statusCode.toString()
      }
    };

    await this.addDataPoint(dataPoint);
  }

  // Collect business metrics
  async collectBusinessMetrics(metrics: {
    burgersCreated: number;
    revenue: number;
    ingredientsUsed: Record<string, number>;
    timestamp: Date;
  }) {
    const dataPoint: DataPoint = {
      timestamp: metrics.timestamp,
      type: 'business',
      data: {
        burgersCreated: metrics.burgersCreated,
        revenue: metrics.revenue,
        ingredientsUsed: metrics.ingredientsUsed
      },
      tags: {
        metricType: 'business'
      }
    };

    await this.addDataPoint(dataPoint);
  }

  // Add data point to buffer
  private async addDataPoint(dataPoint: DataPoint) {
    this.dataBuffer.push(dataPoint);

    if (this.dataBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  // Flush data to database
  private async flush() {
    if (this.dataBuffer.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const dataPoint of this.dataBuffer) {
        await client.query(`
          INSERT INTO data_points (timestamp, type, data, tags)
          VALUES ($1, $2, $3, $4)
        `, [
          dataPoint.timestamp,
          dataPoint.type,
          JSON.stringify(dataPoint.data),
          JSON.stringify(dataPoint.tags || {})
        ]);
      }

      await client.query('COMMIT');
      this.dataBuffer = [];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error flushing data points:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get analytics data
  async getAnalytics(timeRange: { start: Date; end: Date }, type?: string) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT type, data, tags, timestamp
        FROM data_points
        WHERE timestamp BETWEEN $1 AND $2
      `;
      const params = [timeRange.start, timeRange.end];

      if (type) {
        query += ' AND type = $3';
        params.push(type);
      }

      query += ' ORDER BY timestamp DESC';

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get user behavior analytics
  async getUserBehaviorAnalytics(timeRange: { start: Date; end: Date }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          data->>'action' as action,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY timestamp)))) as avg_time_between_actions
        FROM data_points
        WHERE type = 'user_behavior' 
          AND timestamp BETWEEN $1 AND $2
        GROUP BY data->>'action'
        ORDER BY count DESC
      `, [timeRange.start, timeRange.end]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get performance analytics
  async getPerformanceAnalytics(timeRange: { start: Date; end: Date }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          data->>'endpoint' as endpoint,
          data->>'method' as method,
          AVG((data->>'duration')::numeric) as avg_duration,
          MAX((data->>'duration')::numeric) as max_duration,
          MIN((data->>'duration')::numeric) as min_duration,
          COUNT(*) as request_count
        FROM data_points
        WHERE type = 'performance' 
          AND timestamp BETWEEN $1 AND $2
        GROUP BY data->>'endpoint', data->>'method'
        ORDER BY avg_duration DESC
      `, [timeRange.start, timeRange.end]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get business analytics
  async getBusinessAnalytics(timeRange: { start: Date; end: Date }) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          DATE_TRUNC('hour', timestamp) as hour,
          SUM((data->>'burgersCreated')::numeric) as burgers_created,
          SUM((data->>'revenue')::numeric) as revenue
        FROM data_points
        WHERE type = 'business' 
          AND timestamp BETWEEN $1 AND $2
        GROUP BY DATE_TRUNC('hour', timestamp)
        ORDER BY hour
      `, [timeRange.start, timeRange.end]);

      return result.rows;
    } finally {
      client.release();
    }
  }

  // Cleanup old data
  async cleanupOldData(daysToKeep: number = 30) {
    const client = await this.pool.connect();
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await client.query(`
        DELETE FROM data_points
        WHERE timestamp < $1
      `, [cutoffDate]);
      
      console.log(`Cleaned up ${result.rowCount} old data points`);
      return result.rowCount;
    } finally {
      client.release();
    }
  }

  // Shutdown
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
    await this.pool.end();
  }
}

export const dataCollector = new DataCollector(); 