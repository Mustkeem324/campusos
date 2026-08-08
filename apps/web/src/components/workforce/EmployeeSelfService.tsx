'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  RefreshCcw,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';

import { formatMinor } from '@/lib/finance-money';
import type { EmployeeSelfServiceWorkspace } from '@/lib/workforce-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function dateLabel(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00Z`));
}

function timeLabel(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function NoticeBox({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  const tone = notice.tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : notice.tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-blue-200 bg-blue-50 text-blue-800';
  return <div role="status" className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${tone}`}><span>{notice.text}</span><button type="button" onClick={onClose} className="rounded-lg p-1" aria-label="Dismiss message"><XIcon /></button></div>;
}

function XIcon() {
  return <span aria-hidden="true" className="text-current">✕</span>;
}

function statusBadge(label: string, tone: string) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${tone}`}>{label.replace(/_/g, ' ')}</span>;
}

const attendanceTone: Record<string, string> = {
  PRESENT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  LATE: 'border-amber-200 bg-amber-50 text-amber-700',
  ABSENT: 'border-rose-200 bg-rose-50 text-rose-700',
  HALF_DAY: 'border-amber-200 bg-amber-50 text-amber-700',
  ON_LEAVE: 'border-blue-200 bg-blue-50 text-blue-700',
  HOLIDAY: 'border-slate-200 bg-slate-50 text-slate-600',
  WEEK_OFF: 'border-slate-200 bg-slate-50 text-slate-600',
  OFFICIAL_DUTY: 'border-violet-200 bg-violet-50 text-violet-700',
  WORK_FROM_HOME: 'border-cyan-200 bg-cyan-50 text-cyan-700',
};

const leaveStatusTone: Record<string, string> = {
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-700',
  SUBMITTED: 'border-blue-200 bg-blue-50 text-blue-700',
  MANAGER_APPROVAL: 'border-amber-200 bg-amber-50 text-amber-700',
  HR_REVIEW: 'border-amber-200 bg-amber-50 text-amber-700',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
  WITHDRAWN: 'border-slate-200 bg-slate-50 text-slate-500',
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
};

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

export function EmployeeSelfService() {
  const [data, setData] = useState<EmployeeSelfServiceWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [action, setAction] = useState('');
  const [tab, setTab] = useState<'today' | 'leave' | 'payslips' | 'reimbursements' | 'profile'>('today');
  const [leavePolicyId, setLeavePolicyId] = useState('');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [claimCategory, setClaimCategory] = useState('');
  const [claimAmount, setClaimAmount] = useState('');
  const [claimReason, setClaimReason] = useState('');

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setFatalError('');
    try {
      const response = await fetch('/api/workforce/portal', { cache: 'no-store' });
      const payload = await json<EmployeeSelfServiceWorkspace & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load the workforce workspace.');
      if (!('profile' in payload)) throw new Error('This workspace requires an employee account.');
      setData(payload);
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : 'Unable to load the workforce workspace.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function post(path: string, body: unknown, successMessage: string) {
    setAction(path);
    setNotice(null);
    try {
      const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Request failed.');
      setNotice({ tone: 'success', text: successMessage });
      await reload(true);
    } catch (error) {
      setNotice({ tone: 'error', text: error instanceof Error ? error.message : 'Request failed.' });
    } finally {
      setAction('');
    }
  }

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={fatalError || 'Workforce workspace unavailable.'} retry={() => void reload()} />;

  const { profile, settings, todayAttendance, recentAttendance, leaveBalances, myLeaveRequests, myPayslips, myReimbursements, myResignation, onboardingTasks, shifts } = data;

  const tabs: Array<[typeof tab, string]> = [
    ['today', 'Today'],
    ['leave', 'Leave'],
    ['payslips', 'Payslips'],
    ['reimbursements', 'Expenses'],
    ['profile', 'Profile'],
  ];

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-16">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-[#D8E2EF] bg-white shadow-[0_18px_50px_rgba(16,29,56,0.07)]">
        <div className="grid lg:grid-cols-[1.4fr_0.6fr]">
          <div className="p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Employee self-service
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#101D38] sm:text-3xl">
              {profile ? `Welcome, ${profile.name.split(' ')[0]}` : 'Workforce workspace'}
            </h1>
            {profile && (
              <p className="mt-2 text-sm text-[#5F6B7A]">
                {profile.designation} · {profile.employeeNumber} · {profile.employmentStatus.replace(/_/g, ' ')}
              </p>
            )}
            {!profile && (
              <p className="mt-2 text-sm text-[#5F6B7A]">
                No workforce profile is linked to this account yet.
              </p>
            )}
          </div>
          {profile && (
            <div className="flex flex-col justify-center gap-2 border-t border-[#D8E2EF] bg-[#F7F9FC] p-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between rounded-xl border border-[#DCE4EE] bg-white px-4 py-3">
                <span className="text-xs font-extrabold text-[#536175]">Today&apos;s attendance</span>
                {todayAttendance ? (
                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${attendanceTone[todayAttendance.status] ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}>{todayAttendance.status}</span>
                ) : (
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-extrabold uppercase text-slate-500">Not started</span>
                )}
              </div>
              <div className="flex gap-2">
                {!todayAttendance?.checkIn && (
                  <button
                    type="button"
                    disabled={action !== ''}
                    onClick={() => void post('/api/workforce/attendance', { action: 'CHECK_IN' }, 'Checked in successfully.')}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-bold text-white transition hover:bg-[#103FC2] disabled:opacity-50"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" />Check in
                  </button>
                )}
                {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                  <button
                    type="button"
                    disabled={action !== ''}
                    onClick={() => void post('/api/workforce/attendance', { action: 'CHECK_OUT' }, 'Checked out successfully.')}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E9F6E] px-4 text-sm font-bold text-white transition hover:bg-[#0B7E57] disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />Check out
                  </button>
                )}
                {todayAttendance?.checkOut && (
                  <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-extrabold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />Day complete
                  </div>
                )}
              </div>
              <p className="text-[10px] text-[#8A94A6]">Staff attendance is separate from student academic attendance.</p>
            </div>
          )}
        </div>
      </section>

      {notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}
      {fatalError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{fatalError}</div>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-extrabold ${tab === id ? 'bg-[#1754E8] text-white' : 'bg-[#F7F9FC] text-[#607086]'}`}>{label}</button>
        ))}
      </div>

      {tab === 'today' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><Clock3 className="h-4 w-4 text-[#1754E8]" />Recent attendance</h2>
            <div className="mt-4 space-y-2">
              {recentAttendance.length === 0 && <p className="text-sm text-[#8A94A6]">No staff attendance records yet.</p>}
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between rounded-xl border border-[#E7ECF3] px-3 py-2.5">
                  <div>
                    <p className="text-xs font-bold text-[#101D38]">{dateLabel(record.attendanceDate)}</p>
                    <p className="text-[10px] text-[#8A94A6]">{timeLabel(record.checkIn)} → {timeLabel(record.checkOut)}{record.workMinutes ? ` · ${Math.floor(record.workMinutes / 60)}h ${record.workMinutes % 60}m` : ''}</p>
                  </div>
                  {statusBadge(record.status, attendanceTone[record.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><CalendarDays className="h-4 w-4 text-[#1754E8]" />Onboarding & tasks</h2>
            <div className="mt-4 space-y-2">
              {onboardingTasks.length === 0 && <p className="text-sm text-[#8A94A6]">No pending onboarding tasks.</p>}
              {onboardingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-xl border border-[#E7ECF3] px-3 py-2.5">
                  <p className="text-xs font-bold text-[#101D38]">{task.item}</p>
                  {statusBadge(task.status, task.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}
                </div>
              ))}
            </div>
            <h2 className="mt-6 flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><ShieldAlert className="h-4 w-4 text-[#1754E8]" />Exit</h2>
            <div className="mt-3">
              {myResignation ? (
                <div className="rounded-xl border border-[#E7ECF3] px-3 py-2.5 text-xs text-[#5F6B7A]">
                  Resignation {statusBadge(myResignation.status, leaveStatusTone[myResignation.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                  <p className="mt-1 text-[10px]">Proposed last day: {dateLabel(myResignation.proposedLastWorkingDay)}</p>
                </div>
              ) : (
                <button type="button" onClick={() => setTab('profile')} className="inline-flex items-center gap-1 text-xs font-bold text-[#1754E8] hover:underline">Start a resignation request <ArrowRight className="h-3 w-3" /></button>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><WalletCards className="h-4 w-4 text-[#1754E8]" />Leave balance</h2>
            <div className="mt-4 space-y-2">
              {leaveBalances.length === 0 && <p className="text-sm text-[#8A94A6]">No leave policies configured yet.</p>}
              {leaveBalances.map((balance) => (
                <div key={balance.policyId} className="rounded-xl border border-[#E7ECF3] px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#101D38]">{balance.name}</p>
                    <p className="text-sm font-extrabold text-[#1754E8]">{balance.closing} days</p>
                  </div>
                  <p className="text-[10px] text-[#8A94A6]">Used {balance.used} · Earned {balance.earned} · Closing {balance.closing}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'leave' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="text-sm font-extrabold text-[#101D38]">Request leave</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Leave type</span>
                <select value={leavePolicyId} onChange={(event) => setLeavePolicyId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]">
                  <option value="">Select policy…</option>
                  {leaveBalances.map((balance) => (
                    <option key={balance.policyId} value={balance.policyId}>{balance.name} ({balance.closing} available)</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">From</span>
                  <input type="date" value={leaveStart} onChange={(event) => setLeaveStart(event.target.value)} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">To</span>
                  <input type="date" value={leaveEnd} onChange={(event) => setLeaveEnd(event.target.value)} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
                </label>
              </div>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Reason</span>
                <textarea value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
              </label>
              <button
                type="button"
                disabled={action !== '' || !leavePolicyId || !leaveStart || !leaveEnd || !leaveReason.trim()}
                onClick={() => {
                  void post('/api/workforce/leave', { policyId: leavePolicyId, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason }, 'Leave request submitted.');
                  setLeaveReason('');
                }}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1754E8] px-4 text-sm font-bold text-white transition hover:bg-[#103FC2] disabled:opacity-50"
              >
                Submit leave request
              </button>
              <p className="text-[10px] text-[#8A94A6]">Faculty leave is checked against the published timetable for substitution planning.</p>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="text-sm font-extrabold text-[#101D38]">My leave requests</h2>
            <div className="mt-4 space-y-2">
              {myLeaveRequests.length === 0 && <p className="text-sm text-[#8A94A6]">No leave requests yet.</p>}
              {myLeaveRequests.map((request) => (
                <div key={request.id} className="rounded-xl border border-[#E7ECF3] px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#101D38]">{request.policyName} · {dateLabel(request.startDate)} → {dateLabel(request.endDate)} ({request.days} days)</p>
                    {statusBadge(request.status, leaveStatusTone[request.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                  </div>
                  <p className="mt-1 text-[10px] text-[#8A94A6]">{request.reason}</p>
                  {request.timetableConflicts.length > 0 && (
                    <p className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-700"><AlertCircle className="h-3 w-3" /> Conflicts with scheduled classes: {request.timetableConflicts.length}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'payslips' && (
        <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]"><FileText className="h-4 w-4 text-[#1754E8]" />My payslips</h2>
          <div className="mt-4 space-y-2">
            {myPayslips.length === 0 && <p className="text-sm text-[#8A94A6]">No payslips available yet. Payslips are issued only after a payroll disbursement is confirmed.</p>}
            {myPayslips.map((payslip) => (
              <div key={payslip.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7ECF3] px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-[#101D38]">{payslip.periodLabel} · {payslip.payslipNumber}</p>
                  <p className="text-[10px] text-[#8A94A6]">{dateLabel(payslip.periodStart)} → {dateLabel(payslip.periodEnd)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-[#101D38]">{formatMinor(payslip.netMinor, payslip.currency)}</p>
                  <p className="text-[10px] text-[#8A94A6]">Gross {formatMinor(payslip.grossMinor, payslip.currency)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'reimbursements' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="text-sm font-extrabold text-[#101D38]">Submit reimbursement</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Category</span>
                <input value={claimCategory} onChange={(event) => setClaimCategory(event.target.value)} placeholder="Travel, conference, office purchase…" className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Amount (₹)</span>
                <input type="number" min="1" value={claimAmount} onChange={(event) => setClaimAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#536175]">Reason</span>
                <textarea value={claimReason} onChange={(event) => setClaimReason(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
              </label>
              <button
                type="button"
                disabled={action !== '' || !claimCategory || !claimAmount || !claimReason.trim()}
                onClick={() => {
                  const minor = Math.round(Number(claimAmount) * 100);
                  if (Number.isFinite(minor) && minor > 0) {
                    void post('/api/workforce/reimbursements', { category: claimCategory, amountMinor: minor, reason: claimReason }, 'Reimbursement claim submitted.');
                    setClaimCategory('');
                    setClaimAmount('');
                    setClaimReason('');
                  }
                }}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1754E8] px-4 text-sm font-bold text-white transition hover:bg-[#103FC2] disabled:opacity-50"
              >
                Submit claim
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="text-sm font-extrabold text-[#101D38]">My claims</h2>
            <div className="mt-4 space-y-2">
              {myReimbursements.length === 0 && <p className="text-sm text-[#8A94A6]">No reimbursement claims yet.</p>}
              {myReimbursements.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between rounded-xl border border-[#E7ECF3] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-[#101D38]">{claim.category}</p>
                    <p className="text-[10px] text-[#8A94A6]">{claim.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-[#101D38]">{formatMinor(claim.amountMinor, claim.currency)}</p>
                    {statusBadge(claim.status, leaveStatusTone[claim.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="text-sm font-extrabold text-[#101D38]">Employment profile</h2>
            {profile ? (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Employee number', profile.employeeNumber],
                  ['Designation', profile.designation],
                  ['Department', profile.departmentName ?? '—'],
                  ['Employment type', profile.employmentType.replace(/_/g, ' ')],
                  ['Employee type', profile.employeeType.replace(/_/g, ' ')],
                  ['Work mode', profile.workMode],
                  ['Joining date', dateLabel(profile.joiningDate)],
                  ['Contract end', dateLabel(profile.contractEnd)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-[#F7F9FC] px-3 py-2.5">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#8A94A6]">{label}</dt>
                    <dd className="mt-0.5 text-xs font-bold text-[#101D38]">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-4 text-sm text-[#8A94A6]">No employment profile linked to this account.</p>
            )}
          </section>

          <section className="rounded-3xl border border-[#DCE4EE] bg-white p-6">
            <h2 className="text-sm font-extrabold text-[#101D38]">Resignation & exit</h2>
            {myResignation ? (
              <div className="mt-4 rounded-xl border border-[#E7ECF3] px-4 py-3">
                <p className="text-xs font-bold text-[#101D38]">Resignation {statusBadge(myResignation.status, leaveStatusTone[myResignation.status] ?? 'border-slate-200 bg-slate-50 text-slate-600')}</p>
                <p className="mt-1 text-[10px] text-[#8A94A6]">Submitted {dateLabel(myResignation.submissionDate)} · Proposed last working day {dateLabel(myResignation.proposedLastWorkingDay)}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-[#5F6B7A]">Submit a resignation request. HR will review the notice period and start the exit clearance workflow.</p>
                <input type="date" aria-label="Proposed last working day" className="w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
                <textarea placeholder="Reason for leaving" rows={2} aria-label="Resignation reason" className="w-full rounded-xl border border-[#C9D5E4] px-3 py-2.5 text-sm outline-none focus:border-[#1754E8]" />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
