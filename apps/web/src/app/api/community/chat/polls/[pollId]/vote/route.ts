import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const voteSchema = z.object({ optionIds: z.array(z.string().uuid()).min(1).max(10) });

export async function POST(request: Request, { params }: { params: { pollId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = voteSchema.parse(await request.json());
    const poll = await prisma.chatPoll.findFirst({ where: { id: params.pollId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, poll.communityId);
    const result = await new CommunityChatService(prisma).votePoll(chatSession, params.pollId, validated.optionIds);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
