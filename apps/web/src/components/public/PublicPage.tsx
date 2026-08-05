import type { ElementType } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Code2,
  Database,
  FileCheck2,
  FileText,
  Globe2,
  Handshake,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  MapPin,
  Network,
  Scale,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';

import {
  regions,
  titleFromSlug,
  type Region,
} from './site-data';

type SectionRoot =
  | 'platform'
  | 'solutions'
  | 'roles'
  | 'security'
  | 'pricing'
  | 'resources'
  | 'legal'
  | 'about'
  | 'contact'
  | 'demo'
  | 'integrations'
  | 'trust'
  | 'developers'
  | 'partners'
  | 'status';

type SectionConfig = {
  eyebrow: string;
  intro: string;
  modules: readonly string[];
  icon: ElementType;
  previewTitle: string;
  previewDescription: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryAction: {
    label: string;
    href: string;
  };
};

const sections: Record<SectionRoot, SectionConfig> = {
  platform: {
    eyebrow: 'CONNECTED PLATFORM',
    intro:
      'CampusOS brings academic, administrative and student-facing teams into one governed institutional operating model.',
    modules: [
      'Connected institutional records',
      'Configurable operational workflows',
      'Role-aware reporting',
    ],
    icon: LayoutDashboard,
    previewTitle: 'Connected workspace',
    previewDescription:
      'See institutional responsibilities, approvals and records within the correct operational context.',
    primaryAction: {
      label: 'Explore the platform',
      href: '/platform',
    },
    secondaryAction: {
      label: 'Book a demonstration',
      href: '/demo',
    },
  },

  solutions: {
    eyebrow: 'INSTITUTIONAL SOLUTIONS',
    intro:
      'Purpose-built operating patterns for the priorities, governance structures and service models of higher education.',
    modules: [
      'Institution-aware configuration',
      'Cross-team operational visibility',
      'Phased implementation planning',
    ],
    icon: Building2,
    previewTitle: 'Institutional solution',
    previewDescription:
      'Configure CampusOS around your institution’s structure, programmes, campuses and responsibilities.',
    primaryAction: {
      label: 'Explore solutions',
      href: '/solutions',
    },
    secondaryAction: {
      label: 'Discuss requirements',
      href: '/contact',
    },
  },

  roles: {
    eyebrow: 'ROLE-BASED OPERATIONS',
    intro:
      'Give each institutional role the right workspace, information and actions without unnecessarily broadening access.',
    modules: [
      'Prioritised daily work',
      'Role-specific reporting',
      'Permission-aware access',
    ],
    icon: UsersRound,
    previewTitle: 'Role-aware workspace',
    previewDescription:
      'Each user sees workflows and information relevant to their assigned institutional responsibilities.',
    primaryAction: {
      label: 'Explore role experiences',
      href: '/roles',
    },
    secondaryAction: {
      label: 'Open demonstration',
      href: '/demo',
    },
  },

  security: {
    eyebrow: 'TRUST AND SECURITY',
    intro:
      'Review controls and operating practices designed to support institution-configured security, privacy and governance programmes.',
    modules: [
      'Identity and access controls',
      'Reviewable activity history',
      'Documented security practices',
    ],
    icon: ShieldCheck,
    previewTitle: 'Security overview',
    previewDescription:
      'Understand how identity, permissions, institutional context and workflow history can be applied.',
    primaryAction: {
      label: 'Visit Security Centre',
      href: '/security',
    },
    secondaryAction: {
      label: 'Contact our team',
      href: '/contact',
    },
  },

  pricing: {
    eyebrow: 'FLEXIBLE PROCUREMENT',
    intro:
      'Shape CampusOS around your modules, campuses, active student population, deployment model and implementation scope.',
    modules: [
      'Institutional pricing model',
      'Implementation planning',
      'Procurement support',
    ],
    icon: BadgeDollarSign,
    previewTitle: 'Institutional plan',
    previewDescription:
      'Review a CampusOS configuration aligned with your operational scale and deployment requirements.',
    primaryAction: {
      label: 'Review pricing options',
      href: '/pricing',
    },
    secondaryAction: {
      label: 'Request tailored pricing',
      href: '/contact',
    },
  },

  resources: {
    eyebrow: 'CAMPUSOS RESOURCES',
    intro:
      'Practical material for teams selecting, implementing and operating connected higher-education systems.',
    modules: [
      'Institutional decision support',
      'Implementation guidance',
      'Operational playbooks',
    ],
    icon: BookOpen,
    previewTitle: 'Resource library',
    previewDescription:
      'Explore practical guidance covering institutional technology, implementation and operations.',
    primaryAction: {
      label: 'Browse resources',
      href: '/resources/guides',
    },
    secondaryAction: {
      label: 'View product blueprint',
      href: '/blueprint',
    },
  },

  legal: {
    eyebrow: 'LEGAL AND DATA INFORMATION',
    intro:
      'Review public information supporting transparent, responsible CampusOS operations and procurement discussions.',
    modules: [
      'Clear public information',
      'Reviewable operating practices',
      'Institutional responsibility',
    ],
    icon: Scale,
    previewTitle: 'Legal information',
    previewDescription:
      'Review applicable public policies, terms and data-processing information.',
    primaryAction: {
      label: 'Review legal information',
      href: '/legal/privacy',
    },
    secondaryAction: {
      label: 'Contact CampusOS',
      href: '/contact',
    },
  },

  about: {
    eyebrow: 'ABOUT CAMPUSOS',
    intro:
      'CampusOS helps higher-education institutions coordinate the work enabling learning, service and accountable administration.',
    modules: [
      'Higher-education focus',
      'Connected operations',
      'Responsible product delivery',
    ],
    icon: Building2,
    previewTitle: 'CampusOS mission',
    previewDescription:
      'Connect academic, administrative and student-service responsibilities through one institutional platform.',
    primaryAction: {
      label: 'Learn about CampusOS',
      href: '/about',
    },
    secondaryAction: {
      label: 'Meet our team',
      href: '/contact',
    },
  },

  contact: {
    eyebrow: 'CONTACT CAMPUSOS',
    intro:
      'Connect with a CampusOS specialist to discuss your institution’s operating priorities and implementation requirements.',
    modules: [
      'Discovery conversation',
      'Regional and institutional context',
      'Implementation planning',
    ],
    icon: LifeBuoy,
    previewTitle: 'Institutional consultation',
    previewDescription:
      'Start with your current systems, priority workflows and desired implementation outcomes.',
    primaryAction: {
      label: 'Contact our team',
      href: '/contact',
    },
    secondaryAction: {
      label: 'Book a demonstration',
      href: '/demo',
    },
  },

  demo: {
    eyebrow: 'CAMPUSOS DEMO',
    intro:
      'See a focused walkthrough of the workspaces and workflows most relevant to your institution.',
    modules: [
      'Role-based walkthrough',
      'Connected workflow discussion',
      'Clear next-step planning',
    ],
    icon: Sparkles,
    previewTitle: 'Guided product demonstration',
    previewDescription:
      'Explore fictional role-aware workspaces and connected institutional workflows.',
    primaryAction: {
      label: 'Book a demonstration',
      href: '/demo',
    },
    secondaryAction: {
      label: 'Explore the platform',
      href: '/platform',
    },
  },

  integrations: {
    eyebrow: 'INTEGRATIONS',
    intro:
      'Plan a connected higher-education technology environment with deliberate data, ownership and operating boundaries.',
    modules: [
      'Integration planning',
      'Data ownership definition',
      'Migration readiness',
    ],
    icon: Network,
    previewTitle: 'Integration architecture',
    previewDescription:
      'Understand how approved institutional systems can exchange data through controlled integration boundaries.',
    primaryAction: {
      label: 'Explore integrations',
      href: '/integrations',
    },
    secondaryAction: {
      label: 'Discuss your systems',
      href: '/contact',
    },
  },

  trust: {
    eyebrow: 'CAMPUSOS TRUST CENTRE',
    intro:
      'Review public information about CampusOS security, privacy, availability and continuity practices.',
    modules: [
      'Security overview',
      'Privacy information',
      'Availability planning',
    ],
    icon: LockKeyhole,
    previewTitle: 'Trust information',
    previewDescription:
      'Review available security, privacy and operational information for institutional evaluation.',
    primaryAction: {
      label: 'Open Trust Centre',
      href: '/trust',
    },
    secondaryAction: {
      label: 'View security information',
      href: '/security',
    },
  },

  developers: {
    eyebrow: 'DEVELOPER PORTAL',
    intro:
      'Technical resources for teams planning controlled and accountable CampusOS integrations.',
    modules: [
      'API planning',
      'Integration patterns',
      'Technical implementation support',
    ],
    icon: Code2,
    previewTitle: 'Developer workspace',
    previewDescription:
      'Review integration patterns, technical boundaries and implementation considerations.',
    primaryAction: {
      label: 'Explore developer resources',
      href: '/developers',
    },
    secondaryAction: {
      label: 'Discuss an integration',
      href: '/contact',
    },
  },

  partners: {
    eyebrow: 'CAMPUSOS PARTNERS',
    intro:
      'Work with CampusOS to support thoughtful higher-education transformation, delivery and adoption.',
    modules: [
      'Delivery partnerships',
      'Technology partnerships',
      'Shared institutional outcomes',
    ],
    icon: Handshake,
    previewTitle: 'Partner ecosystem',
    previewDescription:
      'Coordinate delivery responsibilities, technology connections and institutional outcomes.',
    primaryAction: {
      label: 'Explore partnerships',
      href: '/partners',
    },
    secondaryAction: {
      label: 'Contact CampusOS',
      href: '/contact',
    },
  },

  status: {
    eyebrow: 'SYSTEM STATUS',
    intro:
      'View public service-status information and planned operational communications.',
    modules: [
      'Service visibility',
      'Incident communication',
      'Maintenance planning',
    ],
    icon: Database,
    previewTitle: 'Service-status information',
    previewDescription:
      'Review currently published information about platform availability and planned maintenance.',
    primaryAction: {
      label: 'View system status',
      href: '/status',
    },
    secondaryAction: {
      label: 'Contact support',
      href: '/contact',
    },
  },
};

