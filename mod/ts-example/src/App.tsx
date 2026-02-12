import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Cave, createTome, EditorWrapper } from 'log-view-machine';
import type { CaveInstance } from 'log-view-machine';
import type { TomeInstance } from 'log-view-machine';
import { RobotCopyProvider } from './context/RobotCopyContext';
import TracingScreen from './components/TracingScreen';
import ConnectionsScreen from './components/ConnectionsScreen';
import { fishBurgerTomeConfig } from './config/fishBurgerTomeConfig';
import { connectionsTomeConfig } from './config/connectionsTomeConfig';
import '../../../log-view-machine/src/styles/editor-wrapper.css';
import './index.css';

/** Spelunk: route and container describe where to render; tomeId identifies which Tome to use. */
const tsExampleSpelunk = {
  childCaves: {
    tracing: {
      route: '/tracing',
      container: 'EditorWrapper',
      tomeId: 'fish-burger-tome',
      tomes: { fishBurger: {} },
    },
    connections: {
      route: '/connections',
      container: 'main',
      tomeId: 'connections-tome',
      tomes: { order: {}, payment: {}, inventory: {} },
    },
  },
};

function TracingWithEditorWrapper({ tome }: { tome: TomeInstance | null }) {
  const location = useLocation();
  const navigate = useNavigate();
  if (!tome) return <div>Loading...</div>;
  return (
    <EditorWrapper
      title="Fish Burger with Tracing"
      description="RobotCopy integration and Unleash toggles"
      componentId="fish-burger-demo"
      router={{
        currentRoute: location.pathname,
        navigate: (path: string) => navigate(path),
      }}
    >
      <TracingScreen tome={tome} />
    </EditorWrapper>
  );
}

const App: React.FC = () => {
  const [cave, setCave] = useState<CaveInstance | null>(null);
  const [tomesRegistry, setTomesRegistry] = useState<Record<string, TomeInstance>>({});

  useEffect(() => {
    const c = Cave('ts-example', tsExampleSpelunk);
    c.initialize().then(() => setCave(c));
    setTomesRegistry({
      'fish-burger-tome': createTome(fishBurgerTomeConfig),
      'connections-tome': createTome(connectionsTomeConfig),
    });
  }, []);

  return (
    <RobotCopyProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <nav className="app-nav">
            <div className="nav-container">
              <h1>🍔 ViewStateMachine Examples</h1>
              <div className="nav-links">
                <Link to="/" className="nav-link">🏠 Home</Link>
                <Link to="/tracing" className="nav-link">🔍 Tracing Demo</Link>
                <Link to="/connections" className="nav-link">🔄 Tome Connections</Link>
              </div>
            </div>
          </nav>

          <main className="app-main">
            <Routes>
              <Route path="/" element={
                <div className="home-page">
                  <h2>Welcome to ViewStateMachine Examples</h2>
                  <p>This demonstrates the ViewStateMachine package with different approaches:</p>
                  <div className="demo-cards">
                    <div className="demo-card">
                      <h3>🔍 Tracing Demo</h3>
                      <p>Fish Burger with tracing, RobotCopy integration, and Unleash feature toggles</p>
                      <Link to="/tracing" className="demo-link">View Demo</Link>
                    </div>
                    <div className="demo-card">
                      <h3>🔄 Tome Connections</h3>
                      <p>Dynamic connections between ViewStateMachines with bidirectional state and event flow</p>
                      <Link to="/connections" className="demo-link">View Demo</Link>
                    </div>
                  </div>
                </div>
              } />
              <Route path="/tracing" element={
                cave ? (
                  (() => {
                    const target = cave.getRenderTarget('/tracing');
                    const tome = target.tomeId ? tomesRegistry[target.tomeId] ?? null : null;
                    return <TracingWithEditorWrapper tome={tome} />;
                  })()
                ) : (
                  <div>Loading...</div>
                )
              } />
              <Route path="/connections" element={
                cave ? (
                  (() => {
                    const target = cave.getRenderTarget('/connections');
                    const tome = target.tomeId ? tomesRegistry[target.tomeId] ?? null : null;
                    return <ConnectionsScreen tome={tome} />;
                  })()
                ) : (
                  <div>Loading...</div>
                )
              } />
            </Routes>
          </main>

          <footer className="app-footer">
            <p>Powered by ViewStateMachine Package</p>
          </footer>
        </div>
      </Router>
    </RobotCopyProvider>
  );
};

export default App; 