'use client';

import React, { useEffect, useState } from 'react';

import { DemoOnboardingProvider } from '../../components/demo/DemoOnboardingProvider';
import { DemoEnvironmentBanner } from '../../components/demo/DemoEnvironmentBanner';
import { ImpersonationBanner } from '../../components/auth/ImpersonationBanner';
import { BulkImportModal } from '../../components/users/BulkImportModal';
import { CommandPalette } from '../../components/layout/CommandPalette';
import { Header } from '../../components/layout/Header';
import { Sidebar } from '../../components/layout/Sidebar';
import { WorkspaceContextBar } from '../../components/layout/WorkspaceContextBar';
import { useAuthStore } from '../../lib/auth-store';

const dashboardShellVariables = {
  '--header-h': '68px',
  '--sidebar-w': '264px',
  '--sidebar-collapsed-w': '80px',
  '--content-max-w': '1600px',
} as React.CSSProperties;

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isSidebarCollapsed } = useAuthStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [restartTourKey, setRestartTourKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[#F2F5FA] px-6 text-[#101D38] dark:bg-[#090D16] dark:text-white"
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

  const handleRestartTour = () => {
    setRestartTourKey((previousKey) => previousKey + 1);
  };

  return (
    <DemoOnboardingProvider key={restartTourKey}>
      <div
        className="min-h-screen bg-[#F2F5FA] text-[#172033] dark:bg-[#090D16] dark:text-slate-100"
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
        <DemoEnvironmentBanner onRestartTutorial={handleRestartTour} />

        <Header />
        <Sidebar />

        <CommandPalette />
        <BulkImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />

        <main
          id="main-content"
          className="dashboard-main relative min-w-0 pb-[max(3rem,env(safe-area-inset-bottom))] transition-[margin] duration-300"
          style={{
            paddingTop: 'calc(var(--layout-top) + 24px)',
            marginLeft: isSidebarCollapsed
              ? 'var(--sidebar-collapsed-w)'
              : 'var(--sidebar-w)',
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-[var(--layout-top)] h-52 border-b border-[#E4EAF2] bg-[#F8FAFD] dark:border-slate-800 dark:bg-slate-950/60" aria-hidden="true" />

          <div className="relative mx-auto w-full max-w-[var(--content-max-w)] px-4 sm:px-6 lg:px-8">
            <WorkspaceContextBar />
            <div className="dashboard-content-stage">{children}</div>
          </div>
        </main>
      </div>
    </DemoOnboardingProvider>
  );
}
