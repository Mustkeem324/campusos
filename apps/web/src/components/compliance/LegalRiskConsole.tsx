'use client';

import React, { useState } from 'react';
import {
  Scale, FileText, AlertTriangle, Calendar, Shield, Clock,
  Search, DollarSign, CheckCircle, XCircle, Eye, Plus,
  ArrowRight, Filter, TrendingUp, Briefcase
} from 'lucide-react';

type LegalTab = 'contracts' | 'risk-register' | 'legal-cases' | 'compliance-cal' | 'sla-monitor' | 'insurance';

interface Contract {
  id: string;
  title: string;
  type: 'Vendor' | 'MOU' | 'Faculty' | 'Lease' | 'SLA' | 'NDA';
  party: string;
  value: number;
  startDate: string;
  endDate: string;
  renewalDate: string;
  status: 'Active' | 'Expired' | 'Under Review' | 'Draft' | 'Terminated';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  stage: string;
}

interface Risk {
  id: string;
  description: string;
  category: 'Financial' | 'Operational' | 'Legal' | 'Reputational' | 'Compliance';
  likelihood: number;
  impact: number;
  mitigation: string;
  owner: string;
  status: 'Open' | 'Mitigated' | 'Monitoring' | 'Closed';
}

const mockContracts: Contract[] = [];
const mockRisks: Risk[] = [];
const complianceCalendar: any[] = [];
const mockCases: any[] = [];
const mockSla: any[] = [];
const mockInsurance: any[] = [];

const riskColor = (score: number) => {
  if (score >= 20) return 'bg-red-800 text-white';
  if (score >= 15) return 'bg-red-500 text-white';
  if (score >= 10) return 'bg-orange-500 text-white';
  if (score >= 5) return 'bg-yellow-400 text-gray-900';
  return 'bg-green-400 text-gray-900';
};

