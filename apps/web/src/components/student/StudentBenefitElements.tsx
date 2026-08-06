'use client';

import Link from 'next/link';
import React from 'react';
import {
  ArrowRight,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  Code2,
  ExternalLink,
  FileBadge2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Lightbulb,
  Palette,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  STUDENT_BENEFIT_ACCESS_LABELS,
  STUDENT_BENEFIT_REGION_LABELS,
  type StudentBenefit,
  type StudentBenefitAccess,
  type StudentBenefitCategory,
} from '../../lib/student-benefits';

export const CATEGORY_ICONS: Record<StudentBenefitCategory, LucideIcon> = {
  technology: Code2,
  design: Palette,
  productivity: Lightbulb,
  learning: BookOpen,
  'financial-support': Banknote,
  career: BriefcaseBusiness,
  'academic-services': FileBadge2,
  wellbeing: HeartHandshake,
};

export function formatVerifiedDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function accessTone(access: StudentBenefitAccess) {
  switch (access) {
    case 'free':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'application':
      return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300';
    case 'institution':
      return 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
  }
}

export function FeaturedBenefitCard({
  benefit,
  onOpen,
}: {
  benefit: StudentBenefit;
  onOpen: () => void;
}) {
  const Icon = CATEGORY_ICONS[benefit.category];

  return (
    <article className="min-w-[285px] snap-start rounded-3xl border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:min-w-[330px]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0FF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${accessTone(benefit.access)}`}>
          {STUDENT_BENEFIT_ACCESS_LABELS[benefit.access]}
        </span>
      </div>
      <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798] dark:text-slate-500">
        {benefit.provider}
      </p>
      <h3 className="mt-2 text-base font-black leading-6 text-[#101D38] dark:text-white">
        {benefit.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#667085] dark:text-slate-400">
        {benefit.summary}
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#C8D7EA] text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-blue-950/40"
      >
        Check eligibility
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  );
}

