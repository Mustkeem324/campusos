'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import type { CareerOpening, CareerEmploymentType, CareerWorkplaceType } from '@/lib/careers-types';

type CareersExplorerProps = {
  openings: CareerOpening[];
};

const employmentLabels: Record<CareerEmploymentType, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
};

const workplaceLabels: Record<CareerWorkplaceType, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

export function CareersExplorer({ openings }: CareersExplorerProps) {
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [employmentType, setEmploymentType] = useState<'ALL' | CareerEmploymentType>('ALL');
  const [workplaceType, setWorkplaceType] = useState<'ALL' | CareerWorkplaceType>('ALL');

  const departments = useMemo(
    () => Array.from(new Set(openings.map((opening) => opening.department))).sort(),
    [openings],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return openings.filter((opening) => {
      const searchable = [
        opening.title,
        opening.summary,
        opening.department,
        opening.team,
        opening.location,
        ...opening.skills,
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (department === 'ALL' || opening.department === department) &&
        (employmentType === 'ALL' || opening.employmentType === employmentType) &&
        (workplaceType === 'ALL' || opening.workplaceType === workplaceType)
      );
    });
  }, [department, employmentType, openings, query, workplaceType]);

  const clearFilters = () => {
    setQuery('');
    setDepartment('ALL');
    setEmploymentType('ALL');
    setWorkplaceType('ALL');
  };

  return (
    <section id="open-roles" className="border-y border-[#DEE5EF] bg-[#F7F9FC] py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1754E8]">Open opportunities</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#101D38] sm:text-4xl">
            Find work with meaningful institutional impact
          </h2>
          <p className="mt-4 text-base leading-7 text-[#5F6B7A] sm:text-lg">
            Search available roles by team and work style. CampusOS only publishes approved openings; demo positions are clearly labelled.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#D8E2EF] bg-white p-4 shadow-[0_14px_38px_rgba(16,29,56,0.07)] sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#344054]">
            <SlidersHorizontal className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
            Search and filter roles
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(160px,1fr))]">
            <label className="relative block">
              <span className="sr-only">Search roles</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7B8798]" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, skill or location"
                className="min-h-12 w-full rounded-xl border border-[#CCD6E3] bg-white pl-11 pr-4 text-sm text-[#101828] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#DCE7FF]"
              />
            </label>

            <label>
              <span className="sr-only">Department</span>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className="min-h-12 w-full rounded-xl border border-[#CCD6E3] bg-white px-3 text-sm text-[#344054] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#DCE7FF]"
              >
                <option value="ALL">All departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Employment type</span>
              <select
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value as 'ALL' | CareerEmploymentType)}
                className="min-h-12 w-full rounded-xl border border-[#CCD6E3] bg-white px-3 text-sm text-[#344054] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#DCE7FF]"
              >
                <option value="ALL">All employment types</option>
                {Object.entries(employmentLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Workplace type</span>
              <select
                value={workplaceType}
                onChange={(event) => setWorkplaceType(event.target.value as 'ALL' | CareerWorkplaceType)}
                className="min-h-12 w-full rounded-xl border border-[#CCD6E3] bg-white px-3 text-sm text-[#344054] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#DCE7FF]"
              >
                <option value="ALL">All work styles</option>
                {Object.entries(workplaceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1F5] pt-4">
            <p className="text-sm text-[#667085]" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? 'role' : 'roles'} found
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#1754E8] hover:bg-[#EEF3FF]"
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5">
          {filtered.map((opening) => (
            <article
              key={opening.id}
              className="group rounded-2xl border border-[#D8E2EF] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.05)] transition hover:-translate-y-0.5 hover:border-[#AFC6F7] hover:shadow-[0_18px_42px_rgba(16,29,56,0.09)] sm:p-7"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-bold text-[#1754E8]">
                      {opening.department}
                    </span>
                    {opening.isDemo && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#F0D5A8] bg-[#FFF8E8] px-3 py-1 text-xs font-bold text-[#9A5B00]">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        Demo opening
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-[#101D38] sm:text-2xl">{opening.title}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5F6B7A] sm:text-base">{opening.summary}</p>

                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#667085]">
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                      {opening.team}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                      {opening.location}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                      {employmentLabels[opening.employmentType]} · {workplaceLabels[opening.workplaceType]}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/careers/jobs/${opening.slug}`}
                  className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#103FC2] focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                >
                  View role
                  <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#BCC8D8] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]">
                <BriefcaseBusiness className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#101D38]">No matching roles right now</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">
                Adjust your filters or return later. CampusOS does not publish placeholder openings as real vacancies.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 min-h-11 rounded-xl border border-[#B9C8DE] px-4 py-2 text-sm font-bold text-[#1754E8] hover:bg-[#F7F9FC]"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
