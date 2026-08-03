import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { RoleType } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  type: z.enum(['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'POLL', 'URGENT_NOTICE', 'IMPORTANT_NOTICE', 'EVENT', 'RESOURCE']),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  visibility: z.string().default('INSTITUTION'),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  commentsEnabled: z.boolean().default(true),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export async function GET(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q')?.trim();
    const offset = Math.max(0, Number(searchParams.get('offset') || '0'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

    const where = {
      ...(type && type !== 'all' ? { type: type as z.infer<typeof postSchema>['type'] } : {}),
      ...(query ? { OR: [{ title: { contains: query, mode: 'insensitive' as const } }, { content: { contains: query, mode: 'insensitive' as const } }] } : {}),
    };

    const posts = await db.communityPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        bookmarks: { where: { userId: session.userId }, select: { id: true } },
        _count: { select: { replies: true, reactions: true } },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit + 1,
    });
    const hasMore = posts.length > limit;
    return NextResponse.json({ posts: posts.slice(0, limit), nextOffset: hasMore ? offset + limit : null });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    
    // Any authenticated user can create a post, but announcements might need permissions.
    // For now we'll allow all, or if they try to create ANNOUNCEMENT, require role.
    const body = await request.json();
    const validatedData = postSchema.parse(body);

    const restrictedNotice = ['ANNOUNCEMENT', 'URGENT_NOTICE', 'IMPORTANT_NOTICE'].includes(validatedData.type);
    const noticePublisherRoles: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR, RoleType.DEAN, RoleType.HOD];
    const canPublishNotice = noticePublisherRoles.includes(session.role);
    if (restrictedNotice && !canPublishNotice) {
      return NextResponse.json({ error: 'You do not have permission to publish institutional notices.' }, { status: 403 });
    }

    const post = await db.communityPost.create({
      data: {
        type: validatedData.type,
        content: validatedData.content,
        title: validatedData.title,
        visibility: validatedData.visibility,
        isPinned: validatedData.isPinned,
        isLocked: validatedData.isLocked,
        commentsEnabled: validatedData.commentsEnabled,
        expiresAt: validatedData.expiresAt,
        tenantId: session.tenantId,
        authorId: session.userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } }
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
