import React from 'react';
import {
  StructuralRouter,
  Route,
  RouteFallback,
  StructuralTomeConnector,
  useRouter,
  DefaultStructuralConfig,
  createStructuralConfig
} from '../index';

// Example dashboard component
const Dashboard: React.FC = () => {
  const { structuralSystem } = useRouter();
  
  return (
    <StructuralTomeConnector
      componentName="dashboard"
      structuralSystem={structuralSystem}
      initialModel={{ title: 'Dashboard', items: [] }}
    >
      {(context) => (
        <div className="dashboard">
          <h2>{context.model.title}</h2>
          <p>Current State: {context.currentState}</p>
          <button onClick={() => context.sendEvent({ type: 'LOAD' })}>
            Load Dashboard
          </button>
          <button onClick={() => context.sendEvent({ type: 'REFRESH' })}>
            Refresh
          </button>
        </div>
      )}
    </StructuralTomeConnector>
  );
};

// Example log viewer component
const LogViewer: React.FC = () => {
  const { structuralSystem } = useRouter();
  
  return (
    <StructuralTomeConnector
      componentName="log-viewer"
      structuralSystem={structuralSystem}
      initialModel={{ logs: [], filters: {} }}
    >
      {(context) => (
        <div className="log-viewer">
          <h2>Log Viewer</h2>
          <p>Current State: {context.currentState}</p>
          <div className="controls">
            <button onClick={() => context.sendEvent({ type: 'LOAD_LOGS' })}>
              Load Logs
            </button>
            <button onClick={() => context.sendEvent({ type: 'FILTER' })}>
              Apply Filters
            </button>
            <button onClick={() => context.sendEvent({ type: 'EXPORT' })}>
              Export
            </button>
          </div>
          <div className="logs">
            {context.model.logs.length > 0 ? (
              <ul>
                {context.model.logs.map((log: any, index: number) => (
                  <li key={index}>{log.message}</li>
                ))}
              </ul>
            ) : (
              <p>No logs loaded</p>
            )}
          </div>
        </div>
      )}
    </StructuralTomeConnector>
  );
};

// Example state machine component
const StateMachine: React.FC = () => {
  const { structuralSystem } = useRouter();
  
  return (
    <StructuralTomeConnector
      componentName="state-machine"
      structuralSystem={structuralSystem}
      initialModel={{ machine: null, states: [] }}
    >
      {(context) => (
        <div className="state-machine">
          <h2>State Machine</h2>
          <p>Current State: {context.currentState}</p>
          <div className="controls">
            <button onClick={() => context.sendEvent({ type: 'LOAD_MACHINE' })}>
              Load Machine
            </button>
            <button onClick={() => context.sendEvent({ type: 'VISUALIZE' })}>
              Visualize
            </button>
            <button onClick={() => context.sendEvent({ type: 'EDIT' })}>
              Edit
            </button>
          </div>
          {context.model.machine && (
            <div className="machine-info">
              <h3>Machine: {context.model.machine.id}</h3>
              <p>States: {context.model.states.join(', ')}</p>
            </div>
          )}
        </div>
      )}
    </StructuralTomeConnector>
  );
};

// Example tome manager component
const TomeManager: React.FC = () => {
  const { structuralSystem } = useRouter();
  
  return (
    <StructuralTomeConnector
      componentName="tome-manager"
      structuralSystem={structuralSystem}
      initialModel={{ tomes: [] }}
    >
      {(context) => (
        <div className="tome-manager">
          <h2>Tome Manager</h2>
          <p>Current State: {context.currentState}</p>
          <div className="controls">
            <button onClick={() => context.sendEvent({ type: 'LOAD_TOMES' })}>
              Load Tomes
            </button>
            <button onClick={() => context.sendEvent({ type: 'CREATE' })}>
              Create Tome
            </button>
            <button onClick={() => context.sendEvent({ type: 'EDIT' })}>
              Edit Tome
            </button>
          </div>
          <div className="tomes">
            {context.model.tomes.length > 0 ? (
              <ul>
                {context.model.tomes.map((tome: any, index: number) => (
                  <li key={index}>{tome.name}</li>
                ))}
              </ul>
            ) : (
              <p>No tomes loaded</p>
            )}
          </div>
        </div>
      )}
    </StructuralTomeConnector>
  );
};

// Example settings component
const Settings: React.FC = () => {
  const { structuralSystem } = useRouter();
  
  return (
    <StructuralTomeConnector
      componentName="settings"
      structuralSystem={structuralSystem}
      initialModel={{ theme: 'light', language: 'en' }}
    >
      {(context) => (
        <div className="settings">
          <h2>Settings</h2>
          <p>Current State: {context.currentState}</p>
          <div className="controls">
            <button onClick={() => context.sendEvent({ type: 'LOAD_SETTINGS' })}>
              Load Settings
            </button>
            <button onClick={() => context.sendEvent({ type: 'EDIT' })}>
              Edit
            </button>
            <button onClick={() => context.sendEvent({ type: 'SAVE' })}>
              Save
            </button>
          </div>
          <div className="settings-form">
            <label>
              Theme:
              <select
                value={context.model.theme}
                onChange={(e) => context.updateModel({ theme: e.target.value })}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Language:
              <select
                value={context.model.language}
                onChange={(e) => context.updateModel({ language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </StructuralTomeConnector>
  );
};

// Main structural example component
export const StructuralExample: React.FC = () => {
  // Create a custom structural configuration
  const customConfig = createStructuralConfig({
    AppStructure: {
      id: 'custom-log-view-machine',
      name: 'Custom Log View Machine',
      type: 'application',
      routing: {
        base: '/',
        defaultRoute: '/dashboard'
      }
    }
  });

  return (
    <StructuralRouter
      config={customConfig}
      initialRoute="/dashboard"
      onRouteChange={(route) => console.log('Route changed to:', route)}
    >
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/log-viewer" component={LogViewer} />
      <Route path="/state-machine" component={StateMachine} />
      <Route path="/tome-manager" component={TomeManager} />
      <Route path="/settings" component={Settings} />
      <Route path="/" component={Dashboard} />
      <Route path="*" component={RouteFallback} />
    </StructuralRouter>
  );
};

// Export the example
export default StructuralExample;
