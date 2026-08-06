'use client';

import React from 'react';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  CircleAlert,
  Filter,
  LayoutGrid,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  STUDENT_BENEFITS,
  STUDENT_BENEFIT_ACCESS_LABELS,
  STUDENT_BENEFIT_CATEGORIES,
  STUDENT_BENEFIT_REGION_LABELS,
  filterStudentBenefits,
  studentBenefitCategoryCounts,
  type StudentBenefit,
  type StudentBenefitAccess,
  type StudentBenefitCategory,
  type StudentBenefitRegion,
  type StudentBenefitSort,
} from '../../lib/student-benefits';
import { useAuthStore } from '../../lib/auth-store';
import {
  BenefitCard,
  BenefitDetailsDialog,
  CATEGORY_ICONS,
  DirectoryIdentityCard,
  FeaturedBenefitCard,
} from './StudentBenefitElements';

type CategoryOption = {
  id: StudentBenefitCategory | 'all';
  label: string;
  icon: LucideIcon;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'all', label: 'All opportunities', icon: LayoutGrid },
  ...STUDENT_BENEFIT_CATEGORIES.map((category) => ({
    ...category,
    icon: CATEGORY_ICONS[category.id],
  })),
];

const ACCESS_OPTIONS: Array<{ id: StudentBenefitAccess | 'all'; label: string }> = [
  { id: 'all', label: 'All access types' },
  { id: 'free', label: STUDENT_BENEFIT_ACCESS_LABELS.free },
  { id: 'application', label: STUDENT_BENEFIT_ACCESS_LABELS.application },
  { id: 'institution', label: STUDENT_BENEFIT_ACCESS_LABELS.institution },
  { id: 'discount', label: STUDENT_BENEFIT_ACCESS_LABELS.discount },
];

const REGION_OPTIONS: Array<{ id: StudentBenefitRegion | 'all'; label: string }> = [
  { id: 'all', label: 'All regions' },
  { id: 'india', label: STUDENT_BENEFIT_REGION_LABELS.india },
  { id: 'global', label: STUDENT_BENEFIT_REGION_LABELS.global },
  { id: 'institution', label: STUDENT_BENEFIT_REGION_LABELS.institution },
];

const SORT_OPTIONS: Array<{ id: StudentBenefitSort; label: string }> = [
  { id: 'featured', label: 'Recommended first' },
  { id: 'recent', label: 'Recently verified' },
  { id: 'az', label: 'A to Z' },
];

const categoryCounts = studentBenefitCategoryCounts(STUDENT_BENEFITS);
const featuredBenefits = STUDENT_BENEFITS.filter((benefit) => benefit.featured).slice(0, 6);

