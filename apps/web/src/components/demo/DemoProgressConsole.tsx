'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  Layers, 
  Sparkles, 
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { SCENARIO_CATALOGUE } from '../../lib/demo/scenarios';

export function DemoProgressConsole() {
  const [progressData, setProgressData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/demo/progress')
      .then((res) => res.json())
      .then((data) => setProgressData(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !progressData) {
    return (
      <div className="min-h-[300px] flex items-center justify-center bg-white rounded-3xl border border-[#DEE5EF] p-8">
        <div className="text-xs font-mono font-bold text-[#5F6B7A]">Loading Demo Progress...</div>
      </div>
    );
  }

  const { totalScenarios, completedScenarios, inProgressScenarios, progressPct, instances } = progressData;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#101B33] text-white rounded-3xl p-6 md:p-10 border border-[#2A3B5C] shadow-2xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1854E8]/20 border border-[#1854E8]/40 text-[#A5D6FF] text-xs font-bold uppercase tracking-wider mb-4">
            <Layers size={14} className="text-[#1854E8]" /> Demo Progress Centre
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Your Story Mode Exploration Progress
          </h1>
          <p className="text-[#BEC7D7] text-base md:text-lg leading-relaxed">
            Track your completion of connected campus scenarios, roles explored, and multi-tenant security verifications.
          </p>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-[#DEE5EF] shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5F6B7A] mb-1">Overall Progress</div>
          <div className="text-3xl font-extrabold text-[#1854E8] mb-2">{progressPct}%</div>
          <div className="w-full bg-[#DEE5EF] h-2 rounded-full overflow-hidden">
            <div className="bg-[#1854E8] h-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#DEE5EF] shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5F6B7A] mb-1">Completed Scenarios</div>
          <div className="text-3xl font-extrabold text-[#078A57]">{completedScenarios} / {totalScenarios}</div>
          <p className="text-xs text-[#5F6B7A] mt-1">Full workflows finished</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#DEE5EF] shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5F6B7A] mb-1">In Progress</div>
          <div className="text-3xl font-extrabold text-[#B36B00]">{inProgressScenarios}</div>
          <p className="text-xs text-[#5F6B7A] mt-1">Active step sessions</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#DEE5EF] shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-[#5F6B7A] mb-1">Roles Explored</div>
          <div className="text-3xl font-extrabold text-[#101B33]">4 / 4</div>
          <p className="text-xs text-[#5F6B7A] mt-1">Admin, Faculty, Student, Parent</p>
        </div>
      </div>

      {/* Scenario Status List */}
      <div className="bg-white rounded-3xl border border-[#DEE5EF] p-6 md:p-8 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-[#101B33]">Scenario Status Breakdown</h3>
        <div className="space-y-3">
          {SCENARIO_CATALOGUE.map((sc) => {
            const inst = instances.find((i: any) => i.scenarioId === sc.id);
            const isCompleted = inst?.status === 'COMPLETED';
            const currentStep = inst?.currentStep || 1;

            return (
              <div key={sc.id} className="p-4 rounded-2xl border border-[#DEE5EF] flex items-center justify-between gap-4 bg-[#F5F7FB]">
                <div>
                  <h4 className="text-base font-bold text-[#101B33]">{sc.title}</h4>
                  <p className="text-xs text-[#5F6B7A]">{sc.purpose}</p>
                </div>

                <div className="flex items-center gap-3">
                  {isCompleted ? (
                    <span className="text-xs font-bold text-[#078A57] bg-[#e6f4ed] px-3 py-1 rounded-full border border-[#078A57]/30 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  ) : inst ? (
                    <span className="text-xs font-bold text-[#1854E8] bg-[#EEF3FF] px-3 py-1 rounded-full border border-[#C6D7FE]">
                      Step {currentStep} / {sc.totalSteps}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#5F6B7A] bg-white px-3 py-1 rounded-full border border-[#DEE5EF]">
                      Not Started
                    </span>
                  )}

                  <Link
                    href={`/demo/scenarios/${sc.id}${inst ? `?instanceId=${inst.id}` : ''}`}
                    className="px-4 py-2 text-xs font-bold bg-[#1854E8] text-white rounded-xl hover:bg-[#1140B8]"
                  >
                    Open
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
