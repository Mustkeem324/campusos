'use client';

import React, { useState } from 'react';
import {
  Award, BookOpen, Trophy, Star, CheckCircle, Clock,
  Search, Filter, ExternalLink, Plus, Shield, Layers,
  GraduationCap, Zap, Target, TrendingUp, ArrowRight
} from 'lucide-react';

type MicroTab = 'catalog' | 'my-credentials' | 'pathways' | 'badges' | 'continuing-ed' | 'verification';

interface Microcredential {
  id: string;
  title: string;
  provider: string;
  providerLogo: string;
  duration: string;
  credits: number;
  cost: number;
  skills: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  enrolled: number;
  rating: number;
  category: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
  provider: string;
  progress: number;
  score: number;
  timeRemaining: string;
  status: 'In Progress' | 'Completed' | 'Not Started';
}

interface Badge {
  id: string;
  title: string;
  issuer: string;
  dateEarned: string;
  level: 'Gold' | 'Silver' | 'Bronze';
  skill: string;
  verified: boolean;
}

const mockCredentials: Microcredential[] = [];
const mockEnrolled: EnrolledCourse[] = [];
const mockBadges: Badge[] = [];

const badgeColor = (level: string) => {
  switch (level) {
    case 'Gold': return 'from-amber-400 to-yellow-600 border-amber-300';
    case 'Silver': return 'from-gray-300 to-slate-500 border-gray-200';
    case 'Bronze': return 'from-orange-400 to-amber-700 border-orange-300';
    default: return 'from-gray-400 to-gray-600 border-gray-300';
  }
};

const difficultyColor = (d: string) => {
  switch (d) {
    case 'Beginner': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Intermediate': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Advanced': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return '';
  }
};

