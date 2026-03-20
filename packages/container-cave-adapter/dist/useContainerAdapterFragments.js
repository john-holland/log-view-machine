"use strict";
/**
 * Hook to fetch Tome header/footer from Continuuum API for use with ContainerAdapterProvider.
 * Use when the Cave server exposes /api/cave/tome/header and /api/cave/tome/footer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.useContainerAdapterFragmentsFromApi = useContainerAdapterFragmentsFromApi;
const react_1 = require("react");
/**
 * Fetches header and footer HTML from the Continuuum Cave API.
 */
function useContainerAdapterFragmentsFromApi(apiBaseUrl) {
    const [headerFragment, setHeaderFragment] = (0, react_1.useState)(null);
    const [footerFragment, setFooterFragment] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        if (!apiBaseUrl) {
            setHeaderFragment(null);
            setFooterFragment(null);
            setIsLoading(false);
            setError(null);
            return;
        }
        const base = apiBaseUrl.replace(/\/$/, '');
        const headerUrl = `${base}/api/cave/tome/header`;
        const footerUrl = `${base}/api/cave/tome/footer`;
        let cancelled = false;
        async function fetchFragments() {
            setIsLoading(true);
            setError(null);
            try {
                const [headerRes, footerRes] = await Promise.all([
                    fetch(headerUrl),
                    fetch(footerUrl),
                ]);
                if (cancelled)
                    return;
                if (!headerRes.ok || !footerRes.ok) {
                    setError(`Failed to fetch: ${headerRes.status} / ${footerRes.status}`);
                    return;
                }
                const [headerHtml, footerHtml] = await Promise.all([
                    headerRes.text(),
                    footerRes.text(),
                ]);
                if (cancelled)
                    return;
                setHeaderFragment(headerHtml);
                setFooterFragment(footerHtml);
            }
            catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Fetch failed');
                }
            }
            finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }
        fetchFragments();
        return () => {
            cancelled = true;
        };
    }, [apiBaseUrl]);
    return {
        headerFragment,
        footerFragment,
        isLoading,
        error,
    };
}
