/**
 * Mod API Consumer Pact Tests
 * Contract: ModApiConsumer expects ModIndexProvider to return GET /api/mods and GET /api/mods/:modId
 * @jest-environment node
 */
import path from 'path';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { fetchMods, fetchMod } from './modApiClient.js';

const { eachLike, like } = MatchersV3;

const modExample = {
  id: 'fish-burger-mod',
  name: 'Fish Burger Cart',
  description: 'Interactive shopping cart with fish burger state machine.',
  version: '1.0.0',
  serverUrl: 'http://localhost:3004',
  assets: { templates: '/mods/fish-burger/templates/', styles: '/mods/fish-burger/styles/', scripts: '/mods/fish-burger/scripts/' },
  entryPoints: { cart: '/mods/fish-burger/cart', demo: '/mods/fish-burger/demo' },
  modMetadata: { pathReplacements: {}, assetLinks: {}, spelunkMap: {} },
};

describe('Mod API Consumer Pact', () => {
  const provider = new PactV3({
    consumer: 'ModApiConsumer',
    provider: 'ModIndexProvider',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 3,
    logLevel: 'warn',
  });

  describe('GET /api/mods', () => {
    it('returns mods list', async () => {
      provider
        .given('mods exist')
        .uponReceiving('a request for mods list')
        .withRequest({
          method: 'GET',
          path: '/api/mods',
          headers: { Accept: 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            mods: eachLike(modExample),
          },
        });

      return provider.executeTest(async (mockServer) => {
        const result = await fetchMods({ baseUrl: mockServer.url });
        expect(result).toHaveProperty('mods');
        expect(Array.isArray(result.mods)).toBe(true);
        expect(result.mods.length).toBeGreaterThanOrEqual(0);
        if (result.mods[0]) {
          expect(result.mods[0]).toHaveProperty('id');
          expect(result.mods[0]).toHaveProperty('name');
          expect(result.mods[0]).toHaveProperty('serverUrl');
        }
      });
    });

    it('forwards Authorization header when provided', async () => {
      provider
        .given('mods exist')
        .uponReceiving('a request for mods list with Authorization')
        .withRequest({
          method: 'GET',
          path: '/api/mods',
          headers: { Accept: 'application/json', Authorization: like('Bearer token') },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { mods: eachLike(modExample) },
        });

      return provider.executeTest(async (mockServer) => {
        const result = await fetchMods({ baseUrl: mockServer.url, authorization: 'Bearer token' });
        expect(result.mods).toBeDefined();
      });
    });

    it('forwards Cookie header when provided', async () => {
      provider
        .given('mods exist')
        .uponReceiving('a request for mods list with Cookie')
        .withRequest({
          method: 'GET',
          path: '/api/mods',
          headers: { Accept: 'application/json', Cookie: like('session=abc123') },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: { mods: eachLike(modExample) },
        });

      return provider.executeTest(async (mockServer) => {
        const result = await fetchMods({ baseUrl: mockServer.url, cookie: 'session=abc123' });
        expect(result.mods).toBeDefined();
      });
    });
  });

  describe('GET /api/mods/:modId', () => {
    it('returns single mod when found', async () => {
      provider
        .given('mod fish-burger-mod exists')
        .uponReceiving('a request for fish-burger-mod')
        .withRequest({
          method: 'GET',
          path: '/api/mods/fish-burger-mod',
          headers: { Accept: 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: like(modExample),
        });

      return provider.executeTest(async (mockServer) => {
        const mod = await fetchMod('fish-burger-mod', { baseUrl: mockServer.url });
        expect(mod).not.toBeNull();
        expect(mod).toHaveProperty('id', 'fish-burger-mod');
        expect(mod).toHaveProperty('serverUrl');
      });
    });

    it('returns null for 404', async () => {
      provider
        .given('mod does not exist')
        .uponReceiving('a request for unknown mod')
        .withRequest({
          method: 'GET',
          path: '/api/mods/unknown-mod',
          headers: { Accept: 'application/json' },
        })
        .willRespondWith({
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: { error: like('Mod not found') },
        });

      return provider.executeTest(async (mockServer) => {
        const mod = await fetchMod('unknown-mod', { baseUrl: mockServer.url });
        expect(mod).toBeNull();
      });
    });
  });
});
