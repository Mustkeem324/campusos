import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess } from '@/lib/community-chat-academic';
import { mapCommunityRouteError } from '@/lib/community-chat-route-error';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const pollSchema = z.object({
  question: z.string().min(5).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  isMultipleChoice: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  showResultsBeforeVoting: z.boolean().default(false),
  closesAt: z.string().datetime().optional(),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = pollSchema.parse(await request.json());
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, params.communityId);
    const result = await new CommunityChatService(prisma).createPoll(chatSession, params.communityId, {
      question: validated.question,
      options: validated.options,
      isMultipleChoice: validated.isMultipleChoice,
      isAnonymous: validated.isAnonymous,
      showResultsBeforeVoting: validated.showResultsBeforeVoting,
      closesAt: validated.closesAt ? new Date(validated.closesAt) : undefined,
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ success: true, messageId: result.messageId }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error', details: error.errors }, { status: 400 });
    const failure = mapCommunityRouteError(error, 'POLL_CREATE');
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
