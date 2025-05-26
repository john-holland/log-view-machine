export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LogViewState {
  entries: LogEntry[];
  filters: LogFilters;
  isLoading: boolean;
  error: Error | null;
}

export interface LogFilters {
  level?: LogEntry['level'];
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface LogViewActions {
  fetchLogs: (filters?: LogFilters) => Promise<void>;
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => Promise<void>;
  clearLogs: () => void;
  updateFilters: (filters: Partial<LogFilters>) => void;
}

export type LogViewMachine = LogViewState & LogViewActions; 