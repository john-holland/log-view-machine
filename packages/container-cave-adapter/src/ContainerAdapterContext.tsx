import React, { createContext, useContext, useMemo, useState, useCallback, useRef, ReactNode } from 'react';

/** Valid HTML/React tag: alphanumeric + hyphen. */
const VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*$/;

export function parseContainerOverrideTag(tag: string | undefined): string {
  if (!tag || typeof tag !== 'string') return 'div';
  const trimmed = tag.trim();
  return VALID_TAG_REGEX.test(trimmed) ? trimmed : 'div';
}

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

const defaultContextValue: ContainerAdapterContextValue = {
  headerInjected: false,
  footerInjected: false,
  setHeaderInjected: () => {},
  setFooterInjected: () => {},
  claimHeaderInjection: () => false,
  claimFooterInjection: () => false,
  containerOverrideCount: 0,
  incrementContainerOverride: () => true,
};

export const ContainerAdapterContext = createContext<ContainerAdapterContextValue>(defaultContextValue);

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

export function ContainerAdapterProvider({
  caveId,
  tomeId,
  containerOverrideTag,
  containerOverrideClasses,
  containerOverrideLimit,
  headerFragment,
  footerFragment,
  children,
}: ContainerAdapterProviderProps): React.ReactElement {
  const [headerInjected, setHeaderInjected] = useState(false);
  const [footerInjected, setFooterInjected] = useState(false);
  const [containerOverrideCount, setContainerOverrideCount] = useState(0);
  const countRef = useRef(0);
  const headerClaimedRef = useRef(false);
  const footerClaimedRef = useRef(false);

  const claimHeaderInjection = useCallback((): boolean => {
    if (headerClaimedRef.current) return false;
    headerClaimedRef.current = true;
    setHeaderInjected(true);
    return true;
  }, []);

  const claimFooterInjection = useCallback((): boolean => {
    if (footerClaimedRef.current) return false;
    footerClaimedRef.current = true;
    setFooterInjected(true);
    return true;
  }, []);

  const incrementContainerOverride = useCallback((): boolean => {
    const next = countRef.current + 1;
    countRef.current = next;
    setContainerOverrideCount(next);
    if (containerOverrideLimit !== undefined && next > containerOverrideLimit) {
      return false;
    }
    return true;
  }, [containerOverrideLimit]);

  const value: ContainerAdapterContextValue = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <ContainerAdapterContext.Provider value={value}>
      {children}
    </ContainerAdapterContext.Provider>
  );
}

export function useContainerAdapter(): ContainerAdapterContextValue {
  return useContext(ContainerAdapterContext);
}
