'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gauge,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  ShieldCheck,
  UsersRound,
  WifiOff,
} from 'lucide-react';

import type { TransportVehicle, TransportWorkspaceData } from '@/lib/transport-gps-types';

export function TransportTrackerConsole({ initialData }: { initialData: TransportWorkspaceData }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch('/api/transport/live', { cache: 'no-store' });
      const payload = await response.json().catch(() => null) as TransportWorkspaceData | { error?: string } | null;
      if (!response.ok || !payload || !('fleet' in payload)) {
        throw new Error(payload && 'error' in payload ? payload.error || 'Unable to refresh GPS data.' : 'Unable to refresh GPS data.');
      }
      setData(payload);
      setLastError(null);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Unable to refresh GPS data.');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!data.availability.visible || !data.settings.gpsTrackingEnabled) return undefined;
    const interval = window.setInterval(() => {
      void refresh();
    }, 8_000);
    return () => window.clearInterval(interval);
  }, [data.availability.visible, data.settings.gpsTrackingEnabled]);

  if (!data.availability.storeReady) {
    return <TransportState icon={AlertTriangle} title="Transport GPS is being provisioned" text="The institution transport storage is not available yet. An administrator should complete database preparation before enabling this module." />;
  }

  if (!data.availability.visible) {
    return <TransportUnavailable data={data} />;
  }

  const liveCount = data.fleet.filter((vehicle) => vehicle.latestPosition && !vehicle.latestPosition.stale).length;
  const isManagerView = data.role === 'TRANSPORT_MANAGER' || data.role === 'INSTITUTION_ADMIN';

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6" aria-label="Campus Transport GPS">
      <header className="overflow-hidden rounded-[28px] border border-[#D8E2EF] bg-white shadow-[0_18px_54px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Radio className="h-3.5 w-3.5" aria-hidden="true" />
                GPS module enabled
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C9D8EE] bg-[#F7F9FC] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Institution scoped
              </span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white sm:text-4xl">
              Live Campus Transport GPS
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085] dark:text-slate-400">
              Track authorised institution vehicles from real device telemetry. Location access follows the signed-in role, linked student and delivery mode; online-only students do not receive transport tracking.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#536175] dark:text-slate-300">
              <span className="rounded-xl border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{data.institutionName}</span>
              <span className="rounded-xl border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{formatRole(data.role)}</span>
              {data.availability.studyMode && <span className="rounded-xl border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-2 dark:border-slate-700 dark:bg-slate-900">{formatRole(data.availability.studyMode)} student</span>}
            </div>
          </div>

          <aside className="border-t border-[#284467] bg-[#101D38] p-5 text-white sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9EBBEE]">Live health</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DarkMetric label="Visible vehicles" value={data.fleet.length} />
              <DarkMetric label="Live now" value={liveCount} />
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={refreshing}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#44658F] bg-[#173052] px-4 text-xs font-extrabold text-white transition hover:bg-[#1C3A63] disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              Refresh live location
            </button>
            <p className="mt-3 text-[11px] leading-5 text-[#AFC0D8]">Auto-refreshes every 8 seconds while GPS tracking is enabled.</p>
          </aside>
        </div>
      </header>

      {!data.settings.gpsTrackingEnabled && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div><p className="text-sm font-extrabold">Live GPS is paused by the institution</p><p className="mt-1 text-xs leading-5">Transport access remains configured, but new device coordinates are not accepted until GPS tracking is enabled again.</p></div>
        </div>
      )}

      {lastError && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-300">{lastError}</div>
      )}

      {!isManagerView && data.riders.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2" aria-label="Student transport assignments">
          {data.riders.map((rider) => (
            <article key={rider.studentId} className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#8A95A6]">Authorised rider</p>
                  <h2 className="mt-2 truncate text-lg font-extrabold text-[#101D38] dark:text-white">{rider.name}</h2>
                  <p className="mt-1 text-xs text-[#667085] dark:text-slate-400">{rider.rollNumber} · {rider.studyMode}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${rider.eligible ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{rider.eligible ? 'Transport eligible' : 'Not eligible'}</span>
              </div>
              <div className="mt-5 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3"><Route className="h-4 w-4 text-[#1754E8]" /><div><p className="text-[10px] font-bold uppercase tracking-wide text-[#8A95A6]">Assigned route</p><p className="mt-1 text-sm font-extrabold text-[#101D38] dark:text-white">{rider.routeName ?? 'No transport route assigned yet'}</p></div></div>
              </div>
            </article>
          ))}
        </section>
      )}

      {data.fleet.length === 0 ? (
        <TransportState icon={Bus} title="No GPS vehicle assigned" text={isManagerView ? 'No active transport vehicle has been enrolled for this institution yet.' : 'Your transport eligibility is active, but no GPS-enabled vehicle is currently assigned to your route.'} compact />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2" aria-label="Live vehicle locations">
          {data.fleet.map((vehicle) => <VehicleTrackerCard key={vehicle.id} vehicle={vehicle} />)}
        </section>
      )}

      {data.role === 'INSTITUTION_ADMIN' && (
        <div className="flex justify-end"><Link href="/transport/admin" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white shadow-sm hover:bg-[#1245C4]">Open Transport Control <ExternalLink className="h-4 w-4" /></Link></div>
      )}
    </section>
  );
}

