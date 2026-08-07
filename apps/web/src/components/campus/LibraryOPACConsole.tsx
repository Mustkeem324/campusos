'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookMarked,
  BookOpen,
  Bookmark,
  CheckCircle2,
  Clock3,
  DollarSign,
  ExternalLink,
  Filter,
  Library,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  TabletSmartphone,
  Users,
} from 'lucide-react';

type ResourceType = 'PHYSICAL' | 'EBOOK' | 'HYBRID';
type LoanMode = 'PHYSICAL' | 'DIGITAL';
type Tab = 'overview' | 'catalogue' | 'digital' | 'loans' | 'reservations' | 'circulation' | 'publish' | 'policy';

type LibraryItem = {
  id: string;
  title: string;
  isbn: string | null;
  author: string;
  category: string;
  publisher?: string;
  edition?: string;
  language: string;
  description?: string;
  resourceType: ResourceType;
  physical: { total: number; available: number; onLoan: number; reserved: number; shelfLocations: string[] };
  digital: { enabled: boolean; seats: number; availableSeats: number; activeLoans: number; loanDays: number; canReadOnline: boolean };
  tags: string[];
};

type Loan = {
  loanId: string;
  itemId: string;
  borrowerUserId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerRole: string;
  mode: LoanMode;
  copyBarcode?: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  renewedCount: number;
  finalFineAmount?: number;
};

type Reservation = {
  reservationId: string;
  itemId: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
};

type Policy = {
  studentLoanDays: number;
  facultyLoanDays: number;
  renewalDays: number;
  maxRenewals: number;
  maxActiveLoans: number;
  reservationHoldHours: number;
  finePerDay: number;
  currency: string;
  defaultDigitalLoanDays: number;
};

type Workspace = {
  role: string;
  canManage: boolean;
  canBorrow: boolean;
  currentUserId: string;
  items: LibraryItem[];
  loans: Loan[];
  reservations: Reservation[];
  policy: Policy;
  metrics: {
    titles: number;
    physicalCopies: number;
    availablePhysical: number;
    digitalTitles: number;
    activeLoans: number;
    activeBorrowers: number;
    overdueLoans: number;
    activeReservations: number;
    digitalLoans: number;
  };
};

type TabDefinition = { id: Tab; label: string; icon: React.ElementType; manager?: boolean };

const INPUT_CLASS = 'min-h-11 w-full rounded-xl border border-[#CCD8E6] bg-white px-3 text-sm text-[#172033] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-28 py-3`;

