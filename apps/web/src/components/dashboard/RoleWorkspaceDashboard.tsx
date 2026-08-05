import Link from 'next/link';
import type { RoleType } from '@prisma/client';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  CircleHelp,
  FileCheck2,
  Landmark,
  LifeBuoy,
  LockKeyhole,
  ReceiptIndianRupee,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import type { RoleWorkspaceAction, RoleWorkspaceProfile } from '@/lib/dashboard/role-workspace';
import { roleLabel } from '@/lib/dashboard/role-workspace';

const actionIcons = {
  records: FileCheck2,
  academics: BookOpenCheck,
  finance: ReceiptIndianRupee,
  people: UsersRound,
  operations: Building2,
  support: LifeBuoy,
} satisfies Record<RoleWorkspaceAction['icon'], React.ElementType>;

type RoleWorkspaceDashboardProps = {
  role: RoleType;
  profile: RoleWorkspaceProfile;
  permissionCount: number;
};

export function RoleWorkspaceDashboard({ role, profile, permissionCount }: RoleWorkspaceDashboardProps) {
  const displayRole = roleLabel(role);

  return (
    <section className="space-y-6" aria-label={`${displayRole} dashboard`}>
      <header className="overflow-hidden rounded-[28px] border border-[#D9E3F0] bg-white shadow-[0_24px_60px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <Landmark className="h-4 w-4" aria-hidden="true" />
              {profile.eyebrow}
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white sm:text-4xl">
              {profile.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#5F6C7B] dark:text-slate-400">
              {profile.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Server-verified role: {displayRole}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <LockKeyhole className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                {permissionCount} configured permission{permissionCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <aside className="border-t border-[#263D61] bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#9EBBEE]">Workspace guidance</p>
            <h2 className="mt-3 text-xl font-extrabold tracking-[-0.02em]">Operate within approved scope</h2>
            <p className="mt-4 text-sm leading-6 text-[#D1DBE9]">{profile.guidance}</p>
            <div className="mt-6 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-4">
              <div className="flex items-start gap-3">
                <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[#9EBBEE]" aria-hidden="true" />
                <p className="text-sm leading-6 text-[#C7D3E4]">
                  Missing access should be resolved through the institution administrator or helpdesk, not by switching to another role.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <section aria-labelledby="workspace-actions-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:text-blue-300">Role actions</p>
            <h2 id="workspace-actions-heading" className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[#101D38] dark:text-white">
              Start with your assigned workflows
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#667085] dark:text-slate-400">
            These links open existing CampusOS modules. Access remains subject to each route’s server-side authorization.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {profile.actions.map((action) => {
            const Icon = actionIcons[action.icon];
            return (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="group flex min-h-52 flex-col rounded-[24px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] transition hover:-translate-y-1 hover:border-[#B7C9E1] hover:shadow-[0_22px_50px_rgba(16,29,56,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-extrabold text-[#101D38] dark:text-white">{action.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-[#667085] dark:text-slate-400">{action.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#1754E8] dark:text-blue-300">
                  Open module
                  <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-6 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-7" aria-labelledby="responsibilities-heading">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/50 dark:text-blue-300">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A95A6] dark:text-slate-500">Role focus</p>
              <h2 id="responsibilities-heading" className="mt-1 text-xl font-extrabold text-[#101D38] dark:text-white">Key responsibilities</h2>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {profile.responsibilities.map((responsibility) => (
              <li key={responsibility} className="flex items-start gap-3 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] px-4 py-3.5 text-sm leading-6 text-[#536175] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />
                <span>{responsibility}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-6 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-7" aria-labelledby="assurance-heading">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/50 dark:text-blue-300">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#8A95A6] dark:text-slate-500">Professional controls</p>
              <h2 id="assurance-heading" className="mt-1 text-xl font-extrabold text-[#101D38] dark:text-white">Safe workspace behavior</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <AssuranceItem title="No silent role fallback" description="This workspace never substitutes an admin, faculty or student dashboard for another role." />
            <AssuranceItem title="No invented operational data" description="The page presents role guidance and navigation only; it does not manufacture counts, alerts or status metrics." />
            <AssuranceItem title="Support path available" description="Use the helpdesk when access, workflow ownership or institutional data scope is unclear." />
          </div>

          <Link
            href="/helpdesk"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#C9DAF8] bg-[#EDF3FF] px-4 py-2.5 text-sm font-extrabold text-[#1754E8] transition hover:border-[#AFC4E8] hover:bg-[#E5EDFF] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300"
          >
            Open helpdesk
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </section>
  );
}

function AssuranceItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-extrabold text-[#101D38] dark:text-white">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">{description}</p>
    </div>
  );
}
