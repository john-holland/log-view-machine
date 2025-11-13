/**
 * useEditorTome Hook
 *
 * React hook for integrating with the EditorTome system
 * Provides state management and actions for the GenericEditor component
 */
export declare const useEditorTome: (componentId?: string) => {
    editorState: string;
    previewState: string;
    currentComponent: any;
    previewData: any;
    isDirty: boolean;
    error: string | null;
    isInitialized: boolean;
    loadComponent: (id: string) => Promise<void>;
    saveComponent: () => Promise<void>;
    previewComponent: () => Promise<void>;
    createNewComponent: () => Promise<void>;
    cancelEditing: () => Promise<void>;
    updateComponentContent: (content: string) => void;
};
