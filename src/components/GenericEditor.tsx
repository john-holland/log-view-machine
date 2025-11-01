import React, { Component, ReactNode, ErrorInfo, useEffect, useState } from 'react';
import { useEditorTome } from '../editor/hooks/useEditorTome';
import { DiffViewer } from './DiffViewer';
import { LintResultsDisplay } from './LintResultsDisplay';
import type { LintResult, LintSummary } from '../services/linter-service';
// CSS import - webpack will handle this via css-loader
import './GenericEditor.css';

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

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lintResults, setLintResults] = useState<{ results: LintResult[]; summary: LintSummary } | null>(null);
  const [reviewLink, setReviewLink] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [isLinting, setIsLinting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentFile, setCommentFile] = useState('');
  const [commentLine, setCommentLine] = useState<number | null>(null);

  // Handle errors from Tome
  useEffect(() => {
    if (tomeState?.error && onError) {
      const error = new Error(tomeState.error);
      onError(error, { componentStack: '' });
    }
  }, [tomeState?.error, onError]);

  // Store original content when component loads
  useEffect(() => {
    if (tomeState?.currentComponent?.content && !originalContent) {
      setOriginalContent(tomeState.currentComponent.content);
    }
  }, [tomeState?.currentComponent, originalContent]);

  // Handle review button click
  const handleReview = async () => {
    if (!tomeState?.currentComponent) return;

    setIsLinting(true);

    try {
      // Generate shareable review link
      const link = `${window.location.origin}/review/${componentId}`;
      setReviewLink(link);

      // Run linter
      const files = [{ 
        name: 'component.tsx', 
        content: tomeState.currentComponent.content || '' 
      }];

      const response = await fetch('/api/lint/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      });

      const lintData = await response.json();
      setLintResults(lintData);

      setShowReviewModal(true);
    } catch (error) {
      console.error('Failed to run linter:', error);
      alert('Failed to run linter. Please try again.');
    } finally {
      setIsLinting(false);
    }
  };

  // Handle submit for review
  const handleSubmitForReview = () => {
    console.log('📤 Submitting for review:', componentId);
    // TODO: Call submission API
    alert('Mod submitted for review!');
    setShowReviewModal(false);
  };

  // Handle add comment
  const handleAddComment = (fileName: string, line: number) => {
    setCommentFile(fileName);
    setCommentLine(line);
    // Scroll to comment input
    document.getElementById('comment-input')?.focus();
  };

  // Handle save comment
  const handleSaveComment = () => {
    if (!newComment.trim()) return;

    console.log('💬 Adding comment:', {
      file: commentFile,
      line: commentLine,
      text: newComment,
      author: 'current-user', // TODO: Get from auth
    });

    // TODO: Save comment to backend
    setNewComment('');
    setCommentFile('');
    setCommentLine(null);
  };

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
            <button
              onClick={handleReview}
              disabled={!tomeState.currentComponent || isLinting}
              style={{
                padding: '8px 16px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                marginLeft: '8px'
              }}
            >
              {isLinting ? '🔍 Linting...' : '👀 Review'}
            </button>
          </div>
          <p>🔗 TomeConnector & ViewStateMachine {useTomeArchitecture && '(Tome Architecture Enabled)'}</p>
        </footer>

        {/* Review Modal */}
        {showReviewModal && (
          <div className="review-modal-overlay" onClick={() => setShowReviewModal(false)}>
            <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="review-modal-header">
                <h2>👀 Review Changes</h2>
                <button className="close-btn" onClick={() => setShowReviewModal(false)}>×</button>
              </div>

              {/* Modal Body */}
              <div className="review-modal-body">
                {/* Review Link */}
                <div className="review-link-section">
                  <label><strong>Shareable Review Link:</strong></label>
                  <div className="review-link-input-group">
                    <input 
                      type="text" 
                      value={reviewLink} 
                      readOnly 
                      className="review-link-input"
                    />
                    <button
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(reviewLink);
                        alert('Link copied!');
                      }}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="help-text">Anyone with this link can view your mod</p>
                </div>

                {/* File Diff */}
                <div className="diff-section">
                  <h3>📄 File Changes</h3>
                  <DiffViewer
                    files={[{
                      fileName: 'component.tsx',
                      oldContent: originalContent,
                      newContent: tomeState?.currentComponent?.content || '',
                      language: 'typescript',
                    }]}
                    onAddComment={handleAddComment}
                    showAddCommentButtons={false}
                  />
                </div>

                {/* Lint Results */}
                {lintResults && (
                  <div className="lint-section">
                    <h3>🔍 Lint Results</h3>
                    <LintResultsDisplay
                      results={lintResults.results}
                      summary={lintResults.summary}
                      onRuleClick={(ruleId) => {
                        window.open(`/api/lint/rules/${ruleId}`, '_blank');
                      }}
                    />
                  </div>
                )}

                {/* Comment Section */}
                <div className="comment-section">
                  <h3>💬 Add Comment</h3>
                  {commentLine && (
                    <div className="comment-context">
                      <span>Commenting on {commentFile}:{commentLine}</span>
                      <button onClick={() => { setCommentFile(''); setCommentLine(null); }}>×</button>
                    </div>
                  )}
                  <textarea
                    id="comment-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment... (supports Markdown)"
                    rows={4}
                    className="comment-textarea"
                  />
                  <button
                    className="save-comment-btn"
                    onClick={handleSaveComment}
                    disabled={!newComment.trim()}
                  >
                    💬 Save Comment
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="review-modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                  <button
                  className="btn-primary"
                  onClick={handleSubmitForReview}
                  disabled={!!(lintResults && lintResults.summary.errors > 0)}
                  title={
                    lintResults && lintResults.summary.errors > 0
                      ? 'Fix linter errors before submitting'
                      : 'Submit mod for review'
                  }
                >
                  📤 Submit for Review
                </button>
              </div>
            </div>
          </div>
        )}
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
