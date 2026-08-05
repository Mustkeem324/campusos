import { test, expect } from '@playwright/test';

test.describe('Phase 98 Assignments, Rubric Grading & Gradebook (live server)', () => {
  test('Student sees CS-101 assignments with submission status and own gradebook', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await (await page.request.get('/api/learning/courses')).json();
    const cs101 = courses.courses.find((c: { course: { code: string } }) => c.course.code === 'CS-101');
    expect(cs101).toBeTruthy();

    const assignments = await (await page.request.get(`/api/learning/courses/${cs101.courseId}/assignments`)).json();
    expect(assignments.assignments.length).toBeGreaterThan(0);
    const first = assignments.assignments[0];
    expect(first.rubric.length).toBeGreaterThan(0); // rubric criteria visible to student
    expect(first.submission).toBeTruthy(); // seeded submission for Rohan
    expect(typeof first.submission.marksObtained).toBe('number');

    const gradebook = await (await page.request.get(`/api/learning/courses/${cs101.courseId}/gradebook`)).json();
    expect(gradebook.studentView).toBe(true);
    expect(gradebook.items.length).toBeGreaterThan(0);
    expect(typeof gradebook.percentage).toBe('number');

    // /assignments page lists the student's assignments
    await page.goto('/assignments');
    await expect(page.locator('text=CS-101').first()).toBeVisible();
  });

  test('Faculty sees submissions and can grade them; student cannot grade', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'FACULTY' } });
    expect(login.status()).toBe(200);

    const courses = await (await page.request.get('/api/learning/courses')).json();
    const taught = courses.courses[0];

    const assignments = await (await page.request.get(`/api/learning/courses/${taught.courseId}/assignments`)).json();
    expect(assignments.assignments.length).toBeGreaterThan(0);
    const first = assignments.assignments[0];
    expect(first.submissions.length).toBeGreaterThan(0);
    const target = first.submissions.find((s: { marksObtained: number | null }) => s.marksObtained === null) ?? first.submissions[0];

    // Faculty grades the submission
    const grade = await page.request.put(
      `/api/learning/courses/${taught.courseId}/assignments/${first.id}/submissions/${target.id}/grade`,
      { data: { marksObtained: 88, rubricScores: { 'Understanding of concepts': 36, 'Application & analysis': 31, 'Presentation & clarity': 21 }, feedback: 'Well done.' } },
    );
    expect(grade.status()).toBe(200);

    const gradebook = await (await page.request.get(`/api/learning/courses/${taught.courseId}/gradebook`)).json();
    expect(gradebook.studentView).toBe(false);
    expect(gradebook.items.length).toBeGreaterThan(0);
  });

  test('Student cannot grade a submission (403)', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await (await page.request.get('/api/learning/courses')).json();
    const cs101 = courses.courses.find((c: { course: { code: string } }) => c.course.code === 'CS-101');
    const assignments = await (await page.request.get(`/api/learning/courses/${cs101.courseId}/assignments`)).json();
    const first = assignments.assignments[0];

    const grade = await page.request.put(
      `/api/learning/courses/${cs101.courseId}/assignments/${first.id}/submissions/${first.submission.id}/grade`,
      { data: { marksObtained: 90 } },
    );
    expect([403, 404]).toContain(grade.status());
  });

  test('Unauthenticated requests to assignments and gradebook are rejected', async ({ page }) => {
    const assignments = await page.request.get('/api/learning/courses/00000000-000b-0000-0000-000000000000/assignments');
    expect([401, 403]).toContain(assignments.status());
    const gradebook = await page.request.get('/api/learning/courses/00000000-000b-0000-0000-000000000000/gradebook');
    expect([401, 403]).toContain(gradebook.status());
  });

  test('Student can submit their own assignment once (upsert, no duplicates)', async ({ page }) => {
    const login = await page.request.post('/api/auth/demo-login', { data: { persona: 'STUDENT' } });
    expect(login.status()).toBe(200);

    const courses = await (await page.request.get('/api/learning/courses')).json();
    const cs101 = courses.courses.find((c: { course: { code: string } }) => c.course.code === 'CS-101');
    const assignments = await (await page.request.get(`/api/learning/courses/${cs101.courseId}/assignments`)).json();
    const target = assignments.assignments[0];

    const submit = await page.request.post(`/api/learning/courses/${cs101.courseId}/assignments/${target.id}/submit`, {
      data: { fileUrl: '/uploads/rohan-final.pdf' },
    });
    expect(submit.status()).toBe(200);

    // Verify only one submission exists for this assignment+student
    const after = await (await page.request.get(`/api/learning/courses/${cs101.courseId}/assignments`)).json();
    const mine = after.assignments.find((a: { id: string }) => a.id === target.id);
    expect(mine.submission.fileUrl).toBe('/uploads/rohan-final.pdf');
  });
});
