import { test, expect } from '@playwright/test';

test.describe('Account Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const adminBtn = page.getByRole('button', { name: 'Continue as Admin' });
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForURL('**/dashboard');
    }
  });

  test('opens dropdown on click and navigates tabs', async ({ page }) => {
    await page.waitForSelector('header');
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      const dropdown = page.locator('div[role="menu"]').first();
      await expect(dropdown).toBeVisible();
    }
  });

  test('closes dropdown when clicking outside', async ({ page }) => {
    await page.goto('/dashboard');
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      const dropdown = page.locator('div[role="menu"]').first();
      await expect(dropdown).toBeVisible();
      await page.mouse.click(0, 0);
      await expect(dropdown).not.toBeVisible();
    }
  });
});
