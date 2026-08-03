import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const voteSchema = z.object({ optionIds: z.array(z.string().uuid()).min(1).max(10) });

export async function POST(request: Request, { params }: { params: { pollId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const validated = voteSchema.parse(body);
    const service = new CommunityChatService(prisma);
    const result = await service.votePoll(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.pollId, validated.optionIds
    );
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    console.error('[CHAT_POLL_VOTE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
