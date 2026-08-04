'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  ReceiptText,
  BellRing,
  Building2,
  ClipboardList,
  LifeBuoy,
  School,
  Trophy,
} from 'lucide-react';
import type { StudentDashboardData } from '@/lib/dashboard/contracts';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Student dashboard — a dedicated composition for the STUDENT role.
 *
 * Every value originates from the server-side StudentDashboardData contract;
 * the component only renders, and handles loading/empty/error states honestly.
 */
export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  return (
    <section className="space-y-6" aria-label="Student dashboard">
      {/* Identity header */}
      <header className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold">
              {initials(data.identity.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Student Workspace
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Welcome back, {data.identity.name}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {data.identity.programme} • {data.identity.batch}
                {data.identity.section ? ` • ${data.identity.section}` : ''}
              </p>
              <p className="mt-0.5 text-xs font-mono text-text-muted">
                Roll No. {data.identity.rollNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
              {formatCurrency(data.feeSummary.totalInvoiced ?? 0)} invoiced
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Quick actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Risk alerts first (critical before decorative analytics) */}
      <AlertSection alerts={data.riskAlerts} />

      {/* Primary metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Academic summary">
        <MetricCard
          icon={GraduationCap}
          label="Current CGPA"
          value={data.cgpa === null ? null : data.cgpa.toFixed(2)}
          detail="Published academic record"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Attendance"
          value={data.attendance ? `${data.attendance.percentage}%` : null}
          detail={data.attendance ? `${data.attendance.present} of ${data.attendance.total} sessions attended` : 'No sessions recorded yet'}
        />
        <MetricCard
          icon={ReceiptText}
          label="Outstanding fees"
          value={data.feeSummary.outstandingAmount === null ? null : formatCurrency(data.feeSummary.outstandingAmount)}
          detail={feeDetail(data.feeSummary)}
        />
        <MetricCard
          icon={FileText}
          label="Assignments"
          value={String(data.assignments.length)}
          detail={`${data.assignments.filter((a) => a.submitted).length} submitted`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Examinations */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={School} title="Examinations" href="/examinations" />
          {data.examinations.length === 0 ? (
            <EmptyState
              title="No examinations scheduled"
              description="Examination schedules published for your courses will appear here."
              actionHref="/examinations"
              actionLabel="View examinations"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {data.examinations.map((exam) => (
                <li key={exam.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <School size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{exam.name}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">{exam.type.replace(/_/g, ' ')} • {formatDate(exam.examDate)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    exam.status === 'UPCOMING' ? 'bg-warning-soft text-warning' : 'bg-surface-muted text-text-muted'
                  }`}>
                    {exam.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Published results */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={Trophy} title="Published results" href="/results" />
          {data.publishedResults.length === 0 ? (
            <EmptyState
              title="No published results yet"
              description="Results published by the examination office will appear here. Draft results are never shown."
              actionHref="/results"
              actionLabel="View results"
            />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.publishedResults.map((result) => (
                <li key={result.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{result.examinationName}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      SGPA {result.sgpa.toFixed(2)} • CGPA {result.cgpa.toFixed(2)} • {result.status}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success">
                    Published
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Student services */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={LifeBuoy} title="Student services" href="/helpdesk" />
          {data.studentServices.length === 0 ? (
            <EmptyState
              title="No service requests"
              description="Raise a request with student services and track its status here."
              actionHref="/helpdesk"
              actionLabel="Raise a request"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {data.studentServices.map((service) => (
                <li key={service.id} className="rounded-xl border border-border bg-surface-muted p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{service.title}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {service.caseNumber} • {service.category}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {service.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Hostel & services side panel */}
        <section className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <SectionHeading icon={Building2} title="Hostel" href="/hostel" />
            {data.hostel ? (
              <div className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
                <p className="text-sm font-bold text-text-primary">{data.hostel.hostelName}</p>
                <p className="mt-0.5 text-xs text-text-secondary">{data.hostel.building}</p>
                <p className="mt-2 inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">
                  Room {data.hostel.roomNumber}
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
                No hostel allocation assigned to your profile.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <SectionHeading icon={ClipboardList} title="Notifications" href="/notifications" />
            {data.notifications.length === 0 ? (
              <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
                You have no notifications.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {data.notifications.map((notification) => (
                  <li key={notification.id} className="rounded-xl border border-border bg-surface-muted p-3">
                    <p className="text-sm font-semibold text-text-primary">{notification.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-text-secondary">{notification.body}</p>
                    <p className="mt-1.5 text-[11px] text-text-muted">{formatDate(notification.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Today's classes */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={CalendarDays} title="Today's classes" href="/timetable" />
          {data.todayClasses.length === 0 ? (
            <EmptyState
              title="No classes scheduled today"
              description="You have no timetable slots for today. View your full timetable to plan ahead."
              actionHref="/timetable"
              actionLabel="Open timetable"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {data.todayClasses.map((slot) => (
                <li key={slot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary text-xs font-bold">
                      {slot.code}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{slot.title}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">{slot.time} • {slot.room}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {slot.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Assignments */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={FileText} title="Assignments" href="/assignments" />
          {data.assignments.length === 0 ? (
            <EmptyState
              title="No assignments yet"
              description="Nothing has been assigned to your courses. New assignments will appear here."
              actionHref="/lms"
              actionLabel="Open learning"
            />
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.assignments.map((assignment) => (
                <li key={assignment.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{assignment.title}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {assignment.courseCode} • Due {formatDate(assignment.dueDate)}
                    </p>
                  </div>
                  {assignment.submitted ? (
                    <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-1 text-[10px] font-bold text-success">
                      Submitted
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-[10px] font-bold text-warning">
                      Pending
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Notices */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={BellRing} title="Notices & announcements" href="/notifications" />
          {data.notices.length === 0 ? (
            <EmptyState
              title="No notices yet"
              description="Institutional notices for students will appear here when published."
              actionHref="/community"
              actionLabel="Visit community"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-border bg-surface-muted p-3.5">
                  <p className="text-sm font-bold text-text-primary">{notice.title}</p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">{notice.content}</p>
                  <p className="mt-2 text-[11px] text-text-muted">{formatDate(notice.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={Clock3} title="Recent activity" />
          {data.recentActivity.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
              There is no recorded activity to show yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">{item.action}</p>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">{item.entity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function feeDetail(summary: StudentDashboardData['feeSummary']): string {
  if (summary.invoiceCount === 0) return 'No invoices issued yet';
  if (summary.status === 'CLEAR') return 'All dues clear';
  if (summary.status === 'PARTIAL') return 'Partially paid — next due ' + (summary.nextDueDate ? formatDate(summary.nextDueDate) : 'TBD');
  return 'Payment overdue — next due ' + (summary.nextDueDate ? formatDate(summary.nextDueDate) : 'TBD');
}

function AlertSection({ alerts }: { alerts: StudentDashboardData['riskAlerts'] }) {
  if (alerts.length === 0) return null;
  return (
    <section aria-label="Action required" className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            alert.level === 'danger'
              ? 'border-danger/30 bg-danger-soft'
              : 'border-warning/30 bg-warning-soft'
          }`}
        >
          <AlertCircle className={`mt-0.5 h-5 w-5 shrink-0 ${alert.level === 'danger' ? 'text-danger' : 'text-warning'}`} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{alert.message}</p>
          </div>
          {alert.href && (
            <Link href={alert.href} className="shrink-0 text-xs font-bold text-primary hover:underline">
              Act <ArrowRight className="inline h-3 w-3" />
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null;
  detail: string;
}) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary">
        {value ?? 'No data available'}
      </p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-text-muted">{detail}</p>
    </article>
  );
}

function SectionHeading({ icon: Icon, title, href }: { icon: React.ElementType; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
        <Icon size={18} className="text-primary" /> {title}
      </h2>
      {href && (
        <Link href={href} className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-surface-muted p-6 text-center">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-text-secondary">{description}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft"
        >
          {actionLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
