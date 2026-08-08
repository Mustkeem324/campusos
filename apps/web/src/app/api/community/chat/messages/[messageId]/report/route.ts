import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const reportSchema = z.object({
  reason: z.enum(['SEXUAL_CONTENT', 'HARASSMENT', 'BULLYING', 'HATE_DISCRIMINATION', 'THREAT', 'VIOLENCE', 'SPAM', 'SCAM', 'PRIVACY_VIOLATION', 'IMPERSONATION', 'ACADEMIC_CHEATING', 'COPYRIGHT_VIOLATION', 'INAPPROPRIATE_FILE', 'OTHER']),
  description: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ messageId: string }>; }) {
  const params = await paramsPromise;

  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    const message = await prisma.chatMessage.findFirst({ where: { id: params.messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    await assertStrictAcademicAccess(chatSession, message.communityId);

    const validated = reportSchema.parse(await request.json());
    const service = new CommunityChatService(prisma);
    const result = await service.reportMessage(chatSession, params.messageId, validated.reason, validated.description);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