export function LegalRiskConsole() {
  const [tab, setTab] = useState<LegalTab>('contracts');
  const [search, setSearch] = useState('');

  const tabs: { id: LegalTab; label: string; icon: React.ElementType }[] = [
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'risk-register', label: 'Risk Register', icon: AlertTriangle },
    { id: 'legal-cases', label: 'Legal Cases', icon: Scale },
    { id: 'compliance-cal', label: 'Compliance Calendar', icon: Calendar },
    { id: 'sla-monitor', label: 'SLA Monitor', icon: TrendingUp },
    { id: 'insurance', label: 'Insurance', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Scale size={22} className="text-indigo-500" />
            Legal, Risk & Contract Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Contracts, risk register, compliance & SLA monitoring</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition">
          <Plus size={14} /> New Contract
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Contracts', value: '24', sub: '₹3.2Cr total value', color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Open Risks', value: '7', sub: '2 high severity', color: 'text-red-600 dark:text-red-400' },
          { label: 'Compliance Tasks', value: '12', sub: '1 overdue', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'SLA Breaches', value: '1', sub: 'This month', color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
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

      {/* Contracts */}
      {tab === 'contracts' && (
        <div className="space-y-3">
          {mockContracts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No contracts found
            </div>
          ) : (
            mockContracts.map(c => (
              <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-indigo-500">{c.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : c.status === 'Expired' ? 'bg-red-100 text-red-700' : c.status === 'Under Review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.riskLevel === 'High' || c.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' : c.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.riskLevel} Risk</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{c.type}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">{c.title}</h3>
                    <p className="text-[11px] text-gray-500">{c.party}</p>
                  </div>
                  {c.value > 0 && <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">₹{(c.value / 100000).toFixed(1)}L</span>}
                </div>
                <div className="grid grid-cols-4 gap-3 mt-3 text-[11px]">
                  <div><span className="text-gray-400 block">Start</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.startDate}</span></div>
                  <div><span className="text-gray-400 block">End</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.endDate}</span></div>
                  <div><span className="text-gray-400 block">Renewal</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.renewalDate}</span></div>
                  <div><span className="text-gray-400 block">Stage</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.stage}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Risk Register */}
      {tab === 'risk-register' && (
        <div className="space-y-6">
          <div className="space-y-3">
            {mockRisks.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
                No risks registered
              </div>
            ) : (
              mockRisks.map(r => (
                <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-500">{r.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400`}>{r.category}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'Open' ? 'bg-red-100 text-red-700' : r.status === 'Mitigated' ? 'bg-emerald-100 text-emerald-700' : r.status === 'Monitoring' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white mt-1">{r.description}</p>
                      <p className="text-[11px] text-gray-500 mt-1"><strong>Mitigation:</strong> {r.mitigation}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Owner: {r.owner}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white font-extrabold ${riskColor(r.likelihood * r.impact)}`}>
                      <span className="text-lg">{r.likelihood * r.impact}</span>
                      <span className="text-[7px]">SCORE</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                    <span>Likelihood: {r.likelihood}/5</span>
                    <span>Impact: {r.impact}/5</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Risk Heat Map */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Risk Heat Map (Likelihood × Impact)</h3>
            <div className="flex items-end gap-1">
              <div className="text-[9px] font-bold text-gray-400 w-6 text-right mr-1 flex flex-col gap-1">
                {[5,4,3,2,1].map(l => <div key={l} className="h-10 flex items-center">{l}</div>)}
              </div>
              <div>
                <div className="grid grid-cols-5 gap-1">
                  {[5,4,3,2,1].map(likelihood => (
                    [1,2,3,4,5].map(impact => {
                      const score = likelihood * impact;
                      const count = mockRisks.filter(r => r.likelihood === likelihood && r.impact === impact).length;
                      return (
                        <div key={`${likelihood}-${impact}`} className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold ${riskColor(score)}`}>
                          {count > 0 ? count : ''}
                        </div>
                      );
                    })
                  ))}
                </div>
                <div className="flex gap-1 mt-1 ml-0">
                  {[1,2,3,4,5].map(i => <div key={i} className="w-10 text-center text-[9px] font-bold text-gray-400">{i}</div>)}
                </div>
                <p className="text-[9px] text-gray-400 text-center mt-1">Impact →</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal Cases */}
      {tab === 'legal-cases' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Case No.', 'Type', 'Subject', 'Court/Forum', 'Filed', 'Next Hearing', 'Status', 'Counsel'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {mockCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No legal cases found
                  </td>
                </tr>
              ) : (
                mockCases.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500">{c.caseNo}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{c.type}</span></td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white max-w-xs">{c.subject}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.court}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.filed}</td>
                    <td className="px-4 py-3 font-bold text-amber-600">{c.nextHearing}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : c.status === 'Active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</span></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.counsel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Compliance Calendar */}
      {tab === 'compliance-cal' && (
        <div className="space-y-3">
          {complianceCalendar.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No compliance tasks found
            </div>
          ) : (
            complianceCalendar.sort((a,b) => a.daysLeft - b.daysLeft).map((c, i) => (
              <div key={i} className={`p-4 rounded-2xl border shadow-sm ${c.daysLeft < 0 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : c.daysLeft < 15 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">{c.task}</h3>
                    <p className="text-[10px] text-gray-400">{c.authority} • Deadline: {c.deadline}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-extrabold ${c.daysLeft < 0 ? 'text-red-600' : c.daysLeft < 15 ? 'text-amber-600' : 'text-gray-600'}`}>
                      {c.daysLeft < 0 ? `${Math.abs(c.daysLeft)}d overdue` : `${c.daysLeft}d left`}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.status === 'Overdue' ? 'bg-red-100 text-red-700' : c.status === 'Due Soon' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{c.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SLA Monitor */}
      {tab === 'sla-monitor' && (
        <div className="space-y-3">
          {mockSla.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No SLA data recorded
            </div>
          ) : (
            mockSla.map((s, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-900 dark:text-white">{s.service}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${s.status === 'Compliant' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{s.status}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-2 text-[11px]">
                  <div><span className="text-gray-400 block">Target</span><span className="font-bold text-gray-700 dark:text-gray-300">{s.target}</span></div>
                  <div><span className="text-gray-400 block">Actual</span><span className={`font-bold ${s.status === 'Breach' ? 'text-red-600' : 'text-emerald-600'}`}>{s.actual}</span></div>
                  <div><span className="text-gray-400 block">Compliance</span><span className="font-bold text-gray-700 dark:text-gray-300">{s.compliance}%</span></div>
                  <div><span className="text-gray-400 block">Breaches</span><span className={`font-bold ${s.breaches > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{s.breaches}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Insurance */}
      {tab === 'insurance' && (
        <div className="space-y-3">
          {mockInsurance.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No insurance policies listed
            </div>
          ) : (
            mockInsurance.map((p, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white">{p.policy}</h3>
                    <p className="text-[10px] text-gray-500">{p.provider}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{p.status}</span>
                </div>
                <div className="grid grid-cols-4 gap-3 mt-2 text-[11px]">
                  <div><span className="text-gray-400 block">Coverage</span><span className="font-bold text-gray-700 dark:text-gray-300">{p.coverage}</span></div>
                  <div><span className="text-gray-400 block">Premium</span><span className="font-bold text-gray-700 dark:text-gray-300">{p.premium}</span></div>
                  <div><span className="text-gray-400 block">Expiry</span><span className="font-bold text-gray-700 dark:text-gray-300">{p.expiry}</span></div>
                  <div><span className="text-gray-400 block">Claims</span><span className="font-bold text-gray-700 dark:text-gray-300">{p.claims}</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
