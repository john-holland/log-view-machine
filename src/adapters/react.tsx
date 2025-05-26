import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { LogViewMachineImpl, LogViewMachineConfig, LogEntry, LogFilter } from '../core/LogViewMachine';
import { VersionConstraint, VersionedMachine } from '../core/versioning';

interface LogViewContextType {
  machine: LogViewMachineImpl;
  entries: LogEntry[];
  filters: LogFilter;
  isLoading: boolean;
  error: Error | null;
  updateFilters: (filters: Partial<LogFilter>) => void;
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
}

const LogViewContext = createContext<LogViewContextType | null>(null);

export const useLogView = () => {
  const context = useContext(LogViewContext);
  if (!context) {
    throw new Error('useLogView must be used within a LogViewProvider');
  }
  return context;
};

interface LogViewProviderProps {
  client: ApolloClient<NormalizedCacheObject>;
  version?: string;
  versionConstraint?: VersionConstraint;
  kotlinServer?: {
    baseUrl: string;
    apiKey: string;
  };
  localVersions?: VersionedMachine[];
  children: React.ReactNode;
}

export const LogViewProvider: React.FC<LogViewProviderProps> = ({
  client,
  version,
  versionConstraint,
  kotlinServer,
  localVersions,
  children,
}) => {
  const [machine] = useState(() => new LogViewMachineImpl({
    apolloClient: client,
    version,
    versionConstraint,
    kotlinServer,
    localVersions,
  }));

  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filters, setFilters] = useState<LogFilter>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const result = await machine.fetchLogs();
        setEntries(result.entries);
        setFilters(result.filters);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch logs'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [machine]);

  const updateFilters = async (newFilters: Partial<LogFilter>) => {
    try {
      const result = await machine.updateFilters(newFilters);
      setEntries(result.entries);
      setFilters(result.filters);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update filters'));
    }
  };

  const addLog = async (entry: LogEntry) => {
    try {
      const result = await machine.addLog(entry);
      setEntries(result.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add log'));
    }
  };

  const clearLogs = async () => {
    try {
      const result = await machine.clearLogs();
      setEntries(result.entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear logs'));
    }
  };

  return (
    <LogViewContext.Provider
      value={{
        machine,
        entries,
        filters,
        isLoading,
        error,
        updateFilters,
        addLog,
        clearLogs,
      }}
    >
      {children}
    </LogViewContext.Provider>
  );
};

interface LogViewProps {
  renderEntry?: (entry: LogEntry) => React.ReactNode;
  renderFilter?: (filters: LogFilter, onUpdate: (filters: Partial<LogFilter>) => void) => React.ReactNode;
  renderError?: (error: Error) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
}

export const LogView: React.FC<LogViewProps> = ({
  renderEntry = (entry) => (
    <div key={entry.id} className={`log-entry log-level-${entry.level.toLowerCase()}`}>
      <span className="timestamp">{new Date(entry.timestamp).toISOString()}</span>
      <span className="level">{entry.level}</span>
      <span className="message">{entry.message}</span>
      {entry.metadata && (
        <pre className="metadata">{JSON.stringify(entry.metadata, null, 2)}</pre>
      )}
    </div>
  ),
  renderFilter = (filters, onUpdate) => (
    <div className="log-filters">
      <select
        value={filters.level || ''}
        onChange={(e) => onUpdate({ level: e.target.value || undefined })}
      >
        <option value="">All Levels</option>
        <option value="DEBUG">Debug</option>
        <option value="INFO">Info</option>
        <option value="WARN">Warning</option>
        <option value="ERROR">Error</option>
      </select>
      <input
        type="text"
        value={filters.search || ''}
        onChange={(e) => onUpdate({ search: e.target.value || undefined })}
        placeholder="Search logs..."
      />
    </div>
  ),
  renderError = (error) => (
    <div className="log-error">
      <h3>Error</h3>
      <p>{error.message}</p>
    </div>
  ),
  renderLoading = () => (
    <div className="log-loading">Loading logs...</div>
  ),
  renderEmpty = () => (
    <div className="log-empty">No logs available</div>
  ),
}) => {
  const { entries, filters, isLoading, error, updateFilters } = useLogView();

  if (isLoading) {
    return renderLoading();
  }

  if (error) {
    return renderError(error);
  }

  if (entries.length === 0) {
    return renderEmpty();
  }

  return (
    <div className="log-view">
      {renderFilter(filters, updateFilters)}
      <div className="log-entries">
        {entries.map(renderEntry)}
      </div>
    </div>
  );
}; 