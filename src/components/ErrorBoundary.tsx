import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo?: ErrorInfo) => void;
  fallback?: (error: Error, errorInfo: ErrorInfo | undefined, retry: () => void) => ReactNode;
}

/**
 * ErrorBoundary Component
 * 
 * Catches React errors in child components and displays a fallback UI.
 * Can be used independently without GenericEditor dependencies.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleRetry);
      }

      // Default fallback UI
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#fff5f5'
        }}>
          <h3 style={{ color: '#ff6b6b', marginTop: 0 }}>⚠️ Something went wrong</h3>
          <p style={{ color: '#333' }}>
            {this.state.error.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

