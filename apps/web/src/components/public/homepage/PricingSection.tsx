import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  Cloud,
  Database,
  Server,
  ShieldCheck,
} from 'lucide-react';

type PricingPlan = {
  id: string;
  name: string;
  audience: string;
  description: string;
  features: readonly string[];
  deployment: string;
  deploymentNote: string;
  featured?: boolean;
};

const plans: readonly PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    audience: 'For small colleges',
    description:
      'Essential academic and administrative tools for institutions moving away from paper-based processes.',
    features: [
      'Academics and timetabling',
      'Admissions and enquiry forms',
      'Student and faculty portals',
      'Fee collection workflows',
      'Email notifications',
      'Standard implementation support',
    ],
    deployment: 'Shared cloud environment',
    deploymentNote: 'Secure multi-tenant architecture',
  },
  {
    id: 'growth',
    name: 'Growth',
    audience: 'For growing universities',
    description:
      'Advanced academic, people and campus operations for institutions managing expanding workflows.',
    features: [
      'Everything included in Starter',
      'Advanced examinations and OBE',
      'People, HR and employee services',
      'Hostel and campus operations',
      'Custom analytics dashboards',
      'Priority implementation support',
    ],
    deployment: 'Isolated cloud database',
    deploymentNote: 'Dedicated institutional data layer',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'For large university groups',
    description:
      'Configurable workflows, integrations and deployment options for complex multi-campus institutions.',
    features: [
      'Everything included in Growth',
      'Multi-campus central administration',
      'Custom workflow and module extensions',
      'ERP and third-party integration APIs',
      'Institution-branded mobile experience',
      'Dedicated customer success manager',
    ],
    deployment: 'Dedicated or institution-controlled',
    deploymentNote: 'Subject to infrastructure assessment',
  },
] as const;

const deploymentIcons = {
  starter: Cloud,
  growth: Database,
  enterprise: Server,
} as const;

function PricingCard({ plan }: { plan: PricingPlan }) {
  const DeploymentIcon =
    deploymentIcons[plan.id as keyof typeof deploymentIcons] ?? Cloud;

  return (
    <article
      className={[
        'relative flex h-full flex-col rounded-3xl bg-white p-6 transition-[border-color,box-shadow,transform] duration-200 sm:p-7 lg:p-8',
        plan.featured
          ? 'border-2 border-[#1754E8] shadow-[0_24px_60px_rgba(16,42,91,0.14)] lg:-translate-y-3'
          : 'border border-[#DDE4EE] shadow-[0_12px_35px_rgba(16,24,40,0.06)] hover:border-[#BCC9DB] hover:shadow-[0_18px_44px_rgba(16,24,40,0.09)]',
      ].join(' ')}
      aria-labelledby={`${plan.id}-plan-title`}
    >
      {plan.featured && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <span className="inline-flex min-h-7 items-center rounded-full border border-[#1754E8] bg-[#1754E8] px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
            Recommended
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#1754E8]">
            {plan.audience}
          </p>

          <h3
            id={`${plan.id}-plan-title`}
            className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#101828]"
          >
            {plan.name}
          </h3>
        </div>

        <div
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            plan.featured
              ? 'bg-[#1754E8] text-white'
              : 'bg-[#EDF3FF] text-[#1754E8]',
          ].join(' ')}
          aria-hidden="true"
        >
          {plan.featured ? (
            <ShieldCheck className="h-5 w-5" strokeWidth={2.1} />
          ) : (
            <Building2 className="h-5 w-5" strokeWidth={2.1} />
          )}
        </div>
      </div>

      <p className="mt-5 min-h-[72px] text-[15px] leading-6 text-[#5F6C7B]">
        {plan.description}
      </p>

      <Link
        href={`/pricing?plan=${plan.id}`}
        aria-label={`Request tailored pricing for the ${plan.name} plan`}
        className={[
          'group mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-[15px] font-semibold transition-[background-color,border-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2',
          plan.featured
            ? 'bg-[#1754E8] text-white shadow-[0_10px_24px_rgba(23,84,232,0.24)] hover:bg-[#103FC2]'
            : 'border border-[#C9D3E1] bg-white text-[#101828] hover:border-[#1754E8] hover:bg-[#F6F9FF] hover:text-[#1754E8]',
        ].join(' ')}
      >
        Request tailored pricing

        <ArrowRight
          className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>

      <div className="mt-8 flex-1">
        <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[#344054]">
          Included capabilities
        </h4>

        <ul className="mt-5 space-y-3.5">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-[14px] leading-6 text-[#475467]"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E9F8F2]">
                <Check
                  className="h-3.5 w-3.5 text-[#078A57]"
                  strokeWidth={2.6}
                  aria-hidden="true"
                />
              </span>

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 border-t border-[#E3E8F0] pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F4F9] text-[#475467]">
            <DeploymentIcon
              className="h-4.5 w-4.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#667085]">
              Deployment
            </p>

            <p className="mt-1 text-sm font-semibold text-[#101828]">
              {plan.deployment}
            </p>

            <p className="mt-1 text-xs leading-5 text-[#7C889A]">
              {plan.deploymentNote}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PricingSection() {
  return (
    <section
      className="bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="pricing-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[760px] text-center">
          <div className="inline-flex min-h-8 items-center rounded-full border border-[#C8D7F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            Flexible institutional plans
          </div>

          <h2
            id="pricing-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            Scale CampusOS with your institution
          </h2>

          <p className="mx-auto mt-6 max-w-[700px] text-pretty text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            Select the operating model that matches your institution’s scale,
            workflow complexity and infrastructure requirements.
          </p>

          <p className="mx-auto mt-4 max-w-[680px] text-sm leading-6 text-[#7C889A]">
            Pricing is tailored around active enrollment, selected capabilities,
            implementation scope and deployment requirements.
          </p>
        </header>

        <div className="mx-auto mt-16 grid max-w-[1120px] grid-cols-1 items-stretch gap-6 md:grid-cols-3 lg:mt-20 lg:gap-7">
          {plans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-[1120px] rounded-2xl border border-[#DDE4EE] bg-white px-6 py-6 shadow-[0_10px_30px_rgba(16,24,40,0.04)] sm:flex sm:items-center sm:justify-between sm:gap-8 lg:px-8">
          <div>
            <h3 className="text-lg font-semibold text-[#101828]">
              Need a different deployment or module configuration?
            </h3>

            <p className="mt-2 max-w-[720px] text-sm leading-6 text-[#5F6C7B]">
              CampusOS can be configured around your campuses, academic
              structure, integration requirements and implementation roadmap.
            </p>
          </div>

          <Link
            href="/contact"
            className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C9D3E1] bg-white px-5 py-3 text-sm font-semibold text-[#101828] transition-colors hover:border-[#1754E8] hover:bg-[#F6F9FF] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 sm:mt-0"
          >
            Talk to our team
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <p className="mx-auto mt-6 max-w-[900px] text-center text-xs leading-5 text-[#8A95A6]">
          Module availability, deployment options and implementation scope may
          vary by institution, region and technical requirements.
        </p>
      </div>
    </section>
  );
}