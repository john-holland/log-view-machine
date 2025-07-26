export interface LogEntry {
    id: string;
    timestamp: Date;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    message: string;
    data?: any;
    tags?: string[];
}
export interface LogFilter {
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    tags?: string[];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
}
export interface LogViewMachineConfig {
    maxEntries?: number;
    defaultFilter?: LogFilter;
    enableRealTime?: boolean;
}
export interface LogViewMachine {
    getLogs(filter?: LogFilter): LogEntry[];
    addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void;
    clearLogs(): void;
    subscribe(callback: (logs: LogEntry[]) => void): () => void;
}
export declare class LogViewMachineImpl implements LogViewMachine {
    private logs;
    private subscribers;
    private config;
    constructor(config?: LogViewMachineConfig);
    getLogs(filter?: LogFilter): LogEntry[];
    addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void;
    clearLogs(): void;
    subscribe(callback: (logs: LogEntry[]) => void): () => void;
    private notifySubscribers;
}
