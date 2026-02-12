/**
 * Unit tests for unleash-cavetoggles-adapter (stub mode).
 */
import { createUnleashCaveTogglesAdapter } from '../src/index.js';

describe('unleash-cavetoggles-adapter', () => {
  describe('serverless mode', () => {
    it('returns true for enabled default', async () => {
      const adapter = createUnleashCaveTogglesAdapter({
        serverless: true,
        defaults: { a: true, b: false },
      });
      expect(await adapter.isEnabled('a')).toBe(true);
    });

    it('returns false for disabled default', async () => {
      const adapter = createUnleashCaveTogglesAdapter({
        serverless: true,
        defaults: { a: true, b: false },
      });
      expect(await adapter.isEnabled('b')).toBe(false);
    });

    it('returns false for unknown toggle', async () => {
      const adapter = createUnleashCaveTogglesAdapter({
        serverless: true,
        defaults: { a: true },
      });
      expect(await adapter.isEnabled('unknown')).toBe(false);
    });

    it('accepts empty defaults', async () => {
      const adapter = createUnleashCaveTogglesAdapter({ serverless: true, defaults: {} });
      expect(await adapter.isEnabled('x')).toBe(false);
    });
  });
});
