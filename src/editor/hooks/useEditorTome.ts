import { useState, useEffect, useCallback } from 'react';
import { editorTome } from '../tomes/EditorTome';

/**
 * useEditorTome Hook
 * 
 * React hook for integrating with the EditorTome system
 * Provides state management and actions for the GenericEditor component
 */
export const useEditorTome = (componentId?: string) => {
    const [editorState, setEditorState] = useState<string>('idle');
    const [previewState, setPreviewState] = useState<string>('idle');
    const [currentComponent, setCurrentComponent] = useState<any>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize tome on mount
    useEffect(() => {
        let unsubscribeEditor: () => void;
        let unsubscribePreview: () => void;

        const init = async () => {
            try {
                await editorTome.initialize();
                
                // Subscribe to editor machine state changes
                unsubscribeEditor = editorTome.subscribeMachine('EditorMachine', (state) => {
                    console.log('📝 useEditorTome: EditorMachine state:', state);
                    setEditorState(state?.value || 'unknown');
                    
                    // Update context from machine
                    const context = editorTome.getMachineContext('EditorMachine');
                    if (context) {
                        setCurrentComponent(context.currentComponent);
                        setIsDirty(context.isDirty);
                        setError(context.error);
                    }
                });

                // Subscribe to preview machine state changes
                unsubscribePreview = editorTome.subscribeMachine('PreviewMachine', (state) => {
                    console.log('👁️ useEditorTome: PreviewMachine state:', state);
                    setPreviewState(state?.value || 'unknown');
                    
                    // Update preview data from machine
                    const context = editorTome.getMachineContext('PreviewMachine');
                    if (context) {
                        setPreviewData(context.previewData);
                    }
                });

                setIsInitialized(true);
                console.log('📚 useEditorTome: Initialized successfully');
            } catch (err: any) {
                console.error('📚 useEditorTome: Initialization failed', err);
                setError(err.message);
            }
        };

        init();

        return () => {
            unsubscribeEditor?.();
            unsubscribePreview?.();
        };
    }, []);

    // Auto-load component if componentId provided
    useEffect(() => {
        if (isInitialized && componentId) {
            loadComponent(componentId);
        }
    }, [isInitialized, componentId]);

    // Actions
    const loadComponent = useCallback(async (id: string) => {
        try {
            await editorTome.send('EditorMachine', 'LOAD_COMPONENT', { componentId: id });
        } catch (err: any) {
            console.error('📝 useEditorTome: Load failed', err);
            setError(err.message);
        }
    }, []);

    const saveComponent = useCallback(async () => {
        try {
            await editorTome.send('EditorMachine', 'SAVE');
        } catch (err: any) {
            console.error('📝 useEditorTome: Save failed', err);
            setError(err.message);
        }
    }, []);

    const previewComponent = useCallback(async () => {
        try {
            await editorTome.send('EditorMachine', 'PREVIEW');
        } catch (err: any) {
            console.error('📝 useEditorTome: Preview failed', err);
            setError(err.message);
        }
    }, []);

    const createNewComponent = useCallback(async () => {
        try {
            await editorTome.send('EditorMachine', 'CREATE_NEW');
        } catch (err: any) {
            console.error('📝 useEditorTome: Create failed', err);
            setError(err.message);
        }
    }, []);

    const cancelEditing = useCallback(async () => {
        try {
            await editorTome.send('EditorMachine', 'CANCEL');
        } catch (err: any) {
            console.error('📝 useEditorTome: Cancel failed', err);
            setError(err.message);
        }
    }, []);

    const updateComponentContent = useCallback((content: string) => {
        if (currentComponent) {
            const updated = { ...currentComponent, content };
            setCurrentComponent(updated);
            editorTome.send('EditorMachine', 'COMPONENT_CHANGE', { component: updated });
        }
    }, [currentComponent]);

    return {
        // State
        editorState,
        previewState,
        currentComponent,
        previewData,
        isDirty,
        error,
        isInitialized,
        
        // Actions
        loadComponent,
        saveComponent,
        previewComponent,
        createNewComponent,
        cancelEditing,
        updateComponentContent
    };
};

