import { test, expect } from '@playwright/test';

test.describe('Role-Based Dashboard Routing & Data Isolation', () => {

  test('Admin login opens /dashboard/admin with Aarav Mehta identity and institution metrics', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'ADMIN' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/admin');

    await expect(page.locator('h1')).toContainText('Aarav Mehta');
    await expect(page.locator('text=Institution Administration Portal')).toBeVisible();
    await expect((await page.request.get('/api/dashboard/student')).status()).toBe(403);

    // Verify Student personal timetable is NOT visible for Admin
    await expect(page.locator('text=Today\'s Class Schedule')).not.toBeVisible();
  });

  test('Faculty login opens /dashboard/faculty with Dr. Priya Sharma identity', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/faculty');

    await expect(page.locator('h1')).toContainText('Dr. Priya Sharma');
    await expect(page.locator('text=Faculty Teaching Workspace')).toBeVisible();
    await expect(page.locator('text=Assigned Courses')).toBeVisible();
    await expect((await page.request.get('/api/dashboard/student')).status()).toBe(403);
  });

  test('Student login opens /dashboard/student with Rohan Verma identity', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/student');

    await expect(page.locator('h1')).toContainText('Rohan Verma');
    await expect(page.locator('text=Student Workspace')).toBeVisible();

    // The session identity always wins over any query parameter.
    const response = await page.request.get('/api/dashboard/student?studentId=another-student');
    expect(response.status()).toBe(200);
    const payload = await response.json();
    await expect(payload.identity.name).toBe('Rohan Verma');
  });

  test('Parent login opens /dashboard/parent with Anita Verma identity and linked Rohan Verma', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'PARENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/parent');

    await expect(page.locator('h1')).toContainText('Anita Verma');
    await expect(page.locator('text=Parent & Guardian Portal')).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Rohan Verma' }).first()).toBeVisible();
    const response = await page.request.get('/api/dashboard/parent');
    await expect((await response.json()).parentUser.name).toBe('Anita Verma');
  });

});
