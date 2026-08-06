'use client';

import Link from 'next/link';
import React from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Grid2X2,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  X,
} from 'lucide-react';

const DISMISS_KEY = 'campusos-indian-campaign-popup-dismissed';
const OPEN_DELAY_MS = 1_200;

const capabilities = [
  { label: 'Admissions', icon: UsersRound, tone: 'text-[#E76B16]' },
  { label: 'Attendance', icon: CalendarDays, tone: 'text-[#1754E8]' },
  { label: 'Fees', icon: IndianRupee, tone: 'text-[#15803D]' },
  { label: 'Academics', icon: GraduationCap, tone: 'text-[#1754E8]' },
] as const;

const metrics = [
  { label: 'Students', value: '12,480', icon: UsersRound, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Attendance', value: '91.4%', icon: UserCheck, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Fees collected', value: '₹4.82 Cr', icon: IndianRupee, tone: 'bg-orange-50 text-orange-700' },
  { label: 'Course progress', value: '85%', icon: BookOpenCheck, tone: 'bg-violet-50 text-violet-700' },
] as const;

export function IndianCampaignPopup() {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  const dismissPopup = React.useCallback(() => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Storage can be unavailable in strict privacy modes. Closing still works.
    }

    setIsOpen(false);
    window.setTimeout(() => previousActiveElementRef.current?.focus(), 0);
  }, []);

  React.useEffect(() => {
    let dismissed = false;

    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      dismissed = false;
    }

    if (dismissed) return;

    const timer = window.setTimeout(() => {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setIsOpen(true);
    }, OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissPopup();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dismissPopup, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-[#071225]/70 p-0 backdrop-blur-[5px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismissPopup();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-popup-title"
        aria-describedby="campaign-popup-description"
        className="relative w-full max-w-[1160px] overflow-hidden rounded-t-[28px] border border-white/60 bg-[#FFFCF7] shadow-[0_34px_120px_rgba(0,0,0,0.38)] sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[30px]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismissPopup}
          className="absolute right-3 top-3 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D7DFEA] bg-white text-[#101D38] shadow-lg transition hover:scale-105 hover:bg-[#F5F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 sm:right-5 sm:top-5"
          aria-label="Close promotion"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="grid max-h-[100dvh] overflow-y-auto sm:max-h-[calc(100dvh-2.5rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.95fr)]">
          <div className="relative overflow-hidden px-5 pb-7 pt-16 sm:px-8 sm:pb-9 sm:pt-10 lg:px-12 lg:py-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.32]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 8% 12%, rgba(231,107,22,.22) 0 2px, transparent 2.5px), radial-gradient(circle at 92% 84%, rgba(21,128,61,.2) 0 2px, transparent 2.5px)',
                backgroundSize: '22px 22px, 26px 26px',
              }}
            />

            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full border-[18px] border-[#F59E0B]/10" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-52 w-52 rounded-full border-[20px] border-[#15803D]/10" aria-hidden="true" />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#F6C18F] bg-[#FFF3E7] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#B74A08]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Free campus assessment
                </span>
                <span className="text-xs font-extrabold tracking-[0.04em] text-[#15803D]">
                  Smarter Campus. Stronger Tomorrow.
                </span>
              </div>

              <h2
                id="campaign-popup-title"
                className="mt-5 max-w-[650px] text-[34px] font-extrabold leading-[1.06] tracking-[-0.045em] text-[#102B62] sm:text-[46px] lg:text-[54px]"
              >
                Transform Your{' '}
                <span className="text-[#E76B16]">Campus</span>{' '}
                Operations
              </h2>

              <div className="mt-5 flex items-center gap-3" aria-hidden="true">
                <span className="h-px w-16 bg-[#E76B16]" />
                <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-[#15803D]" />
                <span className="h-px w-24 bg-[#15803D]" />
              </div>

              <p
                id="campaign-popup-description"
                className="mt-5 max-w-[620px] text-sm font-medium leading-7 text-[#4F5E73] sm:text-base"
              >
                Manage admissions, attendance, fees, academics and student experience from one secure, role-aware platform designed for Indian institutions.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-[#E5D9CB] bg-white/90 p-2.5 shadow-[0_12px_30px_rgba(66,44,20,0.06)] sm:grid-cols-4">
                {capabilities.map(({ label, icon: Icon, tone }) => (
                  <div key={label} className="flex min-h-20 flex-col items-center justify-center rounded-xl px-2 py-3 text-center transition hover:bg-[#F8FAFC]">
                    <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
                    <span className="mt-2 text-xs font-extrabold text-[#26344D]">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/demo"
                  onClick={dismissPopup}
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#123E91] px-6 text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(18,62,145,0.24)] transition hover:bg-[#0E3277] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  Book Free Demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/platform"
                  onClick={dismissPopup}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#123E91] bg-white px-6 text-sm font-extrabold text-[#123E91] transition hover:bg-[#EEF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                >
                  <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                  Explore Features
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#536177]">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#E76B16]" aria-hidden="true" />
                  AI-powered
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                  Secure
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                  Easy to use
                </span>
              </div>
            </div>
          </div>

          <aside className="relative min-h-[410px] overflow-hidden bg-[#102B62] px-5 pb-7 pt-16 text-white sm:px-8 sm:pb-9 lg:min-h-full lg:px-10 lg:pb-10 lg:pt-20">
            <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full border-[18px] border-[#F28C28]" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-16 -top-16 h-[390px] w-[390px] rounded-full border-[14px] border-white" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-8 -top-8 h-[360px] w-[360px] rounded-full border-[14px] border-[#1A8B4B]" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.14),transparent_35%)]" aria-hidden="true" />

            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.25)] backdrop-blur sm:h-44 sm:w-44">
              <Building2 className="h-16 w-16 text-white sm:h-20 sm:w-20" strokeWidth={1.35} aria-hidden="true" />
              <span className="absolute -right-2 top-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[#102B62] bg-white text-lg shadow-lg" aria-label="India">
                🇮🇳
              </span>
            </div>

            <div className="relative mx-auto -mt-2 flex w-fit items-end justify-center" aria-label="Campus team collaboration">
              <Avatar initials="AS" className="-mr-3 h-14 w-14 bg-[#F2A65A]" />
              <Avatar initials="RK" className="z-10 h-[68px] w-[68px] bg-[#2F74D0]" />
              <Avatar initials="PS" className="-ml-3 h-14 w-14 bg-[#2E9B61]" />
            </div>

            <div className="relative mt-5 rounded-2xl border border-white/20 bg-white p-4 text-[#101D38] shadow-[0_20px_50px_rgba(0,0,0,0.28)] sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#667085]">Campus at a glance</p>
                  <p className="mt-1 text-sm font-extrabold">Live institutional overview</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
                  Live
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {metrics.map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="rounded-xl border border-[#E5EAF1] bg-[#F8FAFC] p-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <p className="mt-2 text-sm font-extrabold">{value}</p>
                    <p className="mt-0.5 text-[10px] font-semibold text-[#667085]">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-5 flex items-center justify-center gap-3 text-center">
              <ShieldCheck className="h-6 w-6 text-[#F5B84C]" aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold">Built for institutions across India</p>
                <p className="mt-1 text-xs text-[#C8D7F0]">Secure · Scalable · Region-aware</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Avatar({ initials, className }: { initials: string; className: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-full border-4 border-[#102B62] text-sm font-extrabold text-white shadow-lg ${className}`}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
