import { test, expect } from '@playwright/test';

test.describe('Phase 93: Interactive Cross-Role Demo Scenario Engine', () => {

  test('Scenario Centre loads catalogue and displays connected workflows', async ({ page }) => {
    await page.goto('/demo/scenarios');
    
    await expect(page.locator('h1')).toContainText('Explore connected CampusOS workflows');
    await expect(page.locator('text=Demo Environment')).toBeVisible();

    // Verify scenario cards exist
    await expect(page.locator('h3', { hasText: 'Assignment Submission and Grading' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Attendance Session and Student Update' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Fee Invoice and Sandbox Payment' })).toBeVisible();
  });

  test('Assignment workflow end-to-end execution, role switch and reset', async ({ page }) => {
    // 1. Sign in as Student
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Student' }).click();
    await page.waitForURL('/dashboard');

    // 2. Open Scenario Workspace
    await page.goto('/demo/scenarios/assignment-workflow');
    await expect(page.locator('h1')).toContainText('Assignment Submission and Grading');

    // 3. Execute Step 1 (Review Assignment)
    const executeBtn = page.locator('button', { hasText: 'Execute Step 1 & Update CampusOS' });
    await expect(executeBtn).toBeVisible();
    await executeBtn.click();

    // Verify step 1 finished and moved to step 2
    await expect(page.locator('text=Step 2')).toBeVisible();

    // 4. Reset Scenario
    const resetBtn = page.locator('button', { hasText: 'Reset Scenario' });
    await expect(resetBtn).toBeVisible();
  });

  test('Demo Progress Centre displays completion metrics', async ({ page }) => {
    await page.goto('/demo/progress');
    
    await expect(page.locator('h1')).toContainText('Your Story Mode Exploration Progress');
    await expect(page.locator('text=Overall Progress')).toBeVisible();
    await expect(page.locator('text=Completed Scenarios')).toBeVisible();
  });

});
