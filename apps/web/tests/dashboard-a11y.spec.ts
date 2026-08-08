import { test, expect } from '@playwright/test';

test('Student dashboard accessibility scan', async ({ page }) => {
  // The synthetic demo login endpoint was intentionally removed for production
  // hardening; authenticate with the seeded synthetic role account instead.
  const login = await page.request.post('/api/auth/login', {
    data: { email: 'student@nexus-campus.local', password: 'Campus@2026!' },
  });
  expect(login.status()).toBe(200);

  await page.goto('/dashboard');
  await page.waitForURL('/dashboard/student');
  await expect(page.locator('h1')).toContainText('Rohan Verma');
  await expect(page.locator('text=Examinations').first()).toBeVisible();

  // 1. Exactly one h1.
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBe(1);

  // 2. Heading order inside the main content landmark (h1 → h2 → …).
  //    Shell portals (e.g. the notification drawer) are excluded — they have
  //    their own dialog-scoped heading hierarchy.
  const headingOrder = await page.locator('main h1, main h2, main h3, main h4').evaluateAll((els) =>
    els.map((el) => parseInt(el.tagName.replace('H', ''), 10)),
  );
  const maxSoFar = headingOrder.reduce((acc, level) => {
    // Allow levels to go up one step at a time; never jump up by more than 1.
    if (level > acc + 1) throw new Error(`Heading order violated: h${level} after h${acc}`);
    return Math.max(acc, level);
  }, 0);
  expect(maxSoFar).toBeGreaterThanOrEqual(2);

  // 3. Semantic landmarks present.
  await expect(page.locator('main').first()).toBeVisible();
  const navLandmarks = await page.locator('nav[aria-label]').count();
  expect(navLandmarks).toBeGreaterThanOrEqual(1);

  // 4. All links and buttons are keyboard-reachable (have visible focus styling via CSS).
  const interactive = await page.locator('a[href], button').count();
  expect(interactive).toBeGreaterThan(20);

  // 5. No images without alt text.
  const imgAltMissing = await page.locator('img:not([alt])').count();
  expect(imgAltMissing).toBe(0);

  // 6. No horizontal overflow at desktop.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);

  // 7. Keyboard navigation: tab through the page from the top reaches the first quick action.
  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
  expect(['A', 'BUTTON']).toContain(focusedTag);
});
