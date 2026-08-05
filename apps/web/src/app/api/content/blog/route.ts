import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  blogEditorSchema,
  editorInputFromPayload,
  isDuplicateSlug,
  mapEditorRecord,
  normalizeStatusDates,
  publicPublishingStatus,
  requireBlogEditor,
} from '@/lib/blog/api';
import { STARTER_BLOG_POSTS, serializeBlogPayload } from '@/lib/blog/content';
import { getTenantDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
  }
  if (error instanceof Error && error.message.startsWith('Forbidden')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error('[BLOG_STUDIO]', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    const context = await requireBlogEditor();
    const db = getTenantDb(context.tenantId);
    const records = await db.communityPost.findMany({
      where: { type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      include: { author: { select: { name: true } } },
      orderBy: [{ updatedAt: 'desc' }],
    });
    const posts = records.map(mapEditorRecord).filter((post) => Boolean(post));

    return NextResponse.json({
      posts,
      starterCount: STARTER_BLOG_POSTS.length,
      ...publicPublishingStatus(context.tenantId),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireBlogEditor();
    const db = getTenantDb(context.tenantId);
    const payload = blogEditorSchema.parse(await request.json());
    const existing = await db.communityPost.findMany({
      where: { type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      select: { id: true, content: true },
    });

    if (isDuplicateSlug(payload.slug, existing)) {
      return NextResponse.json({ error: 'A blog post already uses this slug.' }, { status: 409 });
    }

    const input = editorInputFromPayload(payload);
    const { scheduledAt, publishedAt } = normalizeStatusDates(payload);
    const record = await db.communityPost.create({
      data: {
        tenantId: context.tenantId,
        authorId: context.userId,
        type: 'RESOURCE',
        title: payload.title,
        content: serializeBlogPayload(input),
        visibility: 'PUBLIC_BLOG',
        status: payload.status,
        isPinned: payload.featured,
        commentsEnabled: false,
        scheduledAt,
        publishedAt,
      },
      include: { author: { select: { name: true } } },
    });

    await db.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'CREATE',
        entity: 'BLOG_POST',
        diffJson: JSON.stringify({ id: record.id, slug: payload.slug, status: payload.status }),
      },
    });

    return NextResponse.json({ post: mapEditorRecord(record) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
