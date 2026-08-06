/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import React from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Grid2X2,
  Heart,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UsersRound,
  X,
} from 'lucide-react';

const DISMISS_KEY = 'campusos-indian-campaign-popup-v2-dismissed';
const OPEN_DELAY_MS = 900;
const CAMPUS_IMAGE =
  'https://images.pexels.com/photos/4622108/pexels-photo-4622108.jpeg?auto=compress&cs=tinysrgb&w=1200';

const capabilities = [
  { label: 'Admissions', icon: UsersRound, tone: 'text-[#E76B16]' },
  { label: 'Attendance', icon: CalendarDays, tone: 'text-[#123E91]' },
  { label: 'Fees', icon: IndianRupee, tone: 'text-[#15803D]' },
  { label: 'Academics', icon: GraduationCap, tone: 'text-[#123E91]' },
  { label: 'Student Experience', icon: Heart, tone: 'text-[#E76B16]' },
] as const;

const metrics = [
  { label: 'Total students', value: '12,480', icon: UsersRound, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Attendance', value: '91.4%', icon: TrendingUp, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Fees collected', value: '₹4.82 Cr', icon: IndianRupee, tone: 'bg-orange-50 text-orange-700' },
  { label: 'Course progress', value: '85%', icon: GraduationCap, tone: 'bg-violet-50 text-violet-700' },
] as const;

