import type { ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  Cpu,
  Globe2,
  GraduationCap,
  HeartPulse,
  Layers3,
} from 'lucide-react';

type InstitutionType = {
  id: string;
  title: string;
  description: string;
  capabilities: readonly string[];
  icon: ElementType;
  href: string;
  featured?: boolean;
};

const institutionTypes: readonly InstitutionType[] = [
  {
    id: 'universities',
    title: 'Universities',
    description:
      'Coordinate faculties, campuses, academic programmes, examinations and institution-wide governance.',
    capabilities: [
      'Multi-campus administration',
      'Institution-wide reporting',
      'Central academic governance',
    ],
    icon: Building2,
    href: '/solutions/universities',
    featured: true,
  },
  {
    id: 'autonomous-colleges',
    title: 'Autonomous Colleges',
    description:
      'Manage independent curricula, academic regulations, assessments and result-publication workflows.',
    capabilities: [
      'Curriculum configuration',
      'Examination workflows',
      'Outcome-based education',
    ],
    icon: BookOpenCheck,
    href: '/solutions/autonomous-colleges',
  },
  {
    id: 'college-groups',
    title: 'College Groups',
    description:
      'Operate multiple institutions through shared governance, central reporting and configurable local control.',
    capabilities: [
      'Central administration',
      'Shared institutional services',
      'Consolidated analytics',
    ],
    icon: Layers3,
    href: '/solutions/college-groups',
  },
  {
    id: 'engineering-colleges',
    title: 'Engineering Colleges',
    description:
      'Support laboratories, projects, technical programmes, placements and academic-quality workflows.',
    capabilities: [
      'Lab and project tracking',
      'Programme outcome reporting',
      'Placement operations',
    ],
    icon: Cpu,
    href: '/solutions/engineering-colleges',
  },
  {
    id: 'medical-institutions',
    title: 'Medical Institutions',
    description:
      'Coordinate academic schedules, clinical rotations, duty rosters and specialised attendance requirements.',
    capabilities: [
      'Clinical rotation planning',
      'Duty-roster management',
      'Specialised attendance',
    ],
    icon: HeartPulse,
    href: '/solutions/medical-colleges',
  },
  {
    id: 'online-learning',
    title: 'Online and Distance Learning',
    description:
      'Deliver flexible learning experiences for remote students, distributed faculty and global cohorts.',
    capabilities: [
      'Digital course delivery',
      'Remote assessments',
      'Learner engagement',
    ],
    icon: Globe2,
    href: '/solutions/online-learning',
  },
];

function InstitutionCard({ institution }: { institution: InstitutionType }) {
  const Icon = institution.icon;

  return (
    <article
      className={[
        'group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-white p-6',
        'transition-[transform,border-color,box-shadow] duration-200',
        'hover:-translate-y-1 hover:border-[#B8CCEF] hover:shadow-[0_20px_50px_rgba(16,42,91,0.10)]',
        'focus-within:border-[#1754E8]',
        institution.featured
          ? 'border-[#AFC7F4] shadow-[0_16px_42px_rgba(23,84,232,0.10)]'
          : 'border-[#DFE6F0] shadow-[0_8px_28px_rgba(16,24,40,0.05)]',
      ].join(' ')}
    >
      {institution.featured && (
        <div className="absolute right-5 top-5 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1754E8]">
          Broadest scope
        </div>
      )}

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D5E1F5] bg-[#EDF3FF] text-[#1754E8]">
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </div>

      <h3 className="mt-6 pr-20 text-xl font-bold tracking-[-0.02em] text-[#101828]">
        {institution.title}
      </h3>

      <p className="mt-3 text-[15px] leading-7 text-[#5F6C7B]">
        {institution.description}
      </p>

      <ul className="mt-6 space-y-2.5">
        {institution.capabilities.map((capability) => (
          <li
            key={capability}
            className="flex items-start gap-2.5 text-sm leading-6 text-[#475467]"
          >
            <span
              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1754E8]"
              aria-hidden="true"
            />

            <span>{capability}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        <Link
          href={institution.href}
          aria-label={`Explore CampusOS for ${institution.title}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#1754E8] transition-colors hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
        >
          Explore this solution

          <ArrowRight
            className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

export function InstitutionTypeSection() {
  return (
    <section
      className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="institution-types-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[780px] text-center">
          <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Built for higher education
          </div>

          <h2
            id="institution-types-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            Configurable for every institutional model
          </h2>

          <p className="mx-auto mt-6 max-w-[720px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            CampusOS adapts to different academic structures, operational
            responsibilities and governance models without forcing every
            institution into the same workflow.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {institutionTypes.map((institution) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
            />
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-6 rounded-3xl border border-[#D8E2EF] bg-[#F7F9FC] px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="max-w-[760px]">
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[#101828]">
              Your institution operates differently?
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#5F6C7B] sm:text-[15px]">
              Explore how CampusOS can be configured around your academic
              structure, campuses, programmes, operational workflows and
              regional requirements.
            </p>
          </div>

          <Link
            href="/contact"
            className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,84,232,0.22)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F9FC]"
          >
            Discuss your requirements

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-[840px] text-center text-xs leading-5 text-[#8A95A6]">
          Available functionality may vary by institution configuration,
          deployment model, region and selected CampusOS modules.
        </p>
      </div>
    </section>
  );
}