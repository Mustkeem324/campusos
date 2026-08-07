'use client';

import { LayoutDashboard, SlidersHorizontal, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ImpersonationBanner } from '../../components/auth/ImpersonationBanner';
import { AcademicCommunityDashboardBanner } from '../../components/community/chat/AcademicCommunityDashboardBanner';
import { BulkImportModal } from '../../components/users/BulkImportModal';
import { CommandPalette } from '../../components/layout/CommandPalette';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { WorkspaceContextBar } from '../../components/layout/WorkspaceContextBar';
import { PwaRegistration } from '../../components/pwa/PwaRegistration';
import { useAuthStore } from '../../lib/auth-store';

const dashboardShellVariables = {
  '--header-h': '68px',
  '--sidebar-w': '264px',
  '--sidebar-collapsed-w': '80px',
  '--content-max-w': '1500px',
  '--demo-banner-h': '0px',
} as React.CSSProperties;

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isSidebarCollapsed, currentSession } = useAuthStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#F2F5FA] px-6 text-[#101D38] dark:bg-[#090D16] dark:text-white"
        style={dashboardShellVariables}
      >
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#D9E3F0] bg-white shadow-[0_28px_80px_rgba(16,29,56,0.12)] dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-[#E1E8F1] bg-[#101D38] px-6 py-5 text-white dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754E8] text-xl font-extrabold text-white shadow-[0_12px_28px_rgba(23,84,232,0.34)]">
                C
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold tracking-tight">Preparing your CampusOS workspace</p>
                <p className="mt-1 text-xs leading-5 text-[#B7C4D8]">
                  Resolving the authorised institution, role and available modules.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid grid-cols-3 gap-3" aria-hidden="true">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#EEF2F7] dark:bg-slate-900" />
              ))}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E9EEF5] dark:bg-slate-800">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1754E8]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sidebarWidth = isSidebarCollapsed
    ? 'var(--sidebar-collapsed-w)'
    : 'var(--sidebar-w)';
  const showLayoutShortcuts = pathname !== '/dashboard/personalized' && pathname !== '/dashboard/customize';

  return (
    <>
      <PwaRegistration />
      <div
        className="isolate min-h-screen w-full max-w-full overflow-x-hidden overscroll-x-none bg-[#F2F5FA] text-[#172033] dark:bg-[#090D16] dark:text-slate-100"
        style={dashboardShellVariables}
      >
        <a
          href="#main-content"
          className="sr-only rounded-xl bg-[#1754E8] px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          style={{ zIndex: 100 }}
        >
          Skip to main content
        </a>

        <ImpersonationBanner />
        <Header />
        <Sidebar />

        <CommandPalette />
        <BulkImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />

        <main
          id="main-content"
          className="dashboard-main relative min-w-0 max-w-full overflow-x-clip pb-[max(3rem,env(safe-area-inset-bottom))] transition-[margin,width] duration-300 max-md:!ml-0 max-md:!w-full"
          style={{
            paddingTop: 'calc(var(--layout-top) + 24px)',
            marginLeft: sidebarWidth,
            width: `calc(100% - ${sidebarWidth})`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-[var(--layout-top)] h-52 border-b border-[#E4EAF2] bg-[#F8FAFD] dark:border-slate-800 dark:bg-slate-950/60"
            aria-hidden="true"
          />

          <div className="relative mx-auto w-full min-w-0 max-w-[var(--content-max-w)] px-4 sm:px-5 lg:px-6 xl:px-8">
            <WorkspaceContextBar />
            <AcademicCommunityDashboardBanner />
            {showLayoutShortcuts && (
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <Link
                  href="/dashboard/personalized"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C8D7EA] bg-white px-3.5 text-xs font-extrabold text-[#334155] shadow-sm transition hover:border-[#AFC4DF] hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  My layout
                </Link>
                <Link
                  href="/dashboard/customize"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C8D7EA] bg-white px-3.5 text-xs font-extrabold text-[#1754E8] shadow-sm transition hover:border-[#AFC4DF] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Customize dashboard
                </Link>
              </div>
            )}
            <div className="dashboard-content-stage min-w-0 max-w-full overflow-x-clip [&>*]:min-w-0 [&>*]:max-w-full">
              {children}
            </div>
          </div>
        </main>

        {currentSession?.role === 'STUDENT' && (
          <Link
            href="/student-help"
            aria-label="Open AI Student Help"
            className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#31598C] bg-[#0B1F3A] px-4 text-sm font-black text-white shadow-[0_18px_40px_rgba(11,31,58,0.28)] transition hover:-translate-y-0.5 hover:bg-[#102E5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6EA2F4] sm:right-6"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden sm:inline">Student Help</span>
          </Link>
        )}
      </div>
    </>
  );
}
