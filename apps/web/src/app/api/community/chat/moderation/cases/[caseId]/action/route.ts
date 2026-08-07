import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  actionType: z.enum(['HIDE', 'RESTORE', 'REMOVE', 'WARN', 'LOCK_THREAD', 'MUTE_USER', 'RESTRICT_MEDIA', 'SUSPEND_ACCESS', 'ESCALATE', 'CLOSE_REPORT', 'ADD_NOTE']),
  reason: z.string().min(3).max(1000),
  internalNotes: z.string().max(2000).optional(),
  userMessage: z.string().max(500).optional(),
});

export async function POST(request: Request, { params }: { params: { caseId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = actionSchema.parse(await request.json());
    const modCase = await prisma.chatModerationCase.findFirst({
      where: { id: params.caseId, tenantId: session.tenantId },
      select: { communityId: true },
    });
    if (!modCase) return NextResponse.json({ error: 'Moderation case not found' }, { status: 404 });

    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, modCase.communityId);
    const result = await new CommunityChatService(prisma).takeModerationAction(chatSession, params.caseId, {
      actionType: validated.actionType,
      reason: validated.reason,
      internalNotes: validated.internalNotes,
      userMessage: validated.userMessage,
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
