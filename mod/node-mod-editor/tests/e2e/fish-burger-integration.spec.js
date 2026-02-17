import { test, expect } from '@playwright/test';

const TEST_TIMEOUT_MS = 60_000;
const NAV_TIMEOUT_MS = 20_000;

/**
 * Fish Burger Demo – integration tests via Features page and mod Open Demo flow.
 * Navigate to /features, click Open Demo on fish-burger mod card, assert mod iframe loads.
 * Requires kotlin-mod-index and node-fish-burger to be running for full flow.
 * Run with: npm run test:e2e (or test:e2e:headed for visible browser).
 */
test.describe('Fish Burger Demo - Integration', () => {
  test.setTimeout(TEST_TIMEOUT_MS);
  test.describe.configure({ timeout: TEST_TIMEOUT_MS });

  test.beforeEach(async ({ page }) => {
    await page.goto('/features', { timeout: NAV_TIMEOUT_MS });
    await expect(page.locator('h1')).toContainText('Features', { timeout: NAV_TIMEOUT_MS });
  });

  test('loads features page with mods section', async ({ page }) => {
    await expect(page.locator('h2', { hasText: /Mods/i })).toBeVisible();
    await expect(page.locator('#mod-list, [id="mod-list"]').or(page.locator('section').filter({ hasText: /Mods/ }))).toBeVisible();
  });

  test('Open Demo opens modal with iframe when mod has demo', async ({ page }) => {
    // Wait for mod list to load (Loading… then mod cards or "No mods")
    await page.waitForFunction(
      () => {
        const el = document.getElementById('mod-list');
        if (!el) return false;
        const text = el.textContent || '';
        return text !== 'Loading…' && text !== 'Loading...';
      },
      { timeout: 10_000 }
    );
    const openDemoBtn = page.getByRole('button', { name: /Open Demo/i }).first();
    const count = await openDemoBtn.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await openDemoBtn.click();
    // Modal should appear with iframe
    const modal = page.locator('.mod-modal.open, [class*="mod-modal"][class*="open"]').or(page.locator('[style*="position: fixed"]').filter({ has: page.locator('iframe') }));
    await expect(modal).toBeVisible({ timeout: 5_000 });
    const iframe = page.locator('#mod-modal-iframe, iframe[title*="demo" i], iframe').first();
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute('src', /mods\/fish-burger\/demo|fish-burger-demo/, { timeout: 3_000 });
  });

  test('fish-burger-demo redirects to features', async ({ page }) => {
    await page.goto('/fish-burger-demo', { timeout: NAV_TIMEOUT_MS });
    await expect(page).toHaveURL(/\/features/);
  });
});
