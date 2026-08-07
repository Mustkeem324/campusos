'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, BellRing, Clock3, MapPin, Plus, Route, Trash2 } from 'lucide-react';

import type { TransportPhase2AdminData } from '@/lib/transport-gps-phase2-types';

const inputClass = 'mt-2 min-h-11 w-full rounded-xl border border-[#CBD7E6] bg-white px-3 text-sm font-semibold text-[#101D38] outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export function TransportPhase2AdminPanel({ data }: { data: TransportPhase2AdminData }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopForm, setStopForm] = useState({
    routeId: data.routes[0]?.id ?? '',
    name: '',
    sequenceNo: '1',
    latitude: '',
    longitude: '',
    geofenceRadiusM: '120',
    plannedOffsetMinutes: '0',
  });

  const selectedRoute = useMemo(() => data.routes.find((route) => route.id === stopForm.routeId), [data.routes, stopForm.routeId]);

  async function patchSettings(patch: Record<string, boolean | number>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/transport/admin/phase2/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to update Phase 2 settings.');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update Phase 2 settings.');
    } finally {
      setSaving(false);
    }
  }

  async function addStop(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/transport/admin/phase2/stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: stopForm.routeId,
          name: stopForm.name,
          sequenceNo: Number(stopForm.sequenceNo),
          latitude: Number(stopForm.latitude),
          longitude: Number(stopForm.longitude),
          geofenceRadiusM: Number(stopForm.geofenceRadiusM),
          plannedOffsetMinutes: Number(stopForm.plannedOffsetMinutes),
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to add route stop.');
      const nextSequence = (selectedRoute?.stops.length ?? 0) + 2;
      setStopForm((current) => ({ ...current, name: '', latitude: '', longitude: '', sequenceNo: String(nextSequence), plannedOffsetMinutes: String(Number(current.plannedOffsetMinutes) + 10) }));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add route stop.');
    } finally {
      setSaving(false);
    }
  }

  async function removeStop(id: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/transport/admin/phase2/stops/${id}`, { method: 'DELETE' });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to remove route stop.');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove route stop.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 min-w-0 space-y-5 sm:space-y-6" aria-label="Transport GPS Phase 2 controls">
      <header className="overflow-hidden rounded-[26px] border border-[#D8E2EF] bg-white shadow-[0_16px_46px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D8EE] bg-[#EDF3FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              <BellRing className="h-3.5 w-3.5" /> GPS Phase 2
            </div>
            <h2 className="mt-4 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] dark:text-white sm:text-3xl">Stop-wise ETA & Parent Alerts</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085] dark:text-slate-400">Configure route stops once. Live GPS pings then advance the trip automatically, detect arrivals inside each geofence, calculate stop ETA and delay, and notify linked parents without duplicate alerts.</p>
          </div>
          <aside className="border-t border-[#284467] bg-[#101D38] p-5 text-white sm:p-7 xl:border-l xl:border-t-0">
            <div className="grid grid-cols-2 gap-3">
              <DarkMetric label="Configured stops" value={data.metrics.configuredStops} />
              <DarkMetric label="Configured routes" value={data.metrics.configuredRoutes} />
              <DarkMetric label="Active journeys" value={data.metrics.activeJourneys} />
              <DarkMetric label="Delayed" value={data.metrics.delayedJourneys} />
            </div>
          </aside>
        </div>
      </header>

      {error && <div className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200"><AlertTriangle className="h-5 w-5 shrink-0" />{error}</div>}

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex items-start gap-3"><BellRing className="mt-0.5 h-5 w-5 text-[#1754E8]" /><div><h3 className="font-extrabold text-[#101D38] dark:text-white">Parent alert policy</h3><p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">Alerts are sent only to verified guardians linked to eligible riders assigned to that GPS vehicle.</p></div></div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <ToggleCard title="In-app ETA alerts" description="Notify linked parents when the bus is inside the configured ETA lead window and when it reaches a stop." checked={data.settings.parentEtaAlertsEnabled} disabled={saving} onChange={(value) => void patchSettings({ parentEtaAlertsEnabled: value })} />
          <ToggleCard title="Email ETA alerts" description="Also queue the same alerts to the guardian account email. In-app alerts remain the primary channel." checked={data.settings.parentEmailAlertsEnabled} disabled={saving || !data.settings.parentEtaAlertsEnabled} onChange={(value) => void patchSettings({ parentEmailAlertsEnabled: value })} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-extrabold text-[#344054] dark:text-slate-200">Approaching alert window
            <select className={inputClass} disabled={saving} value={data.settings.etaAlertLeadMinutes} onChange={(event) => void patchSettings({ etaAlertLeadMinutes: Number(event.target.value) })}>
              {[5, 8, 10, 15, 20, 30].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes before stop</option>)}
            </select>
          </label>
          <label className="text-xs font-extrabold text-[#344054] dark:text-slate-200">ETA fallback speed
            <select className={inputClass} disabled={saving} value={data.settings.etaDefaultSpeedKph} onChange={(event) => void patchSettings({ etaDefaultSpeedKph: Number(event.target.value) })}>
              {[15, 20, 25, 30, 35, 40].map((speed) => <option key={speed} value={speed}>{speed} km/h</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-[#1754E8]" /><div><h3 className="font-extrabold text-[#101D38] dark:text-white">Add ordered route stop</h3><p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">Sequence controls journey order. Planned offset is minutes from the first GPS fix of the trip and powers delay detection.</p></div></div>
        {data.routes.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-[#CBD7E6] p-5 text-sm text-[#667085] dark:border-slate-700 dark:text-slate-400">Create an institution transport route first, then add Phase 2 stops here.</p>
        ) : (
          <form onSubmit={addStop} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Route"><select className={inputClass} value={stopForm.routeId} onChange={(event) => setStopForm((current) => ({ ...current, routeId: event.target.value }))}>{data.routes.map((route) => <option key={route.id} value={route.id}>{route.routeName}</option>)}</select></Field>
            <Field label="Stop name"><input required className={inputClass} value={stopForm.name} onChange={(event) => setStopForm((current) => ({ ...current, name: event.target.value }))} placeholder="Central Library Circle" /></Field>
            <Field label="Sequence"><input required type="number" min="1" max="500" className={inputClass} value={stopForm.sequenceNo} onChange={(event) => setStopForm((current) => ({ ...current, sequenceNo: event.target.value }))} /></Field>
            <Field label="Planned offset"><input required type="number" min="0" max="1440" className={inputClass} value={stopForm.plannedOffsetMinutes} onChange={(event) => setStopForm((current) => ({ ...current, plannedOffsetMinutes: event.target.value }))} /></Field>
            <Field label="Latitude"><input required type="number" step="any" min="-90" max="90" className={inputClass} value={stopForm.latitude} onChange={(event) => setStopForm((current) => ({ ...current, latitude: event.target.value }))} placeholder="26.8467" /></Field>
            <Field label="Longitude"><input required type="number" step="any" min="-180" max="180" className={inputClass} value={stopForm.longitude} onChange={(event) => setStopForm((current) => ({ ...current, longitude: event.target.value }))} placeholder="80.9462" /></Field>
            <Field label="Geofence radius (m)"><input required type="number" min="25" max="2000" className={inputClass} value={stopForm.geofenceRadiusM} onChange={(event) => setStopForm((current) => ({ ...current, geofenceRadiusM: event.target.value }))} /></Field>
            <div className="flex items-end"><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white hover:bg-[#1245C4] disabled:opacity-60"><Plus className="h-4 w-4" />Add stop</button></div>
          </form>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {data.routes.map((route) => (
          <article key={route.id} className="rounded-[22px] border border-[#D8E2EF] bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><Route className="h-5 w-5" /></span><div className="min-w-0"><h3 className="truncate font-extrabold text-[#101D38] dark:text-white">{route.routeName}</h3><p className="text-xs text-[#667085] dark:text-slate-400">{route.stops.length} configured stops</p></div></div></div>
            {route.stops.length === 0 ? <p className="mt-4 rounded-xl bg-[#F7F9FC] p-4 text-xs text-[#667085] dark:bg-slate-900 dark:text-slate-400">No ETA stops configured.</p> : <ol className="mt-4 space-y-2">{route.stops.map((stop) => <li key={stop.id} className="flex items-center gap-3 rounded-xl border border-[#E1E7EF] bg-[#F7F9FC] p-3 dark:border-slate-800 dark:bg-slate-900"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-[#1754E8] dark:bg-slate-950">{stop.sequenceNo}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#101D38] dark:text-white">{stop.name}</p><p className="mt-0.5 text-[11px] text-[#667085] dark:text-slate-400">+{stop.plannedOffsetMinutes} min · {stop.geofenceRadiusM}m geofence</p></div><button type="button" disabled={saving} onClick={() => void removeStop(stop.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/30" aria-label={`Remove ${stop.name}`}><Trash2 className="h-4 w-4" /></button></li>)}</ol>}
          </article>
        ))}
      </section>

      {data.journeys.length > 0 && <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6"><div className="flex items-center gap-3"><Clock3 className="h-5 w-5 text-[#1754E8]" /><h3 className="font-extrabold text-[#101D38] dark:text-white">Current ETA engine state</h3></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{data.journeys.map((journey) => <div key={journey.vehicleId} className="rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold uppercase tracking-wide text-[#667085] dark:text-slate-400">Vehicle {journey.vehicleId.slice(0, 8)}</p><JourneyPill status={journey.status} /></div><p className="mt-3 text-sm font-extrabold text-[#101D38] dark:text-white">{journey.nextStop?.name ?? (journey.status === 'COMPLETED' ? 'Trip completed' : 'No next stop')}</p><p className="mt-1 text-xs text-[#667085] dark:text-slate-400">ETA {journey.etaMinutes ?? '—'} min · Delay {journey.delayMinutes ?? 0} min</p></div>)}</div></section>}
    </section>
  );
}

function ToggleCard({ title, description, checked, disabled, onChange }: { title: string; description: string; checked: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900"><input type="checkbox" className="mt-1 h-4 w-4 accent-[#1754E8]" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span><span className="block text-sm font-extrabold text-[#101D38] dark:text-white">{title}</span><span className="mt-1 block text-xs leading-5 text-[#667085] dark:text-slate-400">{description}</span></span></label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-extrabold text-[#344054] dark:text-slate-200">{label}{children}</label>; }
function DarkMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-[#365171] bg-[#0D1A2E] p-3"><p className="text-xl font-extrabold">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#AFC0D8]">{label}</p></div>; }
function JourneyPill({ status }: { status: string }) { const delayed = status === 'DELAYED'; return <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase ${delayed ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{status.replace(/_/g, ' ')}</span>; }
