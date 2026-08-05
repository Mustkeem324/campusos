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
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/student');

    // Student identity is the authenticated persona.
    await expect(page.locator('h1')).toContainText('Rohan Verma');
    await expect(page.locator('text=Student Workspace')).toBeVisible();

    // Student dashboard must not expose admin configuration or finance reconciliation.
    await expect(page.locator('text=Institution Administration Portal')).not.toBeVisible();
    await expect(page.locator('text=Pending Admissions')).not.toBeVisible();
    await expect(page.locator('text=Payroll')).not.toBeVisible();
    await expect(page.locator('text=Finance reconciliation')).not.toBeVisible();
    await expect(page.locator('text=User administration')).not.toBeVisible();

    // Student quick actions are student-relevant.
    await expect(page.locator('a', { hasText: 'Open timetable' }).first()).toBeVisible();
    await expect(page.locator('a', { hasText: 'View attendance' }).first()).toBeVisible();

    // Student-relevant sections from the real contract.
    await expect(page.locator('text=Examinations').first()).toBeVisible();
    await expect(page.locator('text=Published results').first()).toBeVisible();
    await expect(page.locator('text=Student services').first()).toBeVisible();
    await expect(page.locator('text=Hostel').first()).toBeVisible();
  });

  test('Student direct navigation to admin or faculty routes is rejected', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/student');

    // Direct URL access to the admin dashboard must not render admin content.
    await page.goto('/dashboard/admin');
    await page.waitForTimeout(1500);
    await expect(page.locator('text=Institution Administration Portal')).not.toBeVisible();
    await expect(page.locator('h1')).not.toContainText('Aarav Mehta');

    // Faculty grading workspace must also be inaccessible.
    await page.goto('/dashboard/faculty');
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).not.toContainText('Dr. Priya Sharma');

    // Finance reconciliation workspace must also be inaccessible.
    await page.goto('/dashboard/finance');
    await page.waitForTimeout(1500);
    await expect(page.locator('h1')).not.toContainText('Kavya Nair');
    await expect(page.locator('text=Finance Operations Workspace')).not.toBeVisible();
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
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'ADMIN' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/admin');

    await expect(page.locator('h1')).toContainText('Aarav Mehta');
    await expect(page.locator('text=Institution Administration Portal')).toBeVisible();

    // Real admin content sections from the AdminDashboardData contract.
    await expect(page.getByRole('heading', { name: 'Users & academics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Financial overview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Institutional notices' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent activity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Support cases' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Administration modules' })).toBeVisible();

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

  test('Parent sees guardian identity with linked ward shown separately', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'PARENT' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/parent');

    // Current profile is the guardian, not the student.
    await expect(page.locator('h1')).toContainText('Anita Verma');
    await expect(page.locator('h1')).not.toContainText('Rohan Verma');
    // Linked student appears as a separate heading.
    await expect(page.getByRole('heading', { name: 'Rohan Verma', exact: true })).toBeVisible();

    // Guardian dashboard must not expose admin/student personal workspace.
    await expect(page.locator('text=Institution Administration Portal')).not.toBeVisible();
    await expect(page.locator('text=Student Workspace')).not.toBeVisible();
  });

  test('Parent cannot read student, admin or faculty dashboard APIs', async ({ request }) => {
    const login = await request.post('/api/auth/demo-login', { data: { persona: 'PARENT' } });
    expect(login.status()).toBe(200);

    expect((await request.get('/api/dashboard/student')).status()).toBe(403);
    expect((await request.get('/api/dashboard/admin')).status()).toBe(403);
    expect((await request.get('/api/dashboard/faculty')).status()).toBe(403);
  });

  test('Parent request for an unlinked student is rejected on the server', async ({ request }) => {
    const login = await request.post('/api/auth/demo-login', { data: { persona: 'PARENT' } });
    expect(login.status()).toBe(200);

    // 00000000-0008-0000-0000-000000000005 is a student of another family.
    const unlinked = await request.get('/api/dashboard/parent?studentId=00000000-0008-0000-0000-000000000005');
    expect(unlinked.status()).toBe(403);

    // A verified link resolves normally.
    const linked = await request.get('/api/dashboard/parent?studentId=00000000-0008-0000-0000-00000000005a');
    expect(linked.status()).toBe(200);
    expect((await linked.json()).selectedStudent.name).toBe('Meera Menon');
  });

  test('Finance sees only finance content and their own identity', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FINANCE' } });
    expect(login.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/finance');

    // Current profile is the finance officer — never a student.
    await expect(page.locator('h1')).toContainText('Kavya Nair');
    await expect(page.locator('h1')).not.toContainText('Rohan Verma');
    await expect(page.locator('text=Finance Operations Workspace')).toBeVisible();

    // Real finance sections from the FinanceDashboardData contract.
    await expect(page.getByRole('heading', { name: 'Outstanding invoices' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent payments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Invoice status' })).toBeVisible();

    // No student personal dashboard, faculty grading, or admin configuration.
    await expect(page.locator('text=Student Workspace')).not.toBeVisible();
    await expect(page.locator('text=Faculty Teaching Workspace')).not.toBeVisible();
    await expect(page.locator('text=Institution Administration Portal')).not.toBeVisible();
    await expect(page.locator('text=Assigned courses')).not.toBeVisible();
    await expect(page.locator('text=Mark attendance')).not.toBeVisible();
    await expect(page.locator('text=Tenant configuration')).not.toBeVisible();
  });

  test('Finance cannot read student, admin or faculty dashboard APIs', async ({ request }) => {
    const login = await request.post('/api/auth/demo-login', { data: { persona: 'FINANCE' } });
    expect(login.status()).toBe(200);

    expect((await request.get('/api/dashboard/student')).status()).toBe(403);
    expect((await request.get('/api/dashboard/admin')).status()).toBe(403);
    expect((await request.get('/api/dashboard/faculty')).status()).toBe(403);
  });

  test('Persona switch replaces identity and hides previous-role content', async ({ page }) => {
    const studentLogin = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(studentLogin.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/student');
    await expect(page.locator('h1')).toContainText('Rohan Verma');

    // Switch persona through the server demo-login API (session rotation).
    const adminLogin = await page.request.post('/api/auth/demo-login', { data: { persona: 'ADMIN' } });
    expect(adminLogin.status()).toBe(200);

    await page.goto('/dashboard');
    await page.waitForURL('/dashboard/admin');
    await expect(page.locator('h1')).toContainText('Aarav Mehta');

    // Rohan Verma's student profile must not remain on screen.
    await expect(page.locator('text=Rohan Verma')).not.toBeVisible();
  });
});
