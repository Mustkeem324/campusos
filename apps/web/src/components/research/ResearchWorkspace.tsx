'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  FlaskConical,
  Loader2,
  Newspaper,
  RefreshCcw,
  Users,
  X,
} from 'lucide-react';

import type {
  ResearchProjectView,
  ResearchWorkspaceView,
} from '@/lib/research-operations-types';

type Notice = { tone: 'success' | 'error' | 'info'; text: string } | null;

async function json<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

const PROJECT_STATUS_TONE: Record<string, string> = {
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
};

export function ResearchWorkspace() {
  const [data, setData] = useState<ResearchWorkspaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [tab, setTab] = useState<'projects' | 'theses' | 'supervised' | 'publications' | 'repository'>('projects');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    const response = await fetch('/api/research/workspace', { cache: 'no-store' });
    if (!response.ok) {
      const body = await json<{ error?: string }>(response);
      setError(body.error ?? 'Unable to load the research workspace.');
      setLoading(false);
      return;
    }
    setData(await json<ResearchWorkspaceView>(response));
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

  async function createProject() {
    if (!newTitle.trim()) return;
    setBusy('create-project');
    const response = await fetch('/api/research/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), researchType: 'STUDENT_PROJECT' }),
    });
    if (!response.ok) {
      const payload = await json<{ error?: string }>(response);
      setNotice({ tone: 'error', text: payload.error ?? 'Unable to create the project.' });
      setBusy(null);
      return;
    }
    setNewTitle('');
    setShowNewProject(false);
    setNotice({ tone: 'success', text: 'Research project created.' });
    await load();
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading research…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
        <p className="font-medium text-rose-700 dark:text-rose-300">{error ?? 'Research workspace unavailable.'}</p>
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
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Research & Projects</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Projects, supervision, theses and research output — server-verified and scope-bound.</p>
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
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
          ['projects', 'Projects', FlaskConical],
          ['theses', 'Theses', BookOpenCheck],
          ['supervised', 'Supervised', Users],
          ['publications', 'Publications', Newspaper],
          ['repository', 'Repository', ArrowRight],
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

      {tab === 'projects' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">My projects</h3>
            <button onClick={() => setShowNewProject((value) => !value)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
              {showNewProject ? 'Cancel' : '+ New project'}
            </button>
          </div>
          {showNewProject && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <label className="text-xs font-medium text-slate-500">Project title</label>
              <div className="mt-1 flex gap-2">
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="e.g. Machine Learning for Crop Yield Prediction"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button onClick={() => void createProject()} disabled={busy !== null || !newTitle.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                  {busy === 'create-project' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </div>
          )}
          {data.myProjects.length === 0 ? (
            <EmptyState title="No projects yet" hint="Create a project to begin your research workflow." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.myProjects.map((project) => <ProjectCard key={project.id} project={project} busy={busy} act={act} />)}
            </div>
          )}
        </section>
      )}

      {tab === 'theses' && (
        <section className="space-y-4">
          {data.myTheses.length === 0 ? (
            <EmptyState title="No thesis records" hint="Thesis lifecycle records will appear here." />
          ) : (
            data.myTheses.map((thesis) => (
              <div key={thesis.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{thesis.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{thesis.versions.length} version(s) submitted</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${PROJECT_STATUS_TONE[thesis.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{thesis.status}</span>
                </div>
                {thesis.similarity.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {thesis.similarity.slice(0, 3).map((check) => (
                      <span key={check.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {check.provider}: {check.similarityScore ?? '—'}% ({check.outcome ?? check.reportStatus})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'supervised' && (
        <section className="space-y-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">Projects under my supervision</h3>
          {data.supervisedProjects.length === 0 ? (
            <EmptyState title="No supervised projects" hint="Projects where you are an assigned supervisor appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {data.supervisedProjects.map((project) => <ProjectCard key={project.id} project={project} busy={busy} act={act} />)}
            </div>
          )}
        </section>
      )}

      {tab === 'publications' && (
        <section className="space-y-3">
          {data.myPublications.length === 0 ? (
            <EmptyState title="No publications yet" hint="Your research output records will appear here." />
          ) : (
            data.myPublications.map((publication) => (
              <div key={publication.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white">{publication.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{publication.publicationType}{publication.venue ? ` • ${publication.venue}` : ''}{publication.year ? ` • ${publication.year}` : ''}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${publication.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{publication.verificationStatus}</span>
              </div>
            ))
          )}
        </section>
      )}

      {tab === 'repository' && (
        <section className="space-y-3">
          {data.repositoryMine.length === 0 ? (
            <EmptyState title="No repository submissions" hint="Approved and pending repository items appear here." />
          ) : (
            data.repositoryMine.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.permanentId} • {item.resourceType}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.accessLevel}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.submissionStatus === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>{item.submissionStatus}</span>
                  </div>
                </div>
                {item.embargo.length > 0 && (
                  <p className="mt-2 text-xs text-slate-400">Embargoed until {item.embargo[0].embargoEnd ?? 'policy release'}</p>
                )}
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function ProjectCard({ project, busy, act }: {
  project: ResearchProjectView;
  busy: string | null;
  act: (url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>, message: string) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-white">{project.title}</h3>
          <p className="mt-1 text-xs text-slate-400">{project.researchType}{project.departmentName ? ` • ${project.departmentName}` : ''}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${PROJECT_STATUS_TONE[project.status] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{project.status}</span>
      </div>
      {project.abstract && <p className="mt-3 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">{project.abstract}</p>}
      <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {project.supervisors.length > 0
          ? project.supervisors.map((supervisor) => (
              <span key={supervisor.id} className="rounded-md bg-sky-50 px-2 py-1 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{supervisor.supervisorName} ({supervisor.role})</span>
            ))
          : <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">No supervisor assigned</span>}
        <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800 dark:text-slate-300">Milestones {project.milestoneSummary.completed}/{project.milestoneSummary.total}</span>
        {project.myRole && <span className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">My role: {project.myRole}</span>}
      </div>
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
