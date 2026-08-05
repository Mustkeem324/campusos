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
    await expect(page.getByRole('heading', { name: 'Assigned courses' })).toBeVisible();
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

    // Guardian identity is the authenticated persona — never the ward.
    await expect(page.locator('h1')).toContainText('Anita Verma');
    await expect(page.locator('text=Parent & Guardian Portal')).toBeVisible();
    // Linked student is shown separately, not as the current user.
    await expect(page.getByRole('heading', { name: 'Rohan Verma', exact: true })).toBeVisible();

    const response = await page.request.get('/api/dashboard/parent');
    const payload = await response.json();
    expect(payload.identity.name).toBe('Anita Verma');
    expect(payload.selectedStudent.name).toBe('Rohan Verma');
    expect(payload.selectedStudent.name).not.toBe(payload.identity.name);
  });

  test('Parent cannot read another family’s ward through the API', async ({ request }) => {
    const login = await request.post('/api/auth/demo-login', { data: { persona: 'PARENT' } });
    expect(login.status()).toBe(200);

    // Request a student who is not linked to this guardian → 403.
    const unlinked = await request.get('/api/dashboard/parent?studentId=00000000-0008-0000-0000-000000000005');
    expect(unlinked.status()).toBe(403);
  });

  test('Finance login opens /dashboard/finance with Kavya Nair identity and finance metrics', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FINANCE' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/finance');

    await expect(page.locator('h1')).toContainText('Kavya Nair');
    await expect(page.locator('text=Finance Operations Workspace')).toBeVisible();
    // Real finance aggregates from the tenant-scoped contract.
    await expect(page.getByRole('heading', { name: 'Outstanding invoices' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent payments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invoice status' })).toBeVisible();
    // Identity is the finance officer — never a student profile.
    await expect(page.locator('h1')).not.toContainText('Rohan Verma');
    // Student personal dashboard and faculty grading must not render here.
    await expect(page.locator('text=Today’s Class Schedule')).not.toBeVisible();
    await expect((await page.request.get('/api/dashboard/student')).status()).toBe(403);
    await expect((await page.request.get('/api/dashboard/faculty')).status()).toBe(403);
  });

  test('Finance API rejects non-finance sessions', async ({ request }) => {
    const login = await request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);
    expect((await request.get('/api/dashboard/finance')).status()).toBe(403);
  });

});
