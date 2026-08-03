import { test, expect } from '@playwright/test';

test.describe('Legal and Compliance Workflows', () => {

  test('Privacy Notice page loads with correct layout', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Cookie Preferences page loads', async ({ page }) => {
    await page.goto('/privacy/cookies');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Data Rights Request workflow loads', async ({ page }) => {
    await page.goto('/privacy/data-request');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Grievance Portal page loads', async ({ page }) => {
    await page.goto('/grievance');
    await expect(page.locator('h1').first()).toBeVisible();
  });

});
