import React, { ReactNode, ErrorInfo, useEffect, useState, lazy, Suspense } from 'react';
import { useEditorTome } from '../editor/hooks/useEditorTome';
import { ErrorBoundary } from './ErrorBoundary';
import { LintResultsDisplay } from './LintResultsDisplay';
import type { LintResult, LintSummary } from '../services/linter-service';
// CSS import - webpack will handle this via css-loader
import './GenericEditor.css';

// Lazy load DiffViewer to avoid bundling ace-editor when not needed
// This prevents ace-editor from being loaded in the extension unless the review modal is opened
const DiffViewer = lazy(() => import('./DiffViewer').then(module => ({ default: module.DiffViewer })));

interface GenericEditorProps {
  title: string;
  description: string;
  children?: ReactNode;
  componentId?: string;
  onError?: (error: Error, errorInfo?: ErrorInfo) => void;
}

/**
 * GenericEditor Component (Tome-Integrated)
 * 
 * Enhanced editor with full Tome architecture integration.
 * Always uses EditorTome for state management - this is the editor UI component.
 * Components can use tome architecture without this UI by using ErrorBoundary directly.
 */
const GenericEditor: React.FC<GenericEditorProps> = ({ 
  title, 
  description, 
  children,
  componentId,
  onError
}) => {
  // Always use Tome architecture - GenericEditor IS the editor UI
  const tomeState = useEditorTome(componentId);

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

  // Always render with Tome integration - GenericEditor always uses tome architecture
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
          <p>🔗 TomeConnector & ViewStateMachine (Editor UI Enabled)</p>
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

                {/* File Diff - Lazy loaded to avoid bundling ace-editor unless needed */}
                <div className="diff-section">
                  <h3>📄 File Changes</h3>
                  <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading diff viewer...</div>}>
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
                  </Suspense>
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
};

export default GenericEditor;
