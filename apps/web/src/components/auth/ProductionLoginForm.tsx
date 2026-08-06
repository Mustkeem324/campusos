'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';
import { useAuthStore } from '@/lib/auth-store';
import type { UserSession } from '@/lib/types';

type AuthResponse = {
  error?: string;
  mfaRequired?: boolean;
  userId?: string;
  user?: UserSession;
};

const platformBenefits = [
  { title: 'Institution-scoped access', description: 'Authentication can be limited to the institution workspace selected by the user.', icon: Building2 },
  { title: 'Role-aware permissions', description: 'Users enter only the areas allowed by their assigned institutional role.', icon: ShieldCheck },
  { title: 'Connected operations', description: 'Academic, finance, people and student-service workflows stay in one governed platform.', icon: LayoutDashboard },
] as const;

async function readAuthResponse(response: Response): Promise<AuthResponse> {
  const payload: unknown = await response.json().catch(() => ({}));
  return payload && typeof payload === 'object' ? payload as AuthResponse : {};
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ProductionLoginForm({ workspace }: { workspace?: string }) {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  function validate() {
    const normalized = email.trim();
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!normalized) { setEmailError('Enter your email address.'); valid = false; }
    else if (!isValidEmail(normalized)) { setEmailError('Enter a valid email address.'); valid = false; }
    if (!password) { setPasswordError('Enter your password.'); valid = false; }
    return valid;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, rememberMe, workspace: workspace || undefined }),
      });
      const payload = await readAuthResponse(response);
      if (!response.ok) throw new Error(payload.error || 'Unable to sign in with these credentials.');

      if (payload.mfaRequired) {
        if (!payload.userId) throw new Error('Multi-factor authentication could not be started.');
        sessionStorage.setItem('mfaUserId', payload.userId);
        router.push('/mfa');
        return;
      }

      if (!payload.user) throw new Error('The authentication response did not include a valid user session.');
      setSession(payload.user);
      router.replace('/dashboard');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB] text-[#101828]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.92fr)_minmax(520px,1.08fr)]">
        <aside className="hidden min-h-screen flex-col bg-[#101D38] px-8 py-10 text-white lg:flex xl:px-12 xl:py-12">
          <Link href="/" aria-label="CampusOS homepage" className="flex w-fit items-center gap-3 rounded-lg"><Logo className="h-10 w-10" showText={false} /><span className="text-2xl font-extrabold tracking-[-0.035em]">CampusOS</span></Link>
          <div className="mt-14 max-w-[650px]">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#AFC7EE]"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Secure institutional access</div>
            <h1 className="mt-7 text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] xl:text-[52px]">Sign in to the workspace your institution manages</h1>
            <p className="mt-6 max-w-[590px] text-base leading-8 text-[#B9C6D9]">CampusOS uses authenticated user, institution and role context to keep operational access accountable.</p>
          </div>

          <div className="mt-10 grid gap-4 xl:grid-cols-3">
            {platformBenefits.map(({ title, description, icon: Icon }) => <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172B4C] text-[#8CB2FF]"><Icon className="h-5 w-5" aria-hidden="true" /></span><h2 className="mt-4 text-sm font-bold">{title}</h2><p className="mt-2 text-xs leading-5 text-[#9FADC1]">{description}</p></article>)}
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-[#142441] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.24)]">
            <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1754E8]"><UsersRound className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-bold">Production account access</p><p className="mt-1 text-xs text-[#AFC0D8]">No shared persona or sample-account login is exposed.</p></div></div><CheckCircle2 className="h-5 w-5 shrink-0 text-[#61D6AB]" aria-hidden="true" /></div>
          </div>

          <div className="mt-auto flex items-start gap-3 border-t border-white/10 pt-7"><Headphones className="mt-0.5 h-5 w-5 shrink-0 text-[#8CB2FF]" aria-hidden="true" /><p className="text-xs leading-5 text-[#AAB8CC]">Need account help? Contact your institution administrator or use the <Link href="/contact" className="font-bold text-white underline decoration-white/35 underline-offset-4">CampusOS contact page</Link>.</p></div>
        </aside>

        <section className="flex min-h-screen flex-col bg-white">
          <header className="flex min-h-16 items-center justify-between border-b border-[#E1E7EF] px-4 sm:px-6 lg:border-b-0 lg:px-10 lg:pt-8">
            <Link href="/" className="flex items-center gap-2.5 lg:hidden" aria-label="CampusOS homepage"><Logo className="h-8 w-8" showText={false} /><span className="text-lg font-extrabold">CampusOS</span></Link>
            <Link href="/" className="group ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#5F6C7B] transition hover:bg-[#F2F4F7] hover:text-[#1754E8]"><ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />Back to website</Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-10 xl:px-14">
            <div className="w-full max-w-[520px]">
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Account sign in</div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-[-0.035em] sm:text-[38px]">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-[#667085] sm:text-base">Sign in using the credentials issued to your account.</p>

              {workspace && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#C8D8F5] bg-[#F5F8FF] p-4"><Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]" aria-hidden="true" /><div><p className="text-sm font-bold text-[#101D38]">Institution workspace selected</p><p className="mt-1 text-xs text-[#667085]">Sign-in is scoped to <span className="font-mono font-bold">{workspace}.campusos.com</span>.</p></div></div>}

              <div className="mt-7 rounded-3xl border border-[#D8E1EC] bg-white p-5 shadow-[0_18px_52px_rgba(16,42,91,0.08)] sm:p-7">
                {error && <div role="alert" className="mb-6 flex items-start gap-3 rounded-2xl border border-[#F2B8B2] bg-[#FFF1F0] p-4 text-sm text-[#A9271C]"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div><p className="font-bold">Sign-in unsuccessful</p><p className="mt-1 leading-6">{error}</p></div></div>}
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div><label htmlFor="email" className="block text-sm font-bold text-[#344054]">Email address</label><div className="relative mt-2"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input id="email" type="email" autoComplete="username" value={email} onChange={(event) => { setEmail(event.target.value); setEmailError(''); setError(''); }} className={`min-h-12 w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-4 ${emailError ? 'border-red-300 focus:ring-red-100' : 'border-[#C9D3E1] focus:border-[#1754E8] focus:ring-[#1754E8]/10'}`} placeholder="name@institution.edu" /></div>{emailError && <p className="mt-2 text-xs font-semibold text-[#C43224]">{emailError}</p>}</div>
                  <div><div className="flex items-center justify-between"><label htmlFor="password" className="text-sm font-bold text-[#344054]">Password</label><Link href="/forgot-password" className="text-xs font-bold text-[#1754E8]">Forgot password?</Link></div><div className="relative mt-2"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setPasswordError(''); setError(''); }} className={`min-h-12 w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm outline-none focus:ring-4 ${passwordError ? 'border-red-300 focus:ring-red-100' : 'border-[#C9D3E1] focus:border-[#1754E8] focus:ring-[#1754E8]/10'}`} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}</button></div>{passwordError && <p className="mt-2 text-xs font-semibold text-[#C43224]">{passwordError}</p>}</div>
                  <label className="flex items-center gap-3 text-sm font-medium text-[#475467]"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-[#B8C4D3] text-[#1754E8] focus:ring-[#1754E8]" />Keep me signed in on this device</label>
                  <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2] disabled:cursor-not-allowed disabled:opacity-60">{loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Signing in…</> : <>Sign in securely <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}</button>
                </form>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href="/institution-login" className="flex min-h-12 items-center justify-between rounded-xl border border-[#D8E1EC] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054] hover:text-[#1754E8]">Find institution workspace <Building2 className="h-4 w-4" aria-hidden="true" /></Link><Link href="/signup/institution" className="flex min-h-12 items-center justify-between rounded-xl border border-[#D8E1EC] bg-[#F8FAFC] px-4 text-sm font-bold text-[#344054] hover:text-[#1754E8]">Register institution <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
