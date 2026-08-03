'use client';

import React, { useState } from 'react';
import {
  Leaf, Zap, Droplets, Recycle, Sun, Wind, TreePine,
  TrendingDown, Award, Target, BarChart3, Globe, Users,
  Factory, Battery, ThermometerSun, FileText
} from 'lucide-react';

type ESGTab = 'esg-dashboard' | 'carbon' | 'energy' | 'water-waste' | 'initiatives' | 'sdg-mapping' | 'reports';

const carbonData = [
  { month: 'Jan', emissions: 145 },
  { month: 'Feb', emissions: 132 },
  { month: 'Mar', emissions: 128 },
  { month: 'Apr', emissions: 115 },
  { month: 'May', emissions: 142 },
  { month: 'Jun', emissions: 168 },
  { month: 'Jul', emissions: 155 },
  { month: 'Aug', emissions: 138 },
];
const maxEmission = Math.max(...carbonData.map(d => d.emissions));

const energyData = [
  { building: 'Admin Block', kwh: 45200, cost: 362000, solar: 8500, net: 36700, grade: 'B' },
  { building: 'Academic Block A', kwh: 62300, cost: 498400, solar: 12000, net: 50300, grade: 'C' },
  { building: 'Academic Block B', kwh: 38900, cost: 311200, solar: 15200, net: 23700, grade: 'A' },
  { building: 'Library', kwh: 28400, cost: 227200, solar: 5600, net: 22800, grade: 'B' },
  { building: 'Hostel Block C', kwh: 52100, cost: 416800, solar: 0, net: 52100, grade: 'D' },
  { building: 'Sports Complex', kwh: 18600, cost: 148800, solar: 9200, net: 9400, grade: 'A' },
  { building: 'R&D Center', kwh: 34500, cost: 276000, solar: 7800, net: 26700, grade: 'B' },
];

const gradeColor = (g: string) => {
  switch(g) {
    case 'A': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'B': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'C': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'D': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return '';
  }
};

const sdgGoals = [
  { num: 4, title: 'Quality Education', score: 95, color: 'bg-red-500' },
  { num: 7, title: 'Affordable Clean Energy', score: 72, color: 'bg-yellow-500' },
  { num: 9, title: 'Industry, Innovation', score: 68, color: 'bg-orange-500' },
  { num: 11, title: 'Sustainable Cities', score: 58, color: 'bg-amber-600' },
  { num: 12, title: 'Responsible Consumption', score: 65, color: 'bg-yellow-700' },
  { num: 13, title: 'Climate Action', score: 55, color: 'bg-green-700' },
  { num: 15, title: 'Life on Land', score: 48, color: 'bg-emerald-600' },
  { num: 17, title: 'Partnerships', score: 78, color: 'bg-blue-800' },
];

