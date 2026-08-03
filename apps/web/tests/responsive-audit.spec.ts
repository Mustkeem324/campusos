import { expect, test } from '@playwright/test';

const viewports = [
  { name: '320', width: 320, height: 640 },
  { name: '360', width: 360, height: 740 },
  { name: '375', width: 375, height: 812 },
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1280', width: 1280, height: 800 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1920', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test(`public legal page has no horizontal overflow at ${viewport.name}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/legal/privacy');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('public pages retain usable layout in phone landscape', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/legal/privacy');
  await expect(page.locator('h1').first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('captures major public pages at phone, tablet, and desktop widths', async ({ page }, testInfo) => {
  for (const target of [
    { route: '/login', name: 'login-phone', width: 390, height: 844 },
    { route: '/legal/privacy', name: 'legal-tablet', width: 768, height: 1024 },
    { route: '/about', name: 'about-desktop', width: 1440, height: 900 },
  ]) {
    await page.setViewportSize({ width: target.width, height: target.height });
    await page.goto(target.route);
    await expect(page.locator('body')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${target.name}.png`), fullPage: true });
  }
});
