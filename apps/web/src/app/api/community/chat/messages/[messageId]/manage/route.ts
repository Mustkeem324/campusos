import type { RoleType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess, chatHttpError } from '@/lib/community-chat-academic';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const editSchema = z.object({ body: z.string().min(1).max(5000) });
type MessageSession = { userId: string; tenantId: string; role: RoleType };

async function resolve(requestSession: MessageSession, messageId: string) {
  const message = await prisma.chatMessage.findFirst({
    where: { id: messageId, tenantId: requestSession.tenantId, isDeleted: false },
    select: { communityId: true },
  });
  if (!message) return null;
  await assertStrictAcademicAccess(requestSession, message.communityId);
  return message;
}

export async function PATCH(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession: MessageSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    const message = await resolve(chatSession, params.messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    const validated = editSchema.parse(await request.json());
    const result = await new CommunityChatService(prisma).editMessage(chatSession, params.messageId, validated.body);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ success: true, communityId: message.communityId });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}

export async function DELETE(_request: Request, { params }: { params: { messageId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const chatSession: MessageSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    const message = await resolve(chatSession, params.messageId);
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    const result = await new CommunityChatService(prisma).deleteMessage(chatSession, params.messageId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 403 });
    return NextResponse.json({ success: true, communityId: message.communityId });
  } catch (error: unknown) {
    const failure = chatHttpError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
