import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileCheck2,
  Globe2,
  GraduationCap,
  Layers3,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';

export const metadata = {
  title: 'About CampusOS | Higher Education Operations',
  description:
    'Learn how CampusOS approaches connected, accountable and role-aware higher-education operations.',
};

const principles = [
  {
    title: 'Institution before software',
    description:
      'Start with institutional structure, responsibility, policy and operating reality before selecting a workflow or interface pattern.',
    icon: Building2,
  },
  {
    title: 'Accountability before automation',
    description:
      'Make ownership, approvals, exceptions and review paths clear before accelerating work through automation.',
    icon: FileCheck2,
  },
  {
    title: 'Trust before expansion',
    description:
      'Preserve tenant isolation, role boundaries, evidence and transparent communication as the platform grows.',
    icon: ShieldCheck,
  },
] as const;

const craftDetails = [
  'Confident hierarchy instead of visual noise',
  'Real operational context instead of generic dashboards',
  'Honest empty, unavailable and permission states',
  'Responsive and keyboard-accessible interaction',
  'Meaningful motion with reduced-motion support',
  'Design decisions that preserve institutional trust',
] as const;

const operatingModel = [
  {
    number: '01',
    title: 'Understand the institution',
    description:
      'Map campuses, programmes, roles, systems, records, approvals and service expectations.',
  },
  {
    number: '02',
    title: 'Design the operating context',
    description:
      'Define what each role needs to see, decide, approve and communicate across the institution.',
  },
  {
    number: '03',
    title: 'Implement in controlled phases',
    description:
      'Sequence migration, configuration, testing, training and adoption around accountable owners.',
  },
  {
    number: '04',
    title: 'Improve with evidence',
    description:
      'Refine workflows using authorised data, operational history and structured institutional feedback.',
  },
] as const;

export default function AboutPage() {
  return (
    <div className="bg-white text-[#101D38]">
      <section className="overflow-hidden border-b border-[#DDE5EF] bg-[#F4F7FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="about-heading">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-16">
            <div>
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                About CampusOS
              </div>
              <h1 id="about-heading" className="mt-7 max-w-3xl text-balance text-4xl font-extrabold leading-[1.03] tracking-[-0.05em] sm:text-5xl lg:text-[64px]">
                Building the operating layer higher education deserves
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#5F6C7B] sm:text-lg">
                CampusOS is designed to help higher-education institutions coordinate the work behind learning, service and accountable administration without erasing institutional context.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/platform"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 text-sm font-bold text-white shadow-[0_16px_34px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2] focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F4F7FB]"
                >
                  Explore the platform
                  <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C7D3E2] bg-white px-6 text-sm font-bold text-[#101D38] transition hover:border-[#95ACCB] hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40"
                >
                  Discuss your institution
                  <UsersRound className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-[30px] border border-[#C7D4E5] bg-[#101D38] p-5 text-white shadow-[0_36px_90px_rgba(16,29,56,0.2)] sm:p-7">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#91B4F6]">CampusOS point of view</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">The institution is a living system</h2>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754E8] text-white shadow-[0_12px_28px_rgba(23,84,232,0.35)]">
                    <Layers3 className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    ['Academic work', 'Programmes, teaching, assessment and learning evidence'],
                    ['Institutional services', 'Admissions, finance, people and campus operations'],
                    ['Community experience', 'Students, faculty, parents and service teams'],
                    ['Governed improvement', 'Ownership, auditability, data boundaries and review'],
                  ].map(([title, description]) => (
                    <article key={title} className="rounded-2xl border border-[#334B70] bg-[#172A4D] p-4">
                      <p className="text-sm font-extrabold">{title}</p>
                      <p className="mt-2 text-xs leading-5 text-[#C4D0E1]">{description}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-4">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#8FB4FF]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-[#D2DCEB]">
                    Premium product design should make responsibility, context and the next accountable action easier to understand.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="principles-heading">
        <div className="mx-auto max-w-[1360px]">
          <div className="max-w-3xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">Product principles</p>
            <h2 id="principles-heading" className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              A disciplined approach to institutional technology
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5F6C7B] sm:text-lg">
              CampusOS is shaped around the realities of higher education rather than a generic business-software template.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <article key={principle.title} className="rounded-[26px] border border-[#D9E3F0] bg-[#F7F9FC] p-6 shadow-[0_16px_40px_rgba(16,29,56,0.05)] sm:p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-white text-[#1754E8] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-7 text-xl font-extrabold tracking-[-0.025em]">{principle.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#5F6C7B]">{principle.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#DDE5EF] bg-[#F4F7FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="craft-heading">
        <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Product craft
            </div>
            <h2 id="craft-heading" className="mt-6 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Enterprise-grade does not have to feel cold or complicated
            </h2>
            <p className="mt-5 text-base leading-8 text-[#5F6C7B] sm:text-lg">
              The interface combines strong structure, generous space and restrained visual depth with the operational safeguards expected in institutional software.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {craftDetails.map((detail) => (
              <div key={detail} className="flex min-h-20 items-start gap-3 rounded-2xl border border-[#D9E3F0] bg-white p-4 shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />
                <p className="text-sm font-semibold leading-6 text-[#536175]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="operating-model-heading">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-end">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">How the work should progress</p>
              <h2 id="operating-model-heading" className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                A controlled path from complexity to clarity
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-[#5F6C7B] sm:text-lg lg:justify-self-end">
              Transformation becomes more reliable when scope, ownership, data boundaries, implementation and improvement are treated as one connected operating process.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-[#D9E3F0] bg-[#D9E3F0] lg:grid-cols-4">
            {operatingModel.map((step) => (
              <article key={step.number} className="bg-white p-6 sm:p-7">
                <p className="text-4xl font-extrabold tracking-[-0.06em] text-[#D4E0F0]">{step.number}</p>
                <h3 className="mt-8 text-lg font-extrabold tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#5F6C7B]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="mx-auto grid max-w-[1360px] gap-8 overflow-hidden rounded-[30px] bg-[#101D38] p-7 text-white shadow-[0_30px_80px_rgba(16,29,56,0.18)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-12">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#91B4F6]">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
              Start with institutional context
            </div>
            <h2 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
              Discuss the operating model your institution needs next
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#C4D0E1] sm:text-base">
              Begin with your current systems, priority workflows, governance expectations and implementation constraints.
            </p>
          </div>
          <Link
            href="/demo"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#101D38] transition hover:bg-[#EAF0FF] focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Book a focused demo
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
