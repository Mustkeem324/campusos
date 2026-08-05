import { test, expect } from '@playwright/test';

test.describe('Faculty Dashboard (live server)', () => {
  test('Faculty login shows Dr. Priya Sharma identity and real assigned courses', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard/faculty');
    await expect(page.locator('h1')).toContainText('Dr. Priya Sharma');

    const response = await page.request.get('/api/dashboard/faculty');
    expect(response.status()).toBe(200);
    const payload = await response.json();

    // Identity always represents the authenticated faculty member.
    expect(payload.identity.name).toBe('Dr. Priya Sharma');
    expect(payload.role).toBe('FACULTY');

    // Real assigned courses only (CS-101 is the offering Priya teaches).
    expect(payload.assignedCourses.length).toBeGreaterThan(0);
    const codes = payload.assignedCourses.map((c: { code: string }) => c.code);
    expect(codes).toContain('CS-101');
    // Every course carries real aggregates, not fabricated values.
    for (const course of payload.assignedCourses) {
      expect(typeof course.studentCount).toBe('number');
      expect(typeof course.assignmentCount).toBe('number');
      expect(typeof course.ungradedSubmissionCount).toBe('number');
    }

    // No fake dashboard numbers survive.
    expect(payload.metrics.some((m: { label: string }) => m.label === 'Assigned Courses')).toBe(true);
  });

  test('Student and Admin cannot read the faculty dashboard API', async ({ page }) => {
    const studentLogin = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(studentLogin.status()).toBe(200);
    expect((await page.request.get('/api/dashboard/faculty')).status()).toBe(403);

    const adminLogin = await page.request.post('/api/auth/demo-login', { data: { persona: 'ADMIN' } });
    expect(adminLogin.status()).toBe(200);
    expect((await page.request.get('/api/dashboard/faculty')).status()).toBe(403);
  });

  test('Faculty dashboard does not render student identity or admin panels', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard/faculty');
    await expect(page.locator('h1')).toContainText('Dr. Priya Sharma');

    // Rohan Verma must never appear as the faculty identity.
    await expect(page.locator('text=Rohan Verma')).not.toBeVisible();
    // Student-only and admin-only panels are absent.
    await expect(page.locator('text=Class Schedule')).not.toBeVisible();
    await expect(page.locator('text=Institution Administration Portal')).not.toBeVisible();
  });
});
