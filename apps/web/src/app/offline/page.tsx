import Link from 'next/link';
import { CloudOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F2F5FA] p-6 text-[#101D38] dark:bg-[#090D16] dark:text-white">
      <section className="w-full max-w-xl rounded-[30px] border border-[#D8E2EF] bg-white p-7 text-center shadow-[0_28px_80px_rgba(16,29,56,0.12)] dark:border-slate-800 dark:bg-slate-950 sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <CloudOff className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.04em]">CampusOS is offline</h1>
        <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">
          Sensitive dashboard and API responses are never stored for offline replay. Reconnect to load the latest authorised campus data.
        </p>
        <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white transition hover:bg-[#1247C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try dashboard again
        </Link>
      </section>
    </main>
  );
}
