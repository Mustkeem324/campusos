'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { CommandPalette } from '../../components/layout/CommandPalette';
import { ImpersonationBanner } from '../../components/auth/ImpersonationBanner';
import { BulkImportModal } from '../../components/users/BulkImportModal';
import { DemoEnvironmentBanner } from '../../components/demo/DemoEnvironmentBanner';
import { DemoOnboardingProvider } from '../../components/demo/DemoOnboardingProvider';
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
        className="flex min-h-screen items-center justify-center bg-[#F4F7FB] px-6 text-[#101D38] dark:bg-[#090D16] dark:text-white"
        style={dashboardShellVariables}
      >
        <div className="w-full max-w-sm rounded-2xl border border-[#DDE5EF] bg-white p-6 shadow-[0_18px_48px_rgba(16,29,56,0.08)] dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1754E8] text-xl font-extrabold text-white shadow-[0_10px_24px_rgba(23,84,232,0.24)]">
              C
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#101D38] dark:text-white">Preparing your workspace</p>
              <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">Loading authorised CampusOS modules and preferences.</p>
            </div>
          </div>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#E9EEF5] dark:bg-slate-800">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#1754E8]" />
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
        className="min-h-screen bg-[#F4F7FB] text-[#172033] dark:bg-[#090D16] dark:text-slate-100"
        style={dashboardShellVariables}
      >
        <a
          href="#main-content"
          className="sr-only rounded-lg bg-[#1754E8] px-4 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
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
          className="dashboard-main min-w-0 pb-[max(3rem,env(safe-area-inset-bottom))] transition-[margin] duration-300"
          style={{
            paddingTop: 'calc(var(--layout-top) + 28px)',
            marginLeft: isSidebarCollapsed
              ? 'var(--sidebar-collapsed-w)'
              : 'var(--sidebar-w)',
          }}
        >
          <div className="mx-auto w-full max-w-[var(--content-max-w)] px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </DemoOnboardingProvider>
  );
}
