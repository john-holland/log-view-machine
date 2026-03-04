/**
 * Unit tests for CaveRobit
 */

import {
  createCaveRobit,
  createCaveRobitWithFallback,
  type CaveRobit,
  type CaveRobitConfig,
  type TransportDescriptor,
} from '../core/Cave/CaveRobit';

describe('CaveRobit', () => {
  describe('createCaveRobit', () => {
    it('returns CaveRobit with getTransportForTarget', () => {
      const cr = createCaveRobit();
      expect(cr).toBeDefined();
      expect(typeof cr.getTransportForTarget).toBe('function');
    });

    it('returns in-app by default when no routes match', () => {
      const cr = createCaveRobit();
      const result = cr.getTransportForTarget('main', 'fish-burger-tome', '/tracing');
      expect(result).toEqual({ type: 'in-app' });
    });

    it('uses defaultTransport when configured', () => {
      const cr = createCaveRobit({
        defaultTransport: { type: 'http', config: { baseUrl: 'http://localhost:3000' } },
      });
      const result = cr.getTransportForTarget('main', 'any', '/');
      expect(result).toEqual({ type: 'http', config: { baseUrl: 'http://localhost:3000' } });
    });

    it('matches explicit route by fromCave and toTome', () => {
      const cr = createCaveRobit({
        routes: [
          {
            fromCave: 'main',
            toTome: 'fish-burger-tome',
            transport: { type: 'http', config: { baseUrl: 'http://api.example.com' } },
          },
        ],
      });
      const result = cr.getTransportForTarget('main', 'fish-burger-tome', '/');
      expect(result).toEqual({ type: 'http', config: { baseUrl: 'http://api.example.com' } });
    });

    it('uses wildcard * for fromCave', () => {
      const cr = createCaveRobit({
        routes: [
          {
            fromCave: '*',
            toTome: 'fish-burger-tome',
            transport: { type: 'kafka', config: { topic: 'tome-events' } },
          },
        ],
      });
      const result = cr.getTransportForTarget('any-cave', 'fish-burger-tome', '/');
      expect(result).toEqual({ type: 'kafka', config: { topic: 'tome-events' } });
    });

    it('uses wildcard * for toTome', () => {
      const cr = createCaveRobit({
        routes: [
          {
            fromCave: 'content',
            toTome: '*',
            transport: { type: 'chrome-messaging', config: { contextType: 'background' } },
          },
        ],
      });
      const result = cr.getTransportForTarget('content', 'any-tome', '/');
      expect(result).toEqual({ type: 'chrome-messaging', config: { contextType: 'background' } });
    });

    it('matches pathPattern when provided', () => {
      const cr = createCaveRobit({
        routes: [
          {
            fromCave: 'main',
            toTome: '*',
            pathPattern: '^/api/',
            transport: { type: 'http', config: { baseUrl: 'http://api' } },
          },
        ],
      });
      const match = cr.getTransportForTarget('main', 'x', '/api/fish-burger');
      const noMatch = cr.getTransportForTarget('main', 'x', '/tracing');
      expect(match).toEqual({ type: 'http', config: { baseUrl: 'http://api' } });
      expect(noMatch).toEqual({ type: 'in-app' });
    });

    it('first matching route wins', () => {
      const cr = createCaveRobit({
        routes: [
          { fromCave: '*', toTome: '*', transport: { type: 'udp', config: {} } },
          { fromCave: 'main', toTome: 'x', transport: { type: 'http', config: {} } },
        ],
      });
      const result = cr.getTransportForTarget('main', 'x', '/');
      expect(result?.type).toBe('udp');
    });

    it('registerRoute adds runtime route', () => {
      const cr = createCaveRobit();
      cr.registerRoute!('runtime-cave', 'runtime-tome', { type: 'socket', config: { port: 9000 } });
      const result = cr.getTransportForTarget('runtime-cave', 'runtime-tome', '/');
      expect(result).toEqual({ type: 'socket', config: { port: 9000 } });
    });

    it('registerRoute accepts RegExp', () => {
      const cr = createCaveRobit();
      cr.registerRoute!(/^content/, /^tome-/, { type: 'chrome-messaging', config: {} });
      const result = cr.getTransportForTarget('content-1', 'tome-fish', '/');
      expect(result?.type).toBe('chrome-messaging');
    });
  });

  describe('createCaveRobitWithFallback', () => {
    it('returns fallbackTransport on inner error', async () => {
      const inner: CaveRobit = {
        getTransportForTarget: () => {
          throw new Error('fail');
        },
      };
      const wrapped = createCaveRobitWithFallback(inner, {
        fallbackTransport: { type: 'http', config: { baseUrl: 'http://fallback' } },
      });
      const result = await Promise.resolve(wrapped.getTransportForTarget('a', 'b', '/'));
      expect(result).toEqual({ type: 'http', config: { baseUrl: 'http://fallback' } });
    });

    it('delegates to inner when it returns', () => {
      const inner = createCaveRobit({
        routes: [{ fromCave: 'x', toTome: 'y', transport: { type: 'kafka', config: {} } }],
      });
      const wrapped = createCaveRobitWithFallback(inner, {
        fallbackTransport: { type: 'http', config: {} },
      });
      const result = wrapped.getTransportForTarget('x', 'y', '/');
      expect(result).toEqual({ type: 'kafka', config: {} });
    });
  });
});