export function IndianCampaignPopup() {
  const [isOpen, setIsOpen] = React.useState(false);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  const dismissPopup = React.useCallback(() => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Closing must still work when browser storage is unavailable.
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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#071225]/72 p-0 backdrop-blur-[5px] sm:items-center sm:p-5"
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
        className="relative w-full max-w-[1220px] overflow-hidden rounded-t-[28px] border border-white/70 bg-[#FFFDF9] shadow-[0_38px_120px_rgba(0,0,0,0.42)] sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[30px]"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismissPopup}
          className="absolute right-3 top-3 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D7DFEA] bg-white/95 text-[#0F1F3A] shadow-[0_8px_24px_rgba(15,31,58,0.18)] backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 sm:right-5 sm:top-5"
          aria-label="Close promotion"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="grid max-h-[100dvh] overflow-y-auto [scrollbar-color:#1D4ED8_#E5E7EB] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#1D4ED8] sm:max-h-[calc(100dvh-2.5rem)] lg:grid-cols-[minmax(0,1.32fr)_minmax(420px,0.88fr)]">
          <div className="relative overflow-hidden px-5 pb-7 pt-20 sm:px-9 sm:pb-10 sm:pt-12 lg:px-14 lg:pb-11 lg:pt-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.2]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 7% 10%, rgba(231,107,22,.24) 0 1.5px, transparent 2px), radial-gradient(circle at 92% 88%, rgba(21,128,61,.18) 0 1.5px, transparent 2px)',
                backgroundSize: '24px 24px, 28px 28px',
              }}
            />

            <div
              className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full border-[8px] border-[#F59E0B]/10"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 rounded-full border-[8px] border-[#15803D]/10"
              aria-hidden="true"
            />

            <div className="absolute left-5 top-0 z-20 w-[104px] sm:left-10 sm:w-[112px]">
              <div className="relative flex min-h-[118px] flex-col items-center bg-gradient-to-b from-[#F28C28] to-[#E76B16] px-3 pb-5 pt-5 text-center text-white shadow-[0_12px_26px_rgba(231,107,22,0.28)] [clip-path:polygon(0_0,100%_0,100%_82%,50%_100%,0_82%)]">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                <span className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.11em]">
                  Limited time
                </span>
                <span className="mt-0.5 text-sm font-black uppercase tracking-[0.08em]">
                  Offer
                </span>
              </div>
            </div>

            <div className="relative mx-auto max-w-[700px] lg:mx-0">
              <p className="text-center text-sm font-extrabold tracking-[-0.01em] text-[#101828] sm:text-left sm:text-base">
                <span className="text-[#E76B16]">Smarter</span> Campus.{' '}
                <span className="text-[#15803D]">Stronger</span> Tomorrow.
              </p>

              <div
                className="mx-auto mt-4 flex max-w-[360px] items-center gap-3 sm:mx-0"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-[#D8CBB8]" />
                <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] border border-[#15803D] bg-white" />
                <span className="h-px flex-1 bg-[#D8CBB8]" />
              </div>

              <h2
                id="campaign-popup-title"
                className="mt-6 text-center font-serif text-[38px] font-bold leading-[1.03] tracking-[-0.045em] text-[#123E91] sm:text-left sm:text-[52px] lg:text-[62px]"
              >
                Transform Your
                <span className="mt-1 block">
                  <span className="text-[#E76B16]">Campus</span> Operations
                </span>
              </h2>

              <div
                className="mx-auto mt-5 flex max-w-[480px] items-center gap-3 sm:mx-0"
                aria-hidden="true"
              >
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#E76B16] to-[#E76B16]" />
                <span className="text-base text-[#E76B16]">✦</span>
                <span className="h-px flex-1 bg-gradient-to-r from-[#15803D] via-[#15803D] to-transparent" />
              </div>

              <p
                id="campaign-popup-description"
                className="mx-auto mt-5 max-w-[650px] text-center text-sm font-semibold leading-7 text-[#344054] sm:text-left sm:text-[17px]"
              >
                Manage Admissions, Attendance, Fees, Academics and Student Experience —
                all in <span className="font-extrabold text-[#15803D]">one platform</span>.
              </p>

              <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-[#E6D8C7] bg-white/95 shadow-[0_14px_35px_rgba(66,44,20,0.07)] sm:grid-cols-5">
                {capabilities.map(({ label, icon: Icon, tone }, index) => (
                  <div
                    key={label}
                    className={`relative flex min-h-[92px] flex-col items-center justify-center px-2 py-3 text-center ${
                      index > 0 ? 'sm:border-l sm:border-[#ECE4DA]' : ''
                    } ${
                      index === capabilities.length - 1
                        ? 'col-span-2 sm:col-span-1'
                        : ''
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" />
                    <span className="mt-2 max-w-[92px] text-[11px] font-extrabold leading-4 text-[#26344D]">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/demo"
                  onClick={dismissPopup}
                  className="group inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#123E91] px-6 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(18,62,145,0.24)] transition hover:bg-[#0E3277] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                >
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  Book Free Demo
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  href="/platform"
                  onClick={dismissPopup}
                  className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#123E91] bg-white px-6 text-base font-extrabold text-[#123E91] transition hover:bg-[#EEF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                >
                  <Grid2X2 className="h-5 w-5" aria-hidden="true" />
                  Explore Features
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold text-[#475467] sm:justify-start sm:text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#E76B16]" aria-hidden="true" />
                  AI-powered
                </span>
                <span className="hidden h-4 w-px bg-[#D0D5DD] sm:block" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#123E91]" aria-hidden="true" />
                  Secure
                </span>
                <span className="hidden h-4 w-px bg-[#D0D5DD] sm:block" aria-hidden="true" />
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#15803D]" aria-hidden="true" />
                  Easy to use
                </span>
              </div>
            </div>
          </div>

          <aside className="relative min-h-[560px] overflow-hidden bg-[#102F70] lg:min-h-full">
            <img
              src={CAMPUS_IMAGE}
              alt="Indian university students studying together with a laptop"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
            />

            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102F70] via-transparent to-white/5"
              aria-hidden="true"
            />

            <div className="pointer-events-none absolute -left-28 -top-24 h-[470px] w-[470px] rounded-full border-[7px] border-[#F28C28]" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-24 -top-20 h-[446px] w-[446px] rounded-full border-[5px] border-white" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-20 -top-16 h-[422px] w-[422px] rounded-full border-[7px] border-[#1A8B4B]" aria-hidden="true" />

            <div className="absolute inset-x-5 bottom-[92px] z-20 rounded-2xl border border-white/70 bg-white/95 p-4 text-[#101D38] shadow-[0_18px_45px_rgba(0,0,0,0.3)] backdrop-blur sm:inset-x-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#667085]">
                Campus at a glance
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {metrics.map(({ label, value, icon: Icon, tone }) => (
                  <div key={label} className="rounded-xl border border-[#E6EAF0] bg-[#F8FAFC] p-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold">{value}</p>
                        <p className="truncate text-[10px] font-semibold text-[#667085]">{label}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 flex min-h-[78px] items-center justify-center gap-3 bg-[#102F70] px-6 text-center text-white">
              <ShieldCheck className="h-7 w-7 shrink-0 text-[#F5B84C]" aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold sm:text-base">
                  Trusted by Institutions Across India
                </p>
                <p className="mt-1 text-xs text-[#C8D7F0]">
                  Secure · Scalable · Region-aware
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
