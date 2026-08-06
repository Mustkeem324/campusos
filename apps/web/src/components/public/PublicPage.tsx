import type { ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react';

import {
  publicPageProfileForPath,
  type PublicPageKind,
  type PublicPageProfile,
} from './public-page-data';
import { regions, type Region } from './site-data';

const kindIcons: Record<PublicPageKind, ElementType> = {
  platform: LayoutDashboard,
  solution: Building2,
  solutions: Layers3,
  role: UsersRound,
  roles: UsersRound,
  resource: BookOpen,
  resources: BookOpen,
  security: ShieldCheck,
  pricing: BadgeDollarSign,
  company: Building2,
  contact: Sparkles,
};

const capabilityIcons = [Layers3, Workflow, Network, FileCheck2] as const;

export function PublicPage({
  segments,
  region = 'global',
}: {
  segments: string[];
  region?: Region;
}) {
  const path = `/${segments.join('/')}`;
  const profile = publicPageProfileForPath(path);
  const local = regions[region];
  const PageIcon = kindIcons[profile.kind];

  return (
    <article className="overflow-hidden bg-white text-[#101828]">
      <Hero profile={profile} localInstitution={local.institution} icon={PageIcon} />

      <PageNavigation />

      <main>
        <CapabilitySection profile={profile} />
        <WorkflowSection profile={profile} />
        <AudienceAndOutcomeSection profile={profile} />
        <GovernanceSection profile={profile} />
        <QuestionsSection profile={profile} />
        <RelatedSection profile={profile} />
        <CallToAction profile={profile} />
      </main>
    </article>
  );
}

function Hero({
  profile,
  localInstitution,
  icon: Icon,
}: {
  profile: PublicPageProfile;
  localInstitution: string;
  icon: ElementType;
}) {
  return (
    <section className="relative border-b border-[#DDE5F0] bg-[#F7F9FD] px-4 pb-14 pt-10 sm:px-6 sm:pb-18 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-14">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(23,84,232,0.12), transparent 28%), radial-gradient(circle at 88% 12%, rgba(7,138,87,0.08), transparent 24%)',
        }}
      />

      <div className="relative mx-auto max-w-[1320px]">
        <Breadcrumb profile={profile} />

        <div className="mt-9 grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.72fr)] lg:gap-14">
          <div className="min-w-0">
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#BFD1F2] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] shadow-sm">
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              {profile.eyebrow}
            </div>

            <h1 className="mt-6 max-w-[850px] text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[#101D38] sm:text-5xl lg:text-[62px]">
              {profile.title}
            </h1>

            <p className="mt-6 max-w-[790px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
              {profile.summary}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <ContextPill icon={Building2} label={`Designed for a ${localInstitution}`} />
              <ContextPill icon={LockKeyhole} label="Role and permission aware" />
              <ContextPill icon={FileCheck2} label="Reviewable operating context" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={profile.primaryAction.href}
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(23,84,232,0.25)] transition hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
              >
                {profile.primaryAction.label}
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <Link
                href={profile.secondaryAction.href}
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-[#B9C9DE] bg-white px-6 py-3.5 text-sm font-extrabold text-[#101D38] transition hover:border-[#8FA9C9] hover:bg-[#F7F9FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
              >
                {profile.secondaryAction.label}
              </Link>
            </div>
          </div>

          <aside className="min-w-0 overflow-hidden rounded-[28px] border border-[#D5E0EE] bg-white shadow-[0_30px_80px_rgba(16,29,56,0.12)]">
            <div className="border-b border-[#DDE5F0] bg-[#101D38] px-6 py-5 text-white sm:px-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9EBBEE]">
                {profile.categoryLabel}
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">
                Operational scope at a glance
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#C7D3E4]">
                Four areas that define the practical scope of this page.
              </p>
            </div>

            <ol className="divide-y divide-[#E3E9F1] px-5 sm:px-6">
              {profile.focus.map((item, index) => (
                <li key={item} className="flex items-start gap-4 py-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-xs font-extrabold text-[#1754E8]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="text-sm font-extrabold leading-6 text-[#101D38]">{item}</p>
                    <p className="mt-1 text-xs leading-5 text-[#667085]">
                      Scope, ownership and evidence should be confirmed during institutional discovery.
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Breadcrumb({ profile }: { profile: PublicPageProfile }) {
  const root = profile.href.split('/').filter(Boolean)[0] ?? 'platform';
  const rootLabel = root.charAt(0).toUpperCase() + root.slice(1).replace(/-/g, ' ');

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#758196]">
      <Link href="/" className="rounded-md transition hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]">
        Home
      </Link>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      <Link href={`/${root}`} className="rounded-md transition hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]">
        {rootLabel}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="text-[#1754E8]" aria-current="page">{profile.title}</span>
    </nav>
  );
}

function ContextPill({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D5E0EE] bg-white px-3 text-xs font-bold text-[#536175] shadow-sm">
      <Icon className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
      {label}
    </span>
  );
}

function PageNavigation() {
  const items = [
    ['Scope', '#scope'],
    ['Workflow', '#workflow'],
    ['Outcomes', '#outcomes'],
    ['Governance', '#governance'],
    ['Questions', '#questions'],
  ] as const;

  return (
    <div className="sticky top-[72px] z-20 border-b border-[#DDE5F0] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <nav aria-label="Page sections" className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 text-xs font-extrabold text-[#667085] transition hover:bg-[#EDF3FF] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function CapabilitySection({ profile }: { profile: PublicPageProfile }) {
  return (
    <section id="scope" className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionHeading
          eyebrow="OPERATIONAL SCOPE"
          title={`What ${profile.title} should make clearer`}
          description="The page is organised around practical institutional responsibilities rather than generic feature claims."
        />

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {profile.focus.map((item, index) => {
            const Icon = capabilityIcons[index];
            return (
              <article key={item} className="group rounded-[24px] border border-[#DDE5F0] bg-white p-6 shadow-[0_12px_34px_rgba(16,29,56,0.05)] transition hover:-translate-y-1 hover:border-[#B8CBE6] hover:shadow-[0_22px_52px_rgba(16,29,56,0.1)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A95A6]">
                  Scope {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 text-lg font-extrabold leading-7 tracking-[-0.02em] text-[#101D38]">
                  {item}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#667085]">
                  Define the responsible teams, records, statuses, exceptions and evidence required to operate this area consistently.
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection({ profile }: { profile: PublicPageProfile }) {
  return (
    <section id="workflow" className="scroll-mt-32 border-y border-[#DDE5F0] bg-[#F7F9FD] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionHeading
          eyebrow="OPERATING MODEL"
          title="A disciplined path from scope to improvement"
          description="A useful implementation connects configuration, daily work and evidence instead of treating the page as a static feature list."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-4">
          {profile.workflow.map((step, index) => (
            <article key={step.number} className="relative rounded-[24px] border border-[#D6E0ED] bg-white p-6 shadow-[0_14px_38px_rgba(16,29,56,0.06)]">
              {index < profile.workflow.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-10 hidden h-px w-6 bg-[#B8C9DF] lg:block" aria-hidden="true" />
              )}
              <div className="flex items-center justify-between gap-4">
                <span className="text-3xl font-extrabold tracking-[-0.04em] text-[#1754E8]">{step.number}</span>
                <Workflow className="h-5 w-5 text-[#8DA6C5]" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-[#101D38]">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#667085]">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AudienceAndOutcomeSection({ profile }: { profile: PublicPageProfile }) {
  return (
    <section id="outcomes" className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-2">
        <section className="rounded-[28px] border border-[#DDE5F0] bg-white p-6 shadow-[0_16px_46px_rgba(16,29,56,0.06)] sm:p-8" aria-labelledby="audience-heading">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8]">
              <UsersRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8]">WHO SHOULD BE INVOLVED</p>
              <h2 id="audience-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#101D38]">Cross-functional evaluation</h2>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {profile.audiences.map((audience) => (
              <div key={audience} className="flex min-h-20 items-center gap-3 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />
                <p className="text-sm font-extrabold leading-6 text-[#344054]">{audience}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-[#263D61] bg-[#101D38] p-6 text-white shadow-[0_22px_60px_rgba(16,29,56,0.18)] sm:p-8" aria-labelledby="outcome-heading">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754E8] text-white">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9EBBEE]">EXPECTED OPERATING OUTCOMES</p>
              <h2 id="outcome-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">What better coordination looks like</h2>
            </div>
          </div>

          <ul className="mt-7 space-y-3">
            {profile.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-3 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#6EE7B7]" aria-hidden="true" />
                <span className="text-sm leading-6 text-[#D5DFEC]">{outcome}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function GovernanceSection({ profile }: { profile: PublicPageProfile }) {
  return (
    <section id="governance" className="scroll-mt-32 border-y border-[#DDE5F0] bg-[#F7F9FD] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1320px]">
        <SectionHeading
          eyebrow="GOVERNANCE AND DELIVERY"
          title="Keep responsibility visible as the workflow scales"
          description="The following controls prevent a polished interface from hiding ownership, access boundaries or implementation assumptions."
        />

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          {profile.governance.map((item, index) => (
            <article key={item} className="flex items-start gap-4 rounded-[22px] border border-[#D8E2EF] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] sm:p-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-sm font-extrabold text-[#1754E8]">
                {index + 1}
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-[#101D38]">Control principle</h3>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{item}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-4 rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:p-6">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-extrabold">Important scope note</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">{profile.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestionsSection({ profile }: { profile: PublicPageProfile }) {
  return (
    <section id="questions" className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1040px]">
        <SectionHeading
          eyebrow="COMMON EVALUATION QUESTIONS"
          title={`Questions to ask about ${profile.title}`}
          description="Use these answers as a starting point, then confirm institution-specific requirements during discovery."
          centered
        />

        <div className="mt-9 space-y-3">
          {profile.questions.map((item, index) => (
            <details key={item.question} className="group rounded-2xl border border-[#DDE5F0] bg-white shadow-[0_8px_24px_rgba(16,29,56,0.04)]" open={index === 0}>
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-extrabold text-[#101D38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1754E8] sm:px-6">
                <span className="flex items-center gap-3">
                  <CircleHelp className="h-5 w-5 shrink-0 text-[#1754E8]" aria-hidden="true" />
                  {item.question}
                </span>
                <span className="text-xl font-normal text-[#8A95A6] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <div className="border-t border-[#E5EAF1] px-5 py-5 text-sm leading-7 text-[#667085] sm:px-6">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedSection({ profile }: { profile: PublicPageProfile }) {
  return (
    <section className="border-t border-[#DDE5F0] bg-[#F7F9FD] px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8]">CONTINUE EXPLORING</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#101D38] sm:text-3xl">Related CampusOS pages</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#667085]">Review adjacent capabilities and operating contexts before defining the final institutional scope.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {profile.related.map((item) => (
            <Link key={item.href} href={item.href} className="group flex min-h-52 flex-col rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] transition hover:-translate-y-1 hover:border-[#B5C9E5] hover:shadow-[0_20px_48px_rgba(16,29,56,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2">
              <span className="inline-flex w-fit rounded-full bg-[#EDF3FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]">
                Related page
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-[#101D38]">{item.label}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#667085]">{item.description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#1754E8]">
                Open page
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction({ profile }: { profile: PublicPageProfile }) {
  return (
    <section className="bg-[#101D38] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto flex max-w-[1180px] flex-col items-center text-center">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#3B567A] bg-[#172A4B] px-4 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#B9CDF0]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Plan the next step
        </span>
        <h2 className="mt-6 max-w-4xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
          Review {profile.title.toLowerCase()} in your institution’s real operating context.
        </h2>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[#C7D3E4]">
          Bring your current systems, responsible teams, priority workflows and implementation constraints into a focused CampusOS discussion.
        </p>
        <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link href={profile.primaryAction.href} className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-[#2A67F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {profile.primaryAction.label}
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link href="/contact" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-[#526B8D] bg-[#172A4B] px-6 py-3.5 text-sm font-extrabold text-white transition hover:border-[#7894BA] hover:bg-[#20385F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Talk to our team
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#101D38] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#667085]">{description}</p>
    </div>
  );
}
