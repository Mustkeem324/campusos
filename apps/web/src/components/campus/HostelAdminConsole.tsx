'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  Building2,
  Check,
  Copy,
  CreditCard,
  DatabaseZap,
  KeyRound,
  Network,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import type { HostelModuleSettings, HostelStudentSummary, StudentStudyMode } from '@/lib/hostel-types';

type Provider = { id: string; name: string; external_code: string | null; enabled: boolean; last_sync_at: string | Date | null };
type Facility = { id: string; name: string; building: string | null; address: string | null; ownership: 'INSTITUTION' | 'THIRD_PARTY'; provider_id: string | null; provider_name: string | null; active: boolean };
type Room = { id: string; facility_id: string; room_number: string; floor_label: string | null; capacity: number; active: boolean; occupied: number };
type HostelAdminData = {
  settings: HostelModuleSettings;
  metrics: {
    totalStudents: number; unclassifiedStudents: number; onlineStudents: number; offlineStudents: number; hybridStudents: number;
    eligibleStudents: number; activeResidents: number; thirdPartyResidents: number; pendingOutpasses: number; outstandingAmount: number;
  };
  students: HostelStudentSummary[];
  providers: Provider[];
  facilities: Facility[];
  rooms: Room[];
};

export function HostelAdminConsole({ initialData }: { initialData: HostelAdminData }) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [facilityBuilding, setFacilityBuilding] = useState('');
  const [facilityOwnership, setFacilityOwnership] = useState<'INSTITUTION' | 'THIRD_PARTY'>('INSTITUTION');
  const [facilityProvider, setFacilityProvider] = useState('');
  const [roomFacility, setRoomFacility] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('2');
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');

  const action = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/hostel/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Hostel action failed.');
      setMessage('Saved successfully.');
      if (payload.action === 'provider' && body.result?.deviceToken) setProviderToken(body.result.deviceToken);
      return body.result;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Hostel action failed.');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async (patch: Partial<HostelModuleSettings>) => {
    const result = await action({ action: 'settings', ...patch });
    if (result) setData((current) => ({ ...current, settings: result }));
  };

  const filteredStudents = useMemo(() => data.students.filter((student) => {
    const matchesMode = modeFilter === 'ALL' || student.studyMode === modeFilter;
    const needle = query.trim().toLowerCase();
    return matchesMode && (!needle || `${student.studentName} ${student.rollNumber}`.toLowerCase().includes(needle));
  }), [data.students, modeFilter, query]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D9E3F0] bg-[#101D38] p-5 text-white shadow-[0_8px_26px_rgba(16,29,56,0.12)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1754E8]"><Building2 className="h-5 w-5" /></span><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-extrabold tracking-tight">Hostel Control</h1><span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${data.settings.enabled ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-slate-300'}`}>{data.settings.enabled ? 'Enabled' : 'Disabled'}</span></div><p className="mt-1 max-w-3xl text-xs leading-5 text-[#BAC9DE]">Institution-owned and third-party accommodation, Online/Offline/Hybrid eligibility, room allocation, provider sync, payments, outpass governance and resident welfare.</p></div></div>
          <div className="flex flex-wrap gap-2"><Link href="/hostel" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-extrabold text-white">Open operations <ArrowRight className="h-3.5 w-3.5" /></Link><button onClick={() => window.location.reload()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#101D38]"><RefreshCw className="h-3.5 w-3.5" />Reload</button></div>
        </div>
      </section>

      {message && <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${message === 'Saved successfully.' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{message}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric icon={UsersRound} label="Students" value={data.metrics.totalStudents} />
        <Metric icon={ShieldCheck} label="Eligible" value={data.metrics.eligibleStudents} />
        <Metric icon={BedDouble} label="Residents" value={data.metrics.activeResidents} />
        <Metric icon={Network} label="Third-party" value={data.metrics.thirdPartyResidents} />
        <Metric icon={DatabaseZap} label="Unclassified" value={data.metrics.unclassifiedStudents} />
        <Metric icon={CreditCard} label="Outstanding" value={money(data.metrics.outstandingAmount, data.settings.currency)} />
      </div>

      <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
        <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-[#1754E8]" /><h2 className="font-extrabold text-[#101D38]">Module policy</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Toggle label="Hostel module" detail="Show hostel only to eligible roles/students." checked={data.settings.enabled} onChange={(enabled) => void saveSettings({ enabled })} />
          <Toggle label="Hybrid students" detail="Allow Hybrid students to use hostel services." checked={data.settings.allowHybridStudents} onChange={(allowHybridStudents) => void saveSettings({ allowHybridStudents })} />
          <Toggle label="Parent approval" detail="Require guardian consent for outpass." checked={data.settings.requireParentOutpassApproval} onChange={(requireParentOutpassApproval) => void saveSettings({ requireParentOutpassApproval })} />
          <Toggle label="Warden approval" detail="Require warden consent for outpass." checked={data.settings.requireWardenOutpassApproval} onChange={(requireWardenOutpassApproval) => void saveSettings({ requireWardenOutpassApproval })} />
          <Toggle label="Faculty welfare view" detail="Faculty sees residence/leave welfare only, never finance/room details." checked={data.settings.facultyWelfareVisibility} onChange={(facultyWelfareVisibility) => void saveSettings({ facultyWelfareVisibility })} />
          <Toggle label="Provider sync" detail="Allow authenticated third-party hostel server sync." checked={data.settings.thirdPartySyncEnabled} onChange={(thirdPartySyncEnabled) => void saveSettings({ thirdPartySyncEnabled })} />
          <label className="rounded-xl border border-[#E1E7EF] p-4"><span className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#667085]">Operating model</span><select value={data.settings.ownershipMode} onChange={(event) => void saveSettings({ ownershipMode: event.target.value as HostelModuleSettings['ownershipMode'] })} className="mt-3 min-h-10 w-full rounded-lg border border-[#D5DEEA] px-3 text-sm"><option value="INSTITUTION">Institution owned</option><option value="THIRD_PARTY">Third-party</option><option value="MIXED">Mixed</option></select></label>
          <label className="rounded-xl border border-[#E1E7EF] p-4"><span className="text-[11px] font-extrabold uppercase tracking-[0.07em] text-[#667085]">Currency</span><input defaultValue={data.settings.currency} maxLength={3} onBlur={(event) => { const value = event.target.value.trim().toUpperCase(); if (value.length === 3 && value !== data.settings.currency) void saveSettings({ currency: value }); }} className="mt-3 min-h-10 w-full rounded-lg border border-[#D5DEEA] px-3 text-sm uppercase" /></label>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
          <div className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-[#1754E8]" /><h2 className="font-extrabold text-[#101D38]">Third-party provider connection</h2></div>
          <p className="mt-1 text-xs leading-5 text-[#667085]">Create a one-time server credential. Providers submit tenant-scoped resident and charge snapshots to <code className="rounded bg-[#F2F4F7] px-1 py-0.5">POST /api/hostel/provider/sync</code>.</p>
          <div className="mt-4 flex gap-2"><input value={providerName} onChange={(event) => setProviderName(event.target.value)} placeholder="Provider name" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><button disabled={busy || !providerName.trim()} onClick={async () => { const result = await action({ action: 'provider', name: providerName }); if (result) setProviderName(''); }} className="min-h-11 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white disabled:opacity-50"><Plus className="mr-1 inline h-3.5 w-3.5" />Connect</button></div>
          {providerToken && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-extrabold text-amber-900">Copy this provider secret now — only its SHA-256 hash is stored.</p><div className="mt-2 flex items-center gap-2"><code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 text-[11px] text-[#344054]">{providerToken}</code><button onClick={() => void navigator.clipboard.writeText(providerToken)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white"><Copy className="h-4 w-4" /></button></div></div>}
          <div className="mt-4 space-y-2">{data.providers.map((provider) => <div key={provider.id} className="rounded-xl border border-[#E1E7EF] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[#24324A]">{provider.name}</p><p className="mt-1 text-[11px] text-[#7A8799]">Last sync: {provider.last_sync_at ? new Date(provider.last_sync_at).toLocaleString() : 'Never'}</p></div><Status value={provider.enabled ? 'ACTIVE' : 'DISABLED'} /></div></div>)}</div>
        </section>

        <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
          <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-[#1754E8]" /><h2 className="font-extrabold text-[#101D38]">Facilities & rooms</h2></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><input value={facilityName} onChange={(event) => setFacilityName(event.target.value)} placeholder="Facility name" className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><input value={facilityBuilding} onChange={(event) => setFacilityBuilding(event.target.value)} placeholder="Building / block" className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><select value={facilityOwnership} onChange={(event) => setFacilityOwnership(event.target.value as typeof facilityOwnership)} className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value="INSTITUTION">Institution owned</option><option value="THIRD_PARTY">Third-party</option></select><select value={facilityProvider} onChange={(event) => setFacilityProvider(event.target.value)} disabled={facilityOwnership !== 'THIRD_PARTY'} className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm disabled:bg-slate-50"><option value="">Provider</option>{data.providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}</select></div>
          <button disabled={busy || !facilityName.trim() || (facilityOwnership === 'THIRD_PARTY' && !facilityProvider)} onClick={async () => { const result = await action({ action: 'facility', name: facilityName, building: facilityBuilding || null, ownership: facilityOwnership, providerId: facilityOwnership === 'THIRD_PARTY' ? facilityProvider : null }); if (result) window.location.reload(); }} className="mt-3 min-h-10 rounded-xl bg-[#101D38] px-4 text-xs font-extrabold text-white disabled:opacity-50">Add facility</button>

          <div className="mt-5 border-t border-[#EDF0F4] pt-5"><p className="text-xs font-extrabold text-[#344054]">Add room</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><select value={roomFacility} onChange={(event) => setRoomFacility(event.target.value)} className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value="">Facility</option>{data.facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</select><input value={roomNumber} onChange={(event) => setRoomNumber(event.target.value)} placeholder="Room no." className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><input type="number" min="1" max="20" value={roomCapacity} onChange={(event) => setRoomCapacity(event.target.value)} placeholder="Capacity" className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm" /></div><button disabled={busy || !roomFacility || !roomNumber.trim()} onClick={async () => { const result = await action({ action: 'room', facilityId: roomFacility, roomNumber, capacity: Number(roomCapacity) }); if (result) window.location.reload(); }} className="mt-3 min-h-10 rounded-xl border border-[#C8D6EA] px-4 text-xs font-extrabold text-[#1754E8] disabled:opacity-50">Add room</button></div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-[#1754E8]" /><h2 className="font-extrabold text-[#101D38]">Student hostel eligibility & allocation</h2></div><p className="mt-1 text-xs text-[#667085]">Online students are forced out of hostel enrollment. Offline students are eligible. Hybrid follows the institution toggle.</p></div><div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or roll number" className="min-h-10 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} className="min-h-10 rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value="ALL">All modes</option><option value="UNCLASSIFIED">Unclassified</option><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option><option value="HYBRID">Hybrid</option></select></div></div>
        <div className="mt-4 space-y-3">{filteredStudents.slice(0, 100).map((student) => <StudentEditor key={student.studentId} student={student} facilities={data.facilities} rooms={data.rooms} busy={busy} action={action} />)}</div>
      </section>
    </div>
  );
}

function StudentEditor({ student, facilities, rooms, busy, action }: { student: HostelStudentSummary; facilities: Facility[]; rooms: Room[]; busy: boolean; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [mode, setMode] = useState<StudentStudyMode>(student.studyMode === 'UNCLASSIFIED' ? 'OFFLINE' : student.studyMode);
  const [enrolled, setEnrolled] = useState(student.enrolled);
  const [facilityId, setFacilityId] = useState(() => facilities.find((facility) => facility.name === student.allocation?.facilityName)?.id ?? '');
  const [roomId, setRoomId] = useState(() => rooms.find((room) => room.facility_id === facilityId && room.room_number === student.allocation?.roomNumber)?.id ?? '');
  const eligible = mode !== 'ONLINE';
  return <div className="grid gap-3 rounded-xl border border-[#E1E7EF] p-4 xl:grid-cols-[minmax(220px,1.2fr)_150px_140px_minmax(180px,1fr)_minmax(150px,0.8fr)_90px] xl:items-end"><div><p className="text-sm font-extrabold text-[#24324A]">{student.studentName}</p><p className="mt-1 text-[11px] text-[#7A8799]">{student.rollNumber} · Current: {student.studyMode}{student.allocation ? ` · ${student.allocation.facilityName}` : ''}</p></div><Field label="Study mode"><select value={mode} onChange={(event) => { const next = event.target.value as StudentStudyMode; setMode(next); if (next === 'ONLINE') setEnrolled(false); }} className="min-h-10 w-full rounded-lg border border-[#D5DEEA] px-2 text-xs"><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option><option value="HYBRID">Hybrid</option></select></Field><Field label="Hostel"><select value={enrolled ? 'YES' : 'NO'} disabled={!eligible} onChange={(event) => setEnrolled(event.target.value === 'YES')} className="min-h-10 w-full rounded-lg border border-[#D5DEEA] px-2 text-xs disabled:bg-slate-50"><option value="NO">Not enrolled</option><option value="YES">Enrolled</option></select></Field><Field label="Facility"><select value={facilityId} disabled={!enrolled} onChange={(event) => { setFacilityId(event.target.value); setRoomId(''); }} className="min-h-10 w-full rounded-lg border border-[#D5DEEA] px-2 text-xs disabled:bg-slate-50"><option value="">Select facility</option>{facilities.filter((facility) => facility.active).map((facility) => <option key={facility.id} value={facility.id}>{facility.name} · {facility.ownership === 'THIRD_PARTY' ? 'Partner' : 'Owned'}</option>)}</select></Field><Field label="Room"><select value={roomId} disabled={!enrolled || !facilityId} onChange={(event) => setRoomId(event.target.value)} className="min-h-10 w-full rounded-lg border border-[#D5DEEA] px-2 text-xs disabled:bg-slate-50"><option value="">Unassigned</option>{rooms.filter((room) => room.facility_id === facilityId && room.active).map((room) => <option key={room.id} value={room.id} disabled={room.occupied >= room.capacity}>{room.room_number} · {room.occupied}/{room.capacity}</option>)}</select></Field><button disabled={busy} onClick={() => void action({ action: 'student', studentId: student.studentId, studyMode: mode, hostelEnrolled: eligible && enrolled, facilityId: eligible && enrolled && facilityId ? facilityId : null, roomId: eligible && enrolled && roomId ? roomId : null })} className="min-h-10 rounded-lg bg-[#1754E8] px-3 text-xs font-extrabold text-white disabled:opacity-50"><Check className="mr-1 inline h-3.5 w-3.5" />Save</button></div>;
}

function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" onClick={() => onChange(!checked)} className={`text-left rounded-xl border p-4 transition ${checked ? 'border-[#B9CDF0] bg-[#F1F5FF]' : 'border-[#E1E7EF] bg-white'}`}><div className="flex items-center justify-between gap-3"><span className="text-sm font-extrabold text-[#24324A]">{label}</span><span className={`relative h-6 w-11 rounded-full ${checked ? 'bg-[#1754E8]' : 'bg-[#CBD5E1]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} /></span></div><p className="mt-2 text-[11px] leading-5 text-[#667085]">{detail}</p></button>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#7A8799]">{label}</span>{children}</label>; }
function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) { return <div className="rounded-xl border border-[#D9E3F0] bg-white p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A8799]">{label}</p><Icon className="h-4 w-4 text-[#1754E8]" /></div><p className="mt-3 text-lg font-extrabold text-[#101D38]">{value}</p></div>; }
function Status({ value }: { value: string }) { return <span className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase ${value === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{value}</span>; }
function money(value: number, currency: string) { try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); } catch { return `${currency} ${value.toFixed(0)}`; } }
