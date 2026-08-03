'use client';

import React, { useState } from 'react';
import {
  Globe, Plane, FileText, BookOpen, Users, AlertTriangle,
  Search, MapPin, Calendar, Clock, CheckCircle, XCircle,
  Phone, Shield, Flag, Star, ArrowRight, Plus, Eye
} from 'lucide-react';

type IntlTab = 'registry' | 'visa' | 'exchange' | 'credit-transfer' | 'global-dashboard' | 'support';

interface InternationalStudent {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  program: string;
  visaType: string;
  visaExpiry: string;
  frroStatus: 'Registered' | 'Pending' | 'Expired';
  insuranceStatus: 'Active' | 'Expired' | 'Not Enrolled';
  email: string;
  admissionYear: number;
}

interface ExchangeProgram {
  id: string;
  university: string;
  country: string;
  flag: string;
  type: 'Inbound' | 'Outbound';
  semester: string;
  creditsTransferable: number;
  seatsAvailable: number;
  applicationDeadline: string;
  status: 'Open' | 'Closed' | 'In Progress';
}

const mockStudents: InternationalStudent[] = [];
const mockExchange: ExchangeProgram[] = [];
const countryDistribution: any[] = [];
const maxCount = 0;
const creditMappings: any[] = [];

const statusColor = (s: string) => {
  const map: Record<string, string> = {
    'Registered': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Expired': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Not Enrolled': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
    'Open': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Closed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Under Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return map[s] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
};

export function InternationalStudentsConsole() {
  const [tab, setTab] = useState<IntlTab>('registry');
  const [search, setSearch] = useState('');

  const tabs: { id: IntlTab; label: string; icon: React.ElementType }[] = [
    { id: 'registry', label: 'Registry', icon: Users },
    { id: 'visa', label: 'Visa Tracker', icon: FileText },
    { id: 'exchange', label: 'Exchange Programs', icon: Plane },
    { id: 'credit-transfer', label: 'Credit Transfer', icon: BookOpen },
    { id: 'global-dashboard', label: 'Global Dashboard', icon: Globe },
    { id: 'support', label: 'Support', icon: Phone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe size={22} className="text-indigo-500" />
            International Students & Global Mobility
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Visa tracking, exchange programs, credit transfer & global student support
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition">
          <Plus size={14} /> Register Student
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'International Students', value: '—', sub: 'No records available', color: 'text-gray-400' },
          { label: 'Active Visas', value: '—', sub: 'No records available', color: 'text-gray-400' },
          { label: 'Exchange Programs', value: '—', sub: 'No programs available', color: 'text-gray-400' },
          { label: 'Credits Transferred', value: '—', sub: 'No credits available', color: 'text-gray-400' },
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
        <div className="ml-auto px-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40" />
          </div>
        </div>
      </div>

      {/* Registry */}
      {tab === 'registry' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Student', 'Nationality', 'Program', 'Visa Type', 'Visa Expiry', 'FRRO', 'Insurance'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {mockStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No international students registered
                  </td>
                </tr>
              ) : (
                mockStudents.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => {
                  const daysToExpiry = Math.floor((new Date(s.visaExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{s.id}</p>
                      </td>
                      <td className="px-4 py-3"><span className="text-lg mr-1">{s.flag}</span><span className="text-gray-600 dark:text-gray-400">{s.nationality}</span></td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.program}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.visaType}</td>
                      <td className="px-4 py-3">
                        <span className="text-gray-700 dark:text-gray-300">{s.visaExpiry}</span>
                        {daysToExpiry < 90 && <span className="ml-1 text-[9px] font-bold text-amber-500">({daysToExpiry}d)</span>}
                      </td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(s.frroStatus)}`}>{s.frroStatus}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(s.insuranceStatus)}`}>{s.insuranceStatus}</span></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Visa Tracker */}
      {tab === 'visa' && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">Visa Renewal Alerts</h3>
          {mockStudents.filter(s => {
            const days = Math.floor((new Date(s.visaExpiry).getTime() - Date.now()) / (1000*60*60*24));
            return days < 180;
          }).length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No visa renewal alerts
            </div>
          ) : (
            mockStudents.filter(s => {
              const days = Math.floor((new Date(s.visaExpiry).getTime() - Date.now()) / (1000*60*60*24));
              return days < 180;
            }).map(s => {
              const days = Math.floor((new Date(s.visaExpiry).getTime() - Date.now()) / (1000*60*60*24));
              return (
                <div key={s.id} className={`p-4 rounded-2xl border shadow-sm ${days < 30 ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30' : days < 90 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{s.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{s.name}</p>
                        <p className="text-[10px] text-gray-400">{s.program} • {s.visaType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${days < 30 ? 'text-red-600' : days < 90 ? 'text-amber-600' : 'text-gray-600'}`}>{days} days</p>
                      <p className="text-[10px] text-gray-400">Expires: {s.visaExpiry}</p>
                    </div>
                  </div>
                  {/* Visa Timeline */}
                  <div className="mt-3 flex items-center gap-1">
                    {['Applied', 'Processing', 'Approved', days < 0 ? 'Expired' : 'Valid'].map((stage, i) => (
                      <React.Fragment key={i}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${i < 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : days < 0 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {i < 3 ? <CheckCircle size={10} /> : null}
                          {stage}
                        </div>
                        {i < 3 && <ArrowRight size={12} className="text-gray-300" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-6">Document Checklist</h3>
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            {[
              { doc: 'Valid Passport', required: true, uploaded: true },
              { doc: 'Student Visa (Form S)', required: true, uploaded: true },
              { doc: 'FRRO Registration Certificate', required: true, uploaded: true },
              { doc: 'Health Insurance Policy', required: true, uploaded: true },
              { doc: 'Financial Proof / Scholarship Letter', required: true, uploaded: true },
              { doc: 'Admission Letter from UPES', required: true, uploaded: true },
              { doc: 'Police Clearance Certificate', required: false, uploaded: false },
              { doc: 'COVID-19 Vaccination Certificate', required: false, uploaded: true },
            ].map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  {d.uploaded ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-gray-300" />}
                  <span className="text-xs text-gray-700 dark:text-gray-300">{d.doc}</span>
                  {d.required && <span className="text-[9px] font-bold text-red-500">*</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${d.uploaded ? statusColor('Active') : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                  {d.uploaded ? 'Uploaded' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exchange Programs */}
      {tab === 'exchange' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockExchange.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No exchange programs available
            </div>
          ) : (
            mockExchange.filter(e => e.university.toLowerCase().includes(search.toLowerCase())).map(e => (
              <div key={e.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{e.flag}</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{e.university}</h3>
                      <p className="text-[11px] text-gray-500">{e.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${e.type === 'Inbound' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>{e.type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(e.status)}`}>{e.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3 text-[11px]">
                  <div><span className="text-gray-400 block">Semester</span><span className="font-bold text-gray-700 dark:text-gray-300">{e.semester}</span></div>
                  <div><span className="text-gray-400 block">Credits</span><span className="font-bold text-gray-700 dark:text-gray-300">{e.creditsTransferable} transferable</span></div>
                  <div><span className="text-gray-400 block">Seats</span><span className="font-bold text-gray-700 dark:text-gray-300">{e.seatsAvailable} available</span></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">Deadline: {e.applicationDeadline}</span>
                  {e.status === 'Open' && (
                    <button className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition">Apply Now</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Credit Transfer */}
      {tab === 'credit-transfer' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Home Course', 'Credits', 'Host Course', 'Credits', 'Host University', 'Equivalence', 'Notes'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {creditMappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No credit mappings recorded
                  </td>
                </tr>
              ) : (
                creditMappings.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{c.homeCourse}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{c.homeCredits}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.hostCourse}</td>
                    <td className="px-4 py-3 font-bold text-indigo-600">{c.hostCredits}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{c.hostUniv}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColor(c.equivalence)}`}>{c.equivalence}</span></td>
                    <td className="px-4 py-3 text-[10px] text-gray-500 max-w-[200px]">{c.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Dashboard */}
      {tab === 'global-dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Student Distribution by Country (Top 10)</h3>
            <div className="space-y-2">
              {countryDistribution.length === 0 ? (
                <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-xl">
                  No distribution data available
                </div>
              ) : (
                countryDistribution.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg w-8">{c.flag}</span>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-24">{c.country}</span>
                    <div className="flex-1 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-lg flex items-center justify-end pr-2 text-[9px] font-bold text-white transition-all" style={{ width: `${(c.count / maxCount) * 100}%`, minWidth: '30px' }}>
                        {c.count}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Mobility Statistics</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Countries', value: '0' },
                  { label: 'Outbound This Year', value: '0' },
                  { label: 'Inbound This Year', value: '0' },
                  { label: 'Partner Universities', value: '0' },
                  { label: 'Active MOUs', value: '0' },
                  { label: 'Credits Transferred', value: '0' },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{m.label}</p>
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Cultural Integration</h3>
              <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-xl mt-3">
                No upcoming cultural events
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support */}
      {tab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Phone size={16} className="text-indigo-500" /> Emergency Contacts
            </h3>
            {[
              { name: 'International Student Office', phone: '+91 135 277 0999', available: '24/7' },
              { name: 'Campus Security', phone: '+91 135 277 0100', available: '24/7' },
              { name: 'Medical Emergency', phone: '108', available: '24/7' },
              { name: 'Police', phone: '100', available: '24/7' },
              { name: 'FRRO Dehradun', phone: '+91 135 265 4044', available: 'Mon-Fri 10AM-5PM' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{c.name}</p>
                  <p className="text-[10px] text-gray-400">{c.available}</p>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.phone}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xl text-center">
              <AlertTriangle size={32} className="mx-auto mb-2" />
              <h3 className="text-lg font-extrabold">SOS Emergency</h3>
              <p className="text-xs text-red-200 mt-1">Tap for immediate assistance</p>
              <button className="mt-3 px-6 py-3 rounded-xl bg-white text-red-700 font-extrabold text-sm shadow-lg hover:bg-red-50 transition">
                ACTIVATE SOS
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Embassy Contacts</h3>
              {[
                { country: '🇳🇬 Nigeria', embassy: 'Embassy of Nigeria, New Delhi', phone: '+91 11 2688 1969' },
                { country: '🇧🇩 Bangladesh', embassy: 'High Commission, New Delhi', phone: '+91 11 2412 2389' },
                { country: '🇺🇸 USA', embassy: 'US Embassy, New Delhi', phone: '+91 11 2419 8000' },
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{e.country}</p>
                    <p className="text-[10px] text-gray-400">{e.embassy}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-indigo-500">{e.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
