'use client';

import React, { useEffect, useState } from 'react';
import {
  Database, ArrowRight, CheckCircle, XCircle, AlertTriangle,
  Search, Clock, Server, RefreshCw, Play, Pause, RotateCcw,
  FileText, Filter, Download, Upload, Zap, Activity, HardDrive
} from 'lucide-react';

import type {
  DataMigrationWorkspace,
  MigrationConnectorView,
  MigrationFieldMappingView,
  MigrationLogView,
  MigrationPipelineStageView,
  MigrationValidationView,
} from '@/lib/data-migration-workspace';

type MigrationTab = 'dashboard' | 'connectors' | 'pipeline' | 'field-mapping' | 'validation' | 'control-tower' | 'logs';

const sevColor = (s: string) => {
  switch(s) {
    case 'INFO': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    case 'WARN': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'ERROR': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    default: return '';
  }
};

export function DataMigrationConsole({ initialData }: { initialData: DataMigrationWorkspace }) {
  const [tab, setTab] = useState<MigrationTab>('dashboard');
  const [logFilter, setLogFilter] = useState<string>('all');
  const [data, setData] = useState(initialData);

  const reload = async () => {
    try {
      const response = await fetch('/api/data-migration/workspace', { cache: 'no-store' });
      if (response.ok) setData(await response.json());
    } catch { /* keep last safe snapshot */ }
  };

  useEffect(() => {
    const timer = window.setInterval(() => void reload(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const mockConnectors: MigrationConnectorView[] = data.connectors;
  const fieldMappings: MigrationFieldMappingView[] = data.fieldMappings;
  const validationResults: MigrationValidationView[] = data.validationResults;
  const mockLogs: MigrationLogView[] = data.logs;
  const pipelineStages: MigrationPipelineStageView[] = data.pipelineStages;
  const milestones = data.milestones;
  const overallProgress = data.overallProgress;

  const tabs: { id: MigrationTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'connectors', label: 'Connectors', icon: Server },
    { id: 'pipeline', label: 'Pipeline', icon: Zap },
    { id: 'field-mapping', label: 'Field Mapping', icon: ArrowRight },
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'control-tower', label: 'Control Tower', icon: HardDrive },
    { id: 'logs', label: 'Logs', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={22} className="text-indigo-500" />
            Data Migration Factory & Control Tower
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ETL pipelines, field mapping, validation & implementation tracking</p>
        </div>
        <button
          onClick={() => void reload()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
          aria-label="Refresh migration data"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Overall Migration Progress</h3>
              <span className="text-2xl font-extrabold text-indigo-600">{overallProgress}%</span>
            </div>
            <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Total Records', value: data.stats.totalRecords.toLocaleString(), color: 'text-gray-900 dark:text-white' },
                { label: 'Migrated', value: data.stats.migrated.toLocaleString(), color: 'text-emerald-600' },
                { label: 'Errors', value: data.stats.errors.toLocaleString(), color: 'text-red-600' },
                { label: 'Pending', value: data.stats.pending.toLocaleString(), color: 'text-amber-600' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
                  <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pipelineStages.map((stage, i) => {
              const progress = stage.status === 'Complete' ? 100 : stage.status === 'In Progress' ? 60 : 0;
              return (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{stage.name}</span>
                    <span className={`text-xs font-extrabold ${progress === 100 ? 'text-emerald-500' : progress === 0 ? 'text-gray-400' : 'text-amber-500'}`}>{stage.status}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : progress === 0 ? 'bg-gray-300 dark:bg-gray-600' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                  </div>
                  <span className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${progress === 100 ? 'bg-emerald-100 text-emerald-700' : progress === 0 ? 'bg-gray-100 text-gray-500 dark:bg-gray-800' : 'bg-amber-100 text-amber-700'}`}>
                    {stage.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Connectors */}
      {tab === 'connectors' && (
        <div className="space-y-3">
          {mockConnectors.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No connectors configured
            </div>
          ) : (
            mockConnectors.map(c => (
              <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.status === 'Connected' ? 'bg-emerald-100 dark:bg-emerald-900/30' : c.status === 'Error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Server size={18} className={c.status === 'Connected' ? 'text-emerald-600' : c.status === 'Error' ? 'text-red-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">{c.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.status === 'Connected' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : c.status === 'Error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-400">
                    <span>Type: {c.type}</span>
                    <span>Last Sync: {c.lastSync}</span>
                    <span>{c.records.toLocaleString()} records</span>
                    <span>{c.tables} tables</span>
                  </div>
                </div>
                <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><RefreshCw size={16} /></button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pipeline */}
      {tab === 'pipeline' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-6">ETL Pipeline Monitor</h3>
          <div className="flex items-start gap-4 overflow-x-auto">
            {pipelineStages.length === 0 ? (
              <div className="w-full p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                No pipeline stages configured
              </div>
            ) : (
              pipelineStages.map((s, i) => (
                <React.Fragment key={i}>
                  <div className={`min-w-[180px] p-4 rounded-2xl border-2 ${s.status === 'Complete' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' : s.status === 'In Progress' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white">{s.name}</p>
                      {s.status === 'Complete' && <CheckCircle size={14} className="text-emerald-500" />}
                      {s.status === 'In Progress' && <RefreshCw size={14} className="text-indigo-500 animate-spin" />}
                      {s.status === 'Pending' && <Clock size={14} className="text-gray-400" />}
                    </div>
                    <div className="mt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between"><span className="text-gray-400">Records</span><span className="font-bold text-gray-700 dark:text-gray-300">{s.records.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Errors</span><span className={`font-bold ${s.errors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{s.errors.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Throughput</span><span className="font-bold text-gray-700 dark:text-gray-300">{s.throughput}</span></div>
                    </div>
                  </div>
                  {i < pipelineStages.length - 1 && <ArrowRight size={20} className="text-gray-300 mt-8 shrink-0" />}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      )}

      {/* Field Mapping */}
      {tab === 'field-mapping' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Source Field', 'Target Field', 'Data Type', 'Transform', 'Sample', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {fieldMappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No field mappings found
                  </td>
                </tr>
              ) : (
                fieldMappings.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500">{f.source}</td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{f.target}</td>
                    <td className="px-4 py-3 text-gray-500">{f.dataType}</td>
                    <td className="px-4 py-3 text-gray-500">{f.transform}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-gray-500 max-w-[200px] truncate">{f.sample}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${f.status === 'Mapped' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{f.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Validation */}
      {tab === 'validation' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Entity', 'Total', 'Valid', 'Duplicates', 'Missing Fields', 'Anomalies', 'Quality Score'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {validationResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No validation results available
                  </td>
                </tr>
              ) : (
                validationResults.map((v, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{v.entity}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.total.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{v.valid.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`font-bold ${v.duplicates > 100 ? 'text-amber-600' : 'text-gray-500'}`}>{v.duplicates}</span></td>
                    <td className="px-4 py-3"><span className={`font-bold ${v.missing > 100 ? 'text-red-600' : 'text-gray-500'}`}>{v.missing}</span></td>
                    <td className="px-4 py-3"><span className={`font-bold ${v.anomalies > 50 ? 'text-red-600' : 'text-gray-500'}`}>{v.anomalies}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div className={`h-full rounded-full ${v.quality >= 99 ? 'bg-emerald-500' : v.quality >= 98 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${v.quality}%` }} />
                        </div>
                        <span className="font-extrabold text-gray-900 dark:text-white">{v.quality}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Control Tower */}
      {tab === 'control-tower' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Implementation Timeline</h3>
            <div className="space-y-3">
              {milestones.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-xs py-4">
                  No milestones defined
                </div>
              ) : (
                milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-40 text-right truncate">{m.phase}</span>
                    <div className="flex-1 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      <div
                        className={`absolute top-0 h-full rounded-lg ${m.status === 'Complete' ? 'bg-emerald-500' : m.status === 'In Progress' ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                        style={{ left: `${m.start}%`, width: `${m.end - m.start}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700 dark:text-gray-300 z-10">{m.phase}</span>
                    </div>
                    <span className={`text-[9px] font-bold w-20 ${m.status === 'Complete' ? 'text-emerald-500' : m.status === 'In Progress' ? 'text-indigo-500' : 'text-gray-400'}`}>{m.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-3">Go/No-Go Decision Gates</h3>
              {data.decisionGates.map((g, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-xs text-gray-700 dark:text-gray-300">{g.gate}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{g.date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${g.status === 'Go' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>{g.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mb-3">Backup & Recovery</h3>
              {[
                { snapshot: 'Pre-Migration Baseline', date: 'Prepared before first dry run', size: 'Managed', checksum: 'Verified' },
                { snapshot: 'Post Dry-Run', date: 'After each validation cycle', size: 'Managed', checksum: 'Verified' },
                { snapshot: 'Go-Live Snapshot', date: 'Taken at cutover', size: 'Managed', checksum: 'Verified' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{s.snapshot}</p>
                    <p className="text-[10px] text-gray-400">{s.date} • {s.size}</p>
                  </div>
                  <button className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-200 transition">
                    <RotateCcw size={10} className="inline mr-1" />Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {['all', 'INFO', 'WARN', 'ERROR'].map(f => (
              <button key={f} onClick={() => setLogFilter(f)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${logFilter === f ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-950 p-4 font-mono text-xs space-y-1 max-h-[500px] overflow-y-auto">
            {mockLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No logs available
              </div>
            ) : (
              mockLogs.filter(l => logFilter === 'all' || l.severity === logFilter).map(l => (
                <div key={l.id} className="flex gap-2 leading-relaxed">
                  <span className="text-gray-500 shrink-0">{l.timestamp}</span>
                  <span className={`px-1.5 py-0 rounded text-[9px] font-bold shrink-0 ${sevColor(l.severity)}`}>{l.severity}</span>
                  <span className="text-indigo-400 shrink-0">[{l.source}]</span>
                  <span className="text-gray-300">{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
