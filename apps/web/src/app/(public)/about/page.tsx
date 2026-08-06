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
  UsersRound,
} from 'lucide-react';

export const metadata = {
  title: 'About CampusOS | Higher Education Operations',
  description: 'Learn how CampusOS approaches connected, accountable and role-aware higher-education operations.',
  alternates: { canonical: '/about' },
};

const principles = [
  { title: 'Institution before software', description: 'Start with institutional structure, responsibility, policy and operating reality before selecting workflow patterns.', icon: Building2 },
  { title: 'Accountability before automation', description: 'Make ownership, approvals, exceptions and review paths explicit before accelerating operational work.', icon: FileCheck2 },
  { title: 'Trust before expansion', description: 'Preserve tenant isolation, role boundaries, evidence and transparent communication as the platform grows.', icon: ShieldCheck },
] as const;

const operatingModel = [
  ['01', 'Understand the institution', 'Map campuses, programmes, roles, systems, records, approvals and service expectations.'],
  ['02', 'Design the operating context', 'Define what each role needs to see, decide, approve and communicate.'],
  ['03', 'Implement in controlled phases', 'Sequence migration, configuration, testing, training and adoption around accountable owners.'],
  ['04', 'Improve with evidence', 'Refine workflows using authorised data, operational history and structured institutional feedback.'],
] as const;

export default function AboutPage() {
  return (
    <main className="bg-white text-[#101D38]">
      <section className="border-b border-[#DDE5EF] bg-[#F4F7FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1360px] gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]"><GraduationCap className="h-4 w-4" aria-hidden="true" />About CampusOS</div>
            <h1 className="mt-7 max-w-3xl text-balance text-4xl font-extrabold leading-[1.03] tracking-[-0.05em] sm:text-5xl lg:text-[64px]">Building the operating layer higher education needs</h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#5F6C7B] sm:text-lg">CampusOS is designed to help higher-education institutions coordinate learning, administration, finance, people and student service without losing institutional context.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/platform" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2]">Explore the platform <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
              <Link href="/contact?intent=sales" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C7D3E2] bg-white px-6 text-sm font-extrabold text-[#101D38] transition hover:border-[#95ACCB] hover:bg-[#F8FAFC]">Discuss your institution <UsersRound className="h-4 w-4 text-[#1754E8]" aria-hidden="true" /></Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-[#C7D4E5] bg-[#101D38] p-6 text-white shadow-[0_36px_90px_rgba(16,29,56,0.2)] sm:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#91B4F6]">Operating point of view</p><h2 className="mt-2 text-2xl font-extrabold">The institution is a connected system</h2></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1754E8]"><Layers3 className="h-5 w-5" aria-hidden="true" /></span></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ['Academic work', 'Programmes, teaching, assessment and learning evidence'],
                ['Institutional services', 'Admissions, finance, people and campus operations'],
                ['Community experience', 'Students, faculty, parents and service teams'],
                ['Governed improvement', 'Ownership, auditability, data boundaries and review'],
              ].map(([title, description]) => <article key={title} className="rounded-2xl border border-[#334B70] bg-[#172A4D] p-4"><p className="text-sm font-extrabold">{title}</p><p className="mt-2 text-xs leading-5 text-[#C4D0E1]">{description}</p></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1360px]">
          <div className="max-w-3xl"><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">Product principles</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">A disciplined approach to institutional technology</h2><p className="mt-5 text-base leading-8 text-[#5F6C7B]">CampusOS is shaped around the operating realities of higher education rather than a generic business-software template.</p></div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">{principles.map((principle) => { const Icon = principle.icon; return <article key={principle.title} className="rounded-[26px] border border-[#D9E3F0] bg-[#F7F9FC] p-7 shadow-[0_16px_40px_rgba(16,29,56,0.05)]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1754E8]"><Icon className="h-5 w-5" aria-hidden="true" /></span><h3 className="mt-7 text-xl font-extrabold">{principle.title}</h3><p className="mt-4 text-sm leading-7 text-[#5F6C7B]">{principle.description}</p></article>; })}</div>
        </div>
      </section>

      <section className="border-y border-[#DDE5EF] bg-[#F4F7FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-end"><div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">Operating model</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">A controlled path from complexity to clarity</h2></div><p className="max-w-2xl text-base leading-8 text-[#5F6C7B] lg:justify-self-end">Scope, ownership, data boundaries, implementation and improvement should be treated as one connected process.</p></div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] border border-[#D9E3F0] bg-[#D9E3F0] lg:grid-cols-4">{operatingModel.map(([number, title, description]) => <article key={number} className="bg-white p-7"><p className="text-4xl font-extrabold tracking-[-0.06em] text-[#D4E0F0]">{number}</p><h3 className="mt-8 text-lg font-extrabold">{title}</h3><p className="mt-3 text-sm leading-7 text-[#5F6C7B]">{description}</p></article>)}</div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1360px] gap-8 overflow-hidden rounded-[30px] bg-[#101D38] p-7 text-white shadow-[0_30px_80px_rgba(16,29,56,0.18)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-12">
          <div><div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#91B4F6]"><Globe2 className="h-4 w-4" aria-hidden="true" />Start with institutional context</div><h2 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Discuss the operating model your institution needs next</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#C4D0E1]">Bring your current systems, priority workflows, governance expectations and implementation constraints.</p></div>
          <Link href="/contact?intent=sales" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-[#101D38] transition hover:bg-[#EAF0FF]">Request an institutional consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}
