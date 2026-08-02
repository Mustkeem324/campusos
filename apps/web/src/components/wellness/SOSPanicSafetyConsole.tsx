'use client';

import React, { useState } from 'react';
import { AlertOctagon, MapPin, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { triggerMobileSOSGPSAlert, SOSPanicAlert } from '../../lib/wellness-safety-service';

export function SOSPanicSafetyConsole() {
  const [activeAlert, setActiveAlert] = useState<SOSPanicAlert | null>(null);

  const handleTriggerSOS = () => {
    const alert = triggerMobileSOSGPSAlert('usr_student_01', 'Alex Vance', 12.9716, 77.5946);
    setActiveAlert(alert);
  };

  return (
    <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-900 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-rose-900 dark:text-rose-100 flex items-center gap-2">
            <AlertOctagon size={24} className="text-rose-600 animate-pulse" />
            <span>Mobile SOS Panic Button & Live GPS Security Broadcast</span>
          </h2>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
            Instant live GPS coordinate broadcast to Campus Security Control Room
          </p>
        </div>

        <button
          onClick={handleTriggerSOS}
          className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-2xl transition flex items-center gap-2 animate-bounce"
        >
          <Zap size={16} />
          <span>TRIGGER MOBILE SOS WITH LIVE GPS</span>
        </button>
      </div>

      {activeAlert && (
        <div className="p-5 rounded-2xl bg-slate-950 text-white border border-rose-500 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-rose-400 flex items-center gap-1.5 text-sm">
              <AlertOctagon size={18} className="animate-spin" /> ACTIVE EMERGENCY ALERT DISPATCHED
            </span>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-rose-600 text-white font-bold">
              STATUS: {activeAlert.status}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-emerald-400" />
              <span>Live GPS Broadcast: <span className="font-mono font-bold text-white">Lat: {activeAlert.lat}, Lng: {activeAlert.lng}</span></span>
            </div>
            <span className="text-slate-400 font-mono">Student: {activeAlert.studentName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
