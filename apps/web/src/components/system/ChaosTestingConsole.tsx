'use client';

import React, { useState } from 'react';
import { AlertOctagon, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';
import { simulateDatabaseFailureWithFallback } from '../../lib/observability-service';

export function ChaosTestingConsole() {
  const [dbFail, setDbFail] = useState(false);
  const [fallbackResult, setFallbackResult] = useState<{ source: string; isDegraded: boolean } | null>(null);

  const handleSimulateChaos = () => {
    const res = simulateDatabaseFailureWithFallback(true, 'Cached Student Roster Data');
    setDbFail(true);
    setFallbackResult(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-amber-900 dark:text-amber-100 flex items-center gap-2">
            <Zap size={20} className="text-amber-600" />
            <span>Chaos Testing Framework & Degraded Cache Fallback</span>
          </h2>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Inject PostgreSQL connection pool exhaustion to verify Redis cache fallback
          </p>
        </div>

        <button
          onClick={handleSimulateChaos}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg transition animate-pulse"
        >
          <AlertOctagon size={14} />
          <span>Inject Database Outage Chaos</span>
        </button>
      </div>

      {fallbackResult && (
        <div className="p-4 rounded-xl bg-slate-950 text-white border border-amber-500 text-xs font-mono space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <ShieldAlert size={16} /> CHAOS FAULT INJECTED: PRIMARY DB EXHAUSTED
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px]">
              {fallbackResult.source}
            </span>
          </div>
          <p className="text-slate-300">
            System status: Gracefully serving stale cache payload without throwing 500 error!
          </p>
        </div>
      )}
    </div>
  );
}
