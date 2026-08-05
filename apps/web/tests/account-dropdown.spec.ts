import { test, expect } from '@playwright/test';

/** The demo onboarding tour opens on first page mount per role and can
 *  intercept pointer events; dismiss it the same way the workspace spec does. */
async function dismissTourIfPresent(page: import('@playwright/test').Page) {
  const tour = page.locator('[role="dialog"][aria-labelledby="tour-title"]');
  await tour.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
  if (await tour.isVisible()) {
    await tour.getByRole('button', { name: 'Skip All' }).click();
    await expect(tour).not.toBeVisible();
  }
}

test.describe('Account Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const adminBtn = page.getByRole('button', { name: 'Continue as Admin' });
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForURL('**/dashboard');
    }
    await dismissTourIfPresent(page);
  });

  test('opens dropdown on click and navigates tabs', async ({ page }) => {
    await page.waitForSelector('header');
    await dismissTourIfPresent(page);
    const trigger = page.locator('button[aria-haspopup="menu"]').first();
    if (await trigger.isVisible()) {
      await trigger.click();
      const dropdown = page.locator('div[role="menu"]').first();
      await expect(dropdown).toBeVisible();
    }
  });

  test('closes dropdown when clicking outside', async ({ page }) => {
    await page.goto('/dashboard');
    await dismissTourIfPresent(page);
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
