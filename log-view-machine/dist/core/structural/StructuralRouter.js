import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, createContext, useContext } from 'react';
import { StructuralSystem } from './StructuralSystem';
const RouterContext = createContext(null);
// Router hook
export function useRouter() {
    const context = useContext(RouterContext);
    if (!context) {
        throw new Error('useRouter must be used within a StructuralRouter');
    }
    return context;
}
// Main router component
export const StructuralRouter = ({ config, initialRoute = '/', onRouteChange, children }) => {
    const [currentRoute, setCurrentRoute] = useState(initialRoute);
    const [routeHistory, setRouteHistory] = useState([initialRoute]);
    const [structuralSystem] = useState(() => new StructuralSystem(config));
    // Handle route changes
    const navigate = (path) => {
        const route = structuralSystem.findRoute(path);
        if (route) {
            setCurrentRoute(path);
            setRouteHistory(prev => [...prev, path]);
            onRouteChange?.(path);
        }
        else {
            console.warn(`Route not found: ${path}`);
        }
    };
    // Handle back navigation
    const goBack = () => {
        if (routeHistory.length > 1) {
            const newHistory = routeHistory.slice(0, -1);
            const previousRoute = newHistory[newHistory.length - 1];
            setCurrentRoute(previousRoute);
            setRouteHistory(newHistory);
            onRouteChange?.(previousRoute);
        }
    };
    // Get breadcrumbs for current route
    const breadcrumbs = structuralSystem.getBreadcrumbs(currentRoute);
    // Context value
    const contextValue = {
        currentRoute,
        navigate,
        goBack,
        breadcrumbs,
        structuralSystem
    };
    // Handle initial route validation
    useEffect(() => {
        const route = structuralSystem.findRoute(initialRoute);
        if (!route) {
            console.warn(`Initial route not found: ${initialRoute}`);
            // Try to find a valid default route
            const defaultRoute = config.RoutingConfig.routes.find(r => r.component)?.path;
            if (defaultRoute && defaultRoute !== initialRoute) {
                setCurrentRoute(defaultRoute);
                setRouteHistory([defaultRoute]);
                onRouteChange?.(defaultRoute);
            }
        }
    }, [initialRoute, structuralSystem, config.RoutingConfig.routes, onRouteChange]);
    return (_jsx(RouterContext.Provider, { value: contextValue, children: _jsxs("div", { className: "structural-router", children: [_jsx(RouterHeader, {}), _jsxs("div", { className: "router-content", children: [_jsx(RouterSidebar, {}), _jsx(RouterMain, { children: children })] })] }) }));
};
// Router header component
const RouterHeader = () => {
    const { currentRoute, breadcrumbs, goBack } = useRouter();
    return (_jsxs("header", { className: "router-header", children: [_jsxs("div", { className: "header-content", children: [_jsx("h1", { className: "router-title", children: "Log View Machine" }), _jsx("nav", { className: "breadcrumb-nav", children: breadcrumbs.map((item, index) => (_jsxs("span", { className: "breadcrumb-item", children: [index > 0 && _jsx("span", { className: "breadcrumb-separator", children: "/" }), _jsx("span", { className: "breadcrumb-label", children: item.label })] }, item.id))) })] }), _jsx("button", { className: "back-button", onClick: goBack, disabled: breadcrumbs.length <= 1, children: "\u2190 Back" })] }));
};
// Router sidebar component
const RouterSidebar = () => {
    const { structuralSystem, navigate, currentRoute } = useRouter();
    const config = structuralSystem.getRoutingConfig();
    const renderNavigationItems = (items) => {
        return items.map(item => (_jsxs("div", { className: "nav-item", children: [_jsxs("button", { className: `nav-button ${currentRoute === item.path ? 'active' : ''}`, onClick: () => navigate(item.path), children: [item.icon && _jsx("span", { className: "nav-icon", children: item.icon }), _jsx("span", { className: "nav-label", children: item.label })] }), item.children && (_jsx("div", { className: "nav-children", children: renderNavigationItems(item.children) }))] }, item.id)));
    };
    return (_jsxs("aside", { className: "router-sidebar", children: [_jsxs("nav", { className: "primary-navigation", children: [_jsx("h3", { className: "nav-section-title", children: "Primary" }), renderNavigationItems(config.navigation.primary)] }), config.navigation.secondary && (_jsxs("nav", { className: "secondary-navigation", children: [_jsx("h3", { className: "nav-section-title", children: "Secondary" }), renderNavigationItems(config.navigation.secondary)] }))] }));
};
// Router main content area
const RouterMain = ({ children }) => {
    return (_jsx("main", { className: "router-main", children: children }));
};
export const Route = ({ path, component: Component, fallback: Fallback }) => {
    const { currentRoute, structuralSystem } = useRouter();
    if (currentRoute === path) {
        return _jsx(Component, {});
    }
    if (Fallback) {
        return _jsx(Fallback, {});
    }
    return null;
};
// Default fallback component
export const RouteFallback = () => {
    const { currentRoute } = useRouter();
    return (_jsxs("div", { className: "route-fallback", children: [_jsx("h2", { children: "Route Not Found" }), _jsxs("p", { children: ["The route \"", currentRoute, "\" could not be found."] })] }));
};
// Export the router components
export default StructuralRouter;
