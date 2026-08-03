'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, FileText, Loader2, Search } from 'lucide-react';
import { PostCard, Post } from './PostCard';
import { PostComposer } from './PostComposer';

const tabs = [
  ['all', 'All posts'], ['QUESTION', 'Questions'], ['ANNOUNCEMENT', 'Announcements'], ['POLL', 'Polls'],
  ['URGENT_NOTICE', 'Urgent notices'], ['IMPORTANT_NOTICE', 'Important notices'], ['EVENT', 'Events'], ['RESOURCE', 'Media'],
] as const;
type FeedResponse = { posts: Post[]; nextOffset: number | null };

export function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [nextOffset, setNextOffset] = useState<number | null>(null);

  const load = useCallback(async (offset = 0, append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type, offset: String(offset) });
      if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/community/posts?${params.toString()}`, { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok || !isFeedResponse(payload)) throw new Error('Unable to load community posts.');
      setPosts((current) => append ? [...current, ...payload.posts] : payload.posts);
      setNextOffset(payload.nextOffset);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Unable to load community posts.'); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [query, type]);

  useEffect(() => { void load(); }, [load]);

  function selectTab(nextType: string) {
    setType(nextType);
    const url = new URL(window.location.href);
    nextType === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', nextType.toLowerCase());
    window.history.replaceState(null, '', url);
  }

  return <main className="mx-auto w-full max-w-7xl space-y-5 py-2">
    <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div><nav className="text-xs text-text-muted" aria-label="Breadcrumb">Home / Campus / Community</nav><h1 className="mt-2 text-2xl font-bold text-text-primary">Campus Community</h1><p className="mt-1 max-w-2xl text-sm text-text-secondary">Ask questions, share resources, post campus updates and collaborate with students, faculty and university teams.</p></div>
      <div className="flex flex-wrap gap-2"><a href="#post-composer" className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Create post</a><Link href="/community/bookmarks" className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary"><Bookmark className="mr-1 inline" size={15}/>My bookmarks</Link><Link href="/legal/terms" className="min-h-10 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary">Guidelines</Link></div>
    </header>
    <div role="tablist" aria-label="Community feed filters" className="flex gap-1 overflow-x-auto border-b border-border pb-1">
      {tabs.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={type === value} onClick={() => selectTab(value)} className={`min-h-10 shrink-0 border-b-2 px-3 text-sm font-medium ${type === value ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>{label}</button>)}
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="min-w-0 space-y-4"><label className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"><Search size={16} className="text-text-muted"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search posts" aria-label="Search community posts"/></label><div id="post-composer"><PostComposer onSuccess={() => void load()} /></div>
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="animate-spin text-primary" aria-label="Loading posts"/></div> : error ? <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-text-primary">{error}<button type="button" onClick={() => void load()} className="ml-3 font-semibold text-primary">Try again</button></div> : posts.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center"><FileText className="mx-auto text-text-muted"/><h2 className="mt-3 font-semibold">No posts found</h2><p className="mt-1 text-sm text-text-secondary">Try another filter or start the first conversation.</p></div> : posts.map((post) => <PostCard key={post.id} post={post} onDeleted={() => void load()} />)}
      {nextOffset !== null && <button type="button" onClick={() => void load(nextOffset, true)} disabled={loadingMore} className="w-full rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60">{loadingMore ? 'Loading…' : 'Load more posts'}</button>}</section>
      <aside className="hidden space-y-4 xl:block"><section className="rounded-xl border border-border bg-surface p-4"><h2 className="font-semibold">Community guidelines</h2><p className="mt-2 text-sm leading-6 text-text-secondary">Be respectful, protect personal data, and report inappropriate content.</p><Link href="/legal/terms" className="mt-3 inline-block text-sm font-semibold text-primary">Read guidelines</Link></section></aside>
    </div>
  </main>;
}

function isFeedResponse(value: unknown): value is FeedResponse { return Boolean(value && typeof value === 'object' && Array.isArray((value as FeedResponse).posts)); }
