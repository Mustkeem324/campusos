import { test, expect } from '@playwright/test';

test.describe('Student Profile Redesign & Demo Banner Verification', () => {

  test('Student profile renders dynamic identity, tabs, and clean summary cards', async ({ page }) => {
    // 1. Login via Demo Login UI button
    await page.goto('/login');
    const studentBtn = page.locator('button', { hasText: 'Continue as Student' });
    await expect(studentBtn).toBeVisible({ timeout: 10000 });
    await studentBtn.click();
    await page.waitForTimeout(2000);

    // 2. Open Student Profile route directly
    await page.goto('/student-profile');
    await page.waitForLoadState('networkidle');
    
    // Page Header & Breadcrumbs
    await expect(page.locator('h1')).toContainText('My Profile');
    await expect(page.locator('text=Student Workspace')).toBeVisible();

    // Student Identity Header
    await expect(page.locator('h2', { hasText: 'Rohan Verma' })).toBeVisible();
    await expect(page.locator('text=STU-24-001')).toBeVisible();

    // Tabs & Navigation
    await page.locator('button', { hasText: 'Academic Journey' }).click();
    await expect(page.locator('h3', { hasText: 'Academic Journey & Milestone Progression' })).toBeVisible();

    await page.locator('button', { hasText: 'Attendance Ledger' }).click();
    await expect(page.locator('h3', { hasText: 'Attendance Ledger & Health' })).toBeVisible();

    await page.locator('button', { hasText: 'Documents' }).click();
    await expect(page.locator('h3', { hasText: 'Uploaded & Verified Student Documents' })).toBeVisible();
  });

  test('Demo Banner renders cleanly on desktop and mobile bottom sheet', async ({ page }) => {
    await page.goto('/login');
    const studentBtn = page.locator('button', { hasText: 'Continue as Student' });
    await expect(studentBtn).toBeVisible({ timeout: 10000 });
    await studentBtn.click();
    await page.waitForTimeout(2000);

    await page.goto('/student-profile');
    await page.waitForLoadState('networkidle');

    // Desktop Banner
    const demoBanner = page.locator('[aria-label="Demo Environment Banner"]');
    await expect(demoBanner).toBeVisible();
    await expect(demoBanner).toContainText('Switch Persona');

    // Test Mobile Viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await expect(page.locator('button', { hasText: 'Demo Options' })).toBeVisible();
    
    // Click Demo Options to open Bottom Sheet
    await page.locator('button', { hasText: 'Demo Options' }).click();
    await expect(page.locator('[aria-label="Demo Options Sheet"]')).toBeVisible();
  });

});
