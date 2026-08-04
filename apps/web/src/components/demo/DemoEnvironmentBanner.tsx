'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  RotateCcw, 
  HelpCircle, 
  LogOut, 
  UserCheck, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/auth-store';

interface DemoEnvironmentBannerProps {
  onRestartTutorial?: () => void;
}

const roleName = (role: string) => 
  role ? role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Student';

export function DemoEnvironmentBanner({ onRestartTutorial }: DemoEnvironmentBannerProps) {
  const { currentSession, setSession } = useAuthStore();
  const router = useRouter();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  const isDemoUser = currentSession?.email?.includes('.demo@') || currentSession?.tenantId === '00000000-0000-0000-0000-000000000000';

  if (!isDemoUser) return null;

  const handleExitDemo = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore error on logout call
    } finally {
      setSession(null);
      router.push('/login');
    }
  };

  const personaLabel = `${currentSession?.name || 'Rohan Verma'} · ${roleName(currentSession?.role || '')}`;

  return (
    <>
      <div 
        className="bg-[#101D38] text-white border-b border-[#2A3B5C] px-4 sm:px-6 h-12 md:h-14 flex items-center sticky top-0 z-40 shadow-sm"
        role="region"
        aria-label="Demo Environment Banner"
      >
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-4 text-xs">
          
          {/* Left Notice */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#27C93F] bg-[#182642] px-2.5 py-1 rounded-md border border-[#2A3B5C] shrink-0">
              <ShieldAlert size={14} className="text-[#27C93F]" /> Demo Environment
            </span>
            <span className="text-[#BEC7D7] hidden lg:inline truncate">
              All people and records shown here are fictional.
            </span>
          </div>

          {/* Centre Persona */}
          <div className="hidden md:flex items-center justify-center font-medium text-xs bg-[#182642] px-3 py-1 rounded-md border border-[#2A3B5C] text-[#A5D6FF] shrink-0">
            <strong className="text-white font-bold">{personaLabel}</strong>
          </div>

          {/* Right Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Primary Action: Switch Persona */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-white bg-[#1754E8] hover:bg-[#1140B8] font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <UserCheck size={14} /> Switch Persona
            </Link>

            {/* Secondary Action: Restart Tour */}
            {onRestartTutorial && (
              <button
                onClick={onRestartTutorial}
                className="inline-flex items-center gap-1.5 text-[#BEC7D7] hover:text-white bg-[#182642] hover:bg-[#2A3B5C] border border-[#2A3B5C] font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <RotateCcw size={14} /> Restart Tour
              </button>
            )}

            {/* Secondary Action: How It Works */}
            <Link
              href="/demo/how-it-works"
              className="inline-flex items-center gap-1.5 text-[#A5D6FF] hover:text-white bg-[#182642] hover:bg-[#2A3B5C] border border-[#2A3B5C] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <HelpCircle size={14} /> How It Works
            </Link>

            {/* Destructive Action: Exit Demo */}
            <button
              onClick={handleExitDemo}
              className="inline-flex items-center gap-1.5 text-[#FF8282] hover:text-white bg-[#D92D20]/20 hover:bg-[#D92D20]/40 border border-[#D92D20]/30 font-semibold px-2.5 py-1.5 rounded-lg transition-colors ml-1"
              title="Exit Demo"
            >
              <LogOut size={14} /> Exit Demo
            </button>
          </div>

          {/* Mobile Single Demo Options Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileSheetOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#1754E8] px-3 py-1.5 rounded-lg shadow-sm"
            >
              <SlidersHorizontal size={14} /> Demo Options
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Demo Options Bottom Sheet */}
      {isMobileSheetOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Demo Options Sheet"
        >
          <div className="bg-[#101D38] text-white rounded-t-3xl p-6 border-t border-[#2A3B5C] space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#2A3B5C] pb-3">
              <div>
                <span className="text-xs font-bold text-[#27C93F] uppercase tracking-wider">Demo Environment</span>
                <p className="text-sm font-bold text-white mt-0.5">{personaLabel}</p>
              </div>

              <button
                onClick={() => setIsMobileSheetOpen(false)}
                className="text-[#BEC7D7] hover:text-white p-1.5 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                href="/login"
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#1754E8] text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <UserCheck size={16} /> Switch Persona
              </Link>

              {onRestartTutorial && (
                <button
                  onClick={() => {
                    setIsMobileSheetOpen(false);
                    onRestartTutorial();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-[#182642] text-[#BEC7D7] font-semibold text-xs border border-[#2A3B5C] flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} /> Restart Tour
                </button>
              )}

              <Link
                href="/demo/how-it-works"
                onClick={() => setIsMobileSheetOpen(false)}
                className="w-full py-3 px-4 rounded-xl bg-[#182642] text-[#A5D6FF] font-semibold text-xs border border-[#2A3B5C] flex items-center justify-center gap-2"
              >
                <HelpCircle size={16} /> How It Works
              </Link>

              <button
                onClick={() => {
                  setIsMobileSheetOpen(false);
                  handleExitDemo();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#D92D20]/20 text-[#FF8282] border border-[#D92D20]/40 font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut size={16} /> Exit Demo
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
