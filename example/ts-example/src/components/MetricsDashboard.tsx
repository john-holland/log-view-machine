import React from 'react';
import { createMetricsDashboardView } from '../machines/MetricsDashboardViewStateMachine';
import { createViewStateMachine } from '../core/ViewStateMachine';

const MetricsDashboard: React.FC = () => {
  // Create the state machine
  const metricsMachine = createMetricsDashboardView({
    machineId: 'metrics-dashboard',
    autoRefreshInterval: 30000
  });

  // Create the view state machine with state-specific rendering
  const viewMachine = createViewStateMachine({
    machineId: 'metrics-dashboard-view',
    states: {
      initial: {},
      loading: {},
      ready: {},
      error: {},
      refreshing: {},
      noData: {}
    },
    defaultViewModel: metricsMachine.getViewModel(),
    defaultConfig: { machineId: 'metrics-dashboard-view' }
  })
  .withState('initial', (context) => (
    <div className="metrics-dashboard-container">
      <div className="loading-spinner">Initializing metrics...</div>
    </div>
  ))
  .withState('loading', (context) => (
    <div className="metrics-dashboard-container">
      <div className="loading-spinner">Loading metrics...</div>
    </div>
  ))
  .withState('ready', (context) => (
    <div className="metrics-dashboard-container">
      {/* Error Banner */}
      {context.viewModel.error && (
        <div className="error-banner">
          <span>{context.viewModel.error}</span>
          <button onClick={() => context.sendMessage('clearError')}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="metrics-content">
        <div className="metrics-header">
          <h2>Metrics Dashboard</h2>
          <button
            className="refresh-button"
            onClick={() => context.sendMessage('refreshData')}
            disabled={context.viewModel.loading}
          >
            {context.viewModel.loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Sales</h3>
            <div className="metric-value">
              ${context.viewModel.metricsData?.totalRevenue?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="summary-card">
            <h3>Total Burgers</h3>
            <div className="metric-value">
              {context.viewModel.metricsData?.totalBurgers || 0}
            </div>
          </div>
          <div className="summary-card">
            <h3>Average Order Time</h3>
            <div className="metric-value">
              {context.viewModel.performanceData?.avgOrderTime ? 
                `${context.viewModel.performanceData.avgOrderTime.toFixed(2)}s` : 'N/A'}
            </div>
          </div>
          <div className="summary-card">
            <h3>API Latency</h3>
            <div className="metric-value">
              {context.viewModel.performanceData?.avgApiLatency ? 
                `${context.viewModel.performanceData.avgApiLatency.toFixed(2)}ms` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {context.viewModel.showCharts && context.viewModel.chartDataReady && (
          <div className="charts-section">
            <div className="chart-container">
              <h3>Burger States Distribution</h3>
              <div className="chart-placeholder">
                <p>Chart would show burger state distribution</p>
                <ul>
                  {context.viewModel.metricsData?.stateDistribution?.map((item, index) => (
                    <li key={index}>{item.state}: {item.count}</li>
                  )) || []}
                </ul>
              </div>
            </div>

            <div className="chart-container">
              <h3>Ingredient Usage</h3>
              <div className="chart-placeholder">
                <p>Chart would show ingredient usage</p>
                <ul>
                  {context.viewModel.metricsData?.ingredientUsage?.map((item, index) => (
                    <li key={index}>{item.ingredient}: {item.count}</li>
                  )) || []}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* API Performance Table */}
        {context.viewModel.showApiMetrics && context.viewModel.tableDataReady && (
          <div className="api-performance">
            <h3>API Performance</h3>
            <div className="api-table">
              <table>
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Method</th>
                    <th>Requests</th>
                    <th>Avg Duration</th>
                    <th>Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {context.viewModel.apiMetrics.map((metric, index) => (
                    <tr key={index}>
                      <td>{metric.endpoint}</td>
                      <td>{metric.method}</td>
                      <td>{metric.request_count}</td>
                      <td>{metric.avg_duration.toFixed(2)}ms</td>
                      <td>{metric.error_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Errors */}
        {context.viewModel.showErrorLogs && context.viewModel.metricsData?.recentErrors && (
          <div className="recent-errors">
            <h3>Recent Errors</h3>
            <div className="error-list">
              {context.viewModel.metricsData.recentErrors.map((error, index) => (
                <div key={index} className="error-item">
                  <span className="error-time">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="error-type">{error.error_type}</span>
                  <span className="error-message">{error.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-section">
          <h3>Display Controls</h3>
          <div className="control-buttons">
            <button
              onClick={() => context.sendMessage('toggleCharts')}
              className={context.viewModel.showCharts ? 'active' : ''}
            >
              {context.viewModel.showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
            <button
              onClick={() => context.sendMessage('toggleApiMetrics')}
              className={context.viewModel.showApiMetrics ? 'active' : ''}
            >
              {context.viewModel.showApiMetrics ? 'Hide API Metrics' : 'Show API Metrics'}
            </button>
            <button
              onClick={() => context.sendMessage('toggleErrorLogs')}
              className={context.viewModel.showErrorLogs ? 'active' : ''}
            >
              {context.viewModel.showErrorLogs ? 'Hide Error Logs' : 'Show Error Logs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  ))
  .withState('error', (context) => (
    <div className="metrics-dashboard-container error-state">
      <div className="error-display">
        <h2>Error Loading Metrics</h2>
        <p>{context.viewModel.error}</p>
        <button onClick={() => context.sendMessage('clearError')}>Clear Error</button>
        <button onClick={() => context.sendMessage('loadMetrics')}>Retry</button>
      </div>
    </div>
  ))
  .withState('refreshing', (context) => (
    <div className="metrics-dashboard-container">
      <div className="refreshing-state">
        <div className="loading-spinner">Refreshing metrics...</div>
        <p>Please wait while we update the dashboard data.</p>
      </div>
    </div>
  ))
  .withState('noData', (context) => (
    <div className="metrics-dashboard-container">
      <div className="no-data-state">
        <h2>No Metrics Data Available</h2>
        <p>No metrics data has been collected yet.</p>
        <button onClick={() => context.sendMessage('loadMetrics')}>Load Data</button>
      </div>
    </div>
  ));

  // Get the current view model
  const viewModel = metricsMachine.getViewModel();

  return (
    <div className="metrics-dashboard-wrapper">
      {viewMachine.render({
        viewModel,
        config: { machineId: 'metrics-dashboard-view' },
        currentState: viewModel.currentState,
        sendMessage: (message: string, payload?: any) => metricsMachine.sendMessage(message, payload),
        transition: (state: string) => metricsMachine.transition(state)
      })}
    </div>
  );
};

export default MetricsDashboard; 