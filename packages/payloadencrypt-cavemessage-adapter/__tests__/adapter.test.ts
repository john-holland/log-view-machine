/**
 * Tests for payload encrypt adapter.
 */

import { createRobotCopy, type RobotCopy } from 'log-view-machine';
import { createPayloadEncryptRobotCopy, createPayloadEncryptMiddleware } from '../src/index';
import { createDefaultEncryptFactory } from '../src/encryptFactories';

describe('payloadencrypt-cavemessage-adapter', () => {
  describe('createPayloadEncryptRobotCopy', () => {
    let robotCopy: RobotCopy;
    const secret = 'test-secret-key-32-bytes-long!!';

    beforeEach(() => {
      robotCopy = createRobotCopy({
        nodeBackendUrl: 'http://localhost:3001',
        apiBasePath: '/api',
      });
    });

    it('should wrap RobotCopy instance', () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, { secret });
      expect(wrapped).toBeDefined();
      expect(wrapped).not.toBe(robotCopy);
    });

    it('should preserve RobotCopy methods', () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, { secret });
      expect(wrapped.generateMessageId).toBeDefined();
      expect(wrapped.generateTraceId).toBeDefined();
      expect(wrapped.getConfig).toBeDefined();
    });

    it('should encrypt payload when sending message', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, { secret });
      
      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      const payload = { action: 'test', data: { foo: 'bar' } };
      await wrapped.sendMessage('test-action', payload);

      expect(capturedData).toBeDefined();
      expect(capturedData._encryptedPayload).toBeDefined();
      expect(capturedData._encryptedPayload.data).toBeDefined();
      expect(capturedData._encryptedPayload.iv).toBeDefined();
      expect(capturedData._encryptedPayload.tag).toBeDefined();
      expect(capturedData.action).toBeUndefined();
      expect(capturedData.data).toBeUndefined();
    });

    it('should use custom encrypted field name', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, {
        secret,
        encryptedField: 'customEncrypted',
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('test', { foo: 'bar' });
      expect(capturedData.customEncrypted).toBeDefined();
      expect(capturedData._encryptedPayload).toBeUndefined();
    });

    it('should decrypt response payload', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, { secret });
      const factory = createDefaultEncryptFactory();
      
      const responsePayload = { result: 'success', data: { value: 42 } };
      const encrypted = await factory.encrypt(responsePayload, secret);
      
      (robotCopy as any).sendMessage = async () => {
        return { _encryptedPayload: encrypted };
      };

      const result = await wrapped.sendMessage('test', {});
      expect(result).toEqual(responsePayload);
      expect(result._encryptedPayload).toBeUndefined();
    });

    it('should throw error on decryption failure', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, { secret });
      
      (robotCopy as any).sendMessage = async () => {
        return {
          _encryptedPayload: {
            data: 'invalid',
            iv: 'invalid',
            tag: 'invalid',
            algorithm: 'aes-256-gcm',
          },
        };
      };

      await expect(wrapped.sendMessage('test', {})).rejects.toThrow('decryption failed');
    });

    it('should skip encryption when disabled', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, {
        secret,
        enabled: false,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      const payload = { action: 'test' };
      await wrapped.sendMessage('test', payload);
      expect(capturedData._encryptedPayload).toBeUndefined();
      expect(capturedData).toEqual(payload);
    });

    it('should skip encryption when enabled function returns false', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, {
        secret,
        enabled: (action) => action !== 'skip',
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('skip', { foo: 'bar' });
      expect(capturedData._encryptedPayload).toBeUndefined();
    });

    it('should use custom encrypt factory', async () => {
      const customFactory = {
        encrypt: async (payload: any, secret: string) => ({
          data: 'custom-data',
          iv: 'custom-iv',
          tag: 'custom-tag',
          algorithm: 'custom',
        }),
        decrypt: async (encrypted: any, secret: string) => ({ decrypted: true }),
      };

      const wrapped = createPayloadEncryptRobotCopy(robotCopy, {
        secret,
        encryptFactory: customFactory,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { _encryptedPayload: { data: 'custom-data', iv: 'custom-iv', tag: 'custom-tag' } };
      };

      await wrapped.sendMessage('test', {});
      expect(capturedData._encryptedPayload.data).toBe('custom-data');
    });

    it('should handle secret function', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, {
        secret: () => secret,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('test', {});
      expect(capturedData._encryptedPayload).toBeDefined();
    });

    it('should handle async secret function', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, {
        secret: async () => secret,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('test', {});
      expect(capturedData._encryptedPayload).toBeDefined();
    });

    it('should handle response without encrypted payload', async () => {
      const wrapped = createPayloadEncryptRobotCopy(robotCopy, { secret });
      
      (robotCopy as any).sendMessage = async () => {
        return { success: true, data: 'plain response' };
      };

      const result = await wrapped.sendMessage('test', {});
      expect(result).toEqual({ success: true, data: 'plain response' });
    });
  });

  describe('createPayloadEncryptMiddleware', () => {
    const secret = 'test-secret-key-32-bytes-long!!';

    it('should create middleware function', () => {
      const middleware = createPayloadEncryptMiddleware({ secret });
      expect(typeof middleware).toBe('function');
    });

    it('should skip non-POST/PUT/PATCH requests', async () => {
      const middleware = createPayloadEncryptMiddleware({ secret });
      const req = {
        method: 'GET',
        path: '/test',
        headers: {},
        query: {},
        body: { foo: 'bar' },
      };
      const next = jest.fn().mockResolvedValue({ status: 200, body: {} });

      await middleware(req as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should skip requests without body', async () => {
      const middleware = createPayloadEncryptMiddleware({ secret });
      const req = {
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
      };
      const next = jest.fn().mockResolvedValue({ status: 200, body: {} });

      await middleware(req as any, next);
      expect(next).toHaveBeenCalled();
    });

    it('should encrypt request body', async () => {
      const middleware = createPayloadEncryptMiddleware({ secret });
      const body = { action: 'test', data: { foo: 'bar' } };
      const req = {
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        body,
      };
      const next = jest.fn().mockResolvedValue({ status: 200, body: {} });

      await middleware(req as any, next);

      expect((req as any).body._encryptedPayload).toBeDefined();
      expect((req as any).body.action).toBeUndefined();
      expect((req as any).body.data).toBeUndefined();
    });

    it('should decrypt response payload', async () => {
      const middleware = createPayloadEncryptMiddleware({ secret });
      const factory = createDefaultEncryptFactory();
      const responseBody = { result: 'success' };
      const encrypted = await factory.encrypt(responseBody, secret);
      
      const req = {
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        body: { action: 'test' },
      };
      const next = jest.fn().mockResolvedValue({
        status: 200,
        body: { _encryptedPayload: encrypted },
      });

      const response = await middleware(req as any, next);
      const body = response.body as any;
      expect(body._encryptedPayload).toBeUndefined();
      expect(body).toEqual(responseBody);
    });

    it('should return error on decryption failure', async () => {
      const middleware = createPayloadEncryptMiddleware({ secret });
      const req = {
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        body: { action: 'test' },
      };
      const next = jest.fn().mockResolvedValue({
        status: 200,
        body: {
          _encryptedPayload: {
            data: 'invalid',
            iv: 'invalid',
            tag: 'invalid',
            algorithm: 'aes-256-gcm',
          },
        },
      });

      const response = await middleware(req as any, next);
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect((response.body as any).error).toBeDefined();
    });
  });
});
