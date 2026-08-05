'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Clock3,
  Search,
  SearchX,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';

import type { BlogPost } from '@/lib/blog/content';

type BlogExplorerProps = {
  posts: BlogPost[];
  initialSearch?: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function BlogExplorer({ posts, initialSearch = '' }: BlogExplorerProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState('All topics');

  const categories = useMemo(
    () => ['All topics', ...Array.from(new Set(posts.map((post) => post.category))).sort()],
    [posts],
  );

  const visiblePosts = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === 'All topics' || post.category === category;
      const haystack = [post.title, post.excerpt, post.category, post.keywords.join(' ')]
        .join(' ')
        .toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, posts, search]);

  const featured = visiblePosts.find((post) => post.featured) ?? visiblePosts[0];
  const remaining = featured ? visiblePosts.filter((post) => post.slug !== featured.slug) : [];
  const hasFilters = search.trim().length > 0 || category !== 'All topics';

  const clearFilters = () => {
    setSearch('');
    setCategory('All topics');
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-[#0B1731] text-white">
        <div aria-hidden="true" className="absolute -right-24 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute right-20 top-12 h-40 w-40 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 sm:px-8 lg:pb-28 lg:pt-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-blue-100">
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              CampusOS insights
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl lg:leading-[1.06]">
              Practical thinking for modern higher-education operations
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              In-depth guidance on institutional technology, implementation, governance, academic operations and student service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{posts.length} published articles</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">{categories.length - 1} specialist topics</span>
              <Link href="/feed.xml" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white hover:bg-white/10">
                RSS feed
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-7xl px-5 pb-20 sm:px-8">
        <section className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/5 sm:p-5" aria-label="Search blog articles">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.6fr)_auto]">
            <label className="relative block">
              <span className="sr-only">Search articles</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search topics, titles or keywords"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </label>

            <label className="relative block">
              <span className="sr-only">Filter by topic</span>
              <Tag className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm font-medium text-slate-800 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              >
                {categories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </section>

        <div className="mt-10 flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Editorial library</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Latest articles</h2>
          </div>
          <p className="text-sm text-slate-600" aria-live="polite">{visiblePosts.length} result{visiblePosts.length === 1 ? '' : 's'}</p>
        </div>

        {featured ? (
          <>
            <article className="mt-7 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-72 flex-col justify-between bg-[#0F2A55] p-8 text-white sm:p-10">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/20 bg-blue-200/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-blue-100">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Featured insight
                  </div>
                  <p className="mt-8 text-sm font-bold uppercase tracking-[0.12em] text-blue-200">{featured.category}</p>
                </div>
                <div className="mt-12 flex items-center gap-5 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(featured.publishedAt)}</span>
                  <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{featured.readingMinutes} min</span>
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
                <h3 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{featured.title}</h3>
                <p className="mt-5 text-base leading-8 text-slate-600">{featured.excerpt}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {featured.keywords.slice(0, 3).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{keyword}</span>
                  ))}
                </div>
                <Link
                  href={`/resources/blog/${featured.slug}`}
                  className="mt-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                >
                  Read article <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>

            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {remaining.map((post) => <BlogCard key={post.slug} post={post} />)}
            </div>
          </>
        ) : (
          <div className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <SearchX className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
            <h3 className="mt-4 text-xl font-bold text-slate-950">No matching articles</h3>
            <p className="mt-2 text-sm text-slate-600">Try a broader phrase or clear the topic filter.</p>
            <button type="button" onClick={clearFilters} className="mt-6 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800">
              View all articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group flex min-h-[360px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-xl hover:shadow-slate-950/5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{post.category}</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" />{post.readingMinutes} min</span>
      </div>
      <h3 className="mt-5 text-xl font-bold leading-7 tracking-tight text-slate-950 group-hover:text-blue-800">
        <Link href={`/resources/blog/${post.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">{post.title}</Link>
      </h3>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{post.excerpt}</p>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <p className="text-xs text-slate-500">{formatDate(post.publishedAt)} · {post.author}</p>
        <Link href={`/resources/blog/${post.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900">
          Read article <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
