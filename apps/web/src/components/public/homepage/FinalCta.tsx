import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Building2,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';

const benefits = [
  { title: 'Governed access', description: 'Institution, role and permission context stays visible.', icon: ShieldCheck },
  { title: 'Role-aware workspaces', description: 'People work from responsibilities relevant to their role.', icon: UsersRound },
  { title: 'Connected operations', description: 'Academic and administrative workflows share accountable context.', icon: Blocks },
  { title: 'Decision-ready reporting', description: 'Dashboards and reports are built around authorised institutional data.', icon: BarChart3 },
] as const;

const consultationInputs = [
  'Institution structure, campuses and active programmes',
  'Current systems, priority workflows and integration requirements',
  'User roles, access expectations and governance constraints',
  'Migration readiness, implementation timeline and procurement process',
] as const;

export function FinalCta() {
  return (
    <section className="overflow-hidden bg-[#020A1E] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="final-cta-heading">
      <div className="mx-auto max-w-[1420px]">
        <div className="relative isolate overflow-hidden rounded-[30px] border border-[#2956A5]/70 bg-[#051331] px-5 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.4)] sm:px-8 sm:py-16 lg:px-16 lg:py-20">
          <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" style={{ backgroundImage: 'radial-gradient(circle at 50% 22%, rgba(25,84,232,0.30), transparent 42%)' }} />
          <div className="relative z-10">
            <div className="mx-auto max-w-[940px] text-center">
              <div className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-[#6487DB]/70 bg-[#0A1A40]/90 px-5 text-sm font-bold text-[#E4EBF8]"><ShieldCheck className="h-5 w-5 text-[#438EFF]" aria-hidden="true" />Institutional technology, evaluated with context</div>
              <h2 id="final-cta-heading" className="mt-8 text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-[66px]">Ready to evaluate <span className="mt-1 block text-[#4B8EFF]">CampusOS for your institution?</span></h2>
              <p className="mx-auto mt-7 max-w-[780px] text-pretty text-base leading-7 text-[#B9C5D9] sm:text-lg sm:leading-8">Start with your current systems, operating responsibilities and implementation constraints. We will use that context to discuss product fit without relying on fictional customer metrics or shared sample accounts.</p>

              <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
                <Link href="/contact?intent=sales" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#4C90FF] bg-[#1754E8] px-8 py-4 text-base font-extrabold text-white shadow-[0_15px_40px_rgba(23,84,232,0.35)] transition hover:bg-[#0F46D4]">Request a consultation <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
                <Link href="/contact" className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#8A9AB8] bg-[#07132F]/70 px-8 py-4 text-base font-extrabold text-white transition hover:border-white/70 hover:bg-white/[0.07]"><MessageCircle className="h-5 w-5" aria-hidden="true" />Contact CampusOS <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
              </div>
            </div>

            <div className="mx-auto mt-14 grid max-w-[1240px] gap-3 border-y border-white/10 py-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
              {benefits.map(({ title, description, icon: Icon }) => <article key={title} className="flex min-w-0 items-start gap-4 px-2 py-3 lg:px-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0D2348] text-[#6D9EFF]"><Icon className="h-6 w-6" aria-hidden="true" /></span><div><h3 className="text-sm font-extrabold text-white">{title}</h3><p className="mt-1.5 text-xs leading-5 text-[#AEBBD0]">{description}</p></div></article>)}
            </div>

            <div className="mx-auto mt-10 grid max-w-[1240px] gap-6 overflow-hidden rounded-3xl border border-[#254477] bg-[#071631]/90 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.2)] lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:p-8">
              <div>
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#132C59] text-[#719CFF]"><Building2 className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#8097BA]">Prepare for the conversation</p><h3 className="mt-1 text-lg font-extrabold text-white">Institutional discovery inputs</h3></div></div>
                <p className="mt-4 text-sm leading-6 text-[#AEBBD0]">A useful product conversation starts with your operating reality, not a generic presentation.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {consultationInputs.map((item) => <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-[#D2DAE7]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#50D8A9]" aria-hidden="true" /><span>{item}</span></div>)}
              </div>
            </div>

            <div className="mx-auto mt-6 flex max-w-[1240px] items-start gap-3 rounded-2xl border border-[#294B7C] bg-[#091B39] p-4 text-xs leading-5 text-[#8FA2C0]"><Workflow className="mt-0.5 h-4 w-4 shrink-0 text-[#719CFF]" aria-hidden="true" /><p>Product availability, implementation scope, third-party integrations and commercial terms are confirmed during formal discovery and procurement. No customer scale or performance claim is implied here.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
