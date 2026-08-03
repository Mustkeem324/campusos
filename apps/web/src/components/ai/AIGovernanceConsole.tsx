'use client';

import React, { useState } from 'react';
import {
  Brain, Activity, Shield, Eye, FileText, GitBranch,
  AlertTriangle, Cpu, TrendingUp, TrendingDown,
  CheckCircle,
} from 'lucide-react';

type AIGovTab = 'model-registry' | 'performance' | 'ethics-bias' | 'explainability' | 'policies' | 'lifecycle' | 'incidents';

interface AIModel {
  id: string;
  name: string;
  version: string;
  type: string;
  framework: string;
  deploymentStatus: 'Production' | 'Staging' | 'Development' | 'Retired';
  accuracy: number;
  f1Score: number;
  lastTrained: string;
  predictions: number;
  driftDetected: boolean;
}

const mockModels: AIModel[] = [
  { id: 'MOD-001', name: 'CampusOS Native Engine', version: 'v1.4', type: 'RAG & Assistant', framework: 'TypeScript / Node', deploymentStatus: 'Production', accuracy: 98.4, f1Score: 0.97, lastTrained: '2026-08-01', predictions: 124500, driftDetected: false },
  { id: 'MOD-002', name: 'OpenAI GPT-4o Enterprise', version: '2024-08-06', type: 'LLM Reasoning', framework: 'API Integration', deploymentStatus: 'Production', accuracy: 99.1, f1Score: 0.98, lastTrained: '2026-08-02', predictions: 89200, driftDetected: false },
  { id: 'MOD-003', name: 'Student Retention Dropout Classifier', version: 'v2.1', type: 'Gradient Boosting', framework: 'Scikit-Learn', deploymentStatus: 'Production', accuracy: 94.8, f1Score: 0.93, lastTrained: '2026-07-28', predictions: 45000, driftDetected: false },
  { id: 'MOD-004', name: 'Timetable CSP Optimization Engine', version: 'v3.0', type: 'Constraint Solver', framework: 'Python OR-Tools', deploymentStatus: 'Production', accuracy: 99.8, f1Score: 0.99, lastTrained: '2026-07-15', predictions: 12000, driftDetected: false }
];
const biasMetrics: any[] = [];
const incidents: any[] = [];

const lifecycleStages = ['Data Collection', 'Preprocessing', 'Training', 'Validation', 'Staging', 'Production', 'Monitoring', 'Retraining'];

