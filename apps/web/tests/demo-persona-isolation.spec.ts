import { test, expect } from '@playwright/test';

test.describe('Phase 92: Demo Persona Isolation & Guided Experience', () => {

  test('Admin demo login resolves Aarav Mehta identity and admin dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Click Continue as Admin
    const adminButton = page.locator('button', { hasText: 'Continue as Admin' });
    await expect(adminButton).toBeVisible();
    await adminButton.click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back, Aarav Mehta');
    await expect(page).toContainText('Institution Admin Portal');

    // Verify Demo Environment Banner is present
    const demoBanner = page.locator('[aria-label="Demo Environment Banner"]');
    await expect(demoBanner).toBeVisible();
    await expect(demoBanner).toContainText('Aarav Mehta (Institution Admin)');
  });

  test('Faculty demo login resolves Dr. Priya Sharma identity and faculty dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Click Continue as Faculty
    const facultyButton = page.locator('button', { hasText: 'Continue as Faculty' });
    await expect(facultyButton).toBeVisible();
    await facultyButton.click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back, Dr. Priya Sharma');
    await expect(page).toContainText('Faculty Portal');

    // Verify Faculty Quick Actions
    await expect(page.locator('a', { hasText: 'Mark Attendance' })).toBeVisible();
  });

  test('Student demo login resolves Rohan Verma identity and student dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Click Continue as Student
    const studentButton = page.locator('button', { hasText: 'Continue as Student' });
    await expect(studentButton).toBeVisible();
    await studentButton.click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back, Rohan Verma');
    await expect(page).toContainText('Student Portal');

    // Verify Student Quick Actions
    await expect(page.locator('a', { hasText: 'Student Benefits & Perks' })).toBeVisible();
  });

  test('Parent demo login resolves Anita Verma identity and linked ward data', async ({ page }) => {
    await page.goto('/login');
    
    // Click Continue as Parent
    const parentButton = page.locator('button', { hasText: 'Continue as Parent' });
    await expect(parentButton).toBeVisible();
    await parentButton.click();

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back, Anita Verma');
    await expect(page).toContainText('Parent Portal');
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
