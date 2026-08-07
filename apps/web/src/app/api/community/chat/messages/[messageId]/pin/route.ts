import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const pinSchema = z.object({ expiresAt: z.string().datetime().optional() });

export async function POST(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = pinSchema.parse(await request.json());
    const message = await prisma.chatMessage.findFirst({ where: { id: params.messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, message.communityId);
    const result = await new CommunityChatService(prisma).togglePin(chatSession, params.messageId, validated.expiresAt ? new Date(validated.expiresAt) : undefined);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
