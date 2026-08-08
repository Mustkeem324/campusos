'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Landmark,
  Loader2,
  Plus,
  ReceiptIndianRupee,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  WalletCards,
  X,
} from 'lucide-react';

import { formatMinor, toMinor } from '@/lib/finance-money';
import type {
  AdminFinanceOverview,
  FinanceSettings,
} from '@/lib/finance-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function money(minor: number, currency: string) {
  return formatMinor(minor, currency);
}

function NoticeBox({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  const tone = notice.tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : notice.tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-blue-200 bg-blue-50 text-blue-800';
  return <div role="status" className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${tone}`}><span>{notice.text}</span><button type="button" onClick={onClose} className="rounded-lg p-1" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>;
}

type Tab = 'overview' | 'structures' | 'refunds' | 'scholarships' | 'holds' | 'settings';

export function FinanceAdminConsole() {
  const [data, setData] = useState<AdminFinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<Tab>('overview');

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setFatalError('');
    try {
      const response = await fetch('/api/finance/portal', { cache: 'no-store' });
      const payload = await json<AdminFinanceOverview & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load the finance control center.');
      if (!('summary' in payload) || !('feeStructures' in payload)) {
        throw new Error('This control center requires a finance operator account.');
      }
      setData(payload);
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : 'Unable to load the finance control center.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={fatalError || 'Finance control center unavailable.'} retry={() => void reload()} />;

  const currency = data.currency;
  const tabs: Array<[Tab, string]> = [
    ['overview', 'Overview'],
    ['structures', 'Fee structures'],
    ['refunds', `Refunds${data.pendingRefunds.length ? ` (${data.pendingRefunds.length})` : ''}`],
    ['scholarships', 'Scholarships'],
    ['holds', `Holds${data.activeHolds.length ? ` (${data.activeHolds.length})` : ''}`],
    ['settings', 'Policy settings'],
  ];

  return <div className="mx-auto w-full max-w-[1560px] space-y-6 pb-16">
    <section className="overflow-hidden rounded-[26px] border border-[#D8E3F0] bg-white shadow-[0_16px_50px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D6E0EC] bg-[#F6F8FB] px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]"><Landmark className="h-3.5 w-3.5" />Institution finance control center</div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.03em] text-[#101D38] dark:text-white sm:text-[38px]">Billing, collections, scholarships & exceptions</h1>
          <p className="mt-3 max-w-[860px] text-sm leading-7 text-[#66758A] dark:text-slate-400">{data.institution?.name ?? 'Institution'} · active role {data.role.replace(/_/g, ' ')}. Every figure is derived from authoritative tenant-scoped financial records.</p>
        </div>
        <button type="button" onClick={() => void reload(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D6DFEB] px-4 text-xs font-extrabold text-[#536175]"><RefreshCcw className="h-4 w-4" />Refresh</button>
      </div>
    </section>
    {notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}
    {fatalError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{fatalError}</div>}

    <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap gap-2 border-b border-[#E3E9F1] p-4 dark:border-slate-800">
        {tabs.map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex min-h-10 items-center rounded-xl px-4 text-xs font-extrabold ${tab === id ? 'bg-[#1754E8] text-white' : 'bg-[#F7F9FC] text-[#607086]'}`}>{label}</button>)}
      </div>
      <div className="p-5 sm:p-6">
        {tab === 'overview' && <Overview data={data} currency={currency} setTab={setTab} />}
        {tab === 'structures' && <Structures data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />}
        {tab === 'refunds' && <Refunds data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />}
        {tab === 'scholarships' && <Scholarships data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />}
        {tab === 'holds' && <Holds data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />}
        {tab === 'settings' && <Settings data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />}
      </div>
    </section>
  </div>;
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'positive' | 'warning' | 'danger' }) {
  const valueTone = tone === 'positive' ? 'text-emerald-600' : tone === 'warning' ? 'text-amber-600' : tone === 'danger' ? 'text-rose-600' : 'text-[#101D38] dark:text-white';
  return <article className="rounded-[22px] border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_26px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7D899B]">{label}</p><p className={`mt-2 text-2xl font-extrabold ${valueTone}`}>{value}</p><p className="mt-3 text-[11px] text-[#8793A4]">{detail}</p></article>;
}

