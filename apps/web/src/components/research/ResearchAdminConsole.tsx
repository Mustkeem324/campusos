'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  ClipboardCheck,
  FlaskConical,
  Landmark,
  Loader2,
  Newspaper,
  RefreshCcw,
  X,
} from 'lucide-react';

import type { ResearchAdminOverview } from '@/lib/research-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

const STATUS_TONE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  PROPOSED: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  ON_HOLD: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CLOSED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CANCELLED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  ARCHIVED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  REJECTED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

export function ResearchAdminConsole() {
  const [data, setData] = useState<ResearchAdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<'overview' | 'projects' | 'theses' | 'repository' | 'publications' | 'grants'>('overview');

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/research/admin', { cache: 'no-store' });
    if (!response.ok) {
      const body = await json<{ error?: string }>(response);
      setError(body.error ?? 'Unable to load the research console.');
      setLoading(false);
      return;
    }
    setData(await json<ResearchAdminOverview>(response));
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
      setNotice({ tone: 'error', text: payload.error ?? 'The research action could not be completed.' });
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
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading research console…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="font-medium text-rose-700 dark:text-rose-300">{error ?? 'Research console unavailable.'}</p>
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
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Research Administration</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Institution research, thesis, repository and grant oversight.</p>
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
          ['overview', 'Overview', ClipboardCheck],
          ['projects', 'Projects', FlaskConical],
          ['theses', 'Theses', BookOpenCheck],
          ['repository', 'Repository', Landmark],
          ['publications', 'Publications', Newspaper],
          ['grants', 'Grants', Landmark],
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

      {tab === 'overview' && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">Pending reviews</h3>
            {data.pendingReviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No records awaiting a decision.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {data.pendingReviews.map((item) => (
                  <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-slate-700 dark:text-slate-200">{item.title}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.kind}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white">Thesis pipeline</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-slate-500">Registered</span><span className="font-medium text-slate-800 dark:text-slate-200">{data.theses.length}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Approved</span><span className="font-medium text-emerald-600">{data.theses.filter((thesis) => thesis.status === 'APPROVED' || thesis.status === 'PUBLISHED').length}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">In review</span><span className="font-medium text-amber-600">{data.theses.filter((thesis) => thesis.status === 'SIMILARITY_REVIEW' || thesis.status === 'UNDER_EVALUATION' || thesis.status === 'PRE_SUBMISSION').length}</span></li>
              <li className="flex justify-between"><span className="text-slate-500">Repository published</span><span className="font-medium text-slate-800 dark:text-slate-200">{data.repository.filter((item) => item.submissionStatus === 'PUBLISHED').length}</span></li>
            </ul>
          </div>
        </section>
      )}

      {tab === 'projects' && (
        <section className="space-y-3">
          {data.projects.length === 0 ? (
            <EmptyState title="No research projects" hint="Projects across the institution appear here." />
          ) : (
            data.projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{project.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{project.researchType}{project.departmentName ? ` • ${project.departmentName}` : ''} • {project.members.length} member(s)</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_TONE[project.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{project.status}</span>
                </div>
                {project.supervisors.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                    {project.supervisors.map((supervisor) => (
                      <span key={supervisor.id} className="rounded-md bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{supervisor.supervisorName} ({supervisor.role})</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'theses' && (
        <section className="space-y-3">
          {data.theses.length === 0 ? (
            <EmptyState title="No theses" hint="Thesis records across the institution appear here." />
          ) : (
            data.theses.map((thesis) => (
              <div key={thesis.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{thesis.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{thesis.studentName} • {thesis.versions.length} version(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {thesis.similarity.length > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {thesis.similarity[0].similarityScore ?? '—'}% similarity
                      </span>
                    )}
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_TONE[thesis.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{thesis.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'repository' && (
        <section className="space-y-3">
          {data.repository.length === 0 ? (
            <EmptyState title="No repository items" hint="Institutional repository submissions appear here." />
          ) : (
            data.repository.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.permanentId} • {item.resourceType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.accessLevel}</span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${STATUS_TONE[item.submissionStatus] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{item.submissionStatus}</span>
                    {item.submissionStatus === 'PENDING_APPROVAL' && (
                      <div className="flex gap-2">
                        <button onClick={() => void act(`/api/research/repository/${item.id}/review`, 'POST', { decision: 'APPROVE' }, 'Repository item approved.')} disabled={busy !== null} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">Approve</button>
                        <button onClick={() => void act(`/api/research/repository/${item.id}/review`, 'POST', { decision: 'REJECT' }, 'Repository item rejected.')} disabled={busy !== null} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Reject</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'publications' && (
        <section className="space-y-3">
          {data.publications.length === 0 ? (
            <EmptyState title="No publications" hint="Faculty research output appears here." />
          ) : (
            data.publications.map((publication) => (
              <div key={publication.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-white">{publication.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{publication.publicationType}{publication.venue ? ` • ${publication.venue}` : ''}{publication.year ? ` • ${publication.year}` : ''} • <span className={publication.verificationStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-600'}>{publication.verificationStatus}</span></p>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'grants' && (
        <section className="space-y-3">
          {data.grants.length === 0 ? (
            <EmptyState title="No grants" hint="Funded research projects appear here." />
          ) : (
            data.grants.map((grant) => (
              <div key={grant.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{grant.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{grant.fundingAgency} • {grant.grantReference}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">₹{(grant.approvedBudgetMinor / 100).toLocaleString()}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{grant.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <FlaskConical className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
    </div>
  );
}
