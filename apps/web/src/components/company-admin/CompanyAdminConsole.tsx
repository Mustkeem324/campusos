'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';

import type {
  CompanyAdminContract,
  CompanyAdminDashboardData,
  CompanyAdminInstitution,
  ContractHealth,
} from '@/lib/company-admin-types';
import { Logo } from '@/components/ui/Logo';
import {
  AddInstitutionModal,
  ContractEditorModal,
  InstitutionDetailModal,
  InstitutionStatusModal,
} from './CompanyAdminModals';

type View = 'overview' | 'institutions' | 'contracts' | 'operations' | 'activity';

const navItems: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'institutions', label: 'Institutions', icon: Building2 },
  { id: 'contracts', label: 'Contracts & Renewals', icon: FileText },
  { id: 'operations', label: 'Operations', icon: Wrench },
  { id: 'activity', label: 'Activity & Audit', icon: Activity },
];

const healthTone: Record<ContractHealth, string> = {
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  EXPIRING: 'border-amber-200 bg-amber-50 text-amber-700',
  EXPIRED: 'border-rose-200 bg-rose-50 text-rose-700',
  SUSPENDED: 'border-slate-300 bg-slate-100 text-slate-700',
  TRIAL: 'border-blue-200 bg-blue-50 text-blue-700',
  CANCELLED: 'border-slate-300 bg-slate-100 text-slate-600',
  UNCONTRACTED: 'border-orange-200 bg-orange-50 text-orange-700',
};

function compactNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatMoney(minor: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toLocaleString('en-IN')}`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CA';
}

function currentContract(institution: CompanyAdminInstitution) {
  return institution.contract;
}

function institutionHealth(institution: CompanyAdminInstitution): ContractHealth {
  if (!institution.contract) return 'UNCONTRACTED';
  return institution.contract.health;
}

function statusTone(status: string) {
  const value = status.toUpperCase();
  if (value === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (value === 'TRIAL') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (['SUSPENDED', 'INACTIVE', 'DISABLED'].includes(value)) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function CompanyAdminConsole({ data }: { data: CompanyAdminDashboardData }) {
  const router = useRouter();
  const [view, setView] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [institutionStatus, setInstitutionStatus] = useState('ALL');
  const [contractHealthFilter, setContractHealthFilter] = useState('ALL');
  const [addInstitutionOpen, setAddInstitutionOpen] = useState(false);
  const [detailInstitution, setDetailInstitution] = useState<CompanyAdminInstitution | null>(null);
  const [statusInstitution, setStatusInstitution] = useState<CompanyAdminInstitution | null>(null);
  const [contractEditor, setContractEditor] = useState<{ institution: CompanyAdminInstitution; contract: CompanyAdminContract | null; renewal?: boolean } | null>(null);

  const filteredInstitutions = useMemo(() => {
    const query = institutionSearch.trim().toLowerCase();
    return data.institutions.filter((institution) => {
      const matchesQuery = !query || [institution.name, institution.code, institution.subdomain, institution.contract?.planName, institution.contract?.primaryContactEmail]
        .some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = institutionStatus === 'ALL' || institution.status.toUpperCase() === institutionStatus;
      return matchesQuery && matchesStatus;
    });
  }, [data.institutions, institutionSearch, institutionStatus]);

  const filteredContracts = useMemo(() => {
    const query = institutionSearch.trim().toLowerCase();
    const institutionById = new Map(data.institutions.map((item) => [item.id, item]));
    return data.contracts.filter((contract) => {
      const institution = institutionById.get(contract.institutionId);
      const matchesQuery = !query || [contract.contractNumber, contract.planName, institution?.name, contract.accountOwner, contract.primaryContactEmail]
        .some((value) => value?.toLowerCase().includes(query));
      const matchesHealth = contractHealthFilter === 'ALL' || contract.health === contractHealthFilter;
      return matchesQuery && matchesHealth;
    });
  }, [contractHealthFilter, data.contracts, data.institutions, institutionSearch]);

  const alertCount = data.metrics.expiringContracts + data.metrics.expiredContracts + data.metrics.uncontractedInstitutions + data.metrics.suspendedInstitutions;

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.replace('/login');
    router.refresh();
  }

  function changeView(next: View) {
    setView(next);
    setSidebarOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#172033]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[286px] flex-col bg-[#09152A] text-white shadow-[24px_0_70px_rgba(9,21,42,0.12)] transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-5">
          <Logo className="h-10 w-10" showText={false} />
          <div className="min-w-0">
            <p className="text-[17px] font-extrabold tracking-[-0.025em]">CampusOS</p>
            <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8298BB]">Company control center</p>
          </div>
          <button type="button" onClick={() => setSidebarOpen(false)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-[#A9B8CF] hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-4 pb-3 pt-5">
          <div className="rounded-2xl border border-[#294263] bg-[#10233F] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1754E8] text-white"><ShieldCheck className="h-5 w-5" /></span>
              <div className="min-w-0"><p className="truncate text-sm font-extrabold">Platform owner access</p><p className="mt-1 text-[10px] text-[#9FB0C8]">Cross-institution control plane</p></div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Company administration">
          <p className="px-3 pb-2 pt-3 text-[9px] font-extrabold uppercase tracking-[0.17em] text-[#607694]">Portfolio management</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => changeView(id)} className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold transition ${view === id ? 'bg-[#1754E8] text-white shadow-[0_10px_24px_rgba(23,84,232,0.28)]' : 'text-[#AFC0D7] hover:bg-white/[0.06] hover:text-white'}`}>
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className="flex-1">{label}</span>
              {id === 'contracts' && alertCount > 0 && <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${view === id ? 'bg-white/20 text-white' : 'bg-amber-400/15 text-amber-300'}`}>{alertCount}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-black">{initials(data.actor.name)}</span>
            <div className="min-w-0"><p className="truncate text-xs font-extrabold">{data.actor.name}</p><p className="mt-0.5 truncate text-[10px] text-[#8298BB]">{data.actor.email}</p></div>
          </div>
          <button type="button" onClick={signOut} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-xs font-bold text-[#9FB0C8] transition hover:bg-white/[0.06] hover:text-white"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="fixed inset-0 z-40 bg-[#071225]/55 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <div className="min-h-screen lg:pl-[286px]">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center border-b border-[#DDE5EF] bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" onClick={() => setSidebarOpen(true)} className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1EC] text-[#344054] lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#7C8A9F]">CampusOS company administration</p>
            <h1 className="mt-1 truncate text-lg font-extrabold tracking-[-0.025em] text-[#101D38] sm:text-xl">{navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-emerald-700 sm:inline-flex"><span className="h-2 w-2 rounded-full bg-emerald-500" />Live portfolio</span>
            <button type="button" onClick={() => changeView('contracts')} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1EC] bg-white text-[#526071] hover:bg-[#F7F9FC]" aria-label={`${alertCount} portfolio alerts`}><Bell className="h-4.5 w-4.5" />{alertCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E5484D] px-1 text-[9px] font-black text-white">{Math.min(alertCount, 99)}</span>}</button>
            <Link href="/" className="hidden min-h-10 items-center rounded-xl border border-[#D8E1EC] px-4 text-xs font-bold text-[#526071] hover:bg-[#F7F9FC] md:inline-flex">Public website</Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1660px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          {!data.controlPlaneReady && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">Commercial storage has not been provisioned yet</p><p className="mt-1 text-xs leading-5 text-amber-800">Institution records are available, but contracts and company audit events will appear after the deployment database-preparation step creates the control-plane tables.</p></div></div>
          )}

          {view === 'overview' && <Overview data={data} onViewContracts={() => changeView('contracts')} onViewInstitutions={() => changeView('institutions')} onAddInstitution={() => setAddInstitutionOpen(true)} />}
          {view === 'institutions' && <InstitutionsView data={data} institutions={filteredInstitutions} search={institutionSearch} setSearch={setInstitutionSearch} status={institutionStatus} setStatus={setInstitutionStatus} onAdd={() => setAddInstitutionOpen(true)} onDetails={setDetailInstitution} onStatus={setStatusInstitution} onContract={(institution) => setContractEditor({ institution, contract: currentContract(institution) })} />}
          {view === 'contracts' && <ContractsView data={data} contracts={filteredContracts} search={institutionSearch} setSearch={setInstitutionSearch} health={contractHealthFilter} setHealth={setContractHealthFilter} onEdit={(contract) => { const institution = data.institutions.find((item) => item.id === contract.institutionId); if (institution) setContractEditor({ institution, contract }); }} onRenew={(contract) => { const institution = data.institutions.find((item) => item.id === contract.institutionId); if (institution) setContractEditor({ institution, contract, renewal: true }); }} />}
          {view === 'operations' && <OperationsView data={data} onDetails={setDetailInstitution} />}
          {view === 'activity' && <ActivityView data={data} />}
        </main>
      </div>

      <AddInstitutionModal open={addInstitutionOpen} onClose={() => setAddInstitutionOpen(false)} />
      <InstitutionDetailModal institution={detailInstitution} onClose={() => setDetailInstitution(null)} onEditContract={(institution) => { setDetailInstitution(null); setContractEditor({ institution, contract: institution.contract }); }} onChangeStatus={(institution) => { setDetailInstitution(null); setStatusInstitution(institution); }} />
      <InstitutionStatusModal institution={statusInstitution} onClose={() => setStatusInstitution(null)} />
      <ContractEditorModal context={contractEditor} onClose={() => setContractEditor(null)} />
    </div>
  );
}

function Overview({ data, onViewContracts, onViewInstitutions, onAddInstitution }: { data: CompanyAdminDashboardData; onViewContracts: () => void; onViewInstitutions: () => void; onAddInstitution: () => void }) {
  const { metrics } = data;
  const attention = data.institutions
    .filter((item) => ['EXPIRING', 'EXPIRED', 'UNCONTRACTED', 'SUSPENDED'].includes(institutionHealth(item)) || ['SUSPENDED', 'INACTIVE', 'DISABLED'].includes(item.status.toUpperCase()))
    .slice(0, 8);
  const maxGrowth = Math.max(1, ...data.growth.map((item) => item.institutions));
  const currencySet = new Set(data.contracts.filter((item) => ['ACTIVE', 'EXPIRING', 'TRIAL'].includes(item.health)).map((item) => item.currency));
  const portfolioValue = currencySet.size <= 1 ? formatMoney(metrics.annualizedPortfolioValueMinor, [...currencySet][0] || 'INR') : `${currencySet.size} currencies`;

  const cards = [
    { label: 'Institutions', value: metrics.totalInstitutions.toLocaleString('en-IN'), detail: `${metrics.activeInstitutions} active · ${metrics.trialInstitutions} trial`, icon: Building2 },
    { label: 'Active users', value: compactNumber(metrics.totalUsers), detail: `${compactNumber(metrics.totalStudents)} students across customers`, icon: UsersRound },
    { label: 'Annualized portfolio', value: portfolioValue, detail: `${metrics.activeContracts} healthy current contracts`, icon: CircleDollarSign },
    { label: 'Renewal attention', value: (metrics.expiringContracts + metrics.expiredContracts).toString(), detail: `${metrics.expiringContracts} expiring · ${metrics.expiredContracts} expired`, icon: CalendarDays },
    { label: 'Support footprint', value: metrics.openSupportCases.toLocaleString('en-IN'), detail: 'Support cases across institutions', icon: LifeBuoy },
    { label: 'Implementations', value: metrics.implementationProjects.toLocaleString('en-IN'), detail: `${metrics.totalCampuses} campuses connected`, icon: Wrench },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[#D7E1ED] bg-white shadow-[0_14px_42px_rgba(16,29,56,0.055)]">
        <div className="grid gap-7 bg-[radial-gradient(circle_at_85%_20%,rgba(23,84,232,0.17),transparent_30%),linear-gradient(135deg,#101D38_0%,#142A52_56%,#0D3660_100%)] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-[850px]"><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#C7D8F4]"><ShieldCheck className="h-3.5 w-3.5" />Company command center</div><h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] sm:text-[40px]">Run the CampusOS customer portfolio from one place</h2><p className="mt-4 max-w-[780px] text-sm leading-7 text-[#C2D0E4] sm:text-base">Track every college and university, contract health, renewal dates, licensed capacity, customer operations and platform account actions without entering institution-owned academic data.</p></div>
          <div className="flex flex-wrap gap-3 lg:flex-col"><button type="button" onClick={onAddInstitution} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-[#101D38] shadow-[0_10px_24px_rgba(0,0,0,0.14)]"><Plus className="h-4 w-4" />Add institution</button><button type="button" onClick={onViewContracts} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.07] px-5 text-sm font-bold text-white">Review renewals <ChevronRight className="h-4 w-4" /></button></div>
        </div>
        <div className="grid gap-px bg-[#E5EBF2] sm:grid-cols-2 xl:grid-cols-6">
          {cards.map(({ label, value, detail, icon: Icon }) => <article key={label} className="bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7C899B]">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38]">{value}</p></div><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4.5 w-4.5" /></span></div><p className="mt-2 text-[11px] leading-5 text-[#7C899B]">{detail}</p></article>)}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="rounded-[24px] border border-[#DCE4EE] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-base font-extrabold text-[#101D38]">Portfolio growth</p><p className="mt-1 text-xs text-[#7C899B]">New institution records created during the last six months</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><TrendingUp className="h-4 w-4" /></span></div>
          <div className="mt-7 grid h-[230px] grid-cols-6 items-end gap-3 border-b border-[#DCE4EE] px-1 pb-0">
            {data.growth.map((item) => <div key={item.label} className="flex h-full flex-col items-center justify-end gap-2"><span className="text-[10px] font-extrabold text-[#526071]">{item.institutions}</span><div className="w-full max-w-12 rounded-t-lg bg-[#1754E8] shadow-[0_-8px_18px_rgba(23,84,232,0.14)]" style={{ height: `${Math.max(6, (item.institutions / maxGrowth) * 170)}px` }} /><span className="pb-2 text-[10px] font-bold uppercase tracking-wide text-[#8A95A6]">{item.label}</span></div>)}
          </div>
        </section>

        <section className="rounded-[24px] border border-[#DCE4EE] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-base font-extrabold text-[#101D38]">Needs attention</p><p className="mt-1 text-xs text-[#7C899B]">Commercial or lifecycle items requiring follow-up</p></div><button type="button" onClick={onViewInstitutions} className="text-xs font-extrabold text-[#1754E8]">View all</button></div>
          <div className="mt-5 space-y-3">
            {attention.length === 0 ? <EmptyState icon={CheckCircle2} title="Portfolio is healthy" text="There are no urgent renewal or account-state exceptions." /> : attention.map((institution) => { const health = institutionHealth(institution); return <button type="button" key={institution.id} onClick={onViewInstitutions} className="flex w-full items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FAFBFD] p-3 text-left transition hover:border-[#B9CBE3] hover:bg-white"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${health === 'EXPIRED' || institution.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}><AlertTriangle className="h-4.5 w-4.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-extrabold text-[#101D38]">{institution.name}</span><span className="mt-1 block truncate text-[10px] text-[#7C899B]">{institution.contract ? `${institution.contract.planName} · ${institution.contract.daysRemaining} days remaining` : 'No commercial contract recorded'}</span></span><span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${healthTone[health]}`}>{health}</span></button>; })}
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-[#DCE4EE] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] sm:p-6">
        <div className="flex items-center justify-between gap-4"><div><p className="text-base font-extrabold text-[#101D38]">Recently updated institutions</p><p className="mt-1 text-xs text-[#7C899B]">Latest customer account activity from the institution registry</p></div><button type="button" onClick={onViewInstitutions} className="text-xs font-extrabold text-[#1754E8]">Manage portfolio</button></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{data.institutions.slice(0, 4).map((institution) => <div key={institution.id} className="rounded-2xl border border-[#E1E7EF] p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-xs font-black text-[#1754E8]">{initials(institution.name)}</span><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#101D38]">{institution.name}</p><p className="mt-1 text-[10px] text-[#7C899B]">{institution.code} · {institution.subdomain}</p></div></div><div className="mt-4 flex items-center justify-between"><span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${statusTone(institution.status)}`}>{institution.status}</span><span className="text-[10px] text-[#8A95A6]">{institution.users} users</span></div></div>)}</div>
      </section>
    </div>
  );
}

function InstitutionsView({ data, institutions, search, setSearch, status, setStatus, onAdd, onDetails, onStatus, onContract }: { data: CompanyAdminDashboardData; institutions: CompanyAdminInstitution[]; search: string; setSearch: (value: string) => void; status: string; setStatus: (value: string) => void; onAdd: () => void; onDetails: (institution: CompanyAdminInstitution) => void; onStatus: (institution: CompanyAdminInstitution) => void; onContract: (institution: CompanyAdminInstitution) => void }) {
  return <div className="space-y-5"><PageIntro eyebrow="Customer portfolio" title="Institutions" description="Manage every college or university using CampusOS, including account lifecycle, licensed footprint, contract health and customer operations." action={<button type="button" onClick={onAdd} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.22)]"><Plus className="h-4 w-4" />Add institution</button>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MiniMetric label="Active" value={data.metrics.activeInstitutions} tone="emerald" /><MiniMetric label="Trial" value={data.metrics.trialInstitutions} tone="blue" /><MiniMetric label="Suspended / inactive" value={data.metrics.suspendedInstitutions} tone="rose" /><MiniMetric label="No contract" value={data.metrics.uncontractedInstitutions} tone="amber" /></div>
    <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)]"><div className="flex flex-col gap-3 border-b border-[#E3E9F1] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative min-w-0 flex-1 sm:max-w-[460px]"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search institution, code, workspace or plan…" className="min-h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none focus:border-[#1754E8] focus:bg-white focus:ring-4 focus:ring-[#1754E8]/10" /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm font-bold text-[#475467] outline-none focus:border-[#1754E8]"><option value="ALL">All lifecycle states</option><option value="ACTIVE">Active</option><option value="TRIAL">Trial</option><option value="SUSPENDED">Suspended</option><option value="INACTIVE">Inactive</option><option value="DISABLED">Disabled</option></select></div>
      <div className="overflow-x-auto"><table className="min-w-[1180px] w-full border-collapse"><thead><tr className="bg-[#F8FAFC] text-left">{['Institution', 'Lifecycle', 'Contract', 'Footprint', 'Operations', 'Renewal', 'Actions'].map((item) => <th key={item} className="border-b border-[#E3E9F1] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B]">{item}</th>)}</tr></thead><tbody>{institutions.map((institution) => { const contract = institution.contract; const health = institutionHealth(institution); return <tr key={institution.id} className="border-b border-[#EEF2F6] last:border-0 hover:bg-[#FBFCFE]"><td className="px-4 py-4"><button type="button" onClick={() => onDetails(institution)} className="flex items-center gap-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-xs font-black text-[#1754E8]">{initials(institution.name)}</span><span className="min-w-0"><span className="block max-w-[260px] truncate text-xs font-extrabold text-[#101D38]">{institution.name}</span><span className="mt-1 block text-[10px] text-[#7C899B]">{institution.code} · {institution.subdomain}</span></span></button></td><td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${statusTone(institution.status)}`}>{institution.status}</span></td><td className="px-4 py-4"><p className="text-xs font-extrabold text-[#344054]">{contract?.planName || 'Not configured'}</p><span className={`mt-1.5 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${healthTone[health]}`}>{health}</span></td><td className="px-4 py-4"><p className="text-xs font-bold text-[#344054]">{institution.students.toLocaleString('en-IN')} students</p><p className="mt-1 text-[10px] text-[#7C899B]">{institution.users.toLocaleString('en-IN')} users · {institution.campuses} campuses</p></td><td className="px-4 py-4"><p className="text-xs font-bold text-[#344054]">{institution.supportCases} support cases</p><p className="mt-1 text-[10px] text-[#7C899B]">{institution.implementationProjects} implementation projects</p></td><td className="px-4 py-4">{contract ? <><p className={`text-xs font-extrabold ${contract.daysRemaining < 0 ? 'text-rose-600' : contract.daysRemaining <= 60 ? 'text-amber-700' : 'text-[#344054]'}`}>{contract.daysRemaining < 0 ? `${Math.abs(contract.daysRemaining)} days overdue` : `${contract.daysRemaining} days`}</p><p className="mt-1 text-[10px] text-[#7C899B]">{formatDate(contract.endsAt)}</p></> : <span className="text-xs font-bold text-orange-600">Contract needed</span>}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><button type="button" onClick={() => onDetails(institution)} className="min-h-9 rounded-lg border border-[#D8E1EC] px-3 text-[10px] font-extrabold text-[#344054] hover:bg-[#F7F9FC]">View</button><button type="button" onClick={() => onContract(institution)} className="min-h-9 rounded-lg border border-[#BFD0EA] bg-[#F4F7FD] px-3 text-[10px] font-extrabold text-[#1754E8]">Contract</button><button type="button" onClick={() => onStatus(institution)} className="min-h-9 rounded-lg bg-[#101D38] px-3 text-[10px] font-extrabold text-white">Status</button></div></td></tr>; })}</tbody></table></div>
      {institutions.length === 0 && <div className="p-8"><EmptyState icon={Search} title="No institutions match" text="Adjust the search or lifecycle filter." /></div>}
    </section></div>;
}

function ContractsView({ data, contracts, search, setSearch, health, setHealth, onEdit, onRenew }: { data: CompanyAdminDashboardData; contracts: CompanyAdminContract[]; search: string; setSearch: (value: string) => void; health: string; setHealth: (value: string) => void; onEdit: (contract: CompanyAdminContract) => void; onRenew: (contract: CompanyAdminContract) => void }) {
  const institutionById = new Map(data.institutions.map((item) => [item.id, item]));
  return <div className="space-y-5"><PageIntro eyebrow="Commercial operations" title="Contracts & renewals" description="Track contract terms, plan, value, licensed capacity, renewal windows, account owner and expiry history for every institution." />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MiniMetric label="Healthy" value={data.metrics.activeContracts} tone="emerald" /><MiniMetric label="Expiring" value={data.metrics.expiringContracts} tone="amber" /><MiniMetric label="Expired" value={data.metrics.expiredContracts} tone="rose" /><MiniMetric label="Uncontracted" value={data.metrics.uncontractedInstitutions} tone="slate" /></div>
    <section className="overflow-hidden rounded-[24px] border border-[#DCE4EE] bg-white shadow-[0_10px_30px_rgba(16,29,56,0.04)]"><div className="flex flex-col gap-3 border-b border-[#E3E9F1] p-4 sm:flex-row"><div className="relative min-w-0 flex-1 sm:max-w-[480px]"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contract, institution, owner or contact…" className="min-h-11 w-full rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] pl-11 pr-4 text-sm outline-none focus:border-[#1754E8] focus:bg-white focus:ring-4 focus:ring-[#1754E8]/10" /></div><select value={health} onChange={(event) => setHealth(event.target.value)} className="min-h-11 rounded-xl border border-[#CBD5E1] bg-white px-4 text-sm font-bold text-[#475467]"><option value="ALL">All contract health</option><option value="ACTIVE">Active</option><option value="EXPIRING">Expiring</option><option value="EXPIRED">Expired</option><option value="TRIAL">Trial</option><option value="SUSPENDED">Suspended</option><option value="CANCELLED">Cancelled</option></select></div>
      <div className="overflow-x-auto"><table className="min-w-[1200px] w-full"><thead><tr className="bg-[#F8FAFC]">{['Contract', 'Institution', 'Plan & value', 'Term', 'Capacity', 'Owner / contact', 'Health', 'Actions'].map((item) => <th key={item} className="border-b border-[#E3E9F1] px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B]">{item}</th>)}</tr></thead><tbody>{contracts.map((contract) => { const institution = institutionById.get(contract.institutionId); return <tr key={contract.id} className="border-b border-[#EEF2F6] last:border-0 hover:bg-[#FBFCFE]"><td className="px-4 py-4"><p className="text-xs font-extrabold text-[#101D38]">{contract.contractNumber}</p><p className="mt-1 text-[10px] text-[#7C899B]">{contract.billingCycle.replaceAll('_', ' ')}</p></td><td className="px-4 py-4"><p className="max-w-[240px] truncate text-xs font-extrabold text-[#344054]">{institution?.name || 'Unknown institution'}</p><p className="mt-1 text-[10px] text-[#7C899B]">{institution?.code}</p></td><td className="px-4 py-4"><p className="text-xs font-extrabold text-[#344054]">{contract.planName}</p><p className="mt-1 text-[10px] font-bold text-[#1754E8]">{formatMoney(contract.contractValueMinor, contract.currency)}</p></td><td className="px-4 py-4"><p className="text-xs font-bold text-[#344054]">{formatDate(contract.startsAt)}</p><p className="mt-1 text-[10px] text-[#7C899B]">to {formatDate(contract.endsAt)}</p></td><td className="px-4 py-4"><p className="text-xs font-bold text-[#344054]">{contract.licensedStudents?.toLocaleString('en-IN') ?? '—'} students</p><p className="mt-1 text-[10px] text-[#7C899B]">{contract.licensedStaff?.toLocaleString('en-IN') ?? '—'} staff</p></td><td className="px-4 py-4"><p className="text-xs font-bold text-[#344054]">{contract.accountOwner || 'Unassigned'}</p><p className="mt-1 max-w-[200px] truncate text-[10px] text-[#7C899B]">{contract.primaryContactEmail || 'No customer contact'}</p></td><td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-[9px] font-extrabold ${healthTone[contract.health]}`}>{contract.health}</span><p className="mt-2 text-[10px] text-[#7C899B]">{contract.daysRemaining < 0 ? `${Math.abs(contract.daysRemaining)} days past end` : `${contract.daysRemaining} days remaining`}</p></td><td className="px-4 py-4"><div className="flex gap-2"><button type="button" onClick={() => onEdit(contract)} className="min-h-9 rounded-lg border border-[#D8E1EC] px-3 text-[10px] font-extrabold text-[#344054]">Edit</button><button type="button" onClick={() => onRenew(contract)} className="min-h-9 rounded-lg bg-[#1754E8] px-3 text-[10px] font-extrabold text-white">Renew</button></div></td></tr>; })}</tbody></table></div>{contracts.length === 0 && <div className="p-8"><EmptyState icon={FileText} title="No contracts match" text="Change the search/filter or create a contract from the Institutions view." /></div>}</section></div>;
}