export function BenefitCard({ benefit, onOpen }: { benefit: StudentBenefit; onOpen: () => void }) {
  const Icon = CATEGORY_ICONS[benefit.category];

  return (
    <article className="group flex min-h-full flex-col rounded-3xl border border-[#D8E2EF] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#B9CAE0] hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)] motion-reduce:transform-none motion-reduce:transition-none dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EEF3FA] text-[#526175] transition group-hover:bg-[#E8EFFF] group-hover:text-[#1754E8] dark:bg-slate-950 dark:text-slate-400 dark:group-hover:text-blue-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${accessTone(benefit.access)}`}>
          {STUDENT_BENEFIT_ACCESS_LABELS[benefit.access]}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798] dark:text-slate-500">
          {benefit.provider}
        </p>
        <h3 className="mt-2 text-base font-black leading-6 text-[#101D38] dark:text-white">
          {benefit.title}
        </h3>
        <p className="mt-2 text-xs font-extrabold text-[#1754E8] dark:text-blue-300">
          {benefit.valueLabel}
        </p>
        <p className="mt-3 line-clamp-4 text-xs leading-5 text-[#667085] dark:text-slate-400">
          {benefit.summary}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {benefit.regions.map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#F3F6FA] px-2.5 py-1 text-[10px] font-bold text-[#667085] dark:bg-slate-950 dark:text-slate-400"
            >
              {STUDENT_BENEFIT_REGION_LABELS[item]}
            </span>
          ))}
          <span className="rounded-full bg-[#F3F6FA] px-2.5 py-1 text-[10px] font-bold text-[#667085] dark:bg-slate-950 dark:text-slate-400">
            Checked {formatVerifiedDate(benefit.verifiedOn)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[#E4EAF2] pt-4 dark:border-slate-800">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#C8D7EA] px-3 text-xs font-extrabold text-[#334155] transition hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-950"
        >
          Eligibility
        </button>
        <a
          href={benefit.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#1754E8] px-3 text-xs font-extrabold text-white transition hover:bg-[#1144C8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1754E8]/20"
          aria-label={`Open official source for ${benefit.title}`}
        >
          Official source
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function BenefitDetailsDialog({
  benefit,
  onClose,
}: {
  benefit: StudentBenefit;
  onClose: () => void;
}) {
  const Icon = CATEGORY_ICONS[benefit.category];

  React.useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="benefit-dialog-title"
        className="max-h-[94dvh] w-full overflow-y-auto rounded-t-[28px] border border-[#D8E2EF] bg-white shadow-[0_30px_100px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-slate-950 sm:max-w-3xl sm:rounded-[28px]"
      >
        <header className="sticky top-0 z-10 border-b border-[#D8E2EF] bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-7">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0FF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798] dark:text-slate-500">
                {benefit.provider}
              </p>
              <h2
                id="benefit-dialog-title"
                className="mt-1 text-xl font-black leading-7 text-[#101D38] dark:text-white sm:text-2xl"
              >
                {benefit.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#667085] transition hover:bg-[#F1F4F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:text-slate-400 dark:hover:bg-slate-900"
              aria-label="Close benefit details"
              autoFocus
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${accessTone(benefit.access)}`}>
              {STUDENT_BENEFIT_ACCESS_LABELS[benefit.access]}
            </span>
            {benefit.regions.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-1.5 text-[11px] font-bold text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {STUDENT_BENEFIT_REGION_LABELS[item]}
              </span>
            ))}
            <span className="rounded-full border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-1.5 text-[11px] font-bold text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              Reviewed {formatVerifiedDate(benefit.verifiedOn)}
            </span>
          </div>

          <div className="rounded-2xl border border-[#D8E2EF] bg-[#F8FAFD] p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#1754E8] dark:text-blue-300">
              What is available
            </p>
            <p className="mt-2 text-base font-black text-[#101D38] dark:text-white">
              {benefit.valueLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">
              {benefit.summary}
            </p>
          </div>

          <DialogSection title="Eligibility" icon={GraduationCap}>
            <p className="text-sm leading-6 text-[#526175] dark:text-slate-300">
              {benefit.eligibility}
            </p>
          </DialogSection>

          <DialogSection title="Prepare before opening the provider" icon={FileBadge2}>
            <ul className="space-y-2">
              {benefit.requirements.map((requirement) => (
                <li
                  key={requirement}
                  className="flex items-start gap-2.5 text-sm leading-6 text-[#526175] dark:text-slate-300"
                >
                  <Check
                    className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                  {requirement}
                </li>
              ))}
            </ul>
          </DialogSection>

          <DialogSection title="Suggested steps" icon={ArrowRight}>
            <ol className="space-y-3">
              {benefit.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101D38] text-[11px] font-extrabold text-white dark:bg-blue-700">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-6 text-[#526175] dark:text-slate-300">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </DialogSection>

          {benefit.availabilityNote && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/25">
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
                aria-hidden="true"
              />
              <p className="text-xs font-semibold leading-5 text-amber-900 dark:text-amber-200">
                {benefit.availabilityNote}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-[#C8D7EA] bg-[#F2F6FC] p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start gap-3">
              <Landmark
                className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8] dark:text-blue-300"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-[#101D38] dark:text-white">
                  Official source
                </p>
                <p className="mt-1 break-all text-xs text-[#667085] dark:text-slate-400">
                  {benefit.officialDomain}
                </p>
                <p className="mt-1 text-[11px] text-[#7B8798] dark:text-slate-500">
                  {benefit.sourceLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 flex flex-col gap-2 border-t border-[#D8E2EF] bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:flex-row sm:justify-end sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#C8D7EA] px-5 text-sm font-extrabold text-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:text-slate-200"
          >
            Close
          </button>
          <a
            href={benefit.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white transition hover:bg-[#1144C8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1754E8]/20"
          >
            Continue to official source
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </footer>
      </section>
    </div>
  );
}

function DialogSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
        <h3 className="text-sm font-extrabold text-[#101D38] dark:text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function DirectoryIdentityCard({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  return (
    <div className="rounded-3xl border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0FF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-[#101D38] dark:text-white">
              {name ? `Signed in as ${name}` : 'Public student opportunity directory'}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">
              {email
                ? `Use ${email} only where the provider accepts your institution email. CampusOS does not generate external verification proof.`
                : 'Sign in to view your CampusOS account details. External providers will still verify eligibility independently.'}
            </p>
          </div>
        </div>
        {!name && (
          <Link
            href="/login"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C8D7EA] px-4 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-blue-950/40"
          >
            Sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
