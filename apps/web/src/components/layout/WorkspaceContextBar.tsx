'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  Command,
  HelpCircle,
  LockKeyhole,
  Newspaper,
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
  if (pathname === '/content/blog' || pathname.startsWith('/content/blog/')) return 'Blog Studio';

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
  const canManageBlog = currentSession?.role === 'SUPER_ADMIN' || currentSession?.role === 'INSTITUTION_ADMIN';

  return (
    <section
      className="mb-5 min-w-0 overflow-hidden rounded-2xl border border-[#D9E3F0] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:mb-6"
      aria-label="Workspace context"
    >
      <div className="min-w-0 px-4 py-4 sm:px-5 lg:px-6">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7C899B] dark:text-slate-500 sm:text-[11px]">
              <span className="max-w-[220px] truncate sm:max-w-[360px]">{institutionName}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{roleLabel}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap text-[#1754E8] dark:text-blue-300">{pageTitle}</span>
            </div>

            <div className="mt-2 flex min-w-0 items-start gap-3">
              <span className="mt-0.5 hidden h-9 w-1 shrink-0 rounded-full bg-[#1754E8] sm:block" aria-hidden="true" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-extrabold tracking-[-0.025em] text-[#101D38] dark:text-white sm:text-xl lg:text-2xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-[#667085] dark:text-slate-400 sm:text-sm">
                  Work inside the active institution and server-verified role context.
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#C9D8EE] bg-[#F4F7FC] px-3 text-xs font-bold text-[#49627F] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <LockKeyhole className="h-4 w-4 shrink-0 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
              Verified workspace
            </span>

            <span className="hidden min-h-9 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 sm:inline-flex">
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              System operational
            </span>

            {canManageBlog && (
              <Link
                href="/content/blog"
                className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#C9D8EE] bg-white px-3 text-xs font-bold text-[#101D38] transition hover:border-[#95ACCB] hover:bg-[#F7F9FC] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
              >
                <Newspaper className="h-4 w-4 shrink-0 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                <span className="hidden sm:inline">Blog Studio</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setCmdPaletteOpen(true)}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#C9D8EE] bg-white px-3 text-xs font-bold text-[#101D38] transition hover:border-[#95ACCB] hover:bg-[#F7F9FC] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
            >
              <Command className="h-4 w-4 shrink-0 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
              <span className="hidden sm:inline">Commands</span>
            </button>

            <Link
              href="/helpdesk"
              className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#101D38] px-3 text-xs font-bold text-white transition hover:bg-[#172A4D] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <HelpCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Get help</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
