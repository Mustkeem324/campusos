'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  FileText,
  Landmark,
  Loader2,
  ReceiptIndianRupee,
  RefreshCcw,
  ShieldAlert,
  WalletCards,
  X,
} from 'lucide-react';

import { formatMinor } from '@/lib/finance-money';
import type {
  FinanceInvoiceView,
  LedgerEntryView,
  RefundView,
  ScholarshipApplicationView,
  ScholarshipProgramView,
  StudentFinanceWorkspace,
} from '@/lib/finance-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function dateLabel(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
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

const clearanceTone: Record<StudentFinanceWorkspace['clearance'], { label: string; tone: string }> = {
  CLEAR: { label: 'Clear', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  PARTIALLY_DUE: { label: 'Partial dues', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  OVERDUE: { label: 'Overdue', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  HOLD: { label: 'Financial hold', tone: 'border-violet-200 bg-violet-50 text-violet-700' },
  REVIEW_REQUIRED: { label: 'Review required', tone: 'border-blue-200 bg-blue-50 text-blue-700' },
};

const invoiceStatusTone: Record<FinanceInvoiceView['status'], string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  PARTIALLY_PAID: 'border-amber-200 bg-amber-50 text-amber-700',
  OVERDUE: 'border-rose-200 bg-rose-50 text-rose-700',
  ISSUED: 'border-blue-200 bg-blue-50 text-blue-700',
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-600',
  CANCELLED: 'border-slate-200 bg-slate-50 text-slate-500',
  VOID: 'border-slate-200 bg-slate-50 text-slate-500',
  REFUNDED: 'border-purple-200 bg-purple-50 text-purple-700',
};

function statusBadge(label: string, tone: string) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${tone}`}>{label.replace(/_/g, ' ')}</span>;
}

export function Finance2Workspace() {
  const [data, setData] = useState<StudentFinanceWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [openInvoices, setOpenInvoices] = useState<Set<string>>(new Set());
  const [expandedLedger, setExpandedLedger] = useState(false);

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setFatalError('');
    try {
      const response = await fetch('/api/finance/portal', { cache: 'no-store' });
      const payload = await json<StudentFinanceWorkspace & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load the finance workspace.');
      if (!('invoices' in payload)) throw new Error('This workspace requires a student or parent account.');
      setData(payload);
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : 'Unable to load the finance workspace.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={fatalError || 'Finance workspace unavailable.'} retry={() => void reload()} />;

  const currency = data.settings.currency;

  return <div className="mx-auto w-full max-w-[1480px] space-y-6 pb-16">
    <Hero institution={data.institution?.name ?? 'Institution'} student={data.student?.name ?? ''} clearance={data.clearance} currency={currency} />
    {notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}
    {fatalError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{fatalError}</div>}

    <SummaryCards data={data} currency={currency} />

    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-6">
        <InvoiceSection data={data} currency={currency} open={openInvoices} setOpen={setOpenInvoices} />
        <ScholarshipSection data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />
        <LedgerSection ledger={data.ledger} currency={currency} expanded={expandedLedger} setExpanded={setExpandedLedger} />
      </div>
      <aside className="min-w-0 space-y-6">
        <RefundSection data={data} currency={currency} notice={setNotice} reload={() => reload(true)} />
        <ReceiptSection data={data} currency={currency} />
      </aside>
    </div>
  </div>;
}

function Hero({ institution, student, clearance, currency }: { institution: string; student: string; clearance: StudentFinanceWorkspace['clearance']; currency: string }) {
  const clearanceInfo = clearanceTone[clearance];
  return <section className="overflow-hidden rounded-[26px] border border-[#D8E3F0] bg-white shadow-[0_16px_50px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D6E0EC] bg-[#F6F8FB] px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]"><WalletCards className="h-3.5 w-3.5" />Student finance account</div>
        <h1 className="mt-5 max-w-[820px] text-3xl font-extrabold tracking-[-0.03em] text-[#101D38] dark:text-white sm:text-[38px]">Your fees, scholarships and payments in one place</h1>
        <p className="mt-3 max-w-[820px] text-sm leading-7 text-[#66758A] dark:text-slate-400">{student ? `${student} · ${institution}` : institution}. Amounts shown are the authoritative institution ledger records.</p>
      </div>
      <div className="rounded-2xl border border-[#D8E0EA] bg-[#FAFBFD] p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7D899B]">Financial clearance</p>
        <div className="mt-2"><span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase ${clearanceInfo.tone}`}>{clearanceInfo.label}</span></div>
      </div>
    </div>
  </section>;
}

