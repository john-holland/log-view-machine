import React, { ErrorInfo } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/** Router-like object from log-view-machine (e.g. RouterContextType from useRouter). */
export interface EditorWrapperRouter {
  currentRoute?: string;
  navigate?: (path: string) => void;
  [key: string]: unknown;
}

export interface EditorWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  componentId?: string;
  onError?: (error: Error, errorInfo?: ErrorInfo) => void;
  router?: EditorWrapperRouter;
  hideHeader?: boolean;
}

/**
 * EditorWrapper – first-class editor option from wave-reader alignment.
 * Lightweight wrapper with ErrorBoundary; use for 3-panel tabbed editor or mod-building UI.
 * Zero ace-editor dependency; tree-shakeable.
 */
const EditorWrapper: React.FC<EditorWrapperProps> = ({
  title,
  description,
  children,
  componentId,
  onError,
  router,
  hideHeader = false,
}) => {
  return (
    <ErrorBoundary onError={onError}>
      <div className="editor-wrapper" data-component-id={componentId}>
        {!hideHeader && (
          <header className="editor-wrapper-header">
            <h2 className="editor-wrapper-title">{title}</h2>
            <p className="editor-wrapper-description">{description}</p>
            <p className="editor-wrapper-meta">
              Tome Architecture
              {componentId && ` | Component: ${componentId}`}
              {router && ' | Router: Available'}
            </p>
          </header>
        )}
        <main className="editor-wrapper-content">{children}</main>
        <footer className="editor-wrapper-footer">
          Tome Architecture Enabled
          {router && ' | Router: Available'}
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default EditorWrapper;
