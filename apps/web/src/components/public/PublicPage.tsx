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
  UsersRound,
  Workflow,
} from 'lucide-react';

import {
  publicPageProfileForPath,
  type PublicPageAction,
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
  contact: Building2,
};

const scopeIcons = [Layers3, Workflow, Network, FileCheck2] as const;

function productionAction(action: PublicPageAction): PublicPageAction {
  if (action.href === '/demo' || action.href.startsWith('/demo?')) {
    return { label: 'Request an institutional consultation', href: '/contact?intent=sales' };
  }
  return action;
}

export function PublicPage({ segments, region = 'global' }: { segments: string[]; region?: Region }) {
  const profile = publicPageProfileForPath(`/${segments.join('/')}`);
  const local = regions[region];
  const PageIcon = kindIcons[profile.kind];
  const primary = productionAction(profile.primaryAction);
  const secondary = productionAction(profile.secondaryAction);

  return (
    <article className="overflow-hidden bg-white text-[#101828]">
      <Hero profile={profile} localInstitution={local.institution} icon={PageIcon} primary={primary} secondary={secondary} />
      <SectionNav />
      <main>
        <Scope profile={profile} />
        <OperatingModel profile={profile} />
        <PeopleAndOutcomes profile={profile} />
        <Governance profile={profile} />
        <Questions profile={profile} />
        <Related profile={profile} />
        <Cta profile={profile} primary={primary} secondary={secondary} />
      </main>
    </article>
  );
}

