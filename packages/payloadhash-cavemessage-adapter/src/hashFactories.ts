/**
 * Default hash factory implementations for payload hashing.
 * Uses SHA-256 HMAC (Node crypto or Web Crypto API).
 */

import type { HashFactory } from './types';

function getCrypto(): {
  hashSync(data: string, secret: string): string;
  hashAsync?(data: string, secret: string): Promise<string>;
} {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const crypto = require('crypto');
      return {
        hashSync(data: string, secret: string): string {
          return crypto.createHmac('sha256', secret).update(data, 'utf8').digest('hex');
        },
      };
    } catch {
      // fall through to Web Crypto
    }
  }
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return {
      hashSync(_data: string, _secret: string): string {
        throw new Error('PayloadHash: sync hash not available in this environment; use async factory');
      },
      async hashAsync(data: string, secret: string): Promise<string> {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);
        const messageData = encoder.encode(data);
        
        // Import key for HMAC
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        
        // Sign (HMAC)
        const signature = await crypto.subtle.sign('HMAC', key, messageData);
        
        // Convert to hex string
        return Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      },
    };
  }
  throw new Error('PayloadHash: no crypto available (need Node crypto or Web Crypto API)');
}

const cryptoImpl = getCrypto();

function normalizePayload(payload: string | object): string {
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload);
}

/**
 * Default hash factory using SHA-256 HMAC.
 * Works in both Node.js and browser environments.
 */
export function createDefaultHashFactory(): HashFactory {
  return {
    async hash(payload: string | object, secret: string): Promise<string> {
      const normalized = normalizePayload(payload);
      if (cryptoImpl.hashAsync) {
        return await cryptoImpl.hashAsync(normalized, secret);
      }
      return cryptoImpl.hashSync(normalized, secret);
    },

    async verify(payload: string | object, hash: string, secret: string): Promise<boolean> {
      const normalized = normalizePayload(payload);
      let computedHash: string;
      if (cryptoImpl.hashAsync) {
        computedHash = await cryptoImpl.hashAsync(normalized, secret);
      } else {
        computedHash = cryptoImpl.hashSync(normalized, secret);
      }
      // Constant-time comparison to prevent timing attacks
      if (computedHash.length !== hash.length) return false;
      let result = 0;
      for (let i = 0; i < computedHash.length; i++) {
        result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
      }
      return result === 0;
    },
  };
}
