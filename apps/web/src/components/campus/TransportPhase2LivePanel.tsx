'use client';

import { useEffect, useState } from 'react';
import { BellRing, Bus, CheckCircle2, Clock3, MapPin, TimerReset, TriangleAlert } from 'lucide-react';

import type { TransportPhase2LiveData } from '@/lib/transport-gps-phase2-types';

export function TransportPhase2LivePanel({ initialData }: { initialData: TransportPhase2LiveData }) {
  const [data, setData] = useState(initialData);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/transport/phase2/live', { cache: 'no-store' });
        if (!response.ok) throw new Error('ETA refresh failed');
        const next = await response.json() as TransportPhase2LiveData;
        if (active) {
          setData(next);
          setRefreshError(false);
        }
      } catch {
        if (active) setRefreshError(true);
      }
    };
    const timer = window.setInterval(() => void refresh(), 8_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (!data.enabled) return null;

  return (
    <section className="mt-5 space-y-4" aria-label="Stop-wise ETA and parent alerts">
      <div className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><TimerReset className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">GPS Phase 2</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-[-0.025em] text-[#101D38] dark:text-white">Stop-wise live ETA</h2>
              <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">ETA updates from live vehicle telemetry. Parent alerts are deduplicated per stop and trip.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[#D8E2EF] bg-[#F7F9FC] px-2.5 text-[10px] font-extrabold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"><BellRing className="h-3.5 w-3.5" />Alerts {data.settings.parentEtaAlertsEnabled ? 'on' : 'off'}</span>
            {refreshError && <span className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-extrabold text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"><TriangleAlert className="h-3.5 w-3.5" />Refresh delayed</span>}
          </div>
        </div>
      </div>

      {data.journeys.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#CBD7E6] bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-950">
          <Clock3 className="mx-auto h-6 w-6 text-[#8A95A6]" />
          <p className="mt-3 text-sm font-bold text-[#536175] dark:text-slate-300">ETA will appear after an assigned GPS vehicle sends telemetry and its route has configured stops.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.journeys.map((journey) => (
            <article key={journey.vehicleId} className="overflow-hidden rounded-[22px] border border-[#D8E2EF] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950">
              <div className="border-b border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1754E8] shadow-sm dark:bg-slate-950 dark:text-blue-300"><Bus className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">Live journey</p><p className="truncate text-[11px] text-[#667085] dark:text-slate-400">Vehicle {journey.vehicleId.slice(0, 8)}</p></div></div>
                  <StatusPill status={journey.status} />
                </div>
              </div>
              <div className="p-5">
                {journey.status === 'COMPLETED' ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="h-5 w-5" /><div><p className="text-sm font-extrabold">Route completed</p><p className="mt-1 text-xs">The vehicle reached the final configured stop.</p></div></div>
                ) : journey.status === 'NO_STOPS' ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">This route has no Phase 2 stops configured yet.</div>
                ) : (
                  <>
                    <div className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-rose-500" /><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A95A6]">Next stop</p><h3 className="mt-1 truncate text-lg font-extrabold text-[#101D38] dark:text-white">{journey.nextStop?.name ?? 'Calculating…'}</h3><p className="mt-1 text-xs text-[#667085] dark:text-slate-400">{journey.distanceToNextM === null ? 'Distance unavailable' : journey.distanceToNextM < 1000 ? `${journey.distanceToNextM} m away` : `${(journey.distanceToNextM / 1000).toFixed(1)} km away`}</p></div></div>
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <Metric label="ETA" value={journey.etaMinutes === null ? '—' : `${journey.etaMinutes} min`} />
                      <Metric label="Delay" value={journey.delayMinutes === null ? '—' : journey.delayMinutes > 0 ? `+${journey.delayMinutes} min` : `${journey.delayMinutes} min`} />
                      <Metric label="Alert at" value={`${data.settings.etaAlertLeadMinutes} min`} />
                    </div>
                    {journey.predictedArrivalAt && <p className="mt-4 text-xs leading-5 text-[#667085] dark:text-slate-400">Predicted arrival: <span className="font-extrabold text-[#101D38] dark:text-white">{formatTime(journey.predictedArrivalAt)}</span>. Traffic and GPS quality can change this estimate.</p>}
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl border border-[#E1E7EF] bg-[#F7F9FC] p-3 dark:border-slate-800 dark:bg-slate-900"><p className="truncate text-[9px] font-extrabold uppercase tracking-wide text-[#8A95A6]">{label}</p><p className="mt-1 truncate text-sm font-extrabold text-[#101D38] dark:text-white">{value}</p></div>; }
function StatusPill({ status }: { status: string }) { const delayed = status === 'DELAYED'; const atStop = status === 'AT_STOP'; return <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide ${delayed ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300' : atStop ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{status.replace(/_/g, ' ')}</span>; }
function formatTime(value: string) { return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(value)); }
