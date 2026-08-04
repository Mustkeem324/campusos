import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';
import { RoleType } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const postSchema = z.object({
  type: z.enum(['DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'POLL', 'URGENT_NOTICE', 'IMPORTANT_NOTICE', 'EVENT', 'RESOURCE']),
  title: z.string().max(300).optional(),
  content: z.string().min(1, 'Content is required').max(50000),
  visibility: z.string().default('INSTITUTION'),
  isPinned: z.boolean().default(false),
  isLocked: z.boolean().default(false),
  commentsEnabled: z.boolean().default(true),
  expiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
  pollOptions: z.array(z.string().min(1).max(500)).min(2).max(10).optional(),
  pollMultipleChoice: z.boolean().optional(),
  pollAnonymous: z.boolean().optional(),
  pollExpiresAt: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export async function GET(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q')?.trim();
    const sort = searchParams.get('sort') || 'latest';
    const offset = Math.max(0, Number(searchParams.get('offset') || '0'));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));

    const typeFilter = type && type !== 'all'
      ? { type: type.toUpperCase() as z.infer<typeof postSchema>['type'] }
      : {};

    const where = {
      ...typeFilter,
      deletedAt: null,
      status: 'PUBLISHED',
      ...(query ? {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { content: { contains: query, mode: 'insensitive' as const } },
        ],
      } : {}),
    };

    let orderBy: Record<string, string>[] = [{ isPinned: 'desc' }, { createdAt: 'desc' }];
    if (sort === 'most_active') {
      orderBy = [{ isPinned: 'desc' }, { updatedAt: 'desc' }];
    } else if (sort === 'most_upvoted') {
      orderBy = [{ isPinned: 'desc' }, { viewCount: 'desc' }];
    }

    const posts = await db.communityPost.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
        bookmarks: { where: { userId: session.userId }, select: { id: true } },
        votes: { select: { id: true, value: true, userId: true } },
        reactions: {
          select: { id: true, type: true, userId: true },
        },
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
      orderBy,
      skip: offset,
      take: limit + 1,
    });

    const hasMore = posts.length > limit;
    const result = posts.slice(0, limit).map(post => {
      const upvotes = post.votes ? post.votes.filter(v => v.value === 1).length : 0;
      const downvotes = post.votes ? post.votes.filter(v => v.value === -1).length : 0;
      const userVote = post.votes?.find((v) => v.userId === session.userId);
      const userReactions = post.reactions
        .filter((r: { userId: string }) => r.userId === session.userId)
        .map((r: { type: string }) => r.type);

      const reactionSummary = post.reactions.reduce((acc: Record<string, number>, r: { type: string }) => {
        acc[r.type] = (acc[r.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        id: post.id,
        type: post.type,
        title: post.title,
        content: post.content,
        visibility: post.visibility,
        status: post.status,
        isPinned: post.isPinned,
        isLocked: post.isLocked,
        commentsEnabled: post.commentsEnabled,
        viewCount: post.viewCount,
        editedAt: post.editedAt,
        expiresAt: post.expiresAt,
        createdAt: post.createdAt,
        author: post.author,
        bookmarked: post.bookmarks.length > 0,
        acknowledged: post.acknowledgements.length > 0,
        userVote: userVote ? (userVote as { value: number }).value : 0,
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
          totalVotes: post.poll.options.reduce((sum: number, o: { votes: unknown[] }) => sum + o.votes.length, 0),
          options: post.poll.options.map((o: { id: string; text: string; votes: Array<{ id: string; userId: string }> }) => ({
            id: o.id,
            text: o.text,
            voteCount: o.votes.length,
            voted: o.votes.some(v => v.userId === session.userId),
          })),
        } : null,
      };
    });

    return NextResponse.json({ posts: result, nextOffset: hasMore ? offset + limit : null });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[COMMUNITY_FEED_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { db, session } = await requireTenantContext();
    const body = await request.json();
    const validatedData = postSchema.parse(body);

    const restrictedNotice = ['ANNOUNCEMENT', 'URGENT_NOTICE', 'IMPORTANT_NOTICE'].includes(validatedData.type);
    const noticePublisherRoles: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR, RoleType.DEAN, RoleType.HOD];
    const canPublishNotice = noticePublisherRoles.includes(session.role);
    if (restrictedNotice && !canPublishNotice) {
      return NextResponse.json({ error: 'You do not have permission to publish institutional notices.' }, { status: 403 });
    }

    // Faculty can post announcements (course-level)
    if (validatedData.type === 'ANNOUNCEMENT' && session.role === RoleType.FACULTY) {
      // Faculty can post course-level announcements
    }

    const post = await db.communityPost.create({
      data: {
        type: validatedData.type,
        content: validatedData.content,
        title: validatedData.title,
        visibility: validatedData.visibility,
        isPinned: validatedData.isPinned && canPublishNotice,
        isLocked: validatedData.isLocked,
        commentsEnabled: validatedData.commentsEnabled,
        expiresAt: validatedData.expiresAt,
        publishedAt: new Date(),
        status: 'PUBLISHED',
        tenantId: session.tenantId,
        authorId: session.userId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, role: true } },
      },
    });

    // Create poll if applicable
    if (validatedData.type === 'POLL' && validatedData.pollOptions && validatedData.pollOptions.length >= 2) {
      await db.communityPoll.create({
        data: {
          postId: post.id,
          isMultipleChoice: validatedData.pollMultipleChoice ?? false,
          isAnonymous: validatedData.pollAnonymous ?? false,
          expiresAt: validatedData.pollExpiresAt,
          tenantId: session.tenantId,
          options: {
            create: validatedData.pollOptions.map(text => ({ text })),
          },
        },
      });
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[COMMUNITY_POST_CREATE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
