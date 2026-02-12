/**
 * Types for payload hash message adapter.
 */

export interface HashFactory {
  /** Hash a payload (string or object) with a secret. Returns hash string. */
  hash: (payload: string | object, secret: string) => Promise<string> | string;
  /** Verify a payload matches the provided hash. Returns true if valid. */
  verify: (payload: string | object, hash: string, secret: string) => Promise<boolean> | boolean;
}

export interface PayloadHashAdapterOptions {
  /** Secret for hashing. Can be a string or a function that returns a string. */
  secret: string | (() => string | Promise<string>);
  /** Optional hash factory. If not provided, uses default SHA-256 HMAC factory. */
  hashFactory?: HashFactory;
  /** Field name in message body where hash is stored (default: '_payloadHash'). */
  hashField?: string;
  /** Optional header name for hash (if provided, hash is also sent in header). */
  headerName?: string;
  /** Enable/disable adapter. Can be boolean or function that checks action/data. */
  enabled?: boolean | ((action: string, data: unknown) => boolean);
}
