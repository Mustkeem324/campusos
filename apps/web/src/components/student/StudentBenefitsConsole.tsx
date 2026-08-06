'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Cloud,
  Code2,
  Copy,
  ExternalLink,
  Filter,
  Gift,
  GraduationCap,
  Heart,
  Layers3,
  MonitorSmartphone,
  Palette,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';
import {
  STUDENT_BENEFITS,
  STUDENT_BENEFIT_CATEGORIES,
  STUDENT_BENEFIT_KINDS,
  filterStudentBenefits,
  type StudentBenefit,
  type StudentBenefitCategory,
  type StudentBenefitKind,
} from '../../lib/student-benefits';

const SAVED_BENEFITS_KEY = 'campusos.student-benefits.saved.v1';

const CATEGORY_ICONS: Record<StudentBenefitCategory, LucideIcon> = {
  developer: Code2,
  cloud: Cloud,
  ai: Bot,
  productivity: MonitorSmartphone,
  design: Palette,
  learning: BookOpen,
  career: BriefcaseBusiness,
  lifestyle: Gift,
};

const KIND_STYLES: Record<StudentBenefitKind, string> = {
  free: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300',
  credit: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-300',
  discount: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-300',
  institution: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/35 dark:text-violet-300',
};

function formatCategory(category: StudentBenefitCategory) {
  return STUDENT_BENEFIT_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}

function formatKind(kind: StudentBenefitKind) {
  return STUDENT_BENEFIT_KINDS.find((item) => item.id === kind)?.label ?? kind;
}

function formatAvailability(availability: StudentBenefit['availability']) {
  if (availability === 'institution') return 'Institution dependent';
  if (availability === 'regional') return 'Region dependent';
  return 'Broad availability';
}

