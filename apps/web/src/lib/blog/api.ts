import type { RoleType } from '@prisma/client';
import { z } from 'zod';

import { requireActiveUserContext, type ActiveUserContext } from '@/lib/active-user-context';
import {
  BLOG_STATUSES,
  parseBlogPayload,
  type BlogEditorInput,
  type BlogPost,
  type BlogStatus,
} from './content';
import { mapCommunityPostToBlogPost, publicBlogTenantId } from './repository';

export const BLOG_EDITOR_ROLES: RoleType[] = ['SUPER_ADMIN', 'INSTITUTION_ADMIN'];

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value.length === 0 || /^https?:\/\//.test(value), 'Enter a valid absolute URL')
  .optional()
  .default('');

export const blogEditorSchema = z.object({
  title: z.string().trim().min(10).max(120),
  slug: z.string().trim().min(5).max(90).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().min(70).max(220),
  body: z.string().trim().min(200).max(100_000),
  category: z.string().trim().min(2).max(80),
  keywords: z.array(z.string().trim().min(2).max(80)).min(1).max(12),
  seoTitle: z.string().trim().min(20).max(80),
  seoDescription: z.string().trim().min(70).max(200),
  canonicalUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  coverImageAlt: z.string().trim().max(180).optional().default(''),
  noIndex: z.boolean().default(false),
  featured: z.boolean().default(false),
  status: z.enum(BLOG_STATUSES),
  scheduledAt: z.string().datetime().optional().or(z.literal('')),
  publishedAt: z.string().datetime().optional().or(z.literal('')),
});

export type BlogEditorPayload = z.infer<typeof blogEditorSchema>;

export async function requireBlogEditor(): Promise<ActiveUserContext> {
  const context = await requireActiveUserContext();
  if (!BLOG_EDITOR_ROLES.includes(context.activeRole)) {
    throw new Error('Forbidden: blog editor role required');
  }
  return context;
}

export function normalizeStatusDates(payload: BlogEditorPayload, currentPublishedAt?: Date | null) {
  const now = new Date();
  const scheduledAt = payload.status === 'SCHEDULED' && payload.scheduledAt
    ? new Date(payload.scheduledAt)
    : null;
  const publishedAt = payload.status === 'PUBLISHED'
    ? payload.publishedAt
      ? new Date(payload.publishedAt)
      : currentPublishedAt ?? now
    : currentPublishedAt ?? null;

  return { scheduledAt, publishedAt };
}

export function editorInputFromPayload(payload: BlogEditorPayload): BlogEditorInput {
  return {
    title: payload.title,
    slug: payload.slug,
    excerpt: payload.excerpt,
    body: payload.body,
    category: payload.category,
    keywords: payload.keywords,
    featured: payload.featured,
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    canonicalUrl: payload.canonicalUrl || undefined,
    coverImageUrl: payload.coverImageUrl || undefined,
    coverImageAlt: payload.coverImageAlt || undefined,
    noIndex: payload.noIndex,
    status: payload.status,
    scheduledAt: payload.scheduledAt || undefined,
    publishedAt: payload.publishedAt || undefined,
  };
}

export function isDuplicateSlug(
  slug: string,
  records: Array<{ id: string; content: string }>,
  ignoredId?: string,
): boolean {
  return records.some((record) => {
    if (record.id === ignoredId) return false;
    return parseBlogPayload(record.content)?.slug === slug;
  });
}

export function publicPublishingStatus(tenantId: string) {
  const publicTenantId = publicBlogTenantId();
  return {
    publicPublishingEnabled: Boolean(publicTenantId),
    isPublicTenant: Boolean(publicTenantId && publicTenantId === tenantId),
  };
}

export function mapEditorRecord(record: Parameters<typeof mapCommunityPostToBlogPost>[0]): BlogPost | null {
  return mapCommunityPostToBlogPost(record);
}

export function isBlogStatus(value: string): value is BlogStatus {
  return BLOG_STATUSES.includes(value as BlogStatus);
}
