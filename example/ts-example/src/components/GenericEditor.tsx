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
        <div className="error-boundary">
          <div className="error-content">
            <h2>🚨 Something went wrong</h2>
            <p>An error occurred while rendering this component.</p>
            <details className="error-details">
              <summary>Error Details</summary>
              <pre className="error-stack">
                {this.state.error?.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
            <button 
              className="error-retry"
              onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            >
              🔄 Try Again
            </button>
          </div>
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
        <p>Powered by TomeConnector & ViewStateMachine</p>
      </footer>
    </div>
  );
};

export default GenericEditor;
