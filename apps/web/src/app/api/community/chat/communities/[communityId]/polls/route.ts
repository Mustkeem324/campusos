import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const pollSchema = z.object({
  question: z.string().min(5).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  isMultipleChoice: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  showResultsBeforeVoting: z.boolean().default(false),
  closesAt: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validated = pollSchema.parse(body);

    const service = new CommunityChatService(prisma);
    const result = await service.createPoll(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.communityId,
      {
        question: validated.question ?? '', options: validated.options ?? [],
        isMultipleChoice: validated.isMultipleChoice, isAnonymous: validated.isAnonymous,
        showResultsBeforeVoting: validated.showResultsBeforeVoting,
        closesAt: validated.closesAt ? new Date(validated.closesAt) : undefined,
      }
    );

    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, messageId: result.messageId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    }
    console.error('[CHAT_POLL_CREATE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
