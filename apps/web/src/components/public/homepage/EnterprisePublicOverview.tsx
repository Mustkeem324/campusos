import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  CircleDot,
  Command,
  Database,
  FileCheck2,
  Gauge,
  KeyRound,
  Layers3,
  LockKeyhole,
  Network,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';

const operationalLayers = [
  {
    label: 'Identity & access',
    title: 'Role-aware institutional access',
    description: 'Institution, tenant, user and persisted role context stay attached to authorised work instead of relying on browser state alone.',
    icon: KeyRound,
  },
  {
    label: 'Academic operations',
    title: 'Connected academic records',
    description: 'Courses, offerings, enrolments, attendance, assessments, published results and role-specific teaching work share institutional context.',
    icon: Layers3,
  },
  {
    label: 'Finance',
    title: 'Controlled fee and payment workflows',
    description: 'Invoices and recorded payments remain the system of record, with Razorpay, Stripe and verified direct-bank workflows available when configured.',
    icon: ReceiptText,
  },
  {
    label: 'Governance',
    title: 'Audit and exception visibility',
    description: 'Operational alerts, support cases, notices, audit activity and administrative decisions remain visible to authorised roles.',
    icon: ShieldCheck,
  },
] as const;

const controlRows = [
  ['Institution isolation', 'Tenant-scoped data access', 'Server-resolved institution context'],
  ['Role permissions', 'Role-specific loaders and navigation', 'Persisted role + permission checks'],
  ['Payments', 'Razorpay, Stripe, direct bank verification', 'Signed provider confirmation or finance approval'],
  ['Platform administration', 'Cross-institution company control plane', 'SUPER_ADMIN-only server access'],
  ['System status', 'Application and database health', 'Live health endpoint with no-cache checks'],
] as const;

const lifecycle = [
  { step: '01', title: 'Scope', detail: 'Confirm institution, campuses, responsibilities, workflows and implementation boundaries.' },
  { step: '02', title: 'Configure', detail: 'Set role access, academic structures, operational rules, payment channels and institutional settings.' },
  { step: '03', title: 'Operate', detail: 'Run day-to-day academic, finance, people and service workflows from role-aware workspaces.' },
  { step: '04', title: 'Govern', detail: 'Review exceptions, audit activity, support, access, contracts and platform health without losing context.' },
] as const;

const commandCentre = [
  { title: 'What needs attention', detail: 'Exception-led alerts instead of noisy generic notifications.', icon: CircleDot },
  { title: 'What changed', detail: 'Recent activity and notices stay near the work they affect.', icon: Workflow },
  { title: 'What to do next', detail: 'Permission-aware quick actions lead directly to supported workflows.', icon: Command },
  { title: 'How the system is operating', detail: 'Role metrics and live application/database health can be surfaced without exposing another institution.', icon: Gauge },
] as const;

