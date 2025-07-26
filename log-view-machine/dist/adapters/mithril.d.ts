import m from 'mithril';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { LogEntry, LogFilter } from '../core/LogViewMachine';
import { VersionConstraint, VersionedMachine } from '../core/versioning';
interface LogViewComponentConfig {
    client: ApolloClient<NormalizedCacheObject>;
    version?: string;
    versionConstraint?: VersionConstraint;
    kotlinServer?: {
        baseUrl: string;
        apiKey: string;
    };
    localVersions?: VersionedMachine[];
    renderEntry?: (entry: LogEntry) => m.Vnode;
    renderFilter?: (filters: LogFilter, onUpdate: (filters: Partial<LogFilter>) => void) => m.Vnode;
    renderError?: (error: Error) => m.Vnode;
    renderLoading?: () => m.Vnode;
    renderEmpty?: () => m.Vnode;
}
export declare class LogViewComponent {
    private machine;
    private entries;
    private filters;
    private isLoading;
    private error;
    private renderEntry;
    private renderFilter;
    private renderError;
    private renderLoading;
    private renderEmpty;
    constructor(config: LogViewComponentConfig);
    private fetchLogs;
    private updateFilters;
    private defaultRenderEntry;
    private defaultRenderFilter;
    private defaultRenderError;
    private defaultRenderLoading;
    private defaultRenderEmpty;
    view(): m.Vnode;
}
export {};
