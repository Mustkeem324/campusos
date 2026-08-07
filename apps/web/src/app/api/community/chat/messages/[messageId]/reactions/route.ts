import { ChatReactionType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const reactionSchema = z.object({ reactionType: z.nativeEnum(ChatReactionType) });

export async function POST(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    const message = await prisma.chatMessage.findFirst({ where: { id: params.messageId, tenantId: session.tenantId, isDeleted: false }, select: { communityId: true } });
    if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    await assertStrictAcademicAccess(chatSession, message.communityId);

    const validated = reactionSchema.parse(await request.json());
    const service = new CommunityChatService(prisma);
    const result = await service.toggleReaction(chatSession, params.messageId, validated.reactionType);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid reaction.' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
