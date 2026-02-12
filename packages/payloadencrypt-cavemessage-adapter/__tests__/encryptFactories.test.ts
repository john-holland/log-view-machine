/**
 * Tests for encryption factory implementations.
 */

import { createDefaultEncryptFactory } from '../src/encryptFactories';
import type { EncryptedPayload } from '../src/types';

describe('encryptFactories', () => {
  describe('createDefaultEncryptFactory', () => {
    const factory = createDefaultEncryptFactory();
    const secret = 'test-secret-key-32-bytes-long!!';

    it('should encrypt a string payload', async () => {
      const payload = 'test message';
      const encrypted = await factory.encrypt(payload, secret);
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
    });

    it('should encrypt an object payload', async () => {
      const payload = { action: 'test', data: { foo: 'bar' } };
      const encrypted = await factory.encrypt(payload, secret);
      expect(encrypted).toBeDefined();
      expect(encrypted.data).toBeDefined();
      expect(encrypted.iv).toBeDefined();
    });

    it('should decrypt encrypted payload', async () => {
      const payload = { action: 'test', data: { foo: 'bar' } };
      const encrypted = await factory.encrypt(payload, secret);
      const decrypted = await factory.decrypt(encrypted, secret);
      expect(decrypted).toEqual(payload);
    });

    it('should produce different IVs for same payload', async () => {
      const payload = { action: 'test' };
      const encrypted1 = await factory.encrypt(payload, secret);
      const encrypted2 = await factory.encrypt(payload, secret);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.data).not.toBe(encrypted2.data);
    });

    it('should decrypt both encryptions correctly', async () => {
      const payload = { action: 'test' };
      const encrypted1 = await factory.encrypt(payload, secret);
      const encrypted2 = await factory.encrypt(payload, secret);
      const decrypted1 = await factory.decrypt(encrypted1, secret);
      const decrypted2 = await factory.decrypt(encrypted2, secret);
      expect(decrypted1).toEqual(payload);
      expect(decrypted2).toEqual(payload);
    });

    it('should fail to decrypt with wrong secret', async () => {
      const payload = { action: 'test' };
      const encrypted = await factory.encrypt(payload, secret);
      await expect(factory.decrypt(encrypted, 'wrong-secret')).rejects.toThrow();
    });

    it('should fail to decrypt with corrupted data', async () => {
      const payload = { action: 'test' };
      const encrypted = await factory.encrypt(payload, secret);
      const corrupted: EncryptedPayload = {
        ...encrypted,
        data: encrypted.data.slice(0, -1) + 'X',
      };
      await expect(factory.decrypt(corrupted, secret)).rejects.toThrow();
    });

    it('should fail to decrypt with corrupted tag', async () => {
      const payload = { action: 'test' };
      const encrypted = await factory.encrypt(payload, secret);
      if (!encrypted.tag) {
        // Skip test if tag is not present (shouldn't happen with GCM)
        return;
      }
      // Corrupt the tag by changing multiple characters
      const corruptedTag = encrypted.tag.split('').map((c, i) => i < 2 ? 'X' : c).join('');
      const corrupted: EncryptedPayload = {
        ...encrypted,
        tag: corruptedTag,
      };
      await expect(factory.decrypt(corrupted, secret)).rejects.toThrow();
    });

    it('should handle empty string payload', async () => {
      const encrypted = await factory.encrypt('', secret);
      const decrypted = await factory.decrypt(encrypted, secret);
      expect(decrypted).toBe('');
    });

    it('should handle empty object payload', async () => {
      const payload = {};
      const encrypted = await factory.encrypt(payload, secret);
      const decrypted = await factory.decrypt(encrypted, secret);
      expect(decrypted).toEqual(payload);
    });

    it('should handle large payload', async () => {
      const payload = { data: 'x'.repeat(10000) };
      const encrypted = await factory.encrypt(payload, secret);
      const decrypted = await factory.decrypt(encrypted, secret);
      expect(decrypted).toEqual(payload);
    });

    it('should preserve JSON structure', async () => {
      const payload = {
        nested: {
          array: [1, 2, 3],
          string: 'test',
          number: 42,
          boolean: true,
          null: null,
        },
      };
      const encrypted = await factory.encrypt(payload, secret);
      const decrypted = await factory.decrypt(encrypted, secret);
      expect(decrypted).toEqual(payload);
    });
  });
});
