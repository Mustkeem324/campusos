'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../../components/layout/PageHeader';

type Submission = { id: string; submittedAt: string; marksObtained: number | null };
type Assignment = { id: string; title: string; dueDate: string; maxMarks: number; submissions: Submission[] };
type QuizAttempt = { id: string; score: number | null; completedAt: string | null };
type Quiz = { id: string; title: string; startTime: string | null; endTime: string | null; timeLimitMins: number | null; attempts: QuizAttempt[] };
type Lesson = { id: string; title: string; contentType: string; sequence: number };
type Module = { id: string; title: string; sequence: number; lessons: Lesson[] };
type Course = { id: string; course: { id: string; code: string; title: string }; faculty: { user: { name: string } }; CourseModule: Module[]; assignments: Assignment[]; Quiz: Quiz[] };
type LearningResponse = { courses: Course[] };

export default function StudentLearningDashboard() {
  const [data, setData] = React.useState<LearningResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/student/learning')
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isLearningResponse(payload)) throw new Error('Learning data is not available.');
        return payload;
      })
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Learning data is not available.'));
  }, []);

  return <div className="space-y-6">
    <PageHeader title="My Learning" description="Your enrolled courses, published learning content, assessments, and deadlines." />
    {error ? <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm">{error}</div> : !data ? <div className="h-64 animate-pulse rounded-xl bg-surface-muted" /> : data.courses.length === 0 ? <EmptyState /> : <LearningContent courses={data.courses} />}
  </div>;
}

function LearningContent({ courses }: { courses: Course[] }) {
  const now = Date.now();
  const upcoming = courses.flatMap((course) => course.assignments.filter((assignment) => assignment.submissions.length === 0 && new Date(assignment.dueDate).getTime() >= now).map((assignment) => ({ ...assignment, course }))).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  const publishedLessons = courses.reduce((total, course) => total + course.CourseModule.reduce((moduleTotal, module) => moduleTotal + module.lessons.length, 0), 0);

  return <>
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Enrolled courses" value={String(courses.length)} />
      <Metric label="Published lessons" value={String(publishedLessons)} />
      <Metric label="Upcoming assignments" value={String(upcoming.length)} />
    </div>
    {upcoming.length > 0 && <section className="rounded-xl border border-border bg-surface p-5"><h2 className="font-semibold">Upcoming work</h2><ul className="mt-3 divide-y divide-border">{upcoming.map((assignment) => <li key={assignment.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{assignment.title}</p><p className="text-sm text-text-secondary">{assignment.course.course.code} · Due {formatDate(assignment.dueDate)}</p></div><Link className="min-h-11 inline-flex items-center justify-center rounded-lg border border-border px-3 text-sm font-medium" href={`/learning/courses/${assignment.course.course.id}`}>Open course</Link></li>)}</ul></section>}
    <section aria-labelledby="courses-heading" className="space-y-4"><h2 id="courses-heading" className="text-lg font-semibold">Courses</h2>{courses.map((course) => <CourseCard key={course.id} course={course} />)}</section>
  </>;
}

function CourseCard({ course }: { course: Course }) {
  const lessonCount = course.CourseModule.reduce((total, module) => total + module.lessons.length, 0);
  const submitted = course.assignments.filter((assignment) => assignment.submissions.length > 0).length;
  return <article className="rounded-xl border border-border bg-surface p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-primary">{course.course.code}</p><h3 className="mt-1 text-lg font-semibold">{course.course.title}</h3><p className="mt-1 text-sm text-text-secondary">Instructor: {course.faculty.user.name}</p></div><Link href={`/learning/courses/${course.course.id}`} className="min-h-11 inline-flex items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Open course</Link></div><dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><Detail label="Modules" value={String(course.CourseModule.length)} /><Detail label="Lessons" value={String(lessonCount)} /><Detail label="Submitted" value={`${submitted}/${course.assignments.length}`} /><Detail label="Quizzes" value={String(course.Quiz.length)} /></dl>{course.assignments.length > 0 && <div className="mt-5 border-t border-border pt-4"><h4 className="text-sm font-semibold">Assessments</h4><ul className="mt-2 space-y-2">{course.assignments.slice(0, 3).map((assignment) => <li key={assignment.id} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate">{assignment.title}</span><span className="shrink-0 text-text-secondary">{assignment.submissions.length > 0 ? 'Submitted' : `Due ${formatDate(assignment.dueDate)}`}</span></li>)}</ul></div>}</article>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-surface p-5"><p className="text-sm text-text-secondary">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-surface-muted p-3"><dt className="text-text-secondary">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>; }
function EmptyState() { return <div className="rounded-xl border border-dashed border-border p-10 text-center"><h2 className="font-semibold">No enrolled courses</h2><p className="mt-2 text-sm text-text-secondary">Your courses will appear here once you are enrolled for a term.</p></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
function isLearningResponse(value: unknown): value is LearningResponse { return Boolean(value && typeof value === 'object' && Array.isArray((value as LearningResponse).courses)); }
