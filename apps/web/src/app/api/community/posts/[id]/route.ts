import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../lib/tenant-context';
import { RoleType } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().max(300).optional(),
  content: z.string().min(1).max(50000).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  commentsEnabled: z.boolean().optional(),
});

const moderatorRoles: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR, RoleType.DEAN, RoleType.HOD];

export async function GET(
  _: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    const id = params.id;

    const post = await db.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        bookmarks: { where: { userId: session.userId }, select: { id: true } },
        votes: { select: { id: true, userId: true, value: true } },
        reactions: { select: { id: true, type: true, userId: true } },
        acknowledgements: { where: { userId: session.userId }, select: { id: true } },
        poll: {
          include: {
            options: {
              include: {
                votes: { select: { id: true, userId: true } },
              },
            },
          },
        },
        _count: { select: { replies: true, reactions: true, votes: true, acknowledgements: true } },
      },
    });

    if (!post || post.deletedAt) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment view count
    await db.communityPost.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const upvotes = (post.votes as Array<{ value: number }>).filter(v => v.value === 1).length;
    const downvotes = (post.votes as Array<{ value: number }>).filter(v => v.value === -1).length;
    const userVote = (post.votes as Array<{ userId: string; value: number }>).find(v => v.userId === session.userId);
    const userReactions = (post.reactions as Array<{ userId: string; type: string }>)
      .filter(r => r.userId === session.userId)
      .map(r => r.type);

    const reactionSummary = (post.reactions as Array<{ type: string }>).reduce(
      (acc: Record<string, number>, r) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      ...post,
      bookmarked: post.bookmarks.length > 0,
      acknowledged: post.acknowledgements.length > 0,
      userVote: userVote ? userVote.value : 0,
      userReactions,
      upvotes,
      downvotes,
      reactionSummary,
      replyCount: post._count.replies,
      reactionCount: post._count.reactions,
      acknowledgementCount: post._count.acknowledgements,
      poll: post.poll ? {
        id: post.poll.id,
        isMultipleChoice: post.poll.isMultipleChoice,
        isAnonymous: post.poll.isAnonymous,
        expiresAt: post.poll.expiresAt,
        totalVotes: (post.poll.options as Array<{ votes: unknown[] }>).reduce((sum, o) => sum + o.votes.length, 0),
        options: (post.poll.options as Array<{ id: string; text: string; votes: Array<{ id: string; userId: string }> }>).map(o => ({
          id: o.id,
          text: o.text,
          voteCount: o.votes.length,
          voted: o.votes.some(v => v.userId === session.userId),
        })),
      } : null,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[COMMUNITY_POST_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    const id = params.id;

    const post = await db.communityPost.findUnique({
      where: { id },
      select: { authorId: true, deletedAt: true },
    });
    if (!post || post.deletedAt) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isModerator = moderatorRoles.includes(session.role);
    const isAuthor = post.authorId === session.userId;

    if (!isAuthor && !isModerator) {
      return NextResponse.json({ error: 'You do not have permission to edit this post' }, { status: 403 });
    }

    const body = await request.json();
    const data = updateSchema.parse(body);

    // Only moderators can pin/lock
    const updateData: Record<string, unknown> = {};
    if (data.content !== undefined && isAuthor) {
      updateData.content = data.content;
      updateData.editedAt = new Date();
    }
    if (data.title !== undefined && isAuthor) updateData.title = data.title;
    if (data.isPinned !== undefined && isModerator) updateData.isPinned = data.isPinned;
    if (data.isLocked !== undefined && isModerator) updateData.isLocked = data.isLocked;
    if (data.commentsEnabled !== undefined && (isAuthor || isModerator)) updateData.commentsEnabled = data.commentsEnabled;

    const updated = await db.communityPost.update({
      where: { id },
      data: updateData,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('[COMMUNITY_POST_PATCH]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    const id = params.id;

    const post = await db.communityPost.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const isModerator = moderatorRoles.includes(session.role);
    if (post.authorId !== session.userId && !isModerator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await db.communityPost.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    console.error('[COMMUNITY_POST_DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
