# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication & Navigation Journey >> User can login, view dashboard, navigate sidebar, and logout securely
- Location: tests/auth.spec.ts:4:7

# Error details

```
Error: expect(page).toHaveTitle(expected) failed

Expected pattern: /CampusOS | Login/i
Received string:  ""
Timeout: 5000ms

Call log:
  - Expect "toHaveTitle" with timeout 5000ms
    13 × locator resolved to <html>…</html>
       - unexpected value ""

```

```yaml
- alert
- dialog "Server Error":
  - navigation:
    - button "previous" [disabled]:
      - img "previous"
    - button "next" [disabled]:
      - img "next"
    - text: 1 of 1 error Next.js (14.2.15) is outdated
    - link "(learn more)":
      - /url: https://nextjs.org/docs/messages/version-staleness
  - heading "Server Error" [level=1]
  - paragraph: "Error: Cannot find module './4522.js' Require stack: - /home/nx-pro/campusos/apps/web/.next/server/webpack-runtime.js - /home/nx-pro/campusos/apps/web/.next/server/app/(public)/about/page.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/require.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/load-components.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/build/utils.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/dev/hot-middleware.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/dev/hot-reloader-webpack.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/lib/router-server.js - /home/nx-pro/campusos/apps/web/node_modules/next/dist/server/lib/start-server.js"
  - text: This error happened while generating the page. Any console logs will be displayed in the terminal window.
  - heading "Call Stack" [level=2]
  - group:
    - img
    - img
    - text: Next.js
  - heading "Array.reduce" [level=3]
  - text: <anonymous>
  - group:
    - img
    - img
    - text: Next.js
  - heading "Array.map" [level=3]
  - text: <anonymous>
  - group:
    - img
    - img
    - text: Next.js
  - heading "<unknown>" [level=3]
  - text: file:///home/nx-pro/campusos/apps/web/.next/server/app/(auth)/login/page.js (1:22710)
  - heading "Object.<anonymous>" [level=3]
  - text: file:///home/nx-pro/campusos/apps/web/.next/server/app/(auth)/login/page.js (1:22763)
  - group:
    - img
    - img
    - text: Next.js
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication & Navigation Journey', () => {
  4  |   test('User can login, view dashboard, navigate sidebar, and logout securely', async ({ page }) => {
  5  |     // 1. Visit Login Page
  6  |     await page.goto('/login');
> 7  |     await expect(page).toHaveTitle(/CampusOS | Login/i);
     |                        ^ Error: expect(page).toHaveTitle(expected) failed
  8  | 
  9  |     // 2. Perform Login (using mocked standard credentials)
  10 |     await page.fill('input[name="email"]', 'admin@institution.edu');
  11 |     await page.fill('input[name="password"]', 'SecurePass123!');
  12 |     
  13 |     // 3. Form validation and Submission
  14 |     const loginButton = page.locator('button[type="submit"]');
  15 |     await expect(loginButton).toBeEnabled();
  16 |     await loginButton.click();
  17 | 
  18 |     // 4. Assert Dashboard Redirection (Role-based redirect)
  19 |     await page.waitForURL('/dashboard');
  20 |     await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  21 | 
  22 |     // 5. Sidebar Navigation (WCAG Compliant checking)
  23 |     // Click on the Departments link
  24 |     const departmentsLink = page.locator('a', { hasText: 'Departments' });
  25 |     if (await departmentsLink.isVisible()) {
  26 |       await departmentsLink.click();
  27 |       await page.waitForURL('/departments');
  28 |       await expect(page.locator('h1', { hasText: 'Departments' })).toBeVisible();
  29 |       
  30 |       // Verify Data Table loaded
  31 |       const table = page.locator('table');
  32 |       await expect(table).toBeVisible();
  33 |     }
  34 | 
  35 |     // 6. Global Shell / Sidebar Collapse
  36 |     const collapseButton = page.locator('button[aria-label="Toggle Sidebar"]');
  37 |     if (await collapseButton.isVisible()) {
  38 |       await collapseButton.click();
  39 |       // Ensure it collapsed visually (checking width or aria states)
  40 |       await expect(collapseButton).toHaveAttribute('aria-expanded', 'false');
  41 |     }
  42 | 
  43 |     // 7. Secure Logout (Session Revocation)
  44 |     const userMenuButton = page.locator('button[aria-label="User menu"]');
  45 |     await userMenuButton.click();
  46 |     
  47 |     const logoutButton = page.locator('button', { hasText: 'Logout' });
  48 |     await logoutButton.click();
  49 | 
  50 |     // 8. Assert Logout Redirection and state invalidation
  51 |     await page.waitForURL('/login');
  52 |     
  53 |     // 9. Negative Test: Cannot access protected route after logout
  54 |     await page.goto('/dashboard');
  55 |     await page.waitForURL('/login'); // Should bounce back
  56 |   });
  57 | });
  58 | 
```