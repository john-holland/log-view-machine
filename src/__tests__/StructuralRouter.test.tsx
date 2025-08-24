import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StructuralRouter, Route, RouteFallback, useRouter } from '../core/StructuralRouter';
import { DefaultStructuralConfig } from '../core/DefaultStructuralConfig';

// Test component that uses the router
const TestComponent: React.FC = () => {
  const { currentRoute, navigate, goBack, breadcrumbs } = useRouter();
  
  return (
    <div>
      <div data-testid="current-route">Current: {currentRoute}</div>
      <div data-testid="breadcrumbs">
        {breadcrumbs.map(item => (
          <span key={item.id} data-testid={`breadcrumb-${item.id}`}>
            {item.label}
          </span>
        ))}
      </div>
      <button onClick={() => navigate('/log-viewer')} data-testid="nav-log-viewer">
        Go to Log Viewer
      </button>
      <button onClick={() => navigate('/state-machine')} data-testid="nav-state-machine">
        Go to State Machine
      </button>
      <button onClick={goBack} data-testid="go-back">
        Go Back
      </button>
    </div>
  );
};

// Test route components
const Dashboard: React.FC = () => <div data-testid="dashboard">Dashboard Content</div>;
const LogViewer: React.FC = () => <div data-testid="log-viewer">Log Viewer Content</div>;
const StateMachine: React.FC = () => <div data-testid="state-machine">State Machine Content</div>;

describe('StructuralRouter', () => {
  const mockOnRouteChange = jest.fn();

  beforeEach(() => {
    mockOnRouteChange.mockClear();
  });

  it('should render with default route', () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/log-viewer" component={LogViewer} />
        <Route path="/state-machine" component={StateMachine} />
      </StructuralRouter>
    );

    expect(screen.getByTestId('current-route')).toHaveTextContent('Current: /dashboard');
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should navigate between routes', async () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/log-viewer" component={LogViewer} />
        <Route path="/state-machine" component={StateMachine} />
      </StructuralRouter>
    );

    // Navigate to log viewer
    fireEvent.click(screen.getByTestId('nav-log-viewer'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-route')).toHaveTextContent('Current: /log-viewer');
      expect(screen.getByTestId('log-viewer')).toBeInTheDocument();
    });

    expect(mockOnRouteChange).toHaveBeenCalledWith('/log-viewer');
  });

  it('should handle back navigation', async () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/log-viewer" component={LogViewer} />
        <Route path="/state-machine" component={StateMachine} />
      </StructuralRouter>
    );

    // Navigate to log viewer first
    fireEvent.click(screen.getByTestId('nav-log-viewer'));
    await waitFor(() => {
      expect(screen.getByTestId('current-route')).toHaveTextContent('Current: /log-viewer');
    });

    // Go back
    fireEvent.click(screen.getByTestId('go-back'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-route')).toHaveTextContent('Current: /dashboard');
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('should generate breadcrumbs', () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
      </StructuralRouter>
    );

    const breadcrumbs = screen.getByTestId('breadcrumbs');
    expect(breadcrumbs).toBeInTheDocument();
  });

  it('should handle invalid initial route gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/invalid-route"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
      </StructuralRouter>
    );

    expect(consoleSpy).toHaveBeenCalledWith('Initial route not found: /invalid-route');
    consoleSpy.mockRestore();
  });

  it('should render navigation sidebar', () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/log-viewer" component={LogViewer} />
        <Route path="/state-machine" component={StateMachine} />
      </StructuralRouter>
    );

    // Check for navigation elements
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Log Viewer')).toBeInTheDocument();
    expect(screen.getByText('State Machine')).toBeInTheDocument();
  });

  it('should handle route fallback', () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/non-existent"
        onRouteChange={mockOnRouteChange}
      >
        <TestComponent />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="*" component={RouteFallback} />
      </StructuralRouter>
    );

    expect(screen.getByText('Route Not Found')).toBeInTheDocument();
    expect(screen.getByText(/The route ".*" could not be found/)).toBeInTheDocument();
  });
});

describe('Route component', () => {
  it('should render component when route matches', () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
      >
        <Route path="/dashboard" component={Dashboard} />
      </StructuralRouter>
    );

    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('should not render component when route does not match', () => {
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
      >
        <Route path="/log-viewer" component={LogViewer} />
      </StructuralRouter>
    );

    expect(screen.queryByTestId('log-viewer')).not.toBeInTheDocument();
  });

  it('should render fallback when provided and route does not match', () => {
    const FallbackComponent = () => <div data-testid="fallback">Fallback Content</div>;
    
    render(
      <StructuralRouter
        config={DefaultStructuralConfig}
        initialRoute="/dashboard"
      >
        <Route 
          path="/log-viewer" 
          component={LogViewer} 
          fallback={FallbackComponent}
        />
      </StructuralRouter>
    );

    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });
});

describe('useRouter hook', () => {
  it('should throw error when used outside of StructuralRouter', () => {
    const TestHookComponent = () => {
      try {
        useRouter();
        return <div>No error</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    };

    render(<TestHookComponent />);
    
    expect(screen.getByTestId('error')).toHaveTextContent(
      'useRouter must be used within a StructuralRouter'
    );
  });
});