function Overview({ data, currency, setTab }: { data: AdminFinanceOverview; currency: string; setTab: (tab: Tab) => void }) {
  const summary = data.summary;
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total billed" value={money(summary.billedMinor, currency)} detail={`${data.feeStructures.length} active fee structure(s)`} />
      <Metric label="Total collected" value={money(summary.collectedMinor, currency)} detail="Confirmed payments across all methods" tone="positive" />
      <Metric label="Outstanding" value={money(summary.outstandingMinor, currency)} detail={`${summary.partiallyPaidInvoiceCount} partially paid invoice(s)`} tone="warning" />
      <Metric label="Overdue" value={money(summary.overdueMinor, currency)} detail="Past due date and unpaid" tone={summary.overdueMinor > 0 ? 'danger' : undefined} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Collected today" value={money(summary.collectedTodayMinor, currency)} detail="Institution timezone day" tone="positive" />
      <Metric label="Collected this month" value={money(summary.collectedThisMonthMinor, currency)} detail="Calendar month to date" tone="positive" />
      <Metric label="Pending refunds" value={String(summary.pendingRefundCount)} detail="Awaiting finance decision" tone={summary.pendingRefundCount > 0 ? 'warning' : undefined} />
      <Metric label="Active holds" value={String(summary.activeHoldCount)} detail="Students under financial hold" tone={summary.activeHoldCount > 0 ? 'danger' : undefined} />
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric label="Scholarship commitments" value={money(summary.scholarshipCommittedMinor, currency)} detail="Awarded ledger credits" tone="positive" />
      <Metric label="Unreconciled transfers" value={String(summary.unreconciledManualCount)} detail="Manual transfers pending review" tone={summary.unreconciledManualCount > 0 ? 'warning' : undefined} />
      <Metric label="Failed attempts" value={String(summary.failedAttemptCount)} detail="Failed gateway attempts" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <button type="button" onClick={() => setTab('structures')} className="group flex items-center justify-between rounded-2xl border border-[#DCE4EE] p-5 text-left transition hover:border-[#AFC3DE]"><span><p className="text-xs font-extrabold text-[#536175]">Generate invoices</p><p className="mt-1 text-sm font-extrabold text-[#101D38]">Fee structure engine</p></span><ArrowRight className="h-5 w-5 text-[#1754E8] transition group-hover:translate-x-1" /></button>
      <button type="button" onClick={() => setTab('refunds')} className="group flex items-center justify-between rounded-2xl border border-[#DCE4EE] p-5 text-left transition hover:border-[#AFC3DE]"><span><p className="text-xs font-extrabold text-[#536175]">Review exceptions</p><p className="mt-1 text-sm font-extrabold text-[#101D38]">Refunds awaiting decision</p></span><ArrowRight className="h-5 w-5 text-[#1754E8] transition group-hover:translate-x-1" /></button>
    </div>
  </div>;
}