function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    Production: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Staging: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Retired: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    Development: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Fair: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Draft: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${colors[status] || 'bg-gray-100 text-gray-500'} ${className}`}>
      {status}
    </span>
  );
}

/** Responsive model card for mobile (<768px) */
function ModelCard({ model }: { model: AIModel }) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{model.name}</p>
          <p className="text-[10px] font-mono text-gray-400">{model.id} · {model.version}</p>
        </div>
        <StatusBadge status={model.deploymentStatus} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Type</p>
          <p className="text-gray-700 dark:text-gray-300">{model.type}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Framework</p>
          <p className="text-gray-700 dark:text-gray-300">{model.framework}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Accuracy</p>
          <p className="font-bold text-gray-900 dark:text-white">{model.accuracy}%</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">F1 Score</p>
          <p className="font-bold text-gray-700 dark:text-gray-300">{model.f1Score}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Last Trained</p>
          <p className="text-gray-500">{model.lastTrained}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Predictions</p>
          <p className="text-gray-600 dark:text-gray-400">{model.predictions > 0 ? `${(model.predictions / 1000).toFixed(1)}K` : '—'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Drift</span>
        {model.driftDetected
          ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-0.5 w-fit"><AlertTriangle size={8} /> Detected</span>
          : <span className="text-[10px] text-emerald-500 font-bold">OK</span>
        }
      </div>
    </div>
  );
}

export function AIGovernanceConsole() {
  const [tab, setTab] = useState<AIGovTab>('model-registry');

  const tabs: { id: AIGovTab; label: string; icon: React.ElementType }[] = [
    { id: 'model-registry', label: 'Model Registry', icon: Cpu },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'ethics-bias', label: 'Ethics & Bias', icon: Shield },
    { id: 'explainability', label: 'Explainability', icon: Eye },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'lifecycle', label: 'Lifecycle', icon: GitBranch },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
          <Brain size={22} className="text-indigo-500 shrink-0" aria-hidden="true" />
          AI Governance & Model Operations
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Model registry, bias auditing, explainability & AI policy management</p>
      </div>

      {/* Stats — 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Key metrics">
        {[
          { label: 'Models in Production', value: '—', sub: 'No telemetry available', color: 'text-gray-400' },
          { label: 'Total Predictions', value: '—', sub: 'No telemetry available', color: 'text-gray-400' },
          { label: 'Avg Accuracy', value: '—', sub: 'No telemetry available', color: 'text-gray-400' },
          { label: 'Open Incidents', value: '—', sub: 'No telemetry available', color: 'text-gray-400' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm" role="listitem">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs — horizontally scrollable, with keyboard support */}
      <div
        className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto sidebar-nav-scroll"
        role="tablist"
        aria-label="AI Governance sections"
      >
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${t.id}`}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={14} aria-hidden="true" />{t.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Panels ─── */}

      {/* Model Registry */}
      {tab === 'model-registry' && (
        <div id="tabpanel-model-registry" role="tabpanel" aria-label="Model Registry">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-xs min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Model', 'Version', 'Type', 'Framework', 'Status', 'Accuracy', 'F1', 'Last Trained', 'Predictions', 'Drift'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {mockModels.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No production telemetry available
                    </td>
                  </tr>
                ) : (
                  mockModels.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-3 py-3">
                        <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                        <p className="text-[9px] font-mono text-gray-400">{m.id}</p>
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-indigo-500">{m.version}</td>
                      <td className="px-3 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{m.type}</span></td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{m.framework}</td>
                      <td className="px-3 py-3"><StatusBadge status={m.deploymentStatus} /></td>
                      <td className="px-3 py-3 font-bold text-gray-900 dark:text-white">{m.accuracy}%</td>
                      <td className="px-3 py-3 font-bold text-gray-600 dark:text-gray-400">{m.f1Score}</td>
                      <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{m.lastTrained}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">{m.predictions > 0 ? `${(m.predictions / 1000).toFixed(1)}K` : '—'}</td>
                      <td className="px-3 py-3">
                        {m.driftDetected
                          ? <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-0.5 w-fit"><AlertTriangle size={8} /> Drift</span>
                          : <span className="text-[9px] text-emerald-500 font-bold">OK</span>
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {mockModels.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
                No production telemetry available
              </div>
            ) : (
              mockModels.map(m => <ModelCard key={m.id} model={m} />)
            )}
          </div>
        </div>
      )}

      {/* Performance */}
      {tab === 'performance' && (
        <div id="tabpanel-performance" role="tabpanel" aria-label="Performance" className="space-y-4">
          {mockModels.filter(m => m.deploymentStatus === 'Production').length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No production telemetry available
            </div>
          ) : (
            mockModels.filter(m => m.deploymentStatus === 'Production').map(m => (
            <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{m.name}</h3>
                  <p className="text-[10px] text-gray-400">{m.type} · {m.framework} · {m.version}</p>
                </div>
                {m.driftDetected && (
                  <span className="px-2 py-1 rounded-xl text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 shrink-0">
                    <AlertTriangle size={12} /> Data Drift Detected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { metric: 'Accuracy', value: m.accuracy, trend: 'up' as const, delta: '+0.3%' },
                  { metric: 'Precision', value: (m.accuracy - 1.2).toFixed(1), trend: 'up' as const, delta: '+0.1%' },
                  { metric: 'Recall', value: (m.accuracy - 0.8).toFixed(1), trend: 'down' as const, delta: '-0.2%' },
                  { metric: 'F1 Score', value: m.f1Score, trend: 'up' as const, delta: '+0.01' },
                  { metric: 'AUC-ROC', value: (m.f1Score + 0.04).toFixed(2), trend: 'up' as const, delta: '+0.02' },
                ].map((met, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{met.metric}</p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">{met.value}{typeof met.value === 'number' && '%'}</p>
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {met.trend === 'up' ? <TrendingUp size={10} className="text-emerald-500" /> : <TrendingDown size={10} className="text-red-500" />}
                      <span className={`text-[9px] font-bold ${met.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>{met.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )))}
        </div>
      )}

      {/* Ethics & Bias */}
      {tab === 'ethics-bias' && (
        <div id="tabpanel-ethics-bias" role="tabpanel" aria-label="Ethics and Bias">
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-xs min-w-[700px]">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {['Model', 'Demographic Group', 'Group A', 'Group B', 'Group C', 'Bias Score', 'Assessment'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {biasMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No bias audits recorded
                    </td>
                  </tr>
                ) : (
                  biasMetrics.map((b, i) => {
                    const vals = [Object.values(b)[2], Object.values(b)[3], Object.values(b)[4]] as number[];
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{b.model}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{b.group}</span></td>
                        <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{vals[0]}%</td>
                        <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{vals[1]}%</td>
                        <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300">{vals[2]}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                              <div className={`h-full rounded-full ${b.biasScore > 0.07 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(b.biasScore * 100 * 10, 100)}%` }} />
                            </div>
                            <span className="font-bold text-gray-700 dark:text-gray-300">{b.biasScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {biasMetrics.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
                No bias audits recorded
              </div>
            ) : (
              biasMetrics.map((b, i) => {
                const vals = [Object.values(b)[2], Object.values(b)[3], Object.values(b)[4]] as number[];
                return (
                  <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{b.model}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{b.group}</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div><p className="text-[10px] text-gray-400">Group A</p><p className="font-bold">{vals[0]}%</p></div>
                      <div><p className="text-[10px] text-gray-400">Group B</p><p className="font-bold">{vals[1]}%</p></div>
                      <div><p className="text-[10px] text-gray-400">Group C</p><p className="font-bold">{vals[2]}%</p></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 font-bold">Bias:</span>
                      <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className={`h-full rounded-full ${b.biasScore > 0.07 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(b.biasScore * 100 * 10, 100)}%` }} />
                      </div>
                      <span className="font-bold">{b.biasScore}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Explainability */}
      {tab === 'explainability' && (
        <div id="tabpanel-explainability" role="tabpanel" aria-label="Explainability" className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Feature Importance — Student Retention Predictor</h3>
            {[
              { feature: 'Attendance Percentage', importance: 0.28, direction: 'positive' },
              { feature: 'CGPA (Last Semester)', importance: 0.22, direction: 'positive' },
              { feature: 'Fee Payment Regularity', importance: 0.18, direction: 'positive' },
              { feature: 'Library Usage Frequency', importance: 0.12, direction: 'positive' },
              { feature: 'Assignment Submission Rate', importance: 0.10, direction: 'positive' },
              { feature: 'Distance from Campus', importance: 0.05, direction: 'negative' },
              { feature: 'Hostel vs Day Scholar', importance: 0.03, direction: 'neutral' },
              { feature: 'Extracurricular Score', importance: 0.02, direction: 'positive' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-32 sm:w-48 text-right truncate shrink-0">{f.feature}</span>
                <div className="flex-1 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden min-w-0">
                  <div
                    className={`h-full rounded-lg flex items-center justify-end pr-2 text-[9px] font-bold text-white ${
                      f.direction === 'positive' ? 'bg-indigo-500' : f.direction === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${f.importance * 100 * 3.5}%`, minWidth: '30px' }}
                  >
                    {(f.importance * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Sample Decision Audit Trail</h3>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-2 text-[11px]">
              {[
                { label: 'Student', value: 'Rahul Verma (STU-2024-1205)' },
                { label: 'Model', value: 'Student Retention Predictor v3.2' },
                { label: 'Prediction', value: 'At Risk (78% probability)' },
                { label: 'Top Factor', value: 'Attendance dropped below 60% (SHAP: +0.32)' },
                { label: 'Second Factor', value: 'Fee payment delayed 45 days (SHAP: +0.18)' },
                { label: 'Mitigating Factor', value: 'CGPA 3.5 (above average) (SHAP: -0.15)' },
                { label: 'Action Taken', value: 'Mentor assigned + Scholarship counseling' },
                { label: 'Timestamp', value: '2026-08-01 14:32:18 IST' },
              ].map((r, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                  <span className="text-gray-500 shrink-0">{r.label}</span>
                  <span className="font-bold text-gray-900 dark:text-white sm:text-right sm:max-w-[60%]">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Policies */}
      {tab === 'policies' && (
        <div id="tabpanel-policies" role="tabpanel" aria-label="Policies" className="space-y-3">
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
            No published AI policies available
          </div>
        </div>
      )}

      {/* Lifecycle */}
      {tab === 'lifecycle' && (
        <div id="tabpanel-lifecycle" role="tabpanel" aria-label="Lifecycle" className="space-y-4">
          {mockModels.filter(m => m.deploymentStatus !== 'Retired').length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No active AI models found
            </div>
          ) : (
            mockModels.filter(m => m.deploymentStatus !== 'Retired').map(m => {
              const stageIndex = m.deploymentStatus === 'Production' ? 5 : m.deploymentStatus === 'Staging' ? 4 : 2;
              return (
                <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-3">{m.name} <span className="text-indigo-500 font-mono">{m.version}</span></h3>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
                    {lifecycleStages.map((s, idx) => (
                      <React.Fragment key={s}>
                        <div className={`shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                          idx < stageIndex ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' :
                          idx === stageIndex ? 'bg-indigo-600 text-white' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                        }`}>
                          {s}
                        </div>
                        {idx < lifecycleStages.length - 1 && (
                          <div className={`w-4 h-[2px] shrink-0 ${idx < stageIndex ? 'bg-emerald-200 dark:bg-emerald-900/50' : 'bg-gray-200 dark:bg-gray-800'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Incidents */}
      {tab === 'incidents' && (
        <div id="tabpanel-incidents" role="tabpanel" aria-label="Incidents" className="space-y-3">
          {incidents.map(inc => (
            <div key={inc.id} className={`p-4 rounded-2xl border shadow-sm ${inc.status === 'Open' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold text-indigo-500">{inc.id}</span>
                <StatusBadge status={inc.severity} />
                <StatusBadge status={inc.status} />
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{inc.type}</span>
              </div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white mt-1">{inc.model}</h3>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{inc.description}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2 text-[10px] text-gray-400">
                <span>Date: {inc.date}</span>
                <span>Resolution: {inc.resolution}</span>
              </div>
            </div>
          ))}

          {/* Resource Consumption */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm mt-6">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">AI Resource Consumption</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'GPU Utilization', value: '68%', budget: '80%' },
                { label: 'Avg Inference Latency', value: '42ms', budget: '< 100ms' },
                { label: 'Monthly Compute Cost', value: '₹1.8L', budget: '₹2.5L' },
                { label: 'Cost per 1K Predictions', value: '₹52', budget: '₹75' },
              ].map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{r.label}</p>
                  <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">{r.value}</p>
                  <p className="text-[9px] text-gray-400">Budget: {r.budget}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
