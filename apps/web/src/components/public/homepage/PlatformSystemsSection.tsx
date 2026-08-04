import type { ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Check,
  GraduationCap,
  IndianRupee,
  LineChart,
  MessageSquare,
  Settings,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';

type PlatformSystem = {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  modules: readonly string[];
  roles: readonly string[];
  href: string;
  featured?: boolean;
};

const systems: readonly PlatformSystem[] = [
  {
    id: 'academics',
    title: 'Academics',
    icon: GraduationCap,
    description:
      'Coordinate curricula, teaching schedules, learning activities, assessments and academic outcomes.',
    modules: [
      'Curriculum planning',
      'Timetable generation',
      'Assignments and learning activities',
      'Examination management',
      'Outcome-based education',
    ],
    roles: ['Faculty', 'Students', 'Academic administrators'],
    href: '/platform/academics',
  },
  {
    id: 'admissions',
    title: 'Admissions',
    icon: UserPlus,
    description:
      'Manage applicant enquiries, applications, document reviews, selection and enrolment workflows.',
    modules: [
      'Configurable application forms',
      'Applicant enquiry management',
      'Merit and selection workflows',
      'Seat allocation',
      'Document verification',
    ],
    roles: ['Admissions teams', 'Applicants', 'Reviewers'],
    href: '/platform/admissions',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: IndianRupee,
    description:
      'Manage institutional fee structures, collections, concessions, refunds and financial records.',
    modules: [
      'Fee structures and invoicing',
      'Payment gateway workflows',
      'Scholarships and concessions',
      'Refund management',
      'Financial reporting',
    ],
    roles: ['Finance teams', 'Students', 'Authorised staff'],
    href: '/platform/finance',
  },
  {
    id: 'operations',
    title: 'Campus Operations',
    icon: Settings,
    description:
      'Coordinate physical infrastructure, campus services, accommodation, transport and service requests.',
    modules: [
      'Hostel and room allocation',
      'Transport and fleet operations',
      'Library services',
      'Visitor and gate-pass workflows',
      'Helpdesk and service requests',
    ],
    roles: ['Operations teams', 'Students', 'Campus staff'],
    href: '/platform/operations',
  },
  {
    id: 'people',
    title: 'People and HR',
    icon: Users,
    description:
      'Support employee records, attendance, leave, performance and institution-wide workforce processes.',
    modules: [
      'Employee onboarding',
      'Attendance management',
      'Leave workflows',
      'Performance reviews',
      'Payroll coordination',
    ],
    roles: ['HR teams', 'Employees', 'Leadership'],
    href: '/platform/people',
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: MessageSquare,
    description:
      'Deliver targeted announcements, notifications and secure communication across institutional groups.',
    modules: [
      'Targeted announcements',
      'Email and notification workflows',
      'Secure group communication',
      'Event communication',
      'Policy and disciplinary notices',
    ],
    roles: ['Students', 'Faculty', 'Staff', 'Administrators'],
    href: '/platform/communication',
  },
  {
    id: 'analytics',
    title: 'Analytics and Intelligence',
    icon: LineChart,
    description:
      'Bring institutional information together through role-aware dashboards, reports and operational insights.',
    modules: [
      'Institutional reporting',
      'Student-risk indicators',
      'Financial performance dashboards',
      'Faculty workload analysis',
      'Configurable reporting views',
    ],
    roles: ['Leadership', 'Administrators', 'Authorised analysts'],
    href: '/platform/analytics',
    featured: true,
  },
];

function ModuleList({ modules }: { modules: readonly string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {modules.map((module) => (
        <li
          key={module}
          className="flex items-start gap-2.5 text-sm leading-6 text-[#475467]"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E9F8F2]">
            <Check
              className="h-3.5 w-3.5 text-[#078A57]"
              strokeWidth={2.6}
              aria-hidden="true"
            />
          </span>

          <span>{module}</span>
        </li>
      ))}
    </ul>
  );
}

function RoleList({ roles }: { roles: readonly string[] }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2" aria-label="Relevant user roles">
      {roles.map((role) => (
        <span
          key={role}
          className="inline-flex min-h-7 items-center rounded-full border border-[#DDE4EE] bg-[#F7F9FC] px-3 text-[11px] font-semibold text-[#5F6C7B]"
        >
          {role}
        </span>
      ))}
    </div>
  );
}

