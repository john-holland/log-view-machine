import m from 'mithril';
import { LogViewMachineImpl } from '../core/LogViewMachine';
export class LogViewComponent {
    constructor(config) {
        this.entries = [];
        this.filters = {};
        this.isLoading = true;
        this.error = null;
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
    async fetchLogs() {
        try {
            this.isLoading = true;
            const result = await this.machine.fetchLogs();
            this.entries = result.entries;
            this.filters = result.filters;
            this.error = null;
        }
        catch (err) {
            this.error = err instanceof Error ? err : new Error('Failed to fetch logs');
        }
        finally {
            this.isLoading = false;
            m.redraw();
        }
    }
    async updateFilters(newFilters) {
        try {
            const result = await this.machine.updateFilters(newFilters);
            this.entries = result.entries;
            this.filters = result.filters;
            this.error = null;
        }
        catch (err) {
            this.error = err instanceof Error ? err : new Error('Failed to update filters');
        }
        m.redraw();
    }
    defaultRenderEntry(entry) {
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
    defaultRenderFilter(filters, onUpdate) {
        return m('div.log-filters', [
            m('select', {
                value: filters.level || '',
                onchange: (e) => onUpdate({ level: e.target.value || undefined }),
            }, [
                m('option', { value: '' }, 'All Levels'),
                m('option', { value: 'DEBUG' }, 'Debug'),
                m('option', { value: 'INFO' }, 'Info'),
                m('option', { value: 'WARN' }, 'Warning'),
                m('option', { value: 'ERROR' }, 'Error'),
            ]),
            m('input[type=text]', {
                value: filters.search || '',
                oninput: (e) => onUpdate({ search: e.target.value || undefined }),
                placeholder: 'Search logs...',
            }),
        ]);
    }
    defaultRenderError(error) {
        return m('div.log-error', [
            m('h3', 'Error'),
            m('p', error.message),
        ]);
    }
    defaultRenderLoading() {
        return m('div.log-loading', 'Loading logs...');
    }
    defaultRenderEmpty() {
        return m('div.log-empty', 'No logs available');
    }
    view() {
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
