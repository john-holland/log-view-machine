import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StructuralRouter, Route, RouteFallback, StructuralTomeConnector, useRouter, createStructuralConfig } from '../index';
// Example dashboard component
const Dashboard = () => {
    const { structuralSystem } = useRouter();
    return (_jsx(StructuralTomeConnector, { componentName: "dashboard", structuralSystem: structuralSystem, initialModel: { title: 'Dashboard', items: [] }, children: (context) => (_jsxs("div", { className: "dashboard", children: [_jsx("h2", { children: context.model.title }), _jsxs("p", { children: ["Current State: ", context.currentState] }), _jsx("button", { onClick: () => context.sendEvent({ type: 'LOAD' }), children: "Load Dashboard" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'REFRESH' }), children: "Refresh" })] })) }));
};
// Example log viewer component
const LogViewer = () => {
    const { structuralSystem } = useRouter();
    return (_jsx(StructuralTomeConnector, { componentName: "log-viewer", structuralSystem: structuralSystem, initialModel: { logs: [], filters: {} }, children: (context) => (_jsxs("div", { className: "log-viewer", children: [_jsx("h2", { children: "Log Viewer" }), _jsxs("p", { children: ["Current State: ", context.currentState] }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: () => context.sendEvent({ type: 'LOAD_LOGS' }), children: "Load Logs" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'FILTER' }), children: "Apply Filters" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'EXPORT' }), children: "Export" })] }), _jsx("div", { className: "logs", children: context.model.logs.length > 0 ? (_jsx("ul", { children: context.model.logs.map((log, index) => (_jsx("li", { children: log.message }, index))) })) : (_jsx("p", { children: "No logs loaded" })) })] })) }));
};
// Example state machine component
const StateMachine = () => {
    const { structuralSystem } = useRouter();
    return (_jsx(StructuralTomeConnector, { componentName: "state-machine", structuralSystem: structuralSystem, initialModel: { machine: null, states: [] }, children: (context) => (_jsxs("div", { className: "state-machine", children: [_jsx("h2", { children: "State Machine" }), _jsxs("p", { children: ["Current State: ", context.currentState] }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: () => context.sendEvent({ type: 'LOAD_MACHINE' }), children: "Load Machine" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'VISUALIZE' }), children: "Visualize" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'EDIT' }), children: "Edit" })] }), context.model.machine && (_jsxs("div", { className: "machine-info", children: [_jsxs("h3", { children: ["Machine: ", context.model.machine.id] }), _jsxs("p", { children: ["States: ", context.model.states.join(', ')] })] }))] })) }));
};
// Example tome manager component
const TomeManager = () => {
    const { structuralSystem } = useRouter();
    return (_jsx(StructuralTomeConnector, { componentName: "tome-manager", structuralSystem: structuralSystem, initialModel: { tomes: [] }, children: (context) => (_jsxs("div", { className: "tome-manager", children: [_jsx("h2", { children: "Tome Manager" }), _jsxs("p", { children: ["Current State: ", context.currentState] }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: () => context.sendEvent({ type: 'LOAD_TOMES' }), children: "Load Tomes" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'CREATE' }), children: "Create Tome" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'EDIT' }), children: "Edit Tome" })] }), _jsx("div", { className: "tomes", children: context.model.tomes.length > 0 ? (_jsx("ul", { children: context.model.tomes.map((tome, index) => (_jsx("li", { children: tome.name }, index))) })) : (_jsx("p", { children: "No tomes loaded" })) })] })) }));
};
// Example settings component
const Settings = () => {
    const { structuralSystem } = useRouter();
    return (_jsx(StructuralTomeConnector, { componentName: "settings", structuralSystem: structuralSystem, initialModel: { theme: 'light', language: 'en' }, children: (context) => (_jsxs("div", { className: "settings", children: [_jsx("h2", { children: "Settings" }), _jsxs("p", { children: ["Current State: ", context.currentState] }), _jsxs("div", { className: "controls", children: [_jsx("button", { onClick: () => context.sendEvent({ type: 'LOAD_SETTINGS' }), children: "Load Settings" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'EDIT' }), children: "Edit" }), _jsx("button", { onClick: () => context.sendEvent({ type: 'SAVE' }), children: "Save" })] }), _jsxs("div", { className: "settings-form", children: [_jsxs("label", { children: ["Theme:", _jsxs("select", { value: context.model.theme, onChange: (e) => context.updateModel({ theme: e.target.value }), children: [_jsx("option", { value: "light", children: "Light" }), _jsx("option", { value: "dark", children: "Dark" })] })] }), _jsxs("label", { children: ["Language:", _jsxs("select", { value: context.model.language, onChange: (e) => context.updateModel({ language: e.target.value }), children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "es", children: "Spanish" }), _jsx("option", { value: "fr", children: "French" })] })] })] })] })) }));
};
// Main structural example component
export const StructuralExample = () => {
    // Create a custom structural configuration
    const customConfig = createStructuralConfig({
        AppStructure: {
            id: 'custom-log-view-machine',
            name: 'Custom Log View Machine',
            type: 'application',
            routing: {
                base: '/',
                defaultRoute: '/dashboard'
            }
        }
    });
    return (_jsxs(StructuralRouter, { config: customConfig, initialRoute: "/dashboard", onRouteChange: (route) => console.log('Route changed to:', route), children: [_jsx(Route, { path: "/dashboard", component: Dashboard }), _jsx(Route, { path: "/log-viewer", component: LogViewer }), _jsx(Route, { path: "/state-machine", component: StateMachine }), _jsx(Route, { path: "/tome-manager", component: TomeManager }), _jsx(Route, { path: "/settings", component: Settings }), _jsx(Route, { path: "/", component: Dashboard }), _jsx(Route, { path: "*", component: RouteFallback })] }));
};
// Export the example
export default StructuralExample;
