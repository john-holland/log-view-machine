import { useCallback, useEffect, useState } from 'react';
import { useMachine } from '@xstate/react';
import { historyMachine, HistoryEntry, HistoryContext } from '../machines/history-machine';

export interface UseHistoryReturn {
  // State
  canUndo: boolean;
  canRedo: boolean;
  isRecording: boolean;
  history: HistoryEntry[];
  present: HistoryEntry | null;
  
  // Actions
  recordChange: (params: {
    componentName: string;
    fileName: string;
    content: string;
    action: 'edit' | 'save' | 'delete' | 'create';
    metadata?: Record<string, any>;
  }) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
  setSession: (sessionId: string) => void;
  
  // Getters
  getHistory: () => HistoryEntry[];
  getPresent: () => HistoryEntry | null;
  
  // Keyboard shortcuts
  handleKeyDown: (event: KeyboardEvent) => void;
}

export function useHistory(sessionId?: string): UseHistoryReturn {
  const [state, send] = useMachine(historyMachine);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [present, setPresent] = useState<HistoryEntry | null>(null);

  // Initialize session ID
  useEffect(() => {
    if (sessionId) {
      setSession(sessionId);
    }
  }, [sessionId]);

  // Update local state when machine state changes
  useEffect(() => {
    const context = state.context as HistoryContext;
    setHistory(context.history.past);
    setPresent(context.history.present);
  }, [state.context]);

  const recordChange = useCallback((params: {
    componentName: string;
    fileName: string;
    content: string;
    action: 'edit' | 'save' | 'delete' | 'create';
    metadata?: Record<string, any>;
  }) => {
    send({
      type: 'RECORD_CHANGE',
      payload: params
    });
  }, [send]);

  const undo = useCallback(() => {
    send({ type: 'UNDO' });
  }, [send]);

  const redo = useCallback(() => {
    send({ type: 'REDO' });
  }, [send]);

  const clear = useCallback(() => {
    send({ type: 'CLEAR' });
  }, [send]);

  const setSession = useCallback((sessionId: string) => {
    send({
      type: 'SET_SESSION',
      payload: { sessionId }
    });
  }, [send]);

  const getHistory = useCallback(() => {
    send({ type: 'GET_HISTORY' });
    return history;
  }, [send, history]);

  const getPresent = useCallback(() => {
    send({ type: 'GET_PRESENT' });
    return present;
  }, [send, present]);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isCtrlOrCmd = isMac ? event.metaKey : event.ctrlKey;
    
    if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      undo();
    } else if (isCtrlOrCmd && event.key === 'z' && event.shiftKey) {
      event.preventDefault();
      redo();
    } else if (isCtrlOrCmd && event.key === 'y') {
      event.preventDefault();
      redo();
    }
  }, [undo, redo]);

  // Set up keyboard shortcuts
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const context = state.context as HistoryContext;
  
  return {
    // State
    canUndo: context.canUndo,
    canRedo: context.canRedo,
    isRecording: context.isRecording,
    history,
    present,
    
    // Actions
    recordChange,
    undo,
    redo,
    clear,
    setSession,
    
    // Getters
    getHistory,
    getPresent,
    
    // Keyboard shortcuts
    handleKeyDown
  };
}

// Hook for editor integration
export function useEditorHistory(componentName: string, fileName: string, sessionId?: string) {
  const history = useHistory(sessionId);
  
  // Auto-record changes when content changes
  const recordContentChange = useCallback((content: string, action: 'edit' | 'save' = 'edit') => {
    history.recordChange({
      componentName,
      fileName,
      content,
      action,
      metadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });
  }, [history, componentName, fileName]);

  // Record save action
  const recordSave = useCallback((content: string) => {
    history.recordChange({
      componentName,
      fileName,
      content,
      action: 'save',
      metadata: {
        timestamp: Date.now(),
        saveType: 'manual'
      }
    });
  }, [history, componentName, fileName]);

  // Record delete action
  const recordDelete = useCallback((content: string) => {
    history.recordChange({
      componentName,
      fileName,
      content,
      action: 'delete',
      metadata: {
        timestamp: Date.now(),
        deleteType: 'file'
      }
    });
  }, [history, componentName, fileName]);

  // Record create action
  const recordCreate = useCallback((content: string) => {
    history.recordChange({
      componentName,
      fileName,
      content,
      action: 'create',
      metadata: {
        timestamp: Date.now(),
        createType: 'file'
      }
    });
  }, [history, componentName, fileName]);

  return {
    ...history,
    recordContentChange,
    recordSave,
    recordDelete,
    recordCreate
  };
}

export default useHistory;


