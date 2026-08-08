/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import React from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Check,
  CreditCard,
  GraduationCap,
  Grid2X2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
  X,
} from 'lucide-react';

import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';

const DISMISS_KEY = 'navemora-india-institution-popup-v6-dismissed';
const OPEN_DELAY_MS = 900;

const CAMPUS_IMAGE = '/images/campusos-india-campus.jpg';

const capabilities = [
  {
    label: 'Admissions',
    description: 'Application to enrollment',
    icon: UsersRound,
    iconClass: 'text-[#C45A12]',
    iconBg: 'bg-[#FFF3E8]',
  },
  {
    label: 'Academics',
    description: 'Teaching & timetable',
    icon: BookOpenCheck,
    iconClass: 'text-[#164A9C]',
    iconBg: 'bg-[#EEF4FF]',
  },
  {
    label: 'Finance',
    description: 'Fees & scholarships',
    icon: CreditCard,
    iconClass: 'text-[#087A55]',
    iconBg: 'bg-[#EAF8F1]',
  },
  {
    label: 'People & HR',
    description: 'Faculty & workforce',
    icon: Building2,
    iconClass: 'text-[#164A9C]',
    iconBg: 'bg-[#EEF4FF]',
  },
  {
    label: 'Student Services',
    description: 'One connected journey',
    icon: GraduationCap,
    iconClass: 'text-[#C45A12]',
    iconBg: 'bg-[#FFF3E8]',
  },
] as const;

const operatingPrinciples = [
  {
    title: 'Institution-scoped',
    description:
      'Tenant, campus and academic context stays attached to every authorised workflow.',
    icon: Building2,
    iconClass: 'text-[#164A9C]',
    iconBg: 'bg-[#EEF4FF]',
  },
  {
    title: 'Role-aware',
    description:
      'Students, faculty and administrators see only the information and actions they need.',
    icon: ShieldCheck,
    iconClass: 'text-[#C45A12]',
    iconBg: 'bg-[#FFF3E8]',
  },
  {
    title: 'Workflow-driven',
    description:
      'Approvals, handoffs, statuses and evidence stay visible across institutional operations.',
    icon: Workflow,
    iconClass: 'text-[#087A55]',
    iconBg: 'bg-[#EAF8F1]',
  },
] as const;

