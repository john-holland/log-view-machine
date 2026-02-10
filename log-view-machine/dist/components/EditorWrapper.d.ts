import React, { ErrorInfo } from 'react';
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
declare const EditorWrapper: React.FC<EditorWrapperProps>;
export default EditorWrapper;
