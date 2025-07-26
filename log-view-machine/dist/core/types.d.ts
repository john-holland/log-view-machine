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
export interface GraphQLOperation {
    query: string;
    variables?: Record<string, any>;
    operationName?: string;
}
export interface GraphQLResponse<T = any> {
    data?: T;
    errors?: GraphQLError[];
}
export interface GraphQLError {
    message: string;
    locations?: Array<{
        line: number;
        column: number;
    }>;
    path?: string[];
    extensions?: Record<string, any>;
}
export interface Observer<T> {
    next(value: T): void;
    error(error: Error): void;
    complete(): void;
}
export interface Subject<T> extends Observer<T> {
    subscribe(observer: Observer<T>): () => void;
}
