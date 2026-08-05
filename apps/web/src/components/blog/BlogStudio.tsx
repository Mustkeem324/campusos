'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  FilePlus2,
  FileText,
  Import,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react';

import { BlogArticleContent } from '@/components/public/BlogArticleContent';
import {
  BLOG_STATUSES,
  calculateSeoScore,
  slugify,
  type BlogEditorInput,
  type BlogPost,
  type BlogStatus,
} from '@/lib/blog/content';

type BlogStudioProps = {
  activeRole: string;
};

type BlogListResponse = {
  posts: BlogPost[];
  starterCount: number;
  publicPublishingEnabled: boolean;
  isPublicTenant: boolean;
};

type Notice = { type: 'success' | 'error'; message: string } | null;
type EditorTab = 'editor' | 'preview' | 'seo';

const LOCAL_DRAFT_KEY = 'campusos:blog-studio:local-draft-v1';

function emptyPost(): BlogEditorInput {
  return {
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    category: 'Institutional Operations',
    keywords: [],
    featured: false,
    seoTitle: '',
    seoDescription: '',
    canonicalUrl: '',
    coverImageUrl: '',
    coverImageAlt: '',
    noIndex: false,
    status: 'DRAFT',
    scheduledAt: '',
    publishedAt: '',
  };
}

function editorFromPost(post: BlogPost): BlogEditorInput {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    keywords: post.keywords,
    featured: post.featured,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl ?? '',
    coverImageUrl: post.coverImageUrl ?? '',
    coverImageAlt: post.coverImageAlt ?? '',
    noIndex: post.noIndex,
    status: post.status,
    scheduledAt: post.scheduledAt ?? '',
    publishedAt: post.publishedAt,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isBlogPost(value: unknown): value is BlogPost {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.slug === 'string' &&
    typeof value.title === 'string' &&
    typeof value.excerpt === 'string' &&
    typeof value.body === 'string' &&
    typeof value.category === 'string' &&
    Array.isArray(value.keywords) &&
    value.keywords.every((keyword) => typeof keyword === 'string') &&
    typeof value.author === 'string' &&
    typeof value.publishedAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    typeof value.readingMinutes === 'number' &&
    typeof value.featured === 'boolean' &&
    typeof value.seoTitle === 'string' &&
    typeof value.seoDescription === 'string' &&
    typeof value.noIndex === 'boolean' &&
    typeof value.status === 'string' &&
    typeof value.source === 'string'
  );
}

function parseBlogListResponse(value: unknown): BlogListResponse | null {
  if (!isRecord(value) || !Array.isArray(value.posts) || !value.posts.every(isBlogPost)) return null;
  if (
    typeof value.starterCount !== 'number' ||
    typeof value.publicPublishingEnabled !== 'boolean' ||
    typeof value.isPublicTenant !== 'boolean'
  ) {
    return null;
  }
  return {
    posts: value.posts,
    starterCount: value.starterCount,
    publicPublishingEnabled: value.publicPublishingEnabled,
    isPublicTenant: value.isPublicTenant,
  };
}

function responseMessage(value: unknown, fallback: string): string {
  return isRecord(value) && typeof value.error === 'string' ? value.error : fallback;
}

function statusLabel(status: BlogStatus): string {
  return status.toLowerCase().replace('_', ' ').replace(/^./, (letter) => letter.toUpperCase());
}

