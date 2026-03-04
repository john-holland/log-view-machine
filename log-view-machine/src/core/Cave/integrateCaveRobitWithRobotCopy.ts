/**
 * Integration: CaveRobit + RobotCopy dual binding.
 * Provides a transport factory that resolves transport via CaveRobit for each sendMessage call.
 * Wire this as RobotCopyConfig.transport when using Cave with caveRobit.
 */

import type { CaveInstance } from './Cave';
import { createCaveRobit, type CaveRobit, type CaveRobitConfig, type TransportDescriptor } from './CaveRobit';

/** Options for creating CaveRobit-aware transport */
export interface CaveRobitTransportOptions {
  /** Cave instance (must have getTransportForTarget and getRenderTarget) */
  cave: CaveInstance;
  /** Optional: CaveRobit instance; when absent, cave must have caveRobit in config */
  caveRobit?: CaveRobit;
  /** Optional: fromCave override (default: cave.name) */
  fromCave?: string;
  /** Optional: extract toTome from action/data (default: data.toTome or data.tomeId) */
  getToTome?: (action: string, data: Record<string, unknown>) => string;
  /** Optional: extract path from action/data for getTransportForTarget */
  getPath?: (action: string, data: Record<string, unknown>) => string;
  /** Fallback: underlying transport when descriptor type is http (e.g. fetch). Pass a { send } object. */
  httpTransport?: { send: (action: string, data: Record<string, unknown>) => Promise<unknown> };
}

/**
 * Create a transport object suitable for RobotCopyConfig.transport.
 * When RobotCopy.sendMessage(action, data) is called, this transport:
 * 1. Resolves (fromCave, toTome, path) via CaveRobit
 * 2. For type 'http', delegates to httpTransport or uses fetch
 * 3. For type 'in-app', would need tomeManager - not implemented here; returns in-app as default
 *
 * Usage:
 *   const transport = createCaveRobitTransport({ cave, httpTransport: robotCopy });
 *   const rc = createRobotCopy({ transport });
 */
export function createCaveRobitTransport(options: CaveRobitTransportOptions): {
  send: (action: string, data: Record<string, unknown>) => Promise<unknown>;
} {
  const {
    cave,
    caveRobit,
    fromCave = cave.name,
    getToTome = (_, data) => (data.toTome as string) ?? (data.tomeId as string) ?? '',
    getPath = () => '',
    httpTransport,
  } = options;

  const configCaveRobit = cave.getConfig?.().caveRobit;
  const resolver =
    caveRobit ??
    (configCaveRobit && typeof (configCaveRobit as CaveRobit).getTransportForTarget === 'function'
      ? (configCaveRobit as CaveRobit)
      : configCaveRobit
        ? createCaveRobit(configCaveRobit as CaveRobitConfig)
        : undefined);
  if (!resolver && !cave.getTransportForTarget) {
    throw new Error('integrateCaveRobitWithRobotCopy: cave must have caveRobit or getTransportForTarget');
  }

  return {
    async send(action: string, data: Record<string, unknown> = {}): Promise<unknown> {
      const toTome = getToTome(action, data);
      const path = getPath(action, data);
      let descriptor: TransportDescriptor;
      const effectivePath = path || '/';
      if (cave.getTransportForTarget && effectivePath) {
        const result = cave.getTransportForTarget(fromCave, effectivePath);
        descriptor =
          result && typeof (result as Promise<TransportDescriptor>).then === 'function'
            ? await (result as Promise<TransportDescriptor>)
            : (result as TransportDescriptor);
      } else if (resolver) {
        const result = resolver.getTransportForTarget(fromCave, toTome, effectivePath);
        descriptor =
          result && typeof (result as Promise<TransportDescriptor>).then === 'function'
            ? await (result as Promise<TransportDescriptor>)
            : (result as TransportDescriptor);
      } else {
        descriptor = { type: 'in-app' };
      }

      if (descriptor.type === 'http') {
        if (httpTransport) {
          return httpTransport.send(action, data);
        }
        const baseUrl = (descriptor.config?.baseUrl as string) ?? (descriptor.config?.url as string) ?? '';
        if (!baseUrl) {
          throw new Error('CaveRobit transport http requires baseUrl or url in config');
        }
        const apiPath = (descriptor.config?.apiBasePath as string) ?? '/api';
        const url = `${baseUrl.replace(/\/$/, '')}${apiPath}/${action}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json().catch(() => ({}));
      }

      if (descriptor.type === 'in-app') {
        return {};
      }

      throw new Error(
        `CaveRobit transport type "${descriptor.type}" not implemented; use http or in-app, or provide custom transport`
      );
    },
  };
}

/**
 * Wire Cave and RobotCopy for dual binding.
 * Returns a RobotCopy config that can be passed to createRobotCopy, with transport resolved via CaveRobit.
 * httpTransport from baseConfig is passed through for HTTP descriptor delegation.
 */
export function createRobotCopyConfigWithCaveRobit(
  cave: CaveInstance,
  baseConfig: Record<string, unknown> & {
    nodeBackendUrl?: string;
    apiBasePath?: string;
    /** Passthrough: used when CaveRobit resolves to http transport */
    httpTransport?: { send: (action: string, data: Record<string, unknown>) => Promise<unknown> };
  } = {}
): Record<string, unknown> {
  const { httpTransport, ...rest } = baseConfig;
  const transport = createCaveRobitTransport({
    cave,
    fromCave: cave.name,
    getToTome: (_, data) => (data.toTome as string) ?? (data.tomeId as string) ?? '',
    getPath: (_, data) => (data.path as string) ?? '/',
    httpTransport,
  });
  return {
    ...rest,
    transport,
  };
}
