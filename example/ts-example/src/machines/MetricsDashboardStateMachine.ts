import { createStateMachine } from '../core/StateMachine';

// Types
export interface MetricsData {
  totalBurgers: number;
  totalRevenue: number;
  stateDistribution: Array<{ state: string; count: number }>;
  ingredientUsage: Array<{ ingredient: string; count: number }>;
  recentErrors: Array<{ error_type: string; message: string; timestamp: string }>;
}

export interface PerformanceData {
  avgOrderTime: number;
  avgApiLatency: number;
  avgDbLatency: number;
}

export interface ApiMetrics {
  endpoint: string;
  method: string;
  request_count: number;
  avg_duration: number;
  max_duration: number;
  error_count: number;
}

export interface MetricsDashboardModel {
  metricsData: MetricsData | null;
  performanceData: PerformanceData | null;
  apiMetrics: ApiMetrics[];
  timeRange: string;
  loading: boolean;
  error: string | null;
  lastPayload: any;
}

export interface MetricsDashboardConfig {
  machineId: string;
  autoRefreshInterval?: number;
}

// State definitions
const stateDefinitions = {
  initial: {
    loading: {},
    ready: {},
    error: {}
  },
  loading: {
    ready: {},
    error: {}
  },
  ready: {
    loading: {},
    error: {}
  },
  error: {
    loading: {},
    ready: {}
  }
};

export const createMetricsDashboard = (config: MetricsDashboardConfig) => {
  return createStateMachine<MetricsDashboardConfig, MetricsDashboardModel>({
    defaultConfig: config,
    defaultViewModel: {
      metricsData: null,
      performanceData: null,
      apiMetrics: [],
      timeRange: '24h',
      loading: false,
      error: null,
      lastPayload: null
    },
    states: stateDefinitions
  }).
  withMethod('loadData', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.error = null;
      transition('loading');

      // Fetch all metrics in parallel
      const [metricsResponse, performanceResponse, apiResponse] = await Promise.all([
        fetch(`/api/metrics/summary?timeRange=${viewModel.timeRange}`),
        fetch(`/api/metrics/performance?timeRange=${viewModel.timeRange}`),
        fetch(`/api/metrics/api?timeRange=${viewModel.timeRange}`)
      ]);

      if (!metricsResponse.ok || !performanceResponse.ok || !apiResponse.ok) {
        throw new Error('Failed to fetch metrics data');
      }

      const [metrics, performance, api] = await Promise.all([
        metricsResponse.json(),
        performanceResponse.json(),
        apiResponse.json()
      ]);

      viewModel.metricsData = metrics;
      viewModel.performanceData = performance;
      viewModel.apiMetrics = api;
      transition('ready');
    } catch (err) {
      viewModel.error = 'Failed to load metrics data';
      console.error('Error fetching metrics:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
    }
  }).
  withMethod('setTimeRange', (context) => {
    const { viewModel } = context;
    viewModel.timeRange = viewModel.lastPayload as string;
    // Auto-refresh when time range changes
    context.sendMessage('loadData');
  }).
  withMethod('refresh', (context) => {
    context.sendMessage('loadData');
  }).
  withMethod('clearError', (context) => {
    const { viewModel } = context;
    viewModel.error = null;
  });
}; 