export function StudentBenefitsConsole() {
  const { currentSession } = useAuthStore();
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<StudentBenefitCategory | 'all'>('all');
  const [access, setAccess] = React.useState<StudentBenefitAccess | 'all'>('all');
  const [region, setRegion] = React.useState<StudentBenefitRegion | 'all'>('all');
  const [sort, setSort] = React.useState<StudentBenefitSort>('featured');
  const [selectedBenefit, setSelectedBenefit] = React.useState<StudentBenefit | null>(null);
  const [showMobileFilters, setShowMobileFilters] = React.useState(false);

  const filteredBenefits = React.useMemo(
    () =>
      filterStudentBenefits(STUDENT_BENEFITS, {
        query,
        category,
        access,
        region,
        sort,
      }),
    [access, category, query, region, sort],
  );

  const activeFilterCount = [
    category !== 'all',
    access !== 'all',
    region !== 'all',
    query.trim().length > 0,
  ].filter(Boolean).length;

  const resetFilters = React.useCallback(() => {
    setQuery('');
    setCategory('all');
    setAccess('all');
    setRegion('all');
    setSort('featured');
  }, []);

  const browseAll = () => {
    setCategory('all');
    setSort('featured');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('benefit-directory')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="pb-16">
      <Hero />

      <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <DirectoryIdentityCard
          name={currentSession?.name ?? null}
          email={currentSession?.email ?? null}
        />

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/25">
          <div className="flex items-start gap-3">
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                Protect your documents
              </h2>
              <p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-200/80">
                Upload identity, income or enrolment documents only on the official domain shown in each listing. Never pay an intermediary for a free government service.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="featured-benefits-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:text-blue-300">
              Good starting points
            </p>
            <h2
              id="featured-benefits-heading"
              className="mt-2 text-2xl font-black tracking-tight text-[#101D38] dark:text-white"
            >
              Featured official resources
            </h2>
          </div>
          <button
            type="button"
            onClick={browseAll}
            className="hidden min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-extrabold text-[#1754E8] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:text-blue-300 dark:hover:bg-blue-950/40 sm:inline-flex"
          >
            Browse all
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {featuredBenefits.map((benefit) => (
            <FeaturedBenefitCard
              key={benefit.id}
              benefit={benefit}
              onOpen={() => setSelectedBenefit(benefit)}
            />
          ))}
        </div>
      </section>

      <section
        id="benefit-directory"
        className="mt-9 scroll-mt-6"
        aria-labelledby="benefit-directory-heading"
      >
        <div className="rounded-[28px] border border-[#D8E2EF] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <DirectoryHeader query={query} setQuery={setQuery} />

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E4EAF2] pt-4 dark:border-slate-800 lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileFilters((visible) => !visible)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C8D5E5] px-4 text-sm font-extrabold text-[#101D38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:text-white"
              aria-expanded={showMobileFilters}
              aria-controls="mobile-benefit-filters"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[#1754E8] px-2 py-0.5 text-[10px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span
              className="text-xs font-bold text-[#667085] dark:text-slate-400"
              aria-live="polite"
            >
              {filteredBenefits.length} results
            </span>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
            <DirectoryFilters
              visibleOnMobile={showMobileFilters}
              activeFilterCount={activeFilterCount}
              category={category}
              access={access}
              region={region}
              sort={sort}
              setCategory={setCategory}
              setAccess={setAccess}
              setRegion={setRegion}
              setSort={setSort}
              resetFilters={resetFilters}
            />

            <div>
              <div className="hidden items-center justify-between gap-3 lg:flex">
                <p
                  className="text-sm font-extrabold text-[#101D38] dark:text-white"
                  aria-live="polite"
                >
                  {filteredBenefits.length}{' '}
                  {filteredBenefits.length === 1 ? 'opportunity' : 'opportunities'}
                </p>
                <p className="text-xs text-[#7B8798] dark:text-slate-500">
                  Official links open in a new tab
                </p>
              </div>

              {filteredBenefits.length > 0 ? (
                <div className="mt-0 grid gap-4 md:grid-cols-2 lg:mt-4 xl:grid-cols-3">
                  {filteredBenefits.map((benefit) => (
                    <BenefitCard
                      key={benefit.id}
                      benefit={benefit}
                      onOpen={() => setSelectedBenefit(benefit)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyResults resetFilters={resetFilters} />
              )}
            </div>
          </div>
        </div>
      </section>

      <SafetyChecklist />

      {selectedBenefit && (
        <BenefitDetailsDialog
          benefit={selectedBenefit}
          onClose={() => setSelectedBenefit(null)}
        />
      )}
    </div>
  );
}

function Hero() {
  const indiaCount = STUDENT_BENEFITS.filter((benefit) =>
    benefit.regions.includes('india'),
  ).length;
  const freeCount = STUDENT_BENEFITS.filter((benefit) => benefit.access === 'free').length;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#263B5E] bg-[#101D38] px-5 py-7 text-white shadow-[0_30px_90px_rgba(16,29,56,0.2)] sm:px-8 sm:py-9 lg:px-11 lg:py-11">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] border-l border-white/10 lg:block"
        aria-hidden="true"
      >
        <div className="grid h-full grid-cols-3 grid-rows-4 opacity-30">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index} className="border-b border-r border-white/10" />
          ))}
        </div>
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#49658D] bg-[#172844] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#C9D7EB]">
            <BadgeCheck className="h-4 w-4 text-[#73A1FF]" aria-hidden="true" />
            Official-source opportunity directory
          </div>

          <h1 className="mt-5 max-w-4xl text-3xl font-black tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
            Find student benefits without the hype.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#C1CCDC] sm:text-base">
            Search scholarships, developer tools, courses, internships, academic services and wellbeing support. Every entry links to an official provider or government source, with eligibility notes you can review before applying.
          </p>

          <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroMetric value={String(STUDENT_BENEFITS.length)} label="Reviewed resources" />
            <HeroMetric value={String(indiaCount)} label="India relevant" />
            <HeroMetric value={String(freeCount)} label="Free resources" />
            <HeroMetric value="8" label="Useful categories" />
          </div>
        </div>

        <div className="rounded-3xl border border-[#385477] bg-[#0D1A2E] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1A3763] text-[#86AEFF]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Eligibility stays with the provider
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#B7C4D8]">
                CampusOS does not approve scholarships, licences, credits, internships or loans. Confirm current terms on the official website before sharing documents or payment details.
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 text-[11px] leading-5 text-[#9DAEC5]">
            Sources reviewed on 6 August 2026. Programmes can change after review.
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#172844] px-4 py-3">
      <p className="text-xl font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#9FB0C8]">
        {label}
      </p>
    </div>
  );
}

