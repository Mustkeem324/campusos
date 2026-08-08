'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  RefreshCcw,
  Search,
  ShieldAlert,
  UserPlus,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';

import { formatMinor } from '@/lib/finance-money';
import type { WorkforceAdminOverview, EmployeeProfileView, PayrollPeriodView } from '@/lib/workforce-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;
type Tab = 'overview' | 'employees' | 'leave' | 'payroll' | 'exits';

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function dateLabel(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

function statusBadge(label: string, tone: string) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${tone}`}>{label.replace(/_/g, ' ')}</span>;
}

const statusTone: Record<string, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PROBATION: 'border-blue-200 bg-blue-50 text-blue-700',
  ON_LEAVE: 'border-amber-200 bg-amber-50 text-amber-700',
  NOTICE_PERIOD: 'border-orange-200 bg-orange-50 text-orange-700',
  SUSPENDED: 'border-rose-200 bg-rose-50 text-rose-700',
  RESIGNED: 'border-slate-200 bg-slate-50 text-slate-500',
  TERMINATED: 'border-rose-200 bg-rose-50 text-rose-700',
  EXITED: 'border-slate-200 bg-slate-50 text-slate-500',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  SUBMITTED: 'border-blue-200 bg-blue-50 text-blue-700',
  MANAGER_APPROVAL: 'border-amber-200 bg-amber-50 text-amber-700',
  HR_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  REQUESTED: 'border-amber-200 bg-amber-50 text-amber-700',
  CLEARED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  APPROVAL_PENDING: 'border-orange-200 bg-orange-50 text-orange-700',
  PROCESSING: 'border-blue-200 bg-blue-50 text-blue-700',
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-slate-200 bg-slate-50 text-slate-500',
  READY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  EXCEPTION: 'border-rose-200 bg-rose-50 text-rose-700',
};

const metricTone: Record<string, string> = {
  positive: 'text-emerald-600',
  warning: 'text-amber-600',
  danger: 'text-rose-600',
  neutral: 'text-[#1754E8]',
};

function NoticeBox({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  const tone = notice.tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : notice.tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-blue-200 bg-blue-50 text-blue-800';
  return <div role="status" className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${tone}`}><span>{notice.text}</span><button type="button" onClick={onClose} className="rounded-lg p-1" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>;
}

function LoadingState() {
  return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#1754E8]" aria-label="Loading" /></div>;
}

function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
      <p className="text-sm text-[#5F6B7A]">{message}</p>
      <button type="button" onClick={retry} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D6DFEB] px-4 text-xs font-bold text-[#1754E8]"><RefreshCcw className="h-4 w-4" />Retry</button>
    </div>
  );
}

