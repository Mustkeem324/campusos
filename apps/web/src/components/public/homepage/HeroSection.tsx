import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Network,
  ShieldCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';

const trustPoints = [
  'Multi-tenant institution context',
  'Role-aware workspaces and permissions',
  'Connected academic and administrative workflows',
  'Responsive web experience',
] as const;

const operatingAreas = [
  { title: 'Academics', description: 'Curriculum, courses, attendance, assessments and results', icon: BookOpenCheck },
  { title: 'Admissions', description: 'Applications, verification, selection and enrolment', icon: UsersRound },
  { title: 'Finance', description: 'Fee structures, collections, concessions and reconciliation', icon: CreditCard },
  { title: 'People & Operations', description: 'Workforce, campus services, facilities and support', icon: Building2 },
] as const;

const controlLayers = [
  { title: 'Identity & access', description: 'Institution, role and permission context', icon: LockKeyhole },
  { title: 'Workflow & evidence', description: 'Statuses, approvals, handoffs and audit history', icon: Workflow },
  { title: 'Integration layer', description: 'Controlled interfaces to approved external systems', icon: Network },
] as const;

function PlatformArchitecture() {
  return (
    <div className="mx-auto w-full max-w-[820px]" role="group" aria-label="CampusOS connected platform architecture">
      <div className="overflow-hidden rounded-[16px] border border-[#C8D4E3] bg-white shadow-[0_16px_42px_rgba(16,29,56,0.10)]">
        <div className="flex flex-col gap-4 border-b border-[#DCE4EE] bg-[#101D38] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#1754E8]"><LayoutDashboard className="h-5 w-5" aria-hidden="true" /></span>
            <div><p className="text-sm font-extrabold tracking-[-0.01em]">CampusOS institutional operating layer</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.13em] text-[#AFC4E6]">Connected records · role context · accountable workflow</p></div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-extrabold text-[#D9E4F4]"><ShieldCheck className="h-3.5 w-3.5 text-[#8FB4FF]" aria-hidden="true" />Governed access model</span>
        </div>

        <div className="bg-[#F6F8FB] p-4 sm:p-5">
          <div className="grid gap-px overflow-hidden rounded-[11px] border border-[#D8E1EC] bg-[#D8E1EC] sm:grid-cols-2">
            {operatingAreas.map(({ title, description, icon: Icon }) => (
              <article key={title} className="bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EEF3FB] text-[#1754E8]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <div><p className="text-xs font-extrabold text-[#101D38]">{title}</p><p className="mt-1.5 text-[11px] leading-5 text-[#667085]">{description}</p></div>
                </div>
              </article>
            ))}
          </div>

          <div className="my-4 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-[#CDD8E5]" /><span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#BFD0E5] bg-white text-[#1754E8]"><Network className="h-4 w-4" /></span><span className="h-px flex-1 bg-[#CDD8E5]" /></div>

          <div className="grid gap-2 sm:grid-cols-3">
            {controlLayers.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-[10px] border border-[#D8E1EC] bg-[#101D38] p-3.5 text-white">
                <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#8FB4FF]" aria-hidden="true" /><p className="text-[11px] font-extrabold">{title}</p></div>
                <p className="mt-2 text-[10px] leading-4 text-[#C4D0E3]">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid border-t border-[#DCE4EE] bg-white sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-start gap-2.5 px-5 py-4 text-[11px] leading-5 text-[#667085] sm:border-r sm:border-[#DCE4EE]"><Workflow className="mt-0.5 h-4 w-4 shrink-0 text-[#1754E8]" aria-hidden="true" /><span>Configuration follows institutional scope and responsibility instead of forcing every institution into the same operating model.</span></div>
          <Link href="/platform" className="group inline-flex min-h-12 items-center justify-center gap-2 px-5 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#F7F9FC]">Explore architecture <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="overflow-hidden border-b border-[#DDE5EF] bg-[#F5F7FA] px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20" aria-labelledby="homepage-hero-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid items-center gap-12 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:gap-16">
          <div className="max-w-[680px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[#C9D7EA] bg-white px-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />Higher-education operating platform</span>
              <span className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[#C7E2D7] bg-[#F4FBF8] px-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#087A55]"><span className="h-1.5 w-1.5 rounded-full bg-[#087A55]" />Institution-aware architecture</span>
            </div>

            <h1 id="homepage-hero-heading" className="mt-6 text-balance text-[38px] font-extrabold leading-[1.04] tracking-[-0.05em] text-[#101828] sm:text-[48px] lg:text-[56px]">Connect institutional work without losing institutional context</h1>
            <p className="mt-6 max-w-[650px] text-pretty text-[15px] leading-7 text-[#5F6C7B] sm:text-[17px] sm:leading-8">CampusOS brings academics, admissions, finance, people, campus operations and student services into governed, role-aware workflows designed around real institutional responsibility.</p>

            <div className="mt-7 grid gap-px overflow-hidden rounded-[11px] border border-[#D6DFEA] bg-[#D6DFEA] sm:grid-cols-2">
              {trustPoints.map((point) => <div key={point} className="flex items-start gap-2.5 bg-white px-3.5 py-3 text-xs font-semibold leading-5 text-[#536175]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#087A55]" aria-hidden="true" /><span>{point}</span></div>)}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?intent=sales" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#1754E8] px-6 text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(23,84,232,0.18)] transition hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2">Request a consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
              <Link href="/platform" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] border border-[#BCCADA] bg-white px-6 text-sm font-extrabold text-[#101D38] transition hover:border-[#97AAC2] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"><LayoutDashboard className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Explore the platform</Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A8698]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#1754E8]" aria-hidden="true" />Role-scoped workspaces</span><span className="inline-flex items-center gap-1.5"><Network className="h-3.5 w-3.5 text-[#1754E8]" aria-hidden="true" />Connected operating domains</span><span className="inline-flex items-center gap-1.5"><Workflow className="h-3.5 w-3.5 text-[#1754E8]" aria-hidden="true" />Auditable handoffs</span></div>
          </div>

          <PlatformArchitecture />
        </div>
      </div>
    </section>
  );
}
