import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { getCareerOpeningBySlug, getCareerOpenings } from '@/lib/careers-service';

const employmentLabels = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
} as const;

const workplaceLabels = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
} as const;

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getCareerOpenings().map((opening) => ({ slug: opening.slug }));
}

export async function generateMetadata({ params: paramsPromise }: JobDetailPageProps): Promise<Metadata> {
  const params = await paramsPromise;
  const opening = getCareerOpeningBySlug(params.slug);
  if (!opening) return { title: 'Role not found | CampusOS Careers' };

  return {
    title: `${opening.title} | CampusOS Careers`,
    description: opening.summary,
  };
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-[#101D38]">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-base leading-7 text-[#475467]">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function JobDetailPage({ params: paramsPromise }: JobDetailPageProps) {
  const params = await paramsPromise;
  const opening = getCareerOpeningBySlug(params.slug);
  if (!opening) notFound();

  return (
    <div className="bg-white">
      <section className="border-b border-[#DEE5EF] bg-[#F7F9FC]">
        <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
          <Link
            href="/careers#open-roles"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-[#1754E8] hover:text-[#103FC2]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to open roles
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EAF0FF] px-3 py-1 text-xs font-bold text-[#1754E8]">{opening.department}</span>
                {opening.isDemo && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#F0D5A8] bg-[#FFF8E8] px-3 py-1 text-xs font-bold text-[#9A5B00]">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Demo opening
                  </span>
                )}
              </div>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-[#101D38] sm:text-5xl">{opening.title}</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[#5F6B7A]">{opening.summary}</p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#667085]">
                <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />{opening.team}</span>
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />{opening.location}</span>
                <span className="inline-flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />{employmentLabels[opening.employmentType]} · {workplaceLabels[opening.workplaceType]}</span>
                {opening.postedAt && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Posted {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(opening.postedAt))}</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_36px_rgba(16,29,56,0.08)]">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#667085]">Role reference</p>
              <p className="mt-2 font-mono text-sm font-bold text-[#101D38]">{opening.referenceCode}</p>
              <Link
                href={`/contact?category=careers&job=${encodeURIComponent(opening.referenceCode)}`}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#103FC2]"
              >
                Ask about this role
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-3 text-xs leading-5 text-[#667085]">
                An application workflow must be enabled before CampusOS collects candidate documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {opening.isDemo && (
        <div className="border-b border-[#F0D5A8] bg-[#FFF8E8]">
          <div className="mx-auto max-w-[1180px] px-4 py-3 text-sm font-medium text-[#7A4A00] sm:px-6 lg:px-8">
            This role is demonstration content. It is not a live employment offer and must not be promoted as one.
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1180px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8 lg:py-20">
        <div className="space-y-14">
          <DetailList title="What you will work on" items={opening.responsibilities} />
          <DetailList title="Required qualifications" items={opening.requiredQualifications} />
          <DetailList title="Preferred qualifications" items={opening.preferredQualifications} />
          <DetailList title="What this role may offer" items={opening.benefits} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-[#DEE5EF] bg-[#F9FBFD] p-6">
            <h2 className="text-base font-bold text-[#101D38]">Skills and focus areas</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {opening.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-[#C9D8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#344054]">{skill}</span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#C9D8F0] bg-[#EEF3FF] p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1754E8]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-base font-bold text-[#101D38]">Candidate safety</h2>
            <p className="mt-2 text-sm leading-6 text-[#536175]">
              CampusOS should never ask candidates to pay recruitment fees or share account passwords, OTPs or full banking credentials.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
}
