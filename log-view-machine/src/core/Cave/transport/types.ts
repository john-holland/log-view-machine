/**
 * CaveRobit transport types.
 * Defines transport descriptors and route config for (fromCave, toTome) resolution.
 */

/** Built-in transport types for Cave-Tome message routing. */
export type TransportType =
  | 'in-app'           // same process, direct call
  | 'http'             // REST/HTTP
  | 'kafka'            // Kafka topic
  | 'udp'              // UDP datagram
  | 'named-pipe'       // Named pipe (Windows/Unix)
  | 'socket'           // TCP/Unix socket
  | 'chrome-messaging'; // Chrome extension API

/** Descriptor for how to reach a Tome; type-specific config in config. */
export interface TransportDescriptor {
  type: TransportType;
  /** Type-specific config (url, topic, path, tabId, host, port, etc.) */
  config?: Record<string, unknown>;
}

/** Route config for (fromCave, toTome) -> transport mapping. */
export interface CaveRobitRouteConfig {
  /** Cave name or '*' for any */
  fromCave?: string;
  /** Tome id or '*' for any */
  toTome?: string;
  /** Optional path regex for finer-grained routing */
  pathPattern?: string;
  transport: TransportDescriptor;
}
