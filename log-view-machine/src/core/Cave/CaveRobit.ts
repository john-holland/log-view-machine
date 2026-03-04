/**
 * CaveRobit - Dual of RobotCopy for transport resolution.
 * Maps (fromCave, toTome) to TransportDescriptor for automated transport selection.
 * Composed at CaveConfig level; decorator pattern for adapters.
 */

import type {
  TransportDescriptor,
  TransportType,
  CaveRobitRouteConfig,
} from './transport/types';

export type { TransportDescriptor, TransportType, CaveRobitRouteConfig } from './transport/types';

/** Adapter that wraps CaveRobit (decorator pattern). */
export type CaveRobitAdapter = (
  caveRobit: CaveRobit,
  config?: Record<string, unknown>
) => CaveRobit;

export interface CaveRobitConfig {
  /** Default transport when no route matches */
  defaultTransport?: TransportDescriptor;
  /** Route rules; first match wins (explicit before pattern before default) */
  routes?: CaveRobitRouteConfig[];
  /** Adapters to apply (decorator chain) */
  adapters?: CaveRobitAdapter[];
}

export interface CaveRobit {
  /** Resolve transport for (fromCave, toTome). toTome may come from getRenderTarget(path).tomeId */
  getTransportForTarget(
    fromCave: string,
    toTome: string,
    path?: string
  ): TransportDescriptor | Promise<TransportDescriptor>;
  /** Optional: register a transport strategy for a (fromCave, toTome) pair or pattern */
  registerRoute?(
    fromCave: string | RegExp,
    toTome: string | RegExp,
    descriptor: TransportDescriptor
  ): void;
}

const DEFAULT_TRANSPORT: TransportDescriptor = { type: 'in-app' };

function matchesValue(value: string, pattern: string | RegExp | undefined): boolean {
  if (pattern === undefined) return true;
  if (typeof pattern === 'string') {
    if (pattern === '*') return true;
    try {
      return new RegExp(pattern).test(value);
    } catch {
      return value === pattern;
    }
  }
  return pattern.test(value);
}

function resolveRoute(
  routes: CaveRobitRouteConfig[],
  fromCave: string,
  toTome: string,
  path: string
): TransportDescriptor | undefined {
  for (const route of routes) {
    const fromMatch = matchesValue(fromCave, route.fromCave);
    const toMatch = matchesValue(toTome, route.toTome);
    let pathMatch = true;
    if (route.pathPattern) {
      try {
        pathMatch = new RegExp(route.pathPattern).test(path ?? '');
      } catch {
        pathMatch = false;
      }
    }
    if (fromMatch && toMatch && pathMatch) {
      return route.transport;
    }
  }
  return undefined;
}

interface RuntimeRoute {
  fromCave: string | RegExp;
  toTome: string | RegExp;
  transport: TransportDescriptor;
}

/**
 * Create a CaveRobit instance with route-based transport resolution.
 * Resolution order: explicit route match -> pattern match -> defaultTransport -> in-app.
 */
export function createCaveRobit(config: CaveRobitConfig = {}): CaveRobit {
  const configRoutes = [...(config.routes ?? [])];
  const runtimeRoutes: RuntimeRoute[] = [];
  const defaultTransport = config.defaultTransport ?? DEFAULT_TRANSPORT;

  function findTransport(fromCave: string, toTome: string, path: string): TransportDescriptor | undefined {
    const result = resolveRoute(configRoutes, fromCave, toTome, path);
    if (result) return result;
    for (const route of runtimeRoutes) {
      const fromMatch = matchesValue(fromCave, route.fromCave);
      const toMatch = matchesValue(toTome, route.toTome);
      if (fromMatch && toMatch) return route.transport;
    }
    return undefined;
  }

  let caveRobit: CaveRobit = {
    getTransportForTarget(
      fromCave: string,
      toTome: string,
      path?: string
    ): TransportDescriptor | Promise<TransportDescriptor> {
      const result = findTransport(fromCave, toTome, path ?? '');
      return result ?? defaultTransport;
    },
    registerRoute(
      fromCave: string | RegExp,
      toTome: string | RegExp,
      descriptor: TransportDescriptor
    ): void {
      runtimeRoutes.push({ fromCave, toTome, transport: descriptor });
    },
  };

  // Apply adapters (decorator chain)
  for (const adapter of config.adapters ?? []) {
    caveRobit = adapter(caveRobit, config as unknown as Record<string, unknown>);
  }

  return caveRobit;
}

/** Options for createCaveRobitWithFallback adapter */
export interface CaveRobitFallbackOptions {
  /** Transport to use when inner CaveRobit returns or throws */
  fallbackTransport: TransportDescriptor;
}

/**
 * Decorator adapter: wraps CaveRobit and returns fallbackTransport on error or when inner returns in-app but fallback is preferred.
 * Use when you want a guaranteed fallback (e.g. HTTP) when primary resolution fails.
 */
export function createCaveRobitWithFallback(
  caveRobit: CaveRobit,
  options: CaveRobitFallbackOptions
): CaveRobit {
  const { fallbackTransport } = options;
  return {
    getTransportForTarget(
      fromCave: string,
      toTome: string,
      path?: string
    ): TransportDescriptor | Promise<TransportDescriptor> {
      try {
        const result = caveRobit.getTransportForTarget(fromCave, toTome, path);
        if (result && typeof (result as Promise<TransportDescriptor>).then === 'function') {
          return (result as Promise<TransportDescriptor>).catch(() => fallbackTransport);
        }
        return (result as TransportDescriptor) ?? fallbackTransport;
      } catch {
        return fallbackTransport;
      }
    },
    registerRoute:
      caveRobit.registerRoute &&
      ((fromCave: string | RegExp, toTome: string | RegExp, descriptor: TransportDescriptor) => {
        caveRobit.registerRoute!(fromCave, toTome, descriptor);
      }),
  };
}