export function StudentBenefitsConsole() {
  const { currentSession } = useAuthStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<StudentBenefitCategory | 'all'>('all');
  const [kind, setKind] = useState<StudentBenefitKind | 'all'>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedBenefit, setSelectedBenefit] = useState<StudentBenefit | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SAVED_BENEFITS_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        setSavedIds(new Set(parsed.filter((value): value is string => typeof value === 'string')));
      }
    } catch {
      setSavedIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (!selectedBenefit) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedBenefit(null);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedBenefit]);

  const filteredBenefits = useMemo(
    () =>
      filterStudentBenefits(STUDENT_BENEFITS, {
        query,
        category,
        kind,
        savedIds,
        savedOnly,
      }),
    [category, kind, query, savedIds, savedOnly],
  );

  const featuredBenefits = useMemo(
    () => STUDENT_BENEFITS.filter((benefit) => benefit.featured),
    [],
  );

  const visibleCategories = useMemo(
    () => new Set(STUDENT_BENEFITS.map((benefit) => benefit.category)).size,
    [],
  );

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setKind('all');
    setSavedOnly(false);
  };

  const hasFilters = Boolean(query || category !== 'all' || kind !== 'all' || savedOnly);

  const toggleSaved = (benefitId: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(benefitId)) next.delete(benefitId);
      else next.add(benefitId);

      try {
        window.localStorage.setItem(SAVED_BENEFITS_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // Browsers can block storage. The in-memory selection still works for this visit.
      }

      return next;
    });
  };

  const copyVerificationChecklist = async () => {
    const profileLine = currentSession?.email
      ? `Signed-in email: ${currentSession.email}`
      : 'Use your current school-issued email when the provider requests it.';
    const checklist = [
      'Student benefit verification checklist',
      profileLine,
      '1. Current student ID card',
      '2. Recent enrolment letter, transcript, fee receipt or class schedule',
      '3. School-issued email access',
      '4. Matching legal name on the provider account',
      '5. Review country, age, renewal and payment terms before activation',
      'CampusOS does not approve third-party eligibility; the provider makes the final decision.',
    ].join('\n');

    try {
      await navigator.clipboard.writeText(checklist);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6 pb-14 sm:space-y-8">
      <section className="relative overflow-hidden rounded-[30px] border border-[#263A60] bg-[#0D1930] p-5 text-white shadow-[0_26px_80px_rgba(13,25,48,0.22)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[42px] border-white/[0.035]" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 right-0 grid grid-cols-4 gap-3 p-8 opacity-20" aria-hidden="true">
          {Array.from({ length: 16 }, (_, index) => (
            <span key={index} className="h-2 w-2 rounded-full bg-[#79A3FF]" />
          ))}
        </div>

        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#3567C8] bg-[#173466] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9DAFF]">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                Student opportunity directory
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/70 bg-emerald-950/40 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.1em] text-emerald-200">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Official provider links
              </span>
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
              Find student tools, credits, licences and learning offers without the marketing noise.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#B8C5DB] sm:text-base">
              Search a curated directory of current official programmes. Every card explains whether the offer is free, discounted, credit-based or controlled by your institution, with eligibility and renewal caveats shown before you leave CampusOS.
            </p>

            <div className="mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              <HeroMetric value={String(STUDENT_BENEFITS.length)} label="Official offers" />
              <HeroMetric value={String(visibleCategories)} label="Categories" />
              <HeroMetric value={String(featuredBenefits.length)} label="Top picks" />
              <HeroMetric value="Aug 2026" label="Directory review" />
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-[#142441] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1F55C8] text-white">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white">Claim-ready checklist</p>
                <p className="mt-1 text-xs leading-5 text-[#AEBED7]">
                  Prepare proof of enrolment before opening provider applications.
                </p>
              </div>
            </div>

            {currentSession ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="truncate text-sm font-extrabold text-white">{currentSession.name}</p>
                <p className="mt-1 truncate text-xs text-[#AEBED7]">{currentSession.email}</p>
                <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  CampusOS profile available for reference
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-extrabold text-white">Browsing publicly</p>
                <p className="mt-1 text-xs leading-5 text-[#AEBED7]">
                  Sign in to show your account email in the preparation checklist. CampusOS never submits an application for you.
                </p>
                <Link href="/login" className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#9DBBFF] hover:text-white">
                  Sign in securely <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => void copyVerificationChecklist()}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-extrabold text-[#102347] transition hover:bg-[#EAF0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Checklist copied' : 'Copy verification checklist'}
            </button>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Student benefits guidance">
        <TrustCard
          icon={BadgeCheck}
          title="Official destinations"
          description="Claim buttons open provider-owned or GitHub Education pages, not copied forms or unofficial coupon sites."
        />
        <TrustCard
          icon={CircleDollarSign}
          title="No fake total value"
          description="The directory separates free access, credits, institutional access and paid discounts instead of inventing one annual savings number."
        />
        <TrustCard
          icon={RefreshCw}
          title="Terms can change"
          description="Check the provider page for current country, age, renewal, payment and permitted-use rules before activating anything."
        />
      </section>

      <section className="sticky top-3 z-20 rounded-[26px] border border-[#D7E1EF] bg-white/95 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:p-5" aria-label="Search and filters">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
          <label className="relative block">
            <span className="sr-only">Search student benefits</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B8798]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search GitHub, cloud credits, design, Python, Excel…"
              className="min-h-12 w-full rounded-2xl border border-[#C9D6E7] bg-[#F8FAFD] pl-12 pr-11 text-sm font-semibold text-[#101D38] outline-none transition placeholder:text-[#8A96A8] focus:border-[#1754E8] focus:bg-white focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-950"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] hover:bg-[#EAF0F7] dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </label>

          <label className="relative block">
            <span className="sr-only">Filter by offer type</span>
            <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B8798]" aria-hidden="true" />
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as StudentBenefitKind | 'all')}
              className="min-h-12 w-full appearance-none rounded-2xl border border-[#C9D6E7] bg-[#F8FAFD] pl-11 pr-4 text-sm font-bold text-[#334155] outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All offer types</option>
              {STUDENT_BENEFIT_KINDS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedOnly((value) => !value)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-xs font-extrabold transition ${
                savedOnly
                  ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-300'
                  : 'border-[#CBD8EA] bg-white text-[#526175] hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Heart className={`h-4 w-4 ${savedOnly ? 'fill-current' : ''}`} aria-hidden="true" />
              Saved {savedIds.size > 0 ? `(${savedIds.size})` : ''}
            </button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CBD8EA] bg-white px-3.5 text-xs font-extrabold text-[#526175] hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Benefit categories">
          <CategoryButton
            label="All benefits"
            active={category === 'all'}
            icon={Layers3}
            onClick={() => setCategory('all')}
          />
          {STUDENT_BENEFIT_CATEGORIES.map((item) => (
            <CategoryButton
              key={item.id}
              label={item.label}
              active={category === item.id}
              icon={CATEGORY_ICONS[item.id]}
              onClick={() => setCategory(item.id)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="benefits-results-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6C7A90] dark:text-slate-400">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Curated directory
            </p>
            <h2 id="benefits-results-title" className="mt-2 text-2xl font-black tracking-tight text-[#101D38] dark:text-white sm:text-3xl">
              {filteredBenefits.length} {filteredBenefits.length === 1 ? 'benefit' : 'benefits'} found
            </h2>
          </div>
          <p className="max-w-xl text-xs leading-5 text-[#667085] dark:text-slate-400 sm:text-right">
            Availability is not guaranteed. The provider verifies eligibility and controls pricing, renewal and redemption.
          </p>
        </div>

        {filteredBenefits.length > 0 ? (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredBenefits.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                saved={savedIds.has(benefit.id)}
                onSave={() => toggleSaved(benefit.id)}
                onDetails={() => setSelectedBenefit(benefit)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 flex min-h-80 flex-col items-center justify-center rounded-[26px] border border-dashed border-[#C7D5E8] bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8EFFF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
              <Search className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-xl font-black text-[#101D38] dark:text-white">No matching benefits</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#667085] dark:text-slate-400">
              Try a broader keyword, another category or turn off the saved-only filter.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reset directory
            </button>
          </div>
        )}
      </section>

      <section className="rounded-[26px] border border-[#D7E1EF] bg-[#F8FAFD] p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:text-blue-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Claim safely
            </p>
            <h2 className="mt-2 text-xl font-black text-[#101D38] dark:text-white sm:text-2xl">
              Never pay a third party to “unlock” a free education offer.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085] dark:text-slate-400">
              Apply only on the linked provider page. Do not share passwords, MFA codes, recovery codes or payment card details with CampusOS or another student. For paid discounts, read renewal pricing before checkout.
            </p>
          </div>
          <a
            href="https://education.github.com/pack"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#101D38] px-5 text-sm font-extrabold text-white hover:bg-[#17284A] dark:bg-white dark:text-slate-950"
          >
            Browse GitHub Education
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      {selectedBenefit && (
        <BenefitDialog
          benefit={selectedBenefit}
          saved={savedIds.has(selectedBenefit.id)}
          onSave={() => toggleSaved(selectedBenefit.id)}
          onClose={() => setSelectedBenefit(null)}
        />
      )}
    </div>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3.5">
      <p className="text-xl font-black text-white sm:text-2xl">{value}</p>
      <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#9FAFC9]">{label}</p>
    </div>
  );
}

function TrustCard({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-[#D7E1EF] bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.045)] dark:border-slate-800 dark:bg-slate-900">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8EFFF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-sm font-extrabold text-[#101D38] dark:text-white">{title}</h2>
      <p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{description}</p>
    </article>
  );
}

function CategoryButton({ label, active, icon: Icon, onClick }: { label: string; active: boolean; icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/25 ${
        active
          ? 'border-[#1754E8] bg-[#1754E8] text-white shadow-[0_6px_18px_rgba(23,84,232,0.22)]'
          : 'border-[#D5DFEC] bg-white text-[#526175] hover:border-[#B9CBE1] hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function BenefitCard({ benefit, saved, onSave, onDetails }: { benefit: StudentBenefit; saved: boolean; onSave: () => void; onDetails: () => void }) {
  const CategoryIcon = CATEGORY_ICONS[benefit.category];

  return (
    <article className={`group flex min-h-[390px] flex-col overflow-hidden rounded-[24px] border bg-white shadow-[0_12px_38px_rgba(15,23,42,0.055)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.11)] dark:bg-slate-900 ${benefit.featured ? 'border-[#AFC7F5] dark:border-blue-900' : 'border-[#D9E3EF] dark:border-slate-800'}`}>
      <div className="flex-1 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
            <CategoryIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? `Remove ${benefit.title} from saved benefits` : `Save ${benefit.title}`}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${saved ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-300' : 'border-[#D8E2EF] text-[#7B8798] hover:bg-[#F7F9FC] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${KIND_STYLES[benefit.kind]}`}>
            {formatKind(benefit.kind)}
          </span>
          {benefit.featured && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#C7D7F2] bg-[#EEF3FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" /> Top pick
            </span>
          )}
        </div>

        <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#6D7B90] dark:text-slate-400">{benefit.provider}</p>
        <h3 className="mt-2 text-xl font-black tracking-tight text-[#101D38] dark:text-white">{benefit.title}</h3>
        <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">{benefit.summary}</p>

        <div className="mt-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFD] p-3.5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#7B8798] dark:text-slate-500">Offer</p>
          <p className="mt-1.5 text-sm font-extrabold text-[#101D38] dark:text-white">{benefit.offerLabel}</p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#667085] dark:text-slate-400">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            {formatAvailability(benefit.availability)}
          </p>
        </div>
      </div>

      <footer className="grid grid-cols-2 gap-2 border-t border-[#E1E8F1] bg-[#FAFBFD] p-4 dark:border-slate-800 dark:bg-slate-950/55">
        <button
          type="button"
          onClick={onDetails}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD8EA] bg-white px-3 text-xs font-extrabold text-[#334155] hover:bg-[#F3F6FA] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Details
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
        <a
          href={benefit.claimUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-3 text-xs font-extrabold text-white hover:bg-[#1247C7]"
        >
          Official page
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </footer>
    </article>
  );
}

function BenefitDialog({ benefit, saved, onSave, onClose }: { benefit: StudentBenefit; saved: boolean; onSave: () => void; onClose: () => void }) {
  const CategoryIcon = CATEGORY_ICONS[benefit.category];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#07101F]/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-benefit-dialog-title"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-[30px] border border-[#D8E2EF] bg-white shadow-[0_32px_100px_rgba(0,0,0,0.3)] dark:border-slate-700 dark:bg-slate-900 sm:max-w-3xl sm:rounded-[30px]"
      >
        <header className="sticky top-0 z-10 border-b border-[#E1E8F1] bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EFFF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
              <CategoryIcon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#6D7B90] dark:text-slate-400">{benefit.provider}</p>
              <h2 id="student-benefit-dialog-title" className="mt-1 text-xl font-black text-[#101D38] dark:text-white sm:text-2xl">{benefit.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close benefit details"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D8E2EF] text-[#667085] hover:bg-[#F5F7FB] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-7">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-extrabold ${KIND_STYLES[benefit.kind]}`}>{formatKind(benefit.kind)}</span>
            <span className="inline-flex rounded-full border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-1.5 text-[11px] font-extrabold text-[#526175] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{formatCategory(benefit.category)}</span>
            <span className="inline-flex rounded-full border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-1.5 text-[11px] font-extrabold text-[#526175] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">{formatAvailability(benefit.availability)}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailPanel title="What the provider offers" icon={Gift}>
              <p>{benefit.summary}</p>
              <p className="mt-3 font-extrabold text-[#101D38] dark:text-white">{benefit.offerLabel}</p>
            </DetailPanel>
            <DetailPanel title="Who may qualify" icon={GraduationCap}>
              <p>{benefit.eligibility}</p>
            </DetailPanel>
          </div>

          <div>
            <h3 className="text-sm font-black text-[#101D38] dark:text-white">Before you apply</h3>
            <ol className="mt-3 space-y-2">
              {benefit.requirements.map((requirement, index) => (
                <li key={requirement} className="flex items-start gap-3 rounded-2xl border border-[#E0E7F0] bg-[#F8FAFD] p-3.5 dark:border-slate-800 dark:bg-slate-950">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1754E8] text-xs font-black text-white">{index + 1}</span>
                  <p className="pt-1 text-sm font-semibold leading-5 text-[#334155] dark:text-slate-200">{requirement}</p>
                </li>
              ))}
            </ol>
          </div>

          {benefit.caveat && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-200">
              <p className="font-extrabold">Important terms</p>
              <p className="mt-1">{benefit.caveat}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {benefit.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#EEF2F7] px-3 py-1.5 text-[11px] font-bold text-[#526175] dark:bg-slate-800 dark:text-slate-300">{tag}</span>
            ))}
          </div>

          <div className="rounded-2xl border border-[#D8E2EF] bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                  <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                  Source reviewed {benefit.lastVerified}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">CampusOS links to the official provider source but does not determine eligibility.</p>
              </div>
              <a href={benefit.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#CBD8EA] px-3 text-xs font-extrabold text-[#1754E8] dark:border-slate-700 dark:text-blue-300">
                Verify source <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 grid gap-2 border-t border-[#E1E8F1] bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:grid-cols-[auto_1fr] sm:p-5">
          <button
            type="button"
            onClick={onSave}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-extrabold ${saved ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/35 dark:text-rose-300' : 'border-[#CBD8EA] bg-white text-[#334155] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
            {saved ? 'Saved' : 'Save for later'}
          </button>
          <a
            href={benefit.claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white hover:bg-[#1247C7]"
          >
            Continue to official provider
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </footer>
      </section>
    </div>
  );
}

function DetailPanel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#D8E2EF] bg-[#F8FAFD] p-4 dark:border-slate-800 dark:bg-slate-950">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[#6D7B90] dark:text-slate-400">
        <Icon className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
        {title}
      </p>
      <div className="mt-3 text-sm leading-6 text-[#526175] dark:text-slate-300">{children}</div>
    </section>
  );
}
