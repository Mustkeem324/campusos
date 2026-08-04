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
  Landmark,
  Network,
  ShieldCheck,
} from 'lucide-react';

type InstitutionModel = {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
};

const institutionModels: readonly InstitutionModel[] = [
  {
    id: 'public-universities',
    title: 'Public Universities',
    description:
      'Support complex academic structures, governance processes and institution-wide operations.',
    icon: Landmark,
  },
  {
    id: 'private-universities',
    title: 'Private Universities',
    description:
      'Coordinate student services, academic delivery, finance and multi-campus administration.',
    icon: Building2,
  },
  {
    id: 'autonomous-colleges',
    title: 'Autonomous Colleges',
    description:
      'Manage independent curricula, examinations, grading rules and academic reporting.',
    icon: BookOpenCheck,
  },
  {
    id: 'community-colleges',
    title: 'Community Colleges',
    description:
      'Deliver accessible programmes, flexible enrolment and student-support workflows.',
    icon: GraduationCap,
  },
  {
    id: 'engineering-institutions',
    title: 'Engineering Institutions',
    description:
      'Coordinate laboratories, technical programmes, projects, assessments and placements.',
    icon: Cpu,
  },
  {
    id: 'medical-institutions',
    title: 'Medical Institutions',
    description:
      'Support clinical rotations, specialist schedules, attendance and academic compliance.',
    icon: HeartPulse,
  },
  {
    id: 'online-education',
    title: 'Online Education Providers',
    description:
      'Manage remote learners, digital delivery, assessments and distributed academic teams.',
    icon: Globe2,
  },
];

function InstitutionModelCard({
  model,
}: {
  model: InstitutionModel;
}) {
  const Icon = model.icon;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[#DFE6F0] bg-white p-5 shadow-[0_8px_26px_rgba(16,24,40,0.045)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#B8CCEF] hover:shadow-[0_18px_42px_rgba(16,42,91,0.09)] sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D3E0F5] bg-[#EDF3FF] text-[#1754E8]">
        <Icon
          className="h-5 w-5"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <h3 className="mt-5 text-base font-bold tracking-[-0.015em] text-[#101828]">
        {model.title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#5F6C7B]">
        {model.description}
      </p>
    </article>
  );
}

export function CustomerProofSection() {
  return (
    <section
      className="border-y border-[#DFE6F0] bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8"
      aria-labelledby="institutional-models-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[790px] text-center">
          <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            <Network className="h-4 w-4" aria-hidden="true" />
            Institutional models
          </div>

          <h2
            id="institutional-models-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[46px] lg:leading-[1.14]"
          >
            Configurable for diverse higher-education institutions
          </h2>

          <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            CampusOS can support different academic structures, governance
            models and operational requirements through configurable modules,
            roles and workflows.
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {institutionModels.slice(0, 4).map((model) => (
            <InstitutionModelCard key={model.id} model={model} />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {institutionModels.slice(4).map((model) => (
            <InstitutionModelCard key={model.id} model={model} />
          ))}
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-[#D8E2EF] bg-white shadow-[0_12px_36px_rgba(16,24,40,0.05)]">
          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF8F3] text-[#078A57]">
                  <ShieldCheck
                    className="h-5 w-5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-[-0.02em] text-[#101828]">
                    Procurement and institutional evaluation
                  </h3>

                  <p className="mt-3 max-w-[690px] text-sm leading-7 text-[#5F6C7B]">
                    Qualified institutions can review relevant product
                    documentation, deployment options, security information and
                    implementation considerations during the procurement
                    process.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center border-t border-[#DFE6F0] bg-[#101D38] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold text-white">
                Evaluating CampusOS for your institution?
              </p>

              <p className="mt-2 text-sm leading-6 text-[#BBC7D9]">
                Discuss your institutional model, programme structure and
                operational requirements with the CampusOS team.
              </p>

              <Link
                href="/contact"
                className="group mt-5 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#101D38] transition-colors hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
              >
                Start a discussion

                <ArrowRight
                  className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-[860px] text-center text-xs leading-5 text-[#8A95A6]">
          Product configuration, module availability and deployment options may
          vary according to institutional requirements, region and selected
          CampusOS services.
        </p>
      </div>
    </section>
  );
}