const fmtDate = (value: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const isOverdue = (loan: Loan) => !loan.returnedAt && loan.mode === 'PHYSICAL' && new Date(loan.dueAt).getTime() < Date.now();

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function LibraryOPACConsole() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<'ALL' | ResourceType>('ALL');
  const [tab, setTab] = useState<Tab>('catalogue');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/library', { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to load the library.');
      const next = body as Workspace;
      setWorkspace(next);
      setTab((current) => current === 'catalogue' && next.canManage ? 'overview' : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load the library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runAction = useCallback(async (payload: Record<string, unknown>, successMessage: string) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Library action failed.');
      setNotice(successMessage);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Library action failed.');
    } finally {
      setBusy(false);
    }
  }, [load]);

  const filteredItems = useMemo(() => {
    if (!workspace) return [];
    const search = query.trim().toLowerCase();
    return workspace.items.filter((item) => {
      if (format !== 'ALL' && item.resourceType !== format) return false;
      if (!search) return true;
      return [item.title, item.author, item.isbn ?? '', item.category, item.publisher ?? '', ...item.tags]
        .join(' ')
        .toLowerCase()
        .includes(search);
    });
  }, [workspace, query, format]);

  if (loading && !workspace) return <LibraryLoading />;
  if (!workspace) return <LibraryFailure error={error} retry={load} />;

  const allTabs: TabDefinition[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3, manager: true },
    { id: 'catalogue', label: 'Catalogue', icon: Library },
    { id: 'digital', label: 'E-Library', icon: TabletSmartphone },
    { id: 'loans', label: workspace.canManage ? 'Loans & members' : 'My loans', icon: BookOpen },
    { id: 'reservations', label: 'Reservations', icon: Bookmark },
    { id: 'circulation', label: 'Circulation', icon: ScanLine, manager: true },
    { id: 'publish', label: 'Add title', icon: Plus, manager: true },
    { id: 'policy', label: 'Policy', icon: Settings2, manager: true },
  ];
  const tabs = allTabs.filter((entry) => !entry.manager || workspace.canManage);

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#D7E1ED] bg-white shadow-[0_24px_70px_rgba(16,29,56,0.09)] dark:border-slate-800 dark:bg-slate-950">
      <LibraryHeader workspace={workspace} onRefresh={load} loading={loading} />

      <div className="border-b border-[#DFE6EF] bg-[#F8FAFD] px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Library workspace sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-xs font-extrabold transition ${tab === id ? 'border-[#B7CCEE] bg-[#EAF1FF] text-[#1754E8] dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300' : 'border-transparent bg-white text-[#536175] hover:border-[#D8E2EE] dark:bg-slate-950 dark:text-slate-300'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {(error || notice) && <StatusBanner error={error} notice={notice} />}

      <div className="p-4 sm:p-6 lg:p-7">
        {tab === 'overview' && <ManagerOverview workspace={workspace} />}
        {tab === 'catalogue' && (
          <Catalogue
            workspace={workspace}
            items={filteredItems}
            query={query}
            setQuery={setQuery}
            format={format}
            setFormat={setFormat}
            busy={busy}
            action={runAction}
          />
        )}
        {tab === 'digital' && <DigitalLibrary workspace={workspace} busy={busy} action={runAction} />}
        {tab === 'loans' && <Loans workspace={workspace} busy={busy} action={runAction} />}
        {tab === 'reservations' && <Reservations workspace={workspace} busy={busy} action={runAction} />}
        {tab === 'circulation' && workspace.canManage && <Circulation busy={busy} action={runAction} />}
        {tab === 'publish' && workspace.canManage && <PublishTitle onSaved={load} setError={setError} setNotice={setNotice} />}
        {tab === 'policy' && workspace.canManage && <PolicyEditor policy={workspace.policy} busy={busy} action={runAction} />}
      </div>
    </div>
  );
}

function LibraryHeader({ workspace, onRefresh, loading }: { workspace: Workspace; onRefresh: () => Promise<void>; loading: boolean }) {
  return (
    <div className="bg-[#0D1B33] px-5 py-6 text-white sm:px-7 sm:py-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754E8] shadow-[0_12px_28px_rgba(23,84,232,0.28)]">
            <Library className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.13em] text-[#B8C8E0]">Hybrid library</span>
              <span className="rounded-md border border-[#2B765D] bg-[#113D31] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#A7E2CB]">Server-authorised</span>
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Library & Digital Learning Centre</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#BCC9DC]">
              Search physical and licensed digital resources, manage reservations and renewals, and run accountable circulation from one institution-scoped workspace.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => void onRefresh()} disabled={loading} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-extrabold text-white transition hover:bg-white/10 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh library
        </button>
      </div>
    </div>
  );
}