function Hero({ profile, localInstitution, icon: Icon, primary, secondary }: { profile: PublicPageProfile; localInstitution: string; icon: ElementType; primary: PublicPageAction; secondary: PublicPageAction }) {
  const root = profile.href.split('/').filter(Boolean)[0] || 'platform';
  const rootLabel = root.charAt(0).toUpperCase() + root.slice(1).replace(/-/g, ' ');

  return (
    <section className="relative border-b border-[#DDE5F0] bg-[#F7F9FD] px-4 pb-14 pt-10 sm:px-6 sm:pb-18 sm:pt-12 lg:px-8 lg:pb-20 lg:pt-14">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 12% 18%, rgba(23,84,232,0.12), transparent 28%), radial-gradient(circle at 88% 12%, rgba(7,138,87,0.08), transparent 24%)' }} />
      <div className="relative mx-auto max-w-[1320px]">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#758196]">
          <Link href="/" className="hover:text-[#1754E8]">Home</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href={`/${root}`} className="hover:text-[#1754E8]">{rootLabel}</Link><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-[#1754E8]" aria-current="page">{profile.title}</span>
        </nav>

        <div className="mt-9 grid min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.72fr)] lg:gap-14">
          <div className="min-w-0">
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#BFD1F2] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] shadow-sm"><Icon className="h-4 w-4" aria-hidden="true" />{profile.eyebrow}</div>
            <h1 className="mt-6 max-w-[850px] text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[#101D38] sm:text-5xl lg:text-[62px]">{profile.title}</h1>
            <p className="mt-6 max-w-[790px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">{profile.summary}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              <Pill icon={Building2} label={`Designed for a ${localInstitution}`} />
              <Pill icon={LockKeyhole} label="Institution and role aware" />
              <Pill icon={FileCheck2} label="Reviewable operating context" />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={primary.href} className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3.5 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(23,84,232,0.25)] transition hover:bg-[#103FC2]">{primary.label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
              <Link href={secondary.href} className="inline-flex min-h-13 items-center justify-center rounded-xl border border-[#B9C9DE] bg-white px-6 py-3.5 text-sm font-extrabold text-[#101D38] transition hover:border-[#8FA9C9] hover:bg-[#F7F9FD]">{secondary.label}</Link>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[28px] border border-[#D5E0EE] bg-white shadow-[0_30px_80px_rgba(16,29,56,0.12)]">
            <div className="border-b border-[#DDE5F0] bg-[#101D38] px-6 py-5 text-white sm:px-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#9EBBEE]">{profile.categoryLabel}</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-[-0.025em]">Operational scope</h2>
              <p className="mt-2 text-sm leading-6 text-[#C7D3E4]">The practical responsibilities this area should support.</p>
            </div>
            <ol className="divide-y divide-[#E3E9F1] px-5 sm:px-6">
              {profile.focus.map((item, index) => <li key={item} className="flex items-start gap-4 py-5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-xs font-extrabold text-[#1754E8]">{String(index + 1).padStart(2, '0')}</span><p className="pt-1 text-sm font-extrabold leading-6 text-[#101D38]">{item}</p></li>)}
            </ol>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Pill({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D5E0EE] bg-white px-3 text-xs font-bold text-[#536175] shadow-sm"><Icon className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />{label}</span>;
}

function SectionNav() {
  const items = [['Scope', '#scope'], ['Workflow', '#workflow'], ['Outcomes', '#outcomes'], ['Governance', '#governance'], ['Questions', '#questions']] as const;
  return <div className="sticky top-[72px] z-20 border-b border-[#DDE5F0] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8"><nav aria-label="Page sections" className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map(([label, href]) => <a key={href} href={href} className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-4 text-xs font-extrabold text-[#667085] transition hover:bg-[#EDF3FF] hover:text-[#1754E8]">{label}</a>)}</nav></div>;
}

function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="max-w-3xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">{eyebrow}</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] sm:text-4xl">{title}</h2><p className="mt-4 text-base leading-7 text-[#667085]">{description}</p></div>;
}

function Scope({ profile }: { profile: PublicPageProfile }) {
  return <section id="scope" className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1320px]"><Heading eyebrow="Operational scope" title={`What ${profile.title} should make clearer`} description="Focus on accountable institutional work, not decorative feature claims." /><div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{profile.focus.map((item, index) => { const Icon = scopeIcons[index]; return <article key={item} className="rounded-[24px] border border-[#DDE5F0] bg-white p-6 shadow-[0_12px_34px_rgba(16,29,56,0.05)]"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-5 w-5" aria-hidden="true" /></span><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8A95A6]">Scope {String(index + 1).padStart(2, '0')}</p><h3 className="mt-2 text-lg font-extrabold leading-7 text-[#101D38]">{item}</h3><p className="mt-3 text-sm leading-6 text-[#667085]">Confirm responsible teams, records, statuses, exceptions and evidence during institutional discovery.</p></article>; })}</div></div></section>;
}

function OperatingModel({ profile }: { profile: PublicPageProfile }) {
  return <section id="workflow" className="scroll-mt-32 border-y border-[#DDE5F0] bg-[#F7F9FD] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1320px]"><Heading eyebrow="Operating model" title="A disciplined path from scope to improvement" description="Connect configuration, day-to-day work and reviewable evidence in one operating process." /><div className="mt-10 grid gap-4 lg:grid-cols-4">{profile.workflow.map((step) => <article key={step.number} className="rounded-[24px] border border-[#D6E0ED] bg-white p-6 shadow-[0_14px_38px_rgba(16,29,56,0.06)]"><div className="flex items-center justify-between"><span className="text-3xl font-extrabold text-[#1754E8]">{step.number}</span><Workflow className="h-5 w-5 text-[#8DA6C5]" aria-hidden="true" /></div><h3 className="mt-5 text-lg font-extrabold text-[#101D38]">{step.title}</h3><p className="mt-3 text-sm leading-6 text-[#667085]">{step.description}</p></article>)}</div></div></section>;
}

function PeopleAndOutcomes({ profile }: { profile: PublicPageProfile }) {
  return <section id="outcomes" className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-2"><Panel icon={UsersRound} eyebrow="Who should be involved" title="Cross-functional evaluation" items={profile.audiences} /><Panel icon={CheckCircle2} eyebrow="Expected operating outcomes" title="What better should look like" items={profile.outcomes} success /></div></section>;
}

function Panel({ icon: Icon, eyebrow, title, items, success = false }: { icon: ElementType; eyebrow: string; title: string; items: readonly string[]; success?: boolean }) {
  return <section className="rounded-[28px] border border-[#DDE5F0] bg-white p-6 shadow-[0_16px_46px_rgba(16,29,56,0.06)] sm:p-8"><div className="flex items-start gap-4"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${success ? 'bg-[#EAF8F3] text-[#078A57]' : 'bg-[#EDF3FF] text-[#1754E8]'}`}><Icon className="h-6 w-6" aria-hidden="true" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8]">{eyebrow}</p><h2 className="mt-2 text-2xl font-extrabold text-[#101D38]">{title}</h2></div></div><ul className="mt-7 space-y-3">{items.map((item) => <li key={item} className="flex items-start gap-3 rounded-2xl bg-[#F7F9FC] p-4 text-sm font-semibold leading-6 text-[#536175]"><CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${success ? 'text-[#078A57]' : 'text-[#1754E8]'}`} aria-hidden="true" />{item}</li>)}</ul></section>;
}

function Governance({ profile }: { profile: PublicPageProfile }) {
  return <section id="governance" className="scroll-mt-32 bg-[#101D38] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1320px]"><HeadingDark /><div className="mt-9 grid gap-4 md:grid-cols-2">{profile.governance.map((item) => <div key={item} className="flex items-start gap-3 rounded-2xl border border-[#304A70] bg-[#172A4D] p-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#8FB4FF]" aria-hidden="true" /><p className="text-sm leading-6 text-[#D0DAE8]">{item}</p></div>)}</div><div className="mt-6 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-5 text-sm leading-6 text-[#C6D1E0]">{profile.note}</div></div></section>;
}

function HeadingDark() { return <div className="max-w-3xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#91B4F6]">Governance and implementation</p><h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Keep responsibility and evidence visible</h2><p className="mt-4 text-base leading-7 text-[#C3CEE0]">Production configuration should preserve institution, role, permission, status and review context.</p></div>; }

function Questions({ profile }: { profile: PublicPageProfile }) {
  return <section id="questions" className="scroll-mt-32 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"><div className="mx-auto max-w-[1100px]"><Heading eyebrow="Evaluation questions" title="Questions worth resolving before implementation" description="Use these prompts to make discovery more concrete and reduce assumptions." /><div className="mt-9 divide-y divide-[#E1E7EF] rounded-[26px] border border-[#DDE5F0] bg-white px-5 sm:px-7">{profile.questions.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-start gap-3 text-base font-extrabold text-[#101D38]"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]" aria-hidden="true" /><span className="flex-1">{item.question}</span><span className="text-[#98A2B3] group-open:rotate-45">+</span></summary><p className="mt-3 pl-8 text-sm leading-7 text-[#667085]">{item.answer}</p></details>)}</div></div></section>;
}

function Related({ profile }: { profile: PublicPageProfile }) {
  if (!profile.related.length) return null;
  return <section className="border-y border-[#DDE5F0] bg-[#F7F9FD] px-4 py-14 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1320px]"><h2 className="text-2xl font-extrabold text-[#101D38]">Related pages</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{profile.related.map((item) => <Link key={item.href} href={item.href} className="group rounded-2xl border border-[#D8E2EF] bg-white p-5 transition hover:border-[#B4C8E5] hover:shadow-[0_14px_34px_rgba(16,29,56,0.07)]"><p className="text-sm font-extrabold text-[#101D38] group-hover:text-[#1754E8]">{item.label}</p><p className="mt-2 line-clamp-3 text-xs leading-5 text-[#667085]">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#1754E8]">Explore <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></span></Link>)}</div></div></section>;
}

function Cta({ profile, primary, secondary }: { profile: PublicPageProfile; primary: PublicPageAction; secondary: PublicPageAction }) {
  return <section className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20"><div className="mx-auto grid max-w-[1320px] gap-8 overflow-hidden rounded-[30px] bg-[#101D38] p-7 text-white shadow-[0_30px_80px_rgba(16,29,56,0.18)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#91B4F6]">Next step</p><h2 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-[-0.04em]">Evaluate {profile.title.toLowerCase()} against your institution’s real operating context</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#C4D0E1]">Bring current systems, responsible teams, priority workflows and implementation constraints to the discussion.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Link href={primary.href} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-[#101D38]">{primary.label}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href={secondary.href} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-6 text-sm font-extrabold text-white">{secondary.label}</Link></div></div></section>;
}
