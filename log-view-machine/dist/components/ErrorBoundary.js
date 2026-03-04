import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
/**
 * Minimal ErrorBoundary for use by EditorWrapper and other editor components.
 * Catches React errors in the tree and optionally calls onError and renders fallback.
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        this.props.onError?.(error, errorInfo);
    }
    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsxs("div", { className: "editor-error-boundary", role: "alert", children: [_jsx("p", { children: "Something went wrong." }), _jsx("pre", { children: this.state.error.message })] }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
