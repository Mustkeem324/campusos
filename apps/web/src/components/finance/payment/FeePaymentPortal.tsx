'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
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
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';

import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';
import type {
  ManualPaymentReviewItem,
  PaymentPortalData,
  PaymentPortalInvoice,
  PaymentPortalSettings,
  PaymentPortalTransaction,
} from '@/lib/payment-portal-types';

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
type OpsTab = 'verification' | 'settings' | 'transactions';
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

const invoiceTone: Record<PaymentPortalInvoice['status'], string> = {
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

function dateLabel(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function dateTimeLabel(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

function NoticeBox({ notice, onClose }: { notice: NonNullable<Notice>; onClose: () => void }) {
  const tone = notice.tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : notice.tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : 'border-blue-200 bg-blue-50 text-blue-800';
  return <div role="status" className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${tone}`}><span>{notice.text}</span><button type="button" onClick={onClose} className="rounded-lg p-1" aria-label="Dismiss message"><X className="h-4 w-4" /></button></div>;
}

export function FeePaymentPortal() {
  const [data, setData] = useState<PaymentPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('OUTSTANDING');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [opsTab, setOpsTab] = useState<OpsTab>('verification');

  async function reload(silent = false) {
    if (!silent) setLoading(true);
    setFatalError('');
    try {
      const response = await fetch('/api/payments/portal', { cache: 'no-store' });
      const payload = await json<PaymentPortalData & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to load payment workspace.');
      setData(payload);
      setSelected((previous) => {
        const payable = new Set(payload.invoices.filter((item) => !['PAID', 'VERIFICATION_PENDING'].includes(item.status)).map((item) => item.id));
        return new Set([...previous].filter((id) => payable.has(id)));
      });
    } catch (error) {
      setFatalError(error instanceof Error ? error.message : 'Unable to load payment workspace.');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    const params = new URLSearchParams(window.location.search);
    const state = params.get('payment');
    const sessionId = params.get('session_id');
    if (state === 'cancelled') {
      setNotice({ tone: 'info', text: 'Stripe Checkout was cancelled. No CampusOS invoice was marked paid.' });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (state === 'success' && sessionId) {
      void (async () => {
        setNotice({ tone: 'info', text: 'Stripe reported a completed checkout. CampusOS is verifying the provider confirmation…' });
        const response = await fetch(`/api/payments/stripe/confirm?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
        const payload = await json<{ receiptNumber?: string; error?: string }>(response);
        if (response.ok) {
          setNotice({ tone: 'success', text: `Payment confirmed${payload.receiptNumber ? ` · Receipt ${payload.receiptNumber}` : ''}.` });
          await reload(true);
        } else {
          setNotice({ tone: 'info', text: payload.error || 'The payment is awaiting provider confirmation. Do not start another payment for the same invoice.' });
        }
        window.history.replaceState({}, '', window.location.pathname);
      })();
    }
  }, []);

  const selectedInvoices = useMemo(() => data?.invoices.filter((invoice) => selected.has(invoice.id)) ?? [], [data?.invoices, selected]);
  if (loading && !data) return <LoadingState />;
  if (!data) return <ErrorState message={fatalError || 'Payment workspace unavailable.'} retry={() => void reload()} />;

  if (!data.capabilities.canPay && data.capabilities.canReviewManualTransfers) {
    return <FinanceWorkspace data={data} tab={opsTab} setTab={setOpsTab} notice={notice} setNotice={setNotice} reload={() => reload(true)} />;
  }

  const query = search.trim().toLowerCase();
  const invoices = data.invoices.filter((invoice) => {
    const matchesQuery = !query || [invoice.invoiceNo, invoice.description, invoice.studentName, invoice.rollNumber].some((value) => value.toLowerCase().includes(query));
    const matchesFilter = filter === 'ALL'
      || (filter === 'OUTSTANDING' && !['PAID', 'UPCOMING'].includes(invoice.status))
      || invoice.status === filter;
    return matchesQuery && matchesFilter;
  });

  function toggle(invoice: PaymentPortalInvoice) {
    if (['PAID', 'VERIFICATION_PENDING'].includes(invoice.status)) return;
    setSelected((previous) => {
      const next = new Set(previous);
      next.has(invoice.id) ? next.delete(invoice.id) : next.add(invoice.id);
      return next;
    });
  }

  return <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-16">
    <Hero institution={data.institution.name} payer={data.payer.name} />
    {notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}
    {fatalError && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{fatalError}</div>}
    <PayerMetrics data={data} />

    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
      <div className="min-w-0 space-y-6">
        <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 border-b border-[#E3E9F1] p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Invoices & dues</h2><p className="mt-1 text-xs text-[#7A8798]">Authorised fee records for this account.</p></div>
            <button type="button" onClick={() => void reload(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DFEB] px-3 text-xs font-bold text-[#536175]"><RefreshCcw className="h-4 w-4" />Refresh</button>
          </div>
          <div className="grid gap-3 border-b border-[#E3E9F1] bg-[#FAFBFD] p-4 sm:grid-cols-[minmax(0,1fr)_auto] dark:border-slate-800 dark:bg-slate-900/40">
            <label className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, fee or student…" className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10 dark:border-slate-700 dark:bg-slate-950" /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm font-semibold text-[#526071] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"><option value="OUTSTANDING">Outstanding</option><option value="OVERDUE">Overdue</option><option value="DUE">Due</option><option value="UPCOMING">Upcoming</option><option value="VERIFICATION_PENDING">Verification pending</option><option value="PAID">Paid</option><option value="ALL">All</option></select>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead><tr className="border-b border-[#E3E9F1] bg-[#F7F9FC] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B] dark:border-slate-800 dark:bg-slate-900"><th className="w-14 p-4 text-center">Pay</th><th className="p-4">Invoice</th><th className="p-4">Student</th><th className="p-4">Due date</th><th className="p-4 text-right">Amount</th><th className="p-4 text-right">Paid</th><th className="p-4 text-right">Balance</th><th className="p-4 text-center">Status</th></tr></thead><tbody className="divide-y divide-[#EEF2F6] dark:divide-slate-800">{invoices.length === 0 ? <tr><td colSpan={8} className="p-12 text-center"><FileText className="mx-auto h-8 w-8 text-[#B2BDCB]" /><p className="mt-3 text-sm font-bold text-[#536175]">No invoices match this view.</p></td></tr> : invoices.map((invoice) => {
            const selectable = !['PAID', 'VERIFICATION_PENDING'].includes(invoice.status);
            return <tr key={invoice.id} className={selected.has(invoice.id) ? 'bg-[#F4F7FF] dark:bg-blue-950/15' : ''}><td className="p-4 text-center"><input type="checkbox" checked={selected.has(invoice.id)} disabled={!selectable} onChange={() => toggle(invoice)} aria-label={`Select ${invoice.invoiceNo}`} className="h-4 w-4 rounded border-[#B8C5D6] text-[#1754E8]" /></td><td className="p-4"><p className="font-mono text-xs font-bold text-[#101D38] dark:text-white">{invoice.invoiceNo}</p><p className="mt-1 max-w-[220px] truncate text-xs text-[#748195]">{invoice.description}</p></td><td className="p-4"><p className="text-xs font-bold text-[#344054] dark:text-slate-200">{invoice.studentName}</p><p className="mt-1 text-[11px] text-[#8B96A7]">{invoice.rollNumber}</p></td><td className="p-4 text-xs text-[#536175] dark:text-slate-300">{dateLabel(invoice.dueDate)}</td><td className="p-4 text-right text-xs text-[#536175]">{money(invoice.amount, data.settings.currency)}</td><td className="p-4 text-right text-xs text-[#748195]">{money(invoice.paid, data.settings.currency)}</td><td className="p-4 text-right text-sm font-extrabold text-[#101D38] dark:text-white">{money(invoice.balance, data.settings.currency)}</td><td className="p-4 text-center"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${invoiceTone[invoice.status]}`}>{invoice.status.replace(/_/g, ' ')}</span></td></tr>;
          })}</tbody></table></div>
        </section>
        <TransactionList transactions={data.transactions} currency={data.settings.currency} />
      </div>

      <aside className="min-w-0"><div className="sticky top-[calc(var(--layout-top)+1rem)] overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_16px_42px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-base font-extrabold text-[#101D38] dark:text-white">Payment summary</h2><p className="mt-1 text-xs text-[#7B8798]">{selectedInvoices.length} selected</p></div><div className="space-y-4 p-5">{selectedInvoices.length === 0 ? <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-6 text-center dark:border-slate-700 dark:bg-slate-900"><ReceiptIndianRupee className="mx-auto h-7 w-7 text-[#9AA7B8]" /><p className="mt-3 text-xs font-bold text-[#536175]">Select an outstanding invoice.</p></div> : <><div className="max-h-52 space-y-2 overflow-y-auto">{selectedInvoices.map((invoice) => <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FC] px-3 py-2.5 dark:bg-slate-900"><div className="min-w-0"><p className="truncate text-[11px] font-bold text-[#344054] dark:text-slate-200">{invoice.description}</p><p className="mt-0.5 text-[10px] text-[#8A96A7]">{invoice.invoiceNo}</p></div><span className="shrink-0 text-xs font-extrabold text-[#101D38] dark:text-white">{money(invoice.balance, data.settings.currency)}</span></div>)}</div><div className="border-t border-dashed border-[#D7E0EA] pt-4"><div className="flex items-end justify-between"><span className="text-xs font-bold text-[#536175]">Total payable</span><span className="text-xl font-extrabold text-[#1754E8]">{money(selectedInvoices.reduce((sum, item) => sum + item.balance, 0), data.settings.currency)}</span></div></div><button type="button" onClick={() => setCheckoutOpen(true)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.24)]"><LockKeyhole className="h-4 w-4" />Continue securely <ArrowRight className="h-4 w-4" /></button></>}</div><div className="border-t border-[#E3E9F1] bg-[#F8FAFC] p-4 text-[10px] leading-5 text-[#718096] dark:border-slate-800 dark:bg-slate-900/60"><ShieldCheck className="mr-2 inline h-4 w-4 text-emerald-600" />CampusOS never stores full card credentials. Manual transfers are posted only after finance verification.</div></div></aside>
    </div>

    <PaymentDrawer open={checkoutOpen} onClose={() => setCheckoutOpen(false)} invoices={selectedInvoices} data={data} onComplete={async (message) => { setCheckoutOpen(false); setSelected(new Set()); setNotice({ tone: 'success', text: message }); await reload(true); }} />
  </div>;
}

function Hero({ institution, payer }: { institution: string; payer: string }) {
  return <section className="overflow-hidden rounded-[28px] border border-[#D8E3F0] shadow-[0_18px_55px_rgba(16,29,56,0.07)]"><div className="grid gap-8 bg-[radial-gradient(circle_at_88%_15%,rgba(42,111,255,0.18),transparent_31%),linear-gradient(135deg,#101D38_0%,#142A52_58%,#0B3762_100%)] p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#D5E4FF]"><ShieldCheck className="h-3.5 w-3.5" />Secure fee centre</div><h1 className="mt-5 max-w-[850px] text-3xl font-extrabold tracking-[-0.04em] sm:text-[42px]">Institution fees, provider-confirmed payments and reviewed bank transfers</h1><p className="mt-4 max-w-[850px] text-sm leading-7 text-[#C2D0E4] sm:text-base">Pay published invoices through institution-enabled channels. Every confirmed payment is tied back to the ledger.</p></div><div className="rounded-2xl border border-white/15 bg-white/[0.07] p-4 lg:min-w-[270px]"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9FB7D8]">Beneficiary</p><p className="mt-2 text-sm font-extrabold">{institution}</p><p className="mt-1 text-xs text-[#B8C8DD]">Signed in as {payer}</p></div></div></section>;
}

function PayerMetrics({ data }: { data: PaymentPortalData }) {
  const cards = [
    ['Outstanding', money(data.summary.outstandingBalance, data.settings.currency), `${data.summary.overdueInvoiceCount} overdue`, CircleDollarSign],
    ['Next due date', dateLabel(data.summary.nextDueDate), 'Next recorded unpaid due date', CalendarDays],
    ['Last confirmed', data.summary.lastPaymentAmount == null ? '—' : money(data.summary.lastPaymentAmount, data.settings.currency), dateLabel(data.summary.lastPaymentDate), BadgeCheck],
    ['Under verification', String(data.summary.pendingVerificationCount), 'Bank transfers awaiting finance', Clock3],
  ] as const;
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, detail, Icon]) => <article key={label} className="rounded-[22px] border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_26px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7D899B]">{label}</p><p className="mt-2 text-2xl font-extrabold text-[#101D38] dark:text-white">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-[18px] w-[18px]" /></span></div><p className="mt-3 text-[11px] text-[#8793A4]">{detail}</p></article>)}</section>;
}

function TransactionList({ transactions, currency }: { transactions: PaymentPortalTransaction[]; currency: string }) {
  return <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)] dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-[#E3E9F1] p-5 dark:border-slate-800"><h2 className="text-lg font-extrabold text-[#101D38] dark:text-white">Payment activity</h2><p className="mt-1 text-xs text-[#7A8798]">Confirmed payments, pending provider attempts and manual review states.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left"><thead><tr className="bg-[#F7F9FC] text-[10px] font-extrabold uppercase text-[#7C899B] dark:bg-slate-900"><th className="p-4">Reference</th><th className="p-4">Date</th><th className="p-4">Method</th><th className="p-4">Record</th><th className="p-4 text-right">Amount</th><th className="p-4">Status</th></tr></thead><tbody className="divide-y divide-[#EEF2F6] dark:divide-slate-800">{transactions.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-sm text-[#8B96A7]">No payment activity yet.</td></tr> : transactions.slice(0, 25).map((item) => <tr key={`${item.id}-${item.date}`}><td className="max-w-[190px] truncate p-4 font-mono text-[11px] font-bold">{item.providerReference || item.id}</td><td className="p-4 text-xs text-[#667085]">{dateTimeLabel(item.date)}</td><td className="p-4 text-xs font-semibold">{item.method.replace(/_/g, ' ')}</td><td className="max-w-[200px] truncate p-4 text-xs text-[#667085]">{item.invoiceLabel}</td><td className="p-4 text-right text-xs font-extrabold">{money(item.amount, currency)}</td><td className="p-4"><StatusBadge status={item.status} /></td></tr>)}</tbody></table></div></section>;
}

function StatusBadge({ status }: { status: PaymentPortalTransaction['status'] }) {
  const tone = status === 'SUCCESSFUL' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : status === 'FAILED' || status === 'REJECTED' ? 'border-rose-200 bg-rose-50 text-rose-700' : status === 'VERIFICATION_PENDING' ? 'border-violet-200 bg-violet-50 text-violet-700' : 'border-blue-200 bg-blue-50 text-blue-700';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase ${tone}`}>{status.replace(/_/g, ' ')}</span>;
}

function FinanceWorkspace({ data, tab, setTab, notice, setNotice, reload }: { data: PaymentPortalData; tab: OpsTab; setTab: (tab: OpsTab) => void; notice: Notice; setNotice: (notice: Notice) => void; reload: () => Promise<void> }) {
  const tabs: Array<[OpsTab, string, typeof FileCheck2]> = [['verification', 'Verification queue', FileCheck2], ['transactions', 'Transactions', ReceiptIndianRupee]];
  if (data.capabilities.canManagePaymentSettings) tabs.splice(1, 0, ['settings', 'Payment setup', Settings2]);
  return <div className="mx-auto w-full max-w-[1580px] space-y-6 pb-16"><section className="overflow-hidden rounded-[28px] border border-[#D8E3F0]"><div className="grid gap-6 bg-[linear-gradient(135deg,#101D38,#14345C)] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold uppercase"><Landmark className="h-3.5 w-3.5" />Institution finance operations</div><h1 className="mt-5 text-3xl font-extrabold sm:text-[42px]">Payment verification & collection setup</h1><p className="mt-4 max-w-[850px] text-sm leading-7 text-[#C3D0E3]">Review direct bank transfers, maintain permitted collection channels and inspect recent payment records.</p></div><button type="button" onClick={() => void reload()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-4 text-xs font-extrabold"><RefreshCcw className="h-4 w-4" />Refresh</button></div></section>{notice && <NoticeBox notice={notice} onClose={() => setNotice(null)} />}<section className="grid gap-4 sm:grid-cols-3"><Metric label="Pending verification" value={String(data.reviewQueue.length)} detail="Manual transfers requiring review" icon={FileCheck2} /><Metric label="Online providers" value={String(Number(data.settings.razorpayEnabled && data.settings.gatewayAvailability.razorpay) + Number(data.settings.stripeEnabled && data.settings.gatewayAvailability.stripe))} detail="Enabled and credential-ready" icon={CreditCard} /><Metric label="Direct bank transfer" value={data.settings.bankTransferEnabled ? 'Enabled' : 'Off'} detail={data.settings.bankName || 'Institution beneficiary setup'} icon={Landmark} /></section><section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white"><div className="flex flex-wrap gap-2 border-b border-[#E3E9F1] p-4">{tabs.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-xs font-extrabold ${tab === id ? 'bg-[#1754E8] text-white' : 'bg-[#F7F9FC] text-[#607086]'}`}><Icon className="h-4 w-4" />{label}{id === 'verification' && data.reviewQueue.length > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">{data.reviewQueue.length}</span>}</button>)}</div><div className="p-5 sm:p-6">{tab === 'verification' ? <ReviewQueue items={data.reviewQueue} currency={data.settings.currency} changed={async (message) => { setNotice({ tone: 'success', text: message }); await reload(); }} /> : tab === 'settings' && data.capabilities.canManagePaymentSettings ? <SettingsForm data={data} saved={async () => { setNotice({ tone: 'success', text: 'Institution payment settings saved.' }); await reload(); }} /> : <TransactionList transactions={data.transactions} currency={data.settings.currency} />}</div></section></div>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof FileCheck2 }) { return <article className="rounded-[22px] border border-[#DCE4EE] bg-white p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase text-[#7D899B]">{label}</p><p className="mt-2 text-2xl font-extrabold text-[#101D38]">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-[18px] w-[18px]" /></span></div><p className="mt-3 text-[11px] text-[#8793A4]">{detail}</p></article>; }

function ReviewQueue({ items, currency, changed }: { items: ManualPaymentReviewItem[]; currency: string; changed: (message: string) => Promise<void> }) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function review(item: ManualPaymentReviewItem, action: 'APPROVE' | 'REJECT') {
    const note = notes[item.id]?.trim() ?? '';
    if (action === 'REJECT' && note.length < 3) { setError('Add a rejection reason first.'); return; }
    setBusy(item.id); setError('');
    try {
      const response = await fetch(`/api/payments/manual-transfer/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }) });
      const payload = await json<{ receiptNumber?: string; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to review transfer.');
      await changed(action === 'APPROVE' ? `Transfer ${item.transactionReference} approved${payload.receiptNumber ? ` · Receipt ${payload.receiptNumber}` : ''}.` : `Transfer ${item.transactionReference} rejected.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to review transfer.'); } finally { setBusy(''); }
  }
  if (!items.length) return <div className="rounded-2xl border border-dashed border-[#CFD8E5] bg-[#FAFBFD] p-10 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-500" /><p className="mt-3 text-sm font-extrabold">No bank transfers are waiting for review.</p></div>;
  return <div className="space-y-4">{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}{items.map((item) => <article key={item.id} className="rounded-2xl border border-[#DCE4EE] bg-[#FBFCFE] p-4"><div className="grid gap-4 xl:grid-cols-[1fr_270px]"><div><div className="flex flex-wrap gap-2"><span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold text-amber-700">{item.status.replace(/_/g, ' ')}</span><span className="text-[11px] text-[#8290A2]">{dateTimeLabel(item.createdAt)}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><SmallField label="Payer" value={item.payerName} detail={item.payerEmail} /><SmallField label="UTR / reference" value={item.transactionReference} detail={item.bankName || 'Bank not specified'} /><SmallField label="Amount" value={money(item.amount, item.currency || currency)} detail={`${item.invoiceIds.length} invoice(s)`} /><SmallField label="Transfer date" value={dateLabel(item.transferDate)} detail={item.proofFileName} /></div>{item.payerNote && <p className="mt-3 rounded-xl bg-white p-3 text-xs text-[#667085]">{item.payerNote}</p>}</div><div className="space-y-2"><a href={`/api/payments/manual-transfer/${item.id}/proof`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#C8D5E5] bg-white text-xs font-extrabold"><ExternalLink className="h-4 w-4" />Open proof</a><textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((previous) => ({ ...previous, [item.id]: event.target.value }))} rows={2} placeholder="Review note / rejection reason" className="w-full rounded-xl border border-[#D4DEEA] p-3 text-xs" /><div className="grid grid-cols-2 gap-2"><button type="button" disabled={busy === item.id} onClick={() => void review(item, 'REJECT')} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 text-xs font-extrabold text-rose-700"><XCircle className="h-4 w-4" />Reject</button><button type="button" disabled={busy === item.id} onClick={() => void review(item, 'APPROVE')} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-xs font-extrabold text-white">{busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Approve</button></div></div></div></article>)}</div>;
}

function SmallField({ label, value, detail }: { label: string; value: string; detail: string }) { return <div><p className="text-[9px] font-extrabold uppercase text-[#8A96A7]">{label}</p><p className="mt-1 truncate text-xs font-extrabold">{value}</p><p className="mt-1 truncate text-[10px] text-[#8290A2]">{detail}</p></div>; }

function SettingsForm({ data, saved }: { data: PaymentPortalData; saved: () => Promise<void> }) {
  const [form, setForm] = useState<PaymentPortalSettings>(data.settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setForm(data.settings), [data.settings]);
  function set<K extends keyof PaymentPortalSettings>(key: K, value: PaymentPortalSettings[K]) { setForm((previous) => ({ ...previous, [key]: value })); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await fetch('/api/payments/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ razorpayEnabled: form.razorpayEnabled, stripeEnabled: form.stripeEnabled, bankTransferEnabled: form.bankTransferEnabled, currency: form.currency, accountName: form.accountName, bankName: form.bankName, accountNumber: form.accountNumber, ifscCode: form.ifscCode, branchName: form.branchName, upiId: form.upiId, paymentInstructions: form.paymentInstructions }) });
      const payload = await json<{ error?: string }>(response); if (!response.ok) throw new Error(payload.error || 'Unable to save payment settings.'); await saved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save settings.'); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="space-y-5">{error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}<div className="grid gap-4 md:grid-cols-2"><ProviderSwitch name="Razorpay" available={form.gatewayAvailability.razorpay} enabled={form.razorpayEnabled} change={(value) => set('razorpayEnabled', value)} /><ProviderSwitch name="Stripe" available={form.gatewayAvailability.stripe} enabled={form.stripeEnabled} change={(value) => set('stripeEnabled', value)} /></div><div className="rounded-2xl border border-[#DCE4EE] p-5"><label className="flex items-start justify-between"><span><strong className="block text-sm">Direct bank transfer</strong><span className="mt-1 block text-xs text-[#7A8798]">Show institution beneficiary details and require UTR plus proof.</span></span><input type="checkbox" checked={form.bankTransferEnabled} onChange={(event) => set('bankTransferEnabled', event.target.checked)} className="h-5 w-5" /></label>{form.bankTransferEnabled && <div className="mt-5 grid gap-3 md:grid-cols-2"><Input label="Account name" value={form.accountName} change={(value) => set('accountName', value)} /><Input label="Bank name" value={form.bankName} change={(value) => set('bankName', value)} /><Input label="Account number" value={form.accountNumber} change={(value) => set('accountNumber', value)} /><Input label="IFSC / routing" value={form.ifscCode} change={(value) => set('ifscCode', value)} /><Input label="Branch" value={form.branchName} change={(value) => set('branchName', value)} /><Input label="UPI ID (optional)" value={form.upiId} change={(value) => set('upiId', value)} /><label className="md:col-span-2"><span className="text-xs font-bold">Instructions</span><textarea value={form.paymentInstructions} onChange={(event) => set('paymentInstructions', event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#D4DEEA] p-3 text-sm" /></label></div>}</div><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F7F9FC] p-4"><label className="text-xs font-bold">Currency <select value={form.currency} onChange={(event) => set('currency', event.target.value)} className="ml-2 min-h-10 rounded-xl border px-3"><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></select></label><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}Save setup</button></div></form>;
}

function ProviderSwitch({ name, available, enabled, change }: { name: string; available: boolean; enabled: boolean; change: (value: boolean) => void }) { return <label className="rounded-2xl border border-[#DCE4EE] p-4"><div className="flex items-center justify-between"><div><strong className="text-sm">{name}</strong><p className="mt-1 text-xs text-[#7A8798]">{available ? 'Server credentials ready' : 'Server credentials required'}</p></div><input type="checkbox" checked={enabled} disabled={!available} onChange={(event) => change(event.target.checked)} className="h-5 w-5" /></div></label>; }
function Input({ label, value, change }: { label: string; value: string; change: (value: string) => void }) { return <label><span className="text-xs font-bold">{label}</span><input value={value} onChange={(event) => change(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#D4DEEA] px-3 text-sm" /></label>; }

function PaymentDrawer({ open, onClose, invoices, data, onComplete }: { open: boolean; onClose: () => void; invoices: PaymentPortalInvoice[]; data: PaymentPortalData; onComplete: (message: string) => Promise<void> }) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ active: open, containerRef: panel, initialFocusRef: close });
  const [screen, setScreen] = useState<'methods' | 'bank' | 'success'>('methods');
  const [busy, setBusy] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const [utr, setUtr] = useState('');
  const [bank, setBank] = useState('');
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const ids = invoices.map((item) => item.id);
  const total = invoices.reduce((sum, item) => sum + item.balance, 0);

  useEffect(() => {
    if (!open) {
      setScreen('methods'); setBusy(''); setAwaitingConfirmation(false); setError(''); setReceipt(''); setUtr(''); setBank(''); setNote(''); setProof(null);
    }
  }, [open]);
  useEffect(() => { if (!open) return; const prior = document.body.style.overflow; document.body.style.overflow = 'hidden'; const key = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose(); }; document.addEventListener('keydown', key); return () => { document.body.style.overflow = prior; document.removeEventListener('keydown', key); }; }, [busy, onClose, open]);

  async function razorpayScript() {
    if (window.Razorpay) return true;
    return new Promise<boolean>((resolve) => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.body.appendChild(script); });
  }

  async function start(provider: 'RAZORPAY' | 'STRIPE') {
    if (awaitingConfirmation) return;
    setBusy(provider); setError('');
    try {
      const response = await fetch('/api/payments/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, invoiceIds: ids }) });
      const payload = await json<CheckoutPayload & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to start payment.');
      if (payload.provider === 'STRIPE') { window.location.assign(payload.checkoutUrl); return; }
      if (!await razorpayScript() || !window.Razorpay) throw new Error('Razorpay Checkout could not load.');
      const checkout = new window.Razorpay({
        key: payload.keyId, amount: payload.amount, currency: payload.currency, name: payload.institutionName,
        description: `${invoices.length} fee invoice${invoices.length === 1 ? '' : 's'}`, order_id: payload.orderId,
        prefill: { name: payload.payer.name, email: payload.payer.email, contact: payload.payer.phone }, theme: { color: '#1754E8' },
        modal: { ondismiss: () => { if (!awaitingConfirmation) setBusy(''); } },
        handler: async (result) => {
          // Razorpay only invokes this handler after the provider reports success.
          // From this point the user must not initiate another charge for the
          // selected invoices while CampusOS/server webhook confirmation settles.
          setAwaitingConfirmation(true); setBusy('VERIFYING'); setError('');
          const verify = await fetch('/api/payments/razorpay/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
          const confirmation = await json<{ receiptNumber?: string; error?: string }>(verify);
          if (verify.ok) { setReceipt(confirmation.receiptNumber || 'Confirmed'); setScreen('success'); setBusy(''); return; }
          setBusy('');
          setError(confirmation.error || 'Payment was submitted and is awaiting provider/webhook confirmation. Do not retry this invoice.');
        },
      });
      checkout.open();
    } catch (caught) { setBusy(''); setError(caught instanceof Error ? caught.message : 'Unable to start payment.'); }
  }

  async function submitBank(event: React.FormEvent) {
    event.preventDefault(); if (!proof) { setError('Attach the bank transfer screenshot, receipt or PDF.'); return; } setBusy('BANK'); setError('');
    try {
      const form = new FormData(); form.set('invoiceIds', JSON.stringify(ids)); form.set('transactionReference', utr); form.set('bankName', bank); form.set('transferDate', transferDate); form.set('payerNote', note); form.set('proof', proof);
      const response = await fetch('/api/payments/manual-transfer', { method: 'POST', body: form }); const payload = await json<{ message?: string; error?: string }>(response); if (!response.ok) throw new Error(payload.error || 'Unable to submit transfer proof.'); await onComplete(payload.message || 'Transfer proof submitted for verification.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to submit transfer proof.'); } finally { setBusy(''); }
  }

  if (!open) return null;
  const methodsLocked = awaitingConfirmation || Boolean(busy);
  return <><button type="button" onClick={() => !busy && onClose()} className="fixed inset-0 bg-[#071225]/55 backdrop-blur-[2px]" style={{ zIndex: 75 }} aria-label="Close payment panel" /><div ref={panel} role="dialog" aria-modal="true" tabIndex={-1} className="fixed inset-y-0 right-0 flex w-full max-w-[520px] flex-col border-l border-[#D8E2EE] bg-white shadow-[-24px_0_70px_rgba(7,18,37,0.18)] outline-none" style={{ zIndex: 80 }}><header className="flex items-center justify-between border-b border-[#E1E7EF] px-5 py-4"><div><p className="text-[9px] font-extrabold uppercase text-[#7C899B]">Institution fee payment</p><h2 className="mt-1 text-lg font-extrabold">{screen === 'bank' ? 'Submit bank transfer proof' : screen === 'success' ? 'Payment confirmed' : 'Choose payment method'}</h2></div><button ref={close} type="button" onClick={onClose} disabled={Boolean(busy)} className="flex h-10 w-10 items-center justify-center rounded-xl border disabled:opacity-40" aria-label="Close"><X className="h-4 w-4" /></button></header><div className="flex-1 overflow-y-auto p-5"><div className="mb-5 flex items-end justify-between rounded-2xl bg-[#EDF3FF] p-4"><div><p className="text-[10px] font-extrabold uppercase text-[#5D78A8]">Amount payable</p><p className="mt-1 text-xs text-[#6D7F99]">{invoices.length} selected invoice(s)</p></div><p className="text-2xl font-extrabold text-[#1754E8]">{money(total, data.settings.currency)}</p></div>{error && <div className={`mb-5 flex items-start gap-2 rounded-xl border p-3 text-xs leading-5 ${awaitingConfirmation ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}{awaitingConfirmation && screen === 'methods' && <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-start gap-3"><Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#1754E8]" /><div><p className="text-sm font-extrabold text-[#173B78]">Payment submitted — confirmation pending</p><p className="mt-1 text-xs leading-5 text-[#4F6690]">Do not pay these invoices again. CampusOS will update them after the signed provider confirmation/webhook is processed. You can close this panel and refresh the payment page.</p></div></div></div>}{screen === 'methods' && <div className="space-y-3"><MethodCard title="Razorpay" text="Institution-enabled cards, UPI and supported Razorpay methods." icon={CreditCard} enabled={!methodsLocked && data.settings.razorpayEnabled && data.settings.gatewayAvailability.razorpay} loading={busy === 'RAZORPAY' || busy === 'VERIFYING'} click={() => void start('RAZORPAY')} /><MethodCard title="Stripe Checkout" text="Hosted Stripe payment page; CampusOS does not collect card details." icon={WalletCards} enabled={!methodsLocked && data.settings.stripeEnabled && data.settings.gatewayAvailability.stripe} loading={busy === 'STRIPE'} click={() => void start('STRIPE')} /><MethodCard title="Direct bank transfer" text="Transfer to the institution, then submit UTR and proof for finance review." icon={Landmark} enabled={!methodsLocked && data.settings.bankTransferEnabled} click={() => setScreen('bank')} /></div>}{screen === 'bank' && <form onSubmit={submitBank} className="space-y-4"><div className="rounded-2xl border bg-[#F8FAFC] p-4"><p className="text-xs font-extrabold">Transfer to {data.institution.name}</p><div className="mt-4 space-y-2"><BankLine label="Account name" value={data.settings.accountName} /><BankLine label="Bank" value={data.settings.bankName} /><BankLine label="Account number" value={data.settings.accountNumber} copy /><BankLine label="IFSC / routing" value={data.settings.ifscCode} copy />{data.settings.upiId && <BankLine label="UPI ID" value={data.settings.upiId} copy />}</div>{data.settings.paymentInstructions && <p className="mt-4 rounded-xl bg-white p-3 text-[11px] text-[#667085]">{data.settings.paymentInstructions}</p>}</div><div className="grid gap-3 sm:grid-cols-2"><Input label="Transaction / UTR" value={utr} change={setUtr} /><Input label="Your bank" value={bank} change={setBank} /><label><span className="text-xs font-bold">Transfer date</span><input required type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border px-3" /></label><label className="sm:col-span-2"><span className="text-xs font-bold">Screenshot / receipt / PDF</span><span className="mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#FAFBFD]"><UploadCloud className="h-6 w-6 text-[#1754E8]" /><span className="mt-2 text-xs font-bold">{proof?.name || 'Choose payment proof'}</span><span className="mt-1 text-[10px] text-[#8A96A7]">JPG, PNG, WebP or PDF · max 3 MB</span><input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setProof(event.target.files?.[0] ?? null)} className="sr-only" /></span></label><label className="sm:col-span-2"><span className="text-xs font-bold">Note (optional)</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 w-full rounded-xl border p-3" /></label></div><div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-[11px] text-violet-800">Uploading proof does not mark fees paid. An authorised institution finance user must verify the UTR, amount and evidence.</div><div className="grid grid-cols-[auto_1fr] gap-2"><button type="button" onClick={() => setScreen('methods')} className="min-h-11 rounded-xl border px-4 text-xs font-extrabold">Back</button><button type="submit" disabled={busy === 'BANK'} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] text-xs font-extrabold text-white">{busy === 'BANK' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}Submit for verification</button></div></form>}{screen === 'success' && <div className="flex min-h-[390px] flex-col items-center justify-center text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></span><h3 className="mt-5 text-2xl font-extrabold">Payment confirmed</h3><p className="mt-2 max-w-sm text-sm text-[#667085]">The provider confirmation was verified and the ledger was updated.</p><p className="mt-4 rounded-xl bg-[#F7F9FC] px-4 py-3 font-mono text-xs font-bold">Receipt {receipt}</p><button type="button" onClick={() => void onComplete(`Payment confirmed · Receipt ${receipt}.`)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-6 text-xs font-extrabold text-white">Done <ChevronRight className="h-4 w-4" /></button></div>}</div></div></>;
}

function MethodCard({ title, text, icon: Icon, enabled, loading, click }: { title: string; text: string; icon: typeof CreditCard; enabled: boolean; loading?: boolean; click: () => void }) { return <button type="button" disabled={!enabled || loading} onClick={click} className="flex w-full items-center gap-4 rounded-2xl border border-[#DCE4EE] p-4 text-left transition hover:border-[#AFC3DE] disabled:cursor-not-allowed disabled:bg-[#F7F9FC] disabled:opacity-55"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-[#7A8798]">{text}</span></span>{loading ? <Loader2 className="h-5 w-5 animate-spin text-[#1754E8]" /> : <ChevronRight className="h-5 w-5 text-[#9AA7B8]" />}</button>; }
function BankLine({ label, value, copy }: { label: string; value: string; copy?: boolean }) { const [copied, setCopied] = useState(false); async function doCopy() { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1200); } return <div className="flex items-center justify-between gap-4 text-xs"><span className="text-[#7A8798]">{label}</span><span className="flex items-center gap-2"><strong>{value || '—'}</strong>{copy && value && <button type="button" onClick={() => void doCopy()} className="flex h-7 w-7 items-center justify-center rounded-lg border">{copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}</button>}</span></div>; }
function LoadingState() { return <div className="flex min-h-[520px] items-center justify-center"><div className="rounded-3xl border bg-white px-8 py-7 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#1754E8]" /><p className="mt-4 text-sm font-extrabold">Loading payment workspace</p></div></div>; }
function ErrorState({ message, retry }: { message: string; retry: () => void }) { return <div className="flex min-h-[520px] items-center justify-center"><div className="max-w-lg rounded-3xl border border-rose-200 bg-white p-7 text-center"><AlertCircle className="mx-auto h-8 w-8 text-rose-600" /><p className="mt-4 font-extrabold">Payment workspace unavailable</p><p className="mt-2 text-sm text-[#667085]">{message}</p><button type="button" onClick={retry} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white"><RefreshCcw className="h-4 w-4" />Try again</button></div></div>; }
