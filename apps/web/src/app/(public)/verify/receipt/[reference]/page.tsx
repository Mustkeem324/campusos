import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { verifyReceiptByReference } from '@/lib/finance-operations';
import { formatMinor } from '@/lib/finance-money';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Receipt Verification | NAVEMORA',
};

export default async function ReceiptVerifyPage({
  params: paramsPromise,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await paramsPromise;
  let verification = null;
  try {
    verification = await verifyReceiptByReference(reference);
  } catch {
    verification = null;
  }
  if (!verification) notFound();

  const statusTone =
    verification.status === 'VALID'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F7FB] p-6 font-sans dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-[#E2E8F0] bg-white p-8 shadow-[0_20px_60px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-[#101B33] dark:text-white">Receipt verification</h1>
          <p className="mt-2 text-sm text-[#64748B] dark:text-slate-400">Confirmed payment record issued by the institution.</p>
        </div>

        <div className="mt-7 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-4 dark:border-slate-700">
            <span className="text-sm font-medium text-[#64748B]">Status</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase ${statusTone}`}>{verification.status}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-4 dark:border-slate-700">
            <span className="text-sm font-medium text-[#64748B]">Institution</span>
            <span className="text-sm font-bold text-[#101B33] dark:text-white">{verification.institutionName}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-4 dark:border-slate-700">
            <span className="text-sm font-medium text-[#64748B]">Receipt number</span>
            <span className="font-mono text-sm font-bold text-[#101B33] dark:text-white">{verification.receiptNumber}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-4 dark:border-slate-700">
            <span className="text-sm font-medium text-[#64748B]">Amount</span>
            <span className="text-lg font-extrabold text-[#101B33] dark:text-white">{formatMinor(verification.amountMinor, verification.currency)}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-4 dark:border-slate-700">
            <span className="text-sm font-medium text-[#64748B]">Payment method</span>
            <span className="text-sm font-bold text-[#101B33] dark:text-white">{verification.paymentMethod.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-[#E2E8F0] p-4 dark:border-slate-700">
            <span className="text-sm font-medium text-[#64748B]">Issued</span>
            <span className="text-sm font-bold text-[#101B33] dark:text-white">{new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(verification.issuedAt))}</span>
          </div>
        </div>

        <p className="mt-7 text-center text-[11px] text-[#94A3B8]">This page verifies a digitally referenced payment. No personal financial details are disclosed.</p>
      </section>
    </main>
  );
}
