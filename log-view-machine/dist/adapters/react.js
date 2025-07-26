import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { LogViewMachineImpl } from '../core/LogViewMachine';
const LogViewContext = createContext(null);
export const useLogView = () => {
    const context = useContext(LogViewContext);
    if (!context) {
        throw new Error('useLogView must be used within a LogViewProvider');
    }
    return context;
};
export const LogViewProvider = ({ client, version, versionConstraint, kotlinServer, localVersions, children, }) => {
    const [machine] = useState(() => new LogViewMachineImpl({
        apolloClient: client,
        version,
        versionConstraint,
        kotlinServer,
        localVersions,
    }));
    const [entries, setEntries] = useState([]);
    const [filters, setFilters] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setIsLoading(true);
                const result = await machine.fetchLogs();
                setEntries(result.entries);
                setFilters(result.filters);
                setError(null);
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to fetch logs'));
            }
            finally {
                setIsLoading(false);
            }
        };
        fetchLogs();
    }, [machine]);
    const updateFilters = async (newFilters) => {
        try {
            const result = await machine.updateFilters(newFilters);
            setEntries(result.entries);
            setFilters(result.filters);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to update filters'));
        }
    };
    const addLog = async (entry) => {
        try {
            const result = await machine.addLog(entry);
            setEntries(result.entries);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to add log'));
        }
    };
    const clearLogs = async () => {
        try {
            const result = await machine.clearLogs();
            setEntries(result.entries);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to clear logs'));
        }
    };
    return (_jsx(LogViewContext.Provider, { value: {
            machine,
            entries,
            filters,
            isLoading,
            error,
            updateFilters,
            addLog,
            clearLogs,
        }, children: children }));
};
export const LogView = ({ renderEntry = (entry) => (_jsxs("div", { className: `log-entry log-level-${entry.level.toLowerCase()}`, children: [_jsx("span", { className: "timestamp", children: new Date(entry.timestamp).toISOString() }), _jsx("span", { className: "level", children: entry.level }), _jsx("span", { className: "message", children: entry.message }), entry.metadata && (_jsx("pre", { className: "metadata", children: JSON.stringify(entry.metadata, null, 2) }))] }, entry.id)), renderFilter = (filters, onUpdate) => (_jsxs("div", { className: "log-filters", children: [_jsxs("select", { value: filters.level || '', onChange: (e) => onUpdate({ level: e.target.value || undefined }), children: [_jsx("option", { value: "", children: "All Levels" }), _jsx("option", { value: "DEBUG", children: "Debug" }), _jsx("option", { value: "INFO", children: "Info" }), _jsx("option", { value: "WARN", children: "Warning" }), _jsx("option", { value: "ERROR", children: "Error" })] }), _jsx("input", { type: "text", value: filters.search || '', onChange: (e) => onUpdate({ search: e.target.value || undefined }), placeholder: "Search logs..." })] })), renderError = (error) => (_jsxs("div", { className: "log-error", children: [_jsx("h3", { children: "Error" }), _jsx("p", { children: error.message })] })), renderLoading = () => (_jsx("div", { className: "log-loading", children: "Loading logs..." })), renderEmpty = () => (_jsx("div", { className: "log-empty", children: "No logs available" })), }) => {
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
    return (_jsxs("div", { className: "log-view", children: [renderFilter(filters, updateFilters), _jsx("div", { className: "log-entries", children: entries.map(renderEntry) })] }));
};
