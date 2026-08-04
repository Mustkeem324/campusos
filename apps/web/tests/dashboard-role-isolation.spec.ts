import { test, expect } from '@playwright/test';

/**
 * Phase 95 — Explicit role-leakage tests.
 *
 * Verifies that each role sees only its own dashboard composition, that
 * cross-role API access is rejected on the server, and that persona identity
 * never bleeds between sessions.
 */
test.describe('Phase 95: Explicit Role Leakage', () => {

  test('Student sees only student-relevant content and no admin/finance panels', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Student' }).click();
    await page.waitForURL('/dashboard/student');

    // Student identity is the authenticated persona.
    await expect(page.locator('h1')).toContainText('Rohan Verma');
    await expect(page.locator('text=Student Workspace')).toBeVisible();

    // Student dashboard must not expose admin configuration or finance reconciliation.
    await expect(page.locator('text=Institution Administration Portal')).not.toBeVisible();
    await expect(page.locator('text=Pending Admissions')).not.toBeVisible();
    await expect(page.locator('text=Payroll')).not.toBeVisible();

    // Student quick actions are student-relevant.
    await expect(page.locator('a', { hasText: 'Open timetable' })).toBeVisible();
    await expect(page.locator('a', { hasText: 'View attendance' })).toBeVisible();
  });

  test('Student cannot read admin or faculty dashboard APIs', async ({ request }) => {
    // Login as student via demo-login API, then attempt cross-role API access.
    const login = await request.post('/api/auth/demo-login', {
      data: { persona: 'STUDENT' },
    });
    expect(login.status()).toBe(200);

    const adminStatus = (await request.get('/api/dashboard/admin')).status();
    const facultyStatus = (await request.get('/api/dashboard/faculty')).status();
    expect(adminStatus).toBe(403);
    expect(facultyStatus).toBe(403);
  });

  test('Admin sees admin content and their own identity, not a student profile', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Admin' }).click();
    await page.waitForURL('/dashboard/admin');

    await expect(page.locator('h1')).toContainText('Aarav Mehta');
    await expect(page.locator('text=Institution Administration Portal')).toBeVisible();

    // Admin must not see the student personal dashboard as their own profile.
    await expect(page.locator('text=Student Workspace')).not.toBeVisible();
  });

  test('Admin cannot read the student dashboard API', async ({ request }) => {
    const login = await request.post('/api/auth/demo-login', {
      data: { persona: 'ADMIN' },
    });
    expect(login.status()).toBe(200);

    const studentStatus = (await request.get('/api/dashboard/student')).status();
    expect(studentStatus).toBe(403);
  });

  test('Persona switch replaces identity and hides previous-role content', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Student' }).click();
    await page.waitForURL('/dashboard/student');
    await expect(page.locator('h1')).toContainText('Rohan Verma');

    // Switch persona through the login console (server session rotation).
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Admin' }).click();
    await page.waitForURL('/dashboard/admin');
    await expect(page.locator('h1')).toContainText('Aarav Mehta');

    // Rohan Verma's student profile must not remain on screen.
    await expect(page.locator('text=Rohan Verma')).not.toBeVisible();
  });
});
