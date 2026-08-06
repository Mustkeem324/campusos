import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
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

function PlatformArchitecture() {
  return (
    <div className="relative mx-auto w-full max-w-[820px]" aria-label="CampusOS connected platform architecture">
      <div className="overflow-hidden rounded-[30px] border border-[#C7D4E5] bg-white shadow-[0_36px_90px_rgba(16,29,56,0.18)]">
        <div className="border-b border-[#DDE5EF] bg-[#101D38] px-5 py-5 text-white sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1754E8]"><LayoutDashboard className="h-5 w-5" aria-hidden="true" /></span>
              <div><p className="text-sm font-extrabold">CampusOS institutional operating layer</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9EBBEE]">Connected records · role context · accountable workflow</p></div>
            </div>
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#8FB4FF]" aria-hidden="true" />
          </div>
        </div>

        <div className="bg-[#F4F7FB] p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {operatingAreas.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <div><h2 className="text-sm font-extrabold text-[#101D38]">{title}</h2><p className="mt-2 text-xs leading-5 text-[#667085]">{description}</p></div>
                </div>
              </article>
            ))}
          </div>

          <div className="my-5 flex items-center justify-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-[#C9D5E5]" /><Network className="h-5 w-5 text-[#1754E8]" /><span className="h-px flex-1 bg-[#C9D5E5]" /></div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Identity & access', 'Institution, user, role and permission context'],
              ['Workflow & evidence', 'Statuses, approvals, handoffs and audit history'],
              ['Integration layer', 'Controlled interfaces to approved external systems'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl bg-[#101D38] p-4 text-white"><p className="text-xs font-extrabold">{title}</p><p className="mt-2 text-[10px] leading-5 text-[#C3CEE0]">{description}</p></div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#DDE5EF] bg-white px-5 py-4 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <span className="inline-flex items-center gap-2"><Workflow className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Configuration follows institutional scope and responsibility.</span>
          <Link href="/platform" className="inline-flex items-center gap-1 font-extrabold text-[#1754E8]">Explore architecture <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="overflow-hidden border-b border-[#DDE5EF] bg-[#F4F7FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="homepage-hero-heading">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-12 xl:gap-20">
          <div className="max-w-[650px]">
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] sm:text-xs"><GraduationCap className="h-4 w-4" aria-hidden="true" />Higher-education operating platform</div>
            <h1 id="homepage-hero-heading" className="mt-7 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.052em] text-[#101A32] sm:text-5xl lg:text-[60px] xl:text-[70px]">Connect institutional work without losing institutional context</h1>
            <p className="mt-7 max-w-[620px] text-pretty text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">CampusOS brings academics, admissions, finance, people, campus operations and student services into governed, role-aware workflows designed around real institutional responsibility.</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?intent=sales" className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-7 py-3.5 text-[15px] font-extrabold text-white shadow-[0_16px_34px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2]">Request a consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
              <Link href="/platform" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#C7D3E2] bg-white px-7 py-3.5 text-[15px] font-extrabold text-[#101D38] shadow-[0_8px_22px_rgba(16,29,56,0.05)] transition hover:border-[#95ACCB] hover:bg-[#F8FAFC]">Explore the platform <LayoutDashboard className="h-4 w-4 text-[#1754E8]" aria-hidden="true" /></Link>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => <div key={point} className="flex items-start gap-2.5 text-sm leading-6 text-[#536175]"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078A57]" aria-hidden="true" /><span>{point}</span></div>)}
            </div>
          </div>

          <PlatformArchitecture />
        </div>
      </div>
    </section>
  );
}
