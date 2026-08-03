import { test, expect } from '@playwright/test';

test.describe('CampusOS AI Copilot & Safety Journeys', () => {
  test('Student AI Assistant page loads and displays context panel', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue as Student' }).click();
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    await page.goto('/student/ai-assistant');
    await expect(page.getByText('Student AI Copilot & Knowledge Assistant')).toBeVisible();
    await expect(page.getByText('Tenant Isolated • Role: STUDENT')).toBeVisible();
  });

  test('Faculty AI Assistant page loads and displays course context', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue as Faculty' }).click();
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    await page.goto('/faculty/ai-assistant');
    await expect(page.getByText('Faculty AI Copilot & Course Workspace')).toBeVisible();
  });

  test('Institutional Knowledge Library page loads', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Continue as Admin' }).click();
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(1000);

    await page.goto('/ai/knowledge');
    await expect(page.getByText('Institutional Knowledge & RAG Library')).toBeVisible();
  });
});
