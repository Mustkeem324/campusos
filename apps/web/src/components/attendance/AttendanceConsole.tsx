'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UsersRound,
  X,
} from 'lucide-react';

import type {
  AttendanceClass,
  AttendanceFacultySession,
  AttendanceMarkStatus,
  AttendanceStudentView,
  AttendanceWorkspace,
} from '@/lib/smart-attendance-types';

export function AttendanceConsole({ initialData }: { initialData: AttendanceWorkspace }) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [faceTarget, setFaceTarget] = useState<{ kind: 'DAY' | 'CLASS'; slotId?: string } | null>(null);

  const reload = async () => {
    try {
      const response = await fetch('/api/attendance/workspace', { cache: 'no-store' });
      if (response.ok) setData(await response.json());
    } catch { /* keep last safe snapshot */ }
  };

  useEffect(() => {
    const timer = window.setInterval(() => void reload(), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const student = data.student;
  const isStudent = data.role === 'STUDENT';
  const canManageCalendar = data.role === 'INSTITUTION_ADMIN' || data.role === 'REGISTRAR';

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#D9E3F0] bg-[#101D38] p-5 text-white shadow-[0_8px_28px_rgba(16,29,56,0.12)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1754E8]"><UserCheck className="h-5 w-5" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">Smart Attendance</h1>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-emerald-200">Timetable verified</span>
              </div>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-[#BAC9DE]">
                Online per-class Face ID • Offline faculty marking or one daily Face ID presence • Institute calendar • {data.settings.requiredPercentage}% eligibility threshold
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageCalendar && <Link href="/attendance/admin" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#101D38]">Attendance control <ArrowRight className="h-3.5 w-3.5" /></Link>}
            <button onClick={() => void reload()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-extrabold"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
          </div>
        </div>
      </section>

      {!data.settings.storeReady && <Notice tone="warning" title="Attendance storage is not provisioned" detail="Run the standard NAVEMORA database preparation before using timetable attendance." />}
      {message && <Notice tone={message.startsWith('Error:') ? 'danger' : 'success'} title={message.startsWith('Error:') ? 'Attendance action failed' : 'Attendance updated'} detail={message.replace(/^Error:\s*/, '')} />}

      {isStudent && student && (
        <StudentAttendance
          student={student}
          threshold={data.settings.requiredPercentage}
          busy={busy}
          onFace={(target) => setFaceTarget(target)}
          onCheckout={async (kind, sessionId) => {
            setBusy(true); setMessage(null);
            try {
              const response = await fetch('/api/attendance/self/check-out', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kind === 'CLASS' ? { kind, sessionId } : { kind }),
              });
              const body = await response.json();
              if (!response.ok) throw new Error(body.error || 'Checkout failed.');
              setMessage(kind === 'DAY' ? 'Today’s attendance is completed and checkout time is recorded.' : 'Class checkout time recorded.');
              await reload();
            } catch (error) { setMessage(`Error: ${error instanceof Error ? error.message : 'Checkout failed.'}`); }
            finally { setBusy(false); }
          }}
        />
      )}

      {data.role === 'FACULTY' && (
        <FacultyAttendance sessions={data.facultySessions} busy={busy} onBusy={setBusy} onMessage={setMessage} reload={reload} />
      )}

      {data.institutionMetrics && <OversightMetrics data={data} />}

      {data.role === 'PARENT' && (
        <Notice tone="neutral" title="Guardian attendance view" detail="Attendance remains restricted to verified linked-student records. Linked ward summaries continue to be available through the guardian dashboard while the new timetable engine is activated for the institution." />
      )}

      {faceTarget && student && (
        <FaceCaptureDialog
          target={faceTarget}
          onClose={() => setFaceTarget(null)}
          onSuccess={async (text) => {
            setFaceTarget(null);
            setMessage(text);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function StudentAttendance({ student, threshold, busy, onFace, onCheckout }: {
  student: AttendanceStudentView;
  threshold: number;
  busy: boolean;
  onFace: (target: { kind: 'DAY' | 'CLASS'; slotId?: string }) => void;
  onCheckout: (kind: 'DAY' | 'CLASS', sessionId?: string) => Promise<void>;
}) {
  const dailyMode = student.studyMode === 'OFFLINE' || student.studyMode === 'HYBRID';
  const shortageCount = student.summaries.filter((summary) => summary.shortage).length;

  return <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Study mode" value={student.studyMode} icon={ShieldCheck} />
      <Metric label="Today’s classes" value={student.todayClasses.length} icon={CalendarDays} />
      <Metric label="Below threshold" value={shortageCount} icon={AlertTriangle} />
      <Metric label="Required" value={`${threshold}%`} icon={BadgeCheck} />
    </div>

    {student.calendarDay && !['WORKING','SPECIAL_WORKING'].includes(student.calendarDay.type) && (
      <Notice tone="neutral" title={student.calendarDay.title} detail={`Institute calendar marks today as ${student.calendarDay.type.replace(/_/g, ' ').toLowerCase()}. Attendance self check-in is closed.`} />
    )}

    {!student.faceReady && (
      <Notice tone="warning" title="Face ID setup required" detail={student.faceConsent ? 'Biometric consent exists, but this account has no active face enrollment.' : 'Biometric consent and Face ID enrollment are required before student self-attendance.'} />
    )}

    {dailyMode && (
      <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#1754E8]">Offline / Hybrid daily presence</p><h2 className="mt-1 text-lg font-extrabold text-[#101D38]">One Face ID check-in for today</h2><p className="mt-1 text-xs leading-5 text-[#667085]">A verified daily check-in applies to today’s scheduled in-person classes. Faculty can still correct and submit the final register.</p></div>
          {!student.dailyPresence ? (
            <button disabled={busy || !student.selfCheckInAllowed} onClick={() => onFace({ kind: 'DAY' })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"><Camera className="h-4 w-4" />Face ID daily check-in</button>
          ) : student.dailyPresence.checkedOutAt ? (
            <span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-50 px-4 text-xs font-extrabold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Today completed</span>
          ) : (
            <button disabled={busy} onClick={() => void onCheckout('DAY')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C7D5E8] px-4 text-xs font-extrabold text-[#24324A]"><LogOut className="h-4 w-4" />Complete today / checkout</button>
          )}
        </div>
        {student.dailyPresence && <p className="mt-3 text-[11px] text-[#667085]">Checked in {formatTime(student.dailyPresence.checkedInAt)}{student.dailyPresence.checkedOutAt ? ` · Checked out ${formatTime(student.dailyPresence.checkedOutAt)}` : ' · Attendance day active'}</p>}
      </section>
    )}

    <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
      <div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-[#1754E8]" /><div><h2 className="font-extrabold text-[#101D38]">Today’s timetable attendance</h2><p className="mt-0.5 text-xs text-[#667085]">Online students verify every class separately. Offline daily verification is reflected against all scheduled classes.</p></div></div>
      <div className="mt-4 space-y-3">
        {student.todayClasses.length === 0 && <Empty text="No classes are scheduled today." />}
        {student.todayClasses.map((item) => <ClassRow key={item.timetableSlotId} item={item} online={student.studyMode === 'ONLINE'} busy={busy} onFace={onFace} onCheckout={onCheckout} />)}
      </div>
    </section>

    <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
      <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-[#1754E8]" /><h2 className="font-extrabold text-[#101D38]">Attendance health & missed classes</h2></div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {student.summaries.map((summary) => (
          <div key={summary.courseOfferingId} className={`rounded-xl border p-4 ${summary.shortage ? 'border-amber-200 bg-amber-50/60' : 'border-[#E1E7EF]'}`}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A8799]">{summary.courseCode}</p><p className="mt-1 text-sm font-extrabold text-[#24324A]">{summary.courseTitle}</p></div><span className={`rounded-full px-2 py-1 text-xs font-extrabold ${summary.shortage ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{summary.percentage.toFixed(1)}%</span></div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center"><Mini label="Held" value={summary.held} /><Mini label="Present" value={summary.present + summary.late} /><Mini label="Missed" value={summary.missedClasses} /><Mini label="Excused" value={summary.excused} /></div>
            {summary.shortage && <p className="mt-3 text-xs font-semibold text-amber-900">Attend {Number.isFinite(summary.classesNeededForTarget) ? summary.classesNeededForTarget : 'all remaining'} consecutive classes to recover to {summary.threshold}%.</p>}
          </div>
        ))}
        {student.summaries.length === 0 && <Empty text="Attendance will appear after faculty submit class registers." />}
      </div>
    </section>
  </>;
}

function ClassRow({ item, online, busy, onFace, onCheckout }: {
  item: AttendanceClass; online: boolean; busy: boolean;
  onFace: (target: { kind: 'DAY' | 'CLASS'; slotId?: string }) => void;
  onCheckout: (kind: 'DAY' | 'CLASS', sessionId?: string) => Promise<void>;
}) {
  return <div className="flex flex-col gap-3 rounded-xl border border-[#E1E7EF] p-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-[#24324A]">{item.courseCode} · {item.courseTitle}</p>{item.markStatus && <Status value={item.markStatus} />}</div><p className="mt-1 text-[11px] text-[#667085]">{item.startTime.slice(0,5)}–{item.endTime.slice(0,5)} · {item.facultyName} · {item.roomLabel}</p><p className="mt-1 text-[10px] text-[#8994A5]">{item.method ? `Captured by ${item.method.replace(/_/g, ' ').toLowerCase()}` : 'Waiting for attendance'}</p></div>
    <div className="flex flex-wrap gap-2">
      {online && !item.markStatus && <button disabled={busy || !item.canCheckIn} onClick={() => onFace({ kind: 'CLASS', slotId: item.timetableSlotId })} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-3 text-xs font-extrabold text-white disabled:opacity-45"><Camera className="h-3.5 w-3.5" />Face ID check-in</button>}
      {online && item.canCheckOut && item.sessionId && <button disabled={busy} onClick={() => void onCheckout('CLASS', item.sessionId || undefined)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C7D5E8] px-3 text-xs font-extrabold text-[#344054]"><LogOut className="h-3.5 w-3.5" />Checkout</button>}
      {item.checkedOutAt && <span className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700"><Check className="h-3.5 w-3.5" />Completed</span>}
    </div>
  </div>;
}

function FacultyAttendance({ sessions, busy, onBusy, onMessage, reload }: {
  sessions: AttendanceFacultySession[]; busy: boolean; onBusy: (value: boolean) => void;
  onMessage: (value: string | null) => void; reload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState('');
  return <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#1754E8]">Faculty register</p><h2 className="mt-1 text-lg font-extrabold text-[#101D38]">Today’s timetable sessions</h2><p className="mt-1 text-xs text-[#667085]">Offline students can be marked manually. Face check-ins arrive automatically. Submit closes the register and marks every unmarked enrolled student absent.</p></div><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter student" className="min-h-10 rounded-xl border border-[#D5DEEA] px-3 text-sm" /></div>
    <div className="mt-5 space-y-5">
      {sessions.length === 0 && <Empty text="No teaching sessions are scheduled for you today." />}
      {sessions.map((session) => <div key={session.sessionId} className="rounded-xl border border-[#E1E7EF] overflow-hidden"><div className="flex flex-col gap-3 border-b border-[#E7ECF2] bg-[#F8FAFC] p-4 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2"><p className="text-sm font-extrabold text-[#24324A]">{session.courseCode} · {session.courseTitle}</p><Status value={session.status} /></div><p className="mt-1 text-[11px] text-[#667085]">{session.sessionDate} · {session.startTime.slice(0,5)}–{session.endTime.slice(0,5)} · {session.students.length} students</p></div><button disabled={busy || session.status === 'SUBMITTED' || session.status === 'CANCELLED'} onClick={async () => { onBusy(true); onMessage(null); try { const response = await fetch('/api/attendance/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', sessionId: session.sessionId }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Submit failed.'); onMessage('Class attendance submitted. Final records are now locked into the core register.'); await reload(); } catch (error) { onMessage(`Error: ${error instanceof Error ? error.message : 'Submit failed.'}`); } finally { onBusy(false); } }} className="min-h-10 rounded-xl bg-[#101D38] px-4 text-xs font-extrabold text-white disabled:opacity-40">Submit class register</button></div>
        <div className="divide-y divide-[#EEF1F5]">{session.students.filter((student) => !filter.trim() || `${student.name} ${student.rollNumber}`.toLowerCase().includes(filter.trim().toLowerCase())).map((student) => <div key={student.studentId} className="grid gap-3 p-3 md:grid-cols-[minmax(180px,1fr)_110px_1fr] md:items-center"><div><p className="text-xs font-extrabold text-[#24324A]">{student.name}</p><p className="mt-0.5 text-[10px] text-[#7A8799]">{student.rollNumber} · {student.studyMode}</p></div><div>{student.status ? <Status value={student.status} /> : <span className="text-[10px] font-bold text-[#98A2B3]">Unmarked</span>}</div><div className="flex flex-wrap gap-1.5 md:justify-end">{(['PRESENT','ABSENT','LATE','EXCUSED'] as AttendanceMarkStatus[]).map((status) => <button key={status} disabled={busy || session.status === 'SUBMITTED'} onClick={async () => { onBusy(true); onMessage(null); try { const response = await fetch('/api/attendance/actions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark', timetableSlotId: session.timetableSlotId, sessionDate: session.sessionDate, studentId: student.studentId, status }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Mark failed.'); await reload(); } catch (error) { onMessage(`Error: ${error instanceof Error ? error.message : 'Mark failed.'}`); } finally { onBusy(false); } }} className={`rounded-lg border px-2 py-1.5 text-[10px] font-extrabold ${student.status === status ? 'border-[#1754E8] bg-[#EEF3FF] text-[#1754E8]' : 'border-[#DDE4EE] text-[#667085]'}`}>{status}</button>)}</div></div>)}</div>
      </div>)}
    </div>
  </section>;
}

function OversightMetrics({ data }: { data: AttendanceWorkspace }) {
  const metrics = data.institutionMetrics;
  if (!metrics) return null;
  return <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Students" value={metrics.enrolledStudents} icon={UsersRound} /><Metric label="Online" value={metrics.onlineStudents} icon={Camera} /><Metric label="Offline" value={metrics.offlineStudents} icon={UserCheck} /><Metric label={`Below ${data.settings.requiredPercentage}%`} value={metrics.belowThreshold} icon={AlertTriangle} /></div><section className="rounded-2xl border border-[#D9E3F0] bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-extrabold text-[#101D38]">Institution attendance health</h2><p className="mt-1 text-xs text-[#667085]">{metrics.classifiedStudents}/{metrics.enrolledStudents} students have a delivery mode classification · {metrics.submittedToday} class registers submitted today.</p></div></div></section></>;
}

function FaceCaptureDialog({ target, onClose, onSuccess }: {
  target: { kind: 'DAY' | 'CLASS'; slotId?: string };
  onClose: () => void;
  onSuccess: (message: string) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<'STARTING' | 'READY' | 'VERIFYING' | 'ERROR'>('STARTING');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, audio: false })
      .then((stream) => { if (!mounted) { stream.getTracks().forEach((track) => track.stop()); return; } streamRef.current = stream; if (videoRef.current) { videoRef.current.srcObject = stream; void videoRef.current.play(); } setState('READY'); })
      .catch(() => { setError('Camera permission is required for Face ID attendance.'); setState('ERROR'); });
    return () => { mounted = false; streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, []);

  const verify = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setState('VERIFYING'); setError(null);
    try {
      const canvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth, video.videoHeight, 720);
      canvas.width = size; canvas.height = size;
      const x = (video.videoWidth - size) / 2; const y = (video.videoHeight - size) / 2;
      canvas.getContext('2d')?.drawImage(video, x, y, size, size, 0, 0, size, size);
      const captureDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const payload = target.kind === 'CLASS' ? { kind: 'CLASS', timetableSlotId: target.slotId, captureDataUrl } : { kind: 'DAY', captureDataUrl };
      const response = await fetch('/api/attendance/self/check-in', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      canvas.width = 1; canvas.height = 1;
      if (!response.ok) throw new Error(body.error || 'Face verification failed.');
      streamRef.current?.getTracks().forEach((track) => track.stop());
      await onSuccess(target.kind === 'DAY' ? `Daily Face ID verified. ${body.coveredClasses ?? 0} timetable classes are covered for today.` : 'Face ID verified and class check-in recorded.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Face verification failed.'); setState('ERROR'); }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101D38]/75 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#1754E8]">Secure Face ID</p><h2 className="mt-1 text-lg font-extrabold text-[#101D38]">{target.kind === 'DAY' ? 'Verify today’s presence' : 'Verify class attendance'}</h2><p className="mt-1 text-xs leading-5 text-[#667085]">The camera frame is sent once to the institution’s configured face-verification service. NAVEMORA does not save this image.</p></div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1E7EF]"><X className="h-4 w-4" /></button></div><div className="mt-4 aspect-square overflow-hidden rounded-2xl bg-slate-950"><video ref={videoRef} muted playsInline className="h-full w-full object-cover scale-x-[-1]" /></div>{error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}<button disabled={state !== 'READY' && state !== 'ERROR'} onClick={() => void verify()} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white disabled:opacity-50">{state === 'VERIFYING' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{state === 'VERIFYING' ? 'Verifying securely…' : 'Capture & verify Face ID'}</button></div></div>;
}

function Notice({ tone, title, detail }: { tone: 'warning' | 'danger' | 'success' | 'neutral'; title: string; detail: string }) {
  const style = tone === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-900' : tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-[#D9E3F0] bg-[#F8FAFC] text-[#344054]';
  return <div className={`rounded-xl border p-4 ${style}`}><p className="text-sm font-extrabold">{title}</p><p className="mt-1 text-xs leading-5 opacity-80">{detail}</p></div>;
}
function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) { return <div className="rounded-xl border border-[#D9E3F0] bg-white p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A8799]">{label}</p><Icon className="h-4 w-4 text-[#1754E8]" /></div><p className="mt-3 text-xl font-extrabold text-[#101D38]">{value}</p></div>; }
function Mini({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-white/80 p-2"><p className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-[#98A2B3]">{label}</p><p className="mt-1 text-sm font-extrabold text-[#24324A]">{value}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-[#CCD7E5] p-6 text-center text-xs font-semibold text-[#7A8799]">{text}</div>; }
function Status({ value }: { value: string }) { const good = value === 'PRESENT' || value === 'SUBMITTED' || value === 'OPEN'; const bad = value === 'ABSENT' || value === 'CANCELLED'; return <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.05em] ${good ? 'bg-emerald-50 text-emerald-700' : bad ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{value.replace(/_/g, ' ')}</span>; }
function formatTime(value: string) { return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
