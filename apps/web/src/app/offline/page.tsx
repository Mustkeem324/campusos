import Link from 'next/link';
import { CloudOff, RefreshCcw, ShieldCheck } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-6 dark:bg-[#090D16]">
      <section className="w-full max-w-xl rounded-[28px] border border-[#D8E2EF] bg-white p-7 text-center shadow-[0_28px_80px_rgba(16,29,56,0.12)] dark:border-slate-800 dark:bg-slate-950 sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><CloudOff className="h-8 w-8" /></span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white">CampusOS is offline</h1>
        <p className="mt-4 text-sm leading-7 text-[#667085] dark:text-slate-400">The application shell is available, but protected campus records are never cached for offline disclosure. Reconnect to continue authenticated work.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white"><RefreshCcw className="h-4 w-4" />Try dashboard again</Link>
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C9D8EE] px-4 text-sm font-extrabold text-[#1754E8] dark:border-slate-700 dark:text-blue-300"><ShieldCheck className="h-4 w-4" />Return to sign in</Link>
        </div>
      </section>
    </main>
  );
}
