/**
 * Hook to fetch Tome header/footer from Continuuum API for use with ContainerAdapterProvider.
 * Use when the Cave server exposes /api/cave/tome/header and /api/cave/tome/footer.
 */

import { useState, useEffect } from 'react';

export interface UseContainerAdapterFragmentsResult {
  headerFragment: string | null;
  footerFragment: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetches header and footer HTML from the Continuuum Cave API.
 */
export function useContainerAdapterFragmentsFromApi(
  apiBaseUrl: string | null
): UseContainerAdapterFragmentsResult {
  const [headerFragment, setHeaderFragment] = useState<string | null>(null);
  const [footerFragment, setFooterFragment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

        if (cancelled) return;

        if (!headerRes.ok || !footerRes.ok) {
          setError(`Failed to fetch: ${headerRes.status} / ${footerRes.status}`);
          return;
        }

        const [headerHtml, footerHtml] = await Promise.all([
          headerRes.text(),
          footerRes.text(),
        ]);

        if (cancelled) return;

        setHeaderFragment(headerHtml);
        setFooterFragment(footerHtml);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Fetch failed');
        }
      } finally {
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