export function EnterprisePublicOverview() {
  return (
    <section className="border-b border-[#DDE5EF] bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20" aria-labelledby="enterprise-overview-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:gap-16">
          <div className="xl:sticky xl:top-[104px] xl:self-start">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-[#C8D5E8] bg-[#F7F9FC] px-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]"><Building2 className="h-3.5 w-3.5" aria-hidden="true" />Enterprise operating model</div>
            <h2 id="enterprise-overview-heading" className="mt-5 max-w-[620px] text-[34px] font-extrabold leading-[1.08] tracking-[-0.045em] text-[#101828] sm:text-[42px]">A serious institutional platform should explain how work is controlled—not just how many screens it has.</h2>
            <p className="mt-5 max-w-[620px] text-sm leading-7 text-[#5F6C7B] sm:text-[15px]">CampusOS is structured around institution context, role responsibility, auditable workflow and real operational records. Public pages describe the platform; private homepages use the authorised institution data already available to each signed-in role.</p>

            <div className="mt-7 rounded-[12px] border border-[#CCD8E7] bg-[#101D38] p-5 text-white">
              <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#1754E8]"><LockKeyhole className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#AFC4E6]">Privacy boundary</p><p className="mt-1 text-base font-extrabold">No private institution KPI is exposed on this public page.</p><p className="mt-2 text-xs leading-5 text-[#C6D2E4]">Signed-in users receive role-scoped operational data. Visitors receive factual product capability information only.</p></div></div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?intent=sales" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] bg-[#1754E8] px-5 text-sm font-extrabold text-white transition hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2">Discuss institutional requirements <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
              <Link href="/security" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[9px] border border-[#C7D3E2] bg-white px-5 text-sm font-extrabold text-[#344054] transition hover:border-[#9BAFC9] hover:text-[#1754E8]">Review security <ShieldCheck className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>

          <div className="space-y-5">
            <div className="overflow-hidden rounded-[14px] border border-[#CDD8E5] bg-[#F7F9FC] shadow-[0_12px_32px_rgba(16,29,56,0.06)]">
              <div className="flex flex-col gap-3 border-b border-[#D9E2ED] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Operating architecture</p><h3 className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">Connected institutional control layers</h3></div>
                <span className="inline-flex items-center gap-2 rounded-md border border-[#BFE3D4] bg-[#F1FBF7] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.07em] text-[#087A55]"><span className="h-1.5 w-1.5 rounded-full bg-[#087A55]" />Production-oriented architecture</span>
              </div>
              <div className="grid gap-px bg-[#D9E2ED] sm:grid-cols-2">
                {operationalLayers.map(({ label, title, description, icon: Icon }) => <article key={title} className="bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] bg-[#EEF3FB] text-[#1754E8]"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7A8698]">{label}</p><h4 className="mt-1.5 text-sm font-extrabold text-[#101828]">{title}</h4><p className="mt-2 text-xs leading-5 text-[#667085]">{description}</p></div></div></article>)}
              </div>
            </div>

            <div className="overflow-hidden rounded-[14px] border border-[#D4DEE9] bg-white shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
              <div className="border-b border-[#E0E6EE] px-5 py-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Control matrix</p><h3 className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">How critical product surfaces are governed</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead><tr className="bg-[#F7F9FC] text-[9px] font-extrabold uppercase tracking-[0.09em] text-[#667085]"><th className="border-b border-[#E2E8F0] px-5 py-3">Surface</th><th className="border-b border-[#E2E8F0] px-5 py-3">Operating model</th><th className="border-b border-[#E2E8F0] px-5 py-3">Evidence / control</th></tr></thead>
                  <tbody className="divide-y divide-[#E8EDF3]">{controlRows.map(([surface, model, evidence]) => <tr key={surface} className="transition hover:bg-[#FAFBFD]"><td className="px-5 py-3.5 text-sm font-extrabold text-[#344054]">{surface}</td><td className="px-5 py-3.5 text-xs leading-5 text-[#5F6C7B]">{model}</td><td className="px-5 py-3.5 text-xs leading-5 text-[#5F6C7B]"><span className="inline-flex items-start gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#087A55]" aria-hidden="true" />{evidence}</span></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section aria-labelledby="lifecycle-heading" className="rounded-[14px] border border-[#D5DFEA] bg-[#F8FAFD] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Institution lifecycle</p><h3 id="lifecycle-heading" className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#101828]">From scope to governed operations</h3></div><Link href="/implementation" className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1754E8]">Implementation approach <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
            <div className="mt-6 grid gap-px overflow-hidden rounded-[11px] border border-[#D8E1EC] bg-[#D8E1EC] sm:grid-cols-2 xl:grid-cols-4">{lifecycle.map((item) => <article key={item.step} className="bg-white p-4"><span className="text-[10px] font-black tabular-nums text-[#1754E8]">{item.step}</span><h4 className="mt-3 text-sm font-extrabold text-[#101828]">{item.title}</h4><p className="mt-2 text-xs leading-5 text-[#667085]">{item.detail}</p></article>)}</div>
          </section>

          <section aria-labelledby="command-centre-heading" className="rounded-[14px] border border-[#C8D5E5] bg-[#101D38] p-5 text-white sm:p-6">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#1754E8]"><Gauge className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#AFC4E6]">Signed-in homepage</p><h3 id="command-centre-heading" className="mt-1 text-xl font-extrabold tracking-[-0.03em]">An operational command centre, not a template dashboard</h3></div></div>
            <div className="mt-5 space-y-2">{commandCentre.map(({ title, detail, icon: Icon }) => <div key={title} className="flex items-start gap-3 border-b border-white/10 py-3 last:border-b-0"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8FB4FF]" aria-hidden="true" /><div><p className="text-sm font-extrabold">{title}</p><p className="mt-1 text-xs leading-5 text-[#C4D0E3]">{detail}</p></div></div>)}</div>
          </section>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Assurance icon={Database} label="Real data first" detail="Existing records and loaders are reused before new endpoints are considered." />
          <Assurance icon={UsersRound} label="Role appropriate" detail="A student, guardian, faculty member and administrator do not receive the same payload." />
          <Assurance icon={Banknote} label="Real payment controls" detail="Provider-confirmed or finance-reviewed flows sit around the existing finance ledger." />
          <Assurance icon={FileCheck2} label="Auditable operations" detail="Status, evidence and institutional context stay attached to operational work." />
        </div>
      </div>
    </section>
  );
}

function Assurance({ icon: Icon, label, detail }: { icon: typeof Network; label: string; detail: string }) {
  return <div className="flex items-start gap-3 rounded-[11px] border border-[#D9E2ED] bg-white p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#EEF3FB] text-[#1754E8]"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-xs font-extrabold text-[#344054]">{label}</p><p className="mt-1 text-[11px] leading-5 text-[#667085]">{detail}</p></div></div>;
}
