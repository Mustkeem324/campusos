'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Library,
  Loader2,
  RefreshCcw,
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';

import { formatMinor } from '@/lib/finance-money';
import type {
  CatalogRecordView,
  LibraryWorkspaceView,
  LoanView,
  ReservationView,
} from '@/lib/library-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

const STATUS_TONE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  ISSUED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  RESERVED: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  REFERENCE_ONLY: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  LOST: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  DAMAGED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

export function LibraryWorkspace() {
  const [data, setData] = useState<LibraryWorkspaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<'discover' | 'my-loans' | 'reservations' | 'fines'>('discover');

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/library/workspace', { cache: 'no-store' });
    if (!response.ok) {
      const body = await json<{ error?: string }>(response);
      setError(body.error ?? 'Unable to load the library workspace.');
      setLoading(false);
      return;
    }
    setData(await json<LibraryWorkspaceView>(response));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(action: string, payload: Record<string, unknown>, successMessage: string) {
    setBusy(action);
    setNotice(null);
    const response = await fetch('/api/library/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await json<{ error?: string }>(response);
      setNotice({ tone: 'error', text: body.error ?? 'The library action could not be completed.' });
      setBusy(null);
      return;
    }
    setNotice({ tone: 'success', text: successMessage });
    await load();
    setBusy(null);
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const list = [...data.featuredCatalog, ...data.newArrivals]
      .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index);
    if (!q) return list;
    return list.filter((item) =>
      item.title.toLowerCase().includes(q) ||
      (item.isbn ?? '').toLowerCase().includes(q) ||
      (item.subject ?? '').toLowerCase().includes(q) ||
      item.authors.some((author) => author.name.toLowerCase().includes(q)),
    );
  }, [data, query]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading library…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="font-medium text-rose-700 dark:text-rose-300">{error ?? 'Library unavailable.'}</p>
        <button
          onClick={() => void load()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
        >
          <RefreshCcw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Library & Digital Resources</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Discover the institutional catalog, manage loans and track fines — everything is institution-scoped.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {notice && (
        <div className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
          notice.tone === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
            : notice.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
              : 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300'
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
          ['discover', 'Discover', BookOpen],
          ['my-loans', 'My loans', BookMarked],
          ['reservations', 'Reservations', CalendarClock],
          ['fines', 'Fines', WalletCards],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <section className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, author, ISBN or subject…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
              <Library className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No catalog records match your search.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => <CatalogCard key={item.id} item={item} busy={busy} onReserve={(id) => void act('reservations', { recordId: id }, 'Reservation created.')} />)}
            </div>
          )}
        </section>
      )}

      {tab === 'my-loans' && (
        <section className="space-y-3">
          {data.myLoans.length === 0 ? (
            <EmptyState title="No loans" hint="Borrowed items will appear here." />
          ) : (
            data.myLoans.map((loan) => <LoanRow key={loan.id} loan={loan} busy={busy} onRenew={(id) => void act('circulation', { action: 'RENEW', loanId: id }, 'Loan renewed.')} />)
          )}
        </section>
      )}

      {tab === 'reservations' && (
        <section className="space-y-3">
          {data.myReservations.length === 0 ? (
            <EmptyState title="No reservations" hint="Reserve an unavailable title to join its queue." />
          ) : (
            data.myReservations.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} busy={busy} onCancel={(id) => void act('reservations', { recordId: id }, 'Reservation cancelled.')} />
            ))
          )}
        </section>
      )}

      {tab === 'fines' && (
        <section className="space-y-3">
          {data.myFines.length === 0 ? (
            <EmptyState title="No fine history" hint="Assessed and waived fines will appear here." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.myFines.map((fine) => (
                    <tr key={fine.id}>
                      <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fine.eventType === 'WAIVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>{fine.eventType}</span></td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{formatMinor(fine.amountMinor, fine.currency)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{fine.reason ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(fine.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CatalogCard({ item, busy, onReserve }: { item: CatalogRecordView; busy: string | null; onReserve: (id: string) => void }) {
  const available = item.availableCopies > 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {item.authors.map((author) => author.name).join(', ') || 'Author'}{item.publicationYear ? ` • ${item.publicationYear}` : ''}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${available ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
          {available ? 'Available' : 'On loan'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">{item.resourceType}</span>
        {item.isbn && <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">ISBN {item.isbn}</span>}
        {item.subject && <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">{item.subject}</span>}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {item.totalCopies} copy{item.totalCopies === 1 ? '' : 's'} • {item.availableCopies} available
          {item.activeReservations > 0 ? ` • ${item.activeReservations} waiting` : ''}
        </p>
        {!available && (
          <button
            onClick={() => onReserve(item.id)}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"
          >
            {busy === 'reservations' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
            Reserve
          </button>
        )}
      </div>
    </div>
  );
}

function LoanRow({ loan, busy, onRenew }: { loan: LoanView; busy: string | null; onRenew: (id: string) => void }) {
  const overdue = !loan.returnedAt && loan.overdueDays > 0;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <p className="font-medium text-slate-900 dark:text-white">{loan.title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{loan.accessionNumber} • Due {new Date(loan.dueDate + 'T00:00:00Z').toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-3">
        {overdue && <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Overdue {loan.overdueDays}d</span>}
        {loan.returnedAt ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Returned</span>
        ) : (
          <button
            onClick={() => onRenew(loan.id)}
            disabled={busy !== null}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {busy === 'circulation' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Renew'}
          </button>
        )}
      </div>
    </div>
  );
}

function ReservationRow({ reservation, busy, onCancel }: { reservation: ReservationView; busy: string | null; onCancel: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="font-medium text-slate-900 dark:text-white">{reservation.title}</p>
        <p className="mt-0.5 text-xs text-slate-400">Queue position #{reservation.queuePosition}{reservation.expiresAt ? ` • Held until ${new Date(reservation.expiresAt).toLocaleString()}` : ''}</p>
      </div>
      <button
        onClick={() => onCancel(reservation.id)}
        disabled={busy !== null}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}
