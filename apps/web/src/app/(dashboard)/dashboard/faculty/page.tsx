'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  UsersRound,
} from 'lucide-react';
import { RoleDashboardGuard } from '@/components/auth/RoleDashboardGuard';
import type { FacultyDashboardData } from '@/lib/dashboard/contracts';

async function readFacultyPayload(response: Response): Promise<FacultyDashboardData | { error: string }> {
  const payload: unknown = await response.json().catch(() => ({}));
  return payload as FacultyDashboardData | { error: string };
}

export default function FacultyDashboardPage() {
  const [data, setData] = React.useState<FacultyDashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/dashboard/faculty')
      .then(async (response) => {
        const payload = await readFacultyPayload(response);
        if (!response.ok || !payload || !('role' in payload)) {
          throw new Error('error' in payload ? String(payload.error) : 'Unable to load your faculty workspace.');
        }
        return payload;
      })
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load your faculty workspace.'));
  }, []);

  return (
    <RoleDashboardGuard role="FACULTY">
      <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6">
        {error ? (
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-soft p-6 text-sm text-danger">
            <p className="font-semibold">Faculty workspace unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex h-72 items-center justify-center" aria-label="Loading faculty workspace">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary-soft px-3 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Faculty Teaching Workspace
                </span>
                <h1 className="mt-2 text-2xl font-bold text-text-primary">{data.identity.name}</h1>
                <p className="mt-1 text-xs text-text-secondary">
                  {data.identity.designation ?? 'Faculty'} {data.academicPeriod ? `· ${data.academicPeriod.label}` : ''} · {data.identity.email}
                </p>
              </div>

              <Link
                href="/assignments"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                Grade submissions ({data.pendingGrading.total})
              </Link>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.metrics.map((metric) => (
                <div key={metric.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold text-text-secondary">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold text-text-primary">{metric.value}</p>
                  <p className={`mt-1 text-xs font-medium ${metric.tone === 'warning' ? 'text-warning' : 'text-primary'}`}>{metric.detail}</p>
                </div>
              ))}
            </div>

            {data.riskAlerts.length > 0 && (
              <div className="space-y-2">
                {data.riskAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    role="alert"
                    className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
                      alert.level === 'danger' ? 'border-danger/30 bg-danger-soft text-danger' : 'border-warning/30 bg-warning-soft text-warning'
                    }`}
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="font-semibold">{alert.message}</p>
                      {alert.href && (
                        <Link href={alert.href} className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-4">
                          Open workspace <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-7">
                <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" /> Assigned courses
                </h2>

                {data.assignedCourses.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                    No course offerings are assigned to you for the current term.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.assignedCourses.map((course) => (
                      <li key={course.id} className="rounded-xl border border-border bg-surface-muted p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary">
                              {course.code} · {course.title}
                            </p>
                            <p className="mt-0.5 text-xs text-text-secondary">
                              {course.section ?? 'No section'} · {course.term}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-text-secondary">
                            <span className="flex items-center gap-1.5">
                              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" /> {course.studentCount} students
                            </span>
                            <span>{course.assignmentCount} assignments</span>
                            <span className={course.ungradedSubmissionCount > 0 ? 'font-semibold text-warning' : ''}>
                              {course.ungradedSubmissionCount} ungraded
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <h2 className="mt-8 flex items-center gap-2 text-base font-bold text-text-primary">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" /> Today&apos;s classes
                </h2>
                {data.todayClasses.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                    No classes are scheduled for you today. Your timetable is managed in the Timetable workspace.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {data.todayClasses.map((slot) => (
                      <li key={slot.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm">
                        <div>
                          <p className="font-semibold text-text-primary">
                            {slot.code} · {slot.title}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {slot.time} · {slot.room}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                          {slot.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <aside className="space-y-6 lg:col-span-5">
                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                    <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Grading queue
                  </h2>
                  {data.pendingGrading.total === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                      All submissions in your courses are graded. Nice work.
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {data.pendingGrading.perCourse.map((course) => (
                        <li key={course.courseCode} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
                          <span className="font-medium text-text-primary">{course.courseCode}</span>
                          <span className="font-semibold text-warning">{course.count} pending</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/assignments"
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
                  >
                    Open assignments
                  </Link>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                    <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" /> Attendance
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    {data.attendance.sessionCount} attendance session{data.attendance.sessionCount === 1 ? '' : 's'} across your courses
                    {data.attendance.recordedToday > 0 ? ` · ${data.attendance.recordedToday} records today` : ''}.
                  </p>
                  <Link
                    href="/attendance"
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
                  >
                    Mark attendance
                  </Link>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="text-base font-bold text-text-primary">Quick actions</h2>
                  <ul className="mt-4 space-y-2">
                    {data.quickActions.map((action) => (
                      <li key={action.href}>
                        <Link
                          href={action.href}
                          className="flex min-h-11 items-center justify-between rounded-lg border border-border px-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
                        >
                          {action.label}
                          <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </RoleDashboardGuard>
  );
}
