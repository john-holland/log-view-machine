/**
 * Tests for hash factory implementations.
 */

import { createDefaultHashFactory } from '../src/hashFactories';

describe('hashFactories', () => {
  describe('createDefaultHashFactory', () => {
    const factory = createDefaultHashFactory();
    const secret = 'test-secret-key';

    it('should hash a string payload', async () => {
      const payload = 'test message';
      const hash = await factory.hash(payload, secret);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash an object payload', async () => {
      const payload = { action: 'test', data: { foo: 'bar' } };
      const hash = await factory.hash(payload, secret);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });

    it('should produce consistent hashes for same input', async () => {
      const payload = { action: 'test', data: { foo: 'bar' } };
      const hash1 = await factory.hash(payload, secret);
      const hash2 = await factory.hash(payload, secret);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different secrets', async () => {
      const payload = { action: 'test' };
      const hash1 = await factory.hash(payload, 'secret1');
      const hash2 = await factory.hash(payload, 'secret2');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce different hashes for different payloads', async () => {
      const payload1 = { action: 'test1' };
      const payload2 = { action: 'test2' };
      const hash1 = await factory.hash(payload1, secret);
      const hash2 = await factory.hash(payload2, secret);
      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct hash', async () => {
      const payload = { action: 'test', data: { foo: 'bar' } };
      const hash = await factory.hash(payload, secret);
      const isValid = await factory.verify(payload, hash, secret);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect hash', async () => {
      const payload = { action: 'test' };
      const hash = await factory.hash(payload, secret);
      const wrongHash = hash.slice(0, -1) + 'X';
      const isValid = await factory.verify(payload, wrongHash, secret);
      expect(isValid).toBe(false);
    });

    it('should reject hash with wrong secret', async () => {
      const payload = { action: 'test' };
      const hash = await factory.hash(payload, secret);
      const isValid = await factory.verify(payload, hash, 'wrong-secret');
      expect(isValid).toBe(false);
    });

    it('should reject hash for modified payload', async () => {
      const payload = { action: 'test' };
      const hash = await factory.hash(payload, secret);
      const modifiedPayload = { action: 'test', modified: true };
      const isValid = await factory.verify(modifiedPayload, hash, secret);
      expect(isValid).toBe(false);
    });

    it('should handle empty string payload', async () => {
      const hash = await factory.hash('', secret);
      expect(hash).toBeDefined();
      const isValid = await factory.verify('', hash, secret);
      expect(isValid).toBe(true);
    });

    it('should handle empty object payload', async () => {
      const payload = {};
      const hash = await factory.hash(payload, secret);
      expect(hash).toBeDefined();
      const isValid = await factory.verify(payload, hash, secret);
      expect(isValid).toBe(true);
    });
  });
});
