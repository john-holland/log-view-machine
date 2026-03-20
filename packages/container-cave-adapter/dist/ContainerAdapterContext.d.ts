import React, { ReactNode } from 'react';
export declare function parseContainerOverrideTag(tag: string | undefined): string;
export interface ContainerAdapterContextValue {
    caveId?: string;
    tomeId?: string;
    headerInjected: boolean;
    footerInjected: boolean;
    setHeaderInjected: (v: boolean) => void;
    setFooterInjected: (v: boolean) => void;
    /** Synchronous claim: returns true only for the first caller; used to render header once. */
    claimHeaderInjection: () => boolean;
    /** Synchronous claim: returns true only for the first caller; used to render footer once. */
    claimFooterInjection: () => boolean;
    containerOverrideTag?: string;
    /** Classes for the container element (e.g. "container-mod-foo composed-view"). */
    containerOverrideClasses?: string;
    containerOverrideLimit?: number;
    containerOverrideCount: number;
    incrementContainerOverride: () => boolean;
    headerFragment?: ReactNode;
    footerFragment?: ReactNode;
}
export declare const ContainerAdapterContext: React.Context<ContainerAdapterContextValue>;
export interface ContainerAdapterProviderProps {
    caveId?: string;
    tomeId?: string;
    containerOverrideTag?: string;
    /** Classes for the container element (e.g. "container-mod-foo composed-view"). */
    containerOverrideClasses?: string;
    containerOverrideLimit?: number;
    headerFragment?: string | ReactNode;
    footerFragment?: string | ReactNode;
    children: ReactNode;
}
export declare function ContainerAdapterProvider({ caveId, tomeId, containerOverrideTag, containerOverrideClasses, containerOverrideLimit, headerFragment, footerFragment, children, }: ContainerAdapterProviderProps): React.ReactElement;
export declare function useContainerAdapter(): ContainerAdapterContextValue;
//# sourceMappingURL=ContainerAdapterContext.d.ts.map