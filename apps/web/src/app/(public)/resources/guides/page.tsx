'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpenText,
  ChevronDown,
  Clock3,
  Download,
  FileCheck2,
  LibraryBig,
  MapPin,
  Search,
  SearchX,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';

import { guides } from '@/components/public/site-data';

type Guide = (typeof guides)[number];
type RegionFilter = 'all' | Guide['region'];

const topics = Array.from(new Set(guides.map((guide) => guide.topic))).sort((left, right) =>
  left.localeCompare(right),
);

const regions = Array.from(new Set(guides.map((guide) => guide.region)));

const regionLabels: Record<Guide['region'], string> = {
  us: 'United States',
  in: 'India',
};

export default function GuidesPage() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [topic, setTopic] = useState('all');

  const visibleGuides = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return guides.filter((guide) => {
      const searchableText = [guide.title, guide.summary, guide.topic, guide.audience]
        .join(' ')
        .toLocaleLowerCase();

      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
      const matchesRegion = region === 'all' || guide.region === region;
      const matchesTopic = topic === 'all' || guide.topic === topic;

      return matchesSearch && matchesRegion && matchesTopic;
    });
  }, [region, search, topic]);

  const hasActiveFilters = search.trim().length > 0 || region !== 'all' || topic !== 'all';

  const clearFilters = () => {
    setSearch('');
    setRegion('all');
    setTopic('all');
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-950">
      <section className="relative overflow-hidden bg-[#0B1731] text-white">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-40 h-96 w-96 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-8 -top-16 h-64 w-64 rounded-full border border-white/10"
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-center lg:pb-28 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
              <LibraryBig className="h-4 w-4" aria-hidden="true" />
              CampusOS resource library
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              Guides for modern higher-education operations
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Practical guidance for selecting, implementing and operating connected academic,
              administrative and student systems.
            </p>

            <dl className="mt-9 grid max-w-2xl grid-cols-3 gap-3">
              <HeroStat value={guides.length} label="Published guides" />
              <HeroStat value={regions.length} label="Regions covered" />
              <HeroStat value={topics.length} label="Operational topics" />
            </dl>
          </div>

          <aside className="rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-200">Designed for decisions</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
              Practical resources for institutional teams
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use the library to structure evaluation, implementation, privacy and academic-operations discussions.
            </p>

            <ul className="mt-6 space-y-3">
              <HeroAssurance icon={FileCheck2} text="Institution-focused evaluation frameworks" />
              <HeroAssurance icon={ShieldCheck} text="Governance and control considerations" />
              <HeroAssurance icon={Download} text="Downloadable copies for internal review" />
            </ul>
          </aside>
        </div>
      </section>

      <div className="relative mx-auto -mt-10 max-w-7xl px-5 pb-16 sm:px-8 lg:pb-24">
        <section
          aria-labelledby="guide-filters-heading"
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
            <SlidersHorizontal className="h-4 w-4 text-blue-700" aria-hidden="true" />
            <h2 id="guide-filters-heading">Find the right guide</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(190px,0.6fr)_minmax(220px,0.7fr)]">
            <label className="group relative block">
              <span className="sr-only">Search guides</span>
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-700"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, topic or audience"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-11 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
              {search.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  aria-label="Clear guide search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </label>

            <FilterSelect
              icon={MapPin}
              label="Filter guides by region"
              value={region}
              onChange={(value) => setRegion(value as RegionFilter)}
              options={[
                { value: 'all', label: 'All regions' },
                { value: 'us', label: 'United States' },
                { value: 'in', label: 'India' },
              ]}
            />

            <FilterSelect
              icon={Tags}
              label="Filter guides by topic"
              value={topic}
              onChange={setTopic}
              options={[
                { value: 'all', label: 'All topics' },
                ...topics.map((guideTopic) => ({ value: guideTopic, label: guideTopic })),
              ]}
            />
          </div>
        </section>

        <section className="pt-10" aria-labelledby="available-guides-heading">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Resource collection</p>
              <h2 id="available-guides-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Available guides
              </h2>
              <p className="mt-2 text-sm text-slate-600" aria-live="polite">
                Showing {visibleGuides.length} of {guides.length} guide{guides.length === 1 ? '' : 's'}
              </p>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 sm:self-auto"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>

          {visibleGuides.length > 0 ? (
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleGuides.map((guide) => (
                <GuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <SearchX className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-950">No matching guides found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Try a broader search or reset the region and topic filters to view the full library.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                View all guides
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <dt className="text-xs leading-5 text-slate-400">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-white">{value}</dd>
    </div>
  );
}

function HeroAssurance({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm font-medium text-slate-200">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-300/10 text-blue-200">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>{text}</span>
    </li>
  );
}

function FilterSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="group relative block">
      <span className="sr-only">{label}</span>
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-700"
        aria-hidden="true"
      />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-11 text-sm font-medium text-slate-800 outline-none transition hover:border-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </label>
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const TopicIcon = topicIconFor(guide.topic);

  return (
    <article className="group flex min-h-[350px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-900/5">
      <div className="h-1 bg-blue-700" aria-hidden="true" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
            <TopicIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
            {regionLabels[guide.region]}
          </span>
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{guide.topic}</p>
        <h3 className="mt-2 text-xl font-bold leading-7 tracking-tight text-slate-950 transition group-hover:text-blue-800">
          <Link
            href={`/resources/guides/${guide.slug}`}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            {guide.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{guide.summary}</p>

        <div className="mt-6 grid gap-2 border-y border-slate-100 py-4 text-xs text-slate-600">
          <span className="flex items-start gap-2">
            <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            For {guide.audience}
          </span>
          <span className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            {guide.time} read
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href={`/resources/guides/${guide.slug}`}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0B1731] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#16284B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Open guide
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <a
            href={`/api/public/guides/${guide.slug}/download`}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
        </div>
      </div>
    </article>
  );
}

function topicIconFor(topic: string): LucideIcon {
  switch (topic) {
    case 'Privacy':
      return ShieldCheck;
    case 'Implementation':
      return FileCheck2;
    case 'Student Success':
      return UsersRound;
    case 'Academic Operations':
      return BookOpenText;
    default:
      return LibraryBig;
  }
}
