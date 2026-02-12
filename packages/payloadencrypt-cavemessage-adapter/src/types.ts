/**
 * Types for payload encrypt message adapter.
 */

export interface EncryptedPayload {
  /** Base64 encoded ciphertext */
  data: string;
  /** Base64 encoded initialization vector */
  iv: string;
  /** Base64 encoded authentication tag (for GCM mode) */
  tag?: string;
  /** Encryption algorithm identifier (e.g., 'aes-256-gcm') */
  algorithm?: string;
}

export interface EncryptFactory {
  /** Encrypt a payload (string or object) with a secret. Returns encrypted payload structure. */
  encrypt: (payload: string | object, secret: string) => Promise<EncryptedPayload> | EncryptedPayload;
  /** Decrypt an encrypted payload with a secret. Returns original payload. */
  decrypt: (encrypted: EncryptedPayload, secret: string) => Promise<string | object> | string | object;
}

export interface PayloadEncryptAdapterOptions {
  /** Secret for encryption. Can be a string or a function that returns a string. */
  secret: string | (() => string | Promise<string>);
  /** Optional encrypt factory. If not provided, uses default AES-256-GCM factory. */
  encryptFactory?: EncryptFactory;
  /** Field name in message body where encrypted payload is stored (default: '_encryptedPayload'). */
  encryptedField?: string;
  /** Optional header name for encrypted payload metadata (if provided, metadata is also sent in header). */
  headerName?: string;
  /** Enable/disable adapter. Can be boolean or function that checks action/data. */
  enabled?: boolean | ((action: string, data: unknown) => boolean);
}
