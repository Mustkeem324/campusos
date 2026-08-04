import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Clock3,
  FileText,
  Globe2,
  Landmark,
} from 'lucide-react';

import { guides } from '../site-data';

type Guide = (typeof guides)[number];

const topicIcons = {
  admissions: Building2,
  academics: BookOpen,
  finance: Landmark,
  operations: FileText,
} as const;

function getRegionLabel(region: Guide['region']) {
  switch (region) {
    case 'us':
      return 'United States';
    case 'india':
      return 'India';
    default:
      return 'Global';
  }
}

function getTopicIcon(topic: string) {
  const normalizedTopic = topic.toLowerCase();

  return (
    topicIcons[normalizedTopic as keyof typeof topicIcons] ?? BookOpen
  );
}

function GuideCard({ guide }: { guide: Guide }) {
  const TopicIcon = getTopicIcon(guide.topic);
  const regionLabel = getRegionLabel(guide.region);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#DFE6F0] bg-white shadow-[0_10px_32px_rgba(16,24,40,0.05)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#BDD0F4] hover:shadow-[0_20px_48px_rgba(16,42,91,0.1)]">
      <div className="relative min-h-[128px] border-b border-[#E1E8F2] bg-[#F4F7FC] p-6">
        <div
          aria-hidden="true"
          className="absolute right-5 top-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D5E1F5] bg-white text-[#1754E8] shadow-sm"
        >
          <TopicIcon className="h-6 w-6" strokeWidth={2} />
        </div>

        <span className="inline-flex min-h-7 items-center rounded-full border border-[#C8D8F5] bg-[#EAF1FF] px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1754E8]">
          {guide.topic}
        </span>

        <p className="mt-7 max-w-[220px] text-sm font-medium leading-6 text-[#475467]">
          Practical guidance for institutional teams
        </p>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-[#667085]">
          <span className="inline-flex items-center gap-1.5">
            <Globe2
              className="h-3.5 w-3.5 text-[#1754E8]"
              aria-hidden="true"
            />
            {regionLabel}
          </span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3
              className="h-3.5 w-3.5 text-[#1754E8]"
              aria-hidden="true"
            />
            {guide.time}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-bold leading-7 tracking-[-0.02em] text-[#101828]">
          <Link
            href={`/resources/guides/${guide.slug}`}
            className="rounded-sm transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
          >
            {guide.title}
          </Link>
        </h3>

        <p className="mt-3 flex-1 text-[15px] leading-7 text-[#5F6C7B]">
          {guide.summary}
        </p>

        <div className="mt-7 border-t border-[#E3E8F0] pt-5">
          <Link
            href={`/resources/guides/${guide.slug}`}
            aria-label={`Open guide: ${guide.title}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#1754E8] transition-colors hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
          >
            Read the guide

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ResourcePreview() {
  const featuredGuides = guides.slice(0, 3);

  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28"
      aria-labelledby="resources-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px]">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Practical resources
            </div>

            <h2
              id="resources-heading"
              className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[46px] lg:leading-[1.14]"
            >
              Guidance for your next institutional decision
            </h2>

            <p className="mt-5 max-w-[680px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
              Explore practical guides covering academic operations,
              institutional planning, digital transformation and CampusOS
              implementation.
            </p>
          </div>

          <Link
            href="/resources/guides"
            className="group inline-flex min-h-12 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C9D3E1] bg-white px-5 py-3 text-sm font-semibold text-[#101828] transition-[border-color,background-color,color] hover:border-[#1754E8] hover:bg-[#F6F9FF] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
          >
            Browse all guides

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </header>

        {featuredGuides.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {featuredGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-3xl border border-dashed border-[#CAD4E2] bg-[#F8FAFD] px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#1754E8]">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#101828]">
              New guides are being prepared
            </h3>

            <p className="mx-auto mt-2 max-w-[460px] text-sm leading-6 text-[#5F6C7B]">
              Institutional resources will appear here when they are published.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-5 rounded-2xl border border-[#DDE4EE] bg-[#F7F9FC] px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <h3 className="text-lg font-semibold text-[#101828]">
              Looking for guidance tailored to your institution?
            </h3>

            <p className="mt-2 max-w-[720px] text-sm leading-6 text-[#5F6C7B]">
              Speak with the CampusOS team about your academic structure,
              operational priorities and implementation requirements.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
          >
            Talk to our team
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}