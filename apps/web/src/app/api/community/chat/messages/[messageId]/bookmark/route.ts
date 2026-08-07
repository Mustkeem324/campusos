import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionFromCookies } from '@/lib/auth';
import { assertStrictAcademicAccess } from '@/lib/community-chat-academic';
import { mapCommunityRouteError } from '@/lib/community-chat-route-error';
import { CommunityChatService } from '@/lib/community-chat-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const bookmarkSchema = z.object({ note: z.string().max(500).optional() });

export async function POST(request: Request, { params }: { params: { messageId: string } }) {
  try {
    const session = await getSessionFromCookies();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const validated = bookmarkSchema.parse(await request.json());
    const message = await prisma.chatMessage.findFirst({ where: { id: params.messageId, tenantId: session.tenantId }, select: { communityId: true } });
    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    const chatSession = { userId: session.userId, tenantId: session.tenantId, role: session.role };
    await assertStrictAcademicAccess(chatSession, message.communityId);
    const result = await new CommunityChatService(prisma).toggleBookmark(chatSession, params.messageId, validated.note);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation Error' }, { status: 400 });
    const failure = mapCommunityRouteError(error, 'BOOKMARK_TOGGLE');
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