const operatingSteps = [
  {
    id: 'coordinate',
    number: '01',
    title: 'Coordinate',
    description:
      'Bring responsible teams, records and approvals into one visible workflow.',
    icon: Workflow,
  },
  {
    id: 'measure',
    number: '02',
    title: 'Measure',
    description:
      'Review progress, exceptions and institutional outcomes using authorised data.',
    icon: FileCheck2,
  },
  {
    id: 'improve',
    number: '03',
    title: 'Improve',
    description:
      'Refine processes using operational evidence, ownership and structured follow-up.',
    icon: Settings2,
  },
] as const;

const frequentlyAskedQuestions = [
  {
    question: 'Can CampusOS work with our current institutional systems?',
    answer:
      'Integration scope depends on the current systems, available interfaces, data ownership and technical requirements. These are reviewed during discovery and implementation planning.',
  },
  {
    question: 'How is the CampusOS rollout planned?',
    answer:
      'Rollout planning normally considers institutional priorities, selected modules, data readiness, integrations, user training and an agreed phased implementation approach.',
  },
  {
    question: 'How do regional requirements affect configuration?',
    answer:
      'Terminology, institutional structures, policies and operational expectations can vary by region. These requirements are reviewed with the institution during discovery.',
  },
] as const;

type PublicPageProps = {
  segments: string[];
  region?: Region;
};

