import React from 'react';
import { createAdminTab } from '../machines/AdminTabStateMachine';
import { createView } from '../core/ViewMachine';

const API_BASE = 'http://localhost:3001/api';

interface Register {
  totalSales: number;
  totalBurgers: number;
  dailySales: number;
  lastReset: string;
}

interface Burger {
  id: number;
  state: string;
  isHungry: boolean;
  ingredients: string[];
  totalCost: number;
  createdAt: string;
  logs: Array<{
    level: string;
    message: string;
    timestamp: string;
    ingredients?: string[];
    totalCost?: number;
  }>;
}

interface Receipt {
  id: number;
  burgerId: number;
  items: string[];
  totalCost: number;
  timestamp: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  // Create the state machine
  const adminMachine = createAdminTab({
    machineId: 'admin-dashboard',
    adminKey: 'fishburger-admin-2024'
  });

  // Create the view machine with container for tab navigation
  const adminView = createView({
    machineId: 'admin-dashboard-view',
    states: ['register', 'receipts', 'burgers', 'cleanup'],
    render: (props: any) => {
      // Default render - this should never be called since we have state-specific renders
      return <div>Select a tab</div>;
    },
    machines: { adminMachine },
    container: ({ children }: any) => {
      const viewModel = adminMachine.getViewModel();
      
      return (
        <div className="admin-dashboard-container">
          {/* Login Section */}
          {!viewModel.isAuthenticated && (
            <div className="admin-login">
              <h2>Admin Login</h2>
              <div className="login-form">
                <input
                  type="password"
                  placeholder="Enter admin key"
                  value={viewModel.adminKey}
                  onChange={(e) => {
                    viewModel.lastPayload = e.target.value;
                    adminMachine.sendMessage('login', e.target.value);
                  }}
                />
                <button
                  onClick={() => adminMachine.sendMessage('login', viewModel.adminKey)}
                  disabled={viewModel.loading}
                >
                  {viewModel.loading ? 'Logging in...' : 'Login'}
                </button>
              </div>
              {viewModel.message && (
                <div className="login-message">{viewModel.message}</div>
              )}
            </div>
          )}

          {/* Admin Content */}
          {viewModel.isAuthenticated && (
            <div className="admin-content">
              {/* Header */}
              <div className="admin-header">
                <h2>Admin Dashboard</h2>
                <div className="admin-actions">
                  <button
                    onClick={() => adminMachine.sendMessage('fetchData')}
                    disabled={viewModel.loading}
                  >
                    {viewModel.loading ? 'Loading...' : 'Refresh Data'}
                  </button>
                </div>
              </div>

              {/* Message Display */}
              {viewModel.message && (
                <div className="admin-message">{viewModel.message}</div>
              )}

              {/* Tab Navigation */}
              <div className="admin-tabs">
                <button
                  className={`tab-button ${viewModel.currentTab === 'register' ? 'active' : ''}`}
                  onClick={() => adminMachine.sendMessage('switchTab', 'register')}
                >
                  Register
                </button>
                <button
                  className={`tab-button ${viewModel.currentTab === 'receipts' ? 'active' : ''}`}
                  onClick={() => adminMachine.sendMessage('switchTab', 'receipts')}
                >
                  Receipts
                </button>
                <button
                  className={`tab-button ${viewModel.currentTab === 'burgers' ? 'active' : ''}`}
                  onClick={() => adminMachine.sendMessage('switchTab', 'burgers')}
                >
                  Burgers
                </button>
                <button
                  className={`tab-button ${viewModel.currentTab === 'cleanup' ? 'active' : ''}`}
                  onClick={() => adminMachine.sendMessage('switchTab', 'cleanup')}
                >
                  Cleanup
                </button>
              </div>

              {/* Tab Content */}
              {children}
            </div>
          )}
        </div>
      );
    }
  })
  .withState('register', (props: any) => {
    const viewModel = adminMachine.getViewModel();
    return (
      <div className="tab-content">
        <h3>Register Information</h3>
        {viewModel.register ? (
          <div className="register-info">
            <div className="info-item">
              <label>Total Sales:</label>
              <span>${viewModel.register.totalSales?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="info-item">
              <label>Total Burgers:</label>
              <span>{viewModel.register.totalBurgers || 0}</span>
            </div>
            <div className="info-item">
              <label>Daily Sales:</label>
              <span>${viewModel.register.dailySales?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        ) : (
          <div className="no-data">No register data available</div>
        )}
      </div>
    );
  })
  .withState('receipts', (props: any) => {
    const viewModel = adminMachine.getViewModel();
    return (
      <div className="tab-content">
        <h3>Receipts</h3>
        {viewModel.receipts && viewModel.receipts.length > 0 ? (
          <div className="receipts-list">
            {viewModel.receipts.map((receipt: any, index: number) => (
              <div key={index} className="receipt-item">
                <div className="receipt-header">
                  <span className="receipt-id">Receipt #{receipt.id}</span>
                  <span className="receipt-date">
                    {new Date(receipt.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="receipt-details">
                  <span className="receipt-amount">${receipt.total?.toFixed(2) || '0.00'}</span>
                  <span className="receipt-items">{receipt.items?.length || 0} items</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No receipts available</div>
        )}
      </div>
    );
  })
  .withState('burgers', (props: any) => {
    const viewModel = adminMachine.getViewModel();
    return (
      <div className="tab-content">
        <h3>All Burgers ({viewModel.burgers.length})</h3>
        {viewModel.burgers && viewModel.burgers.length > 0 ? (
          <div className="burgers-list">
            {viewModel.burgers.map((burger: any) => (
              <div key={burger.id} className="burger-item">
                <div className="burger-info">
                  <span className="burger-id">#{burger.id}</span>
                  <span className={`burger-state ${burger.state.toLowerCase()}`}>
                    {burger.state}
                  </span>
                  <span className="burger-ingredients">
                    {burger.ingredients?.join(', ') || 'No ingredients'}
                  </span>
                  {burger.totalCost && (
                    <span className="burger-cost">${burger.totalCost.toFixed(2)}</span>
                  )}
                </div>
                <div className="burger-meta">
                  <span className="burger-date">
                    {new Date(burger.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No burgers available</div>
        )}
      </div>
    );
  })
  .withState('cleanup', (props: any) => {
    const viewModel = adminMachine.getViewModel();
    return (
      <div className="tab-content">
        <h3>Cleanup Operations</h3>
        <div className="cleanup-actions">
          <div className="cleanup-section">
            <h4>Clear Register</h4>
            <p>This will reset all sales data and clear the register.</p>
            <button
              className="danger-button"
              onClick={() => adminMachine.sendMessage('clearRegister')}
              disabled={viewModel.loading}
            >
              {viewModel.loading ? 'Clearing...' : 'Clear Register'}
            </button>
          </div>

          <div className="cleanup-section">
            <h4>Clear All Burgers</h4>
            <p>This will remove all burgers from the system.</p>
            <button
              className="danger-button"
              onClick={() => adminMachine.sendMessage('clearBurgers')}
              disabled={viewModel.loading}
            >
              {viewModel.loading ? 'Clearing...' : 'Clear All Burgers'}
            </button>
          </div>
        </div>

        <div className="cleanup-warning">
          <p><strong>Warning:</strong> These operations cannot be undone!</p>
        </div>
      </div>
    );
  })(adminMachine);

  return (
    <div className="admin-dashboard-wrapper">
      {adminView.render({})}
    </div>
  );
};

export default AdminDashboard; 