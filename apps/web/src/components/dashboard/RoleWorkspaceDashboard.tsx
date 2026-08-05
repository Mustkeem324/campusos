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
      <header className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              <Landmark className="h-4 w-4" aria-hidden="true" />
              {profile.eyebrow}
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              {profile.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
              {profile.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-secondary">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                Server-verified role: {displayRole}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-secondary">
                <LockKeyhole className="h-4 w-4 text-primary" aria-hidden="true" />
                {permissionCount} configured permission{permissionCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <aside className="border-t border-border bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9EBBEE]">Workspace guidance</p>
            <h2 className="mt-3 text-xl font-bold">Operate within approved scope</h2>
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
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Role actions</p>
            <h2 id="workspace-actions-heading" className="mt-2 text-2xl font-bold tracking-tight text-text-primary">
              Start with your assigned workflows
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-text-secondary">
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
                className="group flex min-h-48 flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/15 bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-base font-bold text-text-primary">{action.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">{action.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  Open module
                  <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7" aria-labelledby="responsibilities-heading">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <FileCheck2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">Role focus</p>
              <h2 id="responsibilities-heading" className="mt-1 text-xl font-bold text-text-primary">Key responsibilities</h2>
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {profile.responsibilities.map((responsibility) => (
              <li key={responsibility} className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3.5 text-sm leading-6 text-text-secondary">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <span>{responsibility}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7" aria-labelledby="assurance-heading">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-text-muted">Professional controls</p>
              <h2 id="assurance-heading" className="mt-1 text-xl font-bold text-text-primary">Safe workspace behavior</h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <AssuranceItem title="No silent role fallback" description="This workspace never substitutes an admin, faculty or student dashboard for another role." />
            <AssuranceItem title="No invented operational data" description="The page presents role guidance and navigation only; it does not manufacture counts, alerts or status metrics." />
            <AssuranceItem title="Support path available" description="Use the helpdesk when access, workflow ownership or institutional data scope is unclear." />
          </div>

          <Link
            href="/helpdesk"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary-soft px-4 py-2.5 text-sm font-bold text-primary transition hover:border-primary/40 hover:bg-primary/10"
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
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <p className="text-sm font-bold text-text-primary">{title}</p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{description}</p>
    </div>
  );
}
