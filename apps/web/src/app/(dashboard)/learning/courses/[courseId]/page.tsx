'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../../../components/layout/PageHeader';

type Lesson = { id: string; title: string; contentType: string; contentUrl: string | null; contentBody: string | null; sequence: number };
type Module = { id: string; title: string; description: string | null; sequence: number; lessons: Lesson[] };
type Assignment = { id: string; title: string; description: string; dueDate: string; maxMarks: number };
type Quiz = { id: string; title: string; description: string | null; startTime: string | null; endTime: string | null; timeLimitMins: number | null };
type CourseResponse = { course: { code: string; title: string }; instructor: string; modules: Module[]; assignments: Assignment[]; quizzes: Quiz[] };

export default function CourseWorkspace({ params }: { params: { courseId: string } }) {
  const [data, setData] = React.useState<CourseResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  React.useEffect(() => { fetch(`/api/learning/courses/${encodeURIComponent(params.courseId)}`).then(async response => { const payload: unknown = await response.json(); if (!response.ok || !isCourseResponse(payload)) throw new Error('This course is not available.'); return payload; }).then(setData).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'This course is not available.')); }, [params.courseId]);

  if (error) return <div className="space-y-6"><PageHeader title="Course" description="Learning workspace" /><div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm">{error}</div></div>;
  if (!data) return <div className="h-64 animate-pulse rounded-xl bg-surface-muted" />;
  return <div className="space-y-6"><PageHeader title={data.course.title} description={`${data.course.code} · Instructor: ${data.instructor}`} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]"><main className="min-w-0 space-y-5"><Modules modules={data.modules} /><Assessments assignments={data.assignments} quizzes={data.quizzes} /></main><aside className="h-fit rounded-xl border border-border bg-surface p-5"><h2 className="font-semibold">Course at a glance</h2><dl className="mt-4 space-y-3 text-sm"><Stat label="Modules" value={String(data.modules.length)} /><Stat label="Assignments" value={String(data.assignments.length)} /><Stat label="Quizzes" value={String(data.quizzes.length)} /></dl><Link href="/student/learning" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-3 text-sm font-medium">All courses</Link></aside></div></div>;
}

function Modules({ modules }: { modules: Module[] }) { return <section className="rounded-xl border border-border bg-surface p-5"><h2 className="font-semibold">Learning modules</h2>{modules.length === 0 ? <p className="mt-3 text-sm text-text-secondary">Published lessons will appear here.</p> : <div className="mt-4 space-y-3">{modules.map((module) => <details key={module.id} className="rounded-lg border border-border p-4" open={module.sequence === 0}><summary className="cursor-pointer font-medium">{module.title} <span className="ml-2 text-sm font-normal text-text-secondary">{module.lessons.length} lessons</span></summary>{module.description && <p className="mt-3 text-sm text-text-secondary">{module.description}</p>}<ol className="mt-3 space-y-2">{module.lessons.map((lesson) => <li key={lesson.id} className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-surface-muted px-3 text-sm"><span className="min-w-0 truncate">{lesson.title}</span><span className="shrink-0 text-text-secondary">{lesson.contentType}</span></li>)}</ol></details>)}</div>}</section>; }
function Assessments({ assignments, quizzes }: { assignments: Assignment[]; quizzes: Quiz[] }) { return <section className="rounded-xl border border-border bg-surface p-5"><h2 className="font-semibold">Assessments</h2>{assignments.length === 0 && quizzes.length === 0 ? <p className="mt-3 text-sm text-text-secondary">No assessments have been published.</p> : <div className="mt-4 space-y-3">{assignments.map((assignment) => <div key={assignment.id} className="rounded-lg border border-border p-4"><p className="font-medium">{assignment.title}</p><p className="mt-1 text-sm text-text-secondary">Due {formatDate(assignment.dueDate)} · {assignment.maxMarks} marks</p></div>)}{quizzes.map((quiz) => <div key={quiz.id} className="rounded-lg border border-border p-4"><p className="font-medium">{quiz.title}</p><p className="mt-1 text-sm text-text-secondary">{quiz.startTime ? `Opens ${formatDate(quiz.startTime)}` : 'Schedule to be announced'}{quiz.timeLimitMins ? ` · ${quiz.timeLimitMins} min` : ''}</p></div>)}</div>}</section>; }
function Stat({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><dt className="text-text-secondary">{label}</dt><dd className="font-semibold">{value}</dd></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
function isCourseResponse(value: unknown): value is CourseResponse { return Boolean(value && typeof value === 'object' && Array.isArray((value as CourseResponse).modules)); }
