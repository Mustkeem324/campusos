import { test, expect } from '@playwright/test';

type CourseListingItem = {
  id: string;
  courseId: string;
  course: { code: string; title: string };
  faculty: { user: { name: string } };
  term: { name: string };
  _count: { CourseModule: number; enrollments: number };
};

async function dismissTourIfPresent(page: import('@playwright/test').Page) {
  const tour = page.locator('[role="dialog"][aria-labelledby="tour-title"]');
  await tour.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {});
  if (await tour.isVisible()) {
    await tour.getByRole('button', { name: 'Skip All' }).click();
    await expect(tour).not.toBeVisible();
  }
}

test.describe('Phase 99 Course Workspace (live server)', () => {
  test('Student sees modules, announcements and can open the lesson viewer', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    const list = ((await courses.json()).courses ?? []) as CourseListingItem[];
    const cs101 = list.find((c) => c.course.code === 'CS-101');
    expect(cs101).toBeTruthy();

    await page.goto(`/learning/courses/${cs101!.courseId}`);
    await dismissTourIfPresent(page);
    await expect(page.getByRole('heading', { name: cs101!.course.title, exact: true })).toBeVisible();

    // Announcements section backed by seeded data.
    await expect(page.getByRole('heading', { name: /Announcements/ })).toBeVisible();
    await expect(page.locator('text=Welcome to CS-101')).toBeVisible();
    await expect(page.locator('text=Pinned').first()).toBeVisible();

    // Modules render with lesson rows.
    await expect(page.getByRole('heading', { name: 'Course Introduction & Foundations' })).toBeVisible();
    const firstLessonButton = page.getByRole('button', { name: /^Open lesson:/ }).first();
    await expect(firstLessonButton).toBeVisible();
    await firstLessonButton.click();

    // Lesson viewer dialog opens with title + content, keyboard nav works.
    const dialog = page.locator('[role="dialog"][aria-labelledby="lesson-viewer-title"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('text=Lesson 1 of 9')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('Lesson viewer navigation moves between lessons and shows real content', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    const list = ((await courses.json()).courses ?? []) as CourseListingItem[];
    const cs101 = list.find((c) => c.course.code === 'CS-101');
    expect(cs101).toBeTruthy();

    await page.goto(`/learning/courses/${cs101!.courseId}`);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /^Open lesson:/ }).first().click();

    const dialog = page.locator('[role="dialog"][aria-labelledby="lesson-viewer-title"]');
    await expect(dialog).toBeVisible();

    // Navigate to the syllabus lesson (an ARTICLE/PDF with content body).
    await dialog.getByRole('button', { name: 'Next' }).click();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(page.locator('text=Lesson 3 of 9')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Foundational concepts primer' })).toBeVisible();
    await expect(dialog.locator('text=core concepts')).toBeVisible();

    // Previous returns to lesson 2.
    await dialog.getByRole('button', { name: 'Previous' }).click();
    await expect(page.locator('text=Lesson 2 of 9')).toBeVisible();
  });

  test('Faculty can post an announcement which appears in the list', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    const list = ((await courses.json()).courses ?? []) as CourseListingItem[];
    expect(list.length).toBeGreaterThan(0);

    await page.goto(`/learning/courses/${list[0].courseId}`);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: 'Post announcement' }).click();

    const unique = String(Date.now());
    const title = `Live class update ${unique}`;
    const message = `Please review module one before the next session. (${unique})`;
    await page.getByLabel('Title').fill(title);
    await page.getByLabel('Message').fill(message);
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('paragraph').filter({ hasText: message })).toBeVisible();
  });

  test('Student POST to announcements is rejected with 403', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    const list = ((await courses.json()).courses ?? []) as CourseListingItem[];
    const cs101 = list.find((c) => c.course.code === 'CS-101');
    expect(cs101).toBeTruthy();

    const response = await page.request.post(`/api/learning/courses/${cs101!.courseId}/announcements`, {
      data: { title: 'Should fail', content: 'Students cannot post.' },
    });
    expect(response.status()).toBe(403);
  });

  test('Announcement validation is enforced server-side (bad body 400, oversized 413)', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    const list = ((await courses.json()).courses ?? []) as CourseListingItem[];
    expect(list.length).toBeGreaterThan(0);
    const url = `/api/learning/courses/${list[0].courseId}/announcements`;

    const empty = await page.request.post(url, { data: { title: '', content: '' } });
    expect(empty.status()).toBe(400);

    const tooLongTitle = await page.request.post(url, {
      data: { title: 'x'.repeat(5000), content: 'too big' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(tooLongTitle.status()).toBe(400);

    // A raw body over 16 KB is rejected before validation.
    const oversized = await page.request.post(url, {
      data: JSON.stringify({ title: 'T', content: 'y'.repeat(17_000) }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(oversized.status()).toBe(413);
  });
});
