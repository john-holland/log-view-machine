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

export class LogViewMachineImpl implements LogViewMachine {
  private logs: LogEntry[] = [];
  private subscribers: Set<(logs: LogEntry[]) => void> = new Set();
  private config: LogViewMachineConfig;

  constructor(config: LogViewMachineConfig = {}) {
    this.config = {
      maxEntries: 1000,
      enableRealTime: true,
      ...config
    };
  }

  getLogs(filter?: LogFilter): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level) {
        const levelOrder = { 'DEBUG': 0, 'INFO': 1, 'WARN': 2, 'ERROR': 3 };
        const minLevel = levelOrder[filter.level];
        filteredLogs = filteredLogs.filter(log => levelOrder[log.level] >= minLevel);
      }

      if (filter.tags && filter.tags.length > 0) {
        filteredLogs = filteredLogs.filter(log => 
          log.tags && filter.tags!.some(tag => log.tags!.includes(tag))
        );
      }

      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit);
      }
    }

    return filteredLogs;
  }

  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
    const newEntry: LogEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    this.logs.push(newEntry);

    if (this.config.maxEntries && this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }

    if (this.config.enableRealTime) {
      this.notifySubscribers();
    }
  }

  clearLogs(): void {
    this.logs = [];
    this.notifySubscribers();
  }

  subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.logs); // Initial call

    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.logs));
  }
} 