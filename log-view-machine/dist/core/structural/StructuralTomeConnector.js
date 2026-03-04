import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef, useMemo } from 'react';
// Main component
export const StructuralTomeConnector = ({ componentName, structuralSystem, initialModel = {}, onStateChange, onLogEntry, onMachineCreated, children }) => {
    const [state, setState] = useState({
        machine: null,
        currentState: 'idle',
        model: initialModel,
        logEntries: [],
        isLoading: true,
        error: null
    });
    const machineRef = useRef(null);
    const logEntriesRef = useRef([]);
    // Get tome configuration and component mapping
    const tomeConfig = useMemo(() => {
        return structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
    }, [componentName, structuralSystem]);
    const componentMapping = useMemo(() => {
        return structuralSystem.getComponentTomeMapping()[componentName];
    }, [componentName, structuralSystem]);
    // Initialize the tome machine
    useEffect(() => {
        const initializeTome = async () => {
            try {
                setState(prev => ({ ...prev, isLoading: true, error: null }));
                // Validate configuration
                if (!tomeConfig) {
                    throw new Error(`No tome configuration found for component: ${componentName}`);
                }
                if (!componentMapping) {
                    throw new Error(`No component mapping found for: ${componentName}`);
                }
                // Create or get the machine
                let machine = structuralSystem.getMachine(componentName);
                if (!machine) {
                    machine = structuralSystem.createMachine(componentName, initialModel);
                    if (!machine) {
                        throw new Error(`Failed to create machine for component: ${componentName}`);
                    }
                }
                // Store machine reference
                machineRef.current = machine;
                onMachineCreated?.(machine);
                // Set up state change listener
                const unsubscribe = machine.subscribe((state) => {
                    const currentState = state.value || 'idle';
                    const model = state.context?.model || initialModel;
                    setState(prev => ({
                        ...prev,
                        currentState,
                        model,
                        isLoading: false
                    }));
                    onStateChange?.(currentState, model);
                });
                // Set up logging
                machine.on('LOG_ADDED', async (entry) => {
                    const newEntry = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        message: entry.message,
                        metadata: entry.metadata
                    };
                    setState(prev => ({
                        ...prev,
                        logEntries: [...prev.logEntries, newEntry]
                    }));
                    logEntriesRef.current = [...logEntriesRef.current, newEntry];
                    onLogEntry?.(newEntry);
                });
                // Initialize the machine
                await machine.start();
                setState(prev => ({
                    ...prev,
                    machine,
                    isLoading: false
                }));
                return unsubscribe;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                setState(prev => ({
                    ...prev,
                    error: errorMessage,
                    isLoading: false
                }));
                console.error(`Failed to initialize tome for ${componentName}:`, error);
            }
        };
        initializeTome();
    }, [componentName, structuralSystem, initialModel, onStateChange, onLogEntry, onMachineCreated]);
    // Send event to the machine
    const sendEvent = (event) => {
        if (machineRef.current) {
            machineRef.current.send(event);
        }
    };
    // Update the model
    const updateModel = (updates) => {
        if (machineRef.current) {
            const currentModel = machineRef.current.getState()?.context?.model || {};
            const newModel = { ...currentModel, ...updates };
            // Update the machine context
            machineRef.current.send({
                type: 'MODEL_UPDATE',
                payload: { model: newModel }
            });
        }
    };
    // Context value for children
    const contextValue = {
        machine: state.machine,
        currentState: state.currentState,
        model: state.model,
        logEntries: state.logEntries,
        isLoading: state.isLoading,
        error: state.error,
        sendEvent,
        updateModel,
        componentName,
        tomeConfig,
        componentMapping
    };
    // Render children
    if (typeof children === 'function') {
        return _jsx(_Fragment, { children: children(contextValue) });
    }
    return (_jsxs("div", { className: "structural-tome-connector", children: [_jsx(TomeHeader, { context: contextValue }), _jsx(TomeContent, { context: contextValue, children: children }), _jsx(TomeFooter, { context: contextValue })] }));
};
// Tome header component
const TomeHeader = ({ context }) => {
    const { componentName, currentState, tomeConfig, error } = context;
    return (_jsxs("header", { className: "tome-header", children: [_jsxs("div", { className: "tome-info", children: [_jsx("h3", { className: "tome-title", children: componentName }), tomeConfig && (_jsx("p", { className: "tome-description", children: tomeConfig.description }))] }), _jsxs("div", { className: "tome-status", children: [_jsx("span", { className: `state-indicator state-${currentState}`, children: currentState }), error && (_jsx("span", { className: "error-indicator", title: error, children: "\u26A0\uFE0F" }))] })] }));
};
// Tome content component
const TomeContent = ({ context, children }) => {
    const { isLoading, error } = context;
    if (isLoading) {
        return (_jsx("div", { className: "tome-content loading", children: _jsx("div", { className: "loading-spinner", children: "Loading..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "tome-content error", children: _jsxs("div", { className: "error-message", children: [_jsx("h4", { children: "Error" }), _jsx("p", { children: error })] }) }));
    }
    return (_jsx("div", { className: "tome-content", children: children }));
};
// Tome footer component
const TomeFooter = ({ context }) => {
    const { logEntries, tomeConfig } = context;
    if (!tomeConfig || logEntries.length === 0) {
        return null;
    }
    return (_jsx("footer", { className: "tome-footer", children: _jsxs("details", { className: "tome-logs", children: [_jsxs("summary", { children: ["Logs (", logEntries.length, ")"] }), _jsx("div", { className: "log-entries", children: logEntries.slice(-5).map(entry => (_jsxs("div", { className: `log-entry log-${entry.level}`, children: [_jsx("span", { className: "log-timestamp", children: new Date(entry.timestamp).toLocaleTimeString() }), _jsx("span", { className: "log-message", children: entry.message }), entry.metadata && (_jsx("span", { className: "log-metadata", children: JSON.stringify(entry.metadata) }))] }, entry.id))) })] }) }));
};
// Hook for using the tome connector
export function useStructuralTomeConnector(componentName, structuralSystem) {
    const [context, setContext] = useState({
        machine: null,
        currentState: 'idle',
        model: {},
        logEntries: [],
        isLoading: true,
        error: null,
        sendEvent: () => { },
        updateModel: () => { },
        componentName,
        tomeConfig: null,
        componentMapping: null
    });
    useEffect(() => {
        const tomeConfig = structuralSystem.getTomeConfig().tomes[`${componentName}-tome`];
        const componentMapping = structuralSystem.getComponentTomeMapping()[componentName];
        setContext(prev => ({
            ...prev,
            tomeConfig,
            componentMapping
        }));
    }, [componentName, structuralSystem]);
    return context;
}
// Export the component and types
export default StructuralTomeConnector;
