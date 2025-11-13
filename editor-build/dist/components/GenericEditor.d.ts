import React, { ReactNode, ErrorInfo } from 'react';
interface GenericEditorProps {
    title: string;
    description: string;
    children?: ReactNode;
    componentId?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    useTomeArchitecture?: boolean;
}
/**
 * GenericEditor Component (Tome-Integrated)
 *
 * Enhanced editor with optional Tome architecture integration
 * Uses EditorTome for state management when enabled
 */
declare const GenericEditor: React.FC<GenericEditorProps>;
export default GenericEditor;
