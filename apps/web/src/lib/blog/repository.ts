import type { CommunityPost, User } from '@prisma/client';
import { unstable_noStore as noStore } from 'next/cache';

import { prisma } from '@/lib/db';
import {
  BLOG_STATUSES,
  STARTER_BLOG_POSTS,
  estimateReadingTime,
  parseBlogPayload,
  type BlogPost,
  type BlogStatus,
} from './content';

type BlogRecord = CommunityPost & {
  author: Pick<User, 'name'>;
};

function isBlogStatus(value: string): value is BlogStatus {
  return BLOG_STATUSES.includes(value as BlogStatus);
}

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
  );
}

export function publicBlogTenantId(): string | null {
  const value = process.env.CAMPUSOS_PUBLIC_TENANT_ID?.trim();
  return isUuid(value) ? value : null;
}

export function mapCommunityPostToBlogPost(record: BlogRecord): BlogPost | null {
  const payload = parseBlogPayload(record.content);
  if (!payload || !record.title || !isBlogStatus(record.status)) return null;

  const publishedAt = (record.publishedAt ?? record.createdAt).toISOString();

  return {
    id: record.id,
    slug: payload.slug,
    title: record.title,
    excerpt: payload.excerpt,
    body: payload.body,
    category: payload.category,
    keywords: payload.keywords,
    author: record.author.name,
    publishedAt,
    updatedAt: record.updatedAt.toISOString(),
    readingMinutes: estimateReadingTime(payload.body),
    featured: record.isPinned,
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    canonicalUrl: payload.canonicalUrl,
    coverImageUrl: payload.coverImageUrl,
    coverImageAlt: payload.coverImageAlt,
    noIndex: payload.noIndex,
    status: record.status,
    scheduledAt: record.scheduledAt?.toISOString(),
    source: 'database',
  };
}

function mergePosts(databasePosts: BlogPost[]): BlogPost[] {
  const bySlug = new Map(STARTER_BLOG_POSTS.map((post) => [post.slug, post]));
  for (const post of databasePosts) bySlug.set(post.slug, post);

  return Array.from(bySlug.values())
    .filter((post) => post.status === 'PUBLISHED' && !post.noIndex)
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  noStore();
  const tenantId = publicBlogTenantId();
  if (!tenantId) return mergePosts([]);

  try {
    const records = await prisma.communityPost.findMany({
      where: {
        tenantId,
        type: 'RESOURCE',
        visibility: 'PUBLIC_BLOG',
        status: 'PUBLISHED',
        deletedAt: null,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      include: { author: { select: { name: true } } },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const posts = records
      .map(mapCommunityPostToBlogPost)
      .filter((post): post is BlogPost => Boolean(post));

    return mergePosts(posts);
  } catch (error) {
    console.error('[PUBLIC_BLOG_POSTS]', error);
    return mergePosts([]);
  }
}

export async function getPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getPublishedBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
