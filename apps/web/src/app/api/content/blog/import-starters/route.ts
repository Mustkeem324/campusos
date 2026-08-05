import { NextResponse } from 'next/server';

import { requireBlogEditor } from '@/lib/blog/api';
import {
  STARTER_BLOG_POSTS,
  parseBlogPayload,
  serializeBlogPayload,
  type BlogEditorInput,
} from '@/lib/blog/content';
import { getTenantDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const context = await requireBlogEditor();
    const db = getTenantDb(context.tenantId);
    const existing = await db.communityPost.findMany({
      where: { type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      select: { id: true, content: true },
    });
    const existingBySlug = new Map<string, string>();
    for (const record of existing) {
      const payload = parseBlogPayload(record.content);
      if (payload) existingBySlug.set(payload.slug, record.id);
    }

    let created = 0;
    let updated = 0;

    for (const starter of STARTER_BLOG_POSTS) {
      const input: BlogEditorInput = {
        slug: starter.slug,
        title: starter.title,
        excerpt: starter.excerpt,
        body: starter.body,
        category: starter.category,
        keywords: starter.keywords,
        featured: starter.featured,
        seoTitle: starter.seoTitle,
        seoDescription: starter.seoDescription,
        canonicalUrl: starter.canonicalUrl,
        coverImageUrl: starter.coverImageUrl,
        coverImageAlt: starter.coverImageAlt,
        noIndex: starter.noIndex,
        status: 'PUBLISHED',
        publishedAt: starter.publishedAt,
      };
      const data = {
        title: starter.title,
        content: serializeBlogPayload(input),
        status: 'PUBLISHED',
        isPinned: starter.featured,
        publishedAt: new Date(starter.publishedAt),
        scheduledAt: null,
      };
      const existingId = existingBySlug.get(starter.slug);

      if (existingId) {
        await db.communityPost.updateMany({
          where: { id: existingId, type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
          data,
        });
        updated += 1;
      } else {
        await db.communityPost.create({
          data: {
            tenantId: context.tenantId,
            authorId: context.userId,
            type: 'RESOURCE',
            visibility: 'PUBLIC_BLOG',
            commentsEnabled: false,
            ...data,
          },
        });
        created += 1;
      }
    }

    await db.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'IMPORT',
        entity: 'BLOG_POST',
        diffJson: JSON.stringify({ created, updated, total: STARTER_BLOG_POSTS.length }),
      },
    });

    return NextResponse.json({ created, updated, total: STARTER_BLOG_POSTS.length });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[BLOG_IMPORT_STARTERS]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
