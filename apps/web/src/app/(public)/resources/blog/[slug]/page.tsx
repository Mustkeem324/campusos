import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Linkedin,
  Link as LinkIcon,
} from 'lucide-react';

import { BlogArticleContent } from '@/components/public/BlogArticleContent';
import { STARTER_BLOG_POSTS, slugify } from '@/lib/blog/content';
import { getPublishedBlogPost, getPublishedBlogPosts } from '@/lib/blog/repository';
import { absoluteUrl, createPageMetadata, jsonLd } from '@/lib/seo';

export const revalidate = 900;

export function generateStaticParams() {
  return STARTER_BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params: paramsPromise }: { params: Promise<{ slug: string }>; }) {
  const params = await paramsPromise;

  const post = await getPublishedBlogPost(params.slug);
  if (!post) return {};

  return createPageMetadata({
    title: post.seoTitle,
    description: post.seoDescription,
    path: `/resources/blog/${post.slug}`,
    keywords: post.keywords,
    type: 'article',
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    authors: [post.author],
    noIndex: post.noIndex,
    imagePath: post.coverImageUrl || '/opengraph-image',
  });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

function headingsFromBody(body: string) {
  return body
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

export default async function BlogPostPage({ params: paramsPromise }: { params: Promise<{ slug: string }>; }) {
  const params = await paramsPromise;

  const [post, allPosts] = await Promise.all([
    getPublishedBlogPost(params.slug),
    getPublishedBlogPosts(),
  ]);

  if (!post) notFound();

  const related = allPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .sort((left, right) => {
      const leftScore = left.category === post.category ? 2 : left.keywords.some((keyword) => post.keywords.includes(keyword)) ? 1 : 0;
      const rightScore = right.category === post.category ? 2 : right.keywords.some((keyword) => post.keywords.includes(keyword)) ? 1 : 0;
      return rightScore - leftScore;
    })
    .slice(0, 3);

  const canonical = post.canonicalUrl || absoluteUrl(`/resources/blog/${post.slug}`);
  const headings = headingsFromBody(post.body);
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonical}#article`,
    headline: post.title,
    description: post.seoDescription,
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    articleSection: post.category,
    keywords: post.keywords.join(', '),
    wordCount: post.body.split(/\s+/).filter(Boolean).length,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: absoluteUrl('/about'),
    },
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
    image: absoluteUrl(post.coverImageUrl || '/opengraph-image'),
    isAccessibleForFree: true,
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/resources/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd([articleSchema, breadcrumbSchema]) }} />

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8">
          <Link href="/resources/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to insights
          </Link>
        </div>
      </header>

      <main>
        <article>
          <section className="bg-[#0B1731] text-white">
            <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-blue-200">
                <span className="rounded-full border border-blue-200/20 bg-blue-200/10 px-3 py-1.5">{post.category}</span>
                <span>CampusOS insights</span>
              </div>
              <h1 className="mt-7 text-balance text-4xl font-bold tracking-[-0.04em] sm:text-5xl lg:text-6xl lg:leading-[1.06]">
                {post.title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">{post.excerpt}</p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-300">
                <span>{post.author}</span>
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{formatDate(post.publishedAt)}</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" />{post.readingMinutes} min read</span>
              </div>
            </div>
          </section>

          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[240px_minmax(0,760px)_180px] lg:py-16">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">In this article</p>
                <nav className="mt-4 space-y-3" aria-label="Article table of contents">
                  {headings.map((heading) => (
                    <a key={heading} href={`#${slugify(heading)}`} className="block text-sm leading-5 text-slate-600 hover:text-blue-800">
                      {heading}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-9 shadow-sm sm:px-10 sm:py-12">
              <BlogArticleContent body={post.body} />

              <div className="mt-12 border-t border-slate-200 pt-8">
                <p className="text-sm font-bold text-slate-950">Topics covered</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.keywords.map((keyword) => (
                    <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{keyword}</span>
                  ))}
                </div>
              </div>
            </div>

            <aside>
              <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Share</p>
                <div className="mt-4 grid gap-2">
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Linkedin className="h-4 w-4" /> LinkedIn
                  </a>
                  <a
                    href={canonical}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <LinkIcon className="h-4 w-4" /> Article link
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </article>

        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Continue reading</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">Related insights</h2>
              </div>
              <Link href="/resources/blog" className="hidden items-center gap-2 text-sm font-bold text-blue-700 sm:inline-flex">
                View all articles <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {related.map((item) => (
                <article key={item.slug} className="rounded-2xl border border-slate-200 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-700">{item.category}</p>
                  <h3 className="mt-3 text-xl font-bold leading-7">
                    <Link href={`/resources/blog/${item.slug}`} className="hover:text-blue-800">{item.title}</Link>
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>
                  <Link href={`/resources/blog/${item.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                    Read article <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
