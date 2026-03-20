/**
 * Hook to fetch Tome header/footer from Continuuum API for use with ContainerAdapterProvider.
 * Use when the Cave server exposes /api/cave/tome/header and /api/cave/tome/footer.
 */
export interface UseContainerAdapterFragmentsResult {
    headerFragment: string | null;
    footerFragment: string | null;
    isLoading: boolean;
    error: string | null;
}
/**
 * Fetches header and footer HTML from the Continuuum Cave API.
 */
export declare function useContainerAdapterFragmentsFromApi(apiBaseUrl: string | null): UseContainerAdapterFragmentsResult;
//# sourceMappingURL=useContainerAdapterFragments.d.ts.map