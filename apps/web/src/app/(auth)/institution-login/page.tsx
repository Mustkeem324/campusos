'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

type ResolveResponse = {
  error?: string;
  loginUrl?: string;
  institution?: {
    name: string;
    subdomain: string;
    logoUrl?: string | null;
  };
};

export default function InstitutionLoginPage() {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolvedName, setResolvedName] = useState('');

  async function handleContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspace = subdomain.trim().toLowerCase();
    if (!workspace) return;

    setError('');
    setResolvedName('');
    setLoading(true);

    try {
      const response = await fetch('/api/institutions/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: workspace }),
      });
      const payload = await response.json().catch(() => ({})) as ResolveResponse;

      if (!response.ok || !payload.institution || !payload.loginUrl) {
        throw new Error(payload.error || 'Institution workspace could not be verified.');
      }

      setResolvedName(payload.institution.name);
      router.push(payload.loginUrl);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to verify this institution workspace.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#101828]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.95fr)_minmax(520px,1.05fr)]">
        <aside className="hidden min-h-screen flex-col bg-[#101D38] px-10 py-12 text-white lg:flex xl:px-14">
          <Link href="/" aria-label="CampusOS homepage" className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CB2FF]">
            <Logo className="h-10 w-10" showText={false} />
            <span className="text-2xl font-extrabold tracking-[-0.035em]">CampusOS</span>
          </Link>

          <div className="mt-16 max-w-[620px]">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#AFC7EE]">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Institution workspace
            </div>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] xl:text-[54px]">Find the workspace assigned to your institution</h1>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-[#B9C6D9]">CampusOS verifies the workspace against the institution registry before sending you to sign in.</p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { icon: Search, title: 'Database-backed lookup', body: 'Workspace names are checked against registered institutions instead of a client-side mock.' },
              { icon: ShieldCheck, title: 'Availability-aware access', body: 'Unavailable workspaces are not allowed to continue, without exposing internal status details.' },
              { icon: KeyRound, title: 'Tenant-scoped sign in', body: 'The selected workspace is passed to authentication so duplicate emails across institutions remain unambiguous.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172B4C] text-[#8CB2FF]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div><h2 className="text-sm font-bold">{title}</h2><p className="mt-2 text-xs leading-5 text-[#AFC0D8]">{body}</p></div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-7 text-xs text-[#AFC0D8]"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#61D6AB]" aria-hidden="true" />Workspace resolution uses the connected CampusOS institution database.</div>
        </aside>

        <section className="flex min-h-screen flex-col bg-white">
          <header className="flex min-h-16 items-center justify-between border-b border-[#E1E7EF] px-4 sm:px-6 lg:border-b-0 lg:px-10 lg:pt-8">
            <Link href="/" className="flex items-center gap-2.5 lg:hidden" aria-label="CampusOS homepage"><Logo className="h-8 w-8" showText={false} /><span className="text-lg font-extrabold">CampusOS</span></Link>
            <Link href="/login" className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#5F6C7B] transition hover:bg-[#F2F4F7] hover:text-[#1754E8]"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Standard sign in</Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
            <div className="w-full max-w-[520px]">
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]"><Building2 className="h-4 w-4" aria-hidden="true" />Workspace lookup</div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] sm:text-[40px]">Find your institution</h2>
              <p className="mt-3 text-sm leading-6 text-[#667085] sm:text-base">Enter the workspace name provided by your institution administrator.</p>

              <div className="mt-8 rounded-3xl border border-[#D8E1EC] bg-white p-5 shadow-[0_18px_52px_rgba(16,42,91,0.08)] sm:p-7">
                {error && <div role="alert" className="mb-5 rounded-2xl border border-[#F2B8B2] bg-[#FFF1F0] p-4 text-sm font-semibold text-[#A9271C]">{error}</div>}
                {resolvedName && !error && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{resolvedName} verified. Opening secure sign in…</div>}

                <form onSubmit={handleContinue} className="space-y-5">
                  <div>
                    <label htmlFor="subdomain" className="block text-sm font-bold text-[#344054]">Workspace URL</label>
                    <div className="mt-2 flex min-h-12 overflow-hidden rounded-xl border border-[#C9D3E1] bg-white focus-within:border-[#1754E8] focus-within:ring-4 focus-within:ring-[#1754E8]/10">
                      <input id="subdomain" type="text" required autoComplete="organization" value={subdomain} onChange={(event) => { setSubdomain(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setError(''); setResolvedName(''); }} className="min-w-0 flex-1 px-4 text-sm font-semibold outline-none" placeholder="university-name" />
                      <span className="flex items-center border-l border-[#D8E1EC] bg-[#F7F9FC] px-3 text-xs font-bold text-[#667085] sm:px-4 sm:text-sm">.campusos.com</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#7C899B]">Use only the workspace prefix, for example <span className="font-mono font-bold">your-university</span>.</p>
                  </div>

                  <button type="submit" disabled={loading || !subdomain} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Verifying workspace…</> : <>Continue securely <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}</button>
                </form>
              </div>

              <div className="mt-7 flex flex-col gap-3 text-center text-sm text-[#667085] sm:flex-row sm:justify-center sm:gap-6"><Link href="/signup/institution" className="font-bold text-[#1754E8] hover:text-[#103FC2]">Register an institution</Link><Link href="/contact" className="font-bold text-[#1754E8] hover:text-[#103FC2]">Contact CampusOS</Link></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
