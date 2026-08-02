'use client';

import React, { useState } from 'react';
import { Activity, Server, FileText, CheckCircle2 } from 'lucide-react';
import { generatePrometheusMetrics } from '../../lib/observability-service';

export function PrometheusMetricsConsole() {
  const [rawMetrics] = useState(() => generatePrometheusMetrics());

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" />
            <span>Prometheus Metrics Endpoint Exporter (`/api/metrics`)</span>
          </h2>
          <p className="text-xs text-gray-500">
            OpenTelemetry tracing & Prometheus time-series metric exporter format
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 space-y-1">
        <pre>{rawMetrics}</pre>
      </div>
    </div>
  );
}
