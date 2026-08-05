import { test, expect } from '@playwright/test';

type CourseListingItem = {
  id: string;
  courseId: string;
  course: { code: string; title: string };
  faculty: { user: { name: string } };
  term: { name: string };
  _count: { CourseModule: number; enrollments: number };
};

test.describe('Phase 97 LMS Course Access (live server)', () => {
  test('Student sees enrolled CS-101 with seeded content and the /lms page renders it', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    expect(courses.status()).toBe(200);
    const payload = await courses.json();
    const list = payload.courses as CourseListingItem[];
    expect(list.length).toBeGreaterThan(0);

    const cs101 = list.find((c) => c.course.code === 'CS-101');
    expect(cs101).toBeTruthy();
    expect(cs101!._count.CourseModule).toBeGreaterThan(0);

    // The real /lms page lists the enrolled course
    await page.goto('/lms');
    await expect(page.locator(`text=${cs101!.course.code}`).first()).toBeVisible();
    await expect(page.locator(`text=${cs101!.course.title}`).first()).toBeVisible();

    // The detail API exposes the seeded modules/lessons for the enrolled course
    const detail = await page.request.get(`/api/learning/courses/${cs101!.courseId}`);
    expect(detail.status()).toBe(200);
    const detailPayload = await detail.json();
    expect(detailPayload.modules.length).toBeGreaterThan(0);
    expect(detailPayload.modules[0].lessons.length).toBeGreaterThan(0);
  });

  test('Faculty sees the course they teach and can open its detail', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    const courses = await page.request.get('/api/learning/courses');
    expect(courses.status()).toBe(200);
    const payload = await courses.json();
    const list = payload.courses as CourseListingItem[];
    expect(list.length).toBeGreaterThan(0);

    const detail = await page.request.get(`/api/learning/courses/${list[0].courseId}`);
    expect(detail.status()).toBe(200);
    const detailPayload = await detail.json();
    expect(detailPayload.instructor).toBeTruthy();
  });

  test('Unauthenticated request to the course listing is rejected', async ({ page }) => {
    const response = await page.request.get('/api/learning/courses');
    expect([401, 403]).toContain(response.status());
  });

  test('Student cannot open a course they are not enrolled in (403)', async ({ page }) => {
    // Resolve a real courseId the student does not hold: the admin (privileged)
    // sees every tenant offering, so pick one that is not CS-101.
    const adminLogin = await page.request.post('/api/auth/demo-login', { data: { persona: 'ADMIN' } });
    expect(adminLogin.status()).toBe(200);
    const all = await (await page.request.get('/api/learning/courses')).json();
    const allCourses = all.courses as CourseListingItem[];
    expect(allCourses.length).toBeGreaterThan(1);
    const notEnrolled = allCourses.find((c) => c.course.code !== 'CS-101');
    expect(notEnrolled).toBeTruthy();

    // Switch to the student persona and request that course: must be rejected.
    const studentLogin = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(studentLogin.status()).toBe(200);
    const detail = await page.request.get(`/api/learning/courses/${notEnrolled!.courseId}`);
    expect(detail.status()).toBe(403);
  });
});