export function WorkforceAdminConsole() {
  const [data, setData] = useState<WorkforceAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState('');

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setFatalError('');
    try {
      const response = await fetch('/api/workforce/admin', { cache: 'no-store' });
      const payload = await json<WorkforceAdminOverview & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load the workforce admin console.');
      setData(payload);
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : 'Unable to load the workforce admin console.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function act(path: string, method: string, body: unknown, successMessage: string, silent = true) {
    setBusy(path);
    setNotice(null);
    try {
      const response = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body === null ? undefined : JSON.stringify(body) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Request failed.');
      setNotice({ tone: 'success', text: successMessage });
      await reload(silent);
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Request failed.' });
    } finally {
      setBusy('');
    }
  }

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.employees ?? [];
    return (data?.employees ?? []).filter((employee) =>
      employee.name.toLowerCase().includes(query) ||
      employee.employeeNumber.toLowerCase().includes(query) ||
      employee.designation.toLowerCase().includes(query) ||
      (employee.departmentName ?? '').toLowerCase().includes(query),
    );
  }, [data, search]);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={fatalError || 'Workforce admin console unavailable.'} retry={() => void reload()} />;

  const tabs: Array<[Tab, string]> = [
    ['overview', 'Overview'],
    ['employees', 'Employees'],
    ['leave', 'Leave & corrections'],
    ['payroll', 'Payroll'],
    ['exits', 'Exits & settlement'],
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 pb-16">
      <section className="overflow-hidden rounded-3xl border border-[#D8E2EF] bg-white shadow-[0_18px_50px_rgba(16,29,56,0.07)]">
        <div className="p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Workforce control centre
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#101D38] sm:text-3xl">Faculty, HR, Payroll & Workforce 2.0</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5F6B7A]">
            Employee lifecycle, staff attendance, leave, compensation, payroll, recruitment and exit operations — all derived from live tenant-scoped records.
          </p>
        </div>
      </section>

      {notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}
      {fatalError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{fatalError}</div>}

      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-extrabold ${tab === id ? 'bg-[#1754E8] text-white' : 'bg-[#F7F9FC] text-[#607086]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <Overview data={data} metrics={data.metrics} history={data.recentHistory} setTab={setTab} />
      )}

      {tab === 'employees' && (
        <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><UsersRound className="h-4 w-4 text-[#1754E8]" />Employees</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A94A6]" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, number, designation…" className="w-72 rounded-xl border border-[#C9D5E4] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#1754E8]" aria-label="Search employees" />
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[10px] uppercase tracking-wide text-[#8A94A6]">
                <tr>
                  <th className="rounded-l-xl px-3 py-2.5 font-extrabold">Employee</th>
                  <th className="px-3 py-2.5 font-extrabold">Number</th>
                  <th className="px-3 py-2.5 font-extrabold">Designation</th>
                  <th className="px-3 py-2.5 font-extrabold">Department</th>
                  <th className="px-3 py-2.5 font-extrabold">Type</th>
                  <th className="px-3 py-2.5 font-extrabold">Joined</th>
                  <th className="rounded-r-xl px-3 py-2.5 font-extrabold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7ECF3]">
                {filteredEmployees.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-[#8A94A6]">No employees found.</td></tr>
                )}
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#FAFBFD]">
                    <td className="px-3 py-3">
                      <p className="font-bold text-[#101D38]">{employee.name}</p>
                      <p className="text-[10px] text-[#8A94A6]">{employee.email}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-[#536175]">{employee.employeeNumber}</td>
                    <td className="px-3 py-3 font-bold text-[#101D38]">{employee.designation}</td>
                    <td className="px-3 py-3 text-[#536175]">{employee.departmentName ?? '—'}</td>
                    <td className="px-3 py-3 text-[#536175]">{employee.employeeType.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-3 text-[#536175]">{dateLabel(employee.joiningDate)}</td>
                    <td className="px-3 py-3">{statusBadge(employee.employmentStatus, statusTone[employee.employmentStatus] ?? 'border-slate-200 bg-slate-50 text-slate-600')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'leave' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><CalendarDays className="h-4 w-4 text-[#1754E8]" />Pending leave approvals</h2>
            <div className="mt-4 space-y-2">
              {data.pendingLeaveRequests.length === 0 && <p className="text-sm text-[#8A94A6]">No pending leave approvals.</p>}
              {data.pendingLeaveRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-[#E7ECF3] px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#101D38]">{request.employeeName} · {request.policyName}</p>
                    {statusBadge(request.status, statusTone[request.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                  </div>
                  <p className="mt-1 text-[10px] text-[#8A94A6]">{dateLabel(request.startDate)} → {dateLabel(request.endDate)} · {request.days} days</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/leave/${request.id}`, 'PATCH', { action: 'APPROVE' }, 'Leave approved.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Approve</button>
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/leave/${request.id}`, 'PATCH', { action: 'REJECT' }, 'Leave rejected.', false)} className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><Clock3 className="h-4 w-4 text-[#1754E8]" />Attendance corrections</h2>
            <div className="mt-4 space-y-2">
              {data.pendingCorrections.length === 0 && <p className="text-sm text-[#8A94A6]">No pending attendance corrections.</p>}
              {data.pendingCorrections.map((correction) => (
                <div key={correction.id} className="rounded-xl border border-[#E7ECF3] px-4 py-3">
                  <p className="text-xs font-bold text-[#101D38]">{correction.employeeName}{correction.attendanceDate ? ` · ${dateLabel(correction.attendanceDate)}` : ''}</p>
                  <p className="mt-1 text-[10px] text-[#8A94A6]">{correction.reason}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/attendance/corrections/${correction.id}`, 'PATCH', { decision: 'APPROVE' }, 'Correction approved.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Approve</button>
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/attendance/corrections/${correction.id}`, 'PATCH', { decision: 'REJECT' }, 'Correction rejected.', false)} className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="mt-6 flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><WalletCards className="h-4 w-4 text-[#1754E8]" />Pending reimbursements</h2>
            <div className="mt-3 space-y-2">
              {data.pendingReimbursements.length === 0 && <p className="text-sm text-[#8A94A6]">No pending reimbursements.</p>}
              {data.pendingReimbursements.map((claim) => (
                <div key={claim.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E7ECF3] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-[#101D38]">{claim.employeeName} · {claim.category}</p>
                    <p className="text-[10px] text-[#8A94A6]">{formatMinor(claim.amountMinor, claim.currency)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/reimbursements/${claim.id}`, 'PATCH', { decision: 'APPROVE' }, 'Reimbursement approved.', false)} className="inline-flex min-h-9 items-center rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/reimbursements/${claim.id}`, 'PATCH', { decision: 'REJECT' }, 'Reimbursement rejected.', false)} className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'payroll' && (
        <PayrollSection data={data} busy={busy} act={act} />
      )}

      {tab === 'exits' && (
        <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><ShieldAlert className="h-4 w-4 text-[#1754E8]" />Pending exits</h2>
          <div className="mt-4 space-y-2">
            {data.pendingResignations.length === 0 && <p className="text-sm text-[#8A94A6]">No pending exit requests.</p>}
            {data.pendingResignations.map((resignation) => (
              <div key={resignation.id} className="rounded-xl border border-[#E7ECF3] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#101D38]">{resignation.employeeName} · proposed {dateLabel(resignation.proposedLastWorkingDay)}</p>
                  {statusBadge(resignation.status, statusTone[resignation.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                </div>
                <p className="mt-1 text-[10px] text-[#8A94A6]">{resignation.reason} · notice {resignation.noticePeriodDays} days</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/exit/${resignation.id}`, 'PATCH', { decision: 'APPROVE' }, 'Exit approved. Clearance started.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><ClipboardList className="h-3.5 w-3.5" />Approve & clear</button>
                  <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/exit/${resignation.id}`, 'PATCH', { decision: 'REJECT' }, 'Exit rejected.', false)} className="inline-flex min-h-9 items-center rounded-lg border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Reject</button>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-6 flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><Banknote className="h-4 w-4 text-[#1754E8]" />Full & final settlement</h2>
          <p className="mt-2 text-xs text-[#8A94A6]">After a resignation is approved and cleared, payroll can compute the server-side final settlement (salary prorated to the last working day, leave encashment, recoveries).</p>
        </section>
      )}
    </div>
  );
}

function Overview({
  metrics,
  history,
  setTab,
}: {
  data: WorkforceAdminOverview;
  metrics: WorkforceAdminOverview['metrics'];
  history: WorkforceAdminOverview['recentHistory'];
  setTab: (tab: Tab) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="rounded-2xl border border-[#DCE4EE] bg-white p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#8A94A6]">{metric.label}</p>
            <p className={`mt-2 text-2xl font-extrabold ${metricTone[metric.tone] ?? 'text-[#101D38]'}`}>{metric.value}</p>
            <p className="mt-1 text-[10px] text-[#8A94A6]">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
          <h2 className="text-sm font-extrabold text-[#101D38]">Workforce activity</h2>
          <div className="mt-4 space-y-2">
            {history.length === 0 && <p className="text-sm text-[#8A94A6]">No workforce activity recorded yet.</p>}
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-[#E7ECF3] px-4 py-2.5">
                <div>
                  <p className="text-xs font-bold text-[#101D38]">{entry.employeeName} · {entry.changeType.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-[#8A94A6]">{entry.reason ?? '—'} · {dateLabel(entry.effectiveFrom)}</p>
                </div>
                <p className="text-[10px] text-[#8A94A6]">{new Date(entry.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <button type="button" onClick={() => setTab('payroll')} className="group flex w-full items-center justify-between rounded-2xl border border-[#DCE4EE] bg-white p-5 text-left transition hover:border-[#AFC3DE]">
            <span>
              <p className="text-xs font-extrabold text-[#536175]">Payroll readiness</p>
              <p className="mt-1 text-sm font-extrabold text-[#101D38]">{metrics.find((metric) => metric.id === 'payroll')?.value ?? 0} active payroll period(s)</p>
            </span>
            <ArrowRight className="h-5 w-5 text-[#1754E8] transition group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={() => setTab('exits')} className="group flex w-full items-center justify-between rounded-2xl border border-[#DCE4EE] bg-white p-5 text-left transition hover:border-[#AFC3DE]">
            <span>
              <p className="text-xs font-extrabold text-[#536175]">Exit pipeline</p>
              <p className="mt-1 text-sm font-extrabold text-[#101D38]">{metrics.find((metric) => metric.id === 'resignations')?.value ?? 0} resignation(s) awaiting decision</p>
            </span>
            <ArrowRight className="h-5 w-5 text-[#1754E8] transition group-hover:translate-x-1" />
          </button>
          <button type="button" onClick={() => setTab('leave')} className="group flex w-full items-center justify-between rounded-2xl border border-[#DCE4EE] bg-white p-5 text-left transition hover:border-[#AFC3DE]">
            <span>
              <p className="text-xs font-extrabold text-[#536175]">Leave & corrections queue</p>
              <p className="mt-1 text-sm font-extrabold text-[#101D38]">{metrics.find((metric) => metric.id === 'pending-leave')?.value ?? 0} leave + {metrics.find((metric) => metric.id === 'corrections')?.value ?? 0} corrections</p>
            </span>
            <ArrowRight className="h-5 w-5 text-[#1754E8] transition group-hover:translate-x-1" />
          </button>
        </section>
      </div>
    </div>
  );
}

function PayrollSection({
  data,
  busy,
  act,
}: {
  data: WorkforceAdminOverview;
  busy: string;
  act: (path: string, method: string, body: unknown, successMessage: string, silent?: boolean) => Promise<void>;
}) {
  const [periodKey, setPeriodKey] = useState('');
  const [periodLabel, setPeriodLabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const periods = data.activePayrollPeriods;

  function totals(period: PayrollPeriodView) {
    return period.entries.reduce(
      (acc, entry) => ({ gross: acc.gross + entry.grossMinor, deduction: acc.deduction + entry.totalDeductionMinor, net: acc.net + entry.netMinor }),
      { gross: 0, deduction: 0, net: 0 },
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6 lg:col-span-2">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><FileText className="h-4 w-4 text-[#1754E8]" />Payroll periods</h2>
        <div className="mt-4 space-y-3">
          {periods.length === 0 && <p className="text-sm text-[#8A94A6]">No payroll periods in flight. Create one on the right.</p>}
          {periods.map((period) => {
            const totalsResult = totals(period);
            return (
              <div key={period.id} className="rounded-2xl border border-[#E7ECF3] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-extrabold text-[#101D38]">{period.periodLabel}</p>
                    <p className="text-[10px] text-[#8A94A6]">{period.periodKey} · {dateLabel(period.startDate)} → {dateLabel(period.endDate)} · {period.entries.length} employee(s)</p>
                  </div>
                  {statusBadge(period.status, statusTone[period.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                </div>
                {period.entries.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#F7F9FC] px-3 py-2"><p className="text-[9px] font-bold uppercase text-[#8A94A6]">Gross</p><p className="text-xs font-extrabold text-[#101D38]">{formatMinor(totalsResult.gross, 'INR')}</p></div>
                    <div className="rounded-xl bg-[#F7F9FC] px-3 py-2"><p className="text-[9px] font-bold uppercase text-[#8A94A6]">Deductions</p><p className="text-xs font-extrabold text-[#B4232B]">{formatMinor(totalsResult.deduction, 'INR')}</p></div>
                    <div className="rounded-xl bg-[#F7F9FC] px-3 py-2"><p className="text-[9px] font-bold uppercase text-[#8A94A6]">Net</p><p className="text-xs font-extrabold text-emerald-700">{formatMinor(totalsResult.net, 'INR')}</p></div>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(period.status === 'DRAFT' || period.status === 'REOPENED') && (
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/payroll/${period.id}`, 'POST', { action: 'RUN' }, 'Payroll run completed.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#1754E8] px-3 text-[11px] font-bold text-white hover:bg-[#103FC2] disabled:opacity-50"><UserPlus className="h-3.5 w-3.5" />Run payroll</button>
                  )}
                  {(period.status === 'REVIEW' || period.status === 'APPROVAL_PENDING') && (
                    <>
                      <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/payroll/${period.id}`, 'POST', { action: 'REVIEW', decision: 'APPROVE' }, 'Payroll reviewed.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-amber-600 px-3 text-[11px] font-bold text-white hover:bg-amber-700 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Review (maker)</button>
                      <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/payroll/${period.id}`, 'POST', { action: 'APPROVE' }, 'Payroll approved.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><BadgeCheck className="h-3.5 w-3.5" />Approve (checker)</button>
                    </>
                  )}
                  {period.status === 'APPROVED' && (
                    <button type="button" disabled={busy !== ''} onClick={() => void act(`/api/workforce/payroll/${period.id}`, 'POST', { action: 'DISBURSE', method: 'BANK_TRANSFER' }, 'Disbursement confirmed. Payslips generated.', false)} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"><Banknote className="h-3.5 w-3.5" />Confirm disbursement</button>
                  )}
                </div>
                {period.entries.filter((entry) => entry.status === 'EXCEPTION').length > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-700"><AlertCircle className="h-3 w-3" /> {period.entries.filter((entry) => entry.status === 'EXCEPTION').length} employee exception(s) require review before approval.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
        <h2 className="text-sm font-extrabold text-[#101D38]">Create payroll period</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Period key</span>
            <input value={periodKey} onChange={(event) => setPeriodKey(event.target.value)} placeholder="2026-02" className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Label</span>
            <input value={periodLabel} onChange={(event) => setPeriodLabel(event.target.value)} placeholder="February 2026" className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">From</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">To</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
            </label>
          </div>
          <button
            type="button"
            disabled={busy !== '' || !periodKey || !periodLabel || !startDate || !endDate}
            onClick={() => {
              void act('/api/workforce/payroll', 'POST', { periodKey, periodLabel, cycle: 'MONTHLY', startDate, endDate }, 'Payroll period created.', false);
              setPeriodKey('');
              setPeriodLabel('');
              setStartDate('');
              setEndDate('');
            }}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1754E8] px-4 text-sm font-bold text-white transition hover:bg-[#103FC2] disabled:opacity-50"
          >
            Create period
          </button>
          <p className="text-[10px] leading-4 text-[#8A94A6]">Payroll is computed server-side from compensation snapshots, approved unpaid leave, overtime and adjustments. Re-running a period never duplicates entries.</p>
        </div>
      </section>
    </div>
  );
}
