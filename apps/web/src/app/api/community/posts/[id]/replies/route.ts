import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../../lib/tenant-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const replySchema = z.object({
  content: z.string().min(1, 'Reply content is required').max(10000),
  parentId: z.string().uuid().optional(),
});

export async function GET(_: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db } = await requireTenantContext();
    const postId = params.id;
    const replies = await db.communityReply.findMany({
      where: { postId, deletedAt: null, isHidden: false, parentId: null },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        children: {
          where: { deletedAt: null, isHidden: false },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true, role: true } },
            _count: { select: { reactions: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 5,
        },
        _count: { select: { reactions: true, children: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return NextResponse.json({ replies });
  } catch (error: unknown) {
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Failed to load replies' }, { status });
  }
}

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    const postId = params.id;

    const post = await db.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, commentsEnabled: true, isLocked: true },
    });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (!post.commentsEnabled || post.isLocked) {
      return NextResponse.json({ error: 'Replies are disabled for this post' }, { status: 403 });
    }

    const body = await request.json();
    const data = replySchema.parse(body);

    // Validate parent reply belongs to same post
    if (data.parentId) {
      const parent = await db.communityReply.findFirst({
        where: { id: data.parentId, postId },
        select: { id: true, parentId: true },
      });
      if (!parent) return NextResponse.json({ error: 'Parent reply not found' }, { status: 404 });
      // Max nesting depth of 2
      if (parent.parentId) {
        return NextResponse.json({ error: 'Maximum nesting depth reached' }, { status: 400 });
      }
    }

    const reply = await db.communityReply.create({
      data: {
        postId,
        authorId: session.userId,
        content: data.content,
        parentId: data.parentId || null,
        tenantId: session.tenantId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { reactions: true, children: true } },
      },
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Failed to create reply' }, { status });
  }
}
