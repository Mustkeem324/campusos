import { test, expect } from '@playwright/test';

test.describe('Phase 91: Product Tour Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders interactive product tour section with tab buttons', async ({ page }) => {
    const tourSection = page.locator('#product-tour');
    await expect(tourSection).toBeVisible();

    const tabs = tourSection.locator('[role="tab"]');
    await expect(tabs).toHaveCount(5);

    // Verify all 5 workflow tabs are rendered
    await expect(tabs.nth(0)).toContainText('Admissions');
    await expect(tabs.nth(1)).toContainText('Academics');
    await expect(tabs.nth(2)).toContainText('Examinations');
    await expect(tabs.nth(3)).toContainText('Finance');
    await expect(tabs.nth(4)).toContainText('Student Services');
  });

  test('allows switching between institutional workflow states', async ({ page }) => {
    const tourSection = page.locator('#product-tour');

    // Click Academics tab
    await tourSection.locator('[role="tab"]', { hasText: 'Academics' }).click();
    await expect(tourSection.locator('[role="tab"]', { hasText: 'Academics' })).toHaveAttribute('aria-selected', 'true');
    await expect(tourSection).toContainText('Automated course delivery, daily attendance and early at-risk intervention');
    await expect(tourSection).toContainText('ATTENDANCE_THRESHOLD_BREACH');

    // Click Examinations tab
    await tourSection.locator('[role="tab"]', { hasText: 'Examinations' }).click();
    await expect(tourSection.locator('[role="tab"]', { hasText: 'Examinations' })).toHaveAttribute('aria-selected', 'true');
    await expect(tourSection).toContainText('Tamper-proof grade compilation, multi-step verification and CGPA release');
    await expect(tourSection).toContainText('SEMESTER_RESULTS_PUBLISHED');

    // Click Finance tab
    await tourSection.locator('[role="tab"]', { hasText: 'Finance' }).click();
    await expect(tourSection.locator('[role="tab"]', { hasText: 'Finance' })).toHaveAttribute('aria-selected', 'true');
    await expect(tourSection).toContainText('Real-time revenue recognition, UPI payment gateways and automated ledger posts');
    await expect(tourSection).toContainText('PAYMENT_SETTLED_AND_POSTED');

    // Click Student Services tab
    await tourSection.locator('[role="tab"]', { hasText: 'Student Services' }).click();
    await expect(tourSection.locator('[role="tab"]', { hasText: 'Student Services' })).toHaveAttribute('aria-selected', 'true');
    await expect(tourSection).toContainText('SLA-driven requests, hostel passes, digital certificates and transparent tracking');
    await expect(tourSection).toContainText('SERVICE_REQUEST_RESOLVED');
  });

  test('allows clicking step execution items within active workflow', async ({ page }) => {
    const tourSection = page.locator('#product-tour');

    // Default is Admissions (Step 1)
    await expect(tourSection).toContainText('Application Verification');

    // Click Step 3
    const step3Button = tourSection.locator('button', { hasText: 'Student Profile & ID Generation' });
    await step3Button.click();
    await expect(tourSection).toContainText('Created STU-2026-892 with roll number CS2026-042');
  });

  test('displays enterprise trust and governance panel', async ({ page }) => {
    const tourSection = page.locator('#product-tour');
    await expect(tourSection).toContainText('Enterprise Trust & Governance Guaranteed');
    await expect(tourSection).toContainText('Tenant Isolation');
    await expect(tourSection).toContainText('Role-Based Access');
    await expect(tourSection).toContainText('Immutable Audit Log');
    await expect(tourSection).toContainText('Zero-Data Leakage');
  });
});
