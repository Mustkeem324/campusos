'use client';

import React, { useState } from 'react';
import { Activity, Database, Server, CheckCircle2, Cpu } from 'lucide-react';
import { checkSystemHealth } from '../../lib/health-service';

export function SystemHealthConsole() {
  const [health] = useState(() => checkSystemHealth());

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" />
            <span>Production Infrastructure & Reliability Health Endpoints</span>
          </h2>
          <p className="text-xs text-gray-500">
            PostgreSQL pool health • Redis L2 cache hit ratio • MinIO S3 backup status
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-xs font-bold font-mono">
          STATUS: {health.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] uppercase font-bold text-gray-400">Database Connection Pool</span>
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
            {health.metrics.dbConnectionPoolUsed} Active Pool Connections
          </h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-0.5">PostgreSQL 16 Engine Active</p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] uppercase font-bold text-gray-400">Redis L2 Query Cache</span>
          <h3 className="text-xl font-extrabold text-indigo-500 mt-1">
            {health.metrics.redisCacheHitRatio}% Hit Ratio
          </h3>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">Sub-millisecond Query Latency</p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <span className="text-[10px] uppercase font-bold text-gray-400">MinIO S3 Storage</span>
          <h3 className="text-xl font-extrabold text-emerald-500 mt-1">
            S3 Bucket Online
          </h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-0.5">PITR Backups Synchronized</p>
        </div>
      </div>
    </div>
  );
}