function SummaryCards({ data, currency }: { data: StudentFinanceWorkspace; currency: string }) {
  const cards = [
    { label: 'Total outstanding', value: money(data.summary.totalOutstandingMinor, currency), detail: `${data.invoices.filter((invoice) => invoice.status !== 'PAID').length} open invoice(s)`, icon: CircleDollarSign },
    { label: 'Overdue', value: money(data.summary.overdueMinor, currency), detail: data.summary.overdueMinor > 0 ? 'Pay before services are restricted' : 'Nothing overdue', icon: ShieldAlert },
    { label: 'Next due date', value: dateLabel(data.summary.nextDueDate), detail: 'Next recorded unpaid due date', icon: CalendarDays },
    { label: 'Scholarship applied', value: money(data.summary.scholarshipAwardedMinor, currency), detail: 'Approved awards and credits', icon: Award },
  ] as const;
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => (
    <article key={card.label} className="rounded-[22px] border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_26px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7D899B]">{card.label}</p><p className="mt-2 text-2xl font-extrabold text-[#101D38] dark:text-white">{card.value}</p></div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><card.icon className="h-[18px] w-[18px]" /></span>
      </div>
      <p className="mt-3 text-[11px] text-[#8793A4]">{card.detail}</p>
    </article>
  ))}</section>;
}

function InvoiceSection({ data, currency, open, setOpen }: { data: StudentFinanceWorkspace; currency: string; open: Set<string>; setOpen: (next: Set<string>) => void }) {
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
    <div className="flex items-center justify-between gap-3 border-b border-[#E3E9F1] p-5 dark:border-slate-800">
      <div><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Invoices & instalments</h2><p className="mt-1 text-xs text-[#7A8798]">Gross fee, scholarship, credits, paid and outstanding for each record.</p></div>
      <button type="button" onClick={() => void fetch('/api/finance/portal', { cache: 'no-store' }).then(() => window.location.reload())} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DFEB] px-3 text-xs font-bold text-[#536175]"><RefreshCcw className="h-4 w-4" />Refresh</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left">
        <thead><tr className="border-b border-[#E3E9F1] bg-[#F7F9FC] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B] dark:border-slate-800 dark:bg-slate-900">
          <th className="p-4">Invoice</th><th className="p-4">Due date</th><th className="p-4 text-right">Gross</th><th className="p-4 text-right">Scholarship</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Outstanding</th><th className="p-4 text-center">Status</th><th className="w-14 p-4" />
        </tr></thead>
        <tbody className="divide-y divide-[#EEF2F6] dark:divide-slate-800">
          {data.invoices.length === 0 ? <tr><td colSpan={8} className="p-12 text-center"><FileText className="mx-auto h-8 w-8 text-[#B2BDCB]" /><p className="mt-3 text-sm font-bold text-[#536175]">No fee invoices have been issued for this account.</p></td></tr>
            : data.invoices.map((invoice) => {
              const isOpen = open.has(invoice.id);
              return <React.Fragment key={invoice.id}>
                <tr className={isOpen ? 'bg-[#F6F9FF] dark:bg-blue-950/10' : ''}>
                  <td className="p-4"><p className="font-mono text-xs font-bold text-[#101D38] dark:text-white">{invoice.invoiceNumber}</p><p className="mt-1 max-w-[240px] truncate text-xs text-[#748195]">{invoice.description}</p></td>
                  <td className="p-4 text-xs text-[#536175] dark:text-slate-300">{dateLabel(invoice.dueDate)}</td>
                  <td className="p-4 text-right text-xs text-[#536175]">{money(invoice.grossMinor, currency)}</td>
                  <td className="p-4 text-right text-xs text-emerald-600">{invoice.creditsMinor > 0 ? `- ${money(invoice.creditsMinor, currency)}` : '—'}</td>
                  <td className="p-4 text-right text-xs text-[#748195]">{invoice.paidMinor > 0 ? money(invoice.paidMinor, currency) : '—'}</td>
                  <td className="p-4 text-right text-sm font-extrabold text-[#101D38] dark:text-white">{money(invoice.outstandingMinor, currency)}</td>
                  <td className="p-4 text-center">{statusBadge(invoice.status, invoiceStatusTone[invoice.status])}</td>
                  <td className="p-4 text-center"><button type="button" onClick={() => { const next = new Set(open); next.has(invoice.id) ? next.delete(invoice.id) : next.add(invoice.id); setOpen(next); }} aria-label={isOpen ? 'Collapse instalments' : 'Expand instalments'} className="rounded-lg p-1.5 text-[#7C899B] hover:bg-[#EEF2F6]">{isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button></td>
                </tr>
                {isOpen && <tr><td colSpan={8} className="bg-[#FAFBFD] p-4 dark:bg-slate-900/50">
                  {invoice.installments.length === 0 ? <p className="text-xs text-[#7A8798]">This invoice has no instalment plan. Pay through the fee centre when outstanding.</p>
                    : <div className="space-y-2">{invoice.installments.map((installment) => (
                      <div key={installment.number} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-950">
                        <span className="font-bold text-[#344054]">Instalment {installment.number}</span><span className="text-[#536175]">Due {dateLabel(installment.dueDate)}</span><span className="font-mono font-bold text-[#101D38]">{money(installment.amountMinor, currency)}</span>
                        <span className="text-[10px] font-extrabold uppercase text-[#748195]">Paid {money(installment.paidMinor, currency)}</span><span className="text-[10px] font-bold uppercase text-[#1754E8]">{installment.status.replace(/_/g, ' ')}</span>
                      </div>
                    ))}</div>}
                </td></tr>}
              </React.Fragment>;
            })}
        </tbody>
      </table>
    </div>
  </section>;
}

function ScholarshipSection({ data, currency, notice, reload }: { data: StudentFinanceWorkspace; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [busy, setBusy] = useState('');
  const openPrograms = data.scholarships.programs.filter((program) => program.status === 'OPEN');
  const applied = new Set(data.scholarships.applications.map((application) => application.programId));
  async function apply(program: ScholarshipProgramView) {
    setBusy(program.id);
    try {
      const response = await fetch('/api/finance/scholarships/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ programId: program.id }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to apply.');
      notice({ tone: 'success', text: `Application submitted for ${program.name}.` });
      await reload();
    } catch (error) {
      notice({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to apply.' });
    } finally { setBusy(''); }
  }
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
    <div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Scholarships & aid</h2><p className="mt-1 text-xs text-[#7A8798]">Open programmes you can apply to, and the status of your existing applications.</p></div>
    <div className="p-5 space-y-4">
      {openPrograms.length === 0 && data.scholarships.applications.length === 0 && <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-8 text-center dark:border-slate-700 dark:bg-slate-900"><Award className="mx-auto h-7 w-7 text-[#9AA7B8]" /><p className="mt-3 text-xs font-bold text-[#536175]">No scholarship programmes are currently open for applications.</p></div>}
      {openPrograms.map((program) => (
        <article key={program.id} className="rounded-2xl border border-[#DCE4EE] p-4 dark:border-slate-700">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-sm font-extrabold text-[#101D38] dark:text-white">{program.name}</h3><p className="mt-1 text-xs text-[#66758A]">{program.provider || 'Institution scholarship'} · {program.valueType.replace(/_/g, ' ')} · {program.appliesToComponents.join(', ')}</p></div>
            <button type="button" disabled={busy === program.id || applied.has(program.id)} onClick={() => void apply(program)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white disabled:opacity-45">{busy === program.id ? <Loader2 className="h-4 w-4 animate-spin" /> : applied.has(program.id) ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}{applied.has(program.id) ? 'Applied' : 'Apply'}</button>
          </div>
        </article>
      ))}
      {data.scholarships.applications.length > 0 && <div className="pt-2"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7D899B]">My applications</p><div className="mt-2 space-y-2">{data.scholarships.applications.map((application) => (
        <div key={application.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-xs dark:border-slate-700"><span className="font-bold text-[#344054]">{application.programName}</span><span>{statusBadge(application.status, application.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : application.status === 'REJECTED' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700')}</span></div>
      ))}</div></div>}
    </div>
  </section>;
}

function LedgerSection({ ledger, currency, expanded, setExpanded }: { ledger: LedgerEntryView[]; currency: string; expanded: boolean; setExpanded: (v: boolean) => void }) {
  const visible = expanded ? ledger : ledger.slice(0, 8);
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
    <div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Ledger history</h2><p className="mt-1 text-xs text-[#7A8798]">Every financial event recorded against this account, newest first.</p></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead><tr className="bg-[#F7F9FC] text-[10px] font-extrabold uppercase text-[#7C899B] dark:bg-slate-900"><th className="p-4">Date</th><th className="p-4">Type</th><th className="p-4">Reference / reason</th><th className="p-4 text-right">Debit</th><th className="p-4 text-right">Credit</th></tr></thead><tbody className="divide-y divide-[#EEF2F6] dark:divide-slate-800">{visible.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-sm text-[#8B96A7]">No ledger activity yet.</td></tr> : visible.map((entry) => (
      <tr key={entry.id}><td className="p-4 text-xs text-[#667085]">{dateLabel(entry.createdAt)}</td><td className="p-4"><span className="rounded-full border border-[#D6E0EC] bg-[#F6F8FB] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#5B6B82]">{entry.entryType.replace(/_/g, ' ')}</span></td><td className="max-w-[300px] p-4 text-xs text-[#536175]"><p className="font-mono font-bold">{entry.reference || '—'}</p>{entry.reason && <p className="mt-0.5 truncate text-[10px] text-[#8A96A7]">{entry.reason}</p>}</td><td className="p-4 text-right text-xs font-bold text-[#B45309]">{entry.debitMinor > 0 ? money(entry.debitMinor, currency) : '—'}</td><td className="p-4 text-right text-xs font-bold text-emerald-600">{entry.creditMinor > 0 ? money(entry.creditMinor, currency) : '—'}</td></tr>
    ))}</tbody></table></div>
    {ledger.length > 8 && <div className="border-t border-[#E3E9F1] p-3 text-center dark:border-slate-800"><button type="button" onClick={() => setExpanded(!expanded)} className="text-xs font-extrabold text-[#1754E8]">{expanded ? 'Show less' : `Show all ${ledger.length} entries`}</button></div>}
  </section>;
}

function RefundSection({ data, currency, notice, reload }: { data: StudentFinanceWorkspace; currency: string; notice: (n: Notice) => void; reload: () => Promise<void> }) {
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const paidPayments = data.invoices.flatMap((invoice) => invoice.paidMinor > 0 ? [{ id: `${invoice.id}:paid`, label: `${invoice.invoiceNumber} · paid ${money(invoice.paidMinor, currency)}` }] : []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    const requestedMinor = Math.round(Number(amount) * 100);
    try {
      const response = await fetch('/api/finance/refunds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentId, requestedMinor, reason }) });
      const payload = await json<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to request refund.');
      notice({ tone: 'success', text: 'Refund request submitted for review.' });
      setPaymentId(''); setAmount(''); setReason(''); await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to request refund.'); } finally { setBusy(false); }
  }
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
    <div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Refund requests</h2><p className="mt-1 text-xs text-[#7A8798]">Requests are reviewed by institution finance before any refund is processed.</p></div>
    <div className="p-5 space-y-4">
      {data.refunds.length > 0 && <div className="space-y-2">{data.refunds.slice(0, 4).map((refund) => (
        <div key={refund.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-xs dark:border-slate-700"><span className="font-mono font-bold text-[#344054]">{money(refund.requestedMinor, currency)}</span><span className="max-w-[200px] truncate text-[#66758A]">{refund.reason}</span><span>{statusBadge(refund.status, refund.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ['REQUESTED', 'UNDER_REVIEW', 'PROCESSING'].includes(refund.status) ? 'border-amber-200 bg-amber-50 text-amber-700' : refund.status === 'REJECTED' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600')}</span></div>
      ))}</div>}
      {paidPayments.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-6 text-center dark:border-slate-700 dark:bg-slate-900"><Landmark className="mx-auto h-6 w-6 text-[#9AA7B8]" /><p className="mt-2 text-xs font-bold text-[#536175]">Refunds can only be requested against confirmed payments.</p></div>
        : <form onSubmit={submit} className="space-y-3">
          {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
          <label className="block"><span className="text-xs font-bold">Confirmed payment</span><select value={paymentId} onChange={(event) => setPaymentId(event.target.value)} required className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm">{paidPayments.map((payment) => <option key={payment.id} value={payment.id}>{payment.label}</option>)}</select></label>
          <label className="block"><span className="text-xs font-bold">Refund amount</span><input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>
          <label className="block"><span className="text-xs font-bold">Reason</span><textarea required rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are you requesting this refund?" className="mt-1.5 w-full rounded-xl border border-[#D4DEEA] p-3 text-sm" /></label>
          <button type="submit" disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] text-xs font-extrabold text-white">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ReceiptIndianRupee className="h-4 w-4" />}Request refund</button>
        </form>}
    </div>
  </section>;
}

function ReceiptSection({ data, currency }: { data: StudentFinanceWorkspace; currency: string }) {
  const [verifyResult, setVerifyResult] = useState<{ reference: string; status: string } | null>(null);
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
    <div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Receipts</h2><p className="mt-1 text-xs text-[#7A8798]">Official receipts for confirmed payments with public verification references.</p></div>
    <div className="p-5 space-y-3">
      {data.receipts.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-6 text-center dark:border-slate-700 dark:bg-slate-900"><FileText className="mx-auto h-6 w-6 text-[#9AA7B8]" /><p className="mt-2 text-xs font-bold text-[#536175]">No confirmed receipts yet.</p></div>
        : data.receipts.slice(0, 6).map((receipt) => (
          <div key={receipt.id} className="rounded-xl border border-[#E2E8F0] p-3 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3 text-xs"><span className="font-mono font-extrabold text-[#101D38]">{receipt.receiptNumber}</span><span className="font-bold text-emerald-600">{money(receipt.amountMinor, receipt.currency || currency)}</span></div>
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-[#7A8798]"><span>{receipt.paymentMethod.replace(/_/g, ' ')} · {dateLabel(receipt.issuedAt)}</span>
              <button type="button" onClick={() => setVerifyResult({ reference: receipt.verifyReference, status: '—' })} className="font-extrabold text-[#1754E8]">Verify</button></div>
            {verifyResult?.reference === receipt.verifyReference && <p className="mt-2 rounded-lg bg-[#F4F7FF] p-2 font-mono text-[10px] text-[#1754E8]">/verify/receipt/{receipt.verifyReference}</p>}
          </div>
        ))}
      <div className="rounded-2xl bg-[#F7F9FC] p-4 text-[10px] leading-5 text-[#718096] dark:bg-slate-900"><BadgeCheck className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" />Receipts are generated only for confirmed payments and can be verified independently without exposing personal financial details.</div>
    </div>
  </section>;
}

function LoadingState() { return <div className="flex min-h-[520px] items-center justify-center"><div className="rounded-3xl border bg-white px-8 py-7 text-center dark:border-slate-800 dark:bg-slate-950"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1754E8]" /><p className="mt-4 text-sm font-extrabold text-[#101D38]">Loading finance workspace</p></div></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="flex min-h-[520px] items-center justify-center"><div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-7 text-center dark:border-slate-800 dark:bg-slate-950"><AlertCircle className="mx-auto h-8 w-8 text-rose-600" /><p className="mt-4 font-extrabold text-[#101D38]">Finance workspace unavailable</p><p className="mt-2 text-sm text-[#667085]">{message}</p><button type="button" onClick={retry} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white"><RefreshCcw className="h-4 w-4" />Try again</button></div></div>; }
