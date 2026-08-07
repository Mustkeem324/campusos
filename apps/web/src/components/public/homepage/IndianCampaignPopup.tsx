/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import React from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Grid2X2,
  ShieldCheck,
  UsersRound,
  Workflow,
  X,
} from 'lucide-react';

import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';

const DISMISS_KEY = 'campusos-india-institution-popup-v4-dismissed';
const OPEN_DELAY_MS = 900;
const CAMPUS_IMAGE = 'https://images.pexels.com/photos/4622108/pexels-photo-4622108.jpeg?auto=compress&cs=tinysrgb&w=1200';

const capabilities = [
  { label: 'Admissions', icon: UsersRound, tone: 'text-[#C75B13]' },
  { label: 'Academics', icon: BookOpenCheck, tone: 'text-[#123E91]' },
  { label: 'Finance', icon: CreditCard, tone: 'text-[#087A55]' },
  { label: 'People & HR', icon: Building2, tone: 'text-[#123E91]' },
  { label: 'Student Services', icon: GraduationCap, tone: 'text-[#C75B13]' },
] as const;

const operatingPrinciples = [
  { title: 'Institution-scoped', description: 'Tenant and campus context stays attached to authorised work.', icon: Building2 },
  { title: 'Role-aware', description: 'Users see information and actions assigned to their responsibilities.', icon: ShieldCheck },
  { title: 'Workflow-driven', description: 'Approvals, handoffs, statuses and evidence remain visible.', icon: Workflow },
] as const;

export function IndianCampaignPopup() {
  const [isOpen, setIsOpen] = React.useState(false);
  const dialogRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const dismissPopup = React.useCallback(() => {
    try { window.sessionStorage.setItem(DISMISS_KEY, 'true'); } catch { /* storage can be unavailable */ }
    setIsOpen(false);
  }, []);

  useDialogFocusTrap({ active: isOpen, containerRef: dialogRef, initialFocusRef: closeButtonRef });

  React.useEffect(() => {
    let dismissed = false;
    try { dismissed = window.sessionStorage.getItem(DISMISS_KEY) === 'true'; } catch { dismissed = false; }
    if (dismissed) return;
    const timer = window.setTimeout(() => setIsOpen(true), OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') dismissPopup(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dismissPopup, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#071225]/72 p-0 backdrop-blur-[4px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissPopup(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="campaign-popup-title" aria-describedby="campaign-popup-description" className="relative w-full max-w-[1180px] overflow-hidden rounded-t-[20px] border border-[#D7DFE9] bg-[#FFFDF9] shadow-[0_32px_96px_rgba(0,0,0,0.36)] outline-none sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[18px]">
        <button ref={closeButtonRef} type="button" onClick={dismissPopup} className="absolute right-3 top-3 z-50 inline-flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#D7DFEA] bg-white text-[#0F1F3A] shadow-[0_6px_18px_rgba(15,31,58,0.12)] transition hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] sm:right-5 sm:top-5" aria-label="Close institutional information"><X className="h-5 w-5" aria-hidden="true" /></button>

        <div className="grid max-h-[100dvh] overflow-y-auto [scrollbar-color:#1D4ED8_#E5E7EB] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#1D4ED8] sm:max-h-[calc(100dvh-2.5rem)] lg:grid-cols-[minmax(0,1.24fr)_minmax(410px,0.96fr)]">
          <div className="px-5 pb-8 pt-12 sm:px-9 sm:py-10 lg:px-12">
            <div className="mx-auto max-w-[690px] lg:mx-0">
              <div className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[#E7D2B9] bg-[#FFF8EF] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#B85814]"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />Built for Indian higher education</div>
              <p className="mt-5 text-sm font-extrabold text-[#101828] sm:text-base"><span className="text-[#C75B13]">Smarter</span> campus operations. <span className="text-[#087A55]">Clearer</span> institutional responsibility.</p>

              <h2 id="campaign-popup-title" className="mt-4 text-[36px] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#123E91] sm:text-[48px] lg:text-[54px]">Connect Your <span className="block"><span className="text-[#C75B13]">Campus</span> Operations</span></h2>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3" aria-hidden="true"><span className="h-px bg-[#C75B13]" /><span className="h-2 w-2 rotate-45 border border-[#087A55] bg-white" /><span className="h-px bg-[#087A55]" /></div>
              <p id="campaign-popup-description" className="mt-5 max-w-[650px] text-sm font-semibold leading-7 text-[#344054] sm:text-[16px]">Bring admissions, academics, finance, people and student services into one institution-aware operating platform, configured around your approved roles and workflows.</p>

              <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-[12px] border border-[#E2D8CB] bg-[#E2D8CB] sm:grid-cols-5">
                {capabilities.map(({ label, icon: Icon, tone }) => <div key={label} className="flex min-h-[84px] flex-col items-center justify-center bg-white px-2 py-3 text-center"><Icon className={`h-5 w-5 ${tone}`} aria-hidden="true" /><span className="mt-2 max-w-[100px] text-[11px] font-extrabold leading-4 text-[#26344D]">{label}</span></div>)}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/contact?intent=sales" onClick={dismissPopup} className="group inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-[9px] bg-[#123E91] px-6 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,62,145,0.18)] transition hover:bg-[#0E3277]">Talk to CampusOS <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
                <Link href="/platform" onClick={dismissPopup} className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-[9px] border border-[#123E91] bg-white px-6 text-sm font-extrabold text-[#123E91] transition hover:bg-[#EEF3FF]"><Grid2X2 className="h-4 w-4" aria-hidden="true" />Explore Platform</Link>
              </div>

              <p className="mt-5 text-[11px] leading-5 text-[#667085]">No customer counts, performance metrics or commercial offer is implied by this message. Final capability and implementation scope is confirmed with each institution.</p>
            </div>
          </div>

          <aside className="relative min-h-[500px] overflow-hidden bg-[#102F70] lg:min-h-full">
            <img src={CAMPUS_IMAGE} alt="Indian university students studying together with a laptop" className="absolute inset-0 h-full w-full object-cover object-center opacity-80" loading="eager" />
            <div className="pointer-events-none absolute inset-0 bg-[#102F70]/52" aria-hidden="true" />
            <div className="pointer-events-none absolute left-0 top-0 h-2 w-1/3 bg-[#D97706]" aria-hidden="true" />
            <div className="pointer-events-none absolute left-1/3 top-0 h-2 w-1/3 bg-white" aria-hidden="true" />
            <div className="pointer-events-none absolute right-0 top-0 h-2 w-1/3 bg-[#15803D]" aria-hidden="true" />

            <div className="absolute left-6 top-8 z-20 max-w-[310px] text-white sm:left-8 sm:top-10">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#D9E5F7]">Institution operating model</p>
              <p className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">Built around responsibility, not decoration.</p>
            </div>

            <div className="absolute inset-x-5 bottom-5 z-20 rounded-[12px] border border-white/70 bg-white/95 p-4 text-[#101D38] shadow-[0_16px_38px_rgba(0,0,0,0.24)] sm:inset-x-7 sm:p-5">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#667085]">Operating principles</p>
              <div className="mt-3 space-y-2">
                {operatingPrinciples.map(({ title, description, icon: Icon }) => <div key={title} className="flex items-start gap-3 rounded-[9px] border border-[#E6EAF0] bg-[#F8FAFC] p-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#EDF3FF] text-[#123E91]"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-xs font-extrabold">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#667085]">{description}</p></div></div>)}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-extrabold text-[#123E91]"><CheckCircle2 className="h-4 w-4 text-[#15803D]" aria-hidden="true" />Institution requirements are confirmed before rollout.</div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
