import m from 'mithril';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { LogViewMachineImpl, LogViewMachineConfig, LogEntry, LogFilter } from '../core/LogViewMachine';
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

export class LogViewComponent {
  private machine: LogViewMachineImpl;
  private entries: LogEntry[] = [];
  private filters: LogFilter = {};
  private isLoading = true;
  private error: Error | null = null;

  private renderEntry: (entry: LogEntry) => m.Vnode;
  private renderFilter: (filters: LogFilter, onUpdate: (filters: Partial<LogFilter>) => void) => m.Vnode;
  private renderError: (error: Error) => m.Vnode;
  private renderLoading: () => m.Vnode;
  private renderEmpty: () => m.Vnode;

  constructor(config: LogViewComponentConfig) {
    this.machine = new LogViewMachineImpl({
      apolloClient: config.client,
      version: config.version,
      versionConstraint: config.versionConstraint,
      kotlinServer: config.kotlinServer,
      localVersions: config.localVersions,
    });

    this.renderEntry = config.renderEntry || this.defaultRenderEntry;
    this.renderFilter = config.renderFilter || this.defaultRenderFilter;
    this.renderError = config.renderError || this.defaultRenderError;
    this.renderLoading = config.renderLoading || this.defaultRenderLoading;
    this.renderEmpty = config.renderEmpty || this.defaultRenderEmpty;

    this.fetchLogs();
  }

  private async fetchLogs() {
    try {
      this.isLoading = true;
      const result = await this.machine.fetchLogs();
      this.entries = result.entries;
      this.filters = result.filters;
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Failed to fetch logs');
    } finally {
      this.isLoading = false;
      m.redraw();
    }
  }

  private async updateFilters(newFilters: Partial<LogFilter>) {
    try {
      const result = await this.machine.updateFilters(newFilters);
      this.entries = result.entries;
      this.filters = result.filters;
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err : new Error('Failed to update filters');
    }
    m.redraw();
  }

  private defaultRenderEntry(entry: LogEntry): m.Vnode {
    return m('div.log-entry', {
      key: entry.id,
      className: `log-level-${entry.level.toLowerCase()}`,
    }, [
      m('span.timestamp', new Date(entry.timestamp).toISOString()),
      m('span.level', entry.level),
      m('span.message', entry.message),
      entry.metadata && m('pre.metadata', JSON.stringify(entry.metadata, null, 2)),
    ]);
  }

  private defaultRenderFilter(filters: LogFilter, onUpdate: (filters: Partial<LogFilter>) => void): m.Vnode {
    return m('div.log-filters', [
      m('select', {
        value: filters.level || '',
        onchange: (e: Event) => onUpdate({ level: (e.target as HTMLSelectElement).value || undefined }),
      }, [
        m('option', { value: '' }, 'All Levels'),
        m('option', { value: 'DEBUG' }, 'Debug'),
        m('option', { value: 'INFO' }, 'Info'),
        m('option', { value: 'WARN' }, 'Warning'),
        m('option', { value: 'ERROR' }, 'Error'),
      ]),
      m('input[type=text]', {
        value: filters.search || '',
        oninput: (e: Event) => onUpdate({ search: (e.target as HTMLInputElement).value || undefined }),
        placeholder: 'Search logs...',
      }),
    ]);
  }

  private defaultRenderError(error: Error): m.Vnode {
    return m('div.log-error', [
      m('h3', 'Error'),
      m('p', error.message),
    ]);
  }

  private defaultRenderLoading(): m.Vnode {
    return m('div.log-loading', 'Loading logs...');
  }

  private defaultRenderEmpty(): m.Vnode {
    return m('div.log-empty', 'No logs available');
  }

  view(): m.Vnode {
    if (this.isLoading) {
      return this.renderLoading();
    }

    if (this.error) {
      return this.renderError(this.error);
    }

    if (this.entries.length === 0) {
      return this.renderEmpty();
    }

    return m('div.log-view', [
      this.renderFilter(this.filters, (filters) => this.updateFilters(filters)),
      m('div.log-entries', this.entries.map((entry) => this.renderEntry(entry))),
    ]);
  }
} 