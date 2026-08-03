import { test, expect } from '@playwright/test';

test.describe('Account Dropdown', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming /login sets up the session and redirects to / or dashboard
    // For testing purposes, we'll navigate to the root which should show the Header if authenticated.
    // If there's an auth wall, we need to log in first.
    await page.goto('/login');
    // Assuming there is a standard login form to bypass, or we can mock it
    // Wait for email field or just use a mock route
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('admin@campusos.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL('**/');
    }
  });

  test('opens dropdown on click and navigates tabs', async ({ page }) => {
    // Wait for the header to render
    await page.waitForSelector('header');

    // The trigger button has aria-haspopup="menu"
    const trigger = page.locator('button[aria-haspopup="menu"]');
    await expect(trigger).toBeVisible();

    // Open dropdown
    await trigger.click();

    // Verify main menu items are visible
    const dropdown = page.locator('div[role="menu"]');
    await expect(dropdown).toBeVisible();
    
    await expect(dropdown.locator('text=Account')).toBeVisible();
    await expect(dropdown.locator('text=Preferences')).toBeVisible();
    
    // Navigate to Account tab
    await dropdown.locator('button:has-text("Account")').click();
    await expect(dropdown.locator('text=Profile')).toBeVisible();
    await expect(dropdown.locator('text=Activity Log')).toBeVisible();
    
    // Go back
    await dropdown.locator('button:has-text("Back")').click();
    await expect(dropdown.locator('text=Preferences')).toBeVisible();

    // Close dropdown with escape
    await page.keyboard.press('Escape');
    await expect(dropdown).not.toBeVisible();
  });
  
  test('closes dropdown when clicking outside', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('button[aria-haspopup="menu"]');
    if (await trigger.count() > 0) {
      await trigger.click();
      const dropdown = page.locator('div[role="menu"]');
      await expect(dropdown).toBeVisible();
      
      // Click outside
      await page.mouse.click(0, 0);
      await expect(dropdown).not.toBeVisible();
    }
  });
});
