'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  KeyRound,
  MapPin,
  Plus,
  Radio,
  Route,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';

import type { StudentStudyMode, TransportAdminData } from '@/lib/transport-gps-types';

type AdminStudent = TransportAdminData['students'][number];

export function TransportAdminConsole({ data }: { data: TransportAdminData }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'ALL' | StudentStudyMode>('ALL');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ label: '', registrationNumber: '', routeId: '', driverName: '', driverPhone: '' });
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.students.filter((student) => {
      const matchesMode = mode === 'ALL' || student.studyMode === mode;
      const matchesSearch = !normalized || [student.name, student.email, student.rollNumber, student.programme, student.section]
        .some((value) => value?.toLowerCase().includes(normalized));
      return matchesMode && matchesSearch;
    });
  }, [data.students, mode, query]);

  async function patchSettings(patch: Record<string, boolean | number>) {
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const response = await fetch('/api/transport/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to update transport settings.');
      router.refresh();
    } catch (error) {
      setSettingsError(error instanceof Error ? error.message : 'Unable to update transport settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function createVehicle(event: React.FormEvent) {
    event.preventDefault();
    setVehicleSaving(true);
    setVehicleError(null);
    setDeviceToken(null);
    try {
      const response = await fetch('/api/transport/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: vehicleForm.label,
          registrationNumber: vehicleForm.registrationNumber,
          routeId: vehicleForm.routeId || null,
          driverName: vehicleForm.driverName || null,
          driverPhone: vehicleForm.driverPhone || null,
        }),
      });
      const payload = await response.json().catch(() => null) as { error?: string; vehicle?: { deviceToken?: string } } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to create vehicle.');
      setDeviceToken(payload?.vehicle?.deviceToken ?? null);
      setVehicleForm({ label: '', registrationNumber: '', routeId: '', driverName: '', driverPhone: '' });
      router.refresh();
    } catch (error) {
      setVehicleError(error instanceof Error ? error.message : 'Unable to create vehicle.');
    } finally {
      setVehicleSaving(false);
    }
  }

  if (!data.storeReady) {
    return (
      <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-7 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100 sm:p-10">
        <AlertTriangle className="h-8 w-8" />
        <h1 className="mt-5 text-2xl font-extrabold">Transport GPS storage is not provisioned</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7">Run the normal CampusOS database preparation step. It provisions the optional transport schema without enabling GPS for the institution; you can opt in here afterward.</p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6" aria-label="Institution Transport Control">
      <header className="overflow-hidden rounded-[28px] border border-[#D8E2EF] bg-white shadow-[0_18px_54px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,0.6fr)]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9D8EE] bg-[#EDF3FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Institution Admin only
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white sm:text-4xl">Transport GPS Control</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085] dark:text-slate-400">Enable the optional transport module, classify Online / Offline / Hybrid students, assign eligible riders to routes and GPS vehicles, and manage real tracker credentials for {data.institutionName}.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill ok={data.settings.enabled} label={data.settings.enabled ? 'Student transport visible' : 'Student transport hidden'} />
              <StatusPill ok={data.settings.gpsTrackingEnabled} label={data.settings.gpsTrackingEnabled ? 'GPS ingestion active' : 'GPS ingestion paused'} />
            </div>
          </div>
          <aside className="border-t border-[#284467] bg-[#101D38] p-5 text-white sm:p-7 xl:border-l xl:border-t-0 xl:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9EBBEE]">Operational snapshot</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <DarkMetric label="Eligible riders" value={data.metrics.eligibleStudents} />
              <DarkMetric label="Assigned riders" value={data.metrics.assignedStudents} />
              <DarkMetric label="Vehicles" value={data.metrics.vehicles} />
              <DarkMetric label="Live GPS" value={data.metrics.liveVehicles} />
            </div>
            <Link href="/transport" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#44658F] bg-[#173052] px-4 text-xs font-extrabold text-white hover:bg-[#1C3A63]">Open live fleet <ExternalLink className="h-4 w-4" /></Link>
          </aside>
        </div>
      </header>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeader icon={Settings2} eyebrow="Institution feature gate" title="Transport availability" description="No row means opt-out. Only an Institution Admin can turn this module on for this university." />
        {settingsError && <ErrorBox text={settingsError} />}
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <SettingCard
            title="Enable transport module"
            description="Show Transport to eligible offline/hybrid students, linked parents and the Transport Manager."
            checked={data.settings.enabled}
            disabled={savingSettings}
            onChange={(checked) => void patchSettings({ enabled: checked })}
          />
          <SettingCard
            title="Accept live GPS telemetry"
            description="Pause this to stop all vehicle devices from submitting new positions without deleting assignments."
            checked={data.settings.gpsTrackingEnabled}
            disabled={savingSettings}
            onChange={(checked) => void patchSettings({ gpsTrackingEnabled: checked })}
          />
          <SettingCard
            title="Allow hybrid students"
            description="When off, hybrid students are treated as transport-ineligible; offline students remain eligible."
            checked={data.settings.allowHybridStudents}
            disabled={savingSettings}
            onChange={(checked) => void patchSettings({ allowHybridStudents: checked })}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
          <label className="min-w-[220px] flex-1 text-xs font-extrabold text-[#344054] dark:text-slate-200">GPS stale after
            <select
              value={data.settings.telemetryStaleSeconds}
              disabled={savingSettings}
              onChange={(event) => void patchSettings({ telemetryStaleSeconds: Number(event.target.value) })}
              className="mt-2 min-h-11 w-full rounded-xl border border-[#CBD7E6] bg-white px-3 text-sm font-bold text-[#101D38] outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value={60}>1 minute</option><option value={120}>2 minutes</option><option value={180}>3 minutes</option><option value={300}>5 minutes</option><option value={600}>10 minutes</option>
            </select>
          </label>
          <p className="max-w-xl text-xs leading-5 text-[#667085] dark:text-slate-400">Vehicles older than this threshold remain visible but are clearly marked stale; stale telemetry is never presented as live.</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Student delivery modes">
        <MetricCard label="All students" value={data.metrics.totalStudents} detail="Institution student records" />
        <MetricCard label="Offline" value={data.metrics.offlineStudents} detail="Eligible when transport opted in" />
        <MetricCard label="Hybrid" value={data.metrics.hybridStudents} detail={data.settings.allowHybridStudents ? 'Eligible when opted in' : 'Currently transport restricted'} />
        <MetricCard label="Online" value={data.metrics.onlineStudents} detail="Transport always hidden" />
      </section>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeader icon={Bus} eyebrow="Fleet provisioning" title="Enroll a GPS vehicle" description="CampusOS generates a unique device credential. The raw token is shown once and only its SHA-256 hash is stored." />
        {vehicleError && <ErrorBox text={vehicleError} />}
        {deviceToken && <DeviceTokenBox token={deviceToken} />}
        <form onSubmit={createVehicle} className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Vehicle label"><input required value={vehicleForm.label} onChange={(e) => setVehicleForm((v) => ({ ...v, label: e.target.value }))} placeholder="Bus 04" className={inputClass} /></Field>
          <Field label="Registration"><input required value={vehicleForm.registrationNumber} onChange={(e) => setVehicleForm((v) => ({ ...v, registrationNumber: e.target.value }))} placeholder="UP32 AB 1234" className={inputClass} /></Field>
          <Field label="Route"><select value={vehicleForm.routeId} onChange={(e) => setVehicleForm((v) => ({ ...v, routeId: e.target.value }))} className={inputClass}><option value="">Unassigned route</option>{data.routes.map((route) => <option key={route.id} value={route.id}>{route.routeName}</option>)}</select></Field>
          <Field label="Driver"><input value={vehicleForm.driverName} onChange={(e) => setVehicleForm((v) => ({ ...v, driverName: e.target.value }))} placeholder="Driver name" className={inputClass} /></Field>
          <div className="flex items-end"><button type="submit" disabled={vehicleSaving} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white hover:bg-[#1245C4] disabled:opacity-60"><Plus className="h-4 w-4" />{vehicleSaving ? 'Creating…' : 'Enroll vehicle'}</button></div>
        </form>
        <div className="mt-5 rounded-2xl border border-[#D6E1EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-extrabold text-[#101D38] dark:text-white">Device webhook contract</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[#101D38] p-4 text-[11px] leading-5 text-[#D5E4FF]">{`POST /api/transport/gps/ingest\nAuthorization: Bearer <device-token>\nContent-Type: application/json\n\n{\n  "latitude": 26.8467,\n  "longitude": 80.9462,\n  "speedKph": 34.2,\n  "headingDegrees": 92,\n  "accuracyMeters": 8,\n  "recordedAt": "2026-08-08T01:50:00+05:30"\n}`}</pre>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeader icon={UsersRound} eyebrow="Eligibility & assignment" title="Student transport configuration" description="Online students are automatically excluded. Offline and permitted Hybrid students can be opted in and assigned to an institution route and vehicle." />
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A95A6]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, roll number, programme or email" className={`${inputClass} pl-10`} /></label>
          <label className="relative min-w-[190px]"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A95A6]" /><select value={mode} onChange={(e) => setMode(e.target.value as 'ALL' | StudentStudyMode)} className={`${inputClass} pl-10`}><option value="ALL">All delivery modes</option><option value="OFFLINE">Offline</option><option value="HYBRID">Hybrid</option><option value="ONLINE">Online</option></select></label>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-[#E1E7EF] dark:border-slate-800">
          <table className="min-w-[1080px] w-full border-collapse text-left">
            <thead className="bg-[#F7F9FC] dark:bg-slate-900"><tr className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#7C899B]"><th className="px-4 py-3">Student</th><th className="px-4 py-3">Delivery mode</th><th className="px-4 py-3">Transport</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">GPS vehicle</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-[#E8EDF4] dark:divide-slate-800">
              {filteredStudents.map((student) => <StudentTransportRow key={`${student.studentId}-${student.studyMode}-${student.routeId}-${student.vehicleId}-${student.transportOptIn}`} student={student} routes={data.routes} fleet={data.fleet} allowHybrid={data.settings.allowHybridStudents} />)}
            </tbody>
          </table>
          {filteredStudents.length === 0 && <div className="p-8 text-center text-sm font-bold text-[#667085] dark:text-slate-400">No students match this filter.</div>}
        </div>
      </section>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeader icon={Radio} eyebrow="Fleet health" title="GPS device status" description="A vehicle is live only when its latest telemetry is inside the configured freshness window." />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.fleet.map((vehicle) => <div key={vehicle.id} className="rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">{vehicle.label}</p><p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">{vehicle.registrationNumber} · {vehicle.routeName ?? 'No route'}</p></div><StatusPill ok={Boolean(vehicle.latestPosition && !vehicle.latestPosition.stale)} label={vehicle.latestPosition ? (vehicle.latestPosition.stale ? 'Stale' : 'Live') : 'No GPS'} /></div><p className="mt-3 text-xs text-[#8A95A6]">Last seen: {vehicle.lastSeenAt ? new Date(vehicle.lastSeenAt).toLocaleString() : 'Never'}</p></div>)}
          {data.fleet.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-[#CBD7E6] p-7 text-center text-sm text-[#667085] dark:border-slate-700 dark:text-slate-400">No GPS vehicles enrolled.</div>}
        </div>
      </section>
    </section>
  );
}

function StudentTransportRow({ student, routes, fleet, allowHybrid }: { student: AdminStudent; routes: TransportAdminData['routes']; fleet: TransportAdminData['fleet']; allowHybrid: boolean }) {
  const router = useRouter();
  const [studyMode, setStudyMode] = useState<StudentStudyMode>(student.studyMode);
  const [optIn, setOptIn] = useState(student.transportOptIn);
  const [routeId, setRouteId] = useState(student.routeId ?? '');
  const [vehicleId, setVehicleId] = useState(student.vehicleId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eligibleByMode = studyMode !== 'ONLINE' && (studyMode !== 'HYBRID' || allowHybrid);
  const candidateVehicles = fleet.filter((vehicle) => !routeId || !vehicle.routeId || vehicle.routeId === routeId);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/transport/admin/students/${student.studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studyMode, transportOptIn: eligibleByMode ? optIn : false, routeId: eligibleByMode && optIn ? routeId || null : null, vehicleId: eligibleByMode && optIn ? vehicleId || null : null }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to save student transport settings.');
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save student transport settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="align-top bg-white dark:bg-slate-950">
      <td className="px-4 py-4"><p className="max-w-[230px] truncate text-sm font-extrabold text-[#101D38] dark:text-white">{student.name}</p><p className="mt-1 max-w-[230px] truncate text-[11px] text-[#667085]">{student.rollNumber} · {student.programme}{student.section ? ` · ${student.section}` : ''}</p>{error && <p className="mt-2 max-w-[250px] text-[10px] font-bold text-rose-600">{error}</p>}</td>
      <td className="px-4 py-4"><select value={studyMode} onChange={(e) => { const next = e.target.value as StudentStudyMode; setStudyMode(next); if (next === 'ONLINE') { setOptIn(false); setRouteId(''); setVehicleId(''); } }} className={`${inputClass} min-w-[130px]`}><option value="OFFLINE">Offline</option><option value="HYBRID">Hybrid</option><option value="ONLINE">Online</option></select>{studyMode === 'HYBRID' && !allowHybrid && <p className="mt-1 text-[10px] font-bold text-amber-700">Hybrid disabled institution-wide</p>}</td>
      <td className="px-4 py-4"><label className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-extrabold ${eligibleByMode ? 'border-[#CBD7E6] bg-white text-[#344054]' : 'border-slate-200 bg-slate-50 text-slate-400'}`}><input type="checkbox" checked={eligibleByMode && optIn} disabled={!eligibleByMode} onChange={(e) => { setOptIn(e.target.checked); if (!e.target.checked) { setRouteId(''); setVehicleId(''); } }} />{eligibleByMode ? 'Required' : 'Not applicable'}</label></td>
      <td className="px-4 py-4"><select value={eligibleByMode && optIn ? routeId : ''} disabled={!eligibleByMode || !optIn} onChange={(e) => { setRouteId(e.target.value); setVehicleId(''); }} className={`${inputClass} min-w-[190px]`}><option value="">No route</option>{routes.map((route) => <option key={route.id} value={route.id}>{route.routeName}</option>)}</select></td>
      <td className="px-4 py-4"><select value={eligibleByMode && optIn ? vehicleId : ''} disabled={!eligibleByMode || !optIn} onChange={(e) => setVehicleId(e.target.value)} className={`${inputClass} min-w-[170px]`}><option value="">No vehicle</option>{candidateVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.label} · {vehicle.registrationNumber}</option>)}</select></td>
      <td className="px-4 py-4 text-right"><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#101D38] px-3 text-xs font-extrabold text-white hover:bg-[#172A4B] disabled:opacity-60"><Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : 'Save'}</button></td>
    </tr>
  );
}

function DeviceTokenBox({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(token); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 shrink-0" /><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Save this GPS device token now</p><p className="mt-1 text-xs leading-5">CampusOS stores only its hash. This token will not be recoverable later.</p><code className="mt-3 block overflow-x-auto rounded-xl bg-white p-3 text-xs font-bold text-[#101D38] dark:bg-slate-950 dark:text-white">{token}</code></div><button type="button" onClick={() => void copy()} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 text-xs font-extrabold text-amber-900"><Copy className="h-3.5 w-3.5" />{copied ? 'Copied' : 'Copy'}</button></div></div>;
}

function SettingCard({ title, description, checked, disabled, onChange }: { title: string; description: string; checked: boolean; disabled: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex min-h-36 cursor-pointer items-start gap-4 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900"><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#101D38] dark:text-white">{title}</span><span className="mt-2 block text-xs leading-5 text-[#667085] dark:text-slate-400">{description}</span></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 accent-[#1754E8]" /></label>;
}

function SectionHeader({ icon: Icon, eyebrow, title, description }: { icon: typeof Settings2; eyebrow: string; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300"><Icon className="h-5 w-5" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#8A95A6]">{eyebrow}</p><h2 className="mt-1 text-lg font-extrabold text-[#101D38] dark:text-white">{title}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[#667085] dark:text-slate-400">{description}</p></div></div>;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) { return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-400'}`} />{label}</span>; }
function DarkMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-[#385477] bg-[#0D1A2E] p-3"><p className="text-[9px] font-extrabold uppercase tracking-wide text-[#92A9C8]">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p></div>; }
function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) { return <div className="rounded-[20px] border border-[#D8E2EF] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A95A6]">{label}</p><p className="mt-3 text-2xl font-extrabold text-[#101D38] dark:text-white">{value}</p><p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{detail}</p></div>; }
function ErrorBox({ text }: { text: string }) { return <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{text}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-xs font-extrabold text-[#344054] dark:text-slate-200">{label}<span className="mt-2 block">{children}</span></label>; }

const inputClass = 'min-h-11 w-full rounded-xl border border-[#CBD7E6] bg-white px-3 text-sm font-semibold text-[#101D38] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/10 disabled:bg-slate-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900';
