/**
 * Default encryption factory implementations for payload encryption.
 * Uses AES-256-GCM (authenticated encryption) via Node crypto or Web Crypto API.
 */

import type { EncryptFactory, EncryptedPayload } from './types';

function getCrypto(): {
  encryptSync?(data: string, secret: string): EncryptedPayload;
  decryptSync?(encrypted: EncryptedPayload, secret: string): string;
  encryptAsync?(data: string, secret: string): Promise<EncryptedPayload>;
  decryptAsync?(encrypted: EncryptedPayload, secret: string): Promise<string>;
} {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const crypto = require('crypto');
      return {
        encryptSync(data: string, secret: string): EncryptedPayload {
          // Derive key from secret using SHA-256 (32 bytes for AES-256)
          const key = crypto.createHash('sha256').update(secret, 'utf8').digest();
          
          // Generate random IV (12 bytes for GCM)
          const iv = crypto.randomBytes(12);
          
          // Create cipher
          const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
          
          // Encrypt
          let encrypted = cipher.update(data, 'utf8');
          encrypted = Buffer.concat([encrypted, cipher.final()]);
          
          // Get authentication tag
          const tag = cipher.getAuthTag();
          
          return {
            data: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            tag: tag.toString('base64'),
            algorithm: 'aes-256-gcm',
          };
        },
        decryptSync(encrypted: EncryptedPayload, secret: string): string {
          // Derive key from secret
          const key = crypto.createHash('sha256').update(secret, 'utf8').digest();
          
          // Decode IV and tag
          const iv = Buffer.from(encrypted.iv, 'base64');
          const tag = Buffer.from(encrypted.tag || '', 'base64');
          const encryptedData = Buffer.from(encrypted.data, 'base64');
          
          // Create decipher
          const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
          decipher.setAuthTag(tag);
          
          // Decrypt
          let decrypted = decipher.update(encryptedData);
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          
          return decrypted.toString('utf8');
        },
      };
    } catch {
      // fall through to Web Crypto
    }
  }
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return {
      async encryptAsync(data: string, secret: string): Promise<EncryptedPayload> {
        const encoder = new TextEncoder();
        
        // Derive key from secret using SHA-256 (same as Node.js for compatibility)
        const secretKey = encoder.encode(secret);
        const hashBuffer = await crypto.subtle.digest('SHA-256', secretKey);
        const key = await crypto.subtle.importKey(
          'raw',
          hashBuffer,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt']
        );
        
        // Generate IV (12 bytes for GCM)
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt
        const dataArray = encoder.encode(data);
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv,
          },
          key,
          dataArray
        );
        
        // Extract tag (last 16 bytes for GCM)
        const encryptedArray = new Uint8Array(encrypted);
        const tag = encryptedArray.slice(-16);
        const ciphertext = encryptedArray.slice(0, -16);
        
        return {
          data: btoa(String.fromCharCode(...ciphertext)),
          iv: btoa(String.fromCharCode(...iv)),
          tag: btoa(String.fromCharCode(...tag)),
          algorithm: 'aes-256-gcm',
        };
      },
      async decryptAsync(encrypted: EncryptedPayload, secret: string): Promise<string> {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        
        // Derive key from secret using SHA-256 (same as Node.js for compatibility)
        const secretKey = encoder.encode(secret);
        const hashBuffer = await crypto.subtle.digest('SHA-256', secretKey);
        const key = await crypto.subtle.importKey(
          'raw',
          hashBuffer,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );
        
        // Decode IV and data
        const iv = Uint8Array.from(atob(encrypted.iv), (c) => c.charCodeAt(0));
        const tag = encrypted.tag ? Uint8Array.from(atob(encrypted.tag), (c) => c.charCodeAt(0)) : undefined;
        const encryptedData = Uint8Array.from(atob(encrypted.data), (c) => c.charCodeAt(0));
        
        // Combine ciphertext and tag for Web Crypto
        const combined = new Uint8Array(encryptedData.length + (tag?.length || 0));
        combined.set(encryptedData);
        if (tag) combined.set(tag, encryptedData.length);
        
        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
          },
          key,
          combined
        );
        
        return decoder.decode(decrypted);
      },
    };
  }
  throw new Error('PayloadEncrypt: no crypto available (need Node crypto or Web Crypto API)');
}

const cryptoImpl = getCrypto();

function normalizePayload(payload: string | object): string {
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload);
}

function parsePayload(data: string): string | object {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/**
 * Default encryption factory using AES-256-GCM.
 * Works in both Node.js and browser environments.
 */
export function createDefaultEncryptFactory(): EncryptFactory {
  return {
    async encrypt(payload: string | object, secret: string): Promise<EncryptedPayload> {
      const normalized = normalizePayload(payload);
      if (cryptoImpl.encryptAsync) {
        return await cryptoImpl.encryptAsync(normalized, secret);
      }
      if (cryptoImpl.encryptSync) {
        return cryptoImpl.encryptSync(normalized, secret);
      }
      throw new Error('PayloadEncrypt: encryption not available');
    },

    async decrypt(encrypted: EncryptedPayload, secret: string): Promise<string | object> {
      if (cryptoImpl.decryptAsync) {
        const decrypted = await cryptoImpl.decryptAsync(encrypted, secret);
        return parsePayload(decrypted);
      }
      if (cryptoImpl.decryptSync) {
        const decrypted = cryptoImpl.decryptSync(encrypted, secret);
        return parsePayload(decrypted);
      }
      throw new Error('PayloadEncrypt: decryption not available');
    },
  };
}
