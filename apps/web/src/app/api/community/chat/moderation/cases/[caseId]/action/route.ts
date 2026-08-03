import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { CommunityChatService } from '@/lib/community-chat-service';
import { z } from 'zod';

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
    const body = await request.json();
    const validated = actionSchema.parse(body);
    const service = new CommunityChatService(prisma);
    const result = await service.takeModerationAction(
      { userId: session.userId, tenantId: session.tenantId, role: session.role },
      params.caseId, { actionType: validated.actionType ?? 'ADD_NOTE', reason: validated.reason ?? '', internalNotes: validated.internalNotes, userMessage: validated.userMessage }
    );
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    console.error('[CHAT_MOD_ACTION]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
