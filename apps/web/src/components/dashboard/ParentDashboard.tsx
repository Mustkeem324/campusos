'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CalendarDays,
  Clock3,
  GraduationCap,
  ReceiptText,
  Users,
} from 'lucide-react';
import type { ParentDashboardData } from '@/lib/dashboard/contracts';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

/**
 * Parent / Guardian dashboard — a dedicated composition for the PARENT role.
 * Identity always represents the authenticated guardian. The linked student is
 * shown separately, and a selector appears when multiple verified links exist.
 * Switching the selector re-fetches through the server, which re-verifies the
 * guardian-student relationship before returning any ward data.
 */
export function ParentDashboard({ data }: { data: ParentDashboardData }) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);

  async function selectStudent(studentId: string) {
    if (studentId === data.selectedStudentId) return;
    setSwitching(studentId);
    router.push(`/dashboard/parent?studentId=${encodeURIComponent(studentId)}`);
  }

  return (
    <section className="space-y-6" aria-label="Parent and guardian dashboard">
      {/* Guardian identity header */}
      <header className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-bold text-primary">
              {initials(data.identity.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Parent &amp; Guardian Portal</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Signed in as: {data.identity.name}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {data.identity.title} • {data.identity.email}
              </p>
            </div>
          </div>
          <span className="w-fit rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
            {data.linkedStudents.length} verified link{data.linkedStudents.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Linked-student selector (shown when multiple verified links exist) */}
        {data.linkedStudents.length > 1 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Viewing linked student</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Linked student selector">
              {data.linkedStudents.map((student) => {
                const active = student.id === data.selectedStudentId;
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => selectStudent(student.id)}
                    disabled={switching !== null}
                    aria-pressed={active}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? 'border-primary/50 bg-primary-soft text-primary'
                        : 'border-border bg-surface-muted text-text-primary hover:border-primary/40 hover:bg-primary-soft hover:text-primary'
                    }`}
                  >
                    {switching === student.id && <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />}
                    <span className="font-bold">{initials(student.name)}</span>
                    {student.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {!data.selectedStudent ? (
        <div className="rounded-2xl border border-border bg-white p-6 text-sm text-text-secondary shadow-sm">
          No verified linked student is currently available for this guardian account.
        </div>
      ) : (
        <>
          {/* Ward summary */}
          <header className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted font-bold text-text-primary">
                  {initials(data.selectedStudent.name)}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Linked student • {data.selectedStudent.relationship}
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold tracking-tight text-text-primary">
                    {data.selectedStudent.name}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {data.selectedStudent.rollNumber} • {data.selectedStudent.programme} • {data.selectedStudent.batch}
                  </p>
                </div>
              </div>
              {data.selectedStudent.cgpa !== null && (
                <div className="w-fit rounded-xl border border-border bg-surface-muted px-4 py-2 text-center">
                  <p className="text-lg font-bold text-text-primary">{data.selectedStudent.cgpa.toFixed(2)}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Cumulative GPA</p>
                </div>
              )}
            </div>
          </header>

          {/* Ward risk alerts */}
          {data.riskAlerts.length > 0 && (
            <section aria-label="Action required" className="space-y-3">
              {data.riskAlerts.map((alert) => (
                <div
                  key={alert.id}
                  role="alert"
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${
                    alert.level === 'danger'
                      ? 'border-danger/30 bg-danger-soft'
                      : alert.level === 'warning'
                        ? 'border-warning/30 bg-warning-soft'
                        : 'border-border bg-surface-muted'
                  }`}
                >
                  <AlertCircle
                    className={`mt-0.5 h-5 w-5 shrink-0 ${
                      alert.level === 'danger' ? 'text-danger' : alert.level === 'warning' ? 'text-warning' : 'text-primary'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{alert.message}</p>
                  </div>
                  {alert.href && (
                    <Link href={alert.href} className="shrink-0 text-xs font-bold text-primary hover:underline">
                      Review <ArrowRight className="inline h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Ward primary metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ward summary">
            <WardMetric
              label="Ward attendance"
              value={data.selectedStudent.attendance ? `${data.selectedStudent.attendance.percentage}%` : '—'}
              detail={
                data.selectedStudent.attendance
                  ? `${data.selectedStudent.attendance.present} of ${data.selectedStudent.attendance.total} sessions`
                  : 'No sessions recorded yet'
              }
            />
            <WardMetric
              label="Published results"
              value={data.selectedStudent.publishedResults.length}
              detail={data.selectedStudent.publishedResults.length > 0 ? 'Official results available' : 'None published yet'}
            />
            <WardMetric
              label="Fee status"
              value={feeStatusLabel(data.selectedStudent.feeSummary.status)}
              detail={
                data.selectedStudent.feeSummary.outstandingAmount === null
                  ? 'No invoices issued'
                  : `${formatCurrency(data.selectedStudent.feeSummary.outstandingAmount)} outstanding`
              }
            />
            <WardMetric label="Quick actions" value={data.quickActions.length} detail="Parent portal shortcuts" />
          </section>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Published results */}
            <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <SectionHeading icon={GraduationCap} title="Published academic results" href="/results" />
              {data.selectedStudent.publishedResults.length === 0 ? (
                <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
                  No published results are available for this student yet.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {data.selectedStudent.publishedResults.map((result) => (
                    <li key={result.id} className="rounded-xl border border-border bg-surface-muted p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary">{result.examinationName}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">SGPA {result.sgpa.toFixed(2)} • CGPA {result.cgpa.toFixed(2)}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                          {result.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Fee overview */}
            <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <SectionHeading icon={ReceiptText} title="Fee overview" href="/payments" />
              <div className="mt-4 space-y-3">
                <FinanceRow label="Total invoiced" value={data.selectedStudent.feeSummary.totalInvoiced === null ? '—' : formatCurrency(data.selectedStudent.feeSummary.totalInvoiced)} />
                <FinanceRow label="Outstanding" value={data.selectedStudent.feeSummary.outstandingAmount === null ? '—' : formatCurrency(data.selectedStudent.feeSummary.outstandingAmount)} />
                <FinanceRow
                  label="Next due date"
                  value={data.selectedStudent.feeSummary.nextDueDate ? formatDate(data.selectedStudent.feeSummary.nextDueDate) : '—'}
                />
                <FinanceRow label="Status" value={feeStatusLabel(data.selectedStudent.feeSummary.status)} />
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Institutional notices */}
            <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <SectionHeading icon={BellRing} title="Institutional notices" href="/community" />
              {data.notices.length === 0 ? (
                <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">No notices have been published yet.</p>
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
              <SectionHeading icon={Clock3} title="Recent activity" href="/notifications" />
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

          {/* Guardian quick actions */}
          <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <SectionHeading icon={Users} title="Parent portal actions" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {data.quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex min-h-10 items-center gap-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5 text-xs font-semibold text-text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                >
                  <CalendarDays size={15} className="shrink-0 text-primary" />
                  {action.label}
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function WardMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary">{value}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-text-muted">{detail}</p>
    </article>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3.5 py-3">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-sm font-bold text-text-primary">{value}</p>
    </div>
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

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function feeStatusLabel(status: string): string {
  switch (status) {
    case 'CLEAR':
      return 'Clear';
    case 'PARTIAL':
      return 'Partially paid';
    case 'OUTSTANDING':
      return 'Outstanding';
    case 'UNKNOWN':
      return 'Not invoiced';
    default:
      return status;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
