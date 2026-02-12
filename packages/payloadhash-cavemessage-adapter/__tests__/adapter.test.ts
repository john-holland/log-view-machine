/**
 * Tests for payload hash adapter.
 */

import { createRobotCopy, type RobotCopy } from 'log-view-machine';
import { createPayloadHashRobotCopy, createPayloadHashMiddleware } from '../src/index';
import { createDefaultHashFactory } from '../src/hashFactories';

describe('payloadhash-cavemessage-adapter', () => {
  describe('createPayloadHashRobotCopy', () => {
    let robotCopy: RobotCopy;
    const secret = 'test-secret-key';

    beforeEach(() => {
      robotCopy = createRobotCopy({
        nodeBackendUrl: 'http://localhost:3001',
        apiBasePath: '/api',
      });
    });

    it('should wrap RobotCopy instance', () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, { secret });
      expect(wrapped).toBeDefined();
      expect(wrapped).not.toBe(robotCopy);
    });

    it('should preserve RobotCopy methods', () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, { secret });
      expect(wrapped.generateMessageId).toBeDefined();
      expect(wrapped.generateTraceId).toBeDefined();
      expect(wrapped.getConfig).toBeDefined();
    });

    it('should add hash to payload when sending message', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, { secret });
      const factory = createDefaultHashFactory();
      
      // Mock sendMessage to capture the transformed data
      const originalSendMessage = robotCopy.sendMessage.bind(robotCopy);
      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      const payload = { action: 'test', data: { foo: 'bar' } };
      await wrapped.sendMessage('test-action', payload);

      expect(capturedData).toBeDefined();
      expect(capturedData._payloadHash).toBeDefined();
      expect(typeof capturedData._payloadHash).toBe('string');
      
      // Verify hash is correct
      const expectedHash = await factory.hash(payload, secret);
      expect(capturedData._payloadHash).toBe(expectedHash);
    });

    it('should use custom hash field name', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, {
        secret,
        hashField: 'customHash',
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('test', { foo: 'bar' });
      expect(capturedData.customHash).toBeDefined();
      expect(capturedData._payloadHash).toBeUndefined();
    });

    it('should verify response hash', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, { secret });
      const factory = createDefaultHashFactory();
      
      const responsePayload = { result: 'success', data: { value: 42 } };
      const responseHash = await factory.hash(responsePayload, secret);
      
      (robotCopy as any).sendMessage = async () => {
        return { ...responsePayload, _payloadHash: responseHash };
      };

      const result = await wrapped.sendMessage('test', {});
      expect(result).toEqual(responsePayload);
      expect(result._payloadHash).toBeUndefined();
    });

    it('should throw error on invalid response hash', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, { secret });
      
      (robotCopy as any).sendMessage = async () => {
        return { result: 'success', _payloadHash: 'invalid-hash' };
      };

      await expect(wrapped.sendMessage('test', {})).rejects.toThrow('hash verification failed');
    });

    it('should skip hashing when disabled', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, {
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
      expect(capturedData._payloadHash).toBeUndefined();
      expect(capturedData).toEqual(payload);
    });

    it('should skip hashing when enabled function returns false', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, {
        secret,
        enabled: (action) => action !== 'skip',
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('skip', { foo: 'bar' });
      expect(capturedData._payloadHash).toBeUndefined();
    });

    it('should use custom hash factory', async () => {
      const customFactory = {
        hash: async (payload: any, secret: string) => 'custom-hash',
        verify: async (payload: any, hash: string, secret: string) => hash === 'custom-hash',
      };

      const wrapped = createPayloadHashRobotCopy(robotCopy, {
        secret,
        hashFactory: customFactory,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true, _payloadHash: 'custom-hash' };
      };

      await wrapped.sendMessage('test', {});
      expect(capturedData._payloadHash).toBe('custom-hash');
    });

    it('should handle secret function', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, {
        secret: () => secret,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('test', {});
      expect(capturedData._payloadHash).toBeDefined();
    });

    it('should handle async secret function', async () => {
      const wrapped = createPayloadHashRobotCopy(robotCopy, {
        secret: async () => secret,
      });

      let capturedData: any;
      (robotCopy as any).sendMessage = async (action: string, data: any) => {
        capturedData = data;
        return { success: true };
      };

      await wrapped.sendMessage('test', {});
      expect(capturedData._payloadHash).toBeDefined();
    });
  });

  describe('createPayloadHashMiddleware', () => {
    const secret = 'test-secret-key';

    it('should create middleware function', () => {
      const middleware = createPayloadHashMiddleware({ secret });
      expect(typeof middleware).toBe('function');
    });

    it('should skip non-POST/PUT/PATCH requests', async () => {
      const middleware = createPayloadHashMiddleware({ secret });
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
      const middleware = createPayloadHashMiddleware({ secret });
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

    it('should hash request body', async () => {
      const middleware = createPayloadHashMiddleware({ secret });
      const factory = createDefaultHashFactory();
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

      expect((req as any).body._payloadHash).toBeDefined();
      const expectedHash = await factory.hash(body, secret);
      expect((req as any).body._payloadHash).toBe(expectedHash);
    });

    it('should verify response hash', async () => {
      const middleware = createPayloadHashMiddleware({ secret });
      const factory = createDefaultHashFactory();
      const responseBody = { result: 'success' };
      const responseHash = await factory.hash(responseBody, secret);
      
      const req = {
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        body: { action: 'test' },
      };
      const next = jest.fn().mockResolvedValue({
        status: 200,
        body: { ...responseBody, _payloadHash: responseHash },
      });

      const response = await middleware(req as any, next);
      const body = response.body as any;
      expect(body._payloadHash).toBeUndefined();
      expect(body).toEqual(responseBody);
    });

    it('should return error on invalid response hash', async () => {
      const middleware = createPayloadHashMiddleware({ secret });
      const req = {
        method: 'POST',
        path: '/test',
        headers: {},
        query: {},
        body: { action: 'test' },
      };
      const next = jest.fn().mockResolvedValue({
        status: 200,
        body: { result: 'success', _payloadHash: 'invalid' },
      });

      const response = await middleware(req as any, next);
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect((response.body as any).error).toBeDefined();
    });
  });
});
