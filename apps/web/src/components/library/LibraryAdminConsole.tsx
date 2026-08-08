'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  BookCopy,
  BookOpen,
  CircleDollarSign,
  ClipboardCheck,
  Loader2,
  RefreshCcw,
  ShieldAlert,
  X,
} from 'lucide-react';

import { formatMinor } from '@/lib/finance-money';
import type {
  AcquisitionView,
  LibraryAdminOverview,
  LoanView,
  LibraryClearanceView,
} from '@/lib/library-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

export function LibraryAdminConsole() {
  const [data, setData] = useState<LibraryAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<'overview' | 'circulation' | 'catalog' | 'acquisitions' | 'clearance'>('overview');

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/library/admin', { cache: 'no-store' });
    if (!response.ok) {
      const body = await json<{ error?: string }>(response);
      setError(body.error ?? 'Unable to load the library console.');
      setLoading(false);
      return;
    }
    setData(await json<LibraryAdminOverview>(response));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>, successMessage: string) {
    setBusy(url);
    setNotice(null);
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) {
      const payload = await json<{ error?: string }>(response);
      setNotice({ tone: 'error', text: payload.error ?? 'The library action could not be completed.' });
      setBusy(null);
      return;
    }
    setNotice({ tone: 'success', text: successMessage });
    await load();
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading library console…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="font-medium text-rose-700 dark:text-rose-300">{error ?? 'Library console unavailable.'}</p>
        <button onClick={() => void load()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
          <RefreshCcw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Library Control Center</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Institution circulation, catalog, fines and clearance operations.</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
          notice.tone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
        }`}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {data.metrics.map((metric) => (
          <div key={metric.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${
              metric.tone === 'danger' ? 'text-rose-600' : metric.tone === 'warning' ? 'text-amber-600' : metric.tone === 'positive' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
            }`}>{metric.value}</p>
            <p className="mt-1 text-xs text-slate-400">{metric.hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900">
        {([
          ['overview', 'Overview', BookOpen],
          ['circulation', 'Circulation', BookCopy],
          ['catalog', 'Catalog', ClipboardCheck],
          ['acquisitions', 'Acquisitions', CircleDollarSign],
          ['clearance', 'Clearance', BadgeCheck],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'circulation' && <CirculationTab data={data} busy={busy} act={act} />}
      {tab === 'catalog' && <CatalogTab data={data} />}
      {tab === 'acquisitions' && <AcquisitionsTab data={data} busy={busy} act={act} />}
      {tab === 'clearance' && <ClearanceTab clearances={data.clearances} />}
    </div>
  );
}

function OverviewTab({ data }: { data: LibraryAdminOverview }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-white">Overdue loans</h3>
        {data.overdueLoans.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No overdue loans. Well done!</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.overdueLoans.slice(0, 8).map((loan) => (
              <li key={loan.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-slate-700 dark:text-slate-200">{loan.title} <span className="text-slate-400">— {loan.memberName}</span></span>
                <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{loan.overdueDays}d overdue</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-white">Membership mix</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between"><span className="text-slate-500">Active members</span><span className="font-medium text-slate-800 dark:text-slate-200">{data.memberships.filter((member) => member.status === 'ACTIVE').length}</span></li>
          <li className="flex justify-between"><span className="text-slate-500">Suspended / blocked</span><span className="font-medium text-slate-800 dark:text-slate-200">{data.memberships.filter((member) => member.status === 'SUSPENDED' || member.status === 'BLOCKED').length}</span></li>
          <li className="flex justify-between"><span className="text-slate-500">Pending acquisitions</span><span className="font-medium text-slate-800 dark:text-slate-200">{data.pendingAcquisitions.length}</span></li>
          <li className="flex justify-between"><span className="text-slate-500">Clearance blocked</span><span className="font-medium text-rose-600">{data.clearances.filter((clearance) => clearance.clearanceStatus === 'BLOCKED').length}</span></li>
        </ul>
      </div>
    </section>
  );
}

function CirculationTab({ data, busy, act }: {
  data: LibraryAdminOverview;
  busy: string | null;
  act: (url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  const [memberId, setMemberId] = useState('');
  const [copyId, setCopyId] = useState('');
  const loans = data.loans.filter((loan) => !loan.returnedAt);
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-white">Issue a physical item</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-48">
            <span className="text-xs font-medium text-slate-500">Member ID</span>
            <select value={memberId} onChange={(event) => setMemberId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <option value="">Select member…</option>
              {data.memberships.filter((member) => member.status === 'ACTIVE').map((member) => (
                <option key={member.id} value={member.id}>{member.memberNumber} — {member.userName}</option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-48">
            <span className="text-xs font-medium text-slate-500">Copy ID</span>
            <input
              value={copyId}
              onChange={(event) => setCopyId(event.target.value)}
              placeholder="Copy UUID or barcode"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <button
            onClick={() => void act('/api/library/circulation', 'POST', { action: 'ISSUE', memberId, copyId }, 'Item issued.')}
            disabled={busy !== null || !memberId || !copyId}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {busy === '/api/library/circulation' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookCopy className="h-4 w-4" />} Issue
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Accession</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loans.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No active loans.</td></tr>}
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{loan.title}</td>
                <td className="px-4 py-3 text-slate-500">{loan.memberName}</td>
                <td className="px-4 py-3 text-slate-500">{loan.accessionNumber}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(loan.dueDate + 'T00:00:00Z').toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {loan.overdueDays > 0
                    ? <span className="rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Overdue</span>
                    : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">On time</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => void act('/api/library/circulation', 'POST', { action: 'RENEW', loanId: loan.id }, 'Loan renewed.')} disabled={busy !== null} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Renew</button>
                    <button onClick={() => void act('/api/library/circulation', 'POST', { action: 'RETURN', loanId: loan.id }, 'Item returned.')} disabled={busy !== null} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Return</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CatalogTab({ data }: { data: LibraryAdminOverview }) {
  const items = data.catalog;
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Titles" value={items.length} />
        <SummaryCard label="Physical copies" value={items.reduce((sum, item) => sum + item.totalCopies, 0)} />
        <SummaryCard label="Available" value={items.reduce((sum, item) => sum + item.availableCopies, 0)} />
        <SummaryCard label="Active reservations" value={data.reservations.length} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Copies</th>
              <th className="px-4 py-3">Available</th>
              <th className="px-4 py-3">On loan</th>
              <th className="px-4 py-3">Waiting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No catalog records yet.</td></tr>}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.authors.map((author) => author.name).join(', ')}</p>
                </td>
                <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800 dark:text-slate-300">{item.resourceType}</span></td>
                <td className="px-4 py-3 text-slate-500">{item.totalCopies}</td>
                <td className="px-4 py-3 text-slate-500">{item.availableCopies}</td>
                <td className="px-4 py-3 text-slate-500">{item.activeLoans}</td>
                <td className="px-4 py-3 text-slate-500">{item.activeReservations}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AcquisitionsTab({ data, busy, act }: {
  data: LibraryAdminOverview;
  busy: string | null;
  act: (url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Requested by</th>
              <th className="px-4 py-3">Est. price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.pendingAcquisitions.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No pending acquisition requests.</td></tr>}
            {data.pendingAcquisitions.map((acquisition) => <AcquisitionRow key={acquisition.id} acquisition={acquisition} busy={busy} act={act} />)}
          </tbody>
        </table>
      </div>
      {data.pendingAcquisitions.some((acquisition) => acquisition.duplicateWarnings.length > 0) && (
        <p className="flex items-center gap-2 text-xs text-amber-600"><ShieldAlert className="h-4 w-4" /> Duplicate warnings are informational — additional copies are never blocked automatically.</p>
      )}
    </section>
  );
}

function AcquisitionRow({ acquisition, busy, act }: {
  acquisition: AcquisitionView;
  busy: string | null;
  act: (url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800 dark:text-slate-200">{acquisition.title}</p>
        {acquisition.duplicateWarnings.length > 0 && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-600"><ShieldAlert className="h-3 w-3" /> {String(acquisition.duplicateWarnings[0])}</p>
        )}
      </td>
      <td className="px-4 py-3 text-slate-500">{acquisition.requestorName ?? '—'}</td>
      <td className="px-4 py-3 text-slate-500">{acquisition.estimatedPriceMinor !== null ? formatMinor(acquisition.estimatedPriceMinor) : '—'}</td>
      <td className="px-4 py-3"><span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{acquisition.status}</span></td>
      <td className="px-4 py-3 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={() => void act(`/api/library/acquisitions?id=${acquisition.id}`, 'PATCH', { decision: 'APPROVE' }, 'Acquisition approved.')} disabled={busy !== null} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
          <button onClick={() => void act(`/api/library/acquisitions?id=${acquisition.id}`, 'PATCH', { decision: 'REJECT' }, 'Acquisition rejected.')} disabled={busy !== null} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reject</button>
        </div>
      </td>
    </tr>
  );
}

function ClearanceTab({ clearances }: { clearances: LibraryClearanceView[] }) {
  return (
    <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Unreturned</th>
            <th className="px-4 py-3">Lost</th>
            <th className="px-4 py-3">Unpaid fines</th>
            <th className="px-4 py-3">Checked</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {clearances.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No clearance records yet.</td></tr>}
          {clearances.map((clearance) => (
            <tr key={clearance.id}>
              <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{clearance.memberName}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  clearance.clearanceStatus === 'CLEAR'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                }`}>{clearance.clearanceStatus}</span>
              </td>
              <td className="px-4 py-3 text-slate-500">{clearance.unreturnedCount}</td>
              <td className="px-4 py-3 text-slate-500">{clearance.lostCount}</td>
              <td className="px-4 py-3 text-slate-500">{formatMinor(clearance.unpaidFineMinor)}</td>
              <td className="px-4 py-3 text-slate-400">{clearance.checkedAt ? new Date(clearance.checkedAt).toLocaleDateString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
