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

export interface MetricsDashboardViewModel {
  metricsData: MetricsData | null;
  performanceData: PerformanceData | null;
  apiMetrics: ApiMetrics[];
  timeRange: string;
  loading: boolean;
  error: string | null;
  lastPayload: any;
  currentState: string;
  showCharts: boolean;
  showTables: boolean;
  showPerformanceMetrics: boolean;
  showApiMetrics: boolean;
  showErrorLogs: boolean;
  autoRefreshEnabled: boolean;
  refreshInterval: number;
  lastRefreshTime: string;
  chartDataReady: boolean;
  tableDataReady: boolean;
}

export interface MetricsDashboardConfig {
  machineId: string;
  autoRefreshInterval: number;
}

// Enhanced state definitions with UI-specific states
const stateDefinitions = {
  initial: {
    loading: {},
    ready: {},
    error: {},
    refreshing: {},
    noData: {}
  },
  loading: {
    ready: {},
    error: {},
    noData: {},
    refreshing: {}
  },
  ready: {
    loading: {},
    error: {},
    refreshing: {},
    noData: {}
  },
  error: {
    loading: {},
    ready: {},
    refreshing: {}
  },
  refreshing: {
    ready: {},
    error: {},
    loading: {}
  },
  noData: {
    loading: {},
    ready: {},
    error: {}
  }
};

export const createMetricsDashboardView = (config: MetricsDashboardConfig) => {
  return createStateMachine<MetricsDashboardConfig, MetricsDashboardViewModel>({
    defaultConfig: config,
    defaultViewModel: {
      metricsData: null,
      performanceData: null,
      apiMetrics: [],
      timeRange: '1h',
      loading: false,
      error: null,
      lastPayload: null,
      currentState: 'initial',
      showCharts: true,
      showTables: true,
      showPerformanceMetrics: true,
      showApiMetrics: true,
      showErrorLogs: true,
      autoRefreshEnabled: true,
      refreshInterval: config.autoRefreshInterval,
      lastRefreshTime: '',
      chartDataReady: false,
      tableDataReady: false
    },
    states: stateDefinitions
  }).
  withMethod('loadMetrics', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.loading = true;
      viewModel.error = null;
      viewModel.chartDataReady = false;
      viewModel.tableDataReady = false;
      transition('loading');

      // Load all metrics data in parallel
      const [metricsResponse, performanceResponse, apiResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/metrics?timeRange=${viewModel.timeRange}`).then(res => res.json()),
        fetch('http://localhost:3001/api/metrics/performance').then(res => res.json()),
        fetch('http://localhost:3001/api/metrics/api').then(res => res.json())
      ]);

      viewModel.metricsData = metricsResponse;
      viewModel.performanceData = performanceResponse;
      viewModel.apiMetrics = apiResponse;
      viewModel.lastRefreshTime = new Date().toISOString();

      // Determine if we have data to show
      const hasData = viewModel.metricsData && 
                     (viewModel.metricsData.totalBurgers > 0 || 
                      viewModel.metricsData.totalRevenue > 0 ||
                      viewModel.apiMetrics.length > 0);

      if (hasData) {
        viewModel.chartDataReady = true;
        viewModel.tableDataReady = true;
        transition('ready');
      } else {
        transition('noData');
      }
    } catch (err) {
      viewModel.error = 'Failed to load metrics data';
      console.error('Error loading metrics:', err);
      transition('error');
    } finally {
      viewModel.loading = false;
    }
  }).
  withMethod('refreshData', async (context) => {
    const { viewModel, transition } = context;
    try {
      viewModel.error = null;
      transition('refreshing');

      // Load all metrics data in parallel
      const [metricsResponse, performanceResponse, apiResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/metrics?timeRange=${viewModel.timeRange}`).then(res => res.json()),
        fetch('http://localhost:3001/api/metrics/performance').then(res => res.json()),
        fetch('http://localhost:3001/api/metrics/api').then(res => res.json())
      ]);

      viewModel.metricsData = metricsResponse;
      viewModel.performanceData = performanceResponse;
      viewModel.apiMetrics = apiResponse;
      viewModel.lastRefreshTime = new Date().toISOString();

      // Determine if we have data to show
      const hasData = viewModel.metricsData && 
                     (viewModel.metricsData.totalBurgers > 0 || 
                      viewModel.metricsData.totalRevenue > 0 ||
                      viewModel.apiMetrics.length > 0);

      if (hasData) {
        viewModel.chartDataReady = true;
        viewModel.tableDataReady = true;
        transition('ready');
      } else {
        transition('noData');
      }
    } catch (err) {
      viewModel.error = 'Failed to refresh metrics data';
      console.error('Error refreshing metrics:', err);
      transition('error');
    }
  }).
  withMethod('setTimeRange', (context) => {
    const { viewModel } = context;
    viewModel.timeRange = viewModel.lastPayload as string;
    viewModel.chartDataReady = false;
    viewModel.tableDataReady = false;
  }).
  withMethod('toggleCharts', (context) => {
    const { viewModel } = context;
    viewModel.showCharts = !viewModel.showCharts;
  }).
  withMethod('toggleTables', (context) => {
    const { viewModel } = context;
    viewModel.showTables = !viewModel.showTables;
  }).
  withMethod('togglePerformanceMetrics', (context) => {
    const { viewModel } = context;
    viewModel.showPerformanceMetrics = !viewModel.showPerformanceMetrics;
  }).
  withMethod('toggleApiMetrics', (context) => {
    const { viewModel } = context;
    viewModel.showApiMetrics = !viewModel.showApiMetrics;
  }).
  withMethod('toggleErrorLogs', (context) => {
    const { viewModel } = context;
    viewModel.showErrorLogs = !viewModel.showErrorLogs;
  }).
  withMethod('toggleAutoRefresh', (context) => {
    const { viewModel } = context;
    viewModel.autoRefreshEnabled = !viewModel.autoRefreshEnabled;
  }).
  withMethod('setRefreshInterval', (context) => {
    const { viewModel } = context;
    viewModel.refreshInterval = viewModel.lastPayload as number;
  }).
  withMethod('clearError', (context) => {
    const { viewModel } = context;
    viewModel.error = null;
  }).
  withMethod('startAutoRefresh', (context) => {
    const { viewModel } = context;
    if (viewModel.autoRefreshEnabled && viewModel.refreshInterval > 0) {
      // This would typically be handled by the component with useEffect
      // The state machine just tracks the state
      viewModel.autoRefreshEnabled = true;
    }
  }).
  withMethod('stopAutoRefresh', (context) => {
    const { viewModel } = context;
    viewModel.autoRefreshEnabled = false;
  });
}; 