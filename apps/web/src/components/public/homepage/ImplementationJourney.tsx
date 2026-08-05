import type { ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileCheck2,
  GraduationCap,
  Layers3,
  Rocket,
  SearchCheck,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

type ImplementationStage = {
  id: string;
  number: number;
  title: string;
  description: string;
  activities: readonly string[];
  output: string;
  owner: string;
  icon: ElementType;
};

const implementationStages: readonly ImplementationStage[] = [
  {
    id: 'discovery',
    number: 1,
    title: 'Discovery',
    description:
      'Understand institutional priorities, existing systems, responsibilities and operational dependencies.',
    activities: [
      'Stakeholder workshops',
      'Current-process mapping',
      'Module and integration assessment',
    ],
    output: 'Implementation blueprint',
    owner: 'CampusOS and institution',
    icon: SearchCheck,
  },
  {
    id: 'configuration',
    number: 2,
    title: 'Configuration',
    description:
      'Configure CampusOS around the institution’s academic structure, roles, policies and enabled modules.',
    activities: [
      'Institution and campus setup',
      'Role and permission configuration',
      'Workflow parameterisation',
    ],
    output: 'Configured environment',
    owner: 'CampusOS implementation team',
    icon: Settings2,
  },
  {
    id: 'data-migration',
    number: 3,
    title: 'Data Migration',
    description:
      'Prepare, validate and import agreed legacy records through controlled migration activities.',
    activities: [
      'Source-data assessment',
      'Cleaning and transformation',
      'Migration reconciliation',
    ],
    output: 'Validated institutional records',
    owner: 'Joint data team',
    icon: Database,
  },
  {
    id: 'validation',
    number: 4,
    title: 'Validation',
    description:
      'Verify configured workflows, permissions, migrated records and operational scenarios before release.',
    activities: [
      'User acceptance testing',
      'Role and access verification',
      'Issue resolution and sign-off',
    ],
    output: 'Readiness and sign-off record',
    owner: 'Institution core team',
    icon: ClipboardCheck,
  },
  {
    id: 'training',
    number: 5,
    title: 'Training',
    description:
      'Prepare institutional teams through role-specific learning, guided practice and operational documentation.',
    activities: [
      'Role-based training sessions',
      'Administrator enablement',
      'Champion and support preparation',
    ],
    output: 'Prepared institutional users',
    owner: 'CampusOS customer success',
    icon: GraduationCap,
  },
  {
    id: 'go-live',
    number: 6,
    title: 'Pilot and Go-Live',
    description:
      'Release CampusOS through an agreed rollout plan with monitoring, support and transition activities.',
    activities: [
      'Pilot-group activation',
      'Phased user rollout',
      'Post-launch monitoring',
    ],
    output: 'Operational CampusOS environment',
    owner: 'Joint implementation team',
    icon: Rocket,
  },
];

const implementationPrinciples = [
  {
    id: 'accountability',
    title: 'Clear accountability',
    description:
      'Each stage identifies responsible teams, activities and expected outputs.',
    icon: UsersRound,
  },
  {
    id: 'validation',
    title: 'Controlled validation',
    description:
      'Configuration and migrated records are reviewed before operational use.',
    icon: FileCheck2,
  },
  {
    id: 'security',
    title: 'Security-aware delivery',
    description:
      'Access, institutional context and data-handling requirements remain part of implementation planning.',
    icon: ShieldCheck,
  },
] as const;

function ImplementationStageCard({
  stage,
  isLast,
}: {
  stage: ImplementationStage;
  isLast: boolean;
}) {
  const Icon = stage.icon;

  return (
    <article className="group relative flex h-full flex-col rounded-3xl border border-[#DDE4EE] bg-white p-6 shadow-[0_10px_30px_rgba(16,24,40,0.05)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#B8CCEF] hover:shadow-[0_20px_46px_rgba(16,42,91,0.1)] sm:p-7">
      {!isLast && (
        <div
          className="absolute -right-5 top-12 hidden h-px w-10 bg-[#BFCDE2] lg:block"
          aria-hidden="true"
        >
          <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-[#7C94B8]" />
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-[#EDF3FF] text-[#1754E8]">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
        </div>

        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#101D38] px-2.5 text-xs font-bold text-white">
          {stage.number}
        </span>
      </div>

      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.11em] text-[#1754E8]">
        Stage {stage.number}
      </p>

      <h3 className="mt-2 text-xl font-bold tracking-[-0.02em] text-[#101828]">
        {stage.title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#5F6C7B]">
        {stage.description}
      </p>

      <div className="mt-6 flex-1 border-t border-[#E4E9F0] pt-5">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#344054]">
          Core activities
        </h4>

        <ul className="mt-4 space-y-3">
          {stage.activities.map((activity) => (
            <li
              key={activity}
              className="flex items-start gap-2.5 text-sm leading-6 text-[#475467]"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#078A57]"
                strokeWidth={2.2}
                aria-hidden="true"
              />

              <span>{activity}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 space-y-4 border-t border-[#E4E9F0] pt-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C889A]">
            Expected output
          </p>

          <p className="mt-1.5 text-sm font-semibold leading-6 text-[#101828]">
            {stage.output}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C889A]">
            Primary ownership
          </p>

          <p className="mt-1.5 text-sm font-medium leading-6 text-[#475467]">
            {stage.owner}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ImplementationJourney() {
  return (
    <section
      className="bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="implementation-journey-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[820px] text-center">
          <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            <Layers3 className="h-4 w-4" aria-hidden="true" />
            Implementation journey
          </div>

          <h2
            id="implementation-journey-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            A structured path from planning to institutional adoption
          </h2>

          <p className="mx-auto mt-6 max-w-[760px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            CampusOS implementation is organised into six collaborative stages
            covering discovery, configuration, migration, validation, training
            and controlled rollout.
          </p>

          <p className="mx-auto mt-4 max-w-[720px] text-xs leading-5 text-[#7C889A]">
            Timelines, responsibilities and deliverables are agreed according
            to institutional scope, data readiness, integrations and selected
            CampusOS modules.
          </p>
        </header>

        <div className="mt-14 rounded-3xl border border-[#D8E2EF] bg-white p-5 shadow-[0_10px_30px_rgba(16,24,40,0.04)] sm:p-6 lg:mt-16">
          <ol
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            aria-label="CampusOS implementation stages"
          >
            {implementationStages.map((stage) => (
              <li
                key={stage.id}
                className="flex items-center gap-3 rounded-xl border border-[#E0E6EF] bg-[#FAFBFC] px-3 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1754E8] text-xs font-bold text-white">
                  {stage.number}
                </span>

                <span className="text-xs font-semibold leading-5 text-[#344054]">
                  {stage.title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {implementationStages.map((stage, index) => (
            <ImplementationStageCard
              key={stage.id}
              stage={stage}
              isLast={index === implementationStages.length - 1}
            />
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {implementationPrinciples.map((principle) => {
            const Icon = principle.icon;

            return (
              <article
                key={principle.id}
                className="flex items-start gap-4 rounded-2xl border border-[#DDE4EE] bg-white p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#101828]">
                    {principle.title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                    {principle.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-[#29466F] bg-[#101D38] shadow-[0_22px_56px_rgba(16,29,56,0.16)]">
          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-[#8CB2FF]">
                  <Rocket className="h-6 w-6" aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-xl font-bold tracking-[-0.02em] text-white sm:text-2xl">
                    Plan an implementation around your institution
                  </h3>

                  <p className="mt-3 max-w-[720px] text-sm leading-7 text-[#BBC7D9]">
                    Review your academic structure, existing data, deployment
                    requirements, integrations and rollout priorities with the
                    CampusOS team.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center border-t border-white/10 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <Link
                href="/contact"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#101D38] transition-colors hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
              >
                Discuss implementation

                <ArrowRight
                  className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}