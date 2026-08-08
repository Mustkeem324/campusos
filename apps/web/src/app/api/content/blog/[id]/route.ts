import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import {
  blogEditorSchema,
  editorInputFromPayload,
  isDuplicateSlug,
  mapEditorRecord,
  normalizeStatusDates,
  requireBlogEditor,
} from '@/lib/blog/api';
import { serializeBlogPayload } from '@/lib/blog/content';
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
  console.error('[BLOG_STUDIO_POST]', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(_: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const context = await requireBlogEditor();
    const db = getTenantDb(context.tenantId);
    const record = await db.communityPost.findFirst({
      where: { id: params.id, type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      include: { author: { select: { name: true } } },
    });
    if (!record) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    return NextResponse.json({ post: mapEditorRecord(record) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const context = await requireBlogEditor();
    const db = getTenantDb(context.tenantId);
    const payload = blogEditorSchema.parse(await request.json());
    const current = await db.communityPost.findFirst({
      where: { id: params.id, type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      select: { id: true, publishedAt: true, content: true },
    });
    if (!current) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });

    const existing = await db.communityPost.findMany({
      where: { type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      select: { id: true, content: true },
    });
    if (isDuplicateSlug(payload.slug, existing, params.id)) {
      return NextResponse.json({ error: 'A blog post already uses this slug.' }, { status: 409 });
    }

    const input = editorInputFromPayload(payload);
    const { scheduledAt, publishedAt } = normalizeStatusDates(payload, current.publishedAt);
    await db.communityPost.updateMany({
      where: { id: params.id, type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      data: {
        title: payload.title,
        content: serializeBlogPayload(input),
        status: payload.status,
        isPinned: payload.featured,
        scheduledAt,
        publishedAt,
        editedAt: new Date(),
      },
    });

    const updated = await db.communityPost.findFirst({
      where: { id: params.id, type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      include: { author: { select: { name: true } } },
    });
    if (!updated) return NextResponse.json({ error: 'Blog post not found after update' }, { status: 404 });

    await db.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'UPDATE',
        entity: 'BLOG_POST',
        diffJson: JSON.stringify({ id: params.id, slug: payload.slug, status: payload.status }),
      },
    });

    return NextResponse.json({ post: mapEditorRecord(updated) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const context = await requireBlogEditor();
    const db = getTenantDb(context.tenantId);
    const result = await db.communityPost.updateMany({
      where: { id: params.id, type: 'RESOURCE', visibility: 'PUBLIC_BLOG', deletedAt: null },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    if (result.count === 0) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });

    await db.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'DELETE',
        entity: 'BLOG_POST',
        diffJson: JSON.stringify({ id: params.id }),
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
