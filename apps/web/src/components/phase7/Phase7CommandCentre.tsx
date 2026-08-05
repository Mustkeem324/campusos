'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BellRing,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  Download,
  FileBarChart2,
  Fingerprint,
  KeyRound,
  Library,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  RefreshCcw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
  WalletCards,
  XCircle,
} from 'lucide-react';

import type { Phase7Overview, Phase7ReportType } from '@/lib/phase7';

type RequestState = { loading: boolean; message: string; error: string };
type Preference = { type: string; email: boolean; push: boolean; inApp: boolean };

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const emptyRequest: RequestState = { loading: false, message: '', error: '' };
const preferenceTypes = ['ACADEMIC', 'FINANCE', 'APPROVAL', 'SECURITY', 'SYSTEM'] as const;

export function Phase7CommandCentre({ overview }: { overview: Phase7Overview }) {
  const router = useRouter();
  const [actionState, setActionState] = useState<RequestState>(emptyRequest);
  const [securityState, setSecurityState] = useState<RequestState>(emptyRequest);
  const [copilotState, setCopilotState] = useState<RequestState>(emptyRequest);
  const [successState, setSuccessState] = useState<RequestState>(emptyRequest);
  const [mfaSetup, setMfaSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [copilotAnswer, setCopilotAnswer] = useState<{ answer: string; sources: Array<{ label: string; href: string }> } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [preferences, setPreferences] = useState<Preference[]>(() => mergePreferences(overview.notifications));

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const pendingActions = useMemo(
    () => overview.actions.items.filter((item) => item.status === 'PROPOSED'),
    [overview.actions.items],
  );

  async function createAction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setActionState({ loading: true, message: '', error: '' });
    try {
      const response = await fetch('/api/action-centre', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          actionName: String(form.get('actionName') || ''),
          targetRecord: String(form.get('targetRecord') || ''),
          reason: String(form.get('reason') || ''),
          riskLevel: String(form.get('riskLevel') || 'MEDIUM'),
          requiredPermission: String(form.get('requiredPermission') || 'workflow:approve:institution'),
          proposedValues: {
            requestedOutcome: String(form.get('requestedOutcome') || ''),
            submittedFrom: 'phase-7-action-centre',
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to create the proposal.');
      event.currentTarget.reset();
      setActionState({ loading: false, message: 'Proposal submitted for authorised review.', error: '' });
      router.refresh();
    } catch (error: unknown) {
      setActionState({ loading: false, message: '', error: error instanceof Error ? error.message : 'Request failed.' });
    }
  }

  async function decideAction(id: string, decision: 'APPROVED' | 'REJECTED') {
    const note = window.prompt(`Optional review note for ${decision.toLowerCase()}:`) ?? '';
    setActionState({ loading: true, message: '', error: '' });
    try {
      const response = await fetch(`/api/action-centre/${id}/decision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to record the decision.');
      setActionState({ loading: false, message: `Proposal ${decision.toLowerCase()}.`, error: '' });
      router.refresh();
    } catch (error: unknown) {
      setActionState({ loading: false, message: '', error: error instanceof Error ? error.message : 'Decision failed.' });
    }
  }

  async function submitSecurity(action: string, body: Record<string, string>) {
    setSecurityState({ loading: true, message: '', error: '' });
    try {
      const response = await fetch('/api/security', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Security update failed.');
      if (action === 'mfa-setup') setMfaSetup({ secret: payload.secret, uri: payload.uri });
      if (action === 'mfa-confirm' || action === 'mfa-disable') setMfaSetup(null);
      setSecurityState({ loading: false, message: payload.message || 'Security settings updated.', error: '' });
      router.refresh();
    } catch (error: unknown) {
      setSecurityState({ loading: false, message: '', error: error instanceof Error ? error.message : 'Security update failed.' });
    }
  }

  async function askCopilot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setCopilotState({ loading: true, message: '', error: '' });
    setCopilotAnswer(null);
    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: String(form.get('question') || '') }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The copilot could not answer.');
      setCopilotAnswer({ answer: payload.answer, sources: payload.sources || [] });
      setCopilotState({ loading: false, message: 'Answer generated from authorised CampusOS records.', error: '' });
    } catch (error: unknown) {
      setCopilotState({ loading: false, message: '', error: error instanceof Error ? error.message : 'Copilot request failed.' });
    }
  }

  async function runStudentSuccessScan() {
    setSuccessState({ loading: true, message: '', error: '' });
    try {
      const response = await fetch('/api/student-success/scan', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'The scan could not run.');
      setSuccessState({
        loading: false,
        message: `Scanned ${payload.scannedStudents} students; created ${payload.created} case(s); ${payload.alreadyOpen} already open.`,
        error: '',
      });
      router.refresh();
    } catch (error: unknown) {
      setSuccessState({ loading: false, message: '', error: error instanceof Error ? error.message : 'Scan failed.' });
    }
  }

  async function updatePreference(type: string, field: 'email' | 'push' | 'inApp', value: boolean) {
    const current = preferences.find((item) => item.type === type) ?? { type, email: true, push: true, inApp: true };
    const next = { ...current, [field]: value };
    setPreferences((items) => items.map((item) => item.type === type ? next : item));
    const response = await fetch('/api/notification-preferences', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!response.ok) {
      setPreferences((items) => items.map((item) => item.type === type ? current : item));
    }
  }

  async function enableBrowserNotifications() {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification('CampusOS notifications enabled', {
        body: 'Your browser can now show approved CampusOS updates.',
        icon: '/icon-192.png',
      });
    }
  }

  async function installPwa() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  return (
    <div className="space-y-6">
      <Hero overview={overview} />

      <section id="actions" className="phase7-card" aria-labelledby="phase7-actions-title">
        <SectionTitle icon={Activity} eyebrow="Phase 7A" title="Action and Approval Centre" description="Submit governed requests and keep every decision tenant-scoped, role-authorised and audited." />
        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <form onSubmit={createAction} className="rounded-2xl border border-[#DCE5F0] bg-[#F8FAFD] p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
            <h3 className="text-sm font-extrabold text-[#101D38] dark:text-white">Create an approval proposal</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field name="actionName" label="Action" placeholder="Fee refund approval" required />
              <Field name="targetRecord" label="Target record" placeholder="Invoice or student reference" required />
              <label className="sm:col-span-2 field-label">Reason<textarea name="reason" required minLength={10} className="field-input min-h-24 resize-y" placeholder="Explain the evidence, urgency and expected outcome." /></label>
              <Field name="requestedOutcome" label="Requested outcome" placeholder="Approve refund after verification" />
              <label className="field-label">Risk level<select name="riskLevel" className="field-input"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>PROHIBITED</option></select></label>
              <Field name="requiredPermission" label="Required permission" defaultValue="workflow:approve:institution" />
            </div>
            <button className="primary-button mt-4" disabled={actionState.loading} type="submit">
              {actionState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit proposal
            </button>
            <RequestFeedback state={actionState} />
          </form>

          <div className="rounded-2xl border border-[#DCE5F0] bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="text-sm font-extrabold text-[#101D38] dark:text-white">Authorised work queue</h3><p className="mt-1 text-xs text-[#667085] dark:text-slate-400">{pendingActions.length} currently pending</p></div>
              <div className="flex gap-2 text-xs font-bold"><StatPill label="Approved" value={overview.actions.approved} /><StatPill label="Rejected" value={overview.actions.rejected} /></div>
            </div>
            <div className="mt-4 space-y-3">
              {overview.actions.items.length === 0 ? <Empty message="No proposals are available in your authorised scope." /> : overview.actions.items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-[#E3E9F2] bg-[#F9FBFD] p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusBadge value={item.status} /><StatusBadge value={item.riskLevel} /></div><h4 className="mt-3 text-sm font-extrabold text-[#101D38] dark:text-white">{item.actionName}</h4><p className="mt-1 text-xs text-[#667085] dark:text-slate-400">{item.targetRecord} · {item.proposerName}</p><p className="mt-3 text-sm leading-6 text-[#526175] dark:text-slate-300">{item.reason}</p></div>
                    {overview.actions.canApprove && item.status === 'PROPOSED' && <div className="flex shrink-0 gap-2"><button className="decision-button approve" onClick={() => void decideAction(item.id, 'APPROVED')} type="button"><CheckCircle2 className="h-4 w-4" />Approve</button><button className="decision-button reject" onClick={() => void decideAction(item.id, 'REJECTED')} type="button"><XCircle className="h-4 w-4" />Reject</button></div>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="phase7-card" aria-labelledby="phase7-security-title">
        <SectionTitle icon={ShieldCheck} eyebrow="Phase 7B" title="Account Security Centre" description="Change passwords, configure authenticator-based MFA and preserve database-backed session controls." />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <form className="sub-card" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void submitSecurity('change-password', { currentPassword: String(form.get('currentPassword') || ''), newPassword: String(form.get('newPassword') || '') }); }}>
            <h3 className="sub-card-title"><LockKeyhole className="h-5 w-5" />Change password</h3>
            <div className="mt-4 space-y-3"><Field type="password" name="currentPassword" label="Current password" required /><Field type="password" name="newPassword" label="New password" hint="At least 12 characters with uppercase, lowercase, number and symbol." required /></div>
            <button className="primary-button mt-4" disabled={securityState.loading} type="submit"><KeyRound className="h-4 w-4" />Update password</button>
            <Link href="/forgot-password" className="mt-3 inline-flex text-xs font-bold text-[#1754E8] dark:text-blue-300">Use password reset instead</Link>
          </form>

          <div className="sub-card">
            <h3 className="sub-card-title"><Fingerprint className="h-5 w-5" />Authenticator MFA</h3>
            <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">Current status: <strong className="text-[#101D38] dark:text-white">{overview.account.mfaEnabled ? 'Enabled' : 'Not enabled'}</strong></p>
            {!overview.account.mfaEnabled && !mfaSetup && <button className="primary-button mt-4" onClick={() => void submitSecurity('mfa-setup', {})} disabled={securityState.loading} type="button"><Fingerprint className="h-4 w-4" />Start MFA setup</button>}
            {mfaSetup && <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/30"><p className="font-extrabold text-blue-900 dark:text-blue-200">Authenticator setup key</p><code className="mt-2 block break-all rounded-xl bg-white p-3 text-xs text-[#101D38] dark:bg-slate-950 dark:text-white">{mfaSetup.secret}</code><p className="mt-3 text-xs leading-5 text-blue-800 dark:text-blue-300">Add the key or URI to your authenticator app, then confirm a fresh 6-digit code.</p><form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void submitSecurity('mfa-confirm', { code: String(form.get('code') || '') }); }}><input className="field-input" name="code" inputMode="numeric" maxLength={6} pattern="[0-9]{6}" placeholder="000000" required /><button className="primary-button" type="submit">Confirm</button></form></div>}
            {overview.account.mfaEnabled && <form className="mt-4 space-y-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void submitSecurity('mfa-disable', { currentPassword: String(form.get('currentPassword') || ''), code: String(form.get('code') || '') }); }}><Field type="password" name="currentPassword" label="Current password" required /><Field name="code" label="Authenticator code" inputMode="numeric" pattern="[0-9]{6}" required /><button className="secondary-danger-button" type="submit">Disable MFA</button></form>}
            <RequestFeedback state={securityState} />
          </div>
        </div>
      </section>

      <section id="reports" className="phase7-card" aria-labelledby="phase7-reports-title">
        <SectionTitle icon={FileBarChart2} eyebrow="Phase 7C" title="Reports and Export Studio" description="Download role-authorised, tenant-scoped reports with audit records for CSV and valid PDF exports." />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{overview.reports.map((report) => <ReportCard key={report} report={report} />)}</div>
      </section>

      <section id="finance" className="phase7-card" aria-labelledby="phase7-finance-title">
        <SectionTitle icon={WalletCards} eyebrow="Phase 7D" title="Finance 2.0 operations" description="Collections, invoice ageing, failed payments and refund approvals without replacing the reviewed payment gateway flow." />
        {overview.finance ? <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric label="Invoices" value={overview.finance.invoiceCount} /><Metric label="Invoiced" value={currency(overview.finance.invoicedAmount)} /><Metric label="Collected" value={currency(overview.finance.collectedAmount)} /><Metric label="Overdue" value={overview.finance.overdueCount} warning /><Metric label="Failed payments" value={overview.finance.failedPayments} warning /><Metric label="Pending refunds" value={overview.finance.pendingRefunds} warning /></div> : <Restricted message="Institution-wide finance operations are not available for your active role." />}
      </section>

      <section id="library" className="phase7-card" aria-labelledby="phase7-library-title">
        <SectionTitle icon={Library} eyebrow="Phase 7D" title="Library 2.0 operations" description="Catalogue quality and circulation intelligence connected to approval workflows for unsupported reservation, return and fine actions." />
        {overview.library ? <><div className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Catalogue items" value={overview.library.catalogueItems} /><Metric label="With ISBN" value={overview.library.itemsWithIsbn} /><Metric label="Circulation events" value={overview.library.loans} /></div><div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{overview.library.capabilityNotice}</div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{overview.library.recentLoans.map((loan) => <div key={loan.id} className="sub-card"><BookOpenCheck className="h-5 w-5 text-[#1754E8]" /><p className="mt-3 text-sm font-extrabold text-[#101D38] dark:text-white">{loan.title}</p><p className="mt-1 text-xs text-[#667085] dark:text-slate-400">{dateTime(loan.borrowedAt)}</p></div>)}</div></> : <Restricted message="Library operations are not available for your active role." />}
      </section>

      <section id="mobile" className="phase7-card" aria-labelledby="phase7-mobile-title">
        <SectionTitle icon={Smartphone} eyebrow="Phase 7E" title="Mobile PWA and notifications" description="Install CampusOS, cache the application shell and control email, push and in-app channels per notification category." />
        <div className="mt-6 grid gap-5 xl:grid-cols-[0.7fr_1.3fr]"><div className="sub-card"><h3 className="sub-card-title"><Smartphone className="h-5 w-5" />Install and device access</h3><div className="mt-4 flex flex-wrap gap-2"><button className="primary-button" type="button" disabled={!installPrompt} onClick={() => void installPwa()}><Download className="h-4 w-4" />Install app</button><button className="secondary-button" type="button" onClick={() => void enableBrowserNotifications()}><BellRing className="h-4 w-4" />Enable browser notifications</button></div><p className="mt-4 text-xs leading-5 text-[#667085] dark:text-slate-400">Install availability depends on browser support and the secure deployment context. Offline mode caches the shell and previously visited safe assets; protected records still require an authenticated server connection.</p></div><div className="sub-card"><h3 className="sub-card-title"><BellRing className="h-5 w-5" />Notification preferences</h3><div className="mt-4 space-y-3">{preferences.map((preference) => <PreferenceRow key={preference.type} preference={preference} onChange={updatePreference} />)}</div></div></div>
      </section>

      <section id="copilot" className="phase7-card" aria-labelledby="phase7-copilot-title">
        <SectionTitle icon={Bot} eyebrow="Phase 7F" title="Safe Campus Copilot" description="Ask for evidence-based summaries. The copilot blocks prompt injection, never exposes secrets and never writes protected records directly." />
        <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]"><form className="sub-card" onSubmit={askCopilot}><label className="field-label">Question<textarea name="question" className="field-input min-h-32 resize-y" placeholder="Summarise pending approvals, finance ageing, library circulation or student-success cases." required minLength={2} maxLength={500} /></label><button className="primary-button mt-4" disabled={copilotState.loading} type="submit">{copilotState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Ask copilot</button><RequestFeedback state={copilotState} /></form><div className="sub-card min-h-56">{copilotAnswer ? <><div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-[#1754E8] dark:text-blue-300"><MessageSquareText className="h-4 w-4" />Authorised answer</div><p className="mt-4 text-sm leading-7 text-[#26354D] dark:text-slate-200">{copilotAnswer.answer}</p><div className="mt-5 flex flex-wrap gap-2">{copilotAnswer.sources.map((source) => <Link key={`${source.href}-${source.label}`} className="source-link" href={source.href}>{source.label}<ChevronRight className="h-3.5 w-3.5" /></Link>)}</div></> : <Empty message="Ask a question to receive a role-filtered answer with source links." />}</div></div>
      </section>

      <section id="student-success" className="phase7-card" aria-labelledby="phase7-success-title">
        <SectionTitle icon={UsersRound} eyebrow="Phase 7F" title="Student-success workflows" description="Create explainable human-review cases from persisted academic and administrative evidence, then track interventions to resolution." />
        {overview.studentSuccess ? <><div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#DCE5F0] bg-[#F8FAFD] p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"><div className="grid flex-1 grid-cols-3 gap-3"><Metric label="Identified" value={overview.studentSuccess.identified} warning /><Metric label="Active" value={overview.studentSuccess.active} /><Metric label="Resolved" value={overview.studentSuccess.resolved} /></div><button className="primary-button shrink-0" onClick={() => void runStudentSuccessScan()} disabled={successState.loading} type="button">{successState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}Run evidence scan</button></div><RequestFeedback state={successState} /><div className="mt-4 grid gap-3 lg:grid-cols-2">{overview.studentSuccess.cases.length === 0 ? <Empty message="No student-success cases are currently stored." /> : overview.studentSuccess.cases.map((item) => <article key={item.id} className="sub-card"><div className="flex flex-wrap gap-2"><StatusBadge value={item.riskLevel} /><StatusBadge value={item.status} /></div><h3 className="mt-3 text-sm font-extrabold text-[#101D38] dark:text-white">{item.studentName} · {item.studentRollNumber}</h3><p className="mt-1 text-xs font-bold text-[#1754E8] dark:text-blue-300">{item.riskCategory.replace(/_/g, ' ')}</p><p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-300">{item.notes}</p><p className="mt-3 text-[11px] text-[#8A95A6]">Updated {dateTime(item.updatedAt)}</p></article>)}</div></> : <Restricted message="Student-success case management is not available for your active role." />}
      </section>
    </div>
  );
}

function Hero({ overview }: { overview: Phase7Overview }) {
  return <header className="overflow-hidden rounded-[28px] border border-[#223A5D] bg-[#101D38] text-white shadow-[0_28px_80px_rgba(16,29,56,0.2)]"><div className="grid lg:grid-cols-[1.3fr_0.7fr]"><div className="p-6 sm:p-9 lg:p-11"><div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#385477] bg-[#0D1A2E] px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#AFCBFA]"><Sparkles className="h-4 w-4" />Dashboard UI Phase 7</div><h1 className="mt-6 max-w-4xl text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl lg:text-5xl">Workflow, security, reporting, mobile and safe intelligence in one operating layer</h1><p className="mt-5 max-w-3xl text-sm leading-7 text-[#B8C6D9] sm:text-base">Signed in as {overview.account.name} for {overview.account.institution}. Every module below uses the active server-verified tenant and role context.</p></div><aside className="border-t border-[#2B456B] bg-[#0D1A2E] p-6 sm:p-8 lg:border-l lg:border-t-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#91A3BE]">Security posture</p><div className="mt-5 space-y-3"><HeroRow label="Email" value={overview.account.emailVerified ? 'Verified' : 'Verification pending'} good={overview.account.emailVerified} /><HeroRow label="MFA" value={overview.account.mfaEnabled ? 'Enabled' : 'Not enabled'} good={overview.account.mfaEnabled} /><HeroRow label="Active sessions" value={String(overview.account.activeSessions)} good={overview.account.activeSessions === 1} /><HeroRow label="Pending actions" value={String(overview.actions.proposed)} good={overview.actions.proposed === 0} /></div></aside></div></header>;
}

function SectionTitle({ icon: Icon, eyebrow, title, description }: { icon: React.ElementType; eyebrow: string; title: string; description: string }) { return <div className="flex flex-col gap-4 sm:flex-row sm:items-start"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"><Icon className="h-6 w-6" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] dark:text-blue-300">{eyebrow}</p><h2 id={`phase7-${eyebrow.toLowerCase().replace(/\s+/g, '-')}`} className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-[#101D38] dark:text-white">{title}</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-[#667085] dark:text-slate-400">{description}</p></div></div>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) { const { label, hint, ...inputProps } = props; return <label className="field-label">{label}<input {...inputProps} className="field-input" />{hint && <span className="mt-1 block text-[10px] font-medium normal-case tracking-normal text-[#8A95A6]">{hint}</span>}</label>; }
function RequestFeedback({ state }: { state: RequestState }) { if (!state.message && !state.error) return null; return <div role={state.error ? 'alert' : 'status'} className={`mt-3 rounded-xl border p-3 text-xs font-semibold ${state.error ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}>{state.error || state.message}</div>; }
function StatusBadge({ value }: { value: string }) { const warning = ['HIGH', 'CRITICAL', 'PROHIBITED', 'REJECTED', 'FAILED'].includes(value); const positive = ['APPROVED', 'EXECUTED', 'RESOLVED', 'LOW'].includes(value); return <span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] ${warning ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300' : positive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'}`}>{value.replace(/_/g, ' ')}</span>; }
function StatPill({ label, value }: { label: string; value: number }) { return <span className="rounded-full border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-1.5 text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">{label} {value}</span>; }
function Metric({ label, value, warning }: { label: string; value: string | number; warning?: boolean }) { return <div className={`rounded-2xl border p-4 ${warning ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : 'border-[#DCE5F0] bg-[#F8FAFD] dark:border-slate-800 dark:bg-slate-900'}`}><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798] dark:text-slate-500">{label}</p><p className="mt-3 break-words text-xl font-extrabold text-[#101D38] dark:text-white">{value}</p></div>; }
function ReportCard({ report }: { report: Phase7ReportType }) { const label = report.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); return <article className="sub-card"><FileBarChart2 className="h-5 w-5 text-[#1754E8]" /><h3 className="mt-3 text-sm font-extrabold text-[#101D38] dark:text-white">{label}</h3><div className="mt-4 flex gap-2"><a className="secondary-button" href={`/api/reports/export?type=${report}&format=csv`}><Download className="h-4 w-4" />CSV</a><a className="secondary-button" href={`/api/reports/export?type=${report}&format=pdf`}><Download className="h-4 w-4" />PDF</a></div></article>; }
function PreferenceRow({ preference, onChange }: { preference: Preference; onChange: (type: string, field: 'email' | 'push' | 'inApp', value: boolean) => Promise<void> }) { return <div className="grid gap-3 rounded-xl border border-[#E0E7F0] bg-[#F8FAFD] p-3 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"><p className="text-xs font-extrabold text-[#101D38] dark:text-white">{preference.type}</p>{(['email', 'push', 'inApp'] as const).map((field) => <label key={field} className="flex min-h-9 items-center gap-2 text-xs font-semibold text-[#667085] dark:text-slate-400"><input type="checkbox" checked={preference[field]} onChange={(event) => void onChange(preference.type, field, event.target.checked)} />{field === 'inApp' ? 'In-app' : field.charAt(0).toUpperCase() + field.slice(1)}</label>)}</div>; }
function HeroRow({ label, value, good }: { label: string; value: string; good: boolean }) { return <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#2B456B] bg-[#101D38] p-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#91A3BE]">{label}</p><p className="mt-1 text-sm font-extrabold text-white">{value}</p></div><span className={`h-2.5 w-2.5 rounded-full ${good ? 'bg-emerald-400' : 'bg-amber-400'}`} /></div>; }
function Empty({ message }: { message: string }) { return <div className="rounded-2xl border border-dashed border-[#C9D6E6] bg-[#F8FAFD] p-6 text-center text-sm text-[#667085] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">{message}</div>; }
function Restricted({ message }: { message: string }) { return <div className="mt-6 rounded-2xl border border-[#D8E2EF] bg-[#F7F9FC] p-6 text-sm text-[#667085] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"><LockKeyhole className="mb-3 h-5 w-5 text-[#7B8798]" />{message}</div>; }
function mergePreferences(stored: Phase7Overview['notifications']): Preference[] { const map = new Map(stored.map((item) => [item.type, item])); return preferenceTypes.map((type) => map.get(type) ?? { type, email: true, push: true, inApp: true }); }
function currency(value: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
function dateTime(value: string) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
