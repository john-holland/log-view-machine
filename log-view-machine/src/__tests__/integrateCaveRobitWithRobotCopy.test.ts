/**
 * Unit tests for integrateCaveRobitWithRobotCopy
 */

import { createCaveRobitTransport, createRobotCopyConfigWithCaveRobit } from '../core/Cave/integrateCaveRobitWithRobotCopy';
import type { CaveInstance } from '../core/Cave/Cave';
import { createCaveRobit } from '../core/Cave/CaveRobit';

function mockCave(opts: {
  name: string;
  getTransportForTarget?: (from: string, path: string) => unknown;
  getConfig?: () => { caveRobit?: unknown };
}): CaveInstance {
  return {
    name: opts.name,
    getTransportForTarget: opts.getTransportForTarget,
    getConfig: opts.getConfig,
    getRenderTarget: () => ({}),
  } as CaveInstance;
}

describe('integrateCaveRobitWithRobotCopy', () => {
  describe('createCaveRobitTransport', () => {
    it('uses cave.getTransportForTarget when available', async () => {
      const descriptor = { type: 'in-app' as const };
      const cave = mockCave({
        name: 'main',
        getTransportForTarget: () => descriptor,
      });
      const transport = createCaveRobitTransport({ cave });
      const result = await transport.send('ping', {});
      expect(result).toEqual({});
    });

    it('uses caveRobit from options when cave has no getTransportForTarget', async () => {
      const caveRobit = createCaveRobit({
        routes: [
          { fromCave: 'main', toTome: 'tome1', path: '/', transport: { type: 'in-app' } },
        ],
      });
      const cave = mockCave({ name: 'main', getConfig: () => ({}) });
      const transport = createCaveRobitTransport({ cave, caveRobit });
      const result = await transport.send('ping', { toTome: 'tome1' });
      expect(result).toEqual({});
    });

    it('uses caveRobit from cave.getConfig when not in options', async () => {
      const caveRobit = createCaveRobit({
        routes: [
          { fromCave: 'main', toTome: 'tome1', path: '/', transport: { type: 'in-app' } },
        ],
      });
      const cave = mockCave({
        name: 'main',
        getConfig: () => ({ caveRobit }),
      });
      const transport = createCaveRobitTransport({ cave });
      const result = await transport.send('ping', { toTome: 'tome1' });
      expect(result).toEqual({});
    });

    it('delegates to httpTransport when descriptor type is http', async () => {
      const httpSend = jest.fn().mockResolvedValue({ ok: true });
      const cave = mockCave({
        name: 'main',
        getTransportForTarget: () => ({ type: 'http', config: {} }),
      });
      const transport = createCaveRobitTransport({
        cave,
        httpTransport: { send: httpSend },
      });
      await transport.send('ping', { path: '/' });
      expect(httpSend).toHaveBeenCalledWith('ping', { path: '/' });
    });

    it('passes fromCave override to getTransportForTarget', async () => {
      const getTransportForTarget = jest.fn().mockReturnValue({ type: 'in-app' });
      const cave = mockCave({ name: 'main', getTransportForTarget });
      const transport = createCaveRobitTransport({
        cave,
        fromCave: 'tracing',
        getPath: (_, d) => (d.path as string) ?? '/',
      });
      await transport.send('ping', { path: '/logs' });
      expect(getTransportForTarget).toHaveBeenCalledWith('tracing', '/logs');
    });

    it('uses getPath extractor when provided', async () => {
      const getTransportForTarget = jest.fn().mockReturnValue({ type: 'in-app' });
      const cave = mockCave({ name: 'main', getTransportForTarget });
      const transport = createCaveRobitTransport({
        cave,
        getPath: (_, d) => (d.customPath as string) ?? '/',
      });
      await transport.send('ping', { customPath: '/tracing/logs' });
      expect(getTransportForTarget).toHaveBeenCalledWith('main', '/tracing/logs');
    });

    it('defaults path to / when empty', async () => {
      const getTransportForTarget = jest.fn().mockReturnValue({ type: 'in-app' });
      const cave = mockCave({ name: 'main', getTransportForTarget });
      const transport = createCaveRobitTransport({ cave });
      await transport.send('ping', {});
      expect(getTransportForTarget).toHaveBeenCalledWith('main', '/');
    });

    it('throws when no resolver and no cave.getTransportForTarget', () => {
      const cave = mockCave({ name: 'main', getConfig: () => ({}) });
      expect(() => createCaveRobitTransport({ cave })).toThrow(
        /cave must have caveRobit or getTransportForTarget/
      );
    });

    it('throws for unimplemented transport type', async () => {
      const cave = mockCave({
        name: 'main',
        getTransportForTarget: () => ({ type: 'kafka', config: {} } as never),
      });
      const transport = createCaveRobitTransport({ cave });
      await expect(transport.send('ping', { path: '/' })).rejects.toThrow(/not implemented/);
    });
  });

  describe('createRobotCopyConfigWithCaveRobit', () => {
    it('returns config with transport and passes through baseConfig', () => {
      const cave = mockCave({
        name: 'main',
        getTransportForTarget: () => ({ type: 'in-app' }),
      });
      const baseConfig = {
        nodeBackendUrl: 'http://localhost:3000',
        apiBasePath: '/api',
        otherKey: 'other',
      };
      const config = createRobotCopyConfigWithCaveRobit(cave, baseConfig);
      expect(config.transport).toBeDefined();
      expect(typeof (config.transport as { send: unknown }).send).toBe('function');
      expect(config.nodeBackendUrl).toBe('http://localhost:3000');
      expect(config.apiBasePath).toBe('/api');
      expect(config.otherKey).toBe('other');
    });

    it('passes httpTransport to createCaveRobitTransport', async () => {
      const httpSend = jest.fn().mockResolvedValue({ ok: true });
      const cave = mockCave({
        name: 'main',
        getTransportForTarget: () => ({ type: 'http', config: {} }),
      });
      const config = createRobotCopyConfigWithCaveRobit(cave, {
        httpTransport: { send: httpSend },
      });
      await (config.transport as { send: (a: string, d: Record<string, unknown>) => Promise<unknown> }).send('ping', { path: '/' });
      expect(httpSend).toHaveBeenCalledWith('ping', expect.objectContaining({ path: '/' }));
    });

    it('uses data.path for getPath when sending', async () => {
      const getTransportForTarget = jest.fn().mockReturnValue({ type: 'in-app' });
      const cave = mockCave({ name: 'main', getTransportForTarget });
      const config = createRobotCopyConfigWithCaveRobit(cave, {});
      await (config.transport as { send: (a: string, d: Record<string, unknown>) => Promise<unknown> }).send('ping', { path: '/tracing', toTome: 'tome1' });
      expect(getTransportForTarget).toHaveBeenCalledWith('main', '/tracing');
    });
  });
});
