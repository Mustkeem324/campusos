'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  UserCheck, 
  ShieldCheck, 
  Info, 
  Play, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Layers,
  LogOut
} from 'lucide-react';
import { SCENARIO_CATALOGUE, DemoScenarioDefinition, DemoStepDefinition } from '../../lib/demo/scenarios';
import { useAuthStore } from '../../lib/auth-store';

interface ScenarioWorkspaceConsoleProps {
  scenarioId: string;
}

export function ScenarioWorkspaceConsole({ scenarioId }: ScenarioWorkspaceConsoleProps) {
  const searchParams = useSearchParams();
  const instanceIdParam = searchParams.get('instanceId');
  const router = useRouter();

  const { currentSession, setSession } = useAuthStore();
  const [scenario, setScenario] = useState<DemoScenarioDefinition | null>(null);
  const [instance, setInstance] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [whatChanged, setWhatChanged] = useState<any | null>(null);

  useEffect(() => {
    const sc = SCENARIO_CATALOGUE.find((s) => s.id === scenarioId);
    if (sc) setScenario(sc);

    if (instanceIdParam) {
      fetch(`/api/demo/scenarios/instances/${instanceIdParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.instance) setInstance(data.instance);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      // Auto-start if no instanceId in query
      fetch(`/api/demo/scenarios/${scenarioId}/start`, { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.instance) setInstance(data.instance);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [scenarioId, instanceIdParam]);

  if (loading || !scenario || !instance) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-3xl border border-[#DEE5EF] p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1854E8] flex items-center justify-center text-white font-extrabold text-xl animate-bounce">
            C
          </div>
          <span className="text-xs font-mono font-bold text-[#5F6B7A]">Loading Scenario Workspace...</span>
        </div>
      </div>
    );
  }

  const currentStepNumber = instance.currentStep || 1;
  const currentStepDef: DemoStepDefinition | undefined = scenario.steps.find((s) => s.stepNumber === currentStepNumber);
  const isCompleted = instance.status === 'COMPLETED';

  const handleExecuteStep = async () => {
    if (!currentStepDef || executing) return;
    setExecuting(true);
    setWhatChanged(null);

    try {
      const res = await fetch(`/api/demo/scenarios/instances/${instance.id}/steps/${currentStepNumber}/execute`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute step');

      setInstance(data.instance);
      setWhatChanged(data.whatChanged);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleSwitchRole = async (targetPersona: 'ADMIN' | 'FACULTY' | 'STUDENT' | 'PARENT') => {
    setSwitchingRole(true);
    try {
      const res = await fetch(`/api/demo/scenarios/instances/${instance.id}/switch-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPersona }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch demo role');

      setSession(data.user);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setSwitchingRole(false);
    }
  };

  const handleResetScenario = async () => {
    if (!confirm('This will restore the fictional records for this scenario. Continue?')) return;
    try {
      const res = await fetch(`/api/demo/scenarios/instances/${instance.id}/reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset scenario');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const activePersonaRole = currentSession?.role || 'STUDENT';
  const requiresRoleSwitch = currentStepDef && currentStepDef.role !== activePersonaRole;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Header Bar */}
      <div className="bg-[#101B33] text-white rounded-3xl p-6 border border-[#2A3B5C] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold text-[#A5D6FF] bg-[#1854E8]/20 px-2.5 py-0.5 rounded border border-[#1854E8]/30 uppercase tracking-wider">
              {scenario.category} Scenario
            </span>
            <span className="text-[11px] font-semibold text-[#BEC7D7]">
              Step {currentStepNumber} of {scenario.totalSteps}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{scenario.title}</h1>
          <p className="text-xs text-[#BEC7D7] mt-1">{scenario.purpose}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetScenario}
            className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#182642] hover:bg-[#2A3B5C] border border-[#2A3B5C] text-[#BEC7D7] transition-colors"
          >
            <RotateCcw size={14} /> Reset Scenario
          </button>

          <Link
            href="/demo/scenarios"
            className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl bg-white text-[#101B33] hover:bg-[#DEE5EF] transition-colors"
          >
            Exit Scenario
          </Link>
        </div>
      </div>

      {/* 3-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: STEPPER (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#DEE5EF] p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-[#101B33] pb-3 border-b border-[#DEE5EF]">
            Workflow Stepper
          </h3>

          <div className="space-y-3">
            {scenario.steps.map((step) => {
              const isDone = step.stepNumber < currentStepNumber || isCompleted;
              const isCurrent = step.stepNumber === currentStepNumber && !isCompleted;
              const isLocked = step.stepNumber > currentStepNumber && !isCompleted;

              return (
                <div
                  key={step.stepNumber}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-[#EEF3FF] border-[#1854E8] text-[#101B33]'
                      : isDone
                      ? 'bg-[#e6f4ed]/50 border-[#078A57]/30 text-[#101B33]'
                      : 'bg-[#F5F7FB] border-[#DEE5EF] text-[#5F6B7A]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1854E8]">
                      Step {step.stepNumber} • {step.role.replace('_', ' ')}
                    </span>
                    {isDone ? (
                      <span className="text-[#078A57] font-bold text-xs flex items-center gap-1"><CheckCircle2 size={14} /> Done</span>
                    ) : isCurrent ? (
                      <span className="text-[#1854E8] font-bold text-xs flex items-center gap-1"><Clock size={14} /> Active</span>
                    ) : (
                      <span className="text-[#5F6B7A] font-semibold text-xs">Locked</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold mb-1">{step.title}</h4>
                  <p className="text-xs leading-relaxed opacity-80">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN COLUMN: ACTIVE TASK (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#DEE5EF] p-6 shadow-sm space-y-6">
          {isCompleted ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#e6f4ed] text-[#078A57] flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#101B33]">Scenario Completed Successfully!</h2>
              <p className="text-xs text-[#5F6B7A] leading-relaxed max-w-md mx-auto">
                You experienced the complete multi-role workflow from start to finish. All records were updated atomically across Student, Faculty, Parent, and Admin views.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleResetScenario}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1854E8] text-white hover:bg-[#1140B8]"
                >
                  Restart Scenario
                </button>
                <Link
                  href="/demo/scenarios"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[#DEE5EF] text-[#101B33] hover:bg-[#F5F7FB]"
                >
                  Explore Other Scenarios
                </Link>
              </div>
            </div>
          ) : currentStepDef ? (
            <>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#1854E8] uppercase tracking-wider mb-2">
                  <Sparkles size={16} /> Active Task • Step {currentStepNumber}
                </div>
                <h2 className="text-xl font-bold text-[#101B33] mb-2">{currentStepDef.title}</h2>
                <p className="text-sm text-[#5F6B7A] leading-relaxed mb-4">{currentStepDef.description}</p>

                <div className="p-4 bg-[#F5F7FB] rounded-2xl border border-[#DEE5EF] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#5F6B7A]">Required Persona:</span>
                    <strong className="text-[#101B33]">{currentStepDef.actorPersona} ({currentStepDef.role.replace('_', ' ')})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B7A]">Target Module:</span>
                    <strong className="text-[#1854E8]">{currentStepDef.module}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5F6B7A]">Expected Outcome:</span>
                    <strong className="text-[#078A57]">{currentStepDef.expectedResult}</strong>
                  </div>
                </div>
              </div>

              {/* Action Handler or Role Switch Warning */}
              {requiresRoleSwitch ? (
                <div className="p-4 bg-[#EEF3FF] border border-[#C6D7FE] rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-[#101B33]">
                    <AlertCircle size={18} className="text-[#1854E8] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Role Change Required:</strong> Step {currentStepNumber} requires acting as <strong className="text-[#1854E8]">{currentStepDef.actorPersona} ({currentStepDef.role.replace('_', ' ')})</strong>.
                    </div>
                  </div>
                  <button
                    onClick={() => handleSwitchRole(currentStepDef.role === 'INSTITUTION_ADMIN' ? 'ADMIN' : currentStepDef.role as any)}
                    disabled={switchingRole}
                    className="w-full py-2.5 px-4 text-xs font-bold bg-[#1854E8] hover:bg-[#1140B8] text-white rounded-xl shadow-sm transition-colors flex items-center justify-center"
                  >
                    {switchingRole ? 'Switching Session...' : `Switch to ${currentStepDef.actorPersona} and Continue`}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleExecuteStep}
                  disabled={executing}
                  className="w-full py-3 px-4 text-xs font-bold bg-[#078A57] hover:bg-[#067449] text-white rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {executing ? 'Executing Step & Updating Records...' : `Execute Step ${currentStepNumber} & Update CampusOS`} <Play size={15} className="fill-current" />
                </button>
              )}

              {/* What Changed Panel */}
              {whatChanged && (
                <div className="p-4 bg-[#e6f4ed] border border-[#078A57]/30 rounded-2xl space-y-2 text-xs text-[#101B33]">
                  <div className="flex items-center gap-2 font-bold text-[#078A57] text-sm">
                    <CheckCircle2 size={16} /> What Changed in CampusOS:
                  </div>
                  <p className="font-medium">{whatChanged.status}</p>
                  <p className="text-[#5F6B7A] italic">Reason: {whatChanged.permissionReason}</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* RIGHT COLUMN: PERMISSIONS & TIMELINE (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Why This User Can See It */}
          <div className="bg-white rounded-3xl border border-[#DEE5EF] p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1854E8] flex items-center gap-1.5">
              <ShieldCheck size={16} /> Authorization Rules
            </h4>
            <p className="text-xs text-[#5F6B7A] leading-relaxed">
              {currentStepDef?.explanation || 'CampusOS strictly enforces server-side Row-Level Security (RLS) and relationship scoping for every API query.'}
            </p>
          </div>

          {/* Real Audit Event Timeline */}
          <div className="bg-white rounded-3xl border border-[#DEE5EF] p-5 shadow-sm space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#101B33] flex items-center gap-1.5">
              <Clock size={16} /> Audit Event Log
            </h4>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {instance.events && instance.events.length > 0 ? (
                instance.events.map((ev: any) => (
                  <div key={ev.id} className="p-3 bg-[#F5F7FB] rounded-xl border border-[#DEE5EF] text-[11px] space-y-1">
                    <div className="flex justify-between font-bold text-[#101B33]">
                      <span>{ev.actorPersona}</span>
                      <span className="text-[#1854E8]">{ev.actorRole.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[#5F6B7A]">{ev.result}</p>
                    <div className="text-[10px] text-[#5F6B7A] text-right font-mono">
                      {new Date(ev.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-[#5F6B7A] italic text-center py-4">No events logged yet.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
