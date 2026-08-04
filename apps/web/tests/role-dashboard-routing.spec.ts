import { test, expect } from '@playwright/test';

test.describe('Role-Based Dashboard Routing & Data Isolation', () => {

  test('Admin login opens /dashboard/admin with Aarav Mehta identity and institution metrics', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Admin' }).click();
    await page.waitForTimeout(2000);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/admin');

    await expect(page.locator('h1')).toContainText('Aarav Mehta');
    await expect(page.locator('text=Institution Administration Portal')).toBeVisible();
    await expect(page.locator('text=Enrolled Students')).toBeVisible();
    await expect((await page.request.get('/api/dashboard/student')).status()).toBe(403);
    
    // Verify Student personal timetable is NOT visible for Admin
    await expect(page.locator('text=Today\'s Class Schedule')).not.toBeVisible();
  });

  test('Faculty login opens /dashboard/faculty with Dr. Priya Sharma identity', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Faculty' }).click();
    await page.waitForTimeout(2000);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/faculty');

    await expect(page.locator('h1')).toContainText('Dr. Priya Sharma');
    await expect(page.locator('text=Faculty Teaching Workspace')).toBeVisible();
    await expect(page.locator('text=Assigned Courses')).toBeVisible();
    await expect((await page.request.get('/api/dashboard/student')).status()).toBe(403);
  });

  test('Student login opens /dashboard/student with Rohan Verma identity', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Student' }).click();
    await page.waitForTimeout(2000);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/student');

    await expect(page.locator('h1')).toContainText('Rohan Verma');
    await expect(page.locator('text=Good Standing')).toBeVisible();
    const response = await page.request.get('/api/dashboard/student?studentId=another-student');
    await expect(response.status()).toBe(200);
    await expect((await response.json()).studentUser.name).toBe('Rohan Verma');
  });

  test('Parent login opens /dashboard/parent with Anita Verma identity and linked Rohan Verma', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Continue as Parent' }).click();
    await page.waitForTimeout(2000);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/parent');

    await expect(page.locator('h1')).toContainText('Anita Verma');
    await expect(page.locator('text=Parent & Guardian Portal')).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Rohan Verma' })).toBeVisible();
    const response = await page.request.get('/api/dashboard/parent');
    await expect((await response.json()).parentUser.name).toBe('Anita Verma');
  });

});
