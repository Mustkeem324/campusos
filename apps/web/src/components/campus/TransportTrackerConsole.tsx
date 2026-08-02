'use client';

import React from 'react';
import { Bus, MapPin, Navigation, Clock, CheckCircle2 } from 'lucide-react';

export function TransportTrackerConsole() {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Bus size={20} className="text-sky-500" />
            <span>Campus Transport Live Bus GPS Tracker & Parent ETA Alerts</span>
          </h2>
          <p className="text-xs text-gray-500">
            Real-time GPS telemetry webhook ingestion • Automated stop-wise ETA alerts to parents
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-white space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus size={24} className="text-sky-400 animate-bounce" />
            <div>
              <h3 className="text-sm font-bold">Route 4: Downtown Campus Express</h3>
              <p className="text-[10px] text-slate-400 font-mono">Vehicle: KA-01-EQ-9941 • Driver: Ramesh Kumar</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs">
            GPS Active (Speed: 42 km/h)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-rose-400" />
            <span>Next Stop: <span className="font-bold text-white">Central Library Circle</span></span>
          </div>
          <span className="font-mono text-sky-400 font-bold">ETA: 6 mins (08:42 AM)</span>
        </div>
      </div>
    </div>
  );
}
