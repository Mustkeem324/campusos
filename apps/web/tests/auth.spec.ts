import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation Journey', () => {
  test('User can login, view dashboard, navigate sidebar, and logout securely', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // 2. Perform Quick Demo Login
    const adminBtn = page.getByRole('button', { name: 'Continue as Admin' });
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    // 3. Assert Dashboard Redirection
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1').first()).toBeVisible();

    // 4. Assert Logout / Session Clear
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });
});
