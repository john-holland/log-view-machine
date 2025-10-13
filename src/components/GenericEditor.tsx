import React, { Component, ReactNode, ErrorInfo, useEffect } from 'react';
import { useEditorTome } from '../editor/hooks/useEditorTome';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface GenericEditorProps {
  title: string;
  description: string;
  children?: ReactNode;
  componentId?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  useTomeArchitecture?: boolean; // Feature flag for Tome integration
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

/**
 * GenericEditor Component (Tome-Integrated)
 * 
 * Enhanced editor with optional Tome architecture integration
 * Uses EditorTome for state management when enabled
 */
const GenericEditor: React.FC<GenericEditorProps> = ({ 
  title, 
  description, 
  children,
  componentId,
  onError,
  useTomeArchitecture = false
}) => {
  // Use Tome architecture if enabled
  const tomeState = useTomeArchitecture ? useEditorTome(componentId) : null;

  // Handle errors from Tome
  useEffect(() => {
    if (tomeState?.error && onError) {
      const error = new Error(tomeState.error);
      onError(error, { componentStack: '' });
    }
  }, [tomeState?.error, onError]);

  // Render with Tome integration
  if (useTomeArchitecture && tomeState) {
    return (
      <div className="generic-editor" data-state={tomeState.editorState}>
        <header className="editor-header">
          <h1 className="editor-title">{title}</h1>
          <p className="editor-description">{description}</p>
          <div className="editor-status" style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
            Editor: {tomeState.editorState} | Preview: {tomeState.previewState}
            {tomeState.isDirty && ' • 📝 Unsaved changes'}
          </div>
        </header>
        
        <main className="editor-main">
          <ErrorBoundary onError={onError}>
            {children}
            
            {/* Show component editor if no children */}
            {!children && tomeState.currentComponent && (
              <div className="component-editor">
                <h3>Editing: {tomeState.currentComponent.name}</h3>
                <div style={{ marginTop: '10px' }}>
                  <label>
                    Component Content:
                    <textarea
                      value={tomeState.currentComponent.content || ''}
                      onChange={(e) => tomeState.updateComponentContent(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '200px',
                        marginTop: '5px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </label>
                </div>
                
                {/* Preview area */}
                {tomeState.previewData && (
                  <div className="preview-area" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
                    <h4>Preview:</h4>
                    <div dangerouslySetInnerHTML={{ __html: tomeState.previewData.rendered }} />
                  </div>
                )}
              </div>
            )}
            
            {!children && !tomeState.currentComponent && (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>No component loaded</p>
                <button onClick={tomeState.createNewComponent}>Create New Component</button>
              </div>
            )}
          </ErrorBoundary>
        </main>
        
        <footer className="editor-footer">
          <div className="editor-actions" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button 
              onClick={tomeState.saveComponent} 
              disabled={!tomeState.isDirty || tomeState.editorState === 'saving'}
              style={{
                padding: '8px 16px',
                backgroundColor: tomeState.isDirty ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: tomeState.isDirty ? 'pointer' : 'not-allowed'
              }}
            >
              💾 {tomeState.editorState === 'saving' ? 'Saving...' : 'Save'}
            </button>
            <button 
              onClick={tomeState.previewComponent}
              disabled={tomeState.editorState !== 'editing'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              👁️ {tomeState.previewState === 'rendering' ? 'Rendering...' : 'Preview'}
            </button>
            <button 
              onClick={tomeState.cancelEditing}
              disabled={tomeState.editorState === 'idle'}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              ❌ Cancel
            </button>
          </div>
          <p>🔗 TomeConnector & ViewStateMachine {useTomeArchitecture && '(Tome Architecture Enabled)'}</p>
        </footer>
      </div>
    );
  }

  // Original non-Tome version
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
