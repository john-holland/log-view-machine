import { createMachine, assign, send, log } from 'xstate';

export interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry | null;
  future: HistoryEntry[];
  maxHistorySize: number;
  sessionId: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  componentName: string;
  fileName: string;
  content: string;
  action: 'edit' | 'save' | 'delete' | 'create';
  metadata?: Record<string, any>;
}

export interface HistoryContext {
  history: HistoryState;
  isRecording: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export type HistoryEvents = 
  | {
      type: 'RECORD_CHANGE';
      payload: {
        componentName: string;
        fileName: string;
        content: string;
        action: 'edit' | 'save' | 'delete' | 'create';
        metadata?: Record<string, any>;
      };
    }
  | {
      type: 'UNDO';
    }
  | {
      type: 'REDO';
    }
  | {
      type: 'CLEAR';
    }
  | {
      type: 'SET_SESSION';
      payload: {
        sessionId: string;
      };
    }
  | {
      type: 'GET_HISTORY';
    }
  | {
      type: 'GET_PRESENT';
    };

export const historyMachine = createMachine<HistoryContext, HistoryEvents>({
  id: 'historyMachine',
  initial: 'idle',
  context: {
    history: {
      past: [],
      present: null,
      future: [],
      maxHistorySize: 50,
      sessionId: ''
    },
    isRecording: false,
    canUndo: false,
    canRedo: false
  },
  states: {
    idle: {
      on: {
        RECORD_CHANGE: {
          target: 'recording',
          actions: [
            assign({
              isRecording: true
            }),
            'recordChange',
            'updateCanUndoRedo',
            log('History: Recorded change')
          ]
        },
        UNDO: {
          guard: 'canUndo',
          actions: [
            'performUndo',
            'updateCanUndoRedo',
            log('History: Performed undo')
          ]
        },
        REDO: {
          guard: 'canRedo',
          actions: [
            'performRedo',
            'updateCanUndoRedo',
            log('History: Performed redo')
          ]
        },
        CLEAR: {
          actions: [
            'clearHistory',
            'updateCanUndoRedo',
            log('History: Cleared history')
          ]
        },
        SET_SESSION: {
          actions: [
            'setSessionId',
            log('History: Set session ID')
          ]
        },
        GET_HISTORY: {
          actions: [
            'getHistory',
            log('History: Retrieved history')
          ]
        },
        GET_PRESENT: {
          actions: [
            'getPresent',
            log('History: Retrieved present state')
          ]
        }
      }
    },
    recording: {
      after: {
        100: {
          target: 'idle',
          actions: [
            assign({
              isRecording: false
            }),
            log('History: Recording completed')
          ]
        },
        on: {
          RECORD_CHANGE: {
            actions: [
              'recordChange',
              'updateCanUndoRedo',
              log('History: Recorded additional change')
            ]
          },
          UNDO: {
            guard: 'canUndo',
            actions: [
              'performUndo',
              'updateCanUndoRedo',
              log('History: Performed undo during recording')
            ]
          },
          REDO: {
            guard: 'canRedo',
            actions: [
              'performRedo',
              'updateCanUndoRedo',
              log('History: Performed redo during recording')
            ]
          },
          CLEAR: {
            target: 'idle',
            actions: [
              'clearHistory',
              'updateCanUndoRedo',
              assign({
                isRecording: false
              }),
              log('History: Cleared history during recording')
            ]
          }
        }
      }
    },
    undoing: {
      after: {
        50: {
          target: 'idle',
          actions: [
            log('History: Undo completed')
          ]
        }
      }
    },
    redoing: {
      after: {
        50: {
          target: 'idle',
          actions: [
            log('History: Redo completed')
          ]
        }
      }
    }
  }
}, {
  actions: {
    recordChange: assign({
      history: ({ history }, event) => {
        if (event.type !== 'RECORD_CHANGE') return history;
        
        const { componentName, fileName, content, action, metadata } = event.payload;
        const newEntry: HistoryEntry = {
          id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          componentName,
          fileName,
          content,
          action,
          metadata
        };

        // Add to past, clear future
        const newPast = [...history.past, history.present].filter(Boolean);
        if (newPast.length > history.maxHistorySize) {
          newPast.shift(); // Remove oldest entry
        }

        return {
          ...history,
          past: newPast,
          present: newEntry,
          future: [] // Clear future when new change is recorded
        };
      }
    }),

    performUndo: assign({
      history: ({ history }) => {
        if (history.past.length === 0) return history;

        const previousEntry = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);
        const newFuture = [history.present, ...history.future].filter(Boolean);

        return {
          ...history,
          past: newPast,
          present: previousEntry,
          future: newFuture
        };
      }
    }),

    performRedo: assign({
      history: ({ history }) => {
        if (history.future.length === 0) return history;

        const nextEntry = history.future[0];
        const newPast = [...history.past, history.present].filter(Boolean);
        const newFuture = history.future.slice(1);

        return {
          ...history,
          past: newPast,
          present: nextEntry,
          future: newFuture
        };
      }
    }),

    clearHistory: assign({
      history: ({ history }) => ({
        ...history,
        past: [],
        present: null,
        future: []
      })
    }),

    setSessionId: assign({
      history: ({ history }, event) => {
        if (event.type !== 'SET_SESSION') return history;
        return {
          ...history,
          sessionId: event.payload.sessionId
        };
      }
    }),

    updateCanUndoRedo: assign({
      canUndo: ({ history }) => history.past.length > 0,
      canRedo: ({ history }) => history.future.length > 0
    }),

    getHistory: send('HISTORY_RETRIEVED', {
      to: 'historyService'
    }),

    getPresent: send('PRESENT_RETRIEVED', {
      to: 'historyService'
    })
  },

  guards: {
    canUndo: ({ history }) => history.past.length > 0,
    canRedo: ({ history }) => history.future.length > 0
  }
});

export default historyMachine;
