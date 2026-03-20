"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerAdapterContext = void 0;
exports.parseContainerOverrideTag = parseContainerOverrideTag;
exports.ContainerAdapterProvider = ContainerAdapterProvider;
exports.useContainerAdapter = useContainerAdapter;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/** Valid HTML/React tag: alphanumeric + hyphen. */
const VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*$/;
function parseContainerOverrideTag(tag) {
    if (!tag || typeof tag !== 'string')
        return 'div';
    const trimmed = tag.trim();
    return VALID_TAG_REGEX.test(trimmed) ? trimmed : 'div';
}
const defaultContextValue = {
    headerInjected: false,
    footerInjected: false,
    setHeaderInjected: () => { },
    setFooterInjected: () => { },
    claimHeaderInjection: () => false,
    claimFooterInjection: () => false,
    containerOverrideCount: 0,
    incrementContainerOverride: () => true,
};
exports.ContainerAdapterContext = (0, react_1.createContext)(defaultContextValue);
function ContainerAdapterProvider({ caveId, tomeId, containerOverrideTag, containerOverrideClasses, containerOverrideLimit, headerFragment, footerFragment, children, }) {
    const [headerInjected, setHeaderInjected] = (0, react_1.useState)(false);
    const [footerInjected, setFooterInjected] = (0, react_1.useState)(false);
    const [containerOverrideCount, setContainerOverrideCount] = (0, react_1.useState)(0);
    const countRef = (0, react_1.useRef)(0);
    const headerClaimedRef = (0, react_1.useRef)(false);
    const footerClaimedRef = (0, react_1.useRef)(false);
    const claimHeaderInjection = (0, react_1.useCallback)(() => {
        if (headerClaimedRef.current)
            return false;
        headerClaimedRef.current = true;
        setHeaderInjected(true);
        return true;
    }, []);
    const claimFooterInjection = (0, react_1.useCallback)(() => {
        if (footerClaimedRef.current)
            return false;
        footerClaimedRef.current = true;
        setFooterInjected(true);
        return true;
    }, []);
    const incrementContainerOverride = (0, react_1.useCallback)(() => {
        const next = countRef.current + 1;
        countRef.current = next;
        setContainerOverrideCount(next);
        if (containerOverrideLimit !== undefined && next > containerOverrideLimit) {
            return false;
        }
        return true;
    }, [containerOverrideLimit]);
    const value = (0, react_1.useMemo)(() => ({
        caveId,
        tomeId,
        headerInjected,
        footerInjected,
        setHeaderInjected,
        setFooterInjected,
        claimHeaderInjection,
        claimFooterInjection,
        containerOverrideTag: containerOverrideTag ? parseContainerOverrideTag(containerOverrideTag) : undefined,
        containerOverrideClasses,
        containerOverrideLimit,
        containerOverrideCount,
        incrementContainerOverride,
        headerFragment,
        footerFragment,
    }), [
        caveId,
        tomeId,
        headerInjected,
        footerInjected,
        claimHeaderInjection,
        claimFooterInjection,
        containerOverrideTag,
        containerOverrideClasses,
        containerOverrideLimit,
        containerOverrideCount,
        incrementContainerOverride,
        headerFragment,
        footerFragment,
    ]);
    return ((0, jsx_runtime_1.jsx)(exports.ContainerAdapterContext.Provider, { value: value, children: children }));
}
function useContainerAdapter() {
    return (0, react_1.useContext)(exports.ContainerAdapterContext);
}