function statusClasses(status: BlogStatus): string {
  switch (status) {
    case 'PUBLISHED':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'SCHEDULED':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'IN_REVIEW':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'ARCHIVED':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}

function isoForApi(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function dateTimeLocal(value: string | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function BlogStudio({ activeRole }: BlogStudioProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [draft, setDraft] = useState<BlogEditorInput>(emptyPost);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | BlogStatus>('ALL');
  const [tab, setTab] = useState<EditorTab>('editor');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [starterCount, setStarterCount] = useState(20);
  const [publicPublishingEnabled, setPublicPublishingEnabled] = useState(false);
  const [isPublicTenant, setIsPublicTenant] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const seo = useMemo(() => calculateSeoScore(draft), [draft]);

  const filteredPosts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesStatus = statusFilter === 'ALL' || post.status === statusFilter;
      const matchesSearch = !normalized || `${post.title} ${post.slug} ${post.category}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesSearch;
    });
  }, [posts, search, statusFilter]);

  const metrics = useMemo(() => ({
    total: posts.length,
    published: posts.filter((post) => post.status === 'PUBLISHED').length,
    drafts: posts.filter((post) => post.status === 'DRAFT' || post.status === 'IN_REVIEW').length,
    scheduled: posts.filter((post) => post.status === 'SCHEDULED').length,
    averageSeo: posts.length === 0
      ? 0
      : Math.round(posts.reduce((sum, post) => sum + calculateSeoScore(editorFromPost(post)).score, 0) / posts.length),
  }), [posts]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/blog', { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(payload, 'Unable to load blog posts.'));
      const parsed = parseBlogListResponse(payload);
      if (!parsed) throw new Error('The blog service returned an invalid response.');

      setPosts(parsed.posts);
      setStarterCount(parsed.starterCount);
      setPublicPublishingEnabled(parsed.publicPublishingEnabled);
      setIsPublicTenant(parsed.isPublicTenant);
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to load blog posts.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (selectedId) return;
    const stored = window.localStorage.getItem(LOCAL_DRAFT_KEY);
    if (!stored) return;
    try {
      const parsed: unknown = JSON.parse(stored);
      if (isRecord(parsed) && typeof parsed.title === 'string' && typeof parsed.body === 'string') {
        setDraft((current) => ({ ...current, ...parsed }));
      }
    } catch {
      window.localStorage.removeItem(LOCAL_DRAFT_KEY);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draft));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft, selectedId]);

  const savePost = useCallback(async (statusOverride?: BlogStatus) => {
    if (saving) return;
    setSaving(true);
    setNotice(null);
    try {
      const status = statusOverride ?? draft.status;
      const payload = {
        ...draft,
        status,
        slug: slugify(draft.slug || draft.title),
        keywords: draft.keywords.map((keyword) => keyword.trim()).filter(Boolean),
        scheduledAt: status === 'SCHEDULED' ? isoForApi(draft.scheduledAt) : undefined,
        publishedAt: isoForApi(draft.publishedAt),
      };
      const response = await fetch(selectedId ? `/api/content/blog/${selectedId}` : '/api/content/blog', {
        method: selectedId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(result, 'Unable to save the blog post.'));
      if (!isRecord(result) || !isBlogPost(result.post)) throw new Error('The blog service returned an invalid post.');

      const saved = result.post;
      setPosts((current) => {
        const exists = current.some((post) => post.id === saved.id);
        return exists
          ? current.map((post) => post.id === saved.id ? saved : post)
          : [saved, ...current];
      });
      setSelectedId(saved.id);
      setDraft(editorFromPost(saved));
      setSlugTouched(true);
      window.localStorage.removeItem(LOCAL_DRAFT_KEY);
      setNotice({ type: 'success', message: status === 'PUBLISHED' ? 'Article published successfully.' : 'Article saved successfully.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to save the blog post.' });
    } finally {
      setSaving(false);
    }
  }, [draft, saving, selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        void savePost();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [savePost]);

  const selectPost = (post: BlogPost) => {
    setSelectedId(post.id);
    setDraft({ ...editorFromPost(post), scheduledAt: dateTimeLocal(post.scheduledAt) });
    setSlugTouched(true);
    setTab('editor');
    setNotice(null);
  };

  const newPost = () => {
    setSelectedId(null);
    setDraft(emptyPost());
    setSlugTouched(false);
    setTab('editor');
    setNotice(null);
  };

  const updateTitle = (title: string) => {
    setDraft((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : slugify(title),
      seoTitle: current.seoTitle ? current.seoTitle : title.slice(0, 60),
    }));
  };

  const deletePost = async () => {
    if (!selectedId || !window.confirm('Archive and remove this article from the content studio?')) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/content/blog/${selectedId}`, { method: 'DELETE' });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(payload, 'Unable to delete the article.'));
      setPosts((current) => current.filter((post) => post.id !== selectedId));
      newPost();
      setNotice({ type: 'success', message: 'Article archived.' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to delete the article.' });
    } finally {
      setSaving(false);
    }
  };

  const importStarters = async () => {
    setImporting(true);
    setNotice(null);
    try {
      const response = await fetch('/api/content/blog/import-starters', { method: 'POST' });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(responseMessage(payload, 'Unable to import starter articles.'));
      await loadPosts();
      setNotice({ type: 'success', message: `${starterCount} SEO-ready starter articles imported into this tenant.` });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : 'Unable to import starter articles.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-950">
      <header className="border-b border-slate-200 bg-[#0B1731] text-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-5 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              CampusOS content intelligence
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Blog Studio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Create, review, schedule and publish search-ready higher-education content with a built-in SEO quality engine.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300">Role: {activeRole.replaceAll('_', ' ')}</span>
            <Link href="/resources/blog" target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold hover:bg-white/10">
              Public blog <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8">
        {!publicPublishingEnabled || !isPublicTenant ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">Public database publishing is not connected to this tenant.</p>
              <p className="mt-1 leading-6">
                The 20 built-in articles remain public. Set <code className="rounded bg-amber-100 px-1.5 py-0.5">CAMPUSOS_PUBLIC_TENANT_ID</code> to this institution’s tenant ID to publish database-managed articles on the public blog.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span><strong>Public publishing connected.</strong> Published articles from this tenant can appear on the public blog.</span>
          </div>
        )}

        {notice && (
          <div className={`mb-5 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}>
            <span className="flex items-center gap-2">
              {notice.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
              {notice.message}
            </span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="rounded-lg p-1 hover:bg-black/5"><X className="h-4 w-4" /></button>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Blog performance summary">
          <Metric icon={FileText} label="Total articles" value={metrics.total} />
          <Metric icon={Send} label="Published" value={metrics.published} />
          <Metric icon={FilePlus2} label="Draft and review" value={metrics.drafts} />
          <Metric icon={CalendarClock} label="Scheduled" value={metrics.scheduled} />
          <Metric icon={BarChart3} label="Average SEO" value={`${metrics.averageSeo}/100`} />
        </section>

        <div className="mt-6 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">Content library</h2>
                <button type="button" onClick={newPost} className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-bold text-white hover:bg-blue-800">
                  <FilePlus2 className="h-4 w-4" /> New
                </button>
              </div>
              <label className="relative mt-4 block">
                <span className="sr-only">Search blog posts</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search articles" className="min-h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | BlogStatus)} className="mt-3 min-h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-700">
                <option value="ALL">All statuses</option>
                {BLOG_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </div>

            <div className="max-h-[720px] overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading articles</div>
              ) : filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => selectPost(post)}
                    className={`mb-1 w-full rounded-xl border px-3 py-3 text-left transition ${selectedId === post.id ? 'border-blue-300 bg-blue-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{post.title}</p>
                      {post.featured && <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-label="Featured" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusClasses(post.status)}`}>{statusLabel(post.status)}</span>
                      <span className="text-[11px] text-slate-500">SEO {calculateSeoScore(editorFromPost(post)).score}</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-4 py-10 text-center text-sm text-slate-500">No saved articles match this view.</p>
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => void importStarters()}
                disabled={importing}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Import className="h-4 w-4" />}
                Import {starterCount} starter articles
              </button>
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{selectedId ? 'Editing saved article' : 'New editorial draft'}</p>
                <h2 className="mt-1 text-lg font-bold">{draft.title || 'Untitled article'}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(['editor', 'preview', 'seo'] as EditorTab[]).map((item) => (
                  <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-9 rounded-lg px-3 text-xs font-bold capitalize ${tab === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {tab === 'editor' && (
              <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
                <div className="space-y-5">
                  <Field label="Article title" hint={`${draft.title.length}/120`}>
                    <input value={draft.title} onChange={(event) => updateTitle(event.target.value)} placeholder="Write a clear, useful article title" className="field-input" />
                  </Field>
                  <Field label="URL slug" hint={`${draft.slug.length}/90`}>
                    <input
                      value={draft.slug}
                      onChange={(event) => { setSlugTouched(true); setDraft((current) => ({ ...current, slug: slugify(event.target.value) })); }}
                      placeholder="search-friendly-url-slug"
                      className="field-input font-mono text-sm"
                    />
                  </Field>
                  <Field label="Editorial excerpt" hint={`${draft.excerpt.length}/220`}>
                    <textarea value={draft.excerpt} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value, seoDescription: current.seoDescription || event.target.value.slice(0, 160) }))} rows={3} placeholder="Explain what the reader will learn." className="field-input resize-y" />
                  </Field>
                  <Field label="Article body" hint={`${seo.wordCount} words · ${seo.readingMinutes} min read`}>
                    <textarea
                      value={draft.body}
                      onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
                      rows={24}
                      placeholder={'Write in Markdown. Use ## for major sections, - for bullets and [label](/internal-link) for links.'}
                      className="field-input resize-y font-mono text-[13px] leading-6"
                    />
                  </Field>
                </div>

                <div className="space-y-5">
                  <Panel title="Publishing">
                    <Field label="Status">
                      <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as BlogStatus }))} className="field-input">
                        {BLOG_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                      </select>
                    </Field>
                    {draft.status === 'SCHEDULED' && (
                      <Field label="Publish date and time">
                        <input type="datetime-local" value={dateTimeLocal(draft.scheduledAt)} onChange={(event) => setDraft((current) => ({ ...current, scheduledAt: event.target.value }))} className="field-input" />
                      </Field>
                    )}
                    <Field label="Category">
                      <input value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} className="field-input" />
                    </Field>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                      <input type="checkbox" checked={draft.featured} onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300" />
                      <span><strong className="block">Featured article</strong><span className="text-xs text-slate-500">Prioritize this article on the blog homepage.</span></span>
                    </label>
                  </Panel>

                  <Panel title="Search metadata">
                    <Field label="SEO title" hint={`${draft.seoTitle.length}/60`}>
                      <input value={draft.seoTitle} onChange={(event) => setDraft((current) => ({ ...current, seoTitle: event.target.value }))} className="field-input" />
                    </Field>
                    <Field label="Meta description" hint={`${draft.seoDescription.length}/160`}>
                      <textarea value={draft.seoDescription} onChange={(event) => setDraft((current) => ({ ...current, seoDescription: event.target.value }))} rows={4} className="field-input resize-y" />
                    </Field>
                    <Field label="Keywords" hint="Comma separated">
                      <input value={draft.keywords.join(', ')} onChange={(event) => setDraft((current) => ({ ...current, keywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} className="field-input" />
                    </Field>
                    <Field label="Canonical URL" hint="Optional">
                      <input value={draft.canonicalUrl ?? ''} onChange={(event) => setDraft((current) => ({ ...current, canonicalUrl: event.target.value }))} placeholder="https://..." className="field-input" />
                    </Field>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                      <input type="checkbox" checked={draft.noIndex} onChange={(event) => setDraft((current) => ({ ...current, noIndex: event.target.checked }))} className="mt-1 h-4 w-4 rounded border-slate-300" />
                      <span><strong className="block">Prevent search indexing</strong><span className="text-xs text-slate-500">Use only for private, duplicate or temporary content.</span></span>
                    </label>
                  </Panel>
                </div>
              </div>
            )}

            {tab === 'preview' && (
              <div className="p-5 lg:p-8">
                <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white px-6 py-10 shadow-sm sm:px-10">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-700">{draft.category}</p>
                  <h2 className="mt-4 text-4xl font-bold tracking-tight">{draft.title || 'Untitled article'}</h2>
                  <p className="mt-5 text-lg leading-8 text-slate-600">{draft.excerpt || 'Add an editorial excerpt to preview the article introduction.'}</p>
                  <div className="mt-6 flex items-center gap-4 text-sm text-slate-500"><span>CampusOS Editorial Team</span><span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{seo.readingMinutes} min</span></div>
                  <div className="mt-9 border-t border-slate-200 pt-8">
                    {draft.body ? <BlogArticleContent body={draft.body} /> : <p className="text-slate-500">Start writing to see the article preview.</p>}
                  </div>
                </div>
              </div>
            )}

            {tab === 'seo' && (
              <div className="grid gap-6 p-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:p-8">
                <div>
                  <div className="rounded-3xl border border-slate-200 bg-[#0B1731] p-7 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-200">SEO quality score</p>
                    <p className="mt-3 text-6xl font-bold">{seo.score}</p>
                    <p className="mt-2 text-sm text-slate-300">{seo.grade} · {seo.wordCount} words</p>
                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{ width: `${seo.score}%` }} /></div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Search preview</p>
                    <p className="mt-4 truncate text-sm text-emerald-700">campusos · resources · blog · {draft.slug || 'article-slug'}</p>
                    <p className="mt-2 text-xl font-medium text-blue-800">{draft.seoTitle || draft.title || 'SEO title preview'}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{draft.seoDescription || 'Write a focused meta description for search results.'}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200">
                  <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-bold">Optimization checklist</h3></div>
                  <div className="divide-y divide-slate-100">
                    {seo.checks.map((check) => (
                      <div key={check.id} className="flex gap-4 px-5 py-4">
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${check.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {check.passed ? <Check className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{check.label}</p><span className="text-xs font-semibold text-slate-500">{check.points} points</span></div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{check.passed ? 'Ready.' : check.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <RefreshCw className="h-3.5 w-3.5" />
                New drafts are backed up locally. Press Ctrl/⌘ + S to save.
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedId && (
                  <button type="button" onClick={() => void deletePost()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /> Archive
                  </button>
                )}
                <button type="button" onClick={() => void savePost()} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
                <button type="button" onClick={() => void savePost('PUBLISHED')} disabled={saving || seo.score < 50} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50" title={seo.score < 50 ? 'Reach an SEO score of at least 50 before publishing.' : undefined}>
                  <Send className="h-4 w-4" /> Publish
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .field-input {
          min-height: 44px;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(203 213 225);
          background: white;
          padding: 0.7rem 0.85rem;
          color: rgb(15 23 42);
          outline: none;
        }
        .field-input:focus {
          border-color: rgb(29 78 216);
          box-shadow: 0 0 0 4px rgb(219 234 254);
        }
      `}</style>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-600">{label}</p><Icon className="h-5 w-5 text-blue-700" /></div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3"><Settings2 className="h-4 w-4 text-blue-700" /><h3 className="text-sm font-bold">{title}</h3></div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-slate-800"><span>{label}</span>{hint && <span className="text-xs font-medium text-slate-500">{hint}</span>}</span>
      {children}
    </label>
  );
}
