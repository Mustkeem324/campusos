'use client';

import React, { useState } from 'react';
import { BookOpen, Award, Sparkles, TrendingUp } from 'lucide-react';
import { calculateFacultyHIndex, PublicationRecord } from '../../lib/research-service';

export function FacultyPublicationsConsole() {
  const [publications] = useState<PublicationRecord[]>([
    { doi: '10.1145/3318464.3389700', title: 'Optimizing Distributed Transaction Latency in Cloud Databases', journal: 'ACM TODS', year: 2024, citations: 42 },
    { doi: '10.1109/TKDE.2023.3288100', title: 'Multi-Tenant Isolation Patterns in Serverless Architectures', journal: 'IEEE TKDE', year: 2023, citations: 18 },
    { doi: '10.1109/ICDE.2022.00104', title: 'Automated Timetable CSP Solver with Hard Constraints', journal: 'IEEE ICDE', year: 2022, citations: 12 },
    { doi: '10.1007/s00778-021-00680-w', title: 'Optimistic Concurrency Control in High-Throughput ERP Systems', journal: 'VLDB Journal', year: 2021, citations: 8 },
  ]);

  const [metrics] = useState(() => calculateFacultyHIndex(publications.map((p) => p.citations)));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            <span>Faculty Publications & Automated h-Index Metrics</span>
          </h2>
          <p className="text-xs text-gray-500">
            Scopus / Web of Science DOI lookup • Automated h-index & i10-index calculation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-center">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Calculated h-Index</span>
          <h3 className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-200 mt-0.5">{metrics.hIndex}</h3>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Calculated i10-Index</span>
          <h3 className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">{metrics.i10Index}</h3>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">DOI</th>
              <th className="p-3">Title & Journal</th>
              <th className="p-3">Year</th>
              <th className="p-3 text-right">Citations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {publications.map((p) => (
              <tr key={p.doi} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3 font-mono text-gray-400 font-bold">{p.doi}</td>
                <td className="p-3 font-bold text-gray-900 dark:text-white">{p.title} <span className="text-indigo-500 font-semibold">({p.journal})</span></td>
                <td className="p-3 font-mono">{p.year}</td>
                <td className="p-3 text-right font-mono font-bold text-emerald-500">{p.citations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
