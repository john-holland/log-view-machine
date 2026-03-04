/**
 * Unit tests for Cave
 */

import { Cave, createCave } from '../core/Cave/Cave';
import { createCaveRobit } from '../core/Cave/CaveRobit';

describe('Cave', () => {
  describe('createCave / Cave', () => {
    it('returns CaveInstance with name and spelunk', () => {
      const cave = Cave('main', { route: '/', tomeId: 'root-tome' });
      expect(cave.name).toBe('main');
      expect(cave.getRenderTarget('/')).toEqual({
        route: '/',
        container: undefined,
        tomes: undefined,
        tomeId: 'root-tome',
      });
    });

    it('getRoutedConfig returns config for . or empty path', () => {
      const spelunk = { route: '/', childCaves: { tracing: { route: '/tracing', tomeId: 'tracing-tome' } } };
      const cave = Cave('main', spelunk);
      const config = cave.getRoutedConfig('.');
      expect(config).toBeDefined();
      expect('spelunk' in config).toBe(true);
      expect((config as any).spelunk).toEqual(spelunk);
    });

    it('getRoutedConfig navigates childCaves by path', () => {
      const spelunk = {
        route: '/',
        childCaves: {
          tracing: { route: '/tracing', tomeId: 'tracing-tome' },
          demo: { route: '/demo', tomeId: 'demo-tome' },
        },
      };
      const cave = Cave('main', spelunk);
      const routed = cave.getRoutedConfig('tracing');
      expect(routed).toEqual({ route: '/tracing', tomeId: 'tracing-tome' });
    });

    it('getRenderTarget returns route, container, tomes, tomeId from routed spelunk', () => {
      const spelunk = {
        route: '/tracing',
        container: 'EditorWrapper',
        tomeId: 'fish-burger-tome',
      };
      const cave = Cave('main', { childCaves: { tracing: spelunk } });
      const target = cave.getRenderTarget('tracing');
      expect(target).toEqual({
        route: '/tracing',
        container: 'EditorWrapper',
        tomes: undefined,
        tomeId: 'fish-burger-tome',
      });
    });

    it('getRenderKey uses renderKey from spelunk or cave name', () => {
      const cave1 = Cave('main', {});
      expect(cave1.getRenderKey()).toBe('main');
      const cave2 = Cave('main', { renderKey: 'custom-key' } as any);
      expect(cave2.getRenderKey()).toBe('custom-key');
    });

    it('observeViewKey invokes callback and returns unsubscribe', () => {
      const cave = Cave('main', {});
      const fn = jest.fn();
      const unsub = cave.observeViewKey(fn);
      expect(fn).toHaveBeenCalledWith('main');
      unsub();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('initialize marks cave as initialized', async () => {
      const cave = Cave('main', {});
      expect(cave.isInitialized).toBe(false);
      await cave.initialize();
      expect(cave.isInitialized).toBe(true);
    });
  });

  describe('getTransportForTarget', () => {
    it('returns in-app when no caveRobit', () => {
      const cave = Cave('main', { route: '/', tomeId: 'x' });
      const result = cave.getTransportForTarget!('main', '/');
      expect(result).toEqual({ type: 'in-app' });
    });

    it('delegates to caveRobit when configured via options', () => {
      const caveRobit = createCaveRobit({
        routes: [
          {
            fromCave: 'main',
            toTome: 'fish-burger-tome',
            transport: { type: 'http', config: { baseUrl: 'http://api' } },
          },
        ],
      });
      const cave = Cave(
        'main',
        { route: '/tracing', tomeId: 'fish-burger-tome' },
        { caveRobit }
      );
      const result = cave.getTransportForTarget!('main', '/tracing');
      expect(result).toEqual({ type: 'http', config: { baseUrl: 'http://api' } });
    });

    it('passes tomeId from getRenderTarget to caveRobit', () => {
      const caveRobit = createCaveRobit({
        routes: [
          {
            fromCave: 'main',
            toTome: 'demo-tome',
            transport: { type: 'kafka', config: { topic: 'demo' } },
          },
        ],
      });
      const cave = Cave('main', { childCaves: { demo: { route: '/demo', tomeId: 'demo-tome' } } }, { caveRobit });
      const result = cave.getTransportForTarget!('main', 'demo');
      expect(result).toEqual({ type: 'kafka', config: { topic: 'demo' } });
    });

    it('child caves inherit caveRobit and have getTransportForTarget', () => {
      const caveRobit = createCaveRobit({
        routes: [
          {
            fromCave: 'tracing',
            toTome: 'fish-burger-tome',
            transport: { type: 'http', config: {} },
          },
        ],
      });
      const cave = Cave(
        'main',
        { childCaves: { tracing: { route: '/tracing', tomeId: 'fish-burger-tome' } } },
        { caveRobit }
      );
      const child = cave.childCaves['tracing'];
      expect(child.getTransportForTarget).toBeDefined();
      const result = child.getTransportForTarget!('tracing', '/');
      expect(result).toEqual({ type: 'http', config: {} });
    });
  });
});