export function SustainabilityESGConsole() {
  const [tab, setTab] = useState<ESGTab>('esg-dashboard');

  const tabs: { id: ESGTab; label: string; icon: React.ElementType }[] = [
    { id: 'esg-dashboard', label: 'ESG Dashboard', icon: Leaf },
    { id: 'carbon', label: 'Carbon', icon: Factory },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'water-waste', label: 'Water & Waste', icon: Droplets },
    { id: 'initiatives', label: 'Initiatives', icon: TreePine },
    { id: 'sdg-mapping', label: 'SDG Mapping', icon: Globe },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Leaf size={22} className="text-emerald-500" />
            Campus Sustainability & ESG
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Carbon tracking, energy management, waste reduction & SDG alignment</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${tab === t.id ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Icon size={14} />{t.label}
            </button>
          );
        })}
      </div>

      {/* ESG Dashboard */}
      {tab === 'esg-dashboard' && (
        <div className="space-y-6">
          {/* ESG Score Cards with Donut Charts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Overall ESG', score: 72, color: '#6366f1' },
              { label: 'Environmental', score: 68, color: '#10b981' },
              { label: 'Social', score: 82, color: '#3b82f6' },
              { label: 'Governance', score: 78, color: '#8b5cf6' },
            ].map((s, i) => {
              const circumference = 2 * Math.PI * 40;
              const offset = circumference - (s.score / 100) * circumference;
              return (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                  <svg width="100" height="100" viewBox="0 0 100 100" className="mx-auto">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke={s.color} strokeWidth="8"
                      strokeDasharray={circumference} strokeDashoffset={offset}
                      strokeLinecap="round" transform="rotate(-90 50 50)"
                      className="transition-all duration-1000"
                    />
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-extrabold fill-gray-900 dark:fill-white" fontSize="18">{s.score}</text>
                  </svg>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Carbon Reduction', value: '-12%', sub: 'vs last year', icon: TrendingDown, color: 'text-emerald-600' },
              { label: 'Solar Generation', value: '58.3 MWh', sub: 'This quarter', icon: Sun, color: 'text-amber-600' },
              { label: 'Water Recycled', value: '72%', sub: 'of total usage', icon: Droplets, color: 'text-blue-600' },
              { label: 'Waste Diverted', value: '68%', sub: 'from landfill', icon: Recycle, color: 'text-green-600' },
            ].map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={m.color} />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{m.label}</p>
                  </div>
                  <p className={`text-2xl font-extrabold mt-1 ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{m.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Sustainability Pledges */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Sustainability Pledges & Eco-Champions</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                <p className="text-2xl font-extrabold text-emerald-600">2,847</p>
                <p className="text-[10px] font-bold text-gray-500">Total Pledges</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10">
                <p className="text-2xl font-extrabold text-blue-600">156</p>
                <p className="text-[10px] font-bold text-gray-500">Eco-Champions</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
                <p className="text-2xl font-extrabold text-amber-600">45,200</p>
                <p className="text-[10px] font-bold text-gray-500">Green Points Earned</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {[
                { name: 'Ananya Krishnan', dept: 'CSE', points: 1250, rank: 1 },
                { name: 'Vikram Patel', dept: 'Mechanical', points: 1180, rank: 2 },
                { name: 'MUSTKEEM AHMAD', dept: 'MBA-BA', points: 980, rank: 3 },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-600'}`}>{c.rank}</span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.dept}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600">{c.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Carbon */}
      {tab === 'carbon' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">Monthly Carbon Emissions (tCO₂e) — 2026</h3>
            <div className="flex items-end gap-2 h-48">
              {carbonData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{d.emissions}</span>
                  <div className="w-full bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600" style={{ height: `${(d.emissions / maxEmission) * 100}%` }} />
                  <span className="text-[10px] font-bold text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">Emissions by Source</h3>
            {[
              { source: 'Electricity', value: 680, pct: 52, color: 'bg-amber-500' },
              { source: 'Transport', value: 290, pct: 22, color: 'bg-blue-500' },
              { source: 'Waste', value: 180, pct: 14, color: 'bg-red-500' },
              { source: 'Water Operations', value: 160, pct: 12, color: 'bg-cyan-500' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 w-28 text-right">{s.source}</span>
                <div className="flex-1 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div className={`h-full ${s.color} rounded-lg flex items-center justify-end pr-2 text-[9px] font-bold text-white`} style={{ width: `${s.pct}%` }}>
                    {s.value} tCO₂e ({s.pct}%)
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <h4 className="text-xs font-extrabold text-gray-900 dark:text-white mb-2">Reduction Target vs Actual</h4>
              {[
                { year: '2024-25', target: '1,800 tCO₂e', actual: '1,720 tCO₂e', met: true },
                { year: '2025-26', target: '1,500 tCO₂e', actual: '1,310 tCO₂e (proj)', met: true },
                { year: '2026-27', target: '1,200 tCO₂e', actual: '-', met: false },
              ].map((t, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-[11px]">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{t.year}</span>
                  <span className="text-gray-500">Target: {t.target}</span>
                  <span className={t.met ? 'text-emerald-600 font-bold' : 'text-gray-400'}>{t.actual}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
              <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mb-2">Carbon Offset Credits</h4>
              <p className="text-3xl font-extrabold text-emerald-600">342</p>
              <p className="text-[10px] text-gray-500 mt-1">Verified Carbon Standard (VCS) credits</p>
              <p className="text-[10px] text-gray-500">₹1.7L invested in offset programs</p>
            </div>
          </div>
        </div>
      )}

      {/* Energy */}
      {tab === 'energy' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {['Building', 'Consumption (kWh)', 'Cost (₹)', 'Solar Gen (kWh)', 'Net (kWh)', 'Efficiency'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {energyData.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{e.building}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{e.kwh.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">₹{(e.cost / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">{e.solar > 0 ? e.solar.toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-bold">{e.net.toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${gradeColor(e.grade)}`}>Grade {e.grade}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Water & Waste */}
      {tab === 'water-waste' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Droplets size={16} className="text-blue-500" /> Water Management</h3>
            {[
              { metric: 'Total Consumption', value: '4,52,000 litres/day' },
              { metric: 'Rainwater Harvested', value: '1,28,000 litres/month' },
              { metric: 'Water Recycled', value: '72% of wastewater' },
              { metric: 'STP Capacity', value: '5,00,000 litres/day' },
              { metric: 'Per Capita Usage', value: '85 litres/person/day' },
              { metric: 'Target Reduction', value: '15% by 2027' },
            ].map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <span className="text-xs text-gray-600 dark:text-gray-400">{w.metric}</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{w.value}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><Recycle size={16} className="text-green-500" /> Waste Segregation</h3>
            {[
              { type: 'Wet Waste', volume: '450 kg/day', diversion: '95%', color: 'bg-green-500' },
              { type: 'Dry Waste', volume: '320 kg/day', diversion: '82%', color: 'bg-blue-500' },
              { type: 'E-Waste', volume: '50 kg/month', diversion: '100%', color: 'bg-purple-500' },
              { type: 'Hazardous', volume: '15 kg/month', diversion: '100%', color: 'bg-red-500' },
              { type: 'Construction', volume: '200 kg/month', diversion: '45%', color: 'bg-amber-500' },
            ].map((w, i) => (
              <div key={i} className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{w.type}</span>
                  <span className="text-gray-400">{w.volume} • {w.diversion} diverted</span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className={`h-full ${w.color} rounded-full`} style={{ width: w.diversion }} />
                </div>
              </div>
            ))}
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Overall Diversion Rate</p>
              <p className="text-2xl font-extrabold text-emerald-600">68%</p>
              <p className="text-[10px] text-gray-500">Target: 80% by 2027</p>
            </div>
          </div>
        </div>
      )}

      {/* Initiatives */}
      {tab === 'initiatives' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Solar Panel Installation — Phase 2', budget: '₹1.2 Cr', progress: 75, impact: '280 MWh/year', status: 'In Progress', category: 'Energy' },
            { title: 'Paperless Campus Initiative', budget: '₹15L', progress: 90, impact: '5,000 kg paper saved/year', status: 'Near Completion', category: 'Waste' },
            { title: 'EV Charging Stations (10 units)', budget: '₹45L', progress: 40, impact: '50 tCO₂e/year reduction', status: 'In Progress', category: 'Transport' },
            { title: 'Tree Plantation Drive 2026', budget: '₹8L', progress: 100, impact: '2,500 trees planted', status: 'Completed', category: 'Biodiversity' },
            { title: 'Smart Water Meters — All Buildings', budget: '₹28L', progress: 55, impact: '20% water savings', status: 'In Progress', category: 'Water' },
            { title: 'Green Building Retrofit — Library', budget: '₹85L', progress: 15, impact: 'GRIHA 4-star rating', status: 'Planning', category: 'Building' },
          ].map((p, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{p.category}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.progress === 100 ? 'bg-emerald-100 text-emerald-700' : p.progress > 50 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{p.status}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mt-1">{p.title}</h3>
                </div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{p.budget}</span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className={`h-full rounded-full ${p.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${p.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600">{p.progress}%</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Impact: {p.impact}</p>
            </div>
          ))}
        </div>
      )}

      {/* SDG Mapping */}
      {tab === 'sdg-mapping' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4">UN Sustainable Development Goals — Campus Contribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sdgGoals.map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className={`w-12 h-12 ${g.color} rounded-xl flex items-center justify-center text-white font-extrabold text-lg shrink-0`}>
                  {g.num}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">SDG {g.num}: {g.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.score}%` }} />
                    </div>
                    <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">{g.score}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-3">ESG Report Generation</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Reporting Framework</label>
                <select className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>GRI Standards 2021</option>
                  <option>SASB Standards</option>
                  <option>CDP Climate Disclosure</option>
                  <option>TCFD Recommendations</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Report Period</label>
                <select className="w-full px-3 py-2 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>FY 2025-26</option>
                  <option>FY 2024-25</option>
                  <option>Q1 2026</option>
                  <option>Q2 2026</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 mb-4">
              <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">Data Completeness</p>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                {[
                  { section: 'Environmental', pct: 92 },
                  { section: 'Social', pct: 88 },
                  { section: 'Governance', pct: 95 },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex justify-between"><span className="text-gray-500">{s.section}</span><span className="font-bold">{s.pct}%</span></div>
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mt-1">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition">
              Generate ESG Report
            </button>
          </div>

          <div className="space-y-2">
            {[
              { name: 'ESG Annual Report FY 2024-25', format: 'PDF', size: '4.2 MB', date: '2025-06-30' },
              { name: 'Carbon Disclosure Report 2024', format: 'PDF', size: '2.8 MB', date: '2024-12-15' },
              { name: 'Sustainability Data Pack Q2 2026', format: 'Excel', size: '1.5 MB', date: '2026-07-15' },
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{r.name}</p>
                    <p className="text-[10px] text-gray-400">{r.format} • {r.size} • {r.date}</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">Download</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