function OperationsView({ data, onDetails }: { data: CompanyAdminDashboardData; onDetails: (institution: CompanyAdminInstitution) => void }) {
  const risk = data.institutions.slice().sort((a, b) => (b.supportCases + b.implementationProjects) - (a.supportCases + a.implementationProjects));
  return <div className="space-y-5"><PageIntro eyebrow="Customer success & delivery" title="Operations" description="See customer support volume, implementation footprint, licensed usage and commercial risk signals across the CampusOS portfolio." />
    <div className="grid gap-4 lg:grid-cols-3"><article className="rounded-[22px] border border-[#DCE4EE] bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Wrench className="h-5 w-5" /></span><p className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38]">{data.metrics.implementationProjects}</p><p className="mt-1 text-xs font-bold text-[#526071]">Implementation projects recorded</p></article><article className="rounded-[22px] border border-[#DCE4EE] bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><LifeBuoy className="h-5 w-5" /></span><p className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38]">{data.metrics.openSupportCases}</p><p className="mt-1 text-xs font-bold text-[#526071]">Support cases recorded</p></article><article className="rounded-[22px] border border-[#DCE4EE] bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><GraduationCap className="h-5 w-5" /></span><p className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38]">{compactNumber(data.metrics.totalStudents)}</p><p className="mt-1 text-xs font-bold text-[#526071]">Students represented in customer tenants</p></article></div>
    <section className="rounded-[24px] border border-[#DCE4EE] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-base font-extrabold text-[#101D38]">Institution operations watchlist</p><p className="mt-1 text-xs text-[#7C899B]">Higher support and implementation volume is surfaced first</p></div></div><div className="mt-5 grid gap-3 lg:grid-cols-2">{risk.map((institution) => { const contract = institution.contract; const licensed = contract?.licensedStudents; const utilization = licensed && licensed > 0 ? Math.min(100, Math.round((institution.students / licensed) * 100)) : null; return <button key={institution.id} type="button" onClick={() => onDetails(institution)} className="rounded-2xl border border-[#E1E7EF] p-4 text-left transition hover:border-[#B9CBE3] hover:shadow-[0_10px_26px_rgba(16,29,56,0.06)]"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-xs font-black text-[#1754E8]">{initials(institution.name)}</span><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#101D38]">{institution.name}</p><p className="mt-1 text-[10px] text-[#7C899B]">{institution.campuses} campuses · {institution.users} users</p></div></div><span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${healthTone[institutionHealth(institution)]}`}>{institutionHealth(institution)}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><SmallStat label="Support" value={institution.supportCases} /><SmallStat label="Projects" value={institution.implementationProjects} /><SmallStat label="Students" value={institution.students} /></div>{utilization !== null && <div className="mt-4"><div className="flex items-center justify-between text-[10px]"><span className="font-bold text-[#667085]">Licensed student utilization</span><span className="font-extrabold text-[#344054]">{utilization}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9EEF5]"><div className={`h-full rounded-full ${utilization >= 95 ? 'bg-rose-500' : utilization >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${utilization}%` }} /></div></div>}</button>; })}</div></section></div>;
}

function ActivityView({ data }: { data: CompanyAdminDashboardData }) {
  return <div className="space-y-5"><PageIntro eyebrow="Company audit trail" title="Activity & audit" description="Review account lifecycle, onboarding and contract-management events performed from the CampusOS company control plane." />
    <section className="rounded-[24px] border border-[#DCE4EE] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.04)] sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-base font-extrabold text-[#101D38]">Recent platform administration</p><p className="mt-1 text-xs text-[#7C899B]">Newest events first</p></div><span className="rounded-full border border-[#D8E1EC] bg-[#F8FAFC] px-3 py-1.5 text-[10px] font-bold text-[#667085]">{data.events.length} events loaded</span></div><div className="mt-6 space-y-1">{data.events.map((event, index) => <div key={event.id} className="relative flex gap-4 pb-6"><div className="flex w-10 shrink-0 justify-center"><span className="z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8]"><Activity className="h-4 w-4" /></span>{index < data.events.length - 1 && <span className="absolute bottom-0 left-5 top-9 w-px bg-[#E1E7EF]" />}</div><div className="min-w-0 flex-1 rounded-2xl border border-[#E1E7EF] bg-[#FBFCFE] p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-extrabold text-[#101D38]">{event.summary}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#7C899B]"><span className="font-bold uppercase tracking-wide text-[#526071]">{event.eventType.replaceAll('_', ' ')}</span>{event.institutionName && <span>{event.institutionName}</span>}</div></div><time className="shrink-0 text-[10px] text-[#8A95A6]">{new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(event.createdAt))}</time></div></div></div>)}{data.events.length === 0 && <EmptyState icon={Activity} title="No company-admin events yet" text="Onboarding, lifecycle and contract actions will appear here." />}</div></section></div>;
}

function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <section className="flex flex-col gap-5 rounded-[24px] border border-[#DCE4EE] bg-white p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6"><div className="max-w-[880px]"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8]">{eyebrow}</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] sm:text-3xl">{title}</h2><p className="mt-3 text-sm leading-6 text-[#667085]">{description}</p></div>{action}</section>; }
function MiniMetric({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'blue' | 'rose' | 'amber' | 'slate' }) { const tones = { emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200', blue: 'bg-blue-50 text-blue-700 border-blue-200', rose: 'bg-rose-50 text-rose-700 border-rose-200', amber: 'bg-amber-50 text-amber-700 border-amber-200', slate: 'bg-slate-50 text-slate-700 border-slate-200' }; return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] opacity-75">{label}</p><p className="mt-2 text-2xl font-extrabold">{value.toLocaleString('en-IN')}</p></div>; }
function SmallStat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-[#F7F9FC] p-2.5"><p className="text-[9px] font-bold uppercase tracking-wide text-[#8A95A6]">{label}</p><p className="mt-1 text-sm font-extrabold text-[#344054]">{value.toLocaleString('en-IN')}</p></div>; }
function EmptyState({ icon: Icon, title, text }: { icon: typeof Search; title: string; text: string }) { return <div className="flex flex-col items-center justify-center py-8 text-center"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F5F9] text-[#7C899B]"><Icon className="h-5 w-5" /></span><p className="mt-3 text-sm font-extrabold text-[#344054]">{title}</p><p className="mt-1 max-w-sm text-xs leading-5 text-[#7C899B]">{text}</p></div>; }
