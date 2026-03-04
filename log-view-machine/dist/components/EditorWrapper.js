import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ErrorBoundary } from './ErrorBoundary';
/**
 * EditorWrapper – first-class editor option from wave-reader alignment.
 * Lightweight wrapper with ErrorBoundary; use for 3-panel tabbed editor or mod-building UI.
 * Zero ace-editor dependency; tree-shakeable.
 */
const EditorWrapper = ({ title, description, children, componentId, onError, router, hideHeader = false, }) => {
    return (_jsx(ErrorBoundary, { onError: onError, children: _jsxs("div", { className: "editor-wrapper", "data-component-id": componentId, children: [!hideHeader && (_jsxs("header", { className: "editor-wrapper-header", children: [_jsx("h2", { className: "editor-wrapper-title", children: title }), _jsx("p", { className: "editor-wrapper-description", children: description }), _jsxs("p", { className: "editor-wrapper-meta", children: ["Tome Architecture", componentId && ` | Component: ${componentId}`, router && ' | Router: Available'] })] })), _jsx("main", { className: "editor-wrapper-content", children: children }), _jsxs("footer", { className: "editor-wrapper-footer", children: ["Tome Architecture Enabled", router && ' | Router: Available'] })] }) }));
};
export default EditorWrapper;
