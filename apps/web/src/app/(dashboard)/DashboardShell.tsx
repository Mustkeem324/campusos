'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import { CommandPalette } from '../../components/layout/CommandPalette';
import { ImpersonationBanner } from '../../components/auth/ImpersonationBanner';
import { BulkImportModal } from '../../components/users/BulkImportModal';
import { useAuthStore } from '../../lib/auth-store';

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { isSidebarCollapsed } = useAuthStore();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl animate-bounce shadow-xl">
            C
          </div>
          <span className="text-xs font-mono font-bold text-gray-400">Loading CampusOS ERP...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary focus:text-white" style={{ zIndex: 100 }}>
        Skip to main content
      </a>

      {/* Row 1: Impersonation bar — pushes everything else down via CSS var */}
      <ImpersonationBanner />

      {/* Row 2: Fixed header — positioned using layout tokens */}
      <Header />

      {/* Sidebar — positioned using layout tokens */}
      <Sidebar />

      <CommandPalette />
      <BulkImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />

      {/* Main content — offset by sidebar + header heights */}
      <main
        id="main-content"
        className="dashboard-main flex-1 min-w-0 transition-all duration-300 pb-[max(3rem,env(safe-area-inset-bottom))] px-4 sm:px-6"
        style={{
          paddingTop: 'calc(var(--layout-top) + 24px)',
          marginLeft: isSidebarCollapsed
            ? 'var(--sidebar-collapsed-w)'
            : 'var(--sidebar-w)',
          maxWidth: 'var(--content-max-w)',
        }}
      >
        {children}
      </main>
    </div>
  );
}
