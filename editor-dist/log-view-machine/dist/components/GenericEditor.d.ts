import React, { ReactNode, ErrorInfo } from 'react';
interface GenericEditorProps {
    title: string;
    description: string;
    children: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}
declare const GenericEditor: React.FC<GenericEditorProps>;
export default GenericEditor;
