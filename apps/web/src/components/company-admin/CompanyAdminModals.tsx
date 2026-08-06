'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Loader2,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';

import type { CompanyAdminContract, CompanyAdminInstitution } from '@/lib/company-admin-types';
import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';

const moduleOptions = [
  'Admissions',
  'Academics',
  'Attendance',
  'Examinations',
  'Finance',
  'HR & People',
  'LMS',
  'Library',
  'Hostel',
  'Transport',
  'Placements',
  'Community',
  'AI & Analytics',
] as const;

function isoDateInput(value: Date | string) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateInputToIso(value: FormDataEntryValue | null, endOfDay = false) {
  const date = String(value || '');
  return new Date(`${date}T${endOfDay ? '23:59:59.000' : '00:00:00.000'}Z`).toISOString();
}

function defaultTerm() {
  const start = new Date();
  const end = new Date(start);
  end.setUTCFullYear(end.getUTCFullYear() + 1);
  return { start: isoDateInput(start), end: isoDateInput(end) };
}

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || 'The request could not be completed.');
  return body;
}

function Modal({ open, title, description, onClose, children, wide = false }: { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ active: open, containerRef, initialFocusRef: closeRef });

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#071225]/65 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={containerRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-[#DCE4EE] bg-white shadow-[0_36px_120px_rgba(7,18,37,0.35)] sm:rounded-[28px] ${wide ? 'max-w-[980px]' : 'max-w-[680px]'}`}>
        <div className="flex shrink-0 items-start gap-4 border-b border-[#E3E9F1] bg-[#FAFBFD] px-5 py-5 sm:px-6">
          <div className="min-w-0 flex-1"><p className="text-lg font-extrabold tracking-[-0.025em] text-[#101D38]">{title}</p>{description && <p className="mt-1 text-xs leading-5 text-[#667085]">{description}</p>}</div>
          <button ref={closeRef} type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D8E1EC] bg-white text-[#526071] transition hover:bg-[#F2F4F7]" aria-label={`Close ${title}`}><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

export function AddInstitutionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const term = useMemo(defaultTerm, [open]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>(['Admissions', 'Academics', 'Attendance', 'Finance']);

  useEffect(() => {
    if (open) {
      setError('');
      setSelectedModules(['Admissions', 'Academics', 'Attendance', 'Finance']);
    }
  }, [open]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      await requestJson('/api/company-admin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          code: form.get('code'),
          subdomain: form.get('subdomain'),
          status: form.get('status'),
          adminName: form.get('adminName'),
          adminEmail: form.get('adminEmail'),
          temporaryPassword: form.get('temporaryPassword'),
          planName: form.get('planName'),
          currency: form.get('currency'),
          contractValue: form.get('contractValue'),
          billingCycle: form.get('billingCycle'),
          startsAt: dateInputToIso(form.get('startsAt')),
          endsAt: dateInputToIso(form.get('endsAt'), true),
          autoRenew: form.get('autoRenew') === 'on',
          renewalNoticeDays: form.get('renewalNoticeDays'),
          licensedStudents: form.get('licensedStudents') ? Number(form.get('licensedStudents')) : null,
          licensedStaff: form.get('licensedStaff') ? Number(form.get('licensedStaff')) : null,
          modules: selectedModules,
          primaryContactName: form.get('primaryContactName'),
          primaryContactEmail: form.get('primaryContactEmail'),
          primaryContactPhone: form.get('primaryContactPhone'),
          accountOwner: form.get('accountOwner'),
          notes: form.get('notes'),
        }),
      });
      onClose();
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create the institution.');
    } finally {
      setBusy(false);
    }
  }

  return <Modal open={open} onClose={onClose} title="Add institution" description="Create a production institution tenant, its first institution administrator and its initial commercial contract." wide>
    <form onSubmit={submit} className="p-5 sm:p-6">
      {error && <ErrorBanner message={error} />}
      <FormSection icon={Building2} title="Institution account" description="Customer identity and production workspace.">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Institution name *"><input name="name" required minLength={2} maxLength={180} className={inputClass} placeholder="Example University" /></Field><Field label="Institution code *"><input name="code" required minLength={2} maxLength={30} className={inputClass} placeholder="EXU" /></Field><Field label="Workspace prefix *"><div className="flex"><input name="subdomain" required minLength={2} maxLength={63} className={`${inputClass} rounded-r-none`} placeholder="example-university" /><span className="flex items-center rounded-r-xl border border-l-0 border-[#CBD5E1] bg-[#F7F9FC] px-3 text-xs font-bold text-[#667085]">.campusos.com</span></div></Field><Field label="Lifecycle state *"><select name="status" defaultValue="TRIAL" className={inputClass}><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option></select></Field></div>
      </FormSection>

      <FormSection icon={ShieldCheck} title="First institution administrator" description="Creates the real administrator account for this institution. Share the temporary password securely and require it to be changed through your account policy.">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Administrator name *"><input name="adminName" required className={inputClass} placeholder="Full name" /></Field><Field label="Administrator email *"><input name="adminEmail" required type="email" className={inputClass} placeholder="admin@university.edu" /></Field><Field label="Temporary password *"><input name="temporaryPassword" required type="password" minLength={10} maxLength={128} autoComplete="new-password" className={inputClass} placeholder="Minimum 10 characters" /></Field></div>
      </FormSection>

      <FormSection icon={FileText} title="Initial contract" description="Commercial terms, renewal window and licensed capacity.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Plan name *"><input name="planName" required className={inputClass} placeholder="Enterprise Campus" /></Field><Field label="Contract value *"><input name="contractValue" required min={0} step="0.01" type="number" className={inputClass} placeholder="500000" /></Field><Field label="Currency *"><select name="currency" defaultValue="INR" className={inputClass}><option value="INR">INR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></Field><Field label="Billing cycle *"><select name="billingCycle" defaultValue="ANNUAL" className={inputClass}><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="HALF_YEARLY">Half yearly</option><option value="ANNUAL">Annual</option></select></Field><Field label="Starts *"><input name="startsAt" required type="date" defaultValue={term.start} className={inputClass} /></Field><Field label="Ends *"><input name="endsAt" required type="date" defaultValue={term.end} className={inputClass} /></Field><Field label="Renewal notice days"><input name="renewalNoticeDays" type="number" min={0} max={3650} defaultValue={60} className={inputClass} /></Field><Field label="Licensed students"><input name="licensedStudents" type="number" min={0} className={inputClass} placeholder="10000" /></Field><Field label="Licensed staff"><input name="licensedStaff" type="number" min={0} className={inputClass} placeholder="1000" /></Field></div>
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] p-3 text-xs font-semibold text-[#526071]"><input name="autoRenew" type="checkbox" className="mt-0.5 h-4 w-4 rounded border-[#B8C4D3] text-[#1754E8] focus:ring-[#1754E8]" /><span>Contract is configured for automatic renewal (subject to your signed commercial terms).</span></label>
        <ModuleSelector value={selectedModules} onChange={setSelectedModules} />
      </FormSection>

      <FormSection icon={UsersRound} title="Commercial ownership & customer contact" description="Who CampusOS works with for procurement, renewal and account coordination.">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="CampusOS account owner"><input name="accountOwner" className={inputClass} placeholder="Account manager" /></Field><Field label="Customer contact name"><input name="primaryContactName" className={inputClass} placeholder="Procurement / CIO / Registrar" /></Field><Field label="Customer contact email"><input name="primaryContactEmail" type="email" className={inputClass} placeholder="contact@university.edu" /></Field><Field label="Customer contact phone"><input name="primaryContactPhone" className={inputClass} placeholder="Optional" /></Field></div><Field label="Internal notes"><textarea name="notes" rows={3} maxLength={4000} className={`${inputClass} resize-y`} placeholder="Commercial context, procurement conditions, renewal notes…" /></Field>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 border-t border-[#E3E9F1] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} type="submit" className={primaryButton}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Creating institution…</> : <><Plus className="h-4 w-4" />Create production institution</>}</button></div>
    </form>
  </Modal>;
}

export function InstitutionStatusModal({ institution, onClose }: { institution: CompanyAdminInstitution | null; onClose: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!institution) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      await requestJson(`/api/company-admin/institutions/${institution!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: form.get('status'), reason: form.get('reason') }) });
      onClose(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to update status.'); }
    finally { setBusy(false); }
  }

  return <Modal open={Boolean(institution)} onClose={onClose} title="Change institution status" description={`${institution.name} · current status: ${institution.status}`}><form onSubmit={submit} className="p-5 sm:p-6">{error && <ErrorBanner message={error} />}<div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><p className="text-sm font-extrabold text-amber-900">Lifecycle actions can affect customer access</p><p className="mt-1 text-xs leading-5 text-amber-800">Use Suspended/Inactive/Disabled only when the commercial, legal or operational decision is confirmed. This action changes the institution registry state and is recorded in the company audit trail.</p></div></div></div><div className="mt-5 space-y-4"><Field label="New lifecycle state *"><select name="status" defaultValue={institution.status.toUpperCase()} className={inputClass}><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="INACTIVE">Inactive</option><option value="DISABLED">Disabled</option></select></Field><Field label="Reason / internal note"><textarea name="reason" maxLength={500} rows={3} className={`${inputClass} resize-y`} placeholder="Why is the lifecycle state changing?" /></Field></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} type="submit" className={primaryButton}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Update status</button></div></form></Modal>;
}

export function ContractEditorModal({ context, onClose }: { context: { institution: CompanyAdminInstitution; contract: CompanyAdminContract | null; renewal?: boolean } | null; onClose: () => void }) {
  if (!context) return null;
  return <ContractEditorForm key={`${context.contract?.id || 'new'}-${context.renewal ? 'renew' : 'edit'}`} context={context} onClose={onClose} />;
}

function ContractEditorForm({ context, onClose }: { context: { institution: CompanyAdminInstitution; contract: CompanyAdminContract | null; renewal?: boolean }; onClose: () => void }) {
  const router = useRouter();
  const { institution, contract, renewal } = context;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const defaults = useMemo(() => contractDefaults(contract, Boolean(renewal)), [contract, renewal]);
  const [selectedModules, setSelectedModules] = useState<string[]>(defaults.modules);
  const isCreate = !contract || renewal;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      institutionId: institution.id,
      planName: form.get('planName'), status: form.get('status'), currency: form.get('currency'), contractValue: form.get('contractValue'), billingCycle: form.get('billingCycle'),
      startsAt: dateInputToIso(form.get('startsAt')), endsAt: dateInputToIso(form.get('endsAt'), true), autoRenew: form.get('autoRenew') === 'on', renewalNoticeDays: form.get('renewalNoticeDays'),
      licensedStudents: form.get('licensedStudents') ? Number(form.get('licensedStudents')) : null, licensedStaff: form.get('licensedStaff') ? Number(form.get('licensedStaff')) : null, modules: selectedModules,
      primaryContactName: form.get('primaryContactName'), primaryContactEmail: form.get('primaryContactEmail'), primaryContactPhone: form.get('primaryContactPhone'), accountOwner: form.get('accountOwner'), notes: form.get('notes'),
    };
    try {
      await requestJson(isCreate ? '/api/company-admin/contracts' : `/api/company-admin/contracts/${contract!.id}`, { method: isCreate ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      onClose(); router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Unable to save contract.'); }
    finally { setBusy(false); }
  }

  return <Modal open onClose={onClose} title={renewal ? 'Create renewal contract' : contract ? 'Edit contract' : 'Create contract'} description={`${institution.name}${contract ? ` · ${contract.contractNumber}` : ''}`} wide><form onSubmit={submit} className="p-5 sm:p-6">{error && <ErrorBanner message={error} />}{renewal && <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs leading-5 text-blue-900"><strong>A new contract record will be created.</strong> The previous agreement stays in contract history for audit and procurement reference.</div>}
    <FormSection icon={FileText} title="Commercial terms" description="Current agreement, billing and renewal dates."><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Plan name *"><input name="planName" required defaultValue={defaults.planName} className={inputClass} /></Field><Field label="Status *"><select name="status" defaultValue={defaults.status} className={inputClass}><option value="TRIAL">Trial</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option>{!isCreate && <option value="EXPIRED">Expired</option>}{!isCreate && <option value="CANCELLED">Cancelled</option>}</select></Field><Field label="Contract value *"><input name="contractValue" required type="number" min={0} step="0.01" defaultValue={defaults.contractValue} className={inputClass} /></Field><Field label="Currency"><select name="currency" defaultValue={defaults.currency} className={inputClass}><option value="INR">INR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></Field><Field label="Billing cycle"><select name="billingCycle" defaultValue={defaults.billingCycle} className={inputClass}><option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="HALF_YEARLY">Half yearly</option><option value="ANNUAL">Annual</option></select></Field><Field label="Renewal notice days"><input name="renewalNoticeDays" type="number" min={0} max={3650} defaultValue={defaults.renewalNoticeDays} className={inputClass} /></Field><Field label="Starts *"><input name="startsAt" type="date" required defaultValue={defaults.startsAt} className={inputClass} /></Field><Field label="Ends *"><input name="endsAt" type="date" required defaultValue={defaults.endsAt} className={inputClass} /></Field></div><label className="mt-4 flex items-start gap-3 rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] p-3 text-xs font-semibold text-[#526071]"><input name="autoRenew" type="checkbox" defaultChecked={defaults.autoRenew} className="mt-0.5 h-4 w-4 rounded border-[#B8C4D3] text-[#1754E8] focus:ring-[#1754E8]" />Automatic renewal is enabled in the recorded commercial terms.</label></FormSection>
    <FormSection icon={UsersRound} title="Licensed capacity & modules" description="Commercial limits and enabled product scope."><div className="grid gap-4 sm:grid-cols-2"><Field label="Licensed students"><input name="licensedStudents" type="number" min={0} defaultValue={defaults.licensedStudents ?? ''} className={inputClass} /></Field><Field label="Licensed staff"><input name="licensedStaff" type="number" min={0} defaultValue={defaults.licensedStaff ?? ''} className={inputClass} /></Field></div><ModuleSelector value={selectedModules} onChange={setSelectedModules} /></FormSection>
    <FormSection icon={Mail} title="Account ownership & customer contact" description="Primary commercial relationship details."><div className="grid gap-4 sm:grid-cols-2"><Field label="CampusOS account owner"><input name="accountOwner" defaultValue={defaults.accountOwner} className={inputClass} /></Field><Field label="Customer contact name"><input name="primaryContactName" defaultValue={defaults.primaryContactName} className={inputClass} /></Field><Field label="Customer contact email"><input name="primaryContactEmail" type="email" defaultValue={defaults.primaryContactEmail} className={inputClass} /></Field><Field label="Customer contact phone"><input name="primaryContactPhone" defaultValue={defaults.primaryContactPhone} className={inputClass} /></Field></div><Field label="Internal notes"><textarea name="notes" rows={3} maxLength={4000} defaultValue={defaults.notes} className={`${inputClass} resize-y`} /></Field></FormSection>
    <div className="flex flex-col-reverse gap-3 border-t border-[#E3E9F1] pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button disabled={busy} type="submit" className={primaryButton}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><CheckCircle2 className="h-4 w-4" />{renewal ? 'Create renewal' : 'Save contract'}</>}</button></div>
  </form></Modal>;
}

function contractDefaults(contract: CompanyAdminContract | null, renewal: boolean) {
  if (!contract) {
    const term = defaultTerm();
    return { planName: 'Enterprise Campus', status: 'ACTIVE', currency: 'INR', contractValue: 0, billingCycle: 'ANNUAL', startsAt: term.start, endsAt: term.end, autoRenew: false, renewalNoticeDays: 60, licensedStudents: null as number | null, licensedStaff: null as number | null, modules: ['Admissions', 'Academics', 'Attendance', 'Finance'], primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '', accountOwner: '', notes: '' };
  }
  let startsAt = isoDateInput(contract.startsAt); let endsAt = isoDateInput(contract.endsAt);
  if (renewal) {
    const start = new Date(contract.endsAt); start.setUTCDate(start.getUTCDate() + 1);
    const end = new Date(start); end.setUTCFullYear(end.getUTCFullYear() + 1);
    startsAt = isoDateInput(start); endsAt = isoDateInput(end);
  }
  return { planName: contract.planName, status: renewal ? 'ACTIVE' : contract.status, currency: contract.currency, contractValue: contract.contractValueMinor / 100, billingCycle: contract.billingCycle, startsAt, endsAt, autoRenew: contract.autoRenew, renewalNoticeDays: contract.renewalNoticeDays, licensedStudents: contract.licensedStudents, licensedStaff: contract.licensedStaff, modules: contract.modules, primaryContactName: contract.primaryContactName || '', primaryContactEmail: contract.primaryContactEmail || '', primaryContactPhone: contract.primaryContactPhone || '', accountOwner: contract.accountOwner || '', notes: renewal ? '' : contract.notes || '' };
}

export function InstitutionDetailModal({ institution, onClose, onEditContract, onChangeStatus }: { institution: CompanyAdminInstitution | null; onClose: () => void; onEditContract: (institution: CompanyAdminInstitution) => void; onChangeStatus: (institution: CompanyAdminInstitution) => void }) {
  if (!institution) return null;
  const contract = institution.contract;
  return <Modal open onClose={onClose} title={institution.name} description={`${institution.code} · ${institution.subdomain}.campusos.com`} wide><div className="p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><DetailMetric icon={UsersRound} label="Users" value={institution.users.toLocaleString('en-IN')} /><DetailMetric icon={Building2} label="Campuses" value={institution.campuses.toLocaleString('en-IN')} /><DetailMetric icon={GraduationCapIcon} label="Students" value={institution.students.toLocaleString('en-IN')} /><DetailMetric icon={AlertTriangle} label="Support cases" value={institution.supportCases.toLocaleString('en-IN')} /></div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-[#DCE4EE] p-5"><p className="text-sm font-extrabold text-[#101D38]">Institution lifecycle</p><dl className="mt-4 space-y-3 text-xs"><InfoRow label="Status" value={institution.status} /><InfoRow label="Workspace" value={`${institution.subdomain}.campusos.com`} /><InfoRow label="Institution code" value={institution.code} /><InfoRow label="Created" value={new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(institution.createdAt))} /><InfoRow label="Implementation projects" value={String(institution.implementationProjects)} /></dl><button type="button" onClick={() => onChangeStatus(institution)} className={`${secondaryButton} mt-5 w-full`}>Change lifecycle status</button></section>
      <section className="rounded-2xl border border-[#DCE4EE] p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-[#101D38]">Current commercial contract</p>{contract && <span className="rounded-full border border-[#D8E1EC] bg-[#F8FAFC] px-2 py-1 text-[9px] font-extrabold text-[#526071]">{contract.health}</span>}</div>{contract ? <><dl className="mt-4 space-y-3 text-xs"><InfoRow label="Contract" value={contract.contractNumber} /><InfoRow label="Plan" value={contract.planName} /><InfoRow label="Contract value" value={`${contract.currency} ${(contract.contractValueMinor / 100).toLocaleString('en-IN')}`} /><InfoRow label="Ends" value={new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(contract.endsAt))} /><InfoRow label="Auto renew" value={contract.autoRenew ? 'Yes' : 'No'} /><InfoRow label="Account owner" value={contract.accountOwner || 'Unassigned'} /></dl><div className="mt-4 flex flex-wrap gap-2">{contract.modules.map((module) => <span key={module} className="rounded-full bg-[#EDF3FF] px-2.5 py-1 text-[9px] font-bold text-[#1754E8]">{module}</span>)}</div></> : <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">No contract has been recorded for this institution.</div>}<button type="button" onClick={() => onEditContract(institution)} className={`${primaryButton} mt-5 w-full`}>{contract ? 'Edit current contract' : 'Create contract'}</button></section></div>
    {contract && <section className="mt-5 rounded-2xl border border-[#DCE4EE] p-5"><p className="text-sm font-extrabold text-[#101D38]">Customer contact</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><ContactCard icon={Mail} label="Email" value={contract.primaryContactEmail || 'Not recorded'} /><ContactCard icon={Phone} label="Phone" value={contract.primaryContactPhone || 'Not recorded'} /><ContactCard icon={UsersRound} label="Contact" value={contract.primaryContactName || 'Not recorded'} /></div>{contract.notes && <div className="mt-4 rounded-xl bg-[#F7F9FC] p-4"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B]">Internal notes</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#526071]">{contract.notes}</p></div>}</section>}
  </div></Modal>;
}

const GraduationCapIcon = UsersRound;

function DetailMetric({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) { return <div className="rounded-2xl border border-[#E1E7EF] bg-[#FAFBFD] p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4 w-4" /></span><p className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B]">{label}</p><p className="mt-1 text-xl font-extrabold text-[#101D38]">{value}</p></div>; }
function ContactCard({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <div className="rounded-xl bg-[#F7F9FC] p-3"><Icon className="h-4 w-4 text-[#1754E8]" /><p className="mt-2 text-[9px] font-extrabold uppercase tracking-wide text-[#7C899B]">{label}</p><p className="mt-1 break-words text-xs font-bold text-[#344054]">{value}</p></div>; }
function InfoRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F6] pb-3 last:border-0 last:pb-0"><dt className="text-[#7C899B]">{label}</dt><dd className="max-w-[65%] text-right font-bold text-[#344054]">{value}</dd></div>; }
function ModuleSelector({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) { function toggle(module: string) { onChange(value.includes(module) ? value.filter((item) => item !== module) : [...value, module]); } return <div className="mt-4"><p className="text-xs font-extrabold text-[#344054]">Enabled modules</p><div className="mt-3 flex flex-wrap gap-2">{moduleOptions.map((module) => <button key={module} type="button" onClick={() => toggle(module)} aria-pressed={value.includes(module)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold transition ${value.includes(module) ? 'border-[#BFD0EA] bg-[#EDF3FF] text-[#1754E8]' : 'border-[#D8E1EC] bg-white text-[#667085] hover:bg-[#F7F9FC]'}`}>{value.includes(module) && <CheckCircle2 className="mr-1 inline h-3 w-3" />}{module}</button>)}</div></div>; }
function FormSection({ icon: Icon, title, description, children }: { icon: typeof Building2; title: string; description: string; children: React.ReactNode }) { return <section className="mb-6 rounded-2xl border border-[#DCE4EE] p-4 sm:p-5"><div className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-extrabold text-[#101D38]">{title}</p><p className="mt-1 text-xs leading-5 text-[#7C899B]">{description}</p></div></div>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-extrabold text-[#344054]">{label}<div className="mt-2">{children}</div></label>; }
function ErrorBanner({ message }: { message: string }) { return <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold leading-5 text-rose-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{message}</div>; }

const inputClass = 'min-h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3.5 py-2.5 text-sm font-medium text-[#172033] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10';
const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white shadow-[0_10px_22px_rgba(23,84,232,0.22)] transition hover:bg-[#103FC2] disabled:cursor-not-allowed disabled:opacity-60';
const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-5 text-xs font-extrabold text-[#475467] transition hover:bg-[#F7F9FC]';
