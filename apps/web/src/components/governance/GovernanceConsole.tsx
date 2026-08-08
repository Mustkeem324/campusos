'use client';

import React, { useEffect, useState } from 'react';
import {
  Users, Calendar, FileText, Shield, GitBranch, ClipboardList,
  CheckCircle, XCircle, AlertTriangle, ChevronRight,
  Plus, Search, Filter, Eye, Download, Vote, Gavel,
  Building2, UserCheck, Lock, Hash, RefreshCw
} from 'lucide-react';

import type {
  GovernanceAuditView,
  GovernanceCommitteeView,
  GovernanceDelegationView,
  GovernanceMeetingView,
  GovernancePolicyView,
  GovernanceResolutionView,
  GovernanceWorkspace,
} from '@/lib/governance-workspace';

type GovTab = 'committees' | 'meetings' | 'resolutions' | 'policies' | 'delegation' | 'audit';

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    'Active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Reconstitution Due': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Dissolved': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Scheduled': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Progress': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Proposed': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    'Discussed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Voted': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Published': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Archived': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  };
  return map[s] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
};

export function GovernanceConsole({ initialData }: { initialData: GovernanceWorkspace }) {
  const [tab, setTab] = useState<GovTab>('committees');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(initialData);

  const reload = async () => {
    try {
      const response = await fetch('/api/governance/workspace', { cache: 'no-store' });
      if (response.ok) setData(await response.json());
    } catch { /* keep last safe snapshot */ }
  };

  useEffect(() => {
    const timer = window.setInterval(() => void reload(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const committees = data.committees;
  const meetings = data.meetings;
  const resolutions = data.resolutions;
  const policies = data.policies;
  const delegationMatrix: GovernanceDelegationView[] = data.delegations;
  const mockAuditLog = data.auditLogs;

  const tabs: { id: GovTab; label: string; icon: React.ElementType }[] = [
    { id: 'committees', label: 'Committees', icon: Users },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    { id: 'resolutions', label: 'Resolutions', icon: Gavel },
    { id: 'policies', label: 'Policies', icon: FileText },
    { id: 'delegation', label: 'Delegation', icon: GitBranch },
    { id: 'audit', label: 'Audit Trail', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={22} className="text-indigo-500" />
            Institutional Governance & Committees
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Board meetings, resolutions, policy management & delegation authority
          </p>
        </div>
        <button
          onClick={() => void reload()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
          aria-label="Refresh governance data"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Committees', value: String(data.stats.activeCommittees), sub: `${data.stats.reconstitutionDue} due for reconstitution`, color: 'indigo' },
          { label: 'Meetings This Quarter', value: String(data.stats.meetingsThisQuarter), sub: `${data.stats.upcomingMeetings} upcoming`, color: 'emerald' },
          { label: 'Pending Resolutions', value: String(data.stats.pendingResolutions), sub: `${data.stats.awaitingVote} awaiting vote`, color: 'amber' },
          { label: 'Active Policies', value: String(data.stats.activePolicies), sub: `${data.stats.underReviewPolicies} under review`, color: 'purple' },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{s.label}</p>
            <p className={`text-2xl font-extrabold mt-1 text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === t.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}

        <div className="ml-auto flex items-center gap-2 px-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {tab === 'committees' && (
        <div className="space-y-3">
          {committees.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No committees found
            </div>
          ) : (
            committees.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(c => (
              <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{c.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(c.status)}`}>{c.status}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{c.type}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-[11px]">
                      <div>
                        <span className="text-gray-400 block">Chairperson</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{c.chairperson}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Secretary</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{c.secretary}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Members</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{c.members} members</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Term</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{c.termStart} → {c.termEnd}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                      <span>Last Meeting: {c.lastMeeting}</span>
                      <span>Next Meeting: {c.nextMeeting}</span>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'meetings' && (
        <div className="space-y-3">
          {meetings.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No meetings scheduled
            </div>
          ) : (
            meetings.filter(m => m.title.toLowerCase().includes(search.toLowerCase())).map(m => (
              <div key={m.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold text-indigo-500">{m.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(m.status)}`}>{m.status}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(m.minutesStatus)}`}>Minutes: {m.minutesStatus}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">{m.title}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">{m.committee}</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-[11px]">
                      <div><span className="text-gray-400 block">Date & Time</span><span className="font-bold text-gray-700 dark:text-gray-300">{m.date} {m.time}</span></div>
                      <div><span className="text-gray-400 block">Venue</span><span className="font-bold text-gray-700 dark:text-gray-300">{m.venue}</span></div>
                      <div><span className="text-gray-400 block">Mode</span><span className="font-bold text-gray-700 dark:text-gray-300">{m.type}</span></div>
                      <div><span className="text-gray-400 block">Agenda Items</span><span className="font-bold text-gray-700 dark:text-gray-300">{m.agendaItems}</span></div>
                      <div>
                        <span className="text-gray-400 block">Quorum</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {m.attended}/{m.quorumRequired}
                          {m.status === 'Completed' && (
                            m.attended >= m.quorumRequired
                              ? <span className="ml-1 text-emerald-500">✓ Met</span>
                              : <span className="ml-1 text-red-500">✗ Not Met</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Eye size={16} /></button>
                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"><Download size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'resolutions' && (
        <div className="space-y-3">
          {resolutions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No resolutions found
            </div>
          ) : (
            resolutions.filter(r => r.title.toLowerCase().includes(search.toLowerCase())).map(r => (
              <div key={r.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-indigo-500">{r.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(r.status)}`}>{r.status}</span>
                </div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">{r.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Proposed by {r.proposedBy} • {r.date}</p>

                {(r.status === 'Voted' || r.status === 'Approved' || r.status === 'Rejected') && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-[11px]">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span className="font-bold text-emerald-600">{r.votesFor} For</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <XCircle size={12} className="text-red-500" />
                      <span className="font-bold text-red-600">{r.votesAgainst} Against</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <AlertTriangle size={12} className="text-amber-500" />
                      <span className="font-bold text-amber-600">{r.abstained} Abstained</span>
                    </div>
                  </div>
                )}

                {r.actionItems > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500 font-bold">{r.completedActions}/{r.actionItems} action items completed</span>
                    <button className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">View Tracker</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'policies' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['ID', 'Title', 'Category', 'Version', 'Status', 'Effective Date', 'Last Reviewed', 'Approved By'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No policies found
                  </td>
                </tr>
              ) : (
                policies.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500">{p.id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white max-w-xs truncate">{p.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                    <td className="px-4 py-3 font-mono font-bold">v{p.version}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(p.status)}`}>{p.status}</span></td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.effectiveDate}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.lastReviewed}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.approvedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'delegation' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Authority', 'Level 1', 'Level 2', 'Level 3', 'Limit', 'Escalation Trigger'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {delegationMatrix.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No delegation matrix data available
                  </td>
                </tr>
              ) : (
                delegationMatrix.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{d.authority}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.level1}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.level2}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{d.level3}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-500">{d.limit}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{d.escalation}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-3">
          {mockAuditLog.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No audit logs recorded
            </div>
          ) : (
            mockAuditLog.map(a => (
              <div key={a.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <Lock size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold text-gray-400">{a.timestamp}</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{a.action}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">{a.actor}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 whitespace-pre-wrap break-words">{a.details}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span>Entity: {a.entity}</span>
                    <span>IP: {a.ipAddress}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
