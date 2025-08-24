import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface GenericEditorProps {
  title: string;
  description: string;
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

class ErrorBoundary extends Component<{ children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void }) {
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

  render() {
    if (this.state.hasError) {
      return (
        <div className="generic-editor error-editor">
          <header className="editor-header error-header">
            <h1 className="editor-title">🚨 Error Boundary</h1>
            <p className="editor-description">Something went wrong while rendering this component</p>
          </header>
          
          <main className="editor-main">
            <div className="error-content">
              <div className="error-icon">⚠️</div>
              <h2>Component Error Detected</h2>
              <p>An error occurred while rendering this component. The error boundary has caught it and prevented the entire app from crashing.</p>
              
              <div className="error-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                >
                  🔄 Try Again
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => window.location.reload()}
                >
                  🔄 Reload Page
                </button>
              </div>
              
              <details className="error-details">
                <summary className="error-summary">
                  🔍 View Error Details
                </summary>
                <div className="error-stack-container">
                  <div className="error-stack-section">
                    <h4>Error Message:</h4>
                    <pre className="error-stack">
                      {this.state.error?.toString() || 'Unknown error'}
                    </pre>
                  </div>
                  
                  {this.state.errorInfo?.componentStack && (
                    <div className="error-stack-section">
                      <h4>Component Stack:</h4>
                      <pre className="error-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  
                  <div className="error-stack-section">
                    <h4>Error Time:</h4>
                    <p>{new Date().toLocaleString()}</p>
                  </div>
                </div>
              </details>
            </div>
          </main>
          
          <footer className="editor-footer">
            <p>🔗 TomeConnector Error Boundary - Keeping your app stable</p>
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}

const GenericEditor: React.FC<GenericEditorProps> = ({ 
  title, 
  description, 
  children, 
  onError 
}) => {
  return (
    <div className="generic-editor">
      <header className="editor-header">
        <h1 className="editor-title">{title}</h1>
        <p className="editor-description">{description}</p>
      </header>
      
      <main className="editor-main">
        <ErrorBoundary onError={onError}>
          {children}
        </ErrorBoundary>
      </main>
      
      <footer className="editor-footer">
        <p>🔗 TomeConnector & ViewStateMachine</p>
      </footer>
    </div>
  );
};

export default GenericEditor;
