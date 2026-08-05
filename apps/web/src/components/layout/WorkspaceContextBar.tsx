'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  Command,
  HelpCircle,
  LockKeyhole,
  Sparkles,
} from 'lucide-react';

import { useAuthStore } from '@/lib/auth-store';
import { dashboardDefinitionForRole, KNOWN_ROLES } from '@/lib/dashboard/registry';

function formatLabel(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function pageTitleForPath(pathname: string, role?: string): string {
  const knownRole = role
    ? KNOWN_ROLES.find((candidateRole) => candidateRole === role)
    : undefined;

  if (knownRole) {
    const definition = dashboardDefinitionForRole(knownRole);
    const activeItem = definition.navigation
      .flatMap((group) => group.items)
      .find(
        (item) =>
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)),
      );

    if (activeItem) return activeItem.label;
  }

  const finalSegment = pathname.split('/').filter(Boolean).at(-1);
  return finalSegment ? formatLabel(finalSegment) : 'Dashboard';
}

export function WorkspaceContextBar() {
  const pathname = usePathname();
  const { currentSession, setCmdPaletteOpen } = useAuthStore();

  const institutionName = currentSession?.institutionName ?? 'CampusOS Institution';
  const roleLabel = currentSession?.role
    ? formatLabel(currentSession.role)
    : 'Workspace Member';
  const pageTitle = pageTitleForPath(pathname, currentSession?.role);

  return (
    <section
      className="mb-6 overflow-hidden rounded-2xl border border-[#D9E3F0] bg-white shadow-[0_12px_36px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950"
      aria-label="Workspace context"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7C899B] dark:text-slate-500">
            <span className="truncate">{institutionName}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{roleLabel}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="text-[#1754E8] dark:text-blue-300">{pageTitle}</span>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold tracking-[-0.02em] text-[#101D38] dark:text-white sm:text-xl">
                {pageTitle}
              </h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-[#667085] dark:text-slate-400">
                Work inside the active institution and server-verified role context.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#C9D8EE] bg-[#F4F7FC] px-3 text-xs font-bold text-[#49627F] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <LockKeyhole className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Verified workspace
              </span>

              <button
                type="button"
                onClick={() => setCmdPaletteOpen(true)}
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#C9D8EE] bg-white px-3 text-xs font-bold text-[#101D38] transition hover:border-[#95ACCB] hover:bg-[#F7F9FC] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              >
                <Command className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Command centre
              </button>

              <Link
                href="/helpdesk"
                className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#101D38] px-3 text-xs font-bold text-white transition hover:bg-[#172A4D] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Get help
              </Link>
            </div>
          </div>
        </div>

        <aside className="hidden min-w-[230px] border-l border-[#D9E3F0] bg-[#F7F9FD] px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60 lg:block">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1754E8] dark:text-blue-300">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Focus principle
          </div>
          <p className="mt-2 text-xs leading-5 text-[#5F6C7B] dark:text-slate-400">
            Prioritise exceptions, approvals and actions before decorative reporting.
          </p>
        </aside>
      </div>
    </section>
  );
}
