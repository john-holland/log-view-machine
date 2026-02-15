import { test, expect } from '@playwright/test';

const TEST_TIMEOUT_MS = 60_000;
const NAV_TIMEOUT_MS = 20_000;

/**
 * Fish Burger Demo – headed-capable integration tests.
 * Run with: npm run test:e2e (or test:e2e:headed for visible browser).
 * Each test has a 1-minute timeout so it does not hang.
 */
test.describe('Fish Burger Demo - Integration', () => {
  test.setTimeout(TEST_TIMEOUT_MS);
  test.describe.configure({ timeout: TEST_TIMEOUT_MS });

  test.beforeEach(async ({ page }) => {
    await page.goto('/fish-burger-demo', { timeout: NAV_TIMEOUT_MS });
    await page.waitForSelector('.container', { timeout: NAV_TIMEOUT_MS });
  });

  test('loads fish burger demo page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Fish Burger Demo');
    await expect(page.locator('.container')).toBeVisible();
    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#current-state')).toHaveText('idle');
  });

  test('shows demo control buttons', async ({ page }) => {
    const buttons = page.locator('.demo-button');
    await expect(buttons).toHaveCount(6);
    await expect(page.getByRole('button', { name: /Start Cooking/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Update Progress/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Complete Cooking/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Simulate Error/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Retry/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible();
  });

  test('start cooking updates state', async ({ page }) => {
    await expect(page.locator('#current-state')).toHaveText('idle');
    await page.getByRole('button', { name: /Start Cooking/i }).click();
    await expect(page.locator('#current-state')).not.toHaveText('idle', { timeout: 10_000 });
  });

  test('reset returns to idle', async ({ page }) => {
    await page.getByRole('button', { name: /Start Cooking/i }).click();
    await expect(page.locator('#current-state')).not.toHaveText('idle', { timeout: 10_000 });
    await page.getByRole('button', { name: /Reset/i }).click();
    // Wait for RESET API to respond and UI to update (server restarts machine to initial state)
    await expect(page.locator('#current-state')).toHaveText('idle', { timeout: 15_000 });
  });

  test('back link goes to home', async ({ page }) => {
    await expect(page.locator('a.back-link[href="/"]')).toHaveAttribute('href', '/');
    await page.locator('a.back-link').click();
    await expect(page).toHaveURL(/\//);
  });
});
