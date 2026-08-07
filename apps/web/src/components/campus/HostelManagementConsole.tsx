'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  DoorOpen,
  Home,
  RefreshCw,
  ShieldCheck,
  Soup,
  TriangleAlert,
  UsersRound,
  Wrench,
} from 'lucide-react';

import type { HostelWorkspaceData } from '@/lib/hostel-types';

export function HostelManagementConsole({ initialData }: { initialData: HostelWorkspaceData }) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [departureAt, setDepartureAt] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/hostel/workspace', { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    } catch {
      // Keep the last server-verified snapshot visible when a refresh fails.
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const postAction = useCallback(async (payload: Record<string, unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/hostel/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to complete hostel action.');
      setMessage('Saved successfully.');
      await refresh();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to complete hostel action.');
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const isStudent = data.role === 'STUDENT';
  const isParent = data.role === 'PARENT';
  const isWarden = data.role === 'WARDEN';
  const isAdmin = data.role === 'INSTITUTION_ADMIN';
  const isFinance = data.role === 'FINANCE_OFFICER' || data.role === 'ACCOUNTANT';
  const isWelfare = data.role === 'FACULTY' || data.role === 'HOD' || data.role === 'DEAN' || data.role === 'REGISTRAR';

  const outstanding = useMemo(() => data.charges
    .filter((charge) => charge.status !== 'PAID' && charge.status !== 'WAIVED')
    .reduce((sum, charge) => sum + charge.amount, 0), [data.charges]);

  if (!data.settings.storeReady) {
    return <Unavailable title="Hostel operations storage is not ready" detail="The institution database must provision the optional hostel module before hostel records can be used." />;
  }

  if (!data.availability.visible && !isAdmin) {
    const reason = data.availability.reason;
    const copy = reason === 'ONLINE_ONLY'
      ? 'Your verified delivery mode is Online. Hostel accommodation is therefore not required or exposed in your workspace.'
      : reason === 'HYBRID_DISABLED'
        ? 'Hybrid-student hostel access is disabled by this institution.'
        : reason === 'UNCLASSIFIED'
          ? 'Your Online / Offline / Hybrid delivery mode has not yet been classified by the institution.'
          : reason === 'MODULE_DISABLED'
            ? 'This institution has not enabled the Hostel module.'
            : 'Hostel operations are not available for this role.';
    return <Unavailable title="Hostel is not required for this workspace" detail={copy} />;
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[#D9E3F0] bg-white shadow-[0_8px_24px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 border-b border-[#E5EAF1] bg-[#101D38] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1754E8]"><Building2 className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">Hostel Operations</h2>
                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em]">{data.settings.ownershipMode.replace('_', ' ')}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[#BAC9DE]">Room allocation, mess and hostel ledger, outpass governance, provider sync and resident welfare — scoped to the active institution.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white hover:bg-white/15"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
            {isAdmin && <Link href="/hostel/admin" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#101D38]">Hostel Control <ArrowRight className="h-3.5 w-3.5" /></Link>}
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={UsersRound} label={isStudent ? 'Eligibility' : 'Eligible students'} value={isStudent ? (data.student?.eligible ? 'Eligible' : 'Not eligible') : String(data.operations?.totalEligible ?? 0)} />
          <Metric icon={BedDouble} label={isStudent ? 'Residence' : 'Active residents'} value={isStudent ? (data.allocation?.status ?? 'Not allocated') : String(data.operations?.activeResidents ?? 0)} />
          <Metric icon={DoorOpen} label="Pending outpasses" value={String(isStudent ? data.outpasses.filter((item) => item.status === 'PENDING').length : data.operations?.pendingOutpasses ?? 0)} />
          <Metric icon={CreditCard} label={isWelfare ? 'Welfare visibility' : 'Outstanding'} value={isWelfare ? 'Restricted' : money(isStudent || isParent ? outstanding : data.operations?.outstandingAmount ?? 0, data.settings.currency)} />
        </div>
      </section>

      {message && <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${message === 'Saved successfully.' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{message}</div>}

      {(isStudent || isParent) && <ResidentExperience data={data} isParent={isParent} busy={busy} postAction={postAction} />}

      {isStudent && (
        <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2"><DoorOpen className="h-5 w-5 text-[#1754E8]" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Request an outpass</h3></div>
          <p className="mt-1 text-xs text-[#667085]">The server applies the institution’s Parent + Warden approval policy. You cannot approve your own request.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input label="Destination" value={destination} onChange={setDestination} placeholder="Home, family visit, approved event…" />
            <Input label="Reason" value={reason} onChange={setReason} placeholder="Optional context" />
            <Input label="Departure" value={departureAt} onChange={setDepartureAt} type="datetime-local" />
            <Input label="Expected return" value={expectedReturnAt} onChange={setExpectedReturnAt} type="datetime-local" />
          </div>
          <button
            type="button"
            disabled={busy || !destination || !departureAt || !expectedReturnAt}
            onClick={async () => {
              const ok = await postAction({
                action: 'outpass', destination, reason: reason || null,
                departureAt: new Date(departureAt).toISOString(),
                expectedReturnAt: new Date(expectedReturnAt).toISOString(),
              });
              if (ok) { setDestination(''); setReason(''); setDepartureAt(''); setExpectedReturnAt(''); }
            }}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >Submit outpass request</button>
        </section>
      )}

      {(isWarden || isAdmin || isFinance || isWelfare) && data.operations && (
        <OperationsView data={data} busy={busy} postAction={postAction} welfareOnly={isWelfare} canApprove={isWarden || isAdmin} />
      )}
    </div>
  );
}

function ResidentExperience({ data, isParent, busy, postAction }: {
  data: HostelWorkspaceData;
  isParent: boolean;
  busy: boolean;
  postAction: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const allocation = data.allocation ?? data.student?.allocation ?? null;
  const linkedStudents = data.operations?.students ?? (data.student ? [data.student] : []);
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2"><Home className="h-5 w-5 text-[#1754E8]" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Residence</h3></div>
        {isParent && linkedStudents.length > 1 ? (
          <div className="mt-4 space-y-3">{linkedStudents.map((student) => <StudentResidence key={student.studentId} student={student} />)}</div>
        ) : allocation ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Detail label="Facility" value={allocation.facilityName} />
            <Detail label="Ownership" value={allocation.ownership === 'THIRD_PARTY' ? 'Third-party connected' : 'Institution managed'} />
            <Detail label="Building / room" value={[allocation.building, allocation.roomNumber].filter(Boolean).join(' · ') || 'Assigned by operator'} />
            <Detail label="Bed / meal plan" value={[allocation.bedLabel, allocation.mealPlan].filter(Boolean).join(' · ') || 'Not specified'} />
            {allocation.providerName && <Detail label="Provider" value={allocation.providerName} />}
          </div>
        ) : (
          <Empty text="No active hostel allocation is recorded yet. Eligible Offline/Hybrid students can remain visible while the institution completes allocation." />
        )}
      </section>

      <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#1754E8]" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Hostel account</h3></div><p className="mt-1 text-xs text-[#667085]">Hostel, mess, maintenance, deposits and reviewed damage charges are separated.</p></div>
          {data.charges.some((item) => item.source === 'INSTITUTION' && item.status !== 'PAID') && <Link href="/payments" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C8D6EA] px-3 text-xs font-extrabold text-[#1754E8]">Open payment centre <ArrowRight className="h-3.5 w-3.5" /></Link>}
        </div>
        <div className="mt-4 space-y-2">
          {data.charges.length ? data.charges.slice(0, 12).map((charge) => (
            <div key={charge.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E3E8EF] bg-[#FAFBFD] px-3 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-bold text-[#24324A]">{charge.description}</p><p className="mt-1 text-[11px] text-[#7A8799]">{charge.category.replace('_', ' ')} · {charge.source === 'THIRD_PARTY' ? 'Provider synced' : 'Institution ledger'}{charge.dueDate ? ` · Due ${charge.dueDate}` : ''}</p></div>
              <div className="text-right"><p className="text-sm font-extrabold text-[#101D38]">{money(charge.amount, charge.currency)}</p><Status value={charge.status} /></div>
            </div>
          )) : <Empty text="No hostel charges have been recorded." />}
        </div>
      </section>

      <section className="xl:col-span-2 rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#1754E8]" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Outpass history</h3></div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {data.outpasses.length ? data.outpasses.slice(0, 10).map((pass) => (
            <div key={pass.id} className="rounded-xl border border-[#E1E7EF] p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-[#24324A]">{pass.destination}</p><p className="mt-1 text-xs text-[#667085]">{dateTime(pass.departureAt)} → {dateTime(pass.expectedReturnAt)}</p></div><Status value={pass.status} /></div>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold"><Consent label="Parent" value={pass.parentApproval} /><Consent label="Warden" value={pass.wardenApproval} /></div>
              {isParent && pass.status === 'PENDING' && pass.parentApproval === 'PENDING' && (
                <div className="mt-3 flex gap-2">
                  <button disabled={busy} onClick={() => void postAction({ action: 'outpass-decision', outpassId: pass.id, decision: 'APPROVED' })} className="min-h-9 rounded-lg bg-emerald-600 px-3 text-xs font-extrabold text-white disabled:opacity-50">Approve</button>
                  <button disabled={busy} onClick={() => void postAction({ action: 'outpass-decision', outpassId: pass.id, decision: 'REJECTED' })} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-extrabold text-rose-700 disabled:opacity-50">Reject</button>
                </div>
              )}
            </div>
          )) : <Empty text="No outpass request has been submitted." />}
        </div>
      </section>
    </div>
  );
}

function OperationsView({ data, busy, postAction, welfareOnly, canApprove }: {
  data: HostelWorkspaceData;
  busy: boolean;
  welfareOnly: boolean;
  canApprove: boolean;
  postAction: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [studentId, setStudentId] = useState('');
  const [incidentTitle, setIncidentTitle] = useState('');
  const [incidentKind, setIncidentKind] = useState<'DAMAGE' | 'DISCIPLINE' | 'SAFETY' | 'MAINTENANCE'>('MAINTENANCE');
  const [proposedCharge, setProposedCharge] = useState('');
  const students = data.operations?.students ?? [];
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><h3 className="font-extrabold text-[#101D38] dark:text-white">{welfareOnly ? 'Student hostel welfare view' : 'Resident operations'}</h3><p className="mt-1 text-xs text-[#667085]">{welfareOnly ? 'Academic staff receive residence and leave-state context only. Financial, room/bed and incident details are intentionally withheld.' : 'Verified institution roster with delivery mode, allocation and operational attention.'}</p></div>
          <span className="text-xs font-bold text-[#667085]">{students.length} visible students</span>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[#E1E7EF]">
          <table className="min-w-[860px] w-full text-left text-xs">
            <thead className="bg-[#F5F7FA] text-[10px] uppercase tracking-[0.08em] text-[#667085]"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Mode</th><th className="px-3 py-3">Residence</th><th className="px-3 py-3">Facility</th><th className="px-3 py-3">Leave state</th>{!welfareOnly && <th className="px-3 py-3 text-right">Balance</th>}</tr></thead>
            <tbody className="divide-y divide-[#EDF0F4]">{students.map((student) => (
              <tr key={student.studentId} className="bg-white"><td className="px-3 py-3"><p className="font-bold text-[#24324A]">{student.studentName}</p><p className="mt-0.5 text-[10px] text-[#8792A2]">{student.rollNumber}</p></td><td className="px-3 py-3"><Status value={student.studyMode} /></td><td className="px-3 py-3">{student.enrolled ? 'Enrolled' : student.eligible ? 'Eligible · unallocated' : 'Not required'}</td><td className="px-3 py-3">{student.allocation?.facilityName ?? '—'}</td><td className="px-3 py-3">{student.currentOutpassStatus ?? 'On campus / no request'}</td>{!welfareOnly && <td className="px-3 py-3 text-right font-bold">{money(student.balanceDue, data.settings.currency)}</td>}</tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {canApprove && (
        <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#1754E8]" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Warden approval queue</h3></div>
          <div className="mt-4 space-y-3">{data.outpasses.filter((item) => item.status === 'PENDING').length ? data.outpasses.filter((item) => item.status === 'PENDING').map((pass) => (
            <div key={pass.id} className="flex flex-col gap-3 rounded-xl border border-[#E1E7EF] p-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-extrabold text-[#24324A]">{pass.destination}</p><p className="mt-1 text-xs text-[#667085]">{dateTime(pass.departureAt)} → {dateTime(pass.expectedReturnAt)}</p><div className="mt-2 flex gap-2"><Consent label="Parent" value={pass.parentApproval} /><Consent label="Warden" value={pass.wardenApproval} /></div></div>{pass.wardenApproval === 'PENDING' && <div className="flex gap-2"><button disabled={busy} onClick={() => void postAction({ action: 'outpass-decision', outpassId: pass.id, decision: 'APPROVED' })} className="min-h-9 rounded-lg bg-[#1754E8] px-3 text-xs font-extrabold text-white disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => void postAction({ action: 'outpass-decision', outpassId: pass.id, decision: 'REJECTED' })} className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-extrabold text-rose-700 disabled:opacity-50">Reject</button></div>}</div>
          )) : <Empty text="No outpass currently requires warden action." />}</div>
        </section>
      )}

      {canApprove && !welfareOnly && (
        <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2"><TriangleAlert className="h-5 w-5 text-amber-600" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Resident incident / damage review intake</h3></div>
          <p className="mt-1 text-xs text-[#667085]">A proposed damage amount is a review record only. It does not become a payable charge automatically.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <label className="space-y-1"><span className="text-[11px] font-bold text-[#667085]">Student</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm"><option value="">Facility-level / no student</option>{students.map((student) => <option key={student.studentId} value={student.studentId}>{student.studentName} · {student.rollNumber}</option>)}</select></label>
            <label className="space-y-1"><span className="text-[11px] font-bold text-[#667085]">Type</span><select value={incidentKind} onChange={(event) => setIncidentKind(event.target.value as typeof incidentKind)} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm"><option>DAMAGE</option><option>DISCIPLINE</option><option>SAFETY</option><option>MAINTENANCE</option></select></label>
            <Input label="Title" value={incidentTitle} onChange={setIncidentTitle} placeholder="Broken fixture, safety concern…" />
            <Input label="Proposed amount" value={proposedCharge} onChange={setProposedCharge} type="number" placeholder="Optional" />
          </div>
          <button disabled={busy || !incidentTitle} onClick={async () => { const ok = await postAction({ action: 'incident', studentId: studentId || null, kind: incidentKind, title: incidentTitle, proposedChargeAmount: proposedCharge ? Number(proposedCharge) : null }); if (ok) { setIncidentTitle(''); setProposedCharge(''); } }} className="mt-4 min-h-10 rounded-xl bg-[#101D38] px-4 text-xs font-extrabold text-white disabled:opacity-50">Record for review</button>
        </section>
      )}
    </div>
  );
}

function StudentResidence({ student }: { student: NonNullable<HostelWorkspaceData['operations']>['students'][number] }) {
  return <div className="rounded-xl border border-[#E1E7EF] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-extrabold text-[#24324A]">{student.studentName}</p><p className="text-[11px] text-[#7A8799]">{student.rollNumber} · {student.studyMode}</p></div><Status value={student.enrolled ? 'ENROLLED' : student.eligible ? 'ELIGIBLE' : 'NOT REQUIRED'} /></div><p className="mt-2 text-xs text-[#667085]">{student.allocation ? `${student.allocation.facilityName}${student.allocation.roomNumber ? ` · Room ${student.allocation.roomNumber}` : ''}` : 'No active allocation'}</p></div>;
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return <div className="rounded-xl border border-[#E1E7EF] bg-[#FAFBFD] p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7A8799]">{label}</p><Icon className="h-4 w-4 text-[#1754E8]" /></div><p className="mt-3 text-xl font-extrabold text-[#101D38] dark:text-white">{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#E3E8EF] bg-[#FAFBFD] p-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8792A2]">{label}</p><p className="mt-1 text-sm font-bold text-[#24324A]">{value}</p></div>;
}

function Input({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-1"><span className="text-[11px] font-bold text-[#667085]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm text-[#24324A] outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/10" /></label>;
}

function Consent({ label, value }: { label: string; value: string }) {
  return <span className={`rounded-full px-2 py-1 ${value === 'APPROVED' || value === 'NOT_REQUIRED' ? 'bg-emerald-50 text-emerald-700' : value === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{label}: {value.replace('_', ' ')}</span>;
}

function Status({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const positive = ['ACTIVE','APPROVED','PAID','OFFLINE','ELIGIBLE','ENROLLED','RETURNED'].includes(normalized);
  const warning = ['PENDING','PARTIAL','HYBRID','RESERVED','UNDER_REVIEW','UNCLASSIFIED'].includes(normalized);
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${positive ? 'bg-emerald-50 text-emerald-700' : warning ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{value.replaceAll('_', ' ')}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[#D5DEEA] bg-[#FAFBFD] p-4 text-sm text-[#667085]">{text}</div>;
}

function Unavailable({ title, detail }: { title: string; detail: string }) {
  return <section className="rounded-2xl border border-[#D9E3F0] bg-white p-6 shadow-[0_8px_24px_rgba(16,29,56,0.05)]"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F2F5FA] text-[#667085]"><AlertTriangle className="h-5 w-5" /></span><div><h2 className="text-lg font-extrabold text-[#101D38]">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085]">{detail}</p><Link href="/helpdesk" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D0D9E6] px-3 text-xs font-extrabold text-[#1754E8]">Contact institution helpdesk <ArrowRight className="h-3.5 w-3.5" /></Link></div></div></section>;
}

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
}