export function PublicPage({
  segments,
  region = 'us',
}: PublicPageProps) {
  const root = segments[0] as SectionRoot;
  const config = sections[root];

  if (!config) {
    notFound();
  }

  const title =
    segments.length === 1
      ? titleFromSlug(root)
      : titleFromSlug(segments[segments.length - 1]);

  const local = regions[region];

  const isSecurityPage =
    root === 'security' || root === 'trust';

  const PageIcon = config.icon;

  return (
    <div className="bg-white text-[#101828]">
      <section className="border-b border-[#DDE4EE] bg-[#F7F9FC] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1280px]">
          <Breadcrumb
            root={root}
            segments={segments}
            title={title}
          />

          <div className="mt-9 grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <div>
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold tracking-[0.12em] text-[#1754E8]">
                <PageIcon
                  className="h-4 w-4"
                  strokeWidth={2}
                  aria-hidden="true"
                />

                {config.eyebrow}
              </div>

              <h1 className="mt-6 max-w-[760px] text-balance text-4xl font-bold leading-[1.07] tracking-[-0.04em] text-[#101A32] sm:text-5xl lg:text-[58px]">
                {title}
                <span className="mt-2 block text-[#1754E8]">
                  for modern higher education
                </span>
              </h1>

              <p className="mt-6 max-w-[700px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
                {config.intro}
              </p>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#D8E2EF] bg-white p-4">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]"
                  aria-hidden="true"
                />

                <p className="text-sm leading-6 text-[#5F6C7B]">
                  Presented using terminology and implementation context
                  appropriate for{' '}
                  <strong className="font-semibold text-[#101828]">
                    {local.label}
                  </strong>{' '}
                  and a {local.institution}.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={config.primaryAction.href}
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,84,232,0.23)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F9FC]"
                >
                  {config.primaryAction.label}

                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href={config.secondaryAction.href}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#C9D3E1] bg-white px-6 py-3 text-sm font-semibold text-[#101828] transition-colors hover:border-[#1754E8] hover:bg-[#F2F6FF] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
                >
                  {config.secondaryAction.label}
                </Link>
              </div>
            </div>

            <ProductPreview
              title={title}
              config={config}
            />
          </div>
        </div>
      </section>

      <main id="main-content">
        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
                  Accountable operations
                </p>

                <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl">
                  Designed around visible ownership and responsible action
                </h2>

                <p className="mt-5 text-base leading-7 text-[#5F6C7B]">
                  Replace disconnected handoffs with clear responsibilities,
                  reviewable decisions and operational context that follows the
                  learner or institutional process.
                </p>

                <Link
                  href="/platform"
                  className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#1754E8] hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
                >
                  Explore connected operations

                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {config.modules.map((module, index) => (
                  <article
                    key={module}
                    className="rounded-2xl border border-[#DDE4EE] bg-white p-5 shadow-[0_8px_26px_rgba(16,24,40,0.045)]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                      <span className="text-xs font-bold">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-5 text-base font-semibold leading-6 text-[#101828]">
                      {module}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#667085]">
                      Configure this capability according to institutional
                      responsibilities, policies and selected CampusOS modules.
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#DDE4EE] bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <header className="max-w-[760px]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
                Connected operating model
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl">
                From daily work to institutional insight
              </h2>

              <p className="mt-5 text-base leading-7 text-[#5F6C7B]">
                CampusOS helps responsible teams coordinate activity, review
                outcomes and improve institutional processes over time.
              </p>
            </header>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {operatingSteps.map((step, index) => {
                const StepIcon = step.icon;

                return (
                  <article
                    key={step.id}
                    className="relative rounded-3xl border border-[#DDE4EE] bg-white p-6 shadow-[0_10px_30px_rgba(16,24,40,0.045)] sm:p-7"
                  >
                    {index < operatingSteps.length - 1 && (
                      <ChevronRight
                        className="absolute -right-[17px] top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full border border-[#DDE4EE] bg-white p-2 text-[#1754E8] md:block"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                        <StepIcon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <span className="text-xs font-bold tracking-[0.1em] text-[#98A2B3]">
                        {step.number}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-bold text-[#101828]">
                      {step.title} with context
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#5F6C7B]">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid gap-8 lg:grid-cols-2">
              <article className="rounded-3xl border border-[#DDE4EE] bg-white p-6 shadow-[0_10px_30px_rgba(16,24,40,0.045)] sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                  <Layers3 className="h-5 w-5" aria-hidden="true" />
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-[-0.025em] text-[#101828]">
                  Implementation and integration
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#5F6C7B]">
                  Start with priority workflows, then plan configuration,
                  migration, integrations, training and adoption milestones
                  with responsible institutional teams.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    'Institutional discovery and scope',
                    'Data and integration readiness',
                    'Role-based validation and training',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-[#475467]"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#078A57]"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/contact"
                  className="group mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#1754E8]"
                >
                  Discuss implementation

                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </article>

              <article className="rounded-3xl border border-[#29466F] bg-[#101D38] p-6 text-white shadow-[0_18px_48px_rgba(16,29,56,0.16)] sm:p-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-[#8CB2FF]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-[-0.025em]">
                  Security and governance consideration
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#BBC7D9]">
                  Access is designed around institution-configured roles,
                  institutional context and reviewable actions.
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm leading-6 text-[#D5DEEB]">
                    {isSecurityPage
                      ? 'This page describes product practices and available information. It does not represent an independent certification or legal conclusion.'
                      : 'Security, privacy and governance requirements should be reviewed with your institution during implementation.'}
                  </p>
                </div>

                <Link
                  href="/security"
                  className="group mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white"
                >
                  Review trust information

                  <ArrowRight
                    className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </article>
            </div>
          </div>
        </section>

        <FaqSection />

        <section className="bg-[#101D38] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[760px]">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8CB2FF]">
                Next step
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
                Plan the next stage of your institutional operations
              </h2>

              <p className="mt-4 text-base leading-7 text-[#BBC7D9]">
                Talk with a CampusOS specialist about your priorities,
                workflows and implementation requirements for {local.label}.
              </p>
            </div>

            <Link
              href="/demo"
              className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#101D38] transition-colors hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
            >
              Book a demonstration

              <ArrowRight
                className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function Breadcrumb({
  root,
  segments,
  title,
}: {
  root: string;
  segments: string[];
  title: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-2 text-sm text-[#667085]"
    >
      <Link
        href="/"
        className="rounded-sm transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
      >
        Home
      </Link>

      <ChevronRight
        className="h-4 w-4 text-[#98A2B3]"
        aria-hidden="true"
      />

      {segments.length > 1 ? (
        <>
          <Link
            href={`/${root}`}
            className="rounded-sm transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
          >
            {titleFromSlug(root)}
          </Link>

          <ChevronRight
            className="h-4 w-4 text-[#98A2B3]"
            aria-hidden="true"
          />

          <span
            className="font-medium text-[#344054]"
            aria-current="page"
          >
            {title}
          </span>
        </>
      ) : (
        <span
          className="font-medium text-[#344054]"
          aria-current="page"
        >
          {title}
        </span>
      )}
    </nav>
  );
}

function ProductPreview({
  title,
  config,
}: {
  title: string;
  config: SectionConfig;
}) {
  const PreviewIcon = config.icon;

  return (
    <div
      className="relative mx-auto w-full max-w-[650px]"
      aria-label={`Illustrative CampusOS ${title} workspace`}
    >
      <div className="absolute -inset-5 rounded-[32px] bg-[#E5ECFA] opacity-70 blur-2xl" />

      <div className="relative overflow-hidden rounded-3xl border border-[#C9D5E5] bg-white shadow-[0_28px_70px_rgba(16,42,91,0.15)]">
        <div className="flex items-center justify-between border-b border-[#DDE4EE] bg-white px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1754E8] text-white">
              <PreviewIcon
                className="h-4.5 w-4.5"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#101828]">
                {config.previewTitle}
              </p>

              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.09em] text-[#8A95A6]">
                Illustrative CampusOS workspace
              </p>
            </div>
          </div>

          <span className="hidden rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1754E8] sm:inline-flex">
            Example interface
          </span>
        </div>

        <div className="bg-[#F5F7FB] p-5 sm:p-6">
          <h3 className="text-xl font-bold tracking-[-0.02em] text-[#101828]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#667085]">
            {config.previewDescription}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {config.modules.map((module, index) => (
              <div
                key={module}
                className="rounded-xl border border-[#DDE4EE] bg-white p-4 shadow-[0_5px_18px_rgba(16,24,40,0.04)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EDF3FF] text-xs font-bold text-[#1754E8]">
                    0{index + 1}
                  </span>

                  <CheckCircle2
                    className="h-4 w-4 text-[#078A57]"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-4 text-xs font-semibold leading-5 text-[#344054]">
                  {module}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[#DDE4EE] bg-white p-4">
            <div className="flex items-center gap-2">
              <Workflow
                className="h-4 w-4 text-[#1754E8]"
                aria-hidden="true"
              />

              <p className="text-xs font-semibold text-[#101828]">
                Connected workflow context
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {[
                'Responsible user and assigned role',
                'Institutional record and current status',
                'Required action and review history',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg bg-[#F7F9FC] px-3 py-2.5"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-[#1754E8]"
                    aria-hidden="true"
                  />

                  <span className="text-[11px] font-medium text-[#5F6C7B]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[#DDE4EE] bg-white px-5 py-3 text-center text-[10px] text-[#7C889A]">
          Illustrative interface. Capabilities depend on configured CampusOS
          modules.
        </div>
      </div>
    </div>
  );
}

function FaqSection() {
  return (
    <section className="border-y border-[#DDE4EE] bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-[1000px]">
        <header className="max-w-[700px]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
            <CircleHelp className="h-5 w-5" aria-hidden="true" />
          </div>

          <h2 className="mt-5 text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl">
            Frequently asked questions
          </h2>

          <p className="mt-4 text-base leading-7 text-[#5F6C7B]">
            Common considerations for institutions evaluating CampusOS.
          </p>
        </header>

        <div className="mt-9 divide-y divide-[#DDE4EE] overflow-hidden rounded-2xl border border-[#DDE4EE] bg-white">
          {frequentlyAskedQuestions.map((item) => (
            <details
              key={item.question}
              className="group px-5 py-5 sm:px-6"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-lg font-semibold text-[#101828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]">
                <span>{item.question}</span>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2F4F7] text-[#667085] transition-transform group-open:rotate-90">
                  <ChevronRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </span>
              </summary>

              <p className="mt-4 max-w-[820px] text-sm leading-7 text-[#5F6C7B]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}