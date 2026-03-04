import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { StructuralSystem, AppStructureConfig, RouteConfig, NavigationItem } from './StructuralSystem';

// Router context
export interface RouterContextType {
  currentRoute: string;
  navigate: (path: string) => void;
  goBack: () => void;
  breadcrumbs: NavigationItem[];
  structuralSystem: StructuralSystem;
}

const RouterContext = createContext<RouterContextType | null>(null);

// Router hook
export function useRouter(): RouterContextType {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a StructuralRouter');
  }
  return context;
}

// Router props
interface StructuralRouterProps {
  config: AppStructureConfig;
  initialRoute?: string;
  onRouteChange?: (route: string) => void;
  children: ReactNode;
}

// Main router component
export const StructuralRouter: React.FC<StructuralRouterProps> = ({
  config,
  initialRoute = '/',
  onRouteChange,
  children
}) => {
  const [currentRoute, setCurrentRoute] = useState(initialRoute);
  const [routeHistory, setRouteHistory] = useState<string[]>([initialRoute]);
  const [structuralSystem] = useState(() => new StructuralSystem(config));

  // Handle route changes
  const navigate = (path: string) => {
    const route = structuralSystem.findRoute(path);
    if (route) {
      setCurrentRoute(path);
      setRouteHistory(prev => [...prev, path]);
      onRouteChange?.(path);
    } else {
      console.warn(`Route not found: ${path}`);
    }
  };

  // Handle back navigation
  const goBack = () => {
    if (routeHistory.length > 1) {
      const newHistory = routeHistory.slice(0, -1);
      const previousRoute = newHistory[newHistory.length - 1];
      setCurrentRoute(previousRoute);
      setRouteHistory(newHistory);
      onRouteChange?.(previousRoute);
    }
  };

  // Get breadcrumbs for current route
  const breadcrumbs = structuralSystem.getBreadcrumbs(currentRoute);

  // Context value
  const contextValue: RouterContextType = {
    currentRoute,
    navigate,
    goBack,
    breadcrumbs,
    structuralSystem
  };

  // Handle initial route validation
  useEffect(() => {
    const route = structuralSystem.findRoute(initialRoute);
    if (!route) {
      console.warn(`Initial route not found: ${initialRoute}`);
      // Try to find a valid default route
      const defaultRoute = config.RoutingConfig.routes.find(r => r.component)?.path;
      if (defaultRoute && defaultRoute !== initialRoute) {
        setCurrentRoute(defaultRoute);
        setRouteHistory([defaultRoute]);
        onRouteChange?.(defaultRoute);
      }
    }
  }, [initialRoute, structuralSystem, config.RoutingConfig.routes, onRouteChange]);

  return (
    <RouterContext.Provider value={contextValue}>
      <div className="structural-router">
        <RouterHeader />
        <div className="router-content">
          <RouterSidebar />
          <RouterMain>
            {children}
          </RouterMain>
        </div>
      </div>
    </RouterContext.Provider>
  );
};

// Router header component
const RouterHeader: React.FC = () => {
  const { currentRoute, breadcrumbs, goBack } = useRouter();
  
  return (
    <header className="router-header">
      <div className="header-content">
        <h1 className="router-title">Log View Machine</h1>
        <nav className="breadcrumb-nav">
          {breadcrumbs.map((item, index) => (
            <span key={item.id} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              <span className="breadcrumb-label">{item.label}</span>
            </span>
          ))}
        </nav>
      </div>
      <button 
        className="back-button" 
        onClick={goBack}
        disabled={breadcrumbs.length <= 1}
      >
        ← Back
      </button>
    </header>
  );
};

// Router sidebar component
const RouterSidebar: React.FC = () => {
  const { structuralSystem, navigate, currentRoute } = useRouter();
  const config = structuralSystem.getRoutingConfig();
  
  const renderNavigationItems = (items: NavigationItem[]) => {
    return items.map(item => (
      <div key={item.id} className="nav-item">
        <button
          className={`nav-button ${currentRoute === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          {item.icon && <span className="nav-icon">{item.icon}</span>}
          <span className="nav-label">{item.label}</span>
        </button>
        {item.children && (
          <div className="nav-children">
            {renderNavigationItems(item.children)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <aside className="router-sidebar">
      <nav className="primary-navigation">
        <h3 className="nav-section-title">Primary</h3>
        {renderNavigationItems(config.navigation.primary)}
      </nav>
      {config.navigation.secondary && (
        <nav className="secondary-navigation">
          <h3 className="nav-section-title">Secondary</h3>
          {renderNavigationItems(config.navigation.secondary)}
        </nav>
      )}
    </aside>
  );
};

// Router main content area
const RouterMain: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <main className="router-main">
      {children}
    </main>
  );
};

// Route component for rendering specific routes
interface RouteProps {
  path: string;
  component: React.ComponentType<any>;
  fallback?: React.ComponentType<any>;
}

export const Route: React.FC<RouteProps> = ({ path, component: Component, fallback: Fallback }) => {
  const { currentRoute, structuralSystem } = useRouter();
  
  if (currentRoute === path) {
    return <Component />;
  }
  
  if (Fallback) {
    return <Fallback />;
  }
  
  return null;
};

// Default fallback component
export const RouteFallback: React.FC = () => {
  const { currentRoute } = useRouter();
  
  return (
    <div className="route-fallback">
      <h2>Route Not Found</h2>
      <p>The route "{currentRoute}" could not be found.</p>
    </div>
  );
};

// Export the router components
export default StructuralRouter;
