import { test, expect } from '@playwright/test';

test.describe('Legal and Compliance Workflows', () => {
  
  test('Legal Centre landing page loads and contains required sections', async ({ page }) => {
    await page.goto('/legal');
    await expect(page.locator('h1')).toHaveText('Legal and Policy Centre');
    
    // Verify essential categories exist
    await expect(page.getByText('PRIVACY', { exact: true })).toBeVisible();
    await expect(page.getByText('TERMS', { exact: true })).toBeVisible();
    await expect(page.getByText('PAYMENTS', { exact: true })).toBeVisible();
    await expect(page.getByText('TRUST', { exact: true })).toBeVisible();
  });

  test('Privacy Notice page loads with correct layout', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page.locator('h1').first()).toHaveText('Privacy Notice');
    await expect(page.getByText('Published')).toBeVisible();
    // Validate that it doesn't show gradient (implicitly by checking classes if we wanted to)
    const content = await page.locator('.prose').textContent();
    expect(content).toContain('This placeholder content must be replaced by actual approved legal text');
  });

  test('Cookie Preferences persists consent', async ({ page }) => {
    await page.goto('/privacy/cookies');
    await expect(page.locator('h1')).toHaveText('Cookie Preferences');
    
    // Check that 'Strictly Necessary' is present
    await expect(page.getByText('Strictly Necessary Cookies')).toBeVisible();
    
    // Toggle analytics
    const analyticsToggle = page.locator('button').filter({ hasText: /^$/ }).first(); // Assuming it's the first toggle for optional
    await analyticsToggle.click();
    
    // Save preferences
    await page.getByRole('button', { name: 'Save Preferences' }).click();
    await expect(page.getByText('Preferences Saved')).toBeVisible();
  });

  test('Data Rights Request workflow works', async ({ page }) => {
    await page.goto('/privacy/data-request');
    
    // Step 1
    await page.getByText('Delete eligible data').click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Step 2
    await page.locator('select').first().selectOption('upes');
    await page.locator('textarea').fill('I want to delete my old application records.');
    await page.getByRole('button', { name: 'Next Step' }).click();
    
    // Step 3
    await page.getByLabel('I declare under penalty of perjury').check();
    await page.getByRole('button', { name: 'Submit Secure Request' }).click();
    
    // Success page
    await expect(page.getByText('Request Submitted Successfully')).toBeVisible();
    await expect(page.getByText('DSR-')).toBeVisible();
  });

  test('Grievance Portal submission works', async ({ page }) => {
    await page.goto('/grievance');
    
    await page.locator('select').first().selectOption('privacy');
    await page.locator('input[type="text"]').nth(1).fill('Issue with cookie tracking');
    await page.locator('textarea').fill('The cookie banner is blocking content on mobile.');
    
    await page.getByRole('button', { name: 'Submit Grievance' }).click();
    
    await expect(page.getByText('Grievance Logged')).toBeVisible();
    await expect(page.getByText('GRV-')).toBeVisible();
  });

});
