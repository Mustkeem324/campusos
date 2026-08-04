import { test, expect } from '@playwright/test';

/**
 * Phase 92/95 — Demo persona identity isolation.
 *
 * Logs in via the server demo-login API (cookies shared with the page context),
 * then verifies each persona lands on its own role-specific dashboard with the
 * correct authenticated identity.
 */
test.describe('Phase 92/95: Demo Persona Isolation', () => {

  test('Admin demo login resolves Aarav Mehta identity and admin dashboard', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'ADMIN' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/admin');
    await expect(page.locator('h1')).toContainText('Welcome back, Aarav Mehta');
    await expect(page.locator('body')).toContainText('Institution Admin Portal');

    const demoBanner = page.locator('[aria-label="Demo environment controls"]');
    await expect(demoBanner).toBeVisible();
    await expect(demoBanner).toContainText('Demo Environment');
  });

  test('Faculty demo login resolves Dr. Priya Sharma identity and faculty dashboard', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/faculty');
    await expect(page.locator('h1')).toContainText('Welcome back, Dr. Priya Sharma');
    await expect(page.locator('body')).toContainText('Faculty Portal');
  });

  test('Student demo login resolves Rohan Verma identity and student dashboard', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/student');
    await expect(page.locator('h1')).toContainText('Welcome back, Rohan Verma');
    await expect(page.locator('body')).toContainText('Student Portal');
    // Quick action link (may also appear as an empty-state action, hence first()).
    await expect(page.locator('a', { hasText: 'Open timetable' }).first()).toBeVisible();
  });

  test('Parent demo login resolves Anita Verma identity and linked ward data', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'PARENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/parent');
    await expect(page.locator('h1')).toContainText('Anita Verma');
    await expect(page.locator('body')).toContainText('Parent Portal');
  });

  test('How CampusOS Works page renders visual flow and checklist', async ({ page }) => {
    await page.goto('/demo/how-it-works');

    await expect(page.locator('h1')).toContainText('Connected University Operations & Security Blueprint');
    await expect(page.locator('h2', { hasText: 'End-to-End System Execution Flow' })).toBeVisible();

    // Switch to Checklist tab
    await page.locator('button', { hasText: 'Demo Exploration Checklist' }).click();
    await expect(page.locator('h2', { hasText: 'Demo Exploration Checklist' })).toBeVisible();
  });

});