function Structures({ data, currency, notice, reload }: { data: AdminFinanceOverview; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<{ candidateCount: number; grossMinor: number; netMinor: number; existingInvoiceCount: number } | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', amount: '', effectiveFrom: new Date().toISOString().slice(0, 10), categoryCode: 'TUITION', recurring: false, installmentEligibility: false, maxInstallments: 3 });

  async function submitStructure(event: React.FormEvent) {
    event.preventDefault(); setBusy('CREATE'); setError('');
    const amountMinor = toMinor(form.amount);
    try {
      const response = await fetch('/api/finance/fee-structures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, categoryCode: form.categoryCode, amountMinor, effectiveFrom: form.effectiveFrom, recurring: form.recurring, installmentEligibility: form.installmentEligibility, maxInstallments: form.maxInstallments }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to create fee structure.');
      notice({ tone: 'success', text: `Fee structure "${form.name}" created.` });
      setShowForm(false); setForm({ name: '', amount: '', effectiveFrom: new Date().toISOString().slice(0, 10), categoryCode: 'TUITION', recurring: false, installmentEligibility: false, maxInstallments: 3 });
      await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to create fee structure.'); } finally { setBusy(''); }
  }

  async function runGenerate(structureId: string, commit: boolean) {
    setBusy(`${structureId}:${commit ? 'C' : 'P'}`); setError('');
    try {
      const response = await fetch('/api/finance/invoices/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ structureId, commit }) });
      const payload = await json<{ preview?: typeof preview; generated?: number; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to generate invoices.');
      if (payload.preview) {
        setPreview(payload.preview);
        return;
      }
      notice({ tone: 'success', text: `Generated ${payload.generated} invoice(s) for the selected fee structure.` });
      setPreview(null);
      await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to generate invoices.'); } finally { setBusy(''); }
  }

  return <div className="space-y-5">
    <div className="flex items-center justify-between"><div><h2 className="text-base font-extrabold text-[#101D38] dark:text-white">Fee structure engine</h2><p className="mt-1 text-xs text-[#7A8798]">Versioned structures; generated invoices never mutate historical records.</p></div>
      <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white"><Plus className="h-4 w-4" />New structure</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
    {showForm && <form onSubmit={submitStructure} className="grid gap-3 rounded-2xl border border-[#DCE4EE] bg-[#FAFBFD] p-5 sm:grid-cols-2 lg:grid-cols-4">
      <label><span className="text-xs font-bold">Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Semester 2 Tuition" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Amount</span><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Category</span><select value={form.categoryCode} onChange={(event) => setForm({ ...form, categoryCode: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm"><option value="TUITION">Tuition</option><option value="ADMISSION">Admission</option><option value="REGISTRATION">Registration</option><option value="EXAMINATION">Examination</option><option value="HOSTEL">Hostel</option><option value="MESS">Mess</option><option value="TRANSPORT">Transport</option><option value="LIBRARY">Library</option><option value="LABORATORY">Laboratory</option><option value="OTHER">Other</option></select></label>
      <label><span className="text-xs font-bold">Effective from</span><input required type="date" value={form.effectiveFrom} onChange={(event) => setForm({ ...form, effectiveFrom: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.recurring} onChange={(event) => setForm({ ...form, recurring: event.target.checked })} className="h-4 w-4" />Recurring</label>
      <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={form.installmentEligibility} onChange={(event) => setForm({ ...form, installmentEligibility: event.target.checked })} className="h-4 w-4" />Allow instalments</label>
      {form.installmentEligibility && <label><span className="text-xs font-bold">Max instalments</span><input type="number" min="2" max="12" value={form.maxInstallments} onChange={(event) => setForm({ ...form, maxInstallments: Number(event.target.value) })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>}
      <button type="submit" disabled={busy === 'CREATE'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-extrabold text-white">{busy === 'CREATE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Create</button>
    </form>}
    <div className="space-y-3">
      {data.feeStructures.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-10 text-center"><WalletCards className="mx-auto h-8 w-8 text-[#9AA7B8]" /><p className="mt-3 text-sm font-bold text-[#536175]">No fee structures configured yet.</p></div>
        : data.feeStructures.map((structure) => (
          <article key={structure.id} className="rounded-2xl border border-[#DCE4EE] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold text-[#101D38] dark:text-white">{structure.name}</h3><span className="rounded-full border border-[#D6E0EC] bg-[#F6F8FB] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#5B6B82]">v{structure.version}</span><span className="rounded-full border border-[#D6E0EC] bg-[#F6F8FB] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#5B6B82]">{structure.categoryCode || 'FEE'}</span>{structure.studyModes.map((mode) => <span key={mode} className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold uppercase text-blue-700">{mode}</span>)}</div><p className="mt-1 text-xs text-[#66758A]">Effective {structure.effectiveFrom}{structure.effectiveUntil ? ` – ${structure.effectiveUntil}` : ''} · {structure.maxInstallments > 1 ? `${structure.maxInstallments} instalments` : 'one-time'}</p></div>
              <div className="flex items-center gap-3"><span className="text-lg font-extrabold text-[#101D38] dark:text-white">{money(structure.amountMinor, structure.currency || currency)}</span>
                <button type="button" disabled={busy === `${structure.id}:P`} onClick={() => void runGenerate(structure.id, false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C8D5E5] px-3 text-xs font-extrabold">{busy === `${structure.id}:P` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}Preview</button>
                {preview && <button type="button" onClick={() => void runGenerate(structure.id, true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-3 text-xs font-extrabold text-white">Confirm {preview.candidateCount}</button>}
              </div>
            </div>
            {preview && <div className="mt-3 rounded-xl bg-[#F4F7FF] p-3 text-xs text-[#173B78]"><p className="font-extrabold">Generation preview — {preview.candidateCount} student(s) without an existing invoice</p><p className="mt-1">Gross {money(preview.grossMinor, currency)} · Net after scholarship {money(preview.netMinor, currency)} · {preview.existingInvoiceCount} existing invoice(s) will be left untouched.</p></div>}
            {structure.heads.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{structure.heads.map((head) => <span key={head.name} className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1 text-[10px] font-bold text-[#536175]">{head.name} · {money(head.amountMinor, structure.currency || currency)}</span>)}</div>}
          </article>
        ))}
    </div>
  </div>;
}

function Refunds({ data, currency, notice, reload }: { data: AdminFinanceOverview; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState<Record<string, string>>({});
  async function review(id: string, action: 'APPROVE' | 'REJECT' | 'PROCESS' | 'COMPLETE' | 'CANCEL') {
    setBusy(`${id}:${action}`);
    try {
      const response = await fetch(`/api/finance/refunds/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note: note[id]?.trim() || undefined }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to review refund.');
      notice({ tone: 'success', text: `Refund ${action.toLowerCase()}d.` });
      await reload();
    } catch (caught) { notice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Unable to review refund.' }); } finally { setBusy(''); }
  }
  return <div className="space-y-4">
    <h2 className="text-base font-extrabold text-[#101D38] dark:text-white">Refund decisions</h2>
    {data.pendingRefunds.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-10 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-3 text-sm font-extrabold text-[#536175]">No refunds are waiting for a decision.</p></div>
      : data.pendingRefunds.map((refund) => (
        <article key={refund.id} className="rounded-2xl border border-[#DCE4EE] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase text-amber-700">{refund.status.replace(/_/g, ' ')}</span><span className="text-[11px] text-[#8290A2]">Requested by {refund.requestedRole.replace(/_/g, ' ')}</span></div><p className="mt-2 text-sm font-extrabold text-[#101D38]">{money(refund.requestedMinor, currency)}</p><p className="mt-1 max-w-[520px] text-xs text-[#66758A]">{refund.reason}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <textarea rows={1} value={note[refund.id] ?? ''} onChange={(event) => setNote((previous) => ({ ...previous, [refund.id]: event.target.value }))} placeholder="Decision note" className="min-h-10 w-52 rounded-xl border border-[#D4DEEA] px-3 text-xs" />
              <button type="button" disabled={Boolean(busy)} onClick={() => void review(refund.id, 'APPROVE')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700"><Check className="h-4 w-4" />Approve</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void review(refund.id, 'PROCESS')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-blue-700"><Clock3 className="h-4 w-4" />Process</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void review(refund.id, 'COMPLETE')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white"><BadgeCheck className="h-4 w-4" />Complete</button>
              <button type="button" disabled={Boolean(busy)} onClick={() => void review(refund.id, 'REJECT')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-extrabold text-rose-700"><X className="h-4 w-4" />Reject</button>
            </div>
          </div>
        </article>
      ))}
  </div>;
}

function Scholarships({ data, currency, notice, reload }: { data: AdminFinanceOverview; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', provider: '', valueType: 'FIXED', fixedAmount: '', budget: '', status: 'DRAFT' });
  async function createProgram(event: React.FormEvent) {
    event.preventDefault(); setBusy('CREATE'); setError('');
    try {
      const response = await fetch('/api/finance/scholarships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, provider: form.provider, valueType: form.valueType, fixedAmountMinor: toMinor(form.fixedAmount), budgetMinor: toMinor(form.budget), status: form.status }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to create scholarship program.');
      notice({ tone: 'success', text: `Scholarship program "${form.name}" created.` });
      setShowForm(false); setForm({ name: '', provider: '', valueType: 'FIXED', fixedAmount: '', budget: '', status: 'DRAFT' }); await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to create scholarship program.'); } finally { setBusy(''); }
  }
  async function reviewApplication(id: string, action: 'SHORTLIST' | 'APPROVE' | 'REJECT' | 'WAITLIST') {
    setBusy(`${id}:${action}`);
    try {
      const response = await fetch(`/api/finance/scholarships/applications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to review application.');
      notice({ tone: 'success', text: `Application ${action.toLowerCase()}d.` }); await reload();
    } catch (caught) { notice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Unable to review application.' }); } finally { setBusy(''); }
  }
  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h2 className="text-base font-extrabold text-[#101D38] dark:text-white">Scholarships & financial aid</h2>
      <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white"><Plus className="h-4 w-4" />New program</button></div>
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
    {showForm && <form onSubmit={createProgram} className="grid gap-3 rounded-2xl border border-[#DCE4EE] bg-[#FAFBFD] p-5 sm:grid-cols-2 lg:grid-cols-3">
      <label><span className="text-xs font-bold">Name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Provider</span><input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Value type</span><select value={form.valueType} onChange={(event) => setForm({ ...form, valueType: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm"><option value="FIXED">Fixed amount</option><option value="PERCENTAGE">Percentage</option><option value="FULL_TUITION">Full tuition</option><option value="PARTIAL_TUITION">Partial tuition</option><option value="COMPONENT">Component</option><option value="CAPPED">Capped</option></select></label>
      <label><span className="text-xs font-bold">Award amount</span><input type="number" min="0.01" step="0.01" value={form.fixedAmount} onChange={(event) => setForm({ ...form, fixedAmount: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Budget</span><input type="number" min="0.01" step="0.01" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm"><option value="DRAFT">Draft</option><option value="OPEN">Open</option><option value="CLOSED">Closed</option></select></label>
      <button type="submit" disabled={busy === 'CREATE'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-extrabold text-white">{busy === 'CREATE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Create</button>
    </form>}
    <div className="space-y-3">
      {data.scholarshipPrograms.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-10 text-center"><Sparkles className="mx-auto h-8 w-8 text-[#9AA7B8]" /><p className="mt-3 text-sm font-bold text-[#536175]">No scholarship programs configured.</p></div>
        : data.scholarshipPrograms.map((program) => (
          <article key={program.id} className="rounded-2xl border border-[#DCE4EE] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-extrabold text-[#101D38] dark:text-white">{program.name}</h3><span className="rounded-full border border-[#D6E0EC] bg-[#F6F8FB] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#5B6B82]">{program.status}</span></div><p className="mt-1 text-xs text-[#66758A]">{program.provider || 'Institution'} · {program.valueType.replace(/_/g, ' ')} · {program.appliesToComponents.join(', ')}</p></div>
              <div className="text-right"><p className="text-sm font-extrabold text-[#101D38]">Budget {money(program.budgetMinor, currency)}</p><p className="mt-0.5 text-[10px] font-bold text-emerald-600">Awarded {money(program.awardedMinor, currency)}</p></div>
            </div>
          </article>
        ))}
    </div>
    <div className="space-y-3">
      <h3 className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#7D899B]">Applications awaiting review</h3>
      {data.pendingScholarshipApplications.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-8 text-center text-xs font-bold text-[#536175]">No applications awaiting a decision.</div>
        : data.pendingScholarshipApplications.map((application) => (
          <article key={application.id} className="rounded-2xl border border-[#DCE4EE] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-extrabold text-[#101D38]">{application.studentName} <span className="font-mono text-xs text-[#7A8798]">· {application.rollNumber}</span></p><p className="mt-1 text-xs text-[#66758A]">{application.programName} · {application.status.replace(/_/g, ' ')}</p>{application.statement && <p className="mt-2 max-w-[560px] text-xs text-[#66758A]">{application.statement}</p>}</div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={Boolean(busy)} onClick={() => void reviewApplication(application.id, 'SHORTLIST')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-extrabold text-blue-700">Shortlist</button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void reviewApplication(application.id, 'APPROVE')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white">Approve</button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void reviewApplication(application.id, 'REJECT')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-extrabold text-rose-700">Reject</button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void reviewApplication(application.id, 'WAITLIST')} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-700">Waitlist</button>
              </div>
            </div>
          </article>
        ))}
    </div>
  </div>;
}

function Holds({ data, currency, notice, reload }: { data: AdminFinanceOverview; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState('');
  const [form, setForm] = useState({ studentId: '', reason: '', amount: '' });
  async function place(event: React.FormEvent) {
    event.preventDefault(); setBusy('CREATE');
    try {
      const response = await fetch('/api/finance/holds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: form.studentId, reason: form.reason, amountMinor: form.amount ? toMinor(form.amount) : 0 }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to place hold.');
      notice({ tone: 'success', text: 'Financial hold placed.' }); setShowForm(false); setForm({ studentId: '', reason: '', amount: '' }); await reload();
    } catch (caught) { notice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Unable to place hold.' }); } finally { setBusy(''); }
  }
  async function resolve(id: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/finance/holds/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to resolve hold.');
      notice({ tone: 'success', text: 'Financial hold resolved.' }); await reload();
    } catch (caught) { notice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Unable to resolve hold.' }); } finally { setBusy(''); }
  }
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="text-base font-extrabold text-[#101D38] dark:text-white">Financial holds</h2>
      <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white"><Plus className="h-4 w-4" />Place hold</button></div>
    {showForm && <form onSubmit={place} className="grid gap-3 rounded-2xl border border-[#DCE4EE] bg-[#FAFBFD] p-5 sm:grid-cols-3">
      <label><span className="text-xs font-bold">Student ID</span><input required value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} placeholder="uuid" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Reason</span><input required value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label><span className="text-xs font-bold">Amount (optional)</span><input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <button type="submit" disabled={busy === 'CREATE'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-extrabold text-white">{busy === 'CREATE' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}Place hold</button>
    </form>}
    {data.activeHolds.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-10 text-center"><ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" /><p className="mt-3 text-sm font-bold text-[#536175]">No active financial holds.</p></div>
      : data.activeHolds.map((hold) => (
        <article key={hold.id} className="flex flex-col gap-3 rounded-2xl border border-[#DCE4EE] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-extrabold text-[#101D38]">{hold.studentName} <span className="font-mono text-xs text-[#7A8798]">· {hold.rollNumber}</span></p><p className="mt-1 text-xs text-[#66758A]">{hold.reason}{hold.amountMinor > 0 ? ` · ${money(hold.amountMinor, currency)}` : ''}</p></div>
          <button type="button" disabled={Boolean(busy)} onClick={() => void resolve(hold.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-extrabold text-white">{busy === hold.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Resolve</button>
        </article>
      ))}
  </div>;
}

function Settings({ data, currency, notice, reload }: { data: AdminFinanceOverview; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [form, setForm] = useState<FinanceSettings>(data.settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(data.settings), [data.settings]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      const response = await fetch('/api/finance/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to save settings.');
      notice({ tone: 'success', text: 'Finance policy settings saved.' }); await reload();
    } catch (caught) { notice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Unable to save settings.' }); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="max-w-3xl space-y-5">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="rounded-2xl border border-[#DCE4EE] p-4"><span className="text-xs font-bold">Currency</span><select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm"><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option><option>AED</option></select></label>
      <label className="rounded-2xl border border-[#DCE4EE] p-4"><span className="text-xs font-bold">Timezone</span><input value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label className="rounded-2xl border border-[#DCE4EE] p-4"><span className="text-xs font-bold">Invoice prefix</span><input value={form.invoicePrefix} onChange={(event) => setForm({ ...form, invoicePrefix: event.target.value })} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
      <label className="rounded-2xl border border-[#DCE4EE] p-4"><span className="text-xs font-bold">Late fee model</span><select value={form.lateFeeModel} onChange={(event) => setForm({ ...form, lateFeeModel: event.target.value as FinanceSettings['lateFeeModel'] })} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm"><option value="NONE">None</option><option value="FIXED">Fixed</option><option value="PERCENTAGE">Percentage</option><option value="DAILY">Daily</option></select></label>
      <label className="rounded-2xl border border-[#DCE4EE] p-4"><span className="text-xs font-bold">Scholarship stacking</span><select value={form.scholarshipStackingPolicy} onChange={(event) => setForm({ ...form, scholarshipStackingPolicy: event.target.value as FinanceSettings['scholarshipStackingPolicy'] })} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm"><option value="NO_STACKING">No stacking</option><option value="LIMITED">Limited</option><option value="UNLIMITED">Unlimited</option></select></label>
      <label className="rounded-2xl border border-[#DCE4EE] p-4"><span className="text-xs font-bold">Max discount %</span><input type="number" min="0" max="100" value={form.scholarshipMaxDiscountPct} onChange={(event) => setForm({ ...form, scholarshipMaxDiscountPct: Number(event.target.value) })} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
    </div>
    <div className="flex flex-wrap gap-3 rounded-2xl bg-[#F7F9FC] p-4 text-xs font-bold text-[#536175]">
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.refundRequiresMakerChecker} onChange={(event) => setForm({ ...form, refundRequiresMakerChecker: event.target.checked })} className="h-4 w-4" />Refund maker-checker</label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.examRequiresClearance} onChange={(event) => setForm({ ...form, examRequiresClearance: event.target.checked })} className="h-4 w-4" />Exam clearance required</label>
    </div>
    <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Save policy settings</button>
  </form>;
}

function LoadingState() { return <div className="flex min-h-[520px] items-center justify-center"><div className="rounded-3xl border bg-white px-8 py-7 text-center dark:border-slate-800 dark:bg-slate-950"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1754E8]" /><p className="mt-4 text-sm font-extrabold text-[#101D38]">Loading finance control center</p></div></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="flex min-h-[520px] items-center justify-center"><div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-7 text-center dark:border-slate-800 dark:bg-slate-950"><AlertCircle className="mx-auto h-8 w-8 text-rose-600" /><p className="mt-4 font-extrabold text-[#101D38]">Finance control center unavailable</p><p className="mt-2 text-sm text-[#667085]">{message}</p><button type="button" onClick={retry} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white"><RefreshCcw className="h-4 w-4" />Try again</button></div></div>; }