export function IndianCampaignPopup() {
  const [isOpen, setIsOpen] = React.useState(false);

  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  const dismissPopup = React.useCallback(() => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // sessionStorage can be unavailable.
    }

    setIsOpen(false);
  }, []);

  useDialogFocusTrap({
    active: isOpen,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
  });

  React.useEffect(() => {
    let dismissed = false;

    try {
      dismissed =
        window.sessionStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      dismissed = false;
    }

    if (dismissed) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, OPEN_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissPopup();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dismissPopup, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-[120]
        flex items-end justify-center
        bg-[#06101F]/75
        p-0
        backdrop-blur-[5px]
        sm:items-center sm:p-5
      "
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismissPopup();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-popup-title"
        aria-describedby="campaign-popup-description"
        className="
          relative
          w-full
          max-w-[1420px]
          overflow-hidden
          bg-white
          shadow-[0_32px_100px_rgba(4,15,34,0.35)]
          sm:rounded-[26px]
        "
      >
        {/* Top close button */}
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close"
          onClick={dismissPopup}
          className="
            absolute right-4 top-4 z-50
            flex h-11 w-11 items-center justify-center
            rounded-full
            border border-[#D9E0E9]
            bg-white/95
            text-[#12213D]
            shadow-[0_5px_18px_rgba(15,23,42,0.12)]
            backdrop-blur
            transition
            hover:border-[#BBC7D6]
            hover:bg-[#F8FAFC]
            focus:outline-none
            focus:ring-2
            focus:ring-[#164A9C]
            focus:ring-offset-2
            sm:right-5 sm:top-5
          "
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Indian accent */}
        <div
          className="absolute left-0 right-0 top-0 z-20 flex h-[5px]"
          aria-hidden="true"
        >
          <span className="w-1/3 bg-[#D97706]" />
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-[#15803D]" />
        </div>

        <div
          className="
            grid
            max-h-[100dvh]
            overflow-y-auto
            [scrollbar-color:#164A9C_#E5E7EB]
            [scrollbar-width:thin]
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-[#E5E7EB]
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-[#164A9C]
            sm:max-h-[calc(100dvh-2.5rem)]
            lg:grid-cols-[minmax(0,1.12fr)_minmax(440px,0.88fr)]
          "
        >
          {/* LEFT */}
          <div className="relative overflow-hidden bg-white px-5 pb-8 pt-14 sm:px-9 sm:pb-10 sm:pt-12 lg:px-12 xl:px-14">
            {/* soft bottom architecture decoration */}
            <div
              className="
                pointer-events-none
                absolute inset-x-0 bottom-0
                h-40
                opacity-[0.055]
              "
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 1200 250"
                className="h-full w-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 231V194H70V161H107V194H160V134H192V92H218V134H246V194H296V150H325V194H365V119H398V79H428V119H461V194H506V147H540V194H589V103H616V53H645V103H677V194H722V137H760V194H808V128H837V194H879V151H908V194H958V115H990V72H1021V115H1050V194H1103V151H1138V194H1200V231Z"
                  fill="currentColor"
                  className="text-[#164A9C]"
                />
              </svg>
            </div>

            <div className="relative z-10 mx-auto max-w-[720px] lg:mx-0">
              {/* eyebrow */}
              <div
                className="
                  inline-flex min-h-9 items-center gap-2
                  rounded-full
                  border border-[#F0D4B6]
                  bg-[#FFF8F0]
                  px-3.5
                  text-[10px] font-extrabold uppercase
                  tracking-[0.11em]
                  text-[#B65010]
                "
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                  <GraduationCap
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </span>

                Built for Indian Higher Education
              </div>

              <div className="mt-7">
                <p className="flex items-center gap-2 text-sm font-bold text-[#44546B]">
                  <Sparkles
                    className="h-4 w-4 text-[#C45A12]"
                    aria-hidden="true"
                  />
                  One operating system for the institution
                </p>

                <h2
                  id="campaign-popup-title"
                  className="
                    mt-4
                    max-w-[700px]
                    text-[40px]
                    font-extrabold
                    leading-[0.98]
                    tracking-[-0.045em]
                    text-[#081B3A]
                    sm:text-[50px]
                    lg:text-[56px]
                    xl:text-[62px]
                  "
                >
                  Connect Your
                  <span className="mt-1 block">
                    <span className="text-[#C65B13]">
                      Campus
                    </span>{' '}
                    <span className="text-[#164A9C]">
                      Operations
                    </span>
                  </span>
                </h2>

                <p
                  id="campaign-popup-description"
                  className="
                    mt-6
                    max-w-[665px]
                    text-[15px]
                    font-medium
                    leading-7
                    text-[#526078]
                    sm:text-[16px]
                  "
                >
                  Bring admissions, academics, finance, workforce and
                  student services into one secure institution-aware
                  platform — built around real roles, approvals and
                  operational accountability.
                </p>
              </div>

              {/* capability cards */}
              <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                {capabilities.map(
                  ({
                    label,
                    description,
                    icon: Icon,
                    iconClass,
                    iconBg,
                  }) => (
                    <div
                      key={label}
                      className="
                        group
                        min-h-[122px]
                        rounded-[15px]
                        border border-[#E5EAF1]
                        bg-white
                        p-3.5
                        transition
                        hover:-translate-y-0.5
                        hover:border-[#C8D3E2]
                        hover:shadow-[0_10px_25px_rgba(15,23,42,0.07)]
                      "
                    >
                      <span
                        className={`
                          flex h-9 w-9
                          items-center justify-center
                          rounded-[10px]
                          ${iconBg}
                          ${iconClass}
                        `}
                      >
                        <Icon
                          className="h-[18px] w-[18px]"
                          aria-hidden="true"
                        />
                      </span>

                      <p className="mt-3 text-[12px] font-extrabold leading-4 text-[#17243B]">
                        {label}
                      </p>

                      <p className="mt-1 text-[9px] font-medium leading-[14px] text-[#7A8699]">
                        {description}
                      </p>
                    </div>
                  ),
                )}
              </div>

              {/* CTA */}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/contact?intent=sales"
                  onClick={dismissPopup}
                  className="
                    group
                    inline-flex min-h-[54px]
                    items-center justify-center gap-2.5
                    rounded-[11px]
                    bg-[#164A9C]
                    px-6
                    text-sm font-extrabold
                    text-white
                    shadow-[0_12px_28px_rgba(22,74,156,0.22)]
                    transition
                    hover:bg-[#103D84]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#164A9C]
                    focus:ring-offset-2
                  "
                >
                  Talk to NAVEMORA

                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href="/platform"
                  onClick={dismissPopup}
                  className="
                    inline-flex min-h-[54px]
                    items-center justify-center gap-2.5
                    rounded-[11px]
                    border border-[#164A9C]
                    bg-white
                    px-6
                    text-sm font-extrabold
                    text-[#164A9C]
                    transition
                    hover:bg-[#F3F7FF]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#164A9C]
                    focus:ring-offset-2
                  "
                >
                  <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                  Explore Platform
                </Link>
              </div>

              {/* disclaimer */}
              <div
                className="
                  mt-6
                  flex items-start gap-3
                  rounded-[13px]
                  border border-[#E7EBF1]
                  bg-[#F8FAFC]
                  p-4
                "
              >
                <span
                  className="
                    mt-0.5
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-[9px]
                    border border-[#D7E1EE]
                    bg-white
                    text-[#164A9C]
                  "
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>

                <p className="text-[10.5px] font-medium leading-5 text-[#6A778C]">
                  No customer counts, performance metrics or commercial
                  offer is implied by this message. Final implementation
                  scope and applicable capabilities are confirmed with
                  each institution.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside
            className="
              relative
              min-h-[560px]
              overflow-hidden
              bg-[#0E326F]
              lg:min-h-full
            "
          >
            <img
              src={CAMPUS_IMAGE}
              alt="Indian university students collaborating with a laptop on campus"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
            />

            {/* image treatment */}
            <div
              className="
                pointer-events-none
                absolute inset-0
                bg-[#0A2C68]/16
              "
              aria-hidden="true"
            />

            <div
              className="
                pointer-events-none
                absolute inset-x-0 bottom-0
                h-[55%]
                bg-[linear-gradient(to_top,rgba(5,28,65,0.88),rgba(5,28,65,0.48),transparent)]
              "
              aria-hidden="true"
            />

            {/* top statement */}
            <div
              className="
                absolute
                left-5 right-16 top-7 z-20
                rounded-[16px]
                border border-white/80
                bg-white/95
                p-4
                text-[#14213A]
                shadow-[0_18px_40px_rgba(7,20,45,0.16)]
                backdrop-blur-md
                sm:left-auto sm:right-7 sm:top-10 sm:w-[365px]
              "
            >
              <div className="flex items-start gap-3">
                <span
                  className="
                    flex h-11 w-11 shrink-0
                    items-center justify-center
                    rounded-[13px]
                    bg-[#EEF4FF]
                    text-[#164A9C]
                  "
                >
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>

                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#738095]">
                    Institution operating model
                  </p>

                  <p className="mt-1.5 text-lg font-extrabold leading-6 tracking-[-0.025em] text-[#17213A]">
                    Built around responsibility,
                    <span className="block">
                      not decoration.
                    </span>
                  </p>

                  <div className="mt-3 h-0.5 w-14 rounded-full bg-[#164A9C]" />
                </div>
              </div>
            </div>

            {/* operating principle card */}
            <div
              className="
                absolute
                inset-x-4 bottom-4 z-20
                rounded-[18px]
                border border-white/80
                bg-white/95
                p-4
                text-[#13203A]
                shadow-[0_22px_55px_rgba(0,0,0,0.24)]
                backdrop-blur-md
                sm:inset-x-6 sm:bottom-6 sm:p-5
              "
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7A8699]">
                    Operating principles
                  </p>

                  <p className="mt-1 text-base font-extrabold tracking-[-0.02em] text-[#17213A]">
                    Operational clarity by design
                  </p>
                </div>

                <span className="hidden rounded-full border border-[#DDE5EF] bg-[#F8FAFC] px-3 py-1.5 text-[9px] font-bold text-[#64748B] sm:inline-flex">
                  NAVEMORA
                </span>
              </div>

              <div className="mt-4 grid gap-2.5 xl:grid-cols-3">
                {operatingPrinciples.map(
                  ({
                    title,
                    description,
                    icon: Icon,
                    iconClass,
                    iconBg,
                  }) => (
                    <div
                      key={title}
                      className="
                        rounded-[13px]
                        border border-[#E5EAF0]
                        bg-[#FAFBFD]
                        p-3.5
                      "
                    >
                      <span
                        className={`
                          flex h-9 w-9
                          items-center justify-center
                          rounded-[10px]
                          ${iconBg}
                          ${iconClass}
                        `}
                      >
                        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                      </span>

                      <p className="mt-3 text-[11px] font-extrabold text-[#18243A]">
                        {title}
                      </p>

                      <p className="mt-1.5 text-[9px] font-medium leading-[15px] text-[#78859A]">
                        {description}
                      </p>
                    </div>
                  ),
                )}
              </div>

              <div
                className="
                  mt-4
                  flex items-center gap-3
                  rounded-[11px]
                  border border-[#E4EBE7]
                  bg-[#F5FAF7]
                  px-3.5 py-3
                "
              >
                <span
                  className="
                    flex h-7 w-7 shrink-0
                    items-center justify-center
                    rounded-full
                    bg-[#0B8A5B]
                    text-white
                  "
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>

                <p className="text-[10px] font-extrabold leading-4 text-[#263B35]">
                  Institution requirements and rollout scope are confirmed before implementation.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}