function DirectoryHeader({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#728096] dark:text-slate-400">
          Search and compare
        </p>
        <h2
          id="benefit-directory-heading"
          className="mt-2 text-2xl font-black tracking-tight text-[#101D38] dark:text-white"
        >
          Student opportunity directory
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667085] dark:text-slate-400">
          Search by provider, programme, skill or eligibility keyword. Filters work together and never change provider rules.
        </p>
      </div>

      <div className="relative w-full lg:max-w-xl">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B8798]"
          aria-hidden="true"
        />
        <label htmlFor="benefit-search" className="sr-only">
          Search student benefits
        </label>
        <input
          id="benefit-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search scholarships, cloud, internships, certificates…"
          className="min-h-13 w-full rounded-2xl border border-[#C8D5E5] bg-[#F8FAFD] py-3 pl-12 pr-11 text-sm font-semibold text-[#101D38] outline-none transition placeholder:font-normal placeholder:text-[#8A96A8] focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#667085] hover:bg-[#EAF0F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function DirectoryFilters({
  visibleOnMobile,
  activeFilterCount,
  category,
  access,
  region,
  sort,
  setCategory,
  setAccess,
  setRegion,
  setSort,
  resetFilters,
}: {
  visibleOnMobile: boolean;
  activeFilterCount: number;
  category: StudentBenefitCategory | 'all';
  access: StudentBenefitAccess | 'all';
  region: StudentBenefitRegion | 'all';
  sort: StudentBenefitSort;
  setCategory: (value: StudentBenefitCategory | 'all') => void;
  setAccess: (value: StudentBenefitAccess | 'all') => void;
  setRegion: (value: StudentBenefitRegion | 'all') => void;
  setSort: (value: StudentBenefitSort) => void;
  resetFilters: () => void;
}) {
  return (
    <aside
      id="mobile-benefit-filters"
      className={`${visibleOnMobile ? 'block' : 'hidden'} rounded-2xl border border-[#D8E2EF] bg-[#F8FAFD] p-4 dark:border-slate-800 dark:bg-slate-950 lg:sticky lg:top-5 lg:block lg:self-start`}
      aria-label="Student benefit filters"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-[#101D38] dark:text-white">
          <SlidersHorizontal className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
          Filters
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-extrabold text-[#1754E8] hover:bg-[#EAF0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:text-blue-300 dark:hover:bg-blue-950/40"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset
          </button>
        )}
      </div>

      <FilterGroup label="Category">
        <div className="space-y-1.5">
          {CATEGORY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const count =
              option.id === 'all' ? STUDENT_BENEFITS.length : categoryCounts[option.id];
            const selected = category === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setCategory(option.id)}
                className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 ${
                  selected
                    ? 'bg-[#101D38] text-white dark:bg-blue-700'
                    : 'text-[#526175] hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
                aria-pressed={selected}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">{option.label}</span>
                <span className={`text-[10px] ${selected ? 'text-white/70' : 'text-[#8A96A8]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup label="Access type">
        <SelectControl
          value={access}
          onChange={(value) => setAccess(value as StudentBenefitAccess | 'all')}
          options={ACCESS_OPTIONS}
          label="Filter by access type"
        />
      </FilterGroup>

      <FilterGroup label="Availability">
        <SelectControl
          value={region}
          onChange={(value) => setRegion(value as StudentBenefitRegion | 'all')}
          options={REGION_OPTIONS}
          label="Filter by availability"
        />
      </FilterGroup>

      <FilterGroup label="Sort">
        <SelectControl
          value={sort}
          onChange={(value) => setSort(value as StudentBenefitSort)}
          options={SORT_OPTIONS}
          label="Sort opportunities"
        />
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-[#E1E8F1] pt-4 first:mt-4 dark:border-slate-800">
      <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798] dark:text-slate-500">
        {label}
      </h3>
      {children}
    </div>
  );
}

function SelectControl({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
  label: string;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-[#C8D5E5] bg-white px-3 text-xs font-bold text-[#334155] outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyResults({ resetFilters }: { resetFilters: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-[#C8D5E5] bg-[#F8FAFD] px-6 text-center dark:border-slate-700 dark:bg-slate-950">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#1754E8] shadow-sm dark:bg-slate-900 dark:text-blue-300">
        <Search className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-extrabold text-[#101D38] dark:text-white">
        No matching opportunities
      </h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#667085] dark:text-slate-400">
        Try a broader keyword or remove one of the category, access or region filters.
      </p>
      <button
        type="button"
        onClick={resetFilters}
        className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1754E8]/20"
      >
        Reset filters
      </button>
    </div>
  );
}

function SafetyChecklist() {
  const items = [
    'Confirm the browser domain exactly matches the official domain shown here.',
    'Read eligibility, region, renewal and billing terms before applying.',
    'Use institution email or documents only when the provider explicitly requests them.',
    'Never share passwords, OTPs, recovery codes or card PINs with a third party.',
  ];

  return (
    <section
      className="mt-8 rounded-[28px] border border-[#D8E2EF] bg-[#F8FAFD] p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-7"
      aria-labelledby="verification-checklist-heading"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#101D38] text-white dark:bg-blue-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2
            id="verification-checklist-heading"
            className="mt-4 text-xl font-black tracking-tight text-[#101D38] dark:text-white"
          >
            Apply safely
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">
            A professional-looking website is not enough. Check the domain, terms and document request every time.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-[#D8E2EF] bg-white p-4 dark:border-slate-700 dark:bg-slate-950"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold leading-5 text-[#526175] dark:text-slate-300">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
