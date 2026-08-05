'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  FileText,
  GraduationCap,
  IndianRupee,
  Loader2,
  Receipt,
} from 'lucide-react';
import { RoleDashboardGuard } from '@/components/auth/RoleDashboardGuard';
import type { FinanceDashboardData } from '@/lib/dashboard/contracts';

async function readFinancePayload(response: Response): Promise<FinanceDashboardData | { error: string }> {
  const payload: unknown = await response.json().catch(() => ({}));
  return payload as FinanceDashboardData | { error: string };
}

export default function FinanceDashboardPage() {
  const [data, setData] = React.useState<FinanceDashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/dashboard/finance')
      .then(async (response) => {
        const payload = await readFinancePayload(response);
        if (!response.ok || !payload || !('role' in payload)) {
          throw new Error('error' in payload ? String(payload.error) : 'Unable to load your finance workspace.');
        }
        return payload;
      })
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load your finance workspace.'));
  }, []);

  return (
    <RoleDashboardGuard role={['FINANCE_OFFICER', 'ACCOUNTANT']}>
      <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6">
        {error ? (
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-soft p-6 text-sm text-danger">
            <p className="font-semibold">Finance workspace unavailable</p>
            <p className="mt-1">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex h-72 items-center justify-center" aria-label="Loading finance workspace">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : (
          <>
            <header className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <span className="inline-flex min-h-8 items-center rounded-full border border-primary/20 bg-primary-soft px-3 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Finance Operations Workspace
                </span>
                <h1 className="mt-2 text-2xl font-bold text-text-primary">{data.identity.name}</h1>
                <p className="mt-1 text-xs text-text-secondary">
                  {data.identity.designation ?? 'Finance Officer'} {data.financialPeriod ? `· ${data.financialPeriod.label}` : ''} · {data.identity.email}
                </p>
              </div>

              <Link
                href="/payments"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Banknote className="h-4 w-4" aria-hidden="true" />
                Open fee collections
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

            {data.outstanding.invoiceCount > 0 && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="font-semibold">
                    {data.outstanding.invoiceCount} invoice{data.outstanding.invoiceCount === 1 ? '' : 's'} are pending or partially paid.
                  </p>
                  <Link href="/payments" className="mt-1 inline-flex items-center gap-1 font-semibold underline underline-offset-4">
                    Review outstanding balances <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <section className="rounded-2xl border border-border bg-white p-6 shadow-sm lg:col-span-7">
                <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <Receipt className="h-4 w-4 text-primary" aria-hidden="true" /> Outstanding invoices
                </h2>

                {data.outstanding.topInvoices.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                    No pending or partial invoices in this tenant. All fee balances are settled.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.outstanding.topInvoices.map((invoice) => (
                      <li key={invoice.id} className="rounded-xl border border-border bg-surface-muted p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-text-primary">{invoice.studentName}</p>
                            <p className="mt-0.5 text-xs text-text-secondary">
                              Due {new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-secondary">
                            <span className="font-semibold text-text-primary">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoice.amount)}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                invoice.status === 'PENDING' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary'
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <h2 className="mt-8 flex items-center gap-2 text-base font-bold text-text-primary">
                  <IndianRupee className="h-4 w-4 text-primary" aria-hidden="true" /> Recent payments
                </h2>
                {data.recentPayments.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                    No paid payments have been recorded yet in this tenant.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {data.recentPayments.map((payment) => (
                      <li key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">{payment.studentName}</p>
                          <p className="text-xs text-text-secondary">
                            {payment.method} · {new Date(payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold text-text-primary">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payment.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <aside className="space-y-6 lg:col-span-5">
                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                    <FileText className="h-4 w-4 text-primary" aria-hidden="true" /> Invoice status
                  </h2>
                  {data.invoiceStatusBreakdown.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                      No invoices exist for this tenant yet.
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {data.invoiceStatusBreakdown.map((group) => (
                        <li key={group.status} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
                          <span className="font-medium capitalize text-text-primary">{group.status.toLowerCase()}</span>
                          <span className="font-semibold text-text-primary">{group.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/receipts"
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
                  >
                    Open receipts
                  </Link>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                    <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" /> Schemes
                  </h2>
                  <p className="mt-3 text-sm text-text-secondary">
                    {data.schemes.scholarshipCount} scholarship scheme{data.schemes.scholarshipCount === 1 ? '' : 's'} and{' '}
                    {data.schemes.feeStructureCount} fee structure{data.schemes.feeStructureCount === 1 ? '' : 's'} configured in this tenant.
                  </p>
                  <Link
                    href="/scholarships"
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
                  >
                    Manage scholarships
                  </Link>
                </section>

                <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
                    <Activity className="h-4 w-4 text-primary" aria-hidden="true" /> Recent activity
                  </h2>
                  {data.recentActivity.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                      No recent activity recorded for your finance account yet.
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {data.recentActivity.map((item) => (
                        <li key={item.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 text-sm">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-text-primary">{item.action}</p>
                            <p className="text-xs text-text-secondary">
                              {item.entity} · {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/audit"
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
                  >
                    Open audit logs
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
