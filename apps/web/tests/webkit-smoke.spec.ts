import { test, expect } from '@playwright/test';

test('WebKit launches and renders the login page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.locator('body')).toContainText('Sign in using the credentials issued to your account');
});