function ManagerOverview({ workspace }: { workspace: Workspace }) {
  const metrics = [
    ['Catalogue titles', workspace.metrics.titles, Library],
    ['Physical copies', workspace.metrics.physicalCopies, BookMarked],
    ['Available now', workspace.metrics.availablePhysical, CheckCircle2],
    ['Digital titles', workspace.metrics.digitalTitles, TabletSmartphone],
    ['Active loans', workspace.metrics.activeLoans, BookOpen],
    ['Active borrowers', workspace.metrics.activeBorrowers, Users],
    ['Overdue', workspace.metrics.overdueLoans, AlertTriangle],
    ['Reservations', workspace.metrics.activeReservations, Bookmark],
  ] as const;

  return (
    <div>
      <SectionTitle eyebrow="Library command centre" title="Circulation, collection and member activity" copy="These figures come from the active institution library ledger, not hard-coded dashboard counts." />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-[#DCE4EE] bg-[#F9FBFD] p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/50 dark:text-blue-300"><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <span className="text-2xl font-black tracking-[-0.04em] text-[#101D38] dark:text-white">{value}</span>
            </div>
            <p className="mt-4 text-xs font-extrabold text-[#536175] dark:text-slate-300">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <InfoCard icon={ScanLine} title="Barcode / RFID circulation" copy="Scan a configured copy code and member email to issue physical material with a server-calculated due date." />
        <InfoCard icon={TabletSmartphone} title="Licensed e-library" copy="Digital seats, access windows and protected PDF/EPUB delivery are enforced per active loan." />
        <InfoCard icon={ShieldCheck} title="Institution policy" copy={`Student ${workspace.policy.studentLoanDays}d · Faculty ${workspace.policy.facultyLoanDays}d · ${workspace.policy.maxRenewals} renewals · fine ${money(workspace.policy.finePerDay, workspace.policy.currency)}/day.`} />
      </div>
    </div>
  );
}

function Catalogue({ workspace, items, query, setQuery, format, setFormat, busy, action }: {
  workspace: Workspace;
  items: LibraryItem[];
  query: string;
  setQuery: (value: string) => void;
  format: 'ALL' | ResourceType;
  setFormat: (value: 'ALL' | ResourceType) => void;
  busy: boolean;
  action: (payload: Record<string, unknown>, message: string) => Promise<void>;
}) {
  return (
    <div>
      <SectionTitle eyebrow="Unified OPAC" title="Search the complete institutional collection" copy="Physical availability and licensed digital-seat availability are shown separately so members know whether to reserve a copy or read online." />
      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative">
          <span className="sr-only">Search library catalogue</span>
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#8A95A6]" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, author, ISBN, category or tag" className={`${INPUT_CLASS} pl-10`} />
        </label>
        <label className="relative">
          <span className="sr-only">Filter catalogue by format</span>
          <Filter className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[#8A95A6]" aria-hidden="true" />
          <select value={format} onChange={(event) => setFormat(event.target.value as 'ALL' | ResourceType)} className={`${INPUT_CLASS} appearance-none pl-10 font-semibold text-[#344054] dark:text-white`}>
            <option value="ALL">All formats</option>
            <option value="PHYSICAL">Physical</option>
            <option value="EBOOK">E-book</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {items.map((item) => <BookCard key={item.id} item={item} workspace={workspace} busy={busy} action={action} />)}
      </div>
      {items.length === 0 && <EmptyState title="No matching titles" copy="Try another search term or remove the format filter." />}
    </div>
  );
}

function BookCard({ item, workspace, busy, action }: { item: LibraryItem; workspace: Workspace; busy: boolean; action: (payload: Record<string, unknown>, message: string) => Promise<void> }) {
  const digitalLoan = workspace.loans.find((loan) => loan.itemId === item.id && loan.mode === 'DIGITAL' && !loan.returnedAt && new Date(loan.dueAt).getTime() > Date.now());
  const reserved = workspace.reservations.some((reservation) => reservation.itemId === item.id && reservation.status === 'ACTIVE' && (!workspace.canManage || reservation.userId === workspace.currentUserId));
  return (
    <article className="flex flex-col rounded-2xl border border-[#D9E2ED] bg-white p-5 transition hover:border-[#B8CAE1] hover:shadow-[0_14px_34px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2"><FormatBadge type={item.resourceType} /><span className="rounded-md border border-[#E0E6EE] bg-[#F8FAFC] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#667085] dark:border-slate-700 dark:bg-slate-950">{item.category}</span></div>
          <h3 className="mt-3 text-lg font-black tracking-[-0.025em] text-[#101828] dark:text-white">{item.title}</h3>
          <p className="mt-1 text-xs font-semibold text-[#667085] dark:text-slate-400">{item.author}{item.edition ? ` · ${item.edition}` : ''}</p>
          {item.isbn && <p className="mt-2 font-mono text-[10px] text-[#8A95A6]">ISBN {item.isbn}</p>}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F5FB] text-[#1754E8] dark:bg-slate-950 dark:text-blue-300"><BookMarked className="h-5 w-5" aria-hidden="true" /></span>
      </div>
      <p className="mt-4 line-clamp-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{item.description || 'Catalogue description not yet provided.'}</p>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Availability label="Physical" value={item.physical.total ? `${item.physical.available}/${item.physical.total} available` : 'Not stocked'} available={item.physical.available > 0} />
        <Availability label="Online" value={item.digital.enabled ? `${item.digital.availableSeats}/${item.digital.seats} seats` : 'Not licensed'} available={item.digital.availableSeats > 0} />
      </div>
      {workspace.canBorrow && (
        <div className="mt-5 flex flex-wrap gap-2">
          {item.resourceType !== 'EBOOK' && (
            <button disabled={busy || reserved} onClick={() => void action({ action: 'RESERVE', itemId: item.id }, 'Physical-book reservation created.')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#C9D7E8] px-3.5 text-xs font-extrabold text-[#334155] hover:bg-[#F7F9FC] disabled:opacity-50 dark:text-slate-200">
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />{reserved ? 'Reserved' : 'Reserve copy'}
            </button>
          )}
          {item.digital.enabled && (digitalLoan ? (
            <Link href={`/api/library/digital/${item.id}`} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-3.5 text-xs font-extrabold text-white hover:bg-[#103FC2]">Read online <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          ) : (
            <button disabled={busy || item.digital.availableSeats < 1} onClick={() => void action({ action: 'BORROW_DIGITAL', itemId: item.id }, 'Digital loan activated. You can now read the e-book online.')} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1754E8] px-3.5 text-xs font-extrabold text-white hover:bg-[#103FC2] disabled:opacity-50"><TabletSmartphone className="h-3.5 w-3.5" aria-hidden="true" />Borrow e-book</button>
          ))}
        </div>
      )}
    </article>
  );
}

function DigitalLibrary({ workspace, busy, action }: { workspace: Workspace; busy: boolean; action: (payload: Record<string, unknown>, message: string) => Promise<void> }) {
  const books = workspace.items.filter((item) => item.digital.enabled);
  return (
    <div>
      <SectionTitle eyebrow="Online library" title="Licensed e-books with controlled lending" copy="Borrowing consumes an institutional digital seat for the configured loan period. Protected files require an active loan before they can be opened." />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{books.map((item) => <BookCard key={item.id} item={item} workspace={workspace} busy={busy} action={action} />)}</div>
      {!books.length && <EmptyState title="No e-books published yet" copy={workspace.canManage ? 'Use Add title to publish a licensed PDF/EPUB or approved provider URL.' : 'The library has not published a licensed online collection yet.'} />}
    </div>
  );
}

function Loans({ workspace, busy, action }: { workspace: Workspace; busy: boolean; action: (payload: Record<string, unknown>, message: string) => Promise<void> }) {
  const rows = [...workspace.loans].sort((a, b) => new Date(b.borrowedAt).getTime() - new Date(a.borrowedAt).getTime());
  const items = new Map(workspace.items.map((item) => [item.id, item]));
  return (
    <div>
      <SectionTitle eyebrow={workspace.canManage ? 'Circulation ledger' : 'My borrowing'} title={workspace.canManage ? 'Active borrowers, due dates and returns' : 'Loans, due dates and renewals'} copy="Due dates and renewal limits are controlled by institutional policy. Physical returns are completed by library staff at circulation." />
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#DCE4EE] dark:border-slate-800">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-[#F7F9FC] text-[10px] font-black uppercase tracking-[0.09em] text-[#667085] dark:bg-slate-900"><tr><th className="p-3.5">Resource</th>{workspace.canManage && <th className="p-3.5">Member</th>}<th className="p-3.5">Mode</th><th className="p-3.5">Due</th><th className="p-3.5">Status</th><th className="p-3.5 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-[#E6EBF1] dark:divide-slate-800">
            {rows.map((loan) => {
              const item = items.get(loan.itemId);
              const overdue = isOverdue(loan);
              return (
                <tr key={loan.loanId} className="bg-white dark:bg-slate-950">
                  <td className="p-3.5"><p className="text-xs font-extrabold text-[#172033] dark:text-white">{item?.title || 'Library resource'}</p><p className="mt-1 font-mono text-[9px] text-[#8A95A6]">{loan.copyBarcode || loan.loanId.slice(0, 8)}</p></td>
                  {workspace.canManage && <td className="p-3.5"><p className="text-xs font-bold text-[#344054] dark:text-slate-300">{loan.borrowerName}</p><p className="mt-1 text-[10px] text-[#8A95A6]">{loan.borrowerEmail}</p></td>}
                  <td className="p-3.5 text-xs font-bold text-[#536175] dark:text-slate-400">{loan.mode === 'DIGITAL' ? 'E-book' : 'Physical'}</td>
                  <td className="p-3.5 text-xs font-bold text-[#536175] dark:text-slate-400">{fmtDate(loan.dueAt)}</td>
                  <td className="p-3.5"><StatusChip tone={loan.returnedAt ? 'neutral' : overdue ? 'danger' : 'success'}>{loan.returnedAt ? 'Returned' : overdue ? 'Overdue' : 'Active'}</StatusChip>{loan.finalFineAmount != null && loan.finalFineAmount > 0 && <p className="mt-1 text-[10px] font-bold text-[#B42318]">Fine {money(loan.finalFineAmount, workspace.policy.currency)}</p>}</td>
                  <td className="p-3.5 text-right">
                    {!loan.returnedAt && (
                      <div className="flex justify-end gap-2">
                        <button disabled={busy || overdue} onClick={() => void action({ action: 'RENEW', loanId: loan.loanId }, 'Loan renewed successfully.')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#CBD8E7] px-3 text-[10px] font-extrabold text-[#344054] disabled:opacity-40 dark:text-slate-200"><RotateCcw className="h-3 w-3" aria-hidden="true" />Renew</button>
                        {workspace.canManage && <button disabled={busy} onClick={() => void action({ action: 'RETURN', loanId: loan.loanId }, 'Book returned and circulation record updated.')} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#101D38] px-3 text-[10px] font-extrabold text-white"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />Return</button>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <EmptyState title="No loan history" copy="Borrowed physical and digital resources will appear here." compact />}
      </div>
    </div>
  );
}

function Reservations({ workspace, busy, action }: { workspace: Workspace; busy: boolean; action: (payload: Record<string, unknown>, message: string) => Promise<void> }) {
  const items = new Map(workspace.items.map((item) => [item.id, item]));
  const rows = [...workspace.reservations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return (
    <div>
      <SectionTitle eyebrow="Physical holds" title={workspace.canManage ? 'Reservation and pickup queue' : 'My physical-book reservations'} copy="Reservations keep demand visible to the library. A reservation is fulfilled automatically when staff checks out a matching title to that member." />
      <div className="mt-6 grid gap-3">
        {rows.map((reservation) => (
          <div key={reservation.reservationId} className="grid gap-4 rounded-2xl border border-[#DCE4EE] bg-[#FAFBFD] p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div><p className="text-sm font-black text-[#172033] dark:text-white">{items.get(reservation.itemId)?.title || 'Library resource'}</p><p className="mt-1 text-[11px] text-[#7A8698]">{workspace.canManage ? `${reservation.userName} · ${reservation.userEmail} · ` : ''}Reserved {fmtDate(reservation.createdAt)}{reservation.expiresAt ? ` · hold until ${fmtDate(reservation.expiresAt)}` : ''}</p></div>
            <div className="flex items-center gap-2"><StatusChip tone={reservation.status === 'ACTIVE' ? 'success' : 'neutral'}>{reservation.status}</StatusChip>{reservation.status === 'ACTIVE' && <button disabled={busy} onClick={() => void action({ action: 'CANCEL_RESERVATION', reservationId: reservation.reservationId }, 'Reservation cancelled.')} className="min-h-9 rounded-lg border border-[#CBD8E7] px-3 text-[10px] font-extrabold text-[#536175] dark:text-slate-300">Cancel</button>}</div>
          </div>
        ))}
        {!rows.length && <EmptyState title="No reservations" copy="Physical-book reservations will appear here." />}
      </div>
    </div>
  );
}

function Circulation({ busy, action }: { busy: boolean; action: (payload: Record<string, unknown>, message: string) => Promise<void> }) {
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [barcode, setBarcode] = useState('');
  return (
    <div>
      <SectionTitle eyebrow="Issue desk" title="Barcode / RFID circulation console" copy="Most USB barcode and RFID readers behave like keyboards. Scan the configured copy code, resolve an eligible student or faculty member, and issue the item under server policy." />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void action({ action: 'CHECKOUT_PHYSICAL', borrowerEmail, barcode }, 'Physical book issued successfully.').then(() => setBarcode(''));
        }}
        className="mt-6 grid gap-4 rounded-2xl border border-[#CCD9E8] bg-[#F8FAFD] p-5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
      >
        <Field label="Member email"><input required type="email" value={borrowerEmail} onChange={(event) => setBorrowerEmail(event.target.value)} placeholder="student@nexus-campus.local" className={INPUT_CLASS} /></Field>
        <Field label="Barcode / RFID"><div className="relative"><ScanLine className="absolute left-3.5 top-3.5 h-4 w-4 text-[#8A95A6]" aria-hidden="true" /><input required autoFocus value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan or enter copy code" className={`${INPUT_CLASS} pl-10`} /></div></Field>
        <button disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white hover:bg-[#103FC2] disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <BookOpen className="h-4 w-4" aria-hidden="true" />}Issue book</button>
      </form>
      <div className="mt-5 grid gap-4 md:grid-cols-3"><InfoCard icon={Clock3} title="Automatic due date" copy="Student and faculty periods come from institutional policy." /><InfoCard icon={Bookmark} title="Reservation aware" copy="Checkout automatically fulfils the member’s active hold for the title." /><InfoCard icon={DollarSign} title="Fine calculation" copy="Overdue fines are calculated at return using the configured currency and daily rate." /></div>
    </div>
  );
}

function PublishTitle({ onSaved, setError, setNotice }: { onSaved: () => Promise<void>; setError: (value: string) => void; setNotice: (value: string) => void }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/library/catalog', { method: 'POST', body: new FormData(form) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Unable to publish the library title.');
      setNotice('Catalogue title published. Copy barcodes and digital access are now available under library policy.');
      form.reset();
      await onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to publish the title.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <SectionTitle eyebrow="Collection management" title="Add physical, digital or hybrid titles" copy="Physical copies receive deterministic accession/barcode identifiers. Licensed PDF/EPUB content is stored behind member-authorised access rather than exposed as a public file URL." />
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-[#D6E1ED] bg-[#FAFBFD] p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Title"><input name="title" required className={INPUT_CLASS} /></Field>
        <Field label="Author"><input name="author" required className={INPUT_CLASS} /></Field>
        <Field label="ISBN"><input name="isbn" className={INPUT_CLASS} /></Field>
        <Field label="Category"><input name="category" required placeholder="Computer Science" className={INPUT_CLASS} /></Field>
        <Field label="Publisher"><input name="publisher" className={INPUT_CLASS} /></Field>
        <Field label="Edition"><input name="edition" className={INPUT_CLASS} /></Field>
        <Field label="Format"><select name="resourceType" defaultValue="PHYSICAL" className={INPUT_CLASS}><option value="PHYSICAL">Physical</option><option value="EBOOK">E-book</option><option value="HYBRID">Hybrid</option></select></Field>
        <Field label="Physical copies"><input name="totalCopies" type="number" min="0" defaultValue="1" className={INPUT_CLASS} /></Field>
        <Field label="Shelf location"><input name="shelfLocation" placeholder="CS-A2" className={INPUT_CLASS} /></Field>
        <Field label="Barcode prefix"><input name="barcodePrefix" placeholder="Optional" className={INPUT_CLASS} /></Field>
        <Field label="Digital licence seats"><input name="digitalSeats" type="number" min="0" defaultValue="0" className={INPUT_CLASS} /></Field>
        <Field label="Digital loan days"><input name="digitalLoanDays" type="number" min="1" defaultValue="7" className={INPUT_CLASS} /></Field>
        <Field label="Licensed PDF / EPUB"><input name="ebook" type="file" accept="application/pdf,application/epub+zip,.pdf,.epub" className={`${INPUT_CLASS} py-2 file:mr-3 file:rounded-md file:border-0 file:bg-[#EDF3FF] file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-[#1754E8]`} /></Field>
        <Field label="Approved external e-book URL"><input name="externalUrl" type="url" placeholder="https://..." className={INPUT_CLASS} /></Field>
        <Field label="Vendor / source"><input name="vendor" className={INPUT_CLASS} /></Field>
        <Field label="Unit cost"><input name="unitCost" type="number" min="0" step="0.01" className={INPUT_CLASS} /></Field>
        <Field label="Currency"><input name="currency" maxLength={3} defaultValue="INR" className={INPUT_CLASS} /></Field>
        <Field label="Tags"><input name="tags" placeholder="algorithms, core, semester-4" className={INPUT_CLASS} /></Field>
        <label className="sm:col-span-2 lg:col-span-3"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.09em] text-[#667085]">Description</span><textarea name="description" rows={4} className={TEXTAREA_CLASS} /></label>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end"><button disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#101D38] px-5 text-xs font-extrabold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}Publish title</button></div>
      </form>
    </div>
  );
}

function PolicyEditor({ policy, busy, action }: { policy: Policy; busy: boolean; action: (payload: Record<string, unknown>, message: string) => Promise<void> }) {
  const [draft, setDraft] = useState(policy);
  useEffect(() => setDraft(policy), [policy]);
  const numberField = (key: keyof Policy, value: string) => setDraft((current) => ({ ...current, [key]: Number(value) }));
  return (
    <div>
      <SectionTitle eyebrow="Institution policy" title="Loan, renewal, reservation and fine rules" copy="Fine policy is no longer hard-coded to $1/day. The library controls its own periods, limits, currency and daily fine rate on the server." />
      <form onSubmit={(event) => { event.preventDefault(); void action({ action: 'SET_POLICY', ...draft }, 'Library policy updated.'); }} className="mt-6 grid gap-4 rounded-2xl border border-[#D6E1ED] bg-[#FAFBFD] p-5 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Student loan days"><input type="number" min="1" value={draft.studentLoanDays} onChange={(event) => numberField('studentLoanDays', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Faculty loan days"><input type="number" min="1" value={draft.facultyLoanDays} onChange={(event) => numberField('facultyLoanDays', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Renewal extension days"><input type="number" min="1" value={draft.renewalDays} onChange={(event) => numberField('renewalDays', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Maximum renewals"><input type="number" min="0" value={draft.maxRenewals} onChange={(event) => numberField('maxRenewals', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Max active loans / member"><input type="number" min="1" value={draft.maxActiveLoans} onChange={(event) => numberField('maxActiveLoans', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Reservation hold hours"><input type="number" min="1" value={draft.reservationHoldHours} onChange={(event) => numberField('reservationHoldHours', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Daily overdue fine"><input type="number" min="0" step="0.01" value={draft.finePerDay} onChange={(event) => numberField('finePerDay', event.target.value)} className={INPUT_CLASS} /></Field>
        <Field label="Currency"><input maxLength={3} value={draft.currency} onChange={(event) => setDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() }))} className={INPUT_CLASS} /></Field>
        <Field label="Default e-book loan days"><input type="number" min="1" value={draft.defaultDigitalLoanDays} onChange={(event) => numberField('defaultDigitalLoanDays', event.target.value)} className={INPUT_CLASS} /></Field>
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end"><button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white disabled:opacity-50"><Settings2 className="h-4 w-4" aria-hidden="true" />Save policy</button></div>
      </form>
    </div>
  );
}

function SectionTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <header className="max-w-3xl"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#1754E8]">{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#101828] dark:text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">{copy}</p></header>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.09em] text-[#667085]">{label}</span>{children}</label>; }
function InfoCard({ icon: Icon, title, copy }: { icon: React.ElementType; title: string; copy: string }) { return <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40"><Icon className="h-4 w-4" aria-hidden="true" /></span><h3 className="mt-4 text-sm font-black text-[#101828] dark:text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{copy}</p></div>; }
function FormatBadge({ type }: { type: ResourceType }) { return <span className="rounded-md border border-[#BED0EB] bg-[#EDF3FF] px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-[#1754E8]">{type === 'EBOOK' ? 'E-book' : type === 'HYBRID' ? 'Physical + e-book' : 'Physical'}</span>; }
function Availability({ label, value, available }: { label: string; value: string; available: boolean }) { return <div className="rounded-xl border border-[#E0E6EE] bg-[#FAFBFD] p-3 dark:border-slate-800 dark:bg-slate-950"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8A95A6]">{label}</p><p className={`mt-1 text-[11px] font-extrabold ${available ? 'text-[#087A55]' : 'text-[#667085]'}`}>{value}</p></div>; }
function StatusChip({ children, tone }: { children: React.ReactNode; tone: 'success' | 'danger' | 'neutral' }) { return <span className={`inline-flex rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-[0.07em] ${tone === 'success' ? 'border-[#BDE5D4] bg-[#EFFAF5] text-[#087A55]' : tone === 'danger' ? 'border-[#F0C8C3] bg-[#FFF3F1] text-[#B42318]' : 'border-[#D9E1EA] bg-[#F8FAFC] text-[#667085]'}`}>{children}</span>; }
function EmptyState({ title, copy, compact = false }: { title: string; copy: string; compact?: boolean }) { return <div className={`${compact ? 'p-6' : 'mt-6 p-10'} text-center`}><BookOpen className="mx-auto h-7 w-7 text-[#A3AEC0]" aria-hidden="true" /><p className="mt-3 text-sm font-black text-[#344054] dark:text-slate-300">{title}</p><p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-[#8A95A6]">{copy}</p></div>; }
function StatusBanner({ error, notice }: { error: string; notice: string }) { const isError = Boolean(error); return <div className={`mx-4 mt-4 flex items-start gap-3 rounded-xl border p-3.5 text-xs font-semibold sm:mx-6 ${isError ? 'border-[#F1C9C4] bg-[#FFF5F3] text-[#B42318]' : 'border-[#BDE5D4] bg-[#EFFAF5] text-[#087A55]'}`}>{isError ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}<span>{error || notice}</span></div>; }
function LibraryLoading() { return <div className="flex min-h-[460px] items-center justify-center rounded-3xl border border-[#D9E2ED] bg-white dark:border-slate-800 dark:bg-slate-950"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-[#1754E8]" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-[#536175] dark:text-slate-300">Preparing the authorised library workspace…</p></div></div>; }
function LibraryFailure({ error, retry }: { error: string; retry: () => Promise<void> }) { return <div className="rounded-3xl border border-[#F0C7C2] bg-white p-8 text-center dark:bg-slate-950"><AlertTriangle className="mx-auto h-8 w-8 text-[#B42318]" aria-hidden="true" /><h2 className="mt-4 text-lg font-black text-[#101828] dark:text-white">Library workspace unavailable</h2><p className="mx-auto mt-2 max-w-lg text-sm text-[#667085]">{error || 'The library data could not be prepared.'}</p><button onClick={() => void retry()} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#101D38] px-4 text-xs font-extrabold text-white"><RefreshCw className="h-4 w-4" aria-hidden="true" />Retry</button></div>; }
