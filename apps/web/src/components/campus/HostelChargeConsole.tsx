'use client';

import React, { useMemo, useState } from 'react';
import { CreditCard, PlusCircle, ShieldCheck } from 'lucide-react';

export function HostelChargeConsole({
  students,
  currency,
}: {
  students: Array<{ studentId: string; studentName: string; rollNumber: string; eligible: boolean; enrolled: boolean }>;
  currency: string;
}) {
  const [studentId, setStudentId] = useState('');
  const [category, setCategory] = useState<'HOSTEL' | 'MESS' | 'MAINTENANCE' | 'SECURITY_DEPOSIT' | 'DAMAGE' | 'OTHER'>('HOSTEL');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const residentStudents = useMemo(
    () => students.filter((student) => student.eligible && student.enrolled),
    [students],
  );

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch('/api/hostel/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'charge',
          studentId,
          category,
          description,
          amount: Number(amount),
          dueDate: dueDate || null,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to create hostel charge.');
      setMessage('Hostel charge added to the institutional hostel ledger.');
      setDescription('');
      setAmount('');
      setDueDate('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create hostel charge.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5 shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]"><CreditCard className="h-5 w-5" /></span>
        <div>
          <h2 className="font-extrabold text-[#101D38]">Hostel fee components</h2>
          <p className="mt-1 text-xs leading-5 text-[#667085]">Record hostel rent, mess, maintenance, deposit and reviewed damage components separately. Damage incidents never become payable automatically.</p>
        </div>
      </div>

      {message && <div className="mt-4 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-4 py-3 text-xs font-semibold text-[#344054]">{message}</div>}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Field label="Resident student">
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm">
            <option value="">Select student</option>
            {residentStudents.map((student) => <option key={student.studentId} value={student.studentId}>{student.studentName} · {student.rollNumber}</option>)}
          </select>
        </Field>
        <Field label="Component">
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] bg-white px-3 text-sm">
            <option value="HOSTEL">Hostel</option><option value="MESS">Mess</option><option value="MAINTENANCE">Maintenance</option><option value="SECURITY_DEPOSIT">Security deposit</option><option value="DAMAGE">Reviewed damage</option><option value="OTHER">Other</option>
          </select>
        </Field>
        <Field label="Description"><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="August hostel fee" className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm" /></Field>
        <Field label={`Amount (${currency})`}><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm" /></Field>
        <Field label="Due date"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm" /></Field>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-[11px] leading-5 text-[#667085]"><ShieldCheck className="h-3.5 w-3.5 text-[#1754E8]" />Only eligible enrolled students can be selected here; payment execution remains governed by the institution’s finance workflow.</p>
        <button type="button" disabled={busy || !studentId || !description.trim() || !amount || Number(amount) < 0} onClick={() => void submit()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"><PlusCircle className="h-4 w-4" />Add component</button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.07em] text-[#7A8799]">{label}</span>{children}</label>;
}