function PlatformSystemCard({ system }: { system: PlatformSystem }) {
  const Icon = system.icon;

  return (
    <article className="group flex h-full flex-col rounded-3xl border border-[#DFE6F0] bg-white p-6 shadow-[0_8px_28px_rgba(16,24,40,0.05)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-[#B8CCEF] hover:shadow-[0_20px_48px_rgba(16,42,91,0.10)] sm:p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D5E1F5] bg-[#EDF3FF] text-[#1754E8]">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
        </div>

        <div>
          <h3 className="text-xl font-bold tracking-[-0.02em] text-[#101828]">
            {system.title}
          </h3>

          <p className="mt-2 text-[14px] leading-6 text-[#5F6C7B]">
            {system.description}
          </p>
        </div>
      </div>

      <div className="mt-7 flex-1 border-t border-[#E4E9F0] pt-6">
        <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#344054]">
          Core capabilities
        </p>

        <ModuleList modules={system.modules} />
      </div>

      <RoleList roles={system.roles} />

      <div className="mt-7 border-t border-[#E4E9F0] pt-5">
        <Link
          href={system.href}
          aria-label={`Explore the ${system.title} system`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#1754E8] transition-colors hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
        >
          Explore system

          <ArrowRight
            className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}

function FeaturedAnalyticsCard({
  system,
}: {
  system: PlatformSystem;
}) {
  const Icon = system.icon;

  return (
    <article className="relative overflow-hidden rounded-3xl border border-[#29466F] bg-[#101D38] px-6 py-8 text-white shadow-[0_24px_60px_rgba(16,29,56,0.18)] sm:px-8 lg:px-10 lg:py-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
        <div>
          <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#D9E5F7]">
            <Sparkles className="h-3.5 w-3.5 text-[#86AFFF]" aria-hidden="true" />
            Connected intelligence layer
          </div>

          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-[#8CB2FF]">
              <Icon className="h-7 w-7" strokeWidth={2} aria-hidden="true" />
            </div>

            <div>
              <h3 className="text-2xl font-bold tracking-[-0.025em] sm:text-3xl">
                {system.title}
              </h3>

              <p className="mt-3 max-w-[560px] text-[15px] leading-7 text-[#BBC7D9]">
                {system.description}
              </p>
            </div>
          </div>

          <RoleList roles={system.roles} />

          <Link
            href={system.href}
            aria-label={`Explore the ${system.title} system`}
            className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#101D38] transition-colors hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
          >
            Explore analytics

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#AFC2DF]">
            Connected capabilities
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {system.modules.map((module) => (
              <div
                key={module}
                className="flex min-h-[72px] items-start gap-3 rounded-xl border border-white/10 bg-[#152542] p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#203A68] text-[#91B5FF]">
                  <BarChart3
                    className="h-4 w-4"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                <span className="pt-1 text-sm font-medium leading-5 text-[#E3EAF4]">
                  {module}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export function PlatformSystemsSection() {
  const standardSystems = systems.filter((system) => !system.featured);
  const featuredSystem = systems.find((system) => system.featured);

  return (
    <section
      className="bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="platform-systems-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[780px] text-center">
          <div className="inline-flex min-h-8 items-center rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            The CampusOS platform
          </div>

          <h2
            id="platform-systems-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            Seven systems connected through one institutional platform
          </h2>

          <p className="mx-auto mt-6 max-w-[720px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            Bring academic, administrative, financial and campus workflows
            together while maintaining the role, permission and operational
            context of every user.
          </p>
        </header>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {standardSystems.map((system) => (
            <PlatformSystemCard key={system.id} system={system} />
          ))}
        </div>

        {featuredSystem && (
          <div className="mt-6">
            <FeaturedAnalyticsCard system={featuredSystem} />
          </div>
        )}

        <div className="mt-12 flex flex-col gap-6 rounded-3xl border border-[#D8E2EF] bg-white px-6 py-8 shadow-[0_10px_32px_rgba(16,24,40,0.04)] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div className="max-w-[760px]">
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[#101828]">
              Explore how CampusOS systems work together
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#5F6C7B] sm:text-[15px]">
              Review the complete platform architecture, shared data model,
              role-based workspaces and connected institutional workflows.
            </p>
          </div>

          <Link
            href="/platform"
            className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,84,232,0.22)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
          >
            View the full platform

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-[900px] text-center text-xs leading-5 text-[#8A95A6]">
          Capability availability may vary by institution configuration,
          deployment model, region and selected CampusOS modules.
        </p>
      </div>
    </section>
  );
}