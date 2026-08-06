'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  FileCheck2,
  FileText,
  Landmark,
  Loader2,
  LockKeyhole,
  ReceiptIndianRupee,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  UploadCloud,
  UsersRound,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';

import type {
  ManualPaymentReviewItem,
  PaymentPortalData,
  PaymentPortalInvoice,
  PaymentPortalSettings,
  PaymentPortalTransaction,
} from '@/lib/payment-portal-types';
import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      prefill?: { name?: string; email?: string; contact?: string };
      theme?: { color?: string };
      modal?: { ondismiss?: () => void };
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void | Promise<void>;
    }) => { open: () => void };
  }
}

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

type CheckoutPayload =
  | {
      provider: 'RAZORPAY';
      attemptId: string;
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      institutionName: string;
      payer: { name: string; email: string; phone: string };
    }
  | { provider: 'STRIPE'; attemptId: string; checkoutUrl: string };

const invoiceStatusClasses: Record<PaymentPortalInvoice['status'], string> = {
  PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DUE: 'border-amber-200 bg-amber-50 text-amber-700',
  UPCOMING: 'border-blue-200 bg-blue-50 text-blue-700',
  OVERDUE: 'border-rose-200 bg-rose-50 text-rose-700',
  VERIFICATION_PENDING: 'border-violet-200 bg-violet-50 text-violet-700',
};

function money(value: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString('en-IN')}`;
  }
}

function shortDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function shortDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

async function readJson<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => ({}));
  return payload as T;
}

function noticeClasses(tone: NonNullable<Notice>['tone']) {
  if (tone === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (tone === 'error') return 'border-rose-200 bg-rose-50 text-rose-800';
  return 'border-blue-200 bg-blue-50 text-blue-800';
}

export function FeePaymentPortal() {
  const [data, setData] = useState<PaymentPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('OUTSTANDING');
  const [opsTab, setOpsTab] = useState<'verification' | 'settings' | 'transactions'>('verification');

  async function loadPortal(silent = false) {
    if (!silent) setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/payments/portal', { cache: 'no-store' });
      const payload = await readJson<PaymentPortalData & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load fee payments.');
      setData(payload);
      setSelectedIds((previous) => {
        const valid = new Set(payload.invoices.filter((invoice) => !['PAID', 'VERIFICATION_PENDING'].includes(invoice.status)).map((invoice) => invoice.id));
        return new Set(Array.from(previous).filter((id) => valid.has(id)));
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load fee payments.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void loadPortal();

    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const sessionId = params.get('session_id');
    if (payment === 'cancelled') {
      setNotice({ tone: 'info', text: 'Stripe Checkout was cancelled. No CampusOS invoice was marked paid.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (payment === 'success' && sessionId) {
      void (async () => {
        setNotice({ tone: 'info', text: 'Confirming the Stripe payment with the payment provider…' });
        const response = await fetch(`/api/payments/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
        const payload = await readJson<{ success?: boolean; receiptNumber?: string; error?: string }>(response);
        if (response.ok) {
          setNotice({ tone: 'success', text: `Payment confirmed${payload.receiptNumber ? ` · Receipt ${payload.receiptNumber}` : ''}.` });
          await loadPortal(true);
        } else {
          setNotice({ tone: 'info', text: payload.error || 'Payment is still being confirmed. The webhook will update CampusOS when Stripe completes processing.' });
        }
        window.history.replaceState({}, '', window.location.pathname);
      })();
    } else if (payment === 'success') {
      setNotice({ tone: 'info', text: 'Payment completed. CampusOS is waiting for the provider confirmation webhook.' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const selectedInvoices = useMemo(
    () => data?.invoices.filter((invoice) => selectedIds.has(invoice.id)) ?? [],
    [data?.invoices, selectedIds],
  );

  if (loading && !data) return <PaymentLoading />;
  if (error && !data) return <PaymentError message={error} onRetry={() => void loadPortal()} />;
  if (!data) return null;

  if (!data.capabilities.canPay && (data.capabilities.canReviewManualTransfers || data.capabilities.canManagePaymentSettings)) {
    return (
      <FinanceOperationsWorkspace
        data={data}
        notice={notice}
        setNotice={setNotice}
        tab={opsTab}
        setTab={setOpsTab}
        refresh={() => loadPortal(true)}
      />
    );
  }

  const query = search.trim().toLowerCase();
  const invoices = data.invoices.filter((invoice) => {
    const matchesSearch = !query || [invoice.invoiceNo, invoice.description, invoice.studentName, invoice.rollNumber]
      .some((value) => value.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'ALL'
      || (statusFilter === 'OUTSTANDING' && !['PAID', 'UPCOMING'].includes(invoice.status))
      || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function toggleInvoice(invoice: PaymentPortalInvoice) {
    if (['PAID', 'VERIFICATION_PENDING'].includes(invoice.status)) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(invoice.id)) next.delete(invoice.id);
      else next.add(invoice.id);
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-16">
      <section className="overflow-hidden rounded-[28px] border border-[#D8E3F0] bg-white shadow-[0_18px_55px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-8 bg-[radial-gradient(circle_at_88%_15%,rgba(42,111,255,0.18),transparent_31%),linear-gradient(135deg,#101D38_0%,#142A52_58%,#0B3762_100%)] p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#D5E4FF]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Secure fee centre
            </div>
            <h1 className="mt-5 max-w-[850px] text-3xl font-extrabold tracking-[-0.04em] sm:text-[42px]">Pay institution fees with verified records, not simulated transactions</h1>
            <p className="mt-4 max-w-[850px] text-sm leading-7 text-[#C2D0E4] sm:text-base">
              Review your authorised invoices, choose an institution-enabled payment channel and keep every provider confirmation or bank-transfer review attached to the correct fee record.
            </p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm lg:min-w-[270px]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9FB7D8]">Payment beneficiary</p>
            <p className="mt-2 text-sm font-extrabold">{data.institution.name}</p>
            <p className="mt-1 text-xs text-[#B8C8DD]">Signed in as {data.payer.name}</p>
          </div>
        </div>
      </section>

      {notice && <div role="status" className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${noticeClasses(notice.tone)}`}><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} className="rounded-lg p-1" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>}
      {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

      <SummaryCards data={data} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="min-w-0 space-y-6">
          <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-4 border-b border-[#E3E9F1] p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <div><h2 className="text-lg font-extrabold tracking-[-0.025em] text-[#101D38] dark:text-white">Invoices & dues</h2><p className="mt-1 text-xs leading-5 text-[#7A8798] dark:text-slate-400">Only invoices authorised for this signed-in account are shown.</p></div>
              <button type="button" onClick={() => void loadPortal(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DFEB] bg-white px-3 text-xs font-bold text-[#536175] transition hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><RefreshCcw className="h-4 w-4" />Refresh</button>
            </div>

            <div className="grid gap-3 border-b border-[#E3E9F1] bg-[#FAFBFD] p-4 sm:grid-cols-[minmax(0,1fr)_auto] dark:border-slate-800 dark:bg-slate-900/40">
              <label className="relative block"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><span className="sr-only">Search invoices</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, fee or student…" className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10 dark:border-slate-700 dark:bg-slate-950" /></label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm font-semibold text-[#526071] outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <option value="OUTSTANDING">Outstanding</option><option value="OVERDUE">Overdue</option><option value="DUE">Due</option><option value="UPCOMING">Upcoming</option><option value="VERIFICATION_PENDING">Verification pending</option><option value="PAID">Paid</option><option value="ALL">All invoices</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead><tr className="border-b border-[#E3E9F1] bg-[#F7F9FC] text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7C899B] dark:border-slate-800 dark:bg-slate-900"><th className="w-14 p-4 text-center">Pay</th><th className="p-4">Invoice</th><th className="p-4">Student</th><th className="p-4">Due date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Balance</th><th className="p-4 text-center">Status</th></tr></thead>
                <tbody className="divide-y divide-[#EEF2F6] dark:divide-slate-800">
                  {invoices.length === 0 ? <tr><td colSpan={8} className="p-12 text-center"><FileText className="mx-auto h-8 w-8 text-[#B2BDCB]" /><p className="mt-3 text-sm font-bold text-[#536175] dark:text-slate-300">No invoices match this view</p><p className="mt-1 text-xs text-[#98A2B3]">Try another filter or refresh after your institution publishes fees.</p></td></tr> : invoices.map((invoice) => {
                    const selectable = !['PAID', 'VERIFICATION_PENDING'].includes(invoice.status);
                    return <tr key={invoice.id} className={`transition hover:bg-[#FBFCFE] dark:hover:bg-slate-900/70 ${selectedIds.has(invoice.id) ? 'bg-[#F4F7FF] dark:bg-blue-950/15' : ''}`}>
                      <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.has(invoice.id)} disabled={!selectable} onChange={() => toggleInvoice(invoice)} aria-label={`Select ${invoice.invoiceNo}`} className="h-4 w-4 rounded border-[#B8C5D6] text-[#1754E8] focus:ring-[#1754E8] disabled:opacity-40" /></td>
                      <td className="p-4"><p className="font-mono text-xs font-bold text-[#101D38] dark:text-white">{invoice.invoiceNo}</p><p className="mt-1 max-w-[220px] truncate text-xs text-[#748195]">{invoice.description}</p></td>
                      <td className="p-4"><p className="text-xs font-bold text-[#344054] dark:text-slate-200">{invoice.studentName}</p><p className="mt-1 text-[11px] text-[#8B96A7]">{invoice.rollNumber}</p></td>
                      <td className="p-4 text-xs font-semibold text-[#536175] dark:text-slate-300">{shortDate(invoice.dueDate)}</td>
                      <td className="p-4 text-right text-xs font-semibold text-[#536175] dark:text-slate-300">{money(invoice.amount, data.settings.currency)}</td>
                      <td className="p-4 text-right text-xs text-[#748195]">{money(invoice.paid, data.settings.currency)}</td>
                      <td className="p-4 text-right text-sm font-extrabold text-[#101D38] dark:text-white">{money(invoice.balance, data.settings.currency)}</td>
                      <td className="p-4 text-center"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.07em] ${invoiceStatusClasses[invoice.status]}`}>{invoice.status.replace(/_/g, ' ')}</span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <TransactionsTable transactions={data.transactions} currency={data.settings.currency} />
        </div>

        <aside className="min-w-0">
          <div className="sticky top-[calc(var(--layout-top)+1rem)] overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_16px_42px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-extrabold text-[#101D38] dark:text-white">Payment summary</h2><p className="mt-1 text-xs text-[#7B8798]">{selectedInvoices.length} invoice{selectedInvoices.length === 1 ? '' : 's'} selected</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><WalletCards className="h-5 w-5" /></span></div></div>
            <div className="space-y-4 p-5">
              {selectedInvoices.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-6 text-center dark:border-slate-700 dark:bg-slate-900"><ReceiptIndianRupee className="mx-auto h-7 w-7 text-[#9AA7B8]" /><p className="mt-3 text-xs font-bold text-[#536175] dark:text-slate-300">Select an outstanding invoice</p><p className="mt-1 text-[11px] leading-5 text-[#8B96A7]">Paid invoices and transfers already under verification cannot be selected again.</p></div> : <>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">{selectedInvoices.map((invoice) => <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FC] px-3 py-2.5 dark:bg-slate-900"><div className="min-w-0"><p className="truncate text-[11px] font-bold text-[#344054] dark:text-slate-200">{invoice.description}</p><p className="mt-0.5 text-[10px] text-[#8A96A7]">{invoice.invoiceNo}</p></div><span className="shrink-0 text-xs font-extrabold text-[#101D38] dark:text-white">{money(invoice.balance, data.settings.currency)}</span></div>)}</div>
                <div className="border-t border-dashed border-[#D7E0EA] pt-4 dark:border-slate-700"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold text-[#536175] dark:text-slate-300">Total payable</p><p className="mt-1 text-[10px] text-[#8B96A7]">Calculated from current recorded balances</p></div><p className="text-xl font-extrabold tracking-[-0.03em] text-[#1754E8]">{money(selectedInvoices.reduce((sum, invoice) => sum + invoice.balance, 0), data.settings.currency)}</p></div></div>
                <button type="button" onClick={() => setCheckoutOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2]"><LockKeyhole className="h-4 w-4" />Continue securely <ArrowRight className="h-4 w-4" /></button>
              </>}
            </div>
            <div className="border-t border-[#E3E9F1] bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-900/60"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><p className="text-[10px] leading-5 text-[#718096] dark:text-slate-400">CampusOS never collects or stores full card credentials. Razorpay and Stripe payment details remain on the provider-controlled checkout. Direct bank transfers are posted only after institution verification.</p></div></div>
          </div>
        </aside>
      </div>

      <PaymentCheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        invoices={selectedInvoices}
        data={data}
        onCompleted={async (message) => {
          setCheckoutOpen(false);
          setNotice({ tone: 'success', text: message });
          setSelectedIds(new Set());
          await loadPortal(true);
        }}
      />
    </div>
  );
}

function SummaryCards({ data }: { data: PaymentPortalData }) {
  const cards = [
    { label: 'Outstanding balance', value: money(data.summary.outstandingBalance, data.settings.currency), detail: `${data.summary.overdueInvoiceCount} overdue invoice${data.summary.overdueInvoiceCount === 1 ? '' : 's'}`, icon: CircleDollarSign },
    { label: 'Next due date', value: shortDate(data.summary.nextDueDate), detail: data.summary.nextDueDate ? 'Next recorded unpaid due date' : 'No upcoming unpaid invoice', icon: CalendarDays },
    { label: 'Last confirmed payment', value: data.summary.lastPaymentAmount == null ? '—' : money(data.summary.lastPaymentAmount, data.settings.currency), detail: data.summary.lastPaymentDate ? shortDate(data.summary.lastPaymentDate) : 'No confirmed payment yet', icon: BadgeCheck },
    { label: 'Under verification', value: data.summary.pendingVerificationCount, detail: 'Direct bank transfers awaiting finance review', icon: Clock3 },
  ];
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-[22px] border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_26px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7D899B]">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] dark:text-white">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><Icon className="h-4.5 w-4.5" /></span></div><p className="mt-3 text-[11px] leading-5 text-[#8793A4]">{detail}</p></article>)}</section>;
}

function TransactionsTable({ transactions, currency }: { transactions: PaymentPortalTransaction[]; currency: string }) {
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-lg font-extrabold tracking-[-0.025em] text-[#101D38] dark:text-white">Payment activity</h2><p className="mt-1 text-xs text-[#7A8798]">Provider confirmations, recorded payments and manual-transfer reviews.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] border-collapse text-left"><thead><tr className="border-b border-[#E3E9F1] bg-[#F7F9FC] text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7C899B] dark:border-slate-800 dark:bg-slate-900"><th className="p-4">Reference</th><th className="p-4">Date</th><th className="p-4">Method</th><th className="p-4">Fee record</th><th className="p-4 text-right">Amount</th><th className="p-4 text-center">Status</th><th className="p-4">Receipt / detail</th></tr></thead><tbody className="divide-y divide-[#EEF2F6] dark:divide-slate-800">{transactions.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-sm text-[#8B96A7]">No payment activity is recorded yet.</td></tr> : transactions.slice(0, 25).map((transaction) => <tr key={`${transaction.id}-${transaction.date}`}><td className="max-w-[180px] truncate p-4 font-mono text-[11px] font-bold text-[#344054] dark:text-slate-200">{transaction.providerReference || transaction.id}</td><td className="p-4 text-xs text-[#667085] dark:text-slate-400">{shortDateTime(transaction.date)}</td><td className="p-4 text-xs font-semibold text-[#526071] dark:text-slate-300">{transaction.method.replace(/_/g, ' ')}</td><td className="max-w-[220px] truncate p-4 text-xs text-[#667085] dark:text-slate-400">{transaction.invoiceLabel}</td><td className="p-4 text-right text-xs font-extrabold text-[#101D38] dark:text-white">{money(transaction.amount, currency)}</td><td className="p-4 text-center"><TransactionBadge status={transaction.status} /></td><td className="p-4 text-[11px] text-[#7A8798]">{transaction.receiptNo || transaction.detail || '—'}</td></tr>)}</tbody></table></div></section>;
}

function TransactionBadge({ status }: { status: PaymentPortalTransaction['status'] }) {
  const tone = status === 'SUCCESSFUL' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'FAILED' || status === 'REJECTED' ? 'border-rose-200 bg-rose-50 text-rose-700' : status === 'REFUNDED' ? 'border-slate-200 bg-slate-100 text-slate-700' : status === 'VERIFICATION_PENDING' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-blue-700';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] ${tone}`}>{status.replace(/_/g, ' ')}</span>;
}

function FinanceOperationsWorkspace({ data, notice, setNotice, tab, setTab, refresh }: { data: PaymentPortalData; notice: Notice; setNotice: (value: Notice) => void; tab: 'verification' | 'settings' | 'transactions'; setTab: (value: 'verification' | 'settings' | 'transactions') => void; refresh: () => Promise<void> }) {
  const enabledGateways = Number(data.settings.razorpayEnabled && data.settings.gatewayAvailability.razorpay) + Number(data.settings.stripeEnabled && data.settings.gatewayAvailability.stripe);
  return <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-16"><section className="overflow-hidden rounded-[28px] border border-[#D8E3F0] bg-white shadow-[0_18px_55px_rgba(16,29,56,0.07)]"><div className="grid gap-6 bg-[radial-gradient(circle_at_88%_12%,rgba(45,112,255,0.2),transparent_28%),linear-gradient(135deg,#101D38,#14345C)] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#D6E4FB]"><Landmark className="h-3.5 w-3.5" />Institution finance operations</div><h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] sm:text-[42px]">Payment verification & collection setup</h1><p className="mt-4 max-w-[850px] text-sm leading-7 text-[#C3D0E3]">Control which payment channels students can use, review direct bank-transfer evidence and keep confirmed payments connected to the institution ledger.</p></div><button type="button" onClick={() => void refresh()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-4 text-xs font-extrabold text-white"><RefreshCcw className="h-4 w-4" />Refresh records</button></div></section>
  {notice && <div className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${noticeClasses(notice.tone)}`}><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)} className="rounded-lg p-1"><X className="h-4 w-4" /></button></div>}
  <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><OperationsMetric label="Pending verification" value={data.reviewQueue.length} detail="Manual bank transfers needing a decision" icon={FileCheck2} /><OperationsMetric label="Online gateways" value={enabledGateways} detail="Enabled and credential-ready providers" icon={CreditCard} /><OperationsMetric label="Direct bank transfer" value={data.settings.bankTransferEnabled ? 'Enabled' : 'Off'} detail={data.settings.bankTransferEnabled ? data.settings.bankName || 'Institution bank account configured' : 'Students cannot submit direct transfers'} icon={Landmark} /><OperationsMetric label="Recent transactions" value={data.transactions.length} detail="Latest tenant payment records loaded" icon={ReceiptIndianRupee} /></section>
  <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)]"><div className="flex flex-wrap gap-2 border-b border-[#E3E9F1] p-4">{([['verification','Verification queue',FileCheck2],['settings','Payment setup',Settings2],['transactions','Transactions',ReceiptIndianRupee]] as const).map(([id,label,Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold transition ${tab === id ? 'bg-[#1754E8] text-white shadow-[0_8px_18px_rgba(23,84,232,0.2)]' : 'bg-[#F7F9FC] text-[#607086] hover:bg-[#EEF3F8]'}`}><Icon className="h-4 w-4" />{label}{id === 'verification' && data.reviewQueue.length > 0 && <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${tab === id ? 'bg-white/20' : 'bg-amber-100 text-amber-700'}`}>{data.reviewQueue.length}</span>}</button>)}</div>
    <div className="p-5 sm:p-6">{tab === 'verification' ? <VerificationQueue items={data.reviewQueue} currency={data.settings.currency} onChanged={async (message) => { setNotice({ tone: 'success', text: message }); await refresh(); }} /> : tab === 'settings' ? <PaymentSettingsForm data={data} onSaved={async () => { setNotice({ tone: 'success', text: 'Institution payment settings saved.' }); await refresh(); }} /> : <TransactionsTable transactions={data.transactions} currency={data.settings.currency} />}</div>
  </section></div>;
}

function OperationsMetric({ label, value, detail, icon: Icon }: { label: string; value: React.ReactNode; detail: string; icon: typeof FileCheck2 }) {
  return <article className="rounded-[22px] border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_26px_rgba(16,29,56,0.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7D899B]">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38]">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4.5 w-4.5" /></span></div><p className="mt-3 text-[11px] leading-5 text-[#8793A4]">{detail}</p></article>;
}

function VerificationQueue({ items, currency, onChanged }: { items: ManualPaymentReviewItem[]; currency: string; onChanged: (message: string) => Promise<void> }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  async function review(item: ManualPaymentReviewItem, action: 'APPROVE' | 'REJECT') {
    const note = notes[item.id]?.trim() ?? '';
    if (action === 'REJECT' && note.length < 3) { setError('Add a short reason before rejecting a transfer.'); return; }
    setBusyId(item.id); setError('');
    try {
      const response = await fetch(`/api/payments/manual-transfer/${encodeURIComponent(item.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }) });
      const payload = await readJson<{ receiptNumber?: string; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to review transfer.');
      await onChanged(action === 'APPROVE' ? `Transfer ${item.transactionReference} approved${payload.receiptNumber ? ` · Receipt ${payload.receiptNumber}` : ''}.` : `Transfer ${item.transactionReference} rejected.`);
    } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : 'Unable to review transfer.'); } finally { setBusyId(''); }
  }
  if (items.length === 0) return <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-10 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" /><p className="mt-3 text-sm font-extrabold text-[#344054]">No bank transfers are waiting for review</p><p className="mt-1 text-xs text-[#8290A2]">New student/parent submissions will appear here with their UTR and uploaded evidence.</p></div>;
  return <div className="space-y-4">{error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}{items.map((item) => <article key={item.id} className="rounded-2xl border border-[#DCE4EE] bg-[#FBFCFE] p-4 sm:p-5"><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.07em] text-amber-700">{item.status.replace(/_/g, ' ')}</span><span className="text-[11px] text-[#8290A2]">Submitted {shortDateTime(item.createdAt)}</span></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><ReviewField label="Payer" value={item.payerName} detail={item.payerEmail} /><ReviewField label="Transfer / UTR" value={item.transactionReference} detail={item.bankName || 'Bank not specified'} /><ReviewField label="Amount" value={money(item.amount, item.currency || currency)} detail={`${item.invoiceIds.length} invoice${item.invoiceIds.length === 1 ? '' : 's'}`} /><ReviewField label="Transfer date" value={shortDate(item.transferDate)} detail={item.proofFileName} /></div>{item.payerNote && <p className="mt-4 rounded-xl bg-white p-3 text-xs leading-5 text-[#667085]">{item.payerNote}</p>}</div><div className="space-y-3"><a href={`/api/payments/manual-transfer/${encodeURIComponent(item.id)}/proof`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#C8D5E5] bg-white px-4 text-xs font-extrabold text-[#344054] hover:border-[#1754E8] hover:text-[#1754E8]"><ExternalLink className="h-4 w-4" />Open payment proof</a><textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((previous) => ({ ...previous, [item.id]: event.target.value }))} placeholder="Review note / rejection reason" rows={2} className="w-full resize-none rounded-xl border border-[#D4DEEA] bg-white p-3 text-xs outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" /><div className="grid grid-cols-2 gap-2"><button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'REJECT')} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-extrabold text-rose-700 disabled:opacity-50"><XCircle className="h-4 w-4" />Reject</button><button type="button" disabled={busyId === item.id} onClick={() => void review(item, 'APPROVE')} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-xs font-extrabold text-white disabled:opacity-50">{busyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Approve</button></div></div></div></article>)}</div>;
}

function ReviewField({ label, value, detail }: { label: string; value: string; detail: string }) { return <div><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8A96A7]">{label}</p><p className="mt-1 truncate text-xs font-extrabold text-[#344054]">{value}</p><p className="mt-1 truncate text-[10px] text-[#8290A2]">{detail}</p></div>; }

function PaymentSettingsForm({ data, onSaved }: { data: PaymentPortalData; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<PaymentPortalSettings>(data.settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setForm(data.settings), [data.settings]);
  function field<K extends keyof PaymentPortalSettings>(key: K, value: PaymentPortalSettings[K]) { setForm((previous) => ({ ...previous, [key]: value })); }
  async function save(event: React.FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { const response = await fetch('/api/payments/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpayEnabled: form.razorpayEnabled, stripeEnabled: form.stripeEnabled, bankTransferEnabled: form.bankTransferEnabled, currency: form.currency, accountName: form.accountName, bankName: form.bankName, accountNumber: form.accountNumber, ifscCode: form.ifscCode, branchName: form.branchName, upiId: form.upiId, paymentInstructions: form.paymentInstructions }) }); const payload = await readJson<{ error?: string }>(response); if (!response.ok) throw new Error(payload.error || 'Unable to save payment settings.'); await onSaved(); } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : 'Unable to save payment settings.'); } finally { setSaving(false); } }
  return <form onSubmit={save} className="space-y-6"><div><h3 className="text-base font-extrabold text-[#101D38]">Online payment providers</h3><p className="mt-1 text-xs leading-5 text-[#7A8798]">The institution can enable a provider only when server-side credentials exist. Secret keys are never shown in this UI.</p></div>{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}<div className="grid gap-4 md:grid-cols-2"><ProviderToggle label="Razorpay" description="Indian cards, UPI and other methods offered by Razorpay Checkout." enabled={form.razorpayEnabled} available={form.gatewayAvailability.razorpay} onChange={(value) => field('razorpayEnabled', value)} /><ProviderToggle label="Stripe" description="Hosted Stripe Checkout. CampusOS does not collect card details." enabled={form.stripeEnabled} available={form.gatewayAvailability.stripe} onChange={(value) => field('stripeEnabled', value)} /></div><div className="rounded-2xl border border-[#DCE4EE] p-5"><label className="flex items-start justify-between gap-4"><span><span className="block text-sm font-extrabold text-[#101D38]">Direct bank transfer</span><span className="mt-1 block text-xs leading-5 text-[#7A8798]">Show institution bank details to payers and require UTR + screenshot/PDF verification.</span></span><input type="checkbox" checked={form.bankTransferEnabled} onChange={(event) => field('bankTransferEnabled', event.target.checked)} className="mt-1 h-5 w-5 rounded border-[#B7C4D4] text-[#1754E8] focus:ring-[#1754E8]" /></label>{form.bankTransferEnabled && <div className="mt-5 grid gap-4 md:grid-cols-2"><TextField label="Account name" value={form.accountName} onChange={(value) => field('accountName', value)} /><TextField label="Bank name" value={form.bankName} onChange={(value) => field('bankName', value)} /><TextField label="Account number" value={form.accountNumber} onChange={(value) => field('accountNumber', value)} /><TextField label="IFSC / routing code" value={form.ifscCode} onChange={(value) => field('ifscCode', value)} /><TextField label="Branch" value={form.branchName} onChange={(value) => field('branchName', value)} /><TextField label="UPI ID (optional)" value={form.upiId} onChange={(value) => field('upiId', value)} /><label className="md:col-span-2"><span className="text-xs font-bold text-[#475467]">Transfer instructions</span><textarea rows={3} value={form.paymentInstructions} onChange={(event) => field('paymentInstructions', event.target.value)} className="mt-2 w-full rounded-xl border border-[#D4DEEA] p-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" placeholder="Example: Add student roll number in transfer remarks." /></label></div>}</div><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F7F9FC] p-4"><label className="flex items-center gap-3 text-xs font-bold text-[#475467]">Settlement currency<select value={form.currency} onChange={(event) => field('currency', event.target.value)} className="min-h-10 rounded-xl border border-[#D4DEEA] bg-white px-3"><option value="INR">INR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></label><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}Save payment setup</button></div></form>;
}

function ProviderToggle({ label, description, enabled, available, onChange }: { label: string; description: string; enabled: boolean; available: boolean; onChange: (value: boolean) => void }) { return <label className={`rounded-2xl border p-4 ${enabled && available ? 'border-emerald-200 bg-emerald-50/60' : 'border-[#DCE4EE] bg-white'}`}><div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${available ? 'bg-[#EDF3FF] text-[#1754E8]' : 'bg-slate-100 text-slate-400'}`}><CreditCard className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-sm font-extrabold text-[#101D38]">{label}</span><input type="checkbox" checked={enabled} disabled={!available} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-[#B7C4D4] text-[#1754E8] focus:ring-[#1754E8] disabled:opacity-40" /></span><span className="mt-1 block text-xs leading-5 text-[#7A8798]">{description}</span><span className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${available ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{available ? 'Server credentials ready' : 'Credentials required'}</span></span></div></label>; }
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="text-xs font-bold text-[#475467]">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" /></label>; }

function PaymentCheckoutDrawer({ open, onClose, invoices, data, onCompleted }: { open: boolean; onClose: () => void; invoices: PaymentPortalInvoice[]; data: PaymentPortalData; onCompleted: (message: string) => Promise<void> }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ active: open, containerRef: panelRef, initialFocusRef: closeRef });
  const [step, setStep] = useState<'methods' | 'bank' | 'success'>('methods');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payerNote, setPayerNote] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const total = invoices.reduce((sum, invoice) => sum + invoice.balance, 0);
  const invoiceIds = invoices.map((invoice) => invoice.id);

  useEffect(() => { if (!open) { setStep('methods'); setBusy(''); setError(''); setReceipt(''); setTransactionReference(''); setBankName(''); setPayerNote(''); setProof(null); } }, [open]);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); }; document.addEventListener('keydown', onKey); const previous = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previous; }; }, [busy, onClose, open]);

  async function ensureRazorpayScript() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script); });
  }

  async function startProvider(provider: 'RAZORPAY' | 'STRIPE') {
    setBusy(provider); setError('');
    try {
      const response = await fetch('/api/payments/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, invoiceIds }) });
      const payload = await readJson<CheckoutPayload & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || `Unable to start ${provider}.`);
      if (payload.provider === 'STRIPE') { window.location.assign(payload.checkoutUrl); return; }
      const loaded = await ensureRazorpayScript();
      if (!loaded || !window.Razorpay) throw new Error('Razorpay Checkout could not load. Check the network connection and try again.');
      const checkout = new window.Razorpay({ key: payload.keyId, amount: payload.amount, currency: payload.currency, name: payload.institutionName, description: `${invoices.length} fee invoice${invoices.length === 1 ? '' : 's'}`, order_id: payload.orderId, prefill: { name: payload.payer.name, email: payload.payer.email, contact: payload.payer.phone }, theme: { color: '#1754E8' }, modal: { ondismiss: () => setBusy('') }, handler: async (result) => { setBusy('VERIFYING'); const verify = await fetch('/api/payments/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) }); const confirmation = await readJson<{ receiptNumber?: string; error?: string }>(verify); if (!verify.ok) { setBusy(''); setError(confirmation.error || 'Razorpay payment could not be confirmed yet.'); return; } setReceipt(confirmation.receiptNumber || 'Confirmed'); setStep('success'); setBusy(''); } });
      checkout.open();
    } catch (caughtError) { setBusy(''); setError(caughtError instanceof Error ? caughtError.message : 'Unable to start payment.'); }
  }

  async function submitBankTransfer(event: React.FormEvent) {
    event.preventDefault(); setError(''); if (!proof) { setError('Attach the bank transfer screenshot, receipt or PDF.'); return; } setBusy('BANK');
    try { const form = new FormData(); form.set('invoiceIds', JSON.stringify(invoiceIds)); form.set('transactionReference', transactionReference); form.set('bankName', bankName); form.set('transferDate', transferDate); form.set('payerNote', payerNote); form.set('proof', proof); const response = await fetch('/api/payments/manual-transfer', { method: 'POST', body: form }); const payload = await readJson<{ message?: string; error?: string }>(response); if (!response.ok) throw new Error(payload.error || 'Unable to submit transfer proof.'); await onCompleted(payload.message || 'Transfer proof submitted for institution verification.'); } catch (caughtError) { setError(caughtError instanceof Error ? caughtError.message : 'Unable to submit transfer proof.'); } finally { setBusy(''); }
  }

  if (!open) return null;
  return <><button type="button" onClick={() => !busy && onClose()} className="fixed inset-0 cursor-default bg-[#071225]/55 backdrop-blur-[2px]" style={{ zIndex: 75 }} aria-label="Close payment panel" /><div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="payment-panel-title" tabIndex={-1} className="fixed inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-[#D8E2EE] bg-white shadow-[-24px_0_70px_rgba(7,18,37,0.18)] outline-none" style={{ zIndex: 80 }}><header className="flex items-center justify-between gap-4 border-b border-[#E1E7EF] px-5 py-4 sm:px-6"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#7C899B]">Institution fee payment</p><h2 id="payment-panel-title" className="mt-1 text-lg font-extrabold text-[#101D38]">{step === 'bank' ? 'Submit bank transfer proof' : step === 'success' ? 'Payment confirmed' : 'Choose payment method'}</h2></div><button ref={closeRef} type="button" onClick={onClose} disabled={Boolean(busy)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1EC] text-[#607086] disabled:opacity-40" aria-label="Close payment panel"><X className="h-4 w-4" /></button></header><div className="flex-1 overflow-y-auto p-5 sm:p-6"><div className="mb-6 flex items-end justify-between gap-3 rounded-2xl bg-[#EDF3FF] p-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#5D78A8]">Amount payable</p><p className="mt-1 text-xs text-[#6D7F99]">{invoices.length} selected invoice{invoices.length === 1 ? '' : 's'}</p></div><p className="text-2xl font-extrabold tracking-[-0.035em] text-[#1754E8]">{money(total, data.settings.currency)}</p></div>{error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}{step === 'methods' && <div className="space-y-3"><PaymentMethodCard icon={CreditCard} title="Razorpay" description="Use Razorpay Checkout for institution-enabled cards, UPI and supported methods." enabled={data.settings.razorpayEnabled && data.settings.gatewayAvailability.razorpay} busy={busy === 'RAZORPAY'} onClick={() => void startProvider('RAZORPAY')} /><PaymentMethodCard icon={WalletCards} title="Stripe Checkout" description="Continue to Stripe's hosted payment page. CampusOS never receives full card details." enabled={data.settings.stripeEnabled && data.settings.gatewayAvailability.stripe} busy={busy === 'STRIPE'} onClick={() => void startProvider('STRIPE')} /><PaymentMethodCard icon={Landmark} title="Direct bank transfer" description="Transfer to the institution account, then submit UTR and payment proof for finance verification." enabled={data.settings.bankTransferEnabled} onClick={() => setStep('bank')} />{!data.settings.razorpayEnabled && !data.settings.stripeEnabled && !data.settings.bankTransferEnabled && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">Your institution has not enabled a payment channel yet. Contact the finance office.</div>}</div>}{step === 'bank' && <form onSubmit={submitBankTransfer} className="space-y-5"><div className="rounded-2xl border border-[#DCE4EE] bg-[#F8FAFC] p-4"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[#1754E8]" /><p className="text-xs font-extrabold text-[#344054]">Transfer to {data.institution.name}</p></div><div className="mt-4 grid gap-3 text-xs"><BankRow label="Account name" value={data.settings.accountName} /><BankRow label="Bank" value={data.settings.bankName} /><BankRow label="Account number" value={data.settings.accountNumber} copy /><BankRow label="IFSC / routing" value={data.settings.ifscCode} copy />{data.settings.branchName && <BankRow label="Branch" value={data.settings.branchName} />}{data.settings.upiId && <BankRow label="UPI ID" value={data.settings.upiId} copy />}</div>{data.settings.paymentInstructions && <p className="mt-4 rounded-xl bg-white p-3 text-[11px] leading-5 text-[#667085]">{data.settings.paymentInstructions}</p>}</div><div className="grid gap-4 sm:grid-cols-2"><TextInput label="Transaction / UTR reference" value={transactionReference} onChange={setTransactionReference} required placeholder="UTR / bank reference" /><TextInput label="Bank used to transfer" value={bankName} onChange={setBankName} placeholder="Your bank name" /><label><span className="text-xs font-bold text-[#475467]">Transfer date</span><input required type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" /></label><label className="sm:col-span-2"><span className="text-xs font-bold text-[#475467]">Screenshot / receipt / PDF</span><span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#C9D5E5] bg-[#FAFBFD] px-4 text-center"><UploadCloud className="h-6 w-6 text-[#1754E8]" /><span className="mt-2 text-xs font-bold text-[#475467]">{proof ? proof.name : 'Choose payment proof'}</span><span className="mt-1 text-[10px] text-[#8A96A7]">JPG, PNG, WebP or PDF · maximum 3 MB</span><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={(event) => setProof(event.target.files?.[0] ?? null)} className="sr-only" /></span></label><label className="sm:col-span-2"><span className="text-xs font-bold text-[#475467]">Note (optional)</span><textarea rows={3} value={payerNote} onChange={(event) => setPayerNote(event.target.value)} className="mt-2 w-full resize-none rounded-xl border border-[#D4DEEA] p-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" placeholder="Any information finance should know" /></label></div><div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-[11px] leading-5 text-violet-800">Submitting proof does <strong>not</strong> mark an invoice paid. The institution finance team must match the UTR, amount and evidence before CampusOS posts the payment.</div><div className="grid grid-cols-[auto_1fr] gap-2"><button type="button" onClick={() => setStep('methods')} className="min-h-11 rounded-xl border border-[#D5DEEA] px-4 text-xs font-extrabold text-[#536175]">Back</button><button type="submit" disabled={busy === 'BANK'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white disabled:opacity-50">{busy === 'BANK' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}Submit for verification</button></div></form>}{step === 'success' && <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></span><h3 className="mt-6 text-2xl font-extrabold tracking-[-0.03em] text-[#101D38]">Payment confirmed</h3><p className="mt-3 max-w-sm text-sm leading-6 text-[#667085]">The provider confirmation was verified server-side and the selected invoices were posted to the institution payment ledger.</p><div className="mt-5 rounded-xl bg-[#F7F9FC] px-4 py-3 font-mono text-xs font-bold text-[#344054]">Receipt {receipt}</div><button type="button" onClick={() => void onCompleted(`Payment confirmed · Receipt ${receipt}.`)} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 text-xs font-extrabold text-white">Done <ChevronRight className="h-4 w-4" /></button></div>}</div></div></>;
}

function PaymentMethodCard({ icon: Icon, title, description, enabled, busy, onClick }: { icon: typeof CreditCard; title: string; description: string; enabled: boolean; busy?: boolean; onClick: () => void }) { return <button type="button" disabled={!enabled || busy} onClick={onClick} className="group flex w-full items-center gap-4 rounded-2xl border border-[#DCE4EE] bg-white p-4 text-left transition hover:border-[#AFC3DE] hover:shadow-[0_8px_24px_rgba(16,29,56,0.06)] disabled:cursor-not-allowed disabled:bg-[#F7F9FC] disabled:opacity-55"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-extrabold text-[#101D38]">{title}{enabled && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8px] font-extrabold uppercase text-emerald-700">Available</span>}</span><span className="mt-1 block text-xs leading-5 text-[#7A8798]">{enabled ? description : 'This payment channel is not enabled or configured by the institution.'}</span></span>{busy ? <Loader2 className="h-5 w-5 animate-spin text-[#1754E8]" /> : <ChevronRight className="h-5 w-5 text-[#9AA7B8] transition-transform group-hover:translate-x-0.5" />}</button>; }
function BankRow({ label, value, copy }: { label: string; value: string; copy?: boolean }) { const [copied, setCopied] = useState(false); async function doCopy() { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1300); } return <div className="flex items-center justify-between gap-4"><span className="text-[#7A8798]">{label}</span><span className="flex min-w-0 items-center gap-2"><strong className="max-w-[250px] truncate text-right text-[#344054]">{value || '—'}</strong>{copy && value && <button type="button" onClick={() => void doCopy()} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#D8E1EC] bg-white text-[#667085]" aria-label={`Copy ${label}`}>{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}</button>}</span></div>; }
function TextInput({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string }) { return <label><span className="text-xs font-bold text-[#475467]">{label}</span><input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" /></label>; }
function PaymentLoading() { return <div className="mx-auto flex min-h-[520px] w-full max-w-[1580px] items-center justify-center"><div className="rounded-3xl border border-[#DCE4EE] bg-white px-8 py-7 text-center shadow-[0_16px_45px_rgba(16,29,56,0.08)]"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1754E8]" /><p className="mt-4 text-sm font-extrabold text-[#344054]">Loading your payment workspace</p><p className="mt-1 text-xs text-[#8290A2]">Resolving authorised invoices, settings and payment records.</p></div></div>; }
function PaymentError({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="mx-auto flex min-h-[520px] w-full max-w-[1580px] items-center justify-center"><div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-[0_16px_45px_rgba(16,29,56,0.08)]"><AlertCircle className="mx-auto h-8 w-8 text-rose-600" /><p className="mt-4 text-base font-extrabold text-[#344054]">Payment workspace unavailable</p><p className="mt-2 text-sm leading-6 text-[#667085]">{message}</p><button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white"><RefreshCcw className="h-4 w-4" />Try again</button></div></div>; }