export function MicrocredentialsConsole() {
  const [tab, setTab] = useState<MicroTab>('catalog');
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('all');

  const tabs: { id: MicroTab; label: string; icon: React.ElementType }[] = [
    { id: 'catalog', label: 'Catalog', icon: BookOpen },
    { id: 'my-credentials', label: 'My Credentials', icon: GraduationCap },
    { id: 'pathways', label: 'Pathways', icon: Layers },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'continuing-ed', label: 'Continuing Ed', icon: TrendingUp },
    { id: 'verification', label: 'Verification', icon: Shield },
  ];

  const filteredCatalog = mockCredentials.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) &&
    (diffFilter === 'all' || c.difficulty === diffFilter)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={22} className="text-indigo-500" />
            Microcredentials & Continuing Education
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Stackable credentials, digital badges & lifelong learning pathways
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Credentials Earned', value: '4', sub: '12 credits acquired', color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'In Progress', value: '2', sub: '72% avg progress', color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Badges Earned', value: '6', sub: '3 Gold, 2 Silver, 1 Bronze', color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Skill Score', value: '847', sub: 'Top 15% in cohort', color: 'text-purple-600 dark:text-purple-400' },
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

      {/* Catalog */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search microcredentials..." className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={diffFilter} onChange={e => setDiffFilter(e.target.value)} className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="all">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCatalog.length === 0 ? (
              <div className="col-span-full p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
                No microcredentials found in the catalog
              </div>
            ) : (
              filteredCatalog.map(c => (
                <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.providerLogo}</span>
                      <div>
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{c.title}</h3>
                        <p className="text-[11px] text-gray-500">{c.provider}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${difficultyColor(c.difficulty)}`}>{c.difficulty}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{s}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 text-[11px]">
                    <div><span className="text-gray-400 block">Duration</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.duration}</span></div>
                    <div><span className="text-gray-400 block">Credits</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.credits}</span></div>
                    <div><span className="text-gray-400 block">Cost</span><span className="font-bold text-gray-700 dark:text-gray-300">{c.cost === 0 ? 'Free' : `₹${c.cost}`}</span></div>
                    <div><span className="text-gray-400 block">Rating</span><span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-0.5"><Star size={10} className="text-amber-400" />{c.rating}</span></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{c.enrolled.toLocaleString()} enrolled</span>
                    <button className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition">Enroll</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* My Credentials */}
      {tab === 'my-credentials' && (
        <div className="space-y-3">
          {mockEnrolled.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              You have not enrolled in any microcredentials
            </div>
          ) : (
            mockEnrolled.map(c => (
              <div key={c.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{c.title}</h3>
                    <p className="text-[11px] text-gray-500">{c.provider}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    c.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : c.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                  }`}>{c.status}</span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-full rounded-full transition-all ${c.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{c.progress}%</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                  {c.score > 0 && <span>Score: <strong className="text-gray-700 dark:text-gray-300">{c.score}%</strong></span>}
                  <span>Time: <strong className="text-gray-700 dark:text-gray-300">{c.timeRemaining}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pathways */}
      {tab === 'pathways' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-6">Stackable Credential Pathway: AI & Data Science</h3>
          <div className="flex items-start gap-4 overflow-x-auto pb-4">
            {[
              { level: 'Microcredentials', items: ['Python Basics', 'Statistics', 'SQL Mastery'], completed: 3, total: 3, reward: '3 Badges' },
              { level: 'Certificate', items: ['Data Analytics', 'Machine Learning', 'Data Viz'], completed: 2, total: 3, reward: 'PG Certificate' },
              { level: 'Diploma', items: ['Deep Learning', 'NLP', 'MLOps', 'Capstone'], completed: 0, total: 4, reward: 'PG Diploma' },
              { level: 'Degree', items: ['Thesis', 'Research Project', 'Industry Internship'], completed: 0, total: 3, reward: 'M.Tech (AI)' },
            ].map((p, i) => (
              <React.Fragment key={i}>
                <div className={`min-w-[200px] p-4 rounded-2xl border-2 ${p.completed === p.total ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' : p.completed > 0 ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.level}</p>
                  <div className="mt-2 space-y-1.5">
                    {p.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-1.5 text-[11px]">
                        {j < p.completed ? <CheckCircle size={12} className="text-emerald-500" /> : <div className="w-3 h-3 rounded-full border-2 border-gray-300 dark:border-gray-600" />}
                        <span className={j < p.completed ? 'font-bold text-gray-900 dark:text-white line-through' : 'text-gray-600 dark:text-gray-400'}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{p.completed}/{p.total} complete</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">{p.reward}</span>
                  </div>
                </div>
                {i < 3 && <ArrowRight size={20} className="text-gray-300 mt-12 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {tab === 'badges' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mockBadges.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-500 dark:text-gray-400 text-sm border border-gray-200 dark:border-gray-800 rounded-2xl">
              No digital badges earned yet
            </div>
          ) : (
            mockBadges.map(b => (
              <div key={b.id} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-center hover:shadow-md transition">
                <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${badgeColor(b.level)} border-4 flex items-center justify-center shadow-lg`}>
                  <Award size={28} className="text-white" />
                </div>
                <h3 className="text-xs font-extrabold text-gray-900 dark:text-white mt-3">{b.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{b.issuer} • {b.dateEarned}</p>
                <div className="mt-2 flex items-center justify-center gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${difficultyColor(b.level === 'Gold' ? 'Advanced' : b.level === 'Silver' ? 'Intermediate' : 'Beginner')}`}>{b.level}</span>
                  {b.verified && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-0.5"><CheckCircle size={8} /> Verified</span>}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Skill: {b.skill}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Continuing Education */}
      {tab === 'continuing-ed' && (
        <div className="space-y-3">
          {[
            { title: 'Executive MBA — Weekend Program', duration: '18 months', fee: '₹4,50,000', seats: 40, filled: 28, schedule: 'Sat-Sun 9AM-1PM', start: 'Sep 2026' },
            { title: 'PG Certificate in AI for Business', duration: '6 months', fee: '₹1,20,000', seats: 60, filled: 45, schedule: 'Online + 2 weekend workshops', start: 'Aug 2026' },
            { title: 'Summer School — Renewable Energy', duration: '4 weeks', fee: '₹35,000', seats: 30, filled: 30, schedule: 'Mon-Fri 10AM-4PM', start: 'Jun 2027' },
            { title: 'Corporate Training — Digital Transformation', duration: '3 days', fee: '₹15,000', seats: 50, filled: 12, schedule: 'Intensive workshop', start: 'Oct 2026' },
          ].map((p, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">{p.title}</h3>
                  <p className="text-[11px] text-gray-500">{p.schedule} • Starts {p.start}</p>
                </div>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{p.fee}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-[11px]">
                <div><span className="text-gray-400 block">Duration</span><span className="font-bold text-gray-700 dark:text-gray-300">{p.duration}</span></div>
                <div>
                  <span className="text-gray-400 block">Seats</span>
                  <span className={`font-bold ${p.filled >= p.seats ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>{p.filled}/{p.seats} {p.filled >= p.seats ? '(Full)' : ''}</span>
                </div>
                <div className="text-right">
                  <button className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${p.filled >= p.seats ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`} disabled={p.filled >= p.seats}>
                    {p.filled >= p.seats ? 'Waitlist' : 'Apply'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification */}
      {tab === 'verification' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-center">
            <Shield size={40} className="mx-auto text-indigo-500 mb-3" />
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Certificate Verification</h3>
            <p className="text-xs text-gray-500 mt-1">Verify the authenticity of any microcredential certificate</p>
            <div className="mt-4 flex items-center gap-2">
              <input placeholder="Enter Certificate ID or scan QR..." className="flex-1 px-4 py-2.5 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition">Verify</button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-emerald-600" />
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">Sample Verified Certificate</span>
            </div>
            <div className="space-y-2 text-[11px]">
              {[
                { label: 'Certificate ID', value: 'UPES-MC-2026-00847' },
                { label: 'Holder', value: 'MUSTKEEM AHMAD' },
                { label: 'Course', value: 'Data Analytics with Power BI' },
                { label: 'Issuer', value: 'University of Petroleum & Energy Studies' },
                { label: 'Date Issued', value: 'June 15, 2026' },
                { label: 'Blockchain Hash', value: '0x7a3f...c2d1e8b9' },
                { label: 'Status', value: '✅ VALID — Immutable Record' },
              ].map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="font-bold text-gray-900 dark:text-white font-mono">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
