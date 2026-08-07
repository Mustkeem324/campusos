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

const capabilities = [
  {
    title: 'Multi-tenant institution context',
    description: 'Keep institution boundaries explicit while different campuses and teams operate inside the same platform architecture.',
    icon: Building2,
  },
  {
    title: 'Role-aware workspaces and permissions',
    description: 'Resolve the authorised institution, role and responsibility before presenting actions, records or operational signals.',
    icon: ShieldCheck,
  },
  {
    title: 'Connected academic and administrative workflows',
    description: 'Move work between academics, admissions, finance, people and services without dropping institutional context.',
    icon: Workflow,
  },
  {
    title: 'Responsive web experience',
    description: 'Give leadership, staff, faculty, students and guardians interfaces that restructure cleanly across desktop, tablet and mobile.',
    icon: LayoutDashboard,
  },
] as const;

const operatingAreas = [
  { title: 'Academics', items: ['Curriculum', 'Courses', 'Attendance', 'Assessments', 'Results'], icon: BookOpenCheck },
  { title: 'Admissions', items: ['Applications', 'Verification', 'Selection', 'Enrolment'], icon: UsersRound },
  { title: 'Finance', items: ['Fee structures', 'Collections', 'Concessions', 'Reconciliation'], icon: CreditCard },
  { title: 'People & Operations', items: ['Workforce', 'Campus services', 'Facilities', 'Support'], icon: Building2 },
] as const;

const controlLayers = [
  { title: 'Identity & Access', copy: 'Institution, role and permission context', icon: LockKeyhole },
  { title: 'Workflow & Evidence', copy: 'Approvals, handoffs, records and audit history', icon: Workflow },
  { title: 'Integration Layer', copy: 'Controlled interfaces to approved external systems', icon: Network },
] as const;

function ArchitecturePanel() {
  return (
    <div className="relative mx-auto w-full max-w-[860px]" role="group" aria-label="CampusOS institutional operating architecture">
      <div className="absolute -left-4 top-16 hidden h-32 w-px bg-[#CFD9E6] xl:block" aria-hidden="true" />
      <div className="absolute -right-4 bottom-16 hidden h-32 w-px bg-[#CFD9E6] xl:block" aria-hidden="true" />
      <div className="overflow-hidden rounded-[18px] border border-[#BFCDE0] bg-white shadow-[0_26px_80px_rgba(16,29,56,0.12)]">
        <div className="flex flex-col gap-4 border-b border-[#29466D] bg-[#101D38] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[#1754E8]"><LayoutDashboard className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-[-0.015em]">CampusOS institutional operating layer</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#AFC4E6]">Connected records · role context · accountable workflow</p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-[8px] border border-white/15 bg-white/[0.04] px-3 py-2 text-[10px] font-black text-[#D9E4F4]"><ShieldCheck className="h-3.5 w-3.5 text-[#8FB4FF]" aria-hidden="true" />Governed access model</span>
        </div>

        <div className="bg-[#F5F8FC] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {operatingAreas.map(({ title, items, icon: Icon }) => (
              <article key={title} className="rounded-[13px] border border-[#D7E1EC] bg-white p-4 shadow-[0_5px_14px_rgba(16,29,56,0.025)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[#D3E0F2] bg-[#F2F6FC] text-[#1754E8]"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                    <h3 className="text-xs font-black text-[#101D38]">{title}</h3>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-[#087A55]" aria-hidden="true" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {items.map((item) => <span key={item} className="rounded-md border border-[#E2E8F0] bg-[#FAFBFD] px-2.5 py-1.5 text-[9px] font-bold text-[#627084]">{item}</span>)}
                </div>
              </article>
            ))}
          </div>

          <div className="my-4 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-[#CCD8E6]" /><span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#BFD0E5] bg-white text-[#1754E8]"><Network className="h-4 w-4" /></span><span className="h-px flex-1 bg-[#CCD8E6]" /></div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {controlLayers.map(({ title, copy, icon: Icon }) => (
              <div key={title} className="rounded-[11px] border border-[#243C60] bg-[#101D38] p-3.5 text-white">
                <div className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 text-[#8FB4FF]" aria-hidden="true" /><p className="text-[10px] font-black">{title}</p></div>
                <p className="mt-2 text-[9px] leading-4 text-[#BFCBE0]">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid border-t border-[#DCE4EE] bg-white sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex items-start gap-2.5 px-5 py-4 text-[11px] leading-5 text-[#667085] sm:border-r sm:border-[#DCE4EE]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#087A55]" aria-hidden="true" /><span>Architecture follows institutional scope and responsibility instead of flattening every institution into one generic operating model.</span></div>
          <Link href="/platform" className="group inline-flex min-h-12 items-center justify-center gap-2 px-5 text-xs font-black text-[#1754E8] transition hover:bg-[#F7F9FC]">Explore architecture <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[#DDE5EF] bg-[#F7F9FC] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="homepage-hero-heading">
      <div className="absolute inset-x-0 top-0 h-px bg-[#D8E2EF]" aria-hidden="true" />
      <div className="mx-auto max-w-[1480px]">
        <div className="grid items-center gap-12 xl:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)] xl:gap-16">
          <div className="max-w-[720px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-8 items-center gap-2 rounded-[8px] border border-[#C8D7EA] bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#1754E8]"><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />Higher-education operating platform</span>
              <span className="inline-flex min-h-8 items-center gap-2 rounded-[8px] border border-[#C7E2D7] bg-[#F6FBF8] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#087A55]"><span className="h-1.5 w-1.5 rounded-full bg-[#087A55]" />Institution-aware architecture</span>
            </div>

            <h1 id="homepage-hero-heading" className="mt-7 max-w-[720px] text-balance text-[42px] font-black leading-[1.01] tracking-[-0.055em] text-[#101828] sm:text-[54px] lg:text-[64px]">Connect institutional work without losing institutional context.</h1>
            <p className="mt-6 max-w-[680px] text-pretty text-[16px] leading-7 text-[#5F6C7B] sm:text-[18px] sm:leading-8">CampusOS connects academics, admissions, finance, people, operations and student services into governed, role-aware workflows designed around real institutional responsibility.</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?intent=sales" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#1754E8] px-6 text-sm font-black text-white shadow-[0_10px_24px_rgba(23,84,232,0.20)] transition hover:-translate-y-px hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2">Request a consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
              <Link href="/platform" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] border border-[#B9C9DD] bg-white px-6 text-sm font-black text-[#101D38] transition hover:border-[#8EA9CB] hover:bg-[#FBFCFE] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"><LayoutDashboard className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Explore the platform</Link>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {capabilities.map(({ title, description, icon: Icon }) => (
                <article key={title} className="rounded-[13px] border border-[#D7E1EC] bg-white p-4 shadow-[0_6px_18px_rgba(16,29,56,0.035)]">
                  <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-[#D3E0F2] bg-[#F3F7FD] text-[#1754E8]"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><h2 className="text-[11px] font-black leading-5 text-[#101D38]">{title}</h2><p className="mt-1.5 text-[10px] leading-[1.55] text-[#7A8698]">{description}</p></div></div>
                </article>
              ))}
            </div>
          </div>

          <ArchitecturePanel />
        </div>
      </div>
    </section>
  );
}