function VehicleTrackerCard({ vehicle }: { vehicle: TransportVehicle }) {
  const position = vehicle.latestPosition;
  const mapUrl = useMemo(() => {
    if (!position) return null;
    const delta = 0.0045;
    const bbox = [position.longitude - delta, position.latitude - delta, position.longitude + delta, position.latitude + delta].join('%2C');
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${position.latitude}%2C${position.longitude}`;
  }, [position]);
  const externalUrl = position ? `https://www.openstreetmap.org/?mlat=${position.latitude}&mlon=${position.longitude}#map=17/${position.latitude}/${position.longitude}` : null;

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#D8E2EF] bg-white shadow-[0_16px_44px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-4 border-b border-[#E1E7EF] p-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><Bus className="h-5 w-5" /></span>
          <div className="min-w-0"><h2 className="truncate text-lg font-extrabold text-[#101D38] dark:text-white">{vehicle.label}</h2><p className="mt-1 truncate text-xs font-bold text-[#667085] dark:text-slate-400">{vehicle.registrationNumber} · {vehicle.routeName ?? 'Route not assigned'}</p></div>
        </div>
        <span className={`inline-flex self-start items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${position && !position.stale ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}><span className={`h-2 w-2 rounded-full ${position && !position.stale ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />{position ? (position.stale ? 'GPS stale' : 'GPS live') : 'Waiting for GPS'}</span>
      </div>

      {position && mapUrl ? (
        <div className="relative h-[290px] bg-[#E8EDF4] dark:bg-slate-900">
          <iframe title={`${vehicle.label} live GPS map`} src={mapUrl} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer" />
          {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 right-3 inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/80 bg-white/95 px-3 text-xs font-extrabold text-[#1754E8] shadow-lg">Open map <ExternalLink className="h-3.5 w-3.5" /></a>}
        </div>
      ) : (
        <div className="flex h-[220px] flex-col items-center justify-center bg-[#F7F9FC] px-5 text-center dark:bg-slate-900"><MapPin className="h-7 w-7 text-[#8A95A6]" /><p className="mt-3 text-sm font-extrabold text-[#344054] dark:text-slate-200">Waiting for first device location</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#8A95A6]">Once the installed tracker posts GPS telemetry, its latest authorised position will appear here.</p></div>
      )}

      <div className="grid gap-px bg-[#E1E7EF] dark:bg-slate-800 sm:grid-cols-4">
        <VehicleMetric icon={Gauge} label="Speed" value={position?.speedKph === null || position?.speedKph === undefined ? '—' : `${Math.round(position.speedKph)} km/h`} />
        <VehicleMetric icon={Navigation} label="Heading" value={position?.headingDegrees === null || position?.headingDegrees === undefined ? '—' : `${Math.round(position.headingDegrees)}°`} />
        <VehicleMetric icon={Activity} label="Accuracy" value={position?.accuracyMeters === null || position?.accuracyMeters === undefined ? '—' : `±${Math.round(position.accuracyMeters)} m`} />
        <VehicleMetric icon={Clock3} label="Last GPS" value={position ? relativeTime(position.recordedAt) : 'Never'} />
      </div>

      <div className="grid gap-3 p-5 text-xs sm:grid-cols-2 sm:p-6">
        <div className="rounded-xl border border-[#E1E7EF] bg-[#F7F9FC] p-3 dark:border-slate-800 dark:bg-slate-900"><p className="font-bold text-[#8A95A6]">Driver</p><p className="mt-1 font-extrabold text-[#101D38] dark:text-white">{vehicle.driverName || 'Not recorded'}</p></div>
        <div className="rounded-xl border border-[#E1E7EF] bg-[#F7F9FC] p-3 dark:border-slate-800 dark:bg-slate-900"><p className="font-bold text-[#8A95A6]">Coordinates</p><p className="mt-1 font-mono font-bold text-[#101D38] dark:text-white">{position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : '—'}</p></div>
      </div>
    </article>
  );
}

function VehicleMetric({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
  return <div className="bg-white p-4 dark:bg-slate-950"><div className="flex items-center gap-2 text-[#8A95A6]"><Icon className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-wide">{label}</span></div><p className="mt-2 truncate text-sm font-extrabold text-[#101D38] dark:text-white">{value}</p></div>;
}

function DarkMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-[#385477] bg-[#0D1A2E] p-3"><p className="text-[9px] font-extrabold uppercase tracking-wide text-[#92A9C8]">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p></div>;
}

function TransportUnavailable({ data }: { data: TransportWorkspaceData }) {
  const reason = data.availability.reason;
  if (reason === 'ONLINE_ONLY') return <TransportState icon={UsersRound} title="Transport is not required for online-only study" text="Your verified student delivery mode is Online. Campus transport and live vehicle tracking are therefore hidden for this account. If your delivery mode changes, the Institution Admin can update your student profile." />;
  if (reason === 'HYBRID_DISABLED') return <TransportState icon={UsersRound} title="Hybrid transport access is not enabled" text="Your institution currently restricts the transport module to offline students. An Institution Admin can allow hybrid students from Transport Control." />;
  if (reason === 'NOT_OPTED_IN') return <TransportState icon={CheckCircle2} title="Transport is not assigned to this student" text="The student is eligible by delivery mode but is not currently opted into campus transport." />;
  if (reason === 'ROLE_NOT_SUPPORTED') return <TransportState icon={ShieldCheck} title="Transport tracking is not available for this role" text="Live vehicle location is limited to authorised riders, linked guardians and institution transport operators." />;
  return <TransportState icon={Bus} title="Transport GPS is disabled for this institution" text="This university has not enabled the optional transport tracking module. It will stay hidden from student dashboards until an Institution Admin turns it on." />;
}

function TransportState({ icon: Icon, title, text, compact = false }: { icon: typeof Bus; title: string; text: string; compact?: boolean }) {
  return <section className={`rounded-[26px] border border-[#D8E2EF] bg-white text-center shadow-[0_14px_40px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 ${compact ? 'p-7' : 'p-8 sm:p-12'}`}><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><Icon className="h-6 w-6" /></span><h1 className="mt-5 text-xl font-extrabold text-[#101D38] dark:text-white sm:text-2xl">{title}</h1><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#667085] dark:text-slate-400">{text}</p></section>;
}

function formatRole(value: string) {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}
