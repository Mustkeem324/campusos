'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertTriangle, Bookmark, FileText, Filter, HelpCircle, Loader2, MessageSquare,
  Pin, Search, SlidersHorizontal, TrendingUp, X
} from 'lucide-react';
import { PostCard } from './PostCard';
import { PostComposer } from './PostComposer';
import { CommunityPost } from './community-types';

const TABS = [
  { key: 'all', label: 'All Posts', icon: null },
  { key: 'QUESTION', label: 'Questions', icon: HelpCircle },
  { key: 'ANNOUNCEMENT', label: 'Announcements', icon: Pin },
  { key: 'POLL', label: 'Polls', icon: SlidersHorizontal },
  { key: 'URGENT_NOTICE', label: 'Urgent', icon: AlertTriangle },
  { key: 'IMPORTANT_NOTICE', label: 'Important', icon: null },
  { key: 'EVENT', label: 'Events', icon: null },
  { key: 'RESOURCE', label: 'Media', icon: FileText },
] as const;

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest' },
  { key: 'most_active', label: 'Most Active' },
  { key: 'most_upvoted', label: 'Most Upvoted' },
] as const;

type FeedResponse = { posts: CommunityPost[]; nextOffset: number | null };

export function CommunityFeed() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialType = searchParams.get('type') || 'all';
  const initialSort = searchParams.get('sort') || 'latest';
  const initialQuery = searchParams.get('q') || '';

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState(initialType);
  const [sort, setSort] = useState(initialSort);
  const [query, setQuery] = useState(initialQuery);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async (offset = 0, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type, offset: String(offset), sort });
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/community/posts?${params.toString()}`, { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok || !isFeedResponse(payload)) throw new Error('Unable to load community posts.');
      setPosts((current) => append ? [...current, ...payload.posts] : payload.posts);
      setNextOffset(payload.nextOffset);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to load community posts.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, type, sort]);

  useEffect(() => { void load(); }, [load]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function selectTab(nextType: string) {
    setType(nextType);
    const url = new URL(window.location.href);
    nextType === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', nextType.toLowerCase());
    window.history.replaceState(null, '', url);
  }

  function selectSort(nextSort: string) {
    setSort(nextSort);
    const url = new URL(window.location.href);
    nextSort === 'latest' ? url.searchParams.delete('sort') : url.searchParams.set('sort', nextSort);
    window.history.replaceState(null, '', url);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-2 sm:px-6">
      {/* Page header */}
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav className="text-xs text-text-muted" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1">
              <li><Link href="/" className="hover:text-primary">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li>Campus</li>
              <li aria-hidden="true">/</li>
              <li className="text-text-primary font-medium">Community</li>
            </ol>
          </nav>
          <h1 className="mt-2 text-2xl font-bold text-text-primary">Campus Community</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Ask questions, share resources, post campus updates and collaborate with students, faculty and university teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="#post-composer"
            className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            Create post
          </a>
          <Link
            href="/community/bookmarks"
            className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors inline-flex items-center gap-1.5"
          >
            <Bookmark size={15} /> My bookmarks
          </Link>
          <Link
            href="/legal/terms"
            className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface-muted transition-colors"
          >
            Guidelines
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Community feed filters"
        className="flex gap-1 overflow-x-auto border-b border-border pb-1 scrollbar-hide"
      >
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={type === key}
            onClick={() => selectTab(key)}
            className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors ${
              type === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
            }`}
          >
            {Icon && <Icon size={14} />}
            {label}
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Feed column */}
        <section className="min-w-0 space-y-4">
          {/* Search and sort */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 focus-within:border-primary transition-colors">
              <Search size={16} className="text-text-muted shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
                placeholder="Search posts, topics, hashtags…"
                aria-label="Search community posts"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary" aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sort}
                onChange={(e) => selectSort(e.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                aria-label="Sort posts"
              >
                {SORT_OPTIONS.map(o => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              {(query || type !== 'all' || sort !== 'latest') && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setType('all'); setSort('latest'); }}
                  className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                  aria-label="Clear all filters"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Composer */}
          <div id="post-composer">
            <PostComposer onSuccess={() => void load()} />
          </div>

          {/* Feed content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-surface-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-surface-muted" />
                      <div className="h-3 w-1/4 rounded bg-surface-muted" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-surface-muted" />
                    <div className="h-3 w-full rounded bg-surface-muted" />
                    <div className="h-3 w-4/5 rounded bg-surface-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-text-primary">
              {error}
              <button type="button" onClick={() => void load()} className="ml-3 font-semibold text-primary">Try again</button>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <FileText className="mx-auto text-text-muted" size={40} />
              <h2 className="mt-3 font-semibold text-text-primary">No posts found</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {query ? 'Try a different search term.' : 'Start the first conversation or change your filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onDeleted={() => void load()}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {nextOffset !== null && (
            <button
              type="button"
              onClick={() => void load(nextOffset, true)}
              disabled={loadingMore}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-primary hover:bg-surface-muted disabled:opacity-60 transition-colors"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading…</span>
              ) : 'Load more posts'}
            </button>
          )}
        </section>

        {/* Right sidebar */}
        <aside className="hidden space-y-4 xl:block">
          {/* Trending topics */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 font-semibold text-text-primary">
              <TrendingUp size={16} className="text-primary" /> Trending
            </h2>
            <ul className="mt-3 space-y-2">
              <li className="text-sm">
                <span className="font-medium text-primary">#ExamPrep</span>
                <span className="ml-2 text-xs text-text-muted">12 posts</span>
              </li>
              <li className="text-sm">
                <span className="font-medium text-primary">#CampusLife</span>
                <span className="ml-2 text-xs text-text-muted">8 posts</span>
              </li>
              <li className="text-sm">
                <span className="font-medium text-primary">#Placements</span>
                <span className="ml-2 text-xs text-text-muted">5 posts</span>
              </li>
            </ul>
          </section>

          {/* Unanswered questions */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="flex items-center gap-2 font-semibold text-text-primary">
              <HelpCircle size={16} className="text-violet-600" /> Unanswered
            </h2>
            <p className="mt-3 text-sm text-text-muted">
              Switch to the <button type="button" onClick={() => selectTab('QUESTION')} className="text-primary font-medium hover:underline">Questions</button> tab to find unanswered questions.
            </p>
          </section>

          {/* Community guidelines */}
          <section className="rounded-xl border border-border bg-surface p-4">
            <h2 className="font-semibold text-text-primary">Community guidelines</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-text-secondary leading-relaxed">
              <li>• Be respectful and constructive</li>
              <li>• Protect personal data and privacy</li>
              <li>• Maintain academic integrity</li>
              <li>• Report inappropriate content</li>
            </ul>
            <Link href="/legal/terms" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
              Read full guidelines
            </Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

function isFeedResponse(value: unknown): value is FeedResponse {
  return Boolean(value && typeof value === 'object' && Array.isArray((value as FeedResponse).posts));
}
