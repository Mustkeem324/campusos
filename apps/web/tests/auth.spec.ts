import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation Journey', () => {
  test('User can login, view dashboard, navigate sidebar, and logout securely', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    await expect(page).toHaveTitle(/CampusOS | Login/i);

    // 2. Perform Login (using mocked standard credentials)
    await page.fill('input[name="email"]', 'admin@institution.edu');
    await page.fill('input[name="password"]', 'SecurePass123!');
    
    // 3. Form validation and Submission
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeEnabled();
    await loginButton.click();

    // 4. Assert Dashboard Redirection (Role-based redirect)
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    // 5. Sidebar Navigation (WCAG Compliant checking)
    // Click on the Departments link
    const departmentsLink = page.locator('a', { hasText: 'Departments' });
    if (await departmentsLink.isVisible()) {
      await departmentsLink.click();
      await page.waitForURL('/departments');
      await expect(page.locator('h1', { hasText: 'Departments' })).toBeVisible();
      
      // Verify Data Table loaded
      const table = page.locator('table');
      await expect(table).toBeVisible();
    }

    // 6. Global Shell / Sidebar Collapse
    const collapseButton = page.locator('button[aria-label="Toggle Sidebar"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      // Ensure it collapsed visually (checking width or aria states)
      await expect(collapseButton).toHaveAttribute('aria-expanded', 'false');
    }

    // 7. Secure Logout (Session Revocation)
    const userMenuButton = page.locator('button[aria-label="User menu"]');
    await userMenuButton.click();
    
    const logoutButton = page.locator('button', { hasText: 'Logout' });
    await logoutButton.click();

    // 8. Assert Logout Redirection and state invalidation
    await page.waitForURL('/login');
    
    // 9. Negative Test: Cannot access protected route after logout
    await page.goto('/dashboard');
    await page.waitForURL('/login'); // Should bounce back
  });
});
