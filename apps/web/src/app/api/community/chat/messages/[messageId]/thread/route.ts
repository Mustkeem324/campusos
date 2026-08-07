import { NextResponse } from 'next/server';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError, secureMessageAttachmentUrls } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { messageId: string } },
) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    const message = await prisma.chatMessage.findFirst({ where: { id: params.messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    await assertStrictAcademicAccess(chatSession, message.communityId);

    const service = new CommunityChatService(prisma);
    const replies = await service.getThreadReplies(chatSession, params.messageId);
    return NextResponse.json(replies.map((reply) => secureMessageAttachmentUrls(reply)), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
