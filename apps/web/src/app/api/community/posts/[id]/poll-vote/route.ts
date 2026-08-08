import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../../../lib/tenant-context';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const pollVoteSchema = z.object({
  optionId: z.string().uuid(),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const { db, session } = await requireTenantContext();
    const postId = params.id;

    const post = await db.communityPost.findUnique({
      where: { id: postId },
      select: { id: true, type: true },
    });
    if (!post || post.type !== 'POLL') {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const poll = await db.communityPoll.findUnique({
      where: { postId },
      include: { options: { select: { id: true } } },
    });
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

    // Check expiry
    if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This poll has expired' }, { status: 400 });
    }

    const body = await request.json();
    const data = pollVoteSchema.parse(body);

    // Validate option belongs to this poll
    const validOption = poll.options.some(o => o.id === data.optionId);
    if (!validOption) {
      return NextResponse.json({ error: 'Invalid poll option' }, { status: 400 });
    }

    // Check for existing vote
    const existingVote = await db.communityPollVote.findFirst({
      where: {
        userId: session.userId,
        option: { pollId: poll.id },
      },
    });

    if (existingVote && !poll.isMultipleChoice) {
      // Single choice: update vote
      await db.communityPollVote.delete({ where: { id: existingVote.id } });
    }

    if (existingVote && existingVote.optionId === data.optionId) {
      // Same option: toggle off
      return NextResponse.json({ action: 'removed' });
    }

    await db.communityPollVote.create({
      data: {
        optionId: data.optionId,
        userId: session.userId,
      },
    });

    return NextResponse.json({ action: 'voted' }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    }
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Failed to vote' }, { status });
  }
}
