import React from 'react';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { LogViewMachineImpl, LogEntry, LogFilter } from '../core/LogViewMachine';
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
export declare const useLogView: () => LogViewContextType;
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
export declare const LogViewProvider: React.FC<LogViewProviderProps>;
interface LogViewProps {
    renderEntry?: (entry: LogEntry) => React.ReactNode;
    renderFilter?: (filters: LogFilter, onUpdate: (filters: Partial<LogFilter>) => void) => React.ReactNode;
    renderError?: (error: Error) => React.ReactNode;
    renderLoading?: () => React.ReactNode;
    renderEmpty?: () => React.ReactNode;
}
export declare const LogView: React.FC<LogViewProps>;
export {};
