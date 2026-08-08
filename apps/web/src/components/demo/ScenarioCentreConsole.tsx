'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  CalendarDays, 
  CreditCard, 
  HelpCircle, 
  GraduationCap, 
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { SCENARIO_CATALOGUE, DemoScenarioDefinition } from '../../lib/demo/scenarios';
import { useAuthStore } from '../../lib/auth-store';

export function ScenarioCentreConsole() {
  const router = useRouter();
  const { currentSession } = useAuthStore();
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingScenario, setStartingScenario] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/demo/scenarios')
      .then((res) => res.json())
      .then((data) => {
        if (data.instances) setInstances(data.instances);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleStartScenario = async (scenarioId: string) => {
    setStartingScenario(scenarioId);
    try {
      const res = await fetch(`/api/demo/scenarios/${scenarioId}/start`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start scenario');
      router.push(`/demo/scenarios/${scenarioId}?instanceId=${data.instance.id}`);
    } catch (err: any) {
      alert(err.message);
      setStartingScenario(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Academics': return <BookOpen size={18} className="text-[#1854E8]" />;
      case 'Attendance': return <CalendarDays size={18} className="text-[#078A57]" />;
      case 'Finance': return <CreditCard size={18} className="text-[#B36B00]" />;
      case 'Student Services': return <HelpCircle size={18} className="text-[#7B1FA2]" />;
      case 'Examinations': return <GraduationCap size={18} className="text-[#C2185B]" />;
      case 'Admissions': return <ShieldCheck size={18} className="text-[#00796B]" />;
      default: return <Sparkles size={18} className="text-[#1854E8]" />;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      
      {/* Header Banner */}
      <div className="bg-[#101B33] text-white rounded-3xl p-6 md:p-10 border border-[#2A3B5C] shadow-2xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1854E8]/20 border border-[#1854E8]/40 text-[#A5D6FF] text-xs font-bold uppercase tracking-wider mb-4">
            <Layers size={14} className="text-[#1854E8]" /> Connected Story Mode
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
            Explore connected CampusOS workflows
          </h1>
          <p className="text-[#BEC7D7] text-base md:text-lg leading-relaxed mb-6">
            Complete fictional campus workflows and switch roles to see how one action updates the right people, records and dashboards in real time.
          </p>

          <div className="p-3 bg-[#182642] border border-[#2A3B5C] rounded-2xl flex items-center gap-3 text-xs text-[#BEC7D7]">
            <AlertCircle size={16} className="text-[#27C93F] shrink-0" />
            <span>
              <strong className="text-white">Demo Environment:</strong> All people, records, transactions and activity are fictional and isolated within CDU tenant scope.
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCENARIO_CATALOGUE.map((scenario) => {
          const activeInstance = instances.find((i) => i.scenarioId === scenario.id);
          const isCompleted = activeInstance?.status === 'COMPLETED';
          const isInProgress = activeInstance && !isCompleted;
          const currentStep = activeInstance?.currentStep || 1;
          const isStarting = startingScenario === scenario.id;

          return (
            <div
              key={scenario.id}
              className="bg-white border border-[#DEE5EF] hover:border-[#1854E8]/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF3FF] flex items-center justify-center">
                      {getCategoryIcon(scenario.category)}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B7A]">
                      {scenario.category}
                    </span>
                  </div>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#078A57] bg-[#e6f4ed] px-2.5 py-0.5 rounded-full border border-[#078A57]/30">
                      <CheckCircle2 size={12} /> Completed
                    </span>
                  ) : isInProgress ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1854E8] bg-[#EEF3FF] px-2.5 py-0.5 rounded-full border border-[#C6D7FE]">
                      <Clock size={12} /> Step {currentStep} of {scenario.totalSteps}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#5F6B7A] bg-[#F5F7FB] px-2.5 py-0.5 rounded-full border border-[#DEE5EF]">
                      Not Started
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#101B33] mb-2 leading-snug">
                  {scenario.title}
                </h3>
                <p className="text-xs text-[#5F6B7A] leading-relaxed mb-5">
                  {scenario.purpose}
                </p>

                {/* Scenario Metadata */}
                <div className="space-y-2 mb-6 text-xs text-[#101B33] bg-[#F5F7FB] p-3 rounded-2xl border border-[#DEE5EF]">
                  <div className="flex justify-between">
                    <span className="text-[#5F6B7A] font-medium">Start as:</span>
                    <strong className="font-semibold">{scenario.startingPersona} ({scenario.startingRole.replace('_', ' ')})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B7A] font-medium">Participants:</span>
                    <strong className="font-semibold">{scenario.participatingRoles.join(' → ')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B7A] font-medium">Total Steps:</span>
                    <strong className="font-semibold">{scenario.totalSteps} Steps</strong>
                  </div>
                </div>
              </div>

              {/* Card Action Button */}
              {activeInstance ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/demo/scenarios/${scenario.id}?instanceId=${activeInstance.id}`}
                    className="flex-1 py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl transition-colors flex items-center justify-center shadow-sm"
                  >
                    {isCompleted ? 'Review Completed Scenario' : `Continue Step ${currentStep}`} <ArrowRight size={14} className="ml-1" />
                  </Link>

                  <button
                    onClick={() => handleStartScenario(scenario.id)}
                    disabled={isStarting}
                    className="p-2.5 rounded-xl border border-[#DEE5EF] text-[#5F6B7A] hover:bg-[#F5F7FB] transition-colors"
                    title="Restart Scenario"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleStartScenario(scenario.id)}
                  disabled={isStarting}
                  className="w-full py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                >
                  {isStarting ? 'Starting Scenario...' : 'Start Scenario'} <Play size={14} className="ml-1.5 fill-current" />